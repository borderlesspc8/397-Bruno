import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth-options";
import { prisma } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";

// Schema de validação para criação e atualização de metas
const goalSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  description: z.string().optional(),
  targetAmount: z.number().positive("O valor da meta deve ser positivo"),
  category: z.enum([
    "EMERGENCY_FUND",
    "RETIREMENT",
    "VACATION",
    "EDUCATION",
    "HOME",
    "CAR",
    "WEDDING",
    "DEBT_PAYMENT",
    "INVESTMENT",
    "OTHER",
  ]),
  targetDate: z.date(),
  walletId: z.string().optional(),
  colorAccent: z.string().optional(),
  iconName: z.string().optional(),
});

// GET /api/goals - Listar todas as metas do usuário
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Buscar metas do usuário
    // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
    const goals = await prisma.financialGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("[GOALS_GET]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar metas" },
      { status: 500 }
    );
  }
}

// POST /api/goals - Criar nova meta
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Validar dados
    const body = await req.json();
    const validationResult = goalSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Criar meta
    // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
    const goal = await prisma.financialGoal.create({
      data: {
        ...validationResult.data,
        userId: user.id,
        status: "IN_PROGRESS",
        currentAmount: 0,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("[GOALS_POST]", error);
    return NextResponse.json(
      { error: "Erro interno ao criar meta" },
      { status: 500 }
    );
  }
}

// PATCH /api/goals/:id - Atualizar meta
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Validar dados
    const body = await req.json();
    const validationResult = goalSchema.partial().safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Verificar se a meta existe e pertence ao usuário
    // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
    const existingGoal = await prisma.financialGoal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    // Atualizar meta
    // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
    const goal = await prisma.financialGoal.update({
      where: { id: params.id },
      data: validationResult.data,
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("[GOALS_PATCH]", error);
    return NextResponse.json(
      { error: "Erro interno ao atualizar meta" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/:id - Deletar meta
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se a meta existe e pertence ao usuário
    // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
    const existingGoal = await prisma.financialGoal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    // Excluir meta
    // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
    await prisma.financialGoal.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Meta excluída com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GOALS_DELETE]", error);
    return NextResponse.json(
      { error: "Erro interno ao excluir meta" },
      { status: 500 }
    );
  }
} 