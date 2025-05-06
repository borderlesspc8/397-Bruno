import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";
import { transactionAdapter } from "@/app/_lib/types";
import { associateTransactionToBudget, removeTransactionFromBudget } from "@/app/_services/budget-transaction-matcher";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Listar transações associadas a um orçamento
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const budgetId = params.id;
    
    // Verificar se o orçamento existe e pertence ao usuário
    const budget = await db.budget.findUnique({
      where: {
        id: budgetId,
        userId: user.id,
      },
    });
    
    if (!budget) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }

    // Buscar transações explicitamente associadas a este orçamento
    const explicitTransactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        budget: {
          is: {
            id: budgetId
          }
        }
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        wallet: true,
        categoryObj: true,
      },
    });
    
    // Converter para o formato padronizado
    const transactions = explicitTransactions.map(transaction => 
      transactionAdapter.fromPrisma(transaction)
    );

    return NextResponse.json({
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('[API_ERROR]', error);
    return NextResponse.json({ error: "Erro ao buscar transações do orçamento" }, { status: 500 });
  }
}

// POST - Associar uma transação a um orçamento
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const budgetId = params.id;
    const body = await request.json();
    const { transactionId } = body;
    
    if (!transactionId) {
      return NextResponse.json({ error: "ID da transação é obrigatório" }, { status: 400 });
    }
    
    // Associar a transação ao orçamento
    const success = await associateTransactionToBudget(transactionId, budgetId, user.id);
    
    if (!success) {
      return NextResponse.json({ error: "Não foi possível associar a transação ao orçamento" }, { status: 400 });
    }
    
    // Buscar a transação atualizada
    const transaction = await db.transaction.findUnique({
      where: {
        id: transactionId,
      },
      include: {
        wallet: true,
        categoryObj: true,
      },
    });
    
    return NextResponse.json({
      transaction: transaction ? transactionAdapter.fromPrisma(transaction) : null,
      message: "Transação associada com sucesso ao orçamento",
    });
  } catch (error) {
    console.error('[API_ERROR]', error);
    return NextResponse.json({ error: "Erro ao associar transação ao orçamento" }, { status: 500 });
  }
}

// DELETE - Remover associação de uma transação a um orçamento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');
    
    if (!transactionId) {
      return NextResponse.json({ error: "ID da transação é obrigatório" }, { status: 400 });
    }
    
    // Remover a associação da transação ao orçamento
    const success = await removeTransactionFromBudget(transactionId, user.id);
    
    if (!success) {
      return NextResponse.json({ error: "Não foi possível remover a associação da transação ao orçamento" }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Associação removida com sucesso",
    });
  } catch (error) {
    console.error('[API_ERROR]', error);
    return NextResponse.json({ error: "Erro ao remover associação da transação" }, { status: 500 });
  }
} 
