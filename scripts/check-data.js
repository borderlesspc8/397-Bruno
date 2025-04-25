// Script para verificar dados no banco de dados
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  try {
    // Verificar total de transações
    const transactionsCount = await prisma.transaction.count();
    console.log(`Total de transações: ${transactionsCount}`);

    // Verificar os tipos de transações
    const transactionTypes = await prisma.transaction.groupBy({
      by: ['type'],
      _count: true
    });
    console.log('Tipos de transações:');
    console.log(transactionTypes);

    // Verificar se o modelo CashFlowPrediction existe
    try {
      const predictionCount = await prisma.cashFlowPrediction.count();
      console.log(`Total de previsões de fluxo de caixa: ${predictionCount}`);
    } catch (e) {
      console.log('Erro ao acessar modelo CashFlowPrediction:', e.message);
      console.log('O modelo CashFlowPrediction pode não existir no banco de dados.');
    }

    // Verificar carteiras
    const walletsCount = await prisma.wallet.count();
    console.log(`Total de carteiras: ${walletsCount}`);

    // Listar nomes das carteiras
    const wallets = await prisma.wallet.findMany({
      select: { id: true, name: true, type: true }
    });
    console.log('Carteiras:');
    console.log(wallets);

    // Verificar parcelas (installments)
    try {
      const installmentsCount = await prisma.installment.count();
      console.log(`Total de parcelas: ${installmentsCount}`);
    } catch (e) {
      console.log('Erro ao acessar modelo Installment:', e.message);
      console.log('O modelo Installment pode não existir no banco de dados.');
    }

    // Verificar modelos disponíveis no Prisma
    console.log('\nModelos disponíveis no Prisma:');
    const models = prisma._dmmf.datamodel.models;
    models.forEach(model => {
      console.log(`- ${model.name}`);
    });

  } catch (error) {
    console.error('Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData(); 