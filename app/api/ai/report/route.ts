import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
import { prisma } from '@/app/_lib/prisma';
import { generateFinancialAnalysis } from '@/app/_lib/groq';
import { format, endOfMonth, startOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { month } = body;

    if (!month) {
      return NextResponse.json(
        { error: 'Mês não especificado' },
        { status: 400 }
      );
    }

    // Calcular datas de início e fim com base no mês
    const currentYear = new Date().getFullYear();
    const monthIndex = parseInt(month, 10) - 1; // Meses em JS são 0-indexed
    
    const startDate = startOfMonth(new Date(currentYear, monthIndex));
    const endDate = endOfMonth(new Date(currentYear, monthIndex));
    
    // Formatar datas para exibição
    const startDateFormatted = format(startDate, 'dd/MM/yyyy', { locale: ptBR });
    const endDateFormatted = format(endDate, 'dd/MM/yyyy', { locale: ptBR });

    // Consultar as transações do usuário para o período especificado
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        name: true,
        amount: true,
        category: true,
        type: true,
        date: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    if (transactions.length === 0) {
      return NextResponse.json(
        { report: "Não há transações registradas para o período selecionado. Adicione transações para gerar uma análise." },
        { status: 200 }
      );
    }

    // Calcular valores totais
    const totalIncome = transactions
      .filter(t => t.type === 'DEPOSIT' || t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    // Calcular categorias principais de gastos
    const categories = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => {
        const category = t.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += t.amount;
        return acc;
      }, {} as Record<string, number>);

    // Converter para array e ordenar
    const topCategories = Object.entries(categories)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / totalExpenses) * 100)
      }))
      .sort((a, b) => b.amount - a.amount);

    // Formatar transações para o modelo
    const formattedTransactions = transactions.map(t => ({
      description: t.name,
      amount: t.amount,
      category: t.category,
      date: format(t.date, 'dd/MM/yyyy')
    }));

    // Gerar análise financeira
    const report = await generateFinancialAnalysis({
      startDate: startDateFormatted,
      endDate: endDateFormatted,
      totalExpenses,
      totalIncome,
      balance,
      topCategories,
      transactions: formattedTransactions
    });

    return NextResponse.json({ report }, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar relatório de IA:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 