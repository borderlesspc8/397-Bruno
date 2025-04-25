/**
 * Script para sanitização do banco de dados - Remove registros duplicados
 * 
 * Execução: npm run cleanup-js -- userId=USER_ID
 * 
 * Exemplo: npm run cleanup-js -- userId=clg8zep3g0003gta6h4t7g2kv
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parâmetros da linha de comando
const args = process.argv.slice(2);
const params = {};

// Processar argumentos
args.forEach(arg => {
  const [key, value] = arg.split('=');
  if (key && value) {
    params[key] = value;
  }
});

// Verificar se o userId foi fornecido
if (!params.userId) {
  console.error('\x1b[31m%s\x1b[0m', 'ERRO: userId é obrigatório');
  console.log('Uso: npm run cleanup-js -- userId=USER_ID');
  process.exit(1);
}

const userId = params.userId;
const dryRun = params.dryRun === 'true';

if (dryRun) {
  console.log('\x1b[33m%s\x1b[0m', '🔍 MODO SIMULAÇÃO: Nenhuma alteração será realizada no banco de dados');
} else {
  console.log('\x1b[31m%s\x1b[0m', '⚠️ ATENÇÃO: Este script fará alterações permanentes no banco de dados!');
  console.log('\x1b[31m%s\x1b[0m', '💡 Para simular sem fazer alterações, use: npm run cleanup-js -- userId=USER_ID dryRun=true');
  console.log('\x1b[33m%s\x1b[0m', 'Aguardando 5 segundos... Pressione Ctrl+C para cancelar');
  
  // Esperar 5 segundos para permitir cancelamento
  await new Promise(resolve => setTimeout(resolve, 5000));
}

console.log('\x1b[34m%s\x1b[0m', `Iniciando sanitização para usuário: ${userId}`);

/**
 * Função para extrair o externalId do metadata
 */
function getExternalId(tx) {
  try {
    if (!tx.metadata) return null;
    
    // Verificar os possíveis caminhos para o ID
    const metadata = tx.metadata;
    const sourceExternalId = metadata.source?.externalId;
    
    if (sourceExternalId) {
      return sourceExternalId.toString();
    }
    
    const originalId = metadata.original?.id;
    if (originalId) {
      return originalId.toString();
    }
    
    const sourceDataId = metadata.source?.data?.id;
    if (sourceDataId) {
      return sourceDataId.toString();
    }
    
    return null;
  } catch (e) {
    console.error("Erro ao extrair externalId:", e);
    return null;
  }
}

/**
 * Função para remover carteiras duplicadas
 */
async function cleanupDuplicateWallets() {
  console.log('\x1b[36m%s\x1b[0m', '🧹 Iniciando limpeza de carteiras duplicadas...');
  
  // Resultado da operação
  const result = {
    removidas: 0,
    preservadas: 0,
    detalhes: []
  };
  
  // 1. Buscar todas as carteiras do tipo GESTAO_CLICK
  const wallets = await prisma.wallet.findMany({
    where: {
      userId,
      type: "GESTAO_CLICK",
    },
    orderBy: {
      createdAt: 'asc' // As mais antigas primeiro (vamos preservar as mais recentes)
    },
    include: {
      _count: {
        select: {
          transactions: true,
        }
      }
    }
  });
  
  console.log(`Encontradas ${wallets.length} carteiras do tipo GESTAO_CLICK`);
  
  if (wallets.length <= 1) {
    console.log("Nenhuma duplicata detectada para carteiras.");
    return result;
  }
  
  // 2. Agrupar por nome para identificar duplicatas
  const walletsByName = new Map();
  
  for (const wallet of wallets) {
    const name = wallet.name.trim().toLowerCase();
    if (!walletsByName.has(name)) {
      walletsByName.set(name, []);
    }
    walletsByName.get(name).push(wallet);
  }
  
  // 3. Processar cada grupo de carteiras com o mesmo nome
  for (const [name, duplicates] of walletsByName.entries()) {
    if (duplicates.length <= 1) {
      result.preservadas++;
      continue; // Não é duplicata
    }
    
    console.log(`Encontradas ${duplicates.length} carteiras com o nome: ${name}`);
    
    // Ordenar por quantidade de transações (decrescente) e então por data (mais recente primeiro)
    duplicates.sort((a, b) => {
      // Primeiro critério: mais transações
      if (b._count.transactions !== a._count.transactions) {
        return b._count.transactions - a._count.transactions;
      }
      // Segundo critério: mais recente
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // A primeira carteira será preservada
    const keepWallet = duplicates[0];
    result.preservadas++;
    
    console.log(`\x1b[32m%s\x1b[0m`, `✅ Preservando carteira: ${keepWallet.id} (${keepWallet.name}) - ${keepWallet._count.transactions} transações`);
    
    // Todas as outras serão removidas
    const removeWallets = duplicates.slice(1);
    
    for (const wallet of removeWallets) {
      try {
        console.log(`\x1b[33m%s\x1b[0m`, `🗑️ Removendo carteira duplicada: ${wallet.id} (${wallet.name}) - ${wallet._count.transactions} transações`);
        
        if (!dryRun) {
          // Buscar todas as transações desta carteira
          const transactions = await prisma.transaction.findMany({
            where: { walletId: wallet.id },
            select: { id: true }
          });
          
          console.log(`Transferindo ${transactions.length} transações para a carteira principal: ${keepWallet.id}`);
          
          // Transferir transações para a carteira que será mantida
          await prisma.transaction.updateMany({
            where: { walletId: wallet.id },
            data: { walletId: keepWallet.id }
          });
          
          // Remover a carteira duplicada
          await prisma.wallet.delete({
            where: { id: wallet.id }
          });
        }
        
        result.removidas++;
        result.detalhes.push({
          acao: "removida",
          id: wallet.id,
          nome: wallet.name,
          transacoes: wallet._count.transactions,
          destinoId: keepWallet.id,
          destinoNome: keepWallet.name
        });
        
        console.log(`${dryRun ? '[SIMULAÇÃO]' : ''} Carteira processada com sucesso: ${wallet.id}`);
      } catch (error) {
        console.error(`\x1b[31m%s\x1b[0m`, `❌ Erro ao remover carteira duplicada ${wallet.id}:`, error);
        result.detalhes.push({
          acao: "erro",
          id: wallet.id,
          nome: wallet.name,
          erro: String(error)
        });
      }
    }
  }
  
  return result;
}

/**
 * Função para remover transações duplicadas
 */
async function cleanupDuplicateTransactions() {
  console.log('\x1b[36m%s\x1b[0m', '🧹 Iniciando limpeza de transações duplicadas...');
  
  // Resultado da operação
  const result = {
    removidas: 0,
    preservadas: 0,
    detalhes: []
  };

  // 1. Buscar todas as transações com source.name = GESTAO_CLICK
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      metadata: {
        path: ['source', 'name'],
        equals: 'GESTAO_CLICK'
      }
    },
    orderBy: {
      createdAt: 'asc' // As mais antigas primeiro
    }
  });
  
  console.log(`Encontradas ${transactions.length} transações do Gestão Click`);
  
  if (transactions.length === 0) {
    return result;
  }
  
  // 2. Agrupar transações pelo externalId
  const transactionsByExternalId = new Map();
  
  for (const tx of transactions) {
    const externalId = getExternalId(tx);
    if (!externalId) {
      result.preservadas++;
      continue; // Não tem ID externo, não podemos determinar se é duplicata
    }
    
    if (!transactionsByExternalId.has(externalId)) {
      transactionsByExternalId.set(externalId, []);
    }
    
    transactionsByExternalId.get(externalId).push(tx);
  }
  
  console.log(`${transactionsByExternalId.size} grupos de transações encontrados por ID externo`);
  
  // 3. Processar cada grupo de transações com o mesmo externalId
  let groupsProcessed = 0;
  for (const [externalId, duplicates] of transactionsByExternalId.entries()) {
    if (duplicates.length <= 1) {
      result.preservadas += duplicates.length;
      continue; // Não é duplicata
    }
    
    groupsProcessed++;
    if (groupsProcessed % 100 === 0) {
      console.log(`Processando grupo ${groupsProcessed}/${transactionsByExternalId.size}...`);
    }
    
    console.log(`Encontradas ${duplicates.length} transações com o ID externo: ${externalId}`);
    
    // Ordenar por data de criação (a mais recente primeiro)
    duplicates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // A primeira transação será preservada (a mais recente)
    const keepTransaction = duplicates[0];
    result.preservadas++;
    
    console.log(`\x1b[32m%s\x1b[0m`, `✅ Preservando transação: ${keepTransaction.id} (${keepTransaction.name}) - ${keepTransaction.amount}`);
    
    // Todas as outras serão removidas
    const removeTransactions = duplicates.slice(1);
    
    // Remover as transações duplicadas
    for (const tx of removeTransactions) {
      try {
        console.log(`\x1b[33m%s\x1b[0m`, `🗑️ Removendo transação duplicada: ${tx.id} (${tx.name}) - ${tx.amount}`);
        
        if (!dryRun) {
          await prisma.transaction.delete({
            where: { id: tx.id }
          });
        }
        
        result.removidas++;
        result.detalhes.push({
          acao: "removida",
          id: tx.id,
          nome: tx.name,
          valor: tx.amount,
          data: tx.date,
          externalId: externalId,
          preservadaId: keepTransaction.id
        });
      } catch (error) {
        console.error(`\x1b[31m%s\x1b[0m`, `❌ Erro ao remover transação duplicada ${tx.id}:`, error);
        result.detalhes.push({
          acao: "erro",
          id: tx.id,
          nome: tx.name,
          erro: String(error)
        });
      }
    }
  }
  
  // 4. Procurar por duplicatas sem externalId (mesmo valor, data e descrição no mesmo wallet)
  console.log('\x1b[36m%s\x1b[0m', '🔍 Buscando por duplicatas sem ID externo...');
  
  // Agrupar transações por 'fingerprint': walletId + date + amount + name
  const transactionsByFingerprint = new Map();
  
  // Considerar apenas transações sem externalId ou aquelas que já foram processadas
  const processedExternalIds = new Set(transactionsByExternalId.keys());
  
  const transactionsWithoutExternalId = transactions.filter(tx => {
    const externalId = getExternalId(tx);
    return !externalId || !processedExternalIds.has(externalId);
  });
  
  console.log(`Analisando ${transactionsWithoutExternalId.length} transações sem ID externo...`);
  
  for (const tx of transactionsWithoutExternalId) {
    // Criar uma impressão digital única da transação
    const date = new Date(tx.date).toISOString().split('T')[0]; // YYYY-MM-DD
    const fingerprint = `${tx.walletId}|${date}|${tx.amount}|${tx.name}`;
    
    if (!transactionsByFingerprint.has(fingerprint)) {
      transactionsByFingerprint.set(fingerprint, []);
    }
    
    transactionsByFingerprint.get(fingerprint).push(tx);
  }
  
  console.log(`${transactionsByFingerprint.size} grupos de transações encontrados por fingerprint`);
  
  // Processar cada grupo de transações com a mesma impressão digital
  groupsProcessed = 0;
  for (const [fingerprint, duplicates] of transactionsByFingerprint.entries()) {
    if (duplicates.length <= 1) {
      result.preservadas += duplicates.length;
      continue; // Não é duplicata
    }
    
    groupsProcessed++;
    if (groupsProcessed % 100 === 0) {
      console.log(`Processando grupo por fingerprint ${groupsProcessed}/${transactionsByFingerprint.size}...`);
    }
    
    console.log(`Encontradas ${duplicates.length} transações com a mesma impressão digital: ${fingerprint}`);
    
    // Ordenar por data de criação (a mais recente primeiro)
    duplicates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // A primeira transação será preservada (a mais recente)
    const keepTransaction = duplicates[0];
    result.preservadas++;
    
    console.log(`\x1b[32m%s\x1b[0m`, `✅ Preservando transação por fingerprint: ${keepTransaction.id} (${keepTransaction.name})`);
    
    // Todas as outras serão removidas
    const removeTransactions = duplicates.slice(1);
    
    // Remover as transações duplicadas
    for (const tx of removeTransactions) {
      try {
        console.log(`\x1b[33m%s\x1b[0m`, `🗑️ Removendo transação duplicada por fingerprint: ${tx.id} (${tx.name})`);
        
        if (!dryRun) {
          await prisma.transaction.delete({
            where: { id: tx.id }
          });
        }
        
        result.removidas++;
        result.detalhes.push({
          acao: "removida_fingerprint",
          id: tx.id,
          nome: tx.name,
          valor: tx.amount,
          data: tx.date,
          fingerprint: fingerprint,
          preservadaId: keepTransaction.id
        });
      } catch (error) {
        console.error(`\x1b[31m%s\x1b[0m`, `❌ Erro ao remover transação duplicada por fingerprint ${tx.id}:`, error);
        result.detalhes.push({
          acao: "erro_fingerprint",
          id: tx.id,
          nome: tx.name,
          erro: String(error)
        });
      }
    }
  }
  
  return result;
}

/**
 * Função principal que executa o script
 */
async function main() {
  try {
    console.log('\x1b[34m%s\x1b[0m', '🚀 Iniciando processo de sanitização do banco de dados');
    
    // 1. Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    
    if (!user) {
      console.error('\x1b[31m%s\x1b[0m', `❌ Usuário não encontrado com ID: ${userId}`);
      process.exit(1);
    }
    
    console.log(`\x1b[32m%s\x1b[0m`, `✅ Usuário encontrado: ${user.email}`);
    
    // 2. Limpar carteiras duplicadas
    console.log('\n\x1b[34m%s\x1b[0m', '📊 ETAPA 1: Limpeza de carteiras duplicadas');
    const walletsResult = await cleanupDuplicateWallets();
    
    console.log('\x1b[32m%s\x1b[0m', `✓ Carteiras processadas: ${walletsResult.removidas} removidas, ${walletsResult.preservadas} preservadas`);
    
    // 3. Limpar transações duplicadas
    console.log('\n\x1b[34m%s\x1b[0m', '📊 ETAPA 2: Limpeza de transações duplicadas');
    const transactionsResult = await cleanupDuplicateTransactions();
    
    console.log('\x1b[32m%s\x1b[0m', `✓ Transações processadas: ${transactionsResult.removidas} removidas, ${transactionsResult.preservadas} preservadas`);
    
    // 4. Resumo final
    console.log('\n\x1b[34m%s\x1b[0m', '📋 RESUMO DA SANITIZAÇÃO:');
    console.log('\x1b[36m%s\x1b[0m', `Carteiras: ${walletsResult.removidas} removidas, ${walletsResult.preservadas} preservadas`);
    console.log('\x1b[36m%s\x1b[0m', `Transações: ${transactionsResult.removidas} removidas, ${transactionsResult.preservadas} preservadas`);
    
    if (dryRun) {
      console.log('\n\x1b[33m%s\x1b[0m', '🔍 SIMULAÇÃO CONCLUÍDA. Nenhuma alteração foi realizada no banco de dados.');
    } else {
      console.log('\n\x1b[32m%s\x1b[0m', '✅ SANITIZAÇÃO CONCLUÍDA COM SUCESSO!');
    }
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Erro durante a sanitização:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\x1b[31m%s\x1b[0m', 'Erro fatal:', error);
    process.exit(1);
  }); 