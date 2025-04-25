import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
import { prisma } from '@/app/_lib/prisma';
import { chatWithFinancialAssistant } from '@/app/_lib/groq';
import { startOfMonth, endOfMonth } from 'date-fns';

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
    const { messages, month } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma mensagem fornecida para o chat' },
        { status: 400 }
      );
    }

    // Verificar se temos dados financeiros do usuário para o mês especificado
    let userData = undefined;
    
    if (month) {
      // Calcular datas de início e fim com base no mês
      const currentYear = new Date().getFullYear();
      const monthIndex = parseInt(month, 10) - 1; // Meses em JS são 0-indexed
      
      const startDate = startOfMonth(new Date(currentYear, monthIndex));
      const endDate = endOfMonth(new Date(currentYear, monthIndex));

      // Buscar transações e estatísticas para o período
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: startDate,
            lte: endDate,
          }
        },
        select: {
          name: true,
          amount: true,
          date: true,
          category: true,
          type: true
        },
        orderBy: {
          date: 'desc'
        },
        take: 20 // Limitar a 20 transações recentes para contexto
      });

      // Calcular totais
      const totalExpenses = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
      const totalIncome = transactions
        .filter(t => t.type === 'DEPOSIT')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calcular principais categorias
      const categoryCounts: Record<string, { count: number; amount: number }> = {};
      
      transactions.forEach(t => {
        const category = t.category || 'Não categorizado';
        if (!categoryCounts[category]) {
          categoryCounts[category] = { count: 0, amount: 0 };
        }
        categoryCounts[category].count += 1;
        categoryCounts[category].amount += Math.abs(t.amount);
      });
      
      // Converter para array e ordenar por valor
      const topCategories = Object.entries(categoryCounts)
        .map(([name, data]) => ({ name, amount: data.amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Formatar transações recentes para o assistente
      const recentTransactions = transactions.slice(0, 10).map(t => ({
        description: t.name,
        amount: t.amount,
        date: t.date.toISOString().split('T')[0],
        category: t.category || 'Não categorizado'
      }));

      // Montar objeto de dados do usuário
      userData = {
        totalTransactions: transactions.length,
        totalExpenses,
        totalIncome,
        topCategories,
        recentTransactions
      };
    }

    // Obter resposta do assistente usando a IA
    try {
      const response = await chatWithFinancialAssistant(
        messages,
        userData
      );

      return NextResponse.json({ response }, { status: 200 });
    } catch (error) {
      console.error('Erro ao conversar com assistente financeiro:', error);
      
      // Fornecer uma resposta fallback em caso de erro na API
      return NextResponse.json({
        response: "Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente mais tarde ou verifique se a chave API da Groq está configurada corretamente."
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Erro ao processar chat com assistente financeiro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 