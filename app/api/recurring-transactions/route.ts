import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { RecurringTransactionService, RecurringFrequency } from "@/app/_services/recurring-transaction-service";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// GET - Listar transações recorrentes
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Se um ID específico for fornecido
    if (id) {
      const recurringTransaction = await RecurringTransactionService.getRecurringTransactionById(id, session.user.id);
      
      if (!recurringTransaction) {
        return new NextResponse("Transação recorrente não encontrada", { status: 404 });
      }
      
      return NextResponse.json(recurringTransaction);
    }

    // Listar todas as transações recorrentes
    const recurringTransactions = await RecurringTransactionService.getRecurringTransactions(
      session.user.id,
      includeInactive
    );
    
    return NextResponse.json(recurringTransactions);
  } catch (error) {
    console.error("Erro ao buscar transações recorrentes:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// POST - Criar uma nova transação recorrente
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    
    // Validar campos obrigatórios
    if (!body.amount || !body.walletId || !body.type || !body.frequency) {
      return new NextResponse("Campos obrigatórios: amount, walletId, type, frequency", { status: 400 });
    }

    // Converter valores
    const amount = parseFloat(body.amount);
    
    // Validar valores
    if (isNaN(amount) || amount <= 0) {
      return new NextResponse("Valor inválido", { status: 400 });
    }

    // Validar frequência
    const validFrequencies = Object.values(RecurringFrequency);
    if (!validFrequencies.includes(body.frequency)) {
      return new NextResponse(
        `Frequência inválida. Valores aceitos: ${validFrequencies.join(", ")}`, 
        { status: 400 }
      );
    }

    // Criar transação recorrente
    const result = await RecurringTransactionService.createRecurringTransaction({
      userId: session.user.id,
      walletId: body.walletId,
      amount,
      description: body.description || "",
      type: body.type,
      category: body.category || "Outros",
      frequency: body.frequency,
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      dayOfMonth: body.dayOfMonth ? parseInt(body.dayOfMonth) : undefined,
      dayOfWeek: body.dayOfWeek ? parseInt(body.dayOfWeek) : undefined,
      paymentMethod: body.paymentMethod,
      metadata: body.metadata
    });

    if (!result.success) {
      return new NextResponse(result.error || "Erro ao criar transação recorrente", { status: 400 });
    }

    return NextResponse.json(result.recurringTransaction);
  } catch (error) {
    console.error("Erro ao criar transação recorrente:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// PATCH - Atualizar uma transação recorrente existente
export async function PATCH(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("ID não fornecido", { status: 400 });
    }

    const body = await request.json();
    
    // Preparar dados para atualização
    const updateData: any = {};
    
    if (body.description !== undefined) updateData.description = body.description;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.walletId !== undefined) updateData.walletId = body.walletId;
    
    // Validar campos que requerem tratamento especial
    if (body.amount !== undefined) {
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return new NextResponse("Valor inválido", { status: 400 });
      }
      updateData.amount = amount;
    }
    
    if (body.startDate !== undefined) {
      updateData.startDate = new Date(body.startDate);
    }
    
    if (body.endDate !== undefined) {
      updateData.endDate = body.endDate ? new Date(body.endDate) : null;
    }
    
    if (body.dayOfMonth !== undefined) {
      updateData.dayOfMonth = body.dayOfMonth ? parseInt(body.dayOfMonth) : null;
    }
    
    if (body.dayOfWeek !== undefined) {
      updateData.dayOfWeek = body.dayOfWeek ? parseInt(body.dayOfWeek) : null;
    }
    
    if (body.type !== undefined) {
      const validTypes = ["EXPENSE", "INCOME", "TRANSFER"];
      if (!validTypes.includes(body.type)) {
        return new NextResponse("Tipo inválido", { status: 400 });
      }
      updateData.type = body.type;
    }
    
    if (body.frequency !== undefined) {
      const validFrequencies = Object.values(RecurringFrequency);
      if (!validFrequencies.includes(body.frequency)) {
        return new NextResponse(
          `Frequência inválida. Valores aceitos: ${validFrequencies.join(", ")}`, 
          { status: 400 }
        );
      }
      updateData.frequency = body.frequency;
    }

    // Atualizar transação recorrente
    const result = await RecurringTransactionService.updateRecurringTransaction(
      id, 
      session.user.id, 
      updateData
    );

    if (!result.success) {
      return new NextResponse(result.error || "Erro ao atualizar transação recorrente", { status: 400 });
    }

    return NextResponse.json(result.recurringTransaction);
  } catch (error) {
    console.error("Erro ao atualizar transação recorrente:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// DELETE - Excluir uma transação recorrente
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("ID não fornecido", { status: 400 });
    }

    // Excluir transação recorrente
    const result = await RecurringTransactionService.deleteRecurringTransaction(id, session.user.id);

    if (!result.success) {
      return new NextResponse(result.error || "Erro ao excluir transação recorrente", { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir transação recorrente:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}

// POST /api/recurring-transactions/generate - Gerar uma transação a partir de uma recorrente
export async function GENERATE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const body = await request.json();
    const { recurringTransactionId, date } = body;

    if (!recurringTransactionId) {
      return new NextResponse("ID da transação recorrente não fornecido", { status: 400 });
    }

    // Gerar transação
    const result = await RecurringTransactionService.generateTransaction(
      recurringTransactionId,
      date ? new Date(date) : undefined
    );

    if (!result.success) {
      return new NextResponse(result.error || "Erro ao gerar transação", { status: 400 });
    }

    return NextResponse.json({ success: true, transaction: result.transaction });
  } catch (error) {
    console.error("Erro ao gerar transação:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 
