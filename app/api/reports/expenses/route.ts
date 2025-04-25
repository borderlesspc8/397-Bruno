import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth-options';
import { format, subMonths } from 'date-fns';

// Função para obter o usuário atual na sessão
async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

// Função utilitária para garantir conversão para número
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

// Função para obter o primeiro e último dia do mês
function getMonthRange(dateStr: string) {
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  return {
    start: firstDay,
    end: lastDay
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month');
    const periodParam = searchParams.get('period') || '6'; // Padrão: 6 meses
    
    // Número de meses a buscar
    const monthsToFetch = parseInt(periodParam, 10);
    
    // Determinar o intervalo de datas
    const endDate = new Date();
    const startDate = subMonths(endDate, monthsToFetch);

    // Se um mês específico foi solicitado
    if (monthParam) {
      const { start, end } = getMonthRange(monthParam);
      
      // Buscar transações do mês especificado
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          type: 'EXPENSE',
          date: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          amount: true,
          category: true,
          categoryObj: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true
            }
          },
          date: true,
          description: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      // Se não houver transações, retornar um array vazio
      if (transactions.length === 0) {
        return NextResponse.json({
          month: monthParam,
          totalExpense: 0,
          categoryBreakdown: [],
          transactions: [],
        });
      }
      
      // Calcular o total de despesas
      const totalExpense = transactions.reduce((total, tx) => total + toNumber(tx.amount), 0);
      
      // Agrupar por categoria
      const categoryMap: Record<string, { amount: number; percentage: number; category: string; color?: string; icon?: string; }> = {};
      
      transactions.forEach(tx => {
        const category = tx.categoryObj?.name || tx.category || 'Sem categoria';
        const color = tx.categoryObj?.color || undefined;
        const icon = tx.categoryObj?.icon || undefined;
        
        if (!categoryMap[category]) {
          categoryMap[category] = {
            amount: 0,
            percentage: 0,
            category,
            color,
            icon
          };
        }
        
        categoryMap[category].amount += toNumber(tx.amount);
      });
      
      // Calcular porcentagens e preparar os dados para retorno
      const categoryBreakdown = Object.values(categoryMap).map(cat => {
        return {
          ...cat,
          percentage: totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0
        };
      }).sort((a, b) => b.amount - a.amount);
      
      return NextResponse.json({
        month: monthParam,
        totalExpense,
        categoryBreakdown,
        transactions: transactions.map(tx => ({
          ...tx,
          amount: toNumber(tx.amount)
        })),
      });
    } else {
      // Buscar todas as transações dentro do período
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          type: 'EXPENSE',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          amount: true,
          category: true,
          categoryObj: {
            select: {
              id: true,
              name: true,
              icon: true,
              color: true
            }
          },
          date: true,
        },
        orderBy: {
          date: 'asc',
        },
      });
      
      if (transactions.length === 0) {
        return NextResponse.json({
          period: monthsToFetch,
          totalExpense: 0,
          monthlyExpenses: [],
          categoryBreakdown: [],
          transactions: [],
        });
      }
      
      // Agrupar transações por mês
      const transactionsByMonth: Record<string, any[]> = {};
      const categoriesData: Record<string, { amount: number; color?: string; icon?: string; }> = {};
      let totalExpense = 0;
      
      transactions.forEach(tx => {
        const monthKey = format(tx.date, 'yyyy-MM');
        const amount = toNumber(tx.amount);
        const category = tx.categoryObj?.name || tx.category || 'Sem categoria';
        
        // Adicionar ao total geral
        totalExpense += amount;
        
        // Agrupar por mês
        if (!transactionsByMonth[monthKey]) {
          transactionsByMonth[monthKey] = [];
        }
        transactionsByMonth[monthKey].push(tx);
        
        // Agrupar por categoria
        if (!categoriesData[category]) {
          categoriesData[category] = {
            amount: 0,
            color: tx.categoryObj?.color || undefined,
            icon: tx.categoryObj?.icon || undefined
          };
        }
        categoriesData[category].amount += amount;
      });
      
      // Processar dados mensais
      const months = Object.keys(transactionsByMonth).sort();
      const monthlyExpenses = months.map(month => {
        const monthTransactions = transactionsByMonth[month];
        const monthTotal = monthTransactions.reduce((total, tx) => total + toNumber(tx.amount), 0);
        
        // Agrupar por categoria dentro do mês
        const monthCategories: Record<string, number> = {};
        
        monthTransactions.forEach(tx => {
          const category = tx.categoryObj?.name || tx.category || 'Sem categoria';
          if (!monthCategories[category]) {
            monthCategories[category] = 0;
          }
          monthCategories[category] += toNumber(tx.amount);
        });
        
        return {
          month,
          monthName: format(new Date(month + '-01'), 'MMMM yyyy'),
          total: monthTotal,
          categories: Object.entries(monthCategories).map(([category, amount]) => ({
            category,
            amount,
            percentage: monthTotal > 0 ? (amount / monthTotal) * 100 : 0
          })).sort((a, b) => b.amount - a.amount)
        };
      });
      
      // Preparar dados de categorias
      const categoryBreakdown = Object.entries(categoriesData).map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
        color: data.color,
        icon: data.icon
      })).sort((a, b) => b.amount - a.amount);
      
      return NextResponse.json({
        period: monthsToFetch,
        totalExpense,
        monthlyExpenses,
        categoryBreakdown,
        transactions: transactions.map(tx => ({
          ...tx,
          amount: toNumber(tx.amount)
        })),
      });
    }
  } catch (error) {
    console.error('Erro ao obter relatório de despesas:', error);
    return NextResponse.json({ error: 'Falha ao processar solicitação' }, { status: 500 });
  }
} 