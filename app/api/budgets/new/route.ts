import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { z } from "zod";

// Schema de validação para criação de orçamentos a partir de sugestões
const suggestedBudgetSchema = z.object({
  category: z.string().min(1, "A categoria é obrigatória"),
  amount: z.number().positive("O valor deve ser positivo"),
  description: z.string().optional(),
  period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).default("MONTHLY"),
  colorAccent: z.string().optional(),
  iconName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter usuário pelo ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Validar body da requisição
    const body = await request.json();
    const validationResult = suggestedBudgetSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Buscar categoria correspondente ou criar uma nova
    let categoryId = null;
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: {
          equals: data.category,
          mode: 'insensitive'
        }
      }
    });

    if (existingCategory) {
      categoryId = existingCategory.id;
    } else {
      // Criar nova categoria - removendo o campo iconName que não existe no modelo
      const newCategory = await prisma.category.create({
        data: {
          userId: user.id,
          name: data.category,
          color: data.colorAccent || getRandomColor(),
          type: "EXPENSE"
        }
      });
      categoryId = newCategory.id;
    }

    // Calcular datas de início e fim com base no período
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);  // Por padrão, 1 mês

    // Criar orçamento
    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        title: data.category,
        description: data.description || `Orçamento para ${data.category}`,
        amount: data.amount,
        period: data.period,
        startDate,
        endDate,
        categoryId,
        colorAccent: data.colorAccent || getColorForCategory(data.category),
        iconName: data.iconName || "PiggyBank",
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar orçamento sugerido:", error);
    return NextResponse.json(
      { error: "Erro ao criar orçamento" },
      { status: 500 }
    );
  }
}

// Função para obter cor aleatória
function getRandomColor() {
  const colors = [
    "#ef4444", // Vermelho
    "#f97316", // Laranja
    "#eab308", // Amarelo
    "#84cc16", // Verde claro
    "#10b981", // Verde
    "#06b6d4", // Ciano
    "#3b82f6", // Azul
    "#8b5cf6", // Violeta
    "#d946ef", // Rosa
    "#6366f1", // Índigo
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

// Função para obter cor baseada na categoria
function getColorForCategory(category: string): string {
  const colorMap: Record<string, string> = {
    "Alimentação": "#ef4444",
    "Moradia": "#f97316",
    "Transporte": "#eab308",
    "Lazer": "#84cc16",
    "Saúde": "#10b981",
    "Educação": "#06b6d4",
    "Serviços": "#3b82f6",
    "Compras": "#8b5cf6",
    "Outros": "#94a3b8",
    "Investimentos": "#6366f1",
  };
  
  return colorMap[category] || getRandomColor();
} 
