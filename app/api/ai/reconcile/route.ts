import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
import { prisma } from '@/app/_lib/prisma';
import { suggestReconciliation } from '@/app/_lib/groq';

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
    const { bankTransactions, walletId } = body;

    if (!bankTransactions || !Array.isArray(bankTransactions) || bankTransactions.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma transação bancária fornecida para conciliação' },
        { status: 400 }
      );
    }

    if (!walletId) {
      return NextResponse.json(
        { error: 'ID da carteira não fornecido' },
        { status: 400 }
      );
    }

    // Verificar se a carteira pertence ao usuário
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: session.user.id
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: 'Carteira não encontrada ou não pertence ao usuário' },
        { status: 404 }
      );
    }

    // Buscar transações existentes na carteira para comparação
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        walletId: walletId
      },
      select: {
        id: true,
        name: true,
        amount: true,
        date: true,
        category: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 100 // Limitar a 100 transações recentes para comparação
    });

    // Formatar transações para o modelo de conciliação
    const formattedExistingTransactions = existingTransactions.map(t => ({
      id: t.id,
      description: t.name,
      amount: t.amount,
      date: t.date.toISOString().split('T')[0],
      category: t.category || 'Não categorizado'
    }));

    // Obter sugestões de conciliação usando a IA
    const matches = await suggestReconciliation(
      Array.isArray(bankTransactions) ? bankTransactions : [bankTransactions],
      formattedExistingTransactions
    );

    return NextResponse.json({ matches }, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar sugestões de conciliação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 
