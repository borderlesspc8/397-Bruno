// Script para popular a tabela cash_flow_entries com transações existentes
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function populateCashFlow() {
  try {
    console.log('Iniciando população da tabela de fluxo de caixa...');
    
    // Verificar transações existentes
    const totalTransactions = await prisma.transaction.count();
    console.log(`Total de transações existentes: ${totalTransactions}`);
    
    // Verificar entradas de fluxo de caixa existentes
    const existingEntries = await prisma.cash_flow_entries.count();
    console.log(`Entradas de fluxo de caixa existentes: ${existingEntries}`);
    
    if (existingEntries > 0) {
      console.log('AVISO: Já existem entradas na tabela de fluxo de caixa.');
      const shouldProceed = await confirmAction('Deseja continuar e adicionar novas entradas?');
      if (!shouldProceed) {
        console.log('Operação cancelada pelo usuário.');
        return;
      }
    }
    
    // Buscar todas as transações que ainda não estão no fluxo de caixa
    const transactions = await prisma.transaction.findMany({
      where: {
        NOT: {
          // Verificar se a transação já está mapeada para uma entrada de fluxo de caixa
          id: {
            in: await getExistingTransactionIds()
          }
        }
      },
      include: {
        wallet: true
      }
    });
    
    console.log(`Encontradas ${transactions.length} transações para adicionar ao fluxo de caixa`);
    
    // Criar entradas no fluxo de caixa
    let processed = 0;
    const batchSize = 100; // Processar em lotes para melhor performance
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Criar entradas para cada transação
      const entries = batch.map(transaction => ({
        id: `tx-${transaction.id}`,
        userId: transaction.userId,
        walletId: transaction.walletId,
        description: transaction.name || transaction.description || 'Transação',
        type: transaction.type,
        amount: transaction.amount,
        date: transaction.date,
        category: transaction.category || 'OTHER',
        status: transaction.status || 'COMPLETED',
        source: 'TRANSACTION',
        sourceId: transaction.id,
        transactionId: transaction.id,
        metadata: transaction.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      // Inserir entradas no banco de dados
      const result = await prisma.cash_flow_entries.createMany({
        data: entries,
        skipDuplicates: true
      });
      
      processed += result.count;
      console.log(`Processadas ${processed}/${transactions.length} transações`);
    }
    
    console.log(`Processo concluído. Adicionadas ${processed} entradas ao fluxo de caixa.`);
    
  } catch (error) {
    console.error('Erro ao popular tabela de fluxo de caixa:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Função para obter IDs de transações que já estão no fluxo de caixa
async function getExistingTransactionIds() {
  try {
    const entries = await prisma.cash_flow_entries.findMany({
      where: {
        transactionId: {
          not: null
        }
      },
      select: {
        transactionId: true
      }
    });
    
    return entries.map(entry => entry.transactionId).filter(Boolean);
  } catch (error) {
    console.error('Erro ao obter IDs de transações existentes:', error);
    return [];
  }
}

// Função para simular confirmação do usuário (em produção, você usaria readline)
async function confirmAction(message) {
  console.log(`${message} (S/N)`);
  return true; // Sempre retorna true para fins de script automático
}

// Executar o script
populateCashFlow(); 