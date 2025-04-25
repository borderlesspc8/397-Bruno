import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function limparDados() {
  try {
    console.log('Iniciando limpeza do banco de dados...');

    // Remover transações
    const { count: transacoesRemovidas } = await prisma.transaction.deleteMany();
    console.log(`${transacoesRemovidas} transações removidas`);

    // Remover carteiras
    const { count: carteirasRemovidas } = await prisma.wallet.deleteMany();
    console.log(`${carteirasRemovidas} carteiras removidas`);

    console.log('Banco de dados limpo com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função principal
limparDados(); 