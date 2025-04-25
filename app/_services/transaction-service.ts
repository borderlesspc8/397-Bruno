import { db } from "@/app/_lib/db";
import { Prisma, Transaction, TransactionType, TransactionPaymentMethod } from "@prisma/client";
import { WalletService } from "./wallet-service";
import { QueryOptimizationService } from "./query-optimization-service";

// Interfaces para os parâmetros das operações
export interface CreateTransactionParams {
  userId: string;
  walletId: string;
  amount: number;
  description: string;
  date: Date;
  type: string;
  category: string;
  paymentMethod?: string;
  isReconciled?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface TransactionFilters {
  userId: string;
  walletId?: string | null;
  limit?: number;
  page?: number;
  startDate?: Date;
  endDate?: Date;
  type?: string;
  category?: string;
  cursor?: string;
  tags?: string[];
  search?: string;
  sortField?: string;
  sortOrder?: string;
  includeDetails?: boolean;
}

// Interface para transação com carteira
interface TransactionWithWallet extends Transaction {
  wallet: {
    name: string;
  };
}

interface TransactionOperationResult {
  success: boolean;
  transaction?: TransactionWithWallet;
  error?: string;
}

interface PaginatedTransactions {
  items: TransactionWithWallet[];
  totalCount: number;
  nextCursor?: string;
  hasMore: boolean;
}

export class TransactionService {
  /**
   * Obtém uma transação pelo ID
   */
  static async getTransactionById(id: string, userId: string): Promise<TransactionWithWallet | null> {
    return await db.transaction.findUnique({
      where: {
        id,
        userId
      },
      include: {
        wallet: {
          select: {
            name: true
          }
        }
      }
    });
  }

  /**
   * Lista as transações do usuário com paginação e filtros
   */
  static async getTransactions(filters: TransactionFilters): Promise<PaginatedTransactions> {
    const { 
      userId, 
      walletId, 
      limit = 20, 
      page = 1,
      startDate, 
      endDate, 
      type, 
      category,
      cursor,
      tags,
      search,
      sortField = 'date',
      sortOrder = 'desc',
      includeDetails = false
    } = filters;

    // Construir condições de filtro otimizadas
    const where = QueryOptimizationService.buildTransactionWhereClause({
      userId,
      walletId,
      startDate,
      endDate,
      type: type as TransactionType,
      category,
      tags,
      search
    });

    // Construir parâmetros de paginação otimizados
    const paginationParams = QueryOptimizationService.buildPaginationParams(page, limit, cursor);

    // Construir ordenação otimizada
    const orderBy = QueryOptimizationService.buildTransactionOrderBy(sortField, sortOrder as 'asc' | 'desc');

    // Obter campos selecionados otimizados
    const select = QueryOptimizationService.getTransactionSelectFields(includeDetails);

    // Buscar transações com paginação e campos otimizados
    const transactions = await db.transaction.findMany({
      where,
      select,
      orderBy,
      ...paginationParams
    });

    // Contar total para paginação (usando countBy para otimizar)
    const totalCount = await db.transaction.count({ where });

    // Determinar próximo cursor (se houver resultados)
    const nextCursor = transactions.length > 0 
      ? transactions[transactions.length - 1].id 
      : undefined;

    // Verificar se há mais resultados
    const hasMore = transactions.length === limit;

    return {
      items: transactions as TransactionWithWallet[],
      totalCount,
      nextCursor,
      hasMore
    };
  }

  /**
   * Valida uma transação antes de criar ou atualizar
   */
  private static async validateTransaction(
    params: Partial<CreateTransactionParams> & { walletId: string; userId: string; }
  ): Promise<{ valid: boolean; error?: string }> {
    // Verificar se a carteira existe e pertence ao usuário
    const wallet = await WalletService.getWalletById(params.walletId, params.userId);
    
    if (!wallet) {
      return { valid: false, error: "Carteira não encontrada" };
    }

    // Verificar se o tipo é válido
    const validTypes = ["EXPENSE", "INCOME", "TRANSFER"];
    if (params.type && !validTypes.includes(params.type)) {
      return { valid: false, error: "Tipo de transação inválido" };
    }

    // Verificar se a categoria foi fornecida ao criar uma transação
    if (params.type && !params.category) {
      return { valid: false, error: "Categoria é obrigatória" };
    }

    // Validar valor
    if (params.amount !== undefined && (isNaN(params.amount) || params.amount <= 0)) {
      return { valid: false, error: "Valor inválido" };
    }

    // Validar se a operação pode ser realizada na carteira (se for despesa)
    if (params.type === "EXPENSE" && params.amount) {
      const validationResult = await WalletService.validateWalletOperation(
        params.walletId, 
        params.amount, 
        params.userId
      );

      if (!validationResult.isValid) {
        return { valid: false, error: validationResult.message };
      }
    }

    return { valid: true };
  }

  /**
   * Cria uma nova transação
   */
  static async createTransaction(params: CreateTransactionParams): Promise<TransactionOperationResult> {
    try {
      // Validar a transação
      const validation = await this.validateTransaction(params);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Determinar o efeito no saldo da carteira
      let balanceEffect = 0;
      if (params.type === "EXPENSE") {
        balanceEffect = -params.amount;
      } else if (params.type === "INCOME") {
        balanceEffect = params.amount;
      }

      // Preparar metadata como JsonValue
      const metadata = params.metadata ? params.metadata as Prisma.JsonValue : undefined;
      
      // Preparar tags (se fornecidas)
      const tags = params.tags || [];

      // Criar transação e atualizar saldo da carteira em uma transação
      const transaction = await db.$transaction(async (tx) => {
        // Criar a transação
        const newTransaction = await tx.transaction.create({
          data: {
            userId: params.userId,
            walletId: params.walletId,
            amount: params.amount,
            description: params.description,
            date: params.date,
            type: params.type as TransactionType,
            category: params.category || "Outros", // Categoria padrão
            isReconciled: params.isReconciled || false,
            metadata: {
              ...(metadata as any || {}),
              ...(params.paymentMethod ? { paymentMethod: params.paymentMethod } : {})
            },
            tags
          },
          include: {
            wallet: {
              select: {
                name: true
              }
            }
          }
        });

        // Atualizar o saldo da carteira se não for uma transferência
        if (params.type !== "TRANSFER" && balanceEffect !== 0) {
          await tx.wallet.update({
            where: { id: params.walletId },
            data: {
              balance: {
                increment: balanceEffect
              }
            }
          });
        }

        return newTransaction;
      });

      return {
        success: true,
        transaction
      };
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      return {
        success: false,
        error: "Erro ao criar transação"
      };
    }
  }

  /**
   * Atualiza uma transação existente
   */
  static async updateTransaction(
    id: string, 
    userId: string, 
    updateData: Partial<Omit<CreateTransactionParams, "userId">>
  ): Promise<TransactionOperationResult> {
    try {
      // Buscar transação existente
      const existingTransaction = await db.transaction.findUnique({
        where: {
          id,
          userId
        }
      });

      if (!existingTransaction) {
        return { success: false, error: "Transação não encontrada" };
      }

      // Validar a atualização
      const validation = await this.validateTransaction({
        userId,
        walletId: updateData.walletId || existingTransaction.walletId,
        amount: updateData.amount,
        type: updateData.type as string,
        category: updateData.category
      });

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Calcular o efeito no saldo
      const oldEffect = this.calculateBalanceEffect(
        existingTransaction.type as string, 
        existingTransaction.amount
      );
      
      const newEffect = this.calculateBalanceEffect(
        updateData.type || existingTransaction.type as string, 
        updateData.amount || existingTransaction.amount
      );

      const netEffect = newEffect - oldEffect;
      const walletChanged = updateData.walletId && updateData.walletId !== existingTransaction.walletId;

      // Preparar metadata como JsonValue se fornecido
      const metadata = updateData.metadata ? updateData.metadata as Prisma.JsonValue : undefined;

      // Preparar dados para atualização
      const updateTransactionData: Prisma.TransactionUpdateInput = {
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.date !== undefined && { date: updateData.date }),
        ...(updateData.amount !== undefined && { amount: updateData.amount }),
        ...(updateData.type !== undefined && { type: updateData.type as TransactionType }),
        ...(updateData.category !== undefined && { category: updateData.category }),
        ...(updateData.isReconciled !== undefined && { isReconciled: updateData.isReconciled }),
        ...(metadata !== undefined && { metadata }),
      };

      // Atualizar transação e saldos em uma transação
      const updatedTransaction = await db.$transaction(async (tx) => {
        // Atualizar a transação
        const transaction = await tx.transaction.update({
          where: { id },
          data: updateTransactionData,
          include: {
            wallet: {
              select: {
                name: true
              }
            }
          }
        });

        // Se o valor ou tipo mudou, atualizar o saldo da carteira
        if (netEffect !== 0 && !walletChanged) {
          await tx.wallet.update({
            where: { id: existingTransaction.walletId },
            data: {
              balance: {
                increment: netEffect
              }
            }
          });
        }

        // Se a carteira mudou, restaurar saldo antigo e atualizar novo
        if (walletChanged) {
          // Restaurar saldo na carteira antiga
          await tx.wallet.update({
            where: { id: existingTransaction.walletId },
            data: {
              balance: {
                decrement: oldEffect
              }
            }
          });

          // Atualizar saldo na nova carteira
          await tx.wallet.update({
            where: { id: updateData.walletId! },
            data: {
              balance: {
                increment: newEffect
              }
            }
          });
        }

        return transaction;
      });

      return {
        success: true,
        transaction: updatedTransaction
      };
    } catch (error) {
      console.error("Erro ao atualizar transação:", error);
      return {
        success: false,
        error: "Erro ao atualizar transação"
      };
    }
  }

  /**
   * Exclui uma transação
   */
  static async deleteTransaction(id: string, userId: string): Promise<TransactionOperationResult> {
    try {
      // Buscar transação existente
      const existingTransaction = await db.transaction.findUnique({
        where: {
          id,
          userId
        }
      });

      if (!existingTransaction) {
        return { success: false, error: "Transação não encontrada" };
      }

      // Calcular o efeito no saldo
      const effect = this.calculateBalanceEffect(
        existingTransaction.type as string, 
        existingTransaction.amount
      );

      // Excluir transação e atualizar saldo em uma transação
      await db.$transaction(async (tx) => {
        // Excluir a transação
        await tx.transaction.delete({
          where: { id }
        });

        // Reverter o efeito no saldo da carteira
        await tx.wallet.update({
          where: { id: existingTransaction.walletId },
          data: {
            balance: {
              decrement: effect
            }
          }
        });
      });

      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      return {
        success: false,
        error: "Erro ao excluir transação"
      };
    }
  }

  /**
   * Calcula o efeito no saldo da carteira com base no tipo e valor da transação
   */
  private static calculateBalanceEffect(type: string, amount: number): number {
    switch (type) {
      case "EXPENSE":
        return -amount;
      case "INCOME":
        return amount;
      case "TRANSFER":
        return 0; // Transferências são tratadas separadamente
      default:
        return 0;
    }
  }

  /**
   * Gera estatísticas de transações para um determinado período
   */
  static async getTransactionStatistics(
    userId: string,
    walletId?: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      // Construir condições de filtro
      const where: Prisma.TransactionWhereInput = {
        userId,
        ...(walletId ? { walletId } : {}),
        ...(startDate ? { date: { gte: startDate } } : {}),
        ...(endDate ? { date: { lte: endDate } } : {})
      };

      // Obter totais por tipo
      const incomeTotal = await db.transaction.aggregate({
        where: {
          ...where,
          type: "INCOME"
        },
        _sum: {
          amount: true
        }
      });

      const expenseTotal = await db.transaction.aggregate({
        where: {
          ...where,
          type: "EXPENSE"
        },
        _sum: {
          amount: true
        }
      });

      // Obter totais por categoria para despesas
      const expenseByCategory = await db.transaction.groupBy({
        by: ["category"],
        where: {
          ...where,
          type: "EXPENSE"
        },
        _sum: {
          amount: true
        },
        orderBy: {
          _sum: {
            amount: "desc"
          }
        }
      });

      // Obter contagem por tipo
      const countByType = await db.transaction.groupBy({
        by: ["type"],
        where,
        _count: true
      });

      return {
        income: incomeTotal._sum.amount || 0,
        expense: expenseTotal._sum.amount || 0,
        balance: (incomeTotal._sum.amount || 0) - (expenseTotal._sum.amount || 0),
        expenseByCategory: expenseByCategory.map(item => ({
          category: item.category,
          amount: item._sum.amount || 0
        })),
        countByType: Object.fromEntries(
          countByType.map(item => [item.type, item._count])
        )
      };
    } catch (error) {
      console.error("Erro ao gerar estatísticas:", error);
      throw error;
    }
  }

  /**
   * Adiciona tags a uma transação existente
   */
  static async addTagsToTransaction(
    id: string,
    userId: string,
    tags: string[]
  ): Promise<TransactionOperationResult> {
    try {
      // Verificar se a transação existe e pertence ao usuário
      const existingTransaction = await db.transaction.findUnique({
        where: {
          id,
          userId
        },
        include: {
          wallet: {
            select: {
              name: true
            }
          }
        }
      });
      
      if (!existingTransaction) {
        return { success: false, error: "Transação não encontrada" };
      }
      
      // Buscar tags atuais
      const currentTags = existingTransaction.tags as string[] || [];
      
      // Adicionar novas tags (sem duplicações)
      const uniqueNewTags = tags.filter(tag => !currentTags.includes(tag));
      const updatedTags = [...currentTags, ...uniqueNewTags];
      
      // Atualizar a transação
      const updatedTransaction = await db.transaction.update({
        where: { id },
        data: { 
          tags: updatedTags as Prisma.JsonArray
        },
        include: {
          wallet: {
            select: {
              name: true
            }
          }
        }
      });
      
      return {
        success: true,
        transaction: updatedTransaction as TransactionWithWallet
      };
    } catch (error) {
      console.error("Erro ao adicionar tags à transação:", error);
      return {
        success: false,
        error: "Erro ao adicionar tags à transação"
      };
    }
  }

  /**
   * Remove tags de uma transação existente
   */
  static async removeTagsFromTransaction(
    id: string,
    userId: string,
    tags: string[]
  ): Promise<TransactionOperationResult> {
    try {
      // Verificar se a transação existe e pertence ao usuário
      const existingTransaction = await db.transaction.findUnique({
        where: {
          id,
          userId
        },
        include: {
          wallet: {
            select: {
              name: true
            }
          }
        }
      });
      
      if (!existingTransaction) {
        return { success: false, error: "Transação não encontrada" };
      }
      
      // Buscar tags atuais
      const currentTags = existingTransaction.tags as string[] || [];
      
      // Remover as tags especificadas
      const updatedTags = currentTags.filter(tag => !tags.includes(tag));
      
      // Atualizar a transação
      const updatedTransaction = await db.transaction.update({
        where: { id },
        data: { 
          tags: updatedTags as Prisma.JsonArray
        },
        include: {
          wallet: {
            select: {
              name: true
            }
          }
        }
      });
      
      return {
        success: true,
        transaction: updatedTransaction as TransactionWithWallet
      };
    } catch (error) {
      console.error("Erro ao remover tags da transação:", error);
      return {
        success: false,
        error: "Erro ao remover tags da transação"
      };
    }
  }

  /**
   * Busca transações por tags específicas
   */
  static async getTransactionsByTags(
    userId: string,
    tags: string[],
    limit: number = 20,
    page: number = 1
  ): Promise<PaginatedTransactions> {
    return this.getTransactions({
      userId,
      tags,
      limit,
      page
    });
  }

  /**
   * Cria múltiplas transações em lote
   */
  static async createBatchTransactions(
    transactions: CreateTransactionParams[]
  ): Promise<{
    success: boolean;
    createdCount: number;
    failedCount: number;
    results: { success: boolean; transactionId?: string; error?: string }[];
  }> {
    const results: { success: boolean; transactionId?: string; error?: string }[] = [];
    let createdCount = 0;
    let failedCount = 0;

    try {
      // Processar transações em lote
      await db.$transaction(async (tx) => {
        for (const transactionData of transactions) {
          try {
            // Validar a transação
            const validation = await this.validateTransaction(transactionData);
            if (!validation.valid) {
              results.push({ success: false, error: validation.error });
              failedCount++;
              continue;
            }

            // Determinar o efeito no saldo da carteira
            let balanceEffect = 0;
            if (transactionData.type === "EXPENSE") {
              balanceEffect = -transactionData.amount;
            } else if (transactionData.type === "INCOME") {
              balanceEffect = transactionData.amount;
            }

            // Preparar metadata como JsonValue e tags
            const metadata = transactionData.metadata 
              ? transactionData.metadata as Prisma.JsonValue 
              : undefined;
            const tags = transactionData.tags || [];

            // Criar a transação
            const newTransaction = await tx.transaction.create({
              data: {
                userId: transactionData.userId,
                walletId: transactionData.walletId,
                amount: transactionData.amount,
                description: transactionData.description,
                date: transactionData.date,
                type: transactionData.type as TransactionType,
                category: transactionData.category || "Outros",
                isReconciled: transactionData.isReconciled || false,
                metadata: {
                  ...(metadata as any || {}),
                  ...(transactionData.paymentMethod ? { paymentMethod: transactionData.paymentMethod } : {})
                },
                tags
              }
            });

            // Atualizar o saldo da carteira se não for uma transferência
            if (transactionData.type !== "TRANSFER" && balanceEffect !== 0) {
              await tx.wallet.update({
                where: { id: transactionData.walletId },
                data: {
                  balance: {
                    increment: balanceEffect
                  }
                }
              });
            }

            results.push({ success: true, transactionId: newTransaction.id });
            createdCount++;
          } catch (error) {
            console.error("Erro ao processar transação em lote:", error);
            results.push({ success: false, error: "Erro ao processar transação" });
            failedCount++;
          }
        }
      });

      return {
        success: true,
        createdCount,
        failedCount,
        results
      };
    } catch (error) {
      console.error("Erro ao processar lote de transações:", error);
      return {
        success: false,
        createdCount,
        failedCount: transactions.length - createdCount,
        results
      };
    }
  }

  /**
   * Concilia transações com o mesmo código
   */
  static async reconcileTransactionsByCode(
    userId: string,
    code: string,
    transactionIds: string[]
  ): Promise<TransactionOperationResult> {
    try {
      // Buscar todas as transações do grupo
      const transactions = await db.transaction.findMany({
        where: {
          id: { in: transactionIds },
          userId
        },
        include: {
          wallet: {
            select: {
              name: true
            }
          }
        }
      });

      if (transactions.length === 0) {
        return { success: false, error: "Nenhuma transação encontrada" };
      }

      // Calcular o total do grupo
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

      // Atualizar todas as transações do grupo com os dados de conciliação
      const updatedTransactions = await db.$transaction(async (tx) => {
        const updates = transactions.map(async (transaction) => {
          const reconciliationData: TransactionReconciliationData = {
            isPartOfGroup: true,
            groupSize: transactions.length,
            groupCode: code,
            groupTransactions: transactionIds,
            isManual: true,
            date: new Date().toISOString()
          };

          return await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              isReconciled: true,
              metadata: {
                ...(transaction.metadata as any || {}),
                reconciliationData
              }
            },
            include: {
              wallet: {
                select: {
                  name: true
                }
              }
            }
          });
        });

        return await Promise.all(updates);
      });

      return {
        success: true,
        transaction: updatedTransactions[0] // Retorna a primeira transação como exemplo
      };
    } catch (error) {
      console.error("Erro ao conciliar transações:", error);
      return {
        success: false,
        error: "Erro ao conciliar transações"
      };
    }
  }
}