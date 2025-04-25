import { PrismaClient, TransactionType, TransactionCategory, TransactionPaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

// Função para gerar uma data aleatória nos últimos 30 dias
function randomDate(start: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: Date = new Date()): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Função para gerar transações simuladas para uma carteira
async function generateTransactionsForWallet(walletId: string, count: number = 10) {
  // Categorias possíveis
  const categories: TransactionCategory[] = ['FOOD', 'TRANSPORTATION', 'HOUSING', 'ENTERTAINMENT', 'HEALTH', 'EDUCATION', 'UTILITY', 'OTHER'];
  
  // Tipos de transação
  const types: TransactionType[] = ['INCOME', 'EXPENSE'];
  
  // Métodos de pagamento
  const paymentMethods: TransactionPaymentMethod[] = ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'PIX', 'OTHER'];
  
  // Obter informações da carteira
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    select: { name: true, type: true }
  });
  
  if (!wallet) {
    console.log(`Carteira ${walletId} não encontrada`);
    return [];
  }
  
  console.log(`Gerando ${count} transações para a carteira ${wallet.name}`);
  
  const transactions = [];
  
  // Gerar transações simuladas
  for (let i = 0; i < count; i++) {
    // Determinar o tipo da transação - mais probabilidade de despesas
    const typeIndex = Math.random() < 0.7 ? 1 : 0;
    const type = types[typeIndex];
    
    // Gerar um valor entre 10 e 1000
    let amount = Math.random() * 990 + 10;
    amount = Math.round(amount * 100) / 100; // Arredondar para 2 casas decimais
    
    // Se for despesa, tornar o valor negativo
    if (type === 'EXPENSE') {
      amount = -amount;
    }
    
    // Gerar uma data aleatória nos últimos 30 dias
    const date = randomDate();
    
    // Escolher uma categoria aleatória
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // Escolher um método de pagamento aleatório
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    // Gerar uma descrição baseada no tipo e categoria
    let name = '';
    if (type === 'INCOME') {
      const incomeNames = ['Salário', 'Freelance', 'Venda', 'Reembolso', 'Investimento', 'Recebimento'];
      name = `${incomeNames[Math.floor(Math.random() * incomeNames.length)]} - ${date.toLocaleDateString('pt-BR')}`;
    } else {
      // Mapeamento simples de nomes para categorias
      const categoryDescriptions: {[key: string]: string[]} = {
        'FOOD': ['Restaurante', 'Supermercado', 'Delivery', 'Café'],
        'TRANSPORTATION': ['Uber', '99', 'Combustível', 'Transporte público', 'Estacionamento'],
        'HOUSING': ['Aluguel', 'Condomínio', 'Conta de luz', 'Conta de água', 'Internet'],
        'ENTERTAINMENT': ['Cinema', 'Netflix', 'Spotify', 'Teatro', 'Show'],
        'HEALTH': ['Farmácia', 'Consulta médica', 'Exames', 'Academia'],
        'EDUCATION': ['Curso', 'Livros', 'Material escolar', 'Mensalidade'],
        'UTILITY': ['Telefone', 'Celular', 'Gás', 'IPTU', 'IPVA'],
        'OTHER': ['Compra online', 'Presente', 'Doação', 'Serviço', 'Taxa']
      };
      
      const names = categoryDescriptions[category] || ['Diversos'];
      name = `${names[Math.floor(Math.random() * names.length)]} - ${date.toLocaleDateString('pt-BR')}`;
    }
    
    // Criar a transação
    const transaction = await prisma.transaction.create({
      data: {
        name,
        type,
        amount,
        date,
        category,
        paymentMethod,
        walletId,
        userId: (await prisma.wallet.findUnique({ where: { id: walletId }, select: { userId: true } }))?.userId || '',
        metadata: {
          source: 'GESTAO_CLICK_SIMULATED',
          gestaoClickId: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          originalDescription: name,
          importedAt: new Date().toISOString()
        }
      }
    });
    
    transactions.push(transaction);
  }
  
  return transactions;
}

// Função principal para importar transações para todas as carteiras Gestão Click
async function importTestTransactions() {
  try {
    console.log('Buscando carteiras do Gestão Click...');
    
    // Encontrar todas as carteiras do tipo Gestão Click
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
    
    if (wallets.length === 0) {
      console.log('Nenhuma carteira do Gestão Click encontrada.');
      return;
    }
    
    // Gerar transações para cada carteira
    let totalTransactions = 0;
    
    for (const wallet of wallets) {
      // Gerar entre 5 e 15 transações para cada carteira
      const transactionCount = Math.floor(Math.random() * 11) + 5;
      const transactions = await generateTransactionsForWallet(wallet.id, transactionCount);
      totalTransactions += transactions.length;
    }
    
    console.log(`\n===== Importação Concluída =====`);
    console.log(`Total de carteiras processadas: ${wallets.length}`);
    console.log(`Total de transações importadas: ${totalTransactions}`);
  } catch (error) {
    console.error('Erro ao importar transações simuladas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar função principal
importTestTransactions(); 