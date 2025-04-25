// Script para associar transações existentes a centros de custo
import { PrismaClient } from '@prisma/client';
import { differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

// Configurações
const BATCH_SIZE = 100; // Tamanho do lote para processamento

// Categorias que tipicamente estão associadas a centros de custo
const CATEGORIES_WITH_COST_CENTER = [
  'PAYROLL', 'SALARY', 'MARKETING', 'ADVERTISEMENT', 
  'RENT', 'UTILITIES', 'OFFICE_SUPPLIES', 'TAXES',
  'SERVICES', 'MAINTENANCE', 'SOFTWARE', 'HARDWARE',
  'TRAVEL', 'SALES', 'COMMISSION'
];

async function associateTransactionsToCostCenters() {
  try {
    console.log('Iniciando associação de transações a centros de custo...');
    
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    
    console.log(`Encontrados ${users.length} usuários`);
    
    // Processar cada usuário
    for (const user of users) {
      console.log(`\nProcessando transações para o usuário: ${user.name || user.email}`);
      
      // Buscar centros de custo do usuário
      const costCenters = await prisma.costCenter.findMany({
        where: {
          userId: user.id,
          active: true
        }
      });
      
      if (costCenters.length === 0) {
        console.log(`Usuário ${user.id} não possui centros de custo. Pulando...`);
        continue;
      }
      
      console.log(`Encontrados ${costCenters.length} centros de custo para o usuário`);
      
      // Buscar transações sem associação a centros de custo
      const totalTransactions = await prisma.transaction.count({
        where: {
          userId: user.id,
          NOT: {
            id: {
              in: await getTransactionsWithCostCenter(user.id)
            }
          }
        }
      });
      
      console.log(`Encontradas ${totalTransactions} transações sem associação a centros de custo`);
      
      // Processar transações em lotes
      let processed = 0;
      let associated = 0;
      
      for (let skip = 0; skip < totalTransactions; skip += BATCH_SIZE) {
        const transactions = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            NOT: {
              id: {
                in: await getTransactionsWithCostCenter(user.id)
              }
            }
          },
          include: {
            wallet: true,
            categoryObj: true
          },
          orderBy: { date: 'desc' },
          take: BATCH_SIZE,
          skip
        });
        
        // Associar transações a centros de custo
        const result = await processTransactionsBatch(transactions, costCenters, user.id);
        processed += transactions.length;
        associated += result;
        
        console.log(`Processadas ${processed}/${totalTransactions} transações, ${associated} associadas`);
      }
    }
    
    console.log('\nProcesso de associação concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao associar transações a centros de custo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Retorna IDs de transações que já estão associadas a centros de custo
 */
async function getTransactionsWithCostCenter(userId) {
  try {
    // Verificar quais transações já têm centro de custo via metadata
    const transactionsWithMetadata = await prisma.transaction.findMany({
      where: {
        userId,
        metadata: {
          path: ['costCenterId'],
          not: null
        }
      },
      select: { id: true }
    });
    
    // Buscar transações relacionadas a vendas que já estão associadas a centros de custo
    const salesTransactions = await prisma.$queryRaw`
      SELECT st.transaction_id 
      FROM sales_transaction st
      JOIN sales_cost_center scc ON st.sales_record_id = scc.sales_record_id
      JOIN "Transaction" t ON st.transaction_id = t.id
      WHERE t.user_id = ${userId}
    `;
    
    // Combinar resultados
    const metadataIds = transactionsWithMetadata.map(t => t.id);
    const salesIds = salesTransactions.map(st => st.transaction_id);
    
    return [...new Set([...metadataIds, ...salesIds])];
  } catch (error) {
    console.error('Erro ao buscar transações com centro de custo:', error);
    return [];
  }
}

/**
 * Processa um lote de transações para associação a centros de custo
 */
async function processTransactionsBatch(transactions, costCenters, userId) {
  let associated = 0;
  
  // Etapa 1: Associar por carteira
  const walletCostCenterMap = await getWalletCostCenterMap(userId);
  
  // Etapa 2: Associar por vendas relacionadas
  const salesCostCenterMap = await getSalesCostCenterMap(userId);
  
  // Processamento de cada transação
  for (const transaction of transactions) {
    let costCenterId = null;
    let associationType = null;
    
    // Verificar associação por wallet
    if (transaction.walletId && walletCostCenterMap[transaction.walletId]) {
      costCenterId = walletCostCenterMap[transaction.walletId];
      associationType = 'WALLET';
    }
    
    // Verificar associação por venda relacionada
    if (!costCenterId && transaction.id && salesCostCenterMap[transaction.id]) {
      costCenterId = salesCostCenterMap[transaction.id];
      associationType = 'SALES';
    }
    
    // Verificar associação por metadata (código de loja ou centro de custo)
    if (!costCenterId && transaction.metadata) {
      // Verificar código de loja no metadata
      const storeId = transaction.metadata.lojaId || transaction.metadata.storeId;
      if (storeId) {
        const matchingCostCenter = costCenters.find(cc => cc.externalId === storeId.toString());
        if (matchingCostCenter) {
          costCenterId = matchingCostCenter.id;
          associationType = 'METADATA_STORE';
        }
      }
      
      // Verificar nome do fornecedor/cliente
      const entityName = transaction.metadata.fornecedor || 
                        transaction.metadata.cliente || 
                        transaction.metadata.supplierName || 
                        transaction.metadata.customerName;
      
      if (!costCenterId && entityName) {
        const matchingCostCenter = findCostCenterByName(costCenters, entityName);
        if (matchingCostCenter) {
          costCenterId = matchingCostCenter.id;
          associationType = 'METADATA_ENTITY';
        }
      }
    }
    
    // Associar por categoria se for uma categoria típica de centro de custo
    if (!costCenterId && transaction.categoryObj) {
      const category = transaction.categoryObj.name.toUpperCase();
      if (CATEGORIES_WITH_COST_CENTER.includes(category)) {
        // Pegar o centro de custo mais usado para esta categoria
        const mostUsedCostCenter = await getMostUsedCostCenterForCategory(
          userId,
          transaction.categoryObj.id
        );
        
        if (mostUsedCostCenter) {
          costCenterId = mostUsedCostCenter;
          associationType = 'CATEGORY';
        }
      }
    }
    
    // Se encontrou um centro de custo, atualizar a transação
    if (costCenterId) {
      try {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            metadata: {
              ...transaction.metadata,
              costCenterId,
              costCenterAssociationType: associationType,
              costCenterAssociatedAt: new Date().toISOString()
            }
          }
        });
        
        associated++;
      } catch (error) {
        console.error(`Erro ao atualizar transação ${transaction.id}:`, error);
      }
    }
  }
  
  return associated;
}

/**
 * Obtém mapeamento de carteiras para centros de custo
 */
async function getWalletCostCenterMap(userId) {
  try {
    const walletCostCenters = await prisma.costCenterWallet.findMany({
      where: {
        costCenter: {
          userId
        }
      },
      include: {
        costCenter: true
      }
    });
    
    const mapping = {};
    walletCostCenters.forEach(wcm => {
      mapping[wcm.walletId] = wcm.costCenterId;
    });
    
    return mapping;
  } catch (error) {
    console.error('Erro ao obter mapeamento de carteiras para centros de custo:', error);
    return {};
  }
}

/**
 * Obtém mapeamento de transações para centros de custo via vendas relacionadas
 */
async function getSalesCostCenterMap(userId) {
  try {
    const salesCostCenters = await prisma.$queryRaw`
      SELECT st.transaction_id, scc.cost_center_id
      FROM sales_transaction st
      JOIN sales_cost_center scc ON st.sales_record_id = scc.sales_record_id
      JOIN "Transaction" t ON st.transaction_id = t.id
      WHERE t.user_id = ${userId}
    `;
    
    const mapping = {};
    salesCostCenters.forEach(item => {
      mapping[item.transaction_id] = item.cost_center_id;
    });
    
    return mapping;
  } catch (error) {
    console.error('Erro ao obter mapeamento de vendas para centros de custo:', error);
    return {};
  }
}

/**
 * Encontra centro de custo pelo nome (correspondência parcial)
 */
function findCostCenterByName(costCenters, name) {
  if (!name) return null;
  
  const normalizedName = name.toLowerCase().trim();
  
  // Buscar por correspondência exata
  const exactMatch = costCenters.find(cc => 
    cc.name.toLowerCase() === normalizedName
  );
  
  if (exactMatch) return exactMatch.id;
  
  // Buscar por correspondência parcial
  const partialMatch = costCenters.find(cc => 
    normalizedName.includes(cc.name.toLowerCase()) ||
    cc.name.toLowerCase().includes(normalizedName)
  );
  
  return partialMatch ? partialMatch.id : null;
}

/**
 * Obtém o centro de custo mais usado para uma categoria específica
 */
async function getMostUsedCostCenterForCategory(userId, categoryId) {
  try {
    const transactionsWithCostCenter = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        metadata: {
          path: ['costCenterId'],
          not: null
        }
      },
      select: {
        metadata: true
      }
    });
    
    if (transactionsWithCostCenter.length === 0) {
      return null;
    }
    
    // Contar ocorrências de cada centro de custo
    const costCenterCounts = {};
    transactionsWithCostCenter.forEach(tx => {
      const costCenterId = tx.metadata.costCenterId;
      if (costCenterId) {
        costCenterCounts[costCenterId] = (costCenterCounts[costCenterId] || 0) + 1;
      }
    });
    
    // Encontrar o centro de custo mais frequente
    let mostUsedCostCenterId = null;
    let maxCount = 0;
    
    Object.entries(costCenterCounts).forEach(([costCenterId, count]) => {
      if (count > maxCount) {
        mostUsedCostCenterId = costCenterId;
        maxCount = count;
      }
    });
    
    return mostUsedCostCenterId;
  } catch (error) {
    console.error('Erro ao buscar centro de custo mais usado para categoria:', error);
    return null;
  }
}

// Executar o script
associateTransactionsToCostCenters(); 