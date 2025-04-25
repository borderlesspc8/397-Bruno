import { PrismaClient } from '@prisma/client';

/**
 * Script para limpar todas as tabelas do banco de dados
 * ATENÇÃO: Este script apaga TODOS os dados. Use apenas em ambiente de desenvolvimento.
 */
async function main() {
  console.log('Iniciando limpeza do banco de dados...');
  
  const prisma = new PrismaClient();
  
  try {
    // É importante seguir a ordem correta para evitar erros de chave estrangeira
    // Primeiro apagamos as tabelas que dependem de outras (tabelas filhas)
    
    // 1. Tabelas de relacionamento e entidades dependentes
    console.log('Limpando tabelas de relacionamento...');
    await prisma.goalContribution.deleteMany();
    await prisma.budgetCategory.deleteMany();
    await prisma.transactionConflict.deleteMany();
    
    // 2. Tabelas de transações e dados financeiros
    console.log('Limpando tabelas de transações e dados financeiros...');
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.financialGoal.deleteMany();
    await prisma.categoryMapping.deleteMany();
    
    // 3. Tabelas de configuração e importação
    console.log('Limpando tabelas de configuração e importação...');
    await prisma.importHistory.deleteMany();
    await prisma.importSchedule.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.category.deleteMany();
    
    // 4. Tabelas de autenticação (exceto User)
    console.log('Limpando tabelas de autenticação...');
    await prisma.session.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.passwordReset.deleteMany();
    await prisma.account.deleteMany();
    
    // 5. Tabelas de usuário e assinatura
    console.log('Limpando tabelas de usuário e assinatura...');
    await prisma.subscription.deleteMany();
    
    // 6. Manter a tabela de bancos que foi criada pelo seed
    console.log('Mantendo a tabela de bancos...');
    
    // 7. Finalmente, se desejado, usuários
    // Comentado por segurança - descomente se realmente quiser apagar usuários
    // await prisma.user.deleteMany();
    
    console.log('Banco de dados limpo com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar o banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 