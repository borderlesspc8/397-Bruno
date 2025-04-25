// Script para verificar as entradas na tabela de fluxo de caixa
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCashFlow() {
  try {
    console.log('Verificando entradas na tabela de fluxo de caixa...');
    
    // Contar total de entradas
    const totalEntries = await prisma.cash_flow_entries.count();
    console.log(`Total de entradas de fluxo de caixa: ${totalEntries}`);
    
    // Verificar distribuição por tipo
    const entriesByType = await prisma.cash_flow_entries.groupBy({
      by: ['type'],
      _count: true,
      _sum: {
        amount: true
      }
    });
    
    console.log('\nDistribuição por tipo:');
    entriesByType.forEach(entry => {
      console.log(`- ${entry.type}: ${entry._count} entradas, soma: ${entry._sum.amount}`);
    });
    
    // Verificar distribuição por mês/ano
    const entriesByMonth = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*) as count,
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_expense
      FROM cash_flow_entries
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month
    `;
    
    console.log('\nDistribuição por mês:');
    entriesByMonth.forEach(entry => {
      console.log(`- ${entry.month}: ${entry.count} entradas, receitas: ${entry.total_income}, despesas: ${entry.total_expense}, saldo: ${entry.total_income - entry.total_expense}`);
    });
    
    // Verificar distribuição por carteira
    const entriesByWallet = await prisma.cash_flow_entries.groupBy({
      by: ['walletId'],
      _count: true
    });
    
    console.log('\nDistribuição por carteira:');
    for (const entry of entriesByWallet) {
      const wallet = entry.walletId 
        ? await prisma.wallet.findUnique({ where: { id: entry.walletId } })
        : { name: 'Sem carteira' };
      console.log(`- ${wallet?.name || entry.walletId}: ${entry._count} entradas`);
    }
    
    // Verificar últimas 5 entradas
    const latestEntries = await prisma.cash_flow_entries.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        Wallet: {
          select: { name: true }
        }
      }
    });
    
    console.log('\nÚltimas 5 entradas:');
    latestEntries.forEach(entry => {
      console.log(`- ${entry.date.toISOString().split('T')[0]} | ${entry.type} | ${entry.amount} | ${entry.description} | ${entry.Wallet?.name || 'Sem carteira'}`);
    });
    
  } catch (error) {
    console.error('Erro ao verificar entradas de fluxo de caixa:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCashFlow(); 