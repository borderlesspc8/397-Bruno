import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listTransactions() {
  try {
    console.log('Buscando transações nas carteiras Gestão Click...');
    
    // Primeiro encontrar todas as carteiras do tipo Gestão Click
    const wallets = await prisma.wallet.findMany({
      where: {
        OR: [
          { type: "GESTAO_CLICK" },
          { type: "GESTAO_CLICK_COST_CENTER" }
        ]
      },
      select: {
        id: true,
        name: true,
        type: true
      }
    });
    
    console.log(`Encontradas ${wallets.length} carteiras do Gestão Click`);
    
    // Para cada carteira, buscar suas transações
    let totalTransactions = 0;
    
    for (const wallet of wallets) {
      console.log(`\n====== Transações da carteira: ${wallet.name} (${wallet.type}) ======`);
      
      const transactions = await prisma.transaction.findMany({
        where: {
          walletId: wallet.id
        },
        orderBy: {
          date: 'desc'
        },
        include: {
          wallet: true
        }
      });
      
      console.log(`Total de transações: ${transactions.length}`);
      totalTransactions += transactions.length;
      
      if (transactions.length === 0) {
        console.log('Nenhuma transação encontrada para esta carteira.');
        continue;
      }
      
      // Listar as transações
      transactions.forEach((tx, index) => {
        console.log(`\n----- Transação ${index + 1} -----`);
        console.log(`ID: ${tx.id}`);
        console.log(`Nome: ${tx.name}`);
        console.log(`Tipo: ${tx.type}`);
        console.log(`Valor: ${tx.amount}`);
        console.log(`Data: ${tx.date}`);
        console.log(`Categoria: ${tx.category}`);
        
        // Extrair detalhes dos metadados
        if (tx.metadata) {
          console.log('Metadados:');
          const metadata = tx.metadata as any;
          
          if (metadata.source) {
            console.log(`- Fonte: ${metadata.source}`);
          }
          
          if (metadata.gestaoClickId) {
            console.log(`- ID Gestão Click: ${metadata.gestaoClickId}`);
          }
          
          if (metadata.originalDescription) {
            console.log(`- Descrição Original: ${metadata.originalDescription}`);
          }
        }
      });
    }
    
    console.log(`\n===== Resumo =====`);
    console.log(`Total de carteiras Gestão Click: ${wallets.length}`);
    console.log(`Total de transações: ${totalTransactions}`);
  } catch (error) {
    console.error('Erro ao listar transações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar função principal
listTransactions(); 