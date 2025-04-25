// Script para importar vendas do Gestão Click e associar ao fluxo de caixa
import { PrismaClient } from '@prisma/client';
import { GestaoClickService } from '../app/_services/gestao-click-service';
import { subMonths, format } from 'date-fns';

const prisma = new PrismaClient();

// Configurações
const DEFAULT_MONTHS_BACK = 12; // Importar vendas dos últimos 12 meses por padrão
const BATCH_SIZE = 100; // Tamanho do lote para processamento em massa

// Status mapping
const STATUS_MAP = {
  'CANCELADA': 'CANCELED',
  'PENDENTE': 'PENDING',
  'EM ANDAMENTO': 'PENDING',
  'CONCLUIDA': 'COMPLETED',
  'FINALIZADA': 'COMPLETED',
  'PAGO': 'COMPLETED',
  'RECEBIDO': 'COMPLETED'
};

async function importGestaoClickSales() {
  try {
    console.log('Iniciando importação de vendas do Gestão Click...');
    
    // Pegar todos os usuários com integração ao Gestão Click
    const integrations = await prisma.integrationSettings.findMany({
      where: {
        provider: 'GESTAO_CLICK',
        active: true
      },
      include: {
        user: true
      }
    });
    
    console.log(`Encontradas ${integrations.length} integrações ativas com o Gestão Click`);
    
    // Processar cada integração de usuário
    for (const integration of integrations) {
      const { user, metadata } = integration;
      console.log(`\nProcessando vendas para o usuário: ${user.name || user.email}`);
      
      if (!metadata?.apiKey) {
        console.log(`Usuário ${user.id} não possui API key configurada. Pulando...`);
        continue;
      }
      
      // Iniciar serviço do Gestão Click com a API key do usuário
      const gestaoClickService = new GestaoClickService(metadata.apiKey);
      
      // Definir período para busca de vendas (últimos N meses até hoje)
      const endDate = new Date();
      const startDate = subMonths(endDate, DEFAULT_MONTHS_BACK);
      
      console.log(`Buscando vendas no período: ${format(startDate, 'dd/MM/yyyy')} a ${format(endDate, 'dd/MM/yyyy')}`);
      
      // Obter vendas do período com informações de parcelas
      const sales = await gestaoClickService.getSales(startDate, endDate, {
        includeInstallments: true
      });
      
      console.log(`Encontradas ${sales.length} vendas para o usuário ${user.id}`);
      
      // Obter mapeamento de lojas para carteiras (wallets)
      const walletMapping = await getWalletMapping(user.id);
      
      // Obter ou criar centros de custo baseados nas lojas do Gestão Click
      await processSalesStores(sales, user.id);
      
      // Processar vendas em lotes
      let processedSales = 0;
      let processedInstallments = 0;
      let processedCashFlowEntries = 0;
      
      for (let i = 0; i < sales.length; i += BATCH_SIZE) {
        const batch = sales.slice(i, i + BATCH_SIZE);
        const { salesCount, installmentsCount, entriesCount } = await processSalesBatch(
          batch, 
          user.id, 
          walletMapping
        );
        
        processedSales += salesCount;
        processedInstallments += installmentsCount;
        processedCashFlowEntries += entriesCount;
        
        console.log(`Processadas ${processedSales}/${sales.length} vendas`);
      }
      
      console.log(`\nResultados para usuário ${user.id}:`);
      console.log(`- Vendas processadas: ${processedSales}`);
      console.log(`- Parcelas processadas: ${processedInstallments}`);
      console.log(`- Entradas de fluxo de caixa: ${processedCashFlowEntries}`);
    }
    
    console.log('\nImportação de vendas finalizada com sucesso!');
  } catch (error) {
    console.error('Erro ao importar vendas do Gestão Click:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Processa um lote de vendas, criando ou atualizando registros no banco
 */
async function processSalesBatch(sales, userId, walletMapping) {
  let salesCount = 0;
  let installmentsCount = 0;
  let entriesCount = 0;
  
  // Buscar todos os centros de custo do usuário para associação
  const costCenters = await prisma.costCenter.findMany({
    where: {
      userId,
      active: true
    }
  });
  
  // Criar mapeamento de lojas para centros de custo
  const storeToCostCenterMap = {};
  costCenters.forEach(cc => {
    if (cc.externalId) {
      storeToCostCenterMap[cc.externalId] = cc.id;
    }
  });
  
  // Processar cada venda do lote
  for (const sale of sales) {
    try {
      // Mapear wallet baseado na loja
      const walletId = sale.loja_id && walletMapping[sale.loja_id] 
        ? walletMapping[sale.loja_id] 
        : await getDefaultWallet(userId);
      
      // Verificar se a venda já existe
      const existingSale = await prisma.sales_records.findFirst({
        where: {
          userId,
          externalId: sale.id.toString()
        }
      });
      
      if (existingSale) {
        // Atualizar venda existente
        await prisma.sales_records.update({
          where: { id: existingSale.id },
          data: {
            status: mapStatus(sale.situacao),
            updatedAt: new Date()
          }
        });
        
        // Não vamos duplicar parcelas e entradas de fluxo para vendas existentes
        console.log(`Venda ${sale.id} já existente, apenas status atualizado.`);
        salesCount++;
        continue;
      }
      
      // Criar nova venda
      const newSale = await prisma.sales_records.create({
        data: {
          id: `gs-${userId.substring(0, 8)}-${sale.id}`,
          userId,
          externalId: sale.id.toString(),
          code: sale.codigo || `#${sale.id}`,
          date: new Date(sale.data_venda || sale.data),
          totalAmount: parseFloat(sale.valor_total || sale.valor || 0),
          netAmount: parseFloat(sale.valor_liquido || sale.valor || 0),
          status: mapStatus(sale.situacao),
          customerId: sale.cliente_id ? sale.cliente_id.toString() : null,
          customerName: sale.nome_cliente || sale.cliente?.nome,
          storeId: sale.loja_id ? sale.loja_id.toString() : null,
          storeName: sale.nome_loja || sale.loja?.nome,
          paymentMethod: sale.forma_pagamento || 'OTHER',
          source: 'GESTAO_CLICK',
          metadata: {
            ...sale,
            parcelas: undefined // Removemos para evitar duplicação
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      salesCount++;
      
      // Associar venda ao centro de custo correspondente à loja
      if (sale.loja_id && storeToCostCenterMap[sale.loja_id]) {
        await prisma.sales_cost_center.create({
          data: {
            salesRecordId: newSale.id,
            costCenterId: storeToCostCenterMap[sale.loja_id],
            percentage: 100, // 100% da venda associada a este centro de custo
            createdAt: new Date()
          }
        });
      }
      
      // Processar parcelas, se existirem
      if (sale.parcelas && Array.isArray(sale.parcelas) && sale.parcelas.length > 0) {
        const newInstallments = await processInstallments(sale.parcelas, newSale.id, userId);
        installmentsCount += newInstallments.length;
        
        // Criar entradas no fluxo de caixa para cada parcela
        const newEntries = await createCashFlowEntriesFromInstallments(
          newInstallments, 
          newSale, 
          userId, 
          walletId
        );
        
        entriesCount += newEntries.length;
        
        // Criar relações entre parcelas e transações existentes, se houver
        await linkInstallmentsToTransactions(newInstallments, newSale.id, userId);
      } else {
        // Se não tem parcelas, criar uma entrada direta no fluxo de caixa
        const newEntry = await createSingleCashFlowEntry(newSale, userId, walletId);
        entriesCount += newEntry ? 1 : 0;
        
        // Tentar associar à transação existente
        if (newEntry) {
          await linkCashFlowToTransaction(newEntry, newSale.id, userId);
        }
      }
    } catch (error) {
      console.error(`Erro ao processar venda ${sale.id}:`, error);
    }
  }
  
  return { salesCount, installmentsCount, entriesCount };
}

/**
 * Processa parcelas de uma venda
 */
async function processInstallments(installments, salesRecordId, userId) {
  const createdInstallments = [];
  
  for (const installment of installments) {
    try {
      // Criar parcela
      const newInstallment = await prisma.installments.create({
        data: {
          id: `inst-${salesRecordId}-${installment.numero}`,
          salesRecordId,
          userId,
          externalId: installment.id ? installment.id.toString() : null,
          number: parseInt(installment.numero || '1'),
          amount: parseFloat(installment.valor || 0),
          dueDate: new Date(installment.data_vencimento || installment.vencimento || new Date()),
          paymentDate: installment.data_pagamento ? new Date(installment.data_pagamento) : null,
          status: mapStatus(installment.situacao || installment.status),
          metadata: installment,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      createdInstallments.push(newInstallment);
    } catch (error) {
      console.error(`Erro ao processar parcela ${installment.numero}:`, error);
    }
  }
  
  return createdInstallments;
}

/**
 * Cria entradas no fluxo de caixa a partir de parcelas
 */
async function createCashFlowEntriesFromInstallments(installments, sale, userId, walletId) {
  const createdEntries = [];
  
  for (const installment of installments) {
    try {
      // Criar entrada no fluxo de caixa
      const newEntry = await prisma.cash_flow_entries.create({
        data: {
          id: `cf-inst-${installment.id}`,
          userId,
          walletId,
          description: `Parcela ${installment.number}/${installments.length} - ${sale.customerName || 'Cliente'} - ${sale.code}`,
          type: 'INCOME', // Vendas são sempre receitas
          amount: installment.amount,
          date: installment.dueDate,
          category: 'SALES',
          status: installment.status,
          source: 'GESTAO_CLICK',
          sourceId: sale.externalId,
          installmentId: installment.id,
          metadata: {
            salesRecordId: sale.id,
            installmentNumber: installment.number,
            storeId: sale.storeId,
            storeName: sale.storeName,
            customerId: sale.customerId,
            customerName: sale.customerName
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      createdEntries.push(newEntry);
    } catch (error) {
      console.error(`Erro ao criar entrada de fluxo para parcela ${installment.id}:`, error);
    }
  }
  
  return createdEntries;
}

/**
 * Cria uma única entrada no fluxo de caixa para vendas sem parcelas
 */
async function createSingleCashFlowEntry(sale, userId, walletId) {
  try {
    // Criar entrada no fluxo de caixa
    const newEntry = await prisma.cash_flow_entries.create({
      data: {
        id: `cf-sale-${sale.id}`,
        userId,
        walletId,
        description: `Venda ${sale.code} - ${sale.customerName || 'Cliente'}`,
        type: 'INCOME', // Vendas são sempre receitas
        amount: sale.totalAmount,
        date: sale.date,
        category: 'SALES',
        status: sale.status,
        source: 'GESTAO_CLICK',
        sourceId: sale.externalId,
        metadata: {
          salesRecordId: sale.id,
          storeId: sale.storeId,
          storeName: sale.storeName,
          customerId: sale.customerId,
          customerName: sale.customerName
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return newEntry;
  } catch (error) {
    console.error(`Erro ao criar entrada de fluxo para venda ${sale.id}:`, error);
    return null;
  }
}

/**
 * Obtém ou cria centros de custo baseados nas lojas do Gestão Click
 */
async function processSalesStores(sales, userId) {
  try {
    // Extrair todas as lojas únicas das vendas
    const storeMap = {};
    
    for (const sale of sales) {
      if (sale.loja_id && sale.nome_loja) {
        storeMap[sale.loja_id] = sale.nome_loja;
      }
    }
    
    const storeIds = Object.keys(storeMap);
    console.log(`Encontradas ${storeIds.length} lojas únicas nas vendas`);
    
    // Verificar centros de custo existentes
    const existingCostCenters = await prisma.costCenter.findMany({
      where: {
        userId,
        externalId: {
          in: storeIds
        }
      }
    });
    
    const existingIds = new Set(existingCostCenters.map(cc => cc.externalId));
    let createdCount = 0;
    
    // Criar novos centros de custo para lojas não mapeadas
    for (const storeId of storeIds) {
      if (!existingIds.has(storeId)) {
        await prisma.costCenter.create({
          data: {
            name: storeMap[storeId] || `Loja ${storeId}`,
            description: `Centro de custo automaticamente criado para loja ${storeId} do Gestão Click`,
            code: `GC-${storeId}`,
            externalId: storeId,
            active: true,
            userId,
            metadata: {
              source: 'GESTAO_CLICK',
              storeId
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        createdCount++;
      }
    }
    
    console.log(`${createdCount} novos centros de custo criados para lojas`);
    return createdCount;
  } catch (error) {
    console.error('Erro ao processar lojas/centros de custo:', error);
    return 0;
  }
}

/**
 * Obtém mapeamento de lojas do Gestão Click para carteiras
 */
async function getWalletMapping(userId) {
  try {
    // Buscar todas as carteiras do usuário que têm metadata de loja do Gestão Click
    const wallets = await prisma.wallet.findMany({
      where: {
        userId,
        metadata: {
          path: ['gestaoClickStoreId'],
          not: null
        }
      }
    });
    
    // Criar mapeamento de loja para carteira
    const mapping = {};
    
    wallets.forEach(wallet => {
      if (wallet.metadata?.gestaoClickStoreId) {
        mapping[wallet.metadata.gestaoClickStoreId] = wallet.id;
      }
    });
    
    return mapping;
  } catch (error) {
    console.error('Erro ao obter mapeamento de carteiras:', error);
    return {};
  }
}

/**
 * Obtém carteira padrão do usuário
 */
async function getDefaultWallet(userId) {
  try {
    // Buscar carteira atual do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentWalletId: true }
    });
    
    if (user?.currentWalletId) {
      return user.currentWalletId;
    }
    
    // Se não tem carteira atual, pegar a primeira ativa
    const firstWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        isActive: true
      }
    });
    
    return firstWallet?.id || null;
  } catch (error) {
    console.error('Erro ao obter carteira padrão:', error);
    return null;
  }
}

/**
 * Mapeia status do Gestão Click para nosso formato
 */
function mapStatus(status) {
  if (!status) return 'PENDING';
  
  const normalizedStatus = status.toUpperCase().trim();
  return STATUS_MAP[normalizedStatus] || 'PENDING';
}

/**
 * Tenta associar uma parcela a uma transação existente
 */
async function linkInstallmentsToTransactions(installments, salesRecordId, userId) {
  for (const installment of installments) {
    try {
      // Buscar transações próximas à data de vencimento e com valor similar
      const matchingTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          type: 'INCOME',
          amount: {
            gte: installment.amount * 0.95, // 5% de tolerância para baixo
            lte: installment.amount * 1.05  // 5% de tolerância para cima
          },
          date: {
            gte: new Date(installment.dueDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 dias antes
            lte: new Date(installment.dueDate.getTime() + 5 * 24 * 60 * 60 * 1000)  // 5 dias depois
          }
        },
        take: 1 // Pegar apenas a transação mais próxima
      });
      
      if (matchingTransactions.length > 0) {
        const transaction = matchingTransactions[0];
        
        // Verificar se já existe associação
        const existingLink = await prisma.sales_transaction.findFirst({
          where: {
            transactionId: transaction.id,
            salesRecordId
          }
        });
        
        if (!existingLink) {
          // Criar associação
          await prisma.sales_transaction.create({
            data: {
              salesRecordId,
              transactionId: transaction.id,
              installmentId: installment.id,
              createdAt: new Date(),
              metadata: {
                reconciliationDate: new Date().toISOString()
              }
            }
          });
          
          console.log(`Parcela ${installment.id} associada à transação ${transaction.id}`);
        }
      }
    } catch (error) {
      console.error(`Erro ao associar parcela ${installment.id} a transações:`, error);
    }
  }
}

/**
 * Tenta associar uma entrada de fluxo de caixa a uma transação existente
 */
async function linkCashFlowToTransaction(cashFlowEntry, salesRecordId, userId) {
  try {
    // Buscar transações próximas à data e com valor similar
    const matchingTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'INCOME',
        amount: {
          gte: parseFloat(cashFlowEntry.amount) * 0.95, // 5% de tolerância para baixo
          lte: parseFloat(cashFlowEntry.amount) * 1.05  // 5% de tolerância para cima
        },
        date: {
          gte: new Date(cashFlowEntry.date.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 dias antes
          lte: new Date(cashFlowEntry.date.getTime() + 5 * 24 * 60 * 60 * 1000)  // 5 dias depois
        }
      },
      take: 1 // Pegar apenas a transação mais próxima
    });
    
    if (matchingTransactions.length > 0) {
      const transaction = matchingTransactions[0];
      
      // Verificar se já existe associação
      const existingLink = await prisma.sales_transaction.findFirst({
        where: {
          transactionId: transaction.id,
          salesRecordId
        }
      });
      
      if (!existingLink) {
        // Criar associação
        await prisma.sales_transaction.create({
          data: {
            salesRecordId,
            transactionId: transaction.id,
            createdAt: new Date(),
            metadata: {
              reconciliationDate: new Date().toISOString()
            }
          }
        });
        
        console.log(`Entrada de fluxo ${cashFlowEntry.id} associada à transação ${transaction.id}`);
      }
    }
  } catch (error) {
    console.error(`Erro ao associar entrada de fluxo ${cashFlowEntry.id} a transações:`, error);
  }
}

// Executar o script
importGestaoClickSales(); 