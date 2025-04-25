import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";

// Schema de validação para criação e atualização de orçamentos
const budgetSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  amount: z.number().positive("O valor deve ser positivo"),
  categoryId: z.string().optional().nullable(),
  walletId: z.string().optional(),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  colorAccent: z.string().optional(),
  iconName: z.string().optional(),
});

// GET - Listar orçamentos do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Definir filtros
    const filter = {
      userId: user.id,
    };

    // Buscar orçamentos
    const budgets = await prisma.budget.findMany({
      where: filter,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: true,
        wallet: true,
      },
    });

    // Calcular progresso para cada orçamento
    const budgetsWithProgress = await Promise.all(
      budgets.map(async (budget) => {
        // Definir período para filtrar transações
        let startDate = budget.startDate;
        let endDate = budget.endDate;

        if (!startDate || !endDate) {
          const now = new Date();
          endDate = now;

          switch (budget.period) {
            case "DAILY":
              startDate = new Date(now);
              startDate.setDate(now.getDate() - 1);
              break;
            case "WEEKLY":
              startDate = new Date(now);
              startDate.setDate(now.getDate() - 7);
              break;
            case "MONTHLY":
              startDate = new Date(now);
              startDate.setMonth(now.getMonth() - 1);
              break;
            case "YEARLY":
              startDate = new Date(now);
              startDate.setFullYear(now.getFullYear() - 1);
              break;
            default:
              startDate = new Date(now);
              startDate.setMonth(now.getMonth() - 1);
          }
        }

        // Filtro para transações
        const transactionFilter = {
          userId: user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
          // Se o orçamento tiver categoria, filtra por ela
          ...(budget.categoryId && {
            categoryId: budget.categoryId,
          }),
          // Se o orçamento tiver carteira, filtra por ela
          ...(budget.walletId && {
            walletId: budget.walletId,
          }),
          // Apenas despesas (valores negativos)
          amount: {
            lt: 0,
          },
        };

        // Calcular total gasto
        const result = await prisma.transaction.aggregate({
          where: transactionFilter,
          _sum: {
            amount: true,
          },
        });

        const spent = Math.abs(Number(result._sum.amount || 0));
        const remaining = budget.amount - spent;
        const progress = (spent / budget.amount) * 100;

        return {
          ...budget,
          spent,
          remaining,
          progress,
        };
      })
    );

    return NextResponse.json(budgetsWithProgress);
  } catch (error) {
    console.error("Erro ao listar orçamentos:", error);
    return NextResponse.json(
      { error: "Erro ao listar orçamentos" },
      { status: 500 }
    );
  }
}

// POST - Criar novo orçamento
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Validar body da requisição
    const body = await request.json();
    const validationResult = budgetSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Criar orçamento
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description || null,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        categoryId: data.categoryId || null,
        walletId: data.walletId || null,
        colorAccent: data.colorAccent || "#4f46e5",
        iconName: data.iconName || "PiggyBank",
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar orçamento" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar orçamento
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Validar body da requisição
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: "ID do orçamento não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se o orçamento existe e pertence ao usuário
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: body.id,
        userId: user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    // Validar dados de atualização
    const { id, ...updateData } = body;
    const validationResult = budgetSchema.partial().safeParse(updateData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Atualizar orçamento
    const updatedBudget = await prisma.budget.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.amount && { amount: data.amount }),
        ...(data.period && { period: data.period }),
        ...(data.startDate !== undefined && { 
          startDate: data.startDate ? new Date(data.startDate) : null 
        }),
        ...(data.endDate !== undefined && { 
          endDate: data.endDate ? new Date(data.endDate) : null 
        }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.walletId !== undefined && { walletId: data.walletId }),
        ...(data.colorAccent && { colorAccent: data.colorAccent }),
        ...(data.iconName && { iconName: data.iconName }),
      },
    });

    return NextResponse.json(updatedBudget);
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar orçamento" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir orçamento
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Obter ID do orçamento da URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do orçamento não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se o orçamento existe e pertence ao usuário
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json(
        { error: "Orçamento não encontrado" },
        { status: 404 }
      );
    }

    // Excluir orçamento
    await prisma.budget.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao excluir orçamento" },
      { status: 500 }
    );
  }
} 