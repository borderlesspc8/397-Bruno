import { db } from "@/app/_lib/prisma";
import { Budget, Transaction } from "@/app/_lib/types";

/**
 * Associa automaticamente uma transação a um orçamento com base em critérios como
 * categoria, carteira, data e valor.
 */
export async function matchTransactionToBudget(transaction: Transaction): Promise<Budget | null> {
  if (transaction.type !== 'EXPENSE') {
    // Apenas despesas são associadas a orçamentos
    return null;
  }

  if (!transaction.userId) {
    console.error('Transação sem userId não pode ser associada a um orçamento');
    return null;
  }
  
  // Encontrar todos os orçamentos ativos do usuário
  try {
    const budgets = await db.budget.findMany({
      where: {
        userId: transaction.userId,
        OR: [
          // Orçamentos com datas específicas que incluem a data da transação
          {
            startDate: { lte: transaction.date },
            endDate: { gte: transaction.date },
          },
          // Orçamentos recorrentes sem data de término
          {
            isRecurring: true,
            startDate: { lte: transaction.date },
            endDate: null,
          },
        ],
      },
      include: {
        category: true,
        wallet: true,
      },
    });
    
    if (budgets.length === 0) {
      return null;
    }
    
    // Sistema de pontuação para encontrar o melhor orçamento
    const scoredBudgets = budgets.map((budget: any) => {
      let score = 0;
      
      // Critério 1: Mesma categoria (mais importante)
      if (budget.categoryId && budget.categoryId === transaction.categoryId) {
        score += 100;
      }
      
      // Critério 2: Mesma carteira
      if (budget.walletId && budget.walletId === transaction.walletId) {
        score += 50;
      }
      
      // Critério 3: Valor dentro do limite do orçamento
      if (transaction.amount <= budget.amount) {
        score += 25;
      }
      
      // Critério 4: Período específico vs. recorrente
      if (budget.startDate && budget.endDate) {
        // Orçamentos com período específico têm prioridade mais alta
        score += 20;
      }
      
      return {
        budget,
        score,
      };
    });
    
    // Ordenar por pontuação (maior para menor)
    scoredBudgets.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    
    // Se o melhor orçamento tiver uma pontuação mínima, retorná-lo
    if (scoredBudgets.length > 0 && scoredBudgets[0].score >= 50) {
      return scoredBudgets[0].budget;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return null;
  }
}

/**
 * Associa uma transação a um orçamento específico
 */
export async function associateTransactionToBudget(
  transactionId: string,
  budgetId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verificar se a transação e o orçamento pertencem ao usuário
    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });
    
    const budget = await db.budget.findFirst({
      where: {
        id: budgetId,
        userId,
      },
    });
    
    if (!transaction || !budget) {
      return false;
    }
    
    // Atualizar a transação com a referência ao orçamento
    await db.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        // Usar a sintaxe de relacionamento do Prisma
        budget: {
          connect: {
            id: budgetId
          }
        }
      },
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao associar transação ao orçamento:', error);
    return false;
  }
}

/**
 * Remove a associação de uma transação com um orçamento
 */
export async function removeTransactionFromBudget(
  transactionId: string,
  userId: string
): Promise<boolean> {
  try {
    // Verificar se a transação pertence ao usuário
    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
    });
    
    if (!transaction) {
      return false;
    }
    
    // Remover a referência ao orçamento usando a sintaxe do Prisma
    await db.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        budget: {
          disconnect: true
        }
      },
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao remover transação do orçamento:', error);
    return false;
  }
} 