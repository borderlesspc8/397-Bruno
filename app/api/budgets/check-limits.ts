import { db } from "@/app/_lib/db";
import { NotificationService } from "@/app/_services/notification-service";
import { Budget, BudgetCategory } from "@prisma/client";

interface BudgetWithCategories extends Budget {
  categories: BudgetCategory[];
}

interface BudgetLimitResult {
  budget: BudgetWithCategories;
  totalSpent: number;
  percentUsed: number;
  isExceeded: boolean;
  isNearLimit: boolean;
  exceededCategories?: {
    categoryName: string;
    plannedAmount: number;
    actualAmount: number;
    percentUsed: number;
  }[];
}

/**
 * Verifica os limites de um orçamento específico e envia notificações se necessário
 */
export async function checkBudgetLimits(budgetId: string): Promise<BudgetLimitResult | null> {
  try {
    // Buscar orçamento com categorias
    const budget = await db.budget.findUnique({
      where: { id: budgetId },
      include: {
        categories: true,
        transactions: {
          where: {
            date: {
              // Filtrar transações do período atual do orçamento
              gte: getStartDate(),
              lte: getEndDate(),
            },
          },
          include: {
            category: true,
          },
        },
      },
    });

    if (!budget) {
      console.error(`Orçamento não encontrado: ${budgetId}`);
      return null;
    }

    // Calcular gastos por categoria
    const categorySpending = new Map<string, number>();
    let totalSpent = 0;

    budget.transactions.forEach((transaction) => {
      if (!transaction.category) return;

      const categoryName = transaction.category.name;
      const amount = transaction.type === "EXPENSE" ? Math.abs(transaction.amount) : 0;

      categorySpending.set(
        categoryName,
        (categorySpending.get(categoryName) || 0) + amount
      );

      totalSpent += amount;
    });

    // Verificar categorias que excederam o limite
    const exceededCategories = [];
    
    for (const budgetCategory of budget.categories) {
      const actualAmount = categorySpending.get(budgetCategory.categoryName) || 0;
      const percentUsed = (actualAmount / budgetCategory.plannedAmount) * 100;
      
      if (percentUsed >= 100) {
        exceededCategories.push({
          categoryName: budgetCategory.categoryName,
          plannedAmount: budgetCategory.plannedAmount,
          actualAmount,
          percentUsed,
        });
      }
    }

    // Calcular percentual total utilizado
    const percentUsed = (totalSpent / budget.amount) * 100;
    const isExceeded = percentUsed >= 100;
    const isNearLimit = percentUsed >= 80 && percentUsed < 100;

    // Enviar notificações se necessário
    if (isExceeded) {
      await sendBudgetExceededNotification(budget, percentUsed, exceededCategories);
    } else if (isNearLimit) {
      await sendBudgetNearLimitNotification(budget, percentUsed);
    }

    return {
      budget,
      totalSpent,
      percentUsed,
      isExceeded,
      isNearLimit,
      exceededCategories: exceededCategories.length > 0 ? exceededCategories : undefined,
    };
  } catch (error) {
    console.error("Erro ao verificar limites do orçamento:", error);
    return null;
  }
}

/**
 * Verifica todos os orçamentos ativos e envia notificações para aqueles que excederam limites
 */
export async function checkAllBudgetsLimits() {
  try {
    // Buscar todos os orçamentos ativos
    const budgets = await db.budget.findMany({
      where: {
        // Filtrar apenas orçamentos ativos (sem data de fim ou com data futura)
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
    });

    const results = [];
    for (const budget of budgets) {
      const result = await checkBudgetLimits(budget.id);
      if (result) {
        results.push(result);
      }
    }

    return {
      total: budgets.length,
      exceededCount: results.filter(r => r.isExceeded).length,
      nearLimitCount: results.filter(r => r.isNearLimit).length,
      results,
    };
  } catch (error) {
    console.error("Erro ao verificar todos os orçamentos:", error);
    return null;
  }
}

/**
 * Enviar notificação de orçamento excedido
 */
async function sendBudgetExceededNotification(
  budget: Budget,
  percentUsed: number,
  exceededCategories?: { categoryName: string; percentUsed: number }[]
) {
  try {
    const formattedPercent = percentUsed.toFixed(1);
    const categoriesText = exceededCategories && exceededCategories.length > 0
      ? `\nCategorias excedidas: ${exceededCategories.map(c => 
          `${c.categoryName} (${c.percentUsed.toFixed(1)}%)`).join(', ')}`
      : '';

    await NotificationService.createNotification({
      userId: budget.userId,
      title: `Alerta: Orçamento excedido!`,
      message: `Seu orçamento "${budget.title}" foi excedido. Utilização atual: ${formattedPercent}% do limite.${categoriesText}`,
      type: "BUDGET",
      priority: "HIGH",
      link: `/budgets/${budget.id}`,
      metadata: {
        budgetId: budget.id,
        percentUsed,
        exceededCategories,
      },
    });

    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de orçamento excedido:", error);
    return false;
  }
}

/**
 * Enviar notificação de orçamento próximo do limite
 */
async function sendBudgetNearLimitNotification(budget: Budget, percentUsed: number) {
  try {
    const formattedPercent = percentUsed.toFixed(1);

    await NotificationService.createNotification({
      userId: budget.userId,
      title: `Atenção: Orçamento próximo do limite`,
      message: `Seu orçamento "${budget.title}" está próximo do limite. Utilização atual: ${formattedPercent}% do total.`,
      type: "BUDGET",
      priority: "MEDIUM",
      link: `/budgets/${budget.id}`,
      metadata: {
        budgetId: budget.id,
        percentUsed,
      },
    });

    return true;
  } catch (error) {
    console.error("Erro ao enviar notificação de orçamento próximo do limite:", error);
    return false;
  }
}

/**
 * Funções utilitárias para determinar o período atual do orçamento
 */
function getStartDate() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1); // Primeiro dia do mês atual
}

function getEndDate() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último dia do mês atual
} 