import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { prisma } from "@/app/_lib/prisma";

// Schema de validação para contribuição
const contributionSchema = z.object({
  amount: z.number().positive("O valor deve ser positivo"),
  date: z.date(),
  note: z.string().optional(),
});

export async function POST(
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
    const goal = await prisma.financialGoal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    // Validar dados
    const body = await req.json();
    const validationResult = contributionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Criar contribuição e atualizar valor atual da meta
    const { amount, date, note } = validationResult.data;

    // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
    const [contribution, updatedGoal] = await prisma.$transaction([
      // @ts-ignore - O modelo GoalContribution está definido no schema mas o TypeScript não o reconhece
      prisma.goalContribution.create({
        data: {
          goalId: goal.id,
          amount,
          date,
          note,
        },
      }),
      // @ts-ignore - O modelo financialGoal está definido no schema mas o TypeScript não o reconhece
      prisma.financialGoal.update({
        where: { id: goal.id },
        data: {
          currentAmount: {
            increment: amount,
          },
          status: goal.currentAmount + amount >= goal.targetAmount ? "COMPLETED" : goal.status,
        },
      }),
    ]);

    return NextResponse.json({
      message: "Contribuição adicionada com sucesso",
      contribution,
      updatedGoal,
    });
  } catch (error) {
    console.error("[GOAL_CONTRIBUTE_POST]", error);
    return NextResponse.json(
      { error: "Erro interno ao adicionar contribuição" },
      { status: 500 }
    );
  }
}

export async function GET(
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
    const goal = await prisma.financialGoal.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    // Buscar contribuições da meta
    // @ts-ignore - O modelo GoalContribution está definido no schema mas o TypeScript não o reconhece
    const contributions = await prisma.goalContribution.findMany({
      where: {
        goalId: goal.id,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(contributions);
  } catch (error) {
    console.error("[GOAL_CONTRIBUTIONS_GET]", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar contribuições" },
      { status: 500 }
    );
  }
} 