import { PrismaClient, Transaction, Wallet } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTransactions() {
  try {
    // Buscar o usuário de teste
    const user = await prisma.user.findFirst({
      where: {
        email: {
          contains: "teste_",
          endsWith: "@contarapida.com.br"
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!user) {
      throw new Error('Usuário de teste não encontrado');
    }

    console.log('Usuário encontrado:', {
      id: user.id,
      name: user.name,
      email: user.email
    });

    // Buscar as carteiras do usuário
    const wallets = await prisma.wallet.findMany({
      where: {
        userId: user.id
      }
    });

    console.log(`Encontradas ${wallets.length} carteiras associadas ao usuário.`);

    // Buscar as transações do usuário
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id
      },
      include: {
        wallet: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    console.log(`Encontradas ${transactions.length} transações associadas ao usuário.`);

    // Verificar as transações por carteira
    const transactionsByWallet = new Map<string, Array<any>>();
    transactions.forEach(transaction => {
      const walletId = transaction.walletId || '';
      if (!transactionsByWallet.has(walletId)) {
        transactionsByWallet.set(walletId, []);
      }
      const existingTransactions = transactionsByWallet.get(walletId);
      if (existingTransactions) {
        existingTransactions.push(transaction);
      }
    });

    // Exibir resumo de transações por carteira
    console.log('\n===== Resumo de Transações por Carteira =====');
    for (const wallet of wallets) {
      const walletTransactions = transactionsByWallet.get(wallet.id || '') || [];
      console.log(`- ${wallet.name} (${wallet.type}): ${walletTransactions.length} transações`);
      
      // Calcular totais por tipo de transação
      const incomes = walletTransactions.filter((t: any) => t.type === 'INCOME');
      const expenses = walletTransactions.filter((t: any) => t.type === 'EXPENSE');
      
      const totalIncome = incomes.reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalExpense = expenses.reduce((sum: number, t: any) => sum + t.amount, 0);
      
      console.log(`  • Receitas: ${incomes.length} (R$ ${totalIncome.toFixed(2)})`);
      console.log(`  • Despesas: ${expenses.length} (R$ ${Math.abs(totalExpense).toFixed(2)})`);
      console.log(`  • Saldo calculado: R$ ${(totalIncome + totalExpense).toFixed(2)}`);
      console.log(`  • Saldo na carteira: R$ ${wallet.balance.toFixed(2)}`);
      console.log('');
    }

    // Verificar se os metadados das transações do Gestão Click foram importados corretamente
    const gestaoClickTransactions = transactions.filter((t: any) => 
      t.metadata && 
      typeof t.metadata === 'object' && 
      (t.metadata as any).source === 'GESTAO_CLICK_SIMULATED'
    );

    console.log(`\n===== Transações do Gestão Click =====`);
    console.log(`Total de transações com metadados do Gestão Click: ${gestaoClickTransactions.length}`);

    if (gestaoClickTransactions.length > 0) {
      // Mostrar as 5 transações mais recentes como exemplo
      console.log('\nExemplos das 5 transações mais recentes do Gestão Click:');
      gestaoClickTransactions.slice(0, 5).forEach((t: any, i: number) => {
        console.log(`\n----- Transação ${i + 1} -----`);
        console.log(`ID: ${t.id}`);
        console.log(`Nome: ${t.name}`);
        console.log(`Tipo: ${t.type}`);
        console.log(`Valor: ${t.amount}`);
        console.log(`Data: ${t.date}`);
        console.log(`Carteira: ${t.wallet?.name || 'N/A'}`);
        console.log(`Metadados:`);
        
        const metadata = t.metadata as any;
        Object.entries(metadata).forEach(([key, value]: [string, any]) => {
          console.log(`- ${key}: ${value}`);
        });
      });
    }

    return { wallets, transactions };
  } catch (error) {
    console.error('Erro ao verificar transações:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyTransactions()
  .then(() => console.log('Verificação concluída com sucesso.'))
  .catch(console.error); 