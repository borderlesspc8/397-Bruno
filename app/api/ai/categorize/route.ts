import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
import { prisma } from '@/app/_lib/prisma';
import { suggestCategories } from '@/app/_lib/groq';

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
    const { transactions } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma transação fornecida para categorização' },
        { status: 400 }
      );
    }

    // Buscar todas as categorias personalizadas (se existirem)
    let availableCategories = [
      'Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 
      'Educação', 'Vestuário', 'Eletrônicos', 'Assinaturas', 'Serviços',
      'Investimentos', 'Salário', 'Freelance', 'Presente', 'Outros'
    ];
    
    // Buscar histórico de categorização do usuário para melhorar sugestões
    const userHistory = await prisma.transaction.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        name: true,
        category: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 50 // Limitar a 50 transações recentes para contexto
    });

    // Formatar histórico para o modelo
    const formattedHistory = userHistory.map(t => ({
      description: t.name,
      category: t.category || 'Outros'
    }));

    // Obter sugestões de categorias usando a IA
    const suggestions = await suggestCategories(
      transactions,
      availableCategories,
      formattedHistory
    );

    return NextResponse.json({ suggestions }, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar sugestões de categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 
