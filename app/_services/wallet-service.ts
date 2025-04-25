import { db } from "@/app/_lib/db";
import { Wallet, WalletType, Prisma } from "@prisma/client";
import { calculateSimpleWalletBalance } from "../_utils/wallet-balance";

export interface WalletValidationResult {
  isValid: boolean;
  reason?: string;
}

export interface CreateWalletParams {
  userId: string;
  name: string;
  type: WalletType;
  initialBalance?: number;
  isActive?: boolean;
  allowNegative?: boolean;
  creditLimit?: number;
  dueDay?: number;
  closingDay?: number;
  icon?: string;
  color?: string;
  bankId?: string;
  metadata?: Record<string, any>;
}

export interface WalletWithBalance extends Wallet {
  availableBalance: number;
  pendingTransactions: number;
}

export interface WalletOperationResult {
  success: boolean;
  wallet?: Wallet;
  error?: string;
}

export interface TransferResult {
  success: boolean;
  sourceTransaction?: any;
  targetTransaction?: any;
  error?: string;
}

export class WalletService {
  /**
   * Cria uma nova carteira
   */
  static async createWallet(params: CreateWalletParams): Promise<WalletOperationResult> {
    try {
      // Validar entrada básica
      if (!params.name || params.name.trim().length < 2) {
        return {
          success: false,
          error: "Nome da carteira deve ter pelo menos 2 caracteres"
        };
      }

      // Criar a carteira
      const wallet = await db.wallet.create({
        data: {
          userId: params.userId,
          name: params.name,
          balance: params.initialBalance || 0,
          type: params.type,
          isActive: params.isActive !== undefined ? params.isActive : true,
          allowNegative: params.allowNegative !== undefined ? params.allowNegative : false,
          creditLimit: params.creditLimit,
          dueDay: params.dueDay,
          closingDay: params.closingDay,
          bankId: params.bankId,
          icon: params.icon,
          color: params.color,
          metadata: params.metadata ? params.metadata as Prisma.InputJsonValue : undefined,
        },
      });

      return {
        success: true,
        wallet
      };
    } catch (error) {
      console.error("Erro ao criar carteira:", error);
      return {
        success: false,
        error: "Não foi possível criar a carteira"
      };
    }
  }

  /**
   * Busca uma carteira pelo ID
   */
  static async getWalletById(walletId: string, userId: string): Promise<Wallet | null> {
    try {
      const wallet = await db.wallet.findUnique({
        where: {
          id: walletId,
          userId,
        },
      });

      return wallet;
    } catch (error) {
      console.error("Erro ao buscar carteira:", error);
      return null;
    }
  }

  /**
   * Busca todas as carteiras de um usuário
   */
  static async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      const wallets = await db.wallet.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return wallets;
    } catch (error) {
      console.error("Erro ao buscar carteiras do usuário:", error);
      return [];
    }
  }

  /**
   * Busca carteiras com saldo e transações pendentes
   */
  static async getWalletsWithBalance(userId: string): Promise<WalletWithBalance[]> {
    try {
      // Buscar carteiras do usuário
      const wallets = await db.wallet.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Para cada carteira, calcular transações pendentes
      const walletsWithBalances: WalletWithBalance[] = await Promise.all(
        wallets.map(async (wallet) => {
          // Buscar transações pendentes
          const pendingTransactions = await db.transaction.findMany({
            where: {
              walletId: wallet.id,
              status: "PENDING",
            },
          });

          // Calcular valor pendente
          const pendingAmount = pendingTransactions.reduce((total, tx) => {
            if (tx.type === "EXPENSE" || tx.type === "INVESTMENT") {
              return total - tx.amount;
            } else {
              return total + tx.amount;
            }
          }, 0);

          return {
            ...wallet,
            availableBalance: wallet.balance - pendingAmount,
            pendingTransactions: pendingTransactions.length,
          };
        })
      );

      return walletsWithBalances;
    } catch (error) {
      console.error("Erro ao buscar carteiras com saldo:", error);
      return [];
    }
  }

  /**
   * Atualiza uma carteira existente
   */
  static async updateWallet(
    walletId: string,
    userId: string,
    data: Partial<Omit<Wallet, "id" | "userId">>
  ): Promise<WalletOperationResult> {
    try {
      // Verificar se a carteira existe e pertence ao usuário
      const existingWallet = await db.wallet.findUnique({
        where: {
          id: walletId,
          userId,
        },
      });

      if (!existingWallet) {
        return {
          success: false,
          error: "Carteira não encontrada"
        };
      }

      // Preparar dados para atualização
      const updateData: Prisma.WalletUpdateInput = { ...data };
      
      // Converter o metadata para o formato Json aceitável pelo Prisma
      if (data.metadata) {
        updateData.metadata = data.metadata as Prisma.InputJsonValue;
      }

      // Atualizar carteira
      const updatedWallet = await db.wallet.update({
        where: {
          id: walletId,
        },
        data: updateData,
      });

      return {
        success: true,
        wallet: updatedWallet
      };
    } catch (error) {
      console.error("Erro ao atualizar carteira:", error);
      return {
        success: false,
        error: "Não foi possível atualizar a carteira"
      };
    }
  }

  /**
   * Reconcilia o saldo da carteira com base nas transações
   */
  static async reconcileWalletBalance(walletId: string, userId: string): Promise<WalletOperationResult> {
    try {
      // Verificar se a carteira existe e pertence ao usuário
      const wallet = await db.wallet.findUnique({
        where: {
          id: walletId,
          userId,
        },
      });

      if (!wallet) {
        return {
          success: false,
          error: "Carteira não encontrada"
        };
      }

      // Calcular saldo com base nas transações usando a função simplificada
      const calculatedBalance = await calculateSimpleWalletBalance(walletId, userId);

      // Atualizar o saldo da carteira
      const updatedWallet = await db.wallet.update({
        where: {
          id: walletId,
        },
        data: {
          balance: calculatedBalance,
        },
      });

      return {
        success: true,
        wallet: updatedWallet
      };
    } catch (error) {
      console.error("Erro ao reconciliar saldo da carteira:", error);
      return {
        success: false,
        error: "Não foi possível reconciliar o saldo da carteira"
      };
    }
  }

  /**
   * Valida se uma operação pode ser executada na carteira
   */
  static async validateWalletOperation(
    walletId: string,
    amount: number,
    userId: string
  ): Promise<WalletValidationResult> {
    try {
      // Se o valor for positivo, sempre válido (depósito)
      if (amount >= 0) {
        return { isValid: true };
      }

      // Buscar a carteira
      const wallet = await db.wallet.findUnique({
        where: {
          id: walletId,
          userId,
        },
      });

      if (!wallet) {
        return {
          isValid: false,
          reason: "Carteira não encontrada"
        };
      }

      // Se a carteira permite saldo negativo, é válido
      if (wallet.allowNegative) {
        // Para cartões de crédito, verificar limite
        if (wallet.type === "CREDIT_CARD" && wallet.creditLimit) {
          // O valor absoluto é usado pois amount já é negativo
          const newBalance = wallet.balance + amount;
          
          if (Math.abs(newBalance) > wallet.creditLimit) {
            return {
              isValid: false,
              reason: "Operação excede o limite de crédito disponível"
            };
          }
        }
        
        return { isValid: true };
      }

      // Se não permite negativo, verificar se ficará negativo
      if (wallet.balance + amount < 0) {
        return {
          isValid: false,
          reason: "Saldo insuficiente para esta operação"
        };
      }

      return { isValid: true };
    } catch (error) {
      console.error("Erro ao validar operação:", error);
      return {
        isValid: false,
        reason: "Erro ao validar operação na carteira"
      };
    }
  }

  /**
   * Transfere valor entre duas carteiras
   */
  static async transferBetweenWallets(
    userId: string,
    sourceWalletId: string,
    targetWalletId: string,
    amount: number,
    description: string = "Transferência entre carteiras"
  ): Promise<TransferResult> {
    try {
      // Validar parâmetros básicos
      if (sourceWalletId === targetWalletId) {
        return {
          success: false,
          error: "As carteiras de origem e destino não podem ser iguais"
        };
      }

      if (amount <= 0) {
        return {
          success: false,
          error: "O valor da transferência deve ser maior que zero"
        };
      }

      // Buscar as carteiras
      const sourceWallet = await db.wallet.findUnique({
        where: {
          id: sourceWalletId,
          userId,
        },
      });

      const targetWallet = await db.wallet.findUnique({
        where: {
          id: targetWalletId,
          userId,
        },
      });

      if (!sourceWallet) {
        return {
          success: false,
          error: "Carteira de origem não encontrada"
        };
      }

      if (!targetWallet) {
        return {
          success: false,
          error: "Carteira de destino não encontrada"
        };
      }

      // Validar se a operação é possível
      const validation = await this.validateWalletOperation(
        sourceWalletId,
        -amount,
        userId
      );

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.reason || "Não é possível realizar esta transferência"
        };
      }

      // Criar as transações e atualizar os saldos em uma transação atômica
      const result = await db.$transaction(async (tx) => {
        // Criar transação de saída
        const outTransaction = await tx.transaction.create({
          data: {
            userId,
            walletId: sourceWalletId,
            name: `Transferência para ${targetWallet.name}`,
            amount,
            type: "EXPENSE",
            category: "TRANSFER",
            paymentMethod: "BANK_TRANSFER",
            date: new Date(),
            description,
            metadata: { transferType: "OUT", targetWalletId },
          },
        });

        // Criar transação de entrada
        const inTransaction = await tx.transaction.create({
          data: {
            userId,
            walletId: targetWalletId,
            name: `Transferência de ${sourceWallet.name}`,
            amount,
            type: "DEPOSIT",
            category: "TRANSFER",
            paymentMethod: "BANK_TRANSFER",
            date: new Date(),
            description,
            metadata: { transferType: "IN", sourceWalletId },
          },
        });

        // Atualizar os IDs relacionados
        await tx.transaction.update({
          where: {
            id: outTransaction.id,
          },
          data: {
            metadata: {
              ...(outTransaction.metadata as any || {}),
              relatedTransactionId: inTransaction.id,
            } as Prisma.JsonValue,
          },
        });

        await tx.transaction.update({
          where: {
            id: inTransaction.id,
          },
          data: {
            metadata: {
              ...(inTransaction.metadata as any || {}),
              relatedTransactionId: outTransaction.id,
            } as Prisma.JsonValue,
          },
        });

        // Atualizar saldos das carteiras
        await tx.wallet.update({
          where: {
            id: sourceWalletId,
          },
          data: {
            balance: {
              decrement: amount,
            },
          },
        });

        await tx.wallet.update({
          where: {
            id: targetWalletId,
          },
          data: {
            balance: {
              increment: amount,
            },
          },
        });

        return { outTransaction, inTransaction };
      });

      return {
        success: true,
        sourceTransaction: result.outTransaction,
        targetTransaction: result.inTransaction,
      };
    } catch (error) {
      console.error("Erro ao transferir entre carteiras:", error);
      return {
        success: false,
        error: "Não foi possível realizar a transferência"
      };
    }
  }

  /**
   * Exclui uma carteira
   */
  static async deleteWallet(
    walletId: string,
    userId: string,
    transferRemainingTo?: string
  ): Promise<WalletOperationResult> {
    try {
      // Verificar se a carteira existe e pertence ao usuário
      const wallet = await db.wallet.findUnique({
        where: {
          id: walletId,
          userId,
        },
        include: {
          transactions: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!wallet) {
        return {
          success: false,
          error: "Carteira não encontrada"
        };
      }

      // Se a carteira tiver transações e não foi especificado para onde transferir
      if (wallet.transactions.length > 0 && !transferRemainingTo) {
        return {
          success: false,
          error: "A carteira possui transações. Especifique outra carteira para transferir os dados ou exclua as transações primeiro."
        };
      }

      // Se foi solicitada a transferência para outra carteira
      if (transferRemainingTo) {
        // Verificar se a carteira de destino existe
        const targetWallet = await db.wallet.findUnique({
          where: {
            id: transferRemainingTo,
            userId,
          },
        });

        if (!targetWallet) {
          return {
            success: false,
            error: "Carteira de destino não encontrada"
          };
        }

        // Transferir o saldo restante, se houver
        if (wallet.balance > 0) {
          const transferResult = await this.transferBetweenWallets(
            userId,
            walletId,
            transferRemainingTo,
            wallet.balance,
            `Transferência automática por exclusão da carteira ${wallet.name}`
          );

          if (!transferResult.success) {
            return {
              success: false,
              error: `Não foi possível transferir o saldo: ${transferResult.error}`
            };
          }
        }

        // Transferir as transações para a nova carteira
        await db.transaction.updateMany({
          where: {
            walletId,
            userId,
          },
          data: {
            walletId: transferRemainingTo,
          },
        });
      }

      // Excluir a carteira
      await db.wallet.delete({
        where: {
          id: walletId,
        },
      });

      return {
        success: true
      };
    } catch (error) {
      console.error("Erro ao excluir carteira:", error);
      return {
        success: false,
        error: "Não foi possível excluir a carteira"
      };
    }
  }

  /**
   * Gera relatório de fluxo de caixa para uma carteira
   */
  static async generateCashFlowReport(
    walletId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    wallet: Wallet | null;
    transactions: any[];
    summary: {
      startingBalance: number;
      endingBalance: number;
      totalInflow: number;
      totalOutflow: number;
      netFlow: number;
    };
  }> {
    try {
      // Buscar a carteira
      const wallet = await db.wallet.findUnique({
        where: {
          id: walletId,
          userId,
        },
      });

      if (!wallet) {
        return {
          wallet: null,
          transactions: [],
          summary: {
            startingBalance: 0,
            endingBalance: 0,
            totalInflow: 0,
            totalOutflow: 0,
            netFlow: 0,
          },
        };
      }

      // Buscar transações no período
      const transactions = await db.transaction.findMany({
        where: {
          walletId,
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          date: "asc",
        },
        include: {
          categoryObj: true,
        },
      });

      // Calcular saldo inicial (transações antes da data de início)
      const previousTransactions = await db.transaction.findMany({
        where: {
          walletId,
          userId,
          date: {
            lt: startDate,
          },
        },
      });

      let startingBalance = 0;
      for (const tx of previousTransactions) {
        if (tx.type === "EXPENSE" || tx.type === "INVESTMENT") {
          startingBalance -= tx.amount;
        } else {
          startingBalance += tx.amount;
        }
      }

      // Calcular totais
      let totalInflow = 0;
      let totalOutflow = 0;

      for (const tx of transactions) {
        if (tx.type === "EXPENSE" || tx.type === "INVESTMENT") {
          totalOutflow += tx.amount;
        } else {
          totalInflow += tx.amount;
        }
      }

      const netFlow = totalInflow - totalOutflow;
      const endingBalance = startingBalance + netFlow;

      return {
        wallet,
        transactions,
        summary: {
          startingBalance,
          endingBalance,
          totalInflow,
          totalOutflow,
          netFlow,
        },
      };
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      return {
        wallet: null,
        transactions: [],
        summary: {
          startingBalance: 0,
          endingBalance: 0,
          totalInflow: 0,
          totalOutflow: 0,
          netFlow: 0,
        },
      };
    }
  }
} 