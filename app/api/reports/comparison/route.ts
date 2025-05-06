import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/_lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth-options';
import { format } from 'date-fns';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Função para obter o usuário atual na sessão
async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

// Definindo a interface para transações
interface Transaction {
  id: string;
  amount: number;
  category: string | null;
  date: Date;
}

// Função auxiliar para obter o primeiro e último dia do mês
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

// Função utilitária para garantir conversão para número
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const firstMonth = searchParams.get('firstMonth');
    const secondMonth = searchParams.get('secondMonth');
    
    // Buscar TODAS as transações do tipo EXPENSE
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'EXPENSE',
      },
      select: {
        id: true,
        amount: true,
        category: true,
        date: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
    
    // Se não houver transações, retornar um array vazio
    if (transactions.length === 0) {
      return NextResponse.json({
        months: [],
        categories: [],
      });
    }
    
    // Agrupar transações por mês
    const transactionsByMonth: Record<string, Transaction[]> = {};
    
    transactions.forEach((transaction: Transaction) => {
      const month = format(transaction.date, 'yyyy-MM');
      
      if (!transactionsByMonth[month]) {
        transactionsByMonth[month] = [];
      }
      
      // Garantir que o valor da transação seja um número
      const validTransaction = {
        ...transaction,
        amount: toNumber(transaction.amount)
      };
      
      transactionsByMonth[month].push(validTransaction);
    });
    
    // Processar dados por mês
    const months = Object.keys(transactionsByMonth).sort();
    const monthlyData = months.map(month => {
      const monthTransactions = transactionsByMonth[month];
      
      // Calcular total de despesas do mês
      const totalExpense = monthTransactions.reduce((total, tx) => total + toNumber(tx.amount), 0);
      
      // Agrupar por categoria
      const categoriesMap: Record<string, { amount: number; percentage: number }> = {};
      
      monthTransactions.forEach(tx => {
        const category = tx.category || 'Sem categoria';
        
        if (!categoriesMap[category]) {
          categoriesMap[category] = {
            amount: 0,
            percentage: 0,
          };
        }
        
        categoriesMap[category].amount += toNumber(tx.amount);
      });
      
      // Calcular percentagens por categoria
      Object.keys(categoriesMap).forEach(category => {
        const amount = toNumber(categoriesMap[category].amount);
        categoriesMap[category].percentage = totalExpense > 0 
          ? (amount / totalExpense) * 100 
          : 0;
      });
      
      // Converter para o formato esperado
      const categories = Object.entries(categoriesMap).map(([category, data]) => ({
        category,
        amount: toNumber(data.amount),
        percentage: toNumber(data.percentage),
      }));
      
      return {
        month,
        totalExpense,
        categories,
      };
    });
    
    // Se meses específicos foram solicitados
    if (firstMonth && secondMonth) {
      const firstMonthData = monthlyData.find(m => m.month === firstMonth);
      const secondMonthData = monthlyData.find(m => m.month === secondMonth);
      
      if (!firstMonthData || !secondMonthData) {
        return NextResponse.json({ error: 'Dados dos meses solicitados não encontrados' }, { status: 404 });
      }
      
      // Calcular diferenças entre os meses
      const allCategories = Array.from(new Set([
        ...firstMonthData.categories.map(c => c.category),
        ...secondMonthData.categories.map(c => c.category),
      ]));
      
      const differences: Record<string, number> = {};
      
      allCategories.forEach(category => {
        const firstMonthCategory = firstMonthData.categories.find(c => c.category === category);
        const secondMonthCategory = secondMonthData.categories.find(c => c.category === category);
        
        differences[category] = toNumber(secondMonthCategory?.amount || 0) - toNumber(firstMonthCategory?.amount || 0);
      });
      
      // Calcular mudança percentual geral
      let changePercentage = 0;
      const firstTotal = toNumber(firstMonthData.totalExpense);
      const secondTotal = toNumber(secondMonthData.totalExpense);
      
      if (firstTotal > 0) {
        changePercentage = ((secondTotal - firstTotal) / firstTotal) * 100;
      } else if (secondTotal > 0) {
        changePercentage = 100; // 100% de aumento se antes era zero
      }
      
      return NextResponse.json({
        months: monthlyData,
        categories: allCategories,
        differences,
        changePercentage,
        selectedMonthsData: {
          firstMonth: firstMonthData,
          secondMonth: secondMonthData
        }
      });
    }
    
    // Resposta padrão com todos os dados dos meses
    return NextResponse.json({
      months: monthlyData,
      categories: Array.from(new Set(monthlyData.flatMap(m => m.categories.map(c => c.category)))),
    });
    
  } catch (error) {
    console.error('Erro ao obter dados de comparação:', error);
    return NextResponse.json({ error: 'Falha ao processar solicitação' }, { status: 500 });
  }
} 
