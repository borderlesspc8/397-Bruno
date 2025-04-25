import { db } from "@/app/_lib/db";
import { Prisma } from "@prisma/client";
import { TransactionService } from "./transaction-service";
import { addDays, addMonths, addWeeks, addYears, isBefore, startOfDay } from "date-fns";

// Definir enumerações
export enum RecurringFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUALLY = "ANNUALLY"
}

// Interfaces para os parâmetros
export interface CreateRecurringTransactionParams {
  userId: string;
  walletId: string;
  amount: number;
  description: string;
  type: string;
  category: string;
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  dayOfMonth?: number;
  dayOfWeek?: number;
  paymentMethod?: string;
  metadata?: Record<string, any>;
}

// Interface para o resultado da operação
interface RecurringTransactionOperationResult {
  success: boolean;
  recurringTransaction?: any;
  error?: string;
}

export class RecurringTransactionService {
  /**
   * Cria uma nova transação recorrente
   */
  static async createRecurringTransaction(
    params: CreateRecurringTransactionParams
  ): Promise<RecurringTransactionOperationResult> {
    try {
      // Validate parameters
      if (!params.userId || !params.walletId || !params.amount || !params.frequency) {
        return { 
          success: false, 
          error: "Campos obrigatórios: userId, walletId, amount, frequency" 
        };
      }

      // Preparar metadados
      const metadata = params.metadata ? params.metadata as Prisma.JsonValue : undefined;

      // Criar a transação recorrente
      const recurringTransaction = await db.recurringTransaction.create({
        data: {
          userId: params.userId,
          walletId: params.walletId,
          amount: params.amount,
          description: params.description,
          type: params.type,
          category: params.category,
          frequency: params.frequency,
          startDate: params.startDate,
          endDate: params.endDate,
          dayOfMonth: params.dayOfMonth,
          dayOfWeek: params.dayOfWeek,
          paymentMethod: params.paymentMethod,
          metadata,
          active: true,
          lastProcessedDate: null
        }
      });

      return {
        success: true,
        recurringTransaction
      };
    } catch (error) {
      console.error("Erro ao criar transação recorrente:", error);
      return {
        success: false,
        error: "Erro ao criar transação recorrente"
      };
    }
  }

  /**
   * Obtém uma transação recorrente pelo ID
   */
  static async getRecurringTransactionById(id: string, userId: string) {
    try {
      return await db.recurringTransaction.findUnique({
        where: {
          id,
          userId
        }
      });
    } catch (error) {
      console.error("Erro ao buscar transação recorrente:", error);
      throw error;
    }
  }

  /**
   * Obtém transações recorrentes do usuário
   */
  static async getRecurringTransactions(userId: string, includeInactive: boolean = false) {
    try {
      return await db.recurringTransaction.findMany({
        where: {
          userId,
          ...(includeInactive ? {} : { active: true })
        },
        orderBy: {
          nextOccurrence: 'asc'
        }
      });
    } catch (error) {
      console.error("Erro ao buscar transações recorrentes:", error);
      throw error;
    }
  }

  /**
   * Atualiza uma transação recorrente existente
   */
  static async updateRecurringTransaction(
    id: string,
    userId: string,
    updateData: Partial<Omit<CreateRecurringTransactionParams, "userId">>
  ): Promise<RecurringTransactionOperationResult> {
    try {
      // Verificar se a transação recorrente existe
      const recurringTransaction = await db.recurringTransaction.findUnique({
        where: {
          id,
          userId
        }
      });

      if (!recurringTransaction) {
        return { success: false, error: "Transação recorrente não encontrada" };
      }

      // Preparar metadados
      const metadata = updateData.metadata 
        ? updateData.metadata as Prisma.JsonValue 
        : undefined;

      // Atualizar a transação recorrente
      const updatedRecurringTransaction = await db.recurringTransaction.update({
        where: { id },
        data: {
          ...(updateData.amount !== undefined && { amount: updateData.amount }),
          ...(updateData.description !== undefined && { description: updateData.description }),
          ...(updateData.type !== undefined && { type: updateData.type }),
          ...(updateData.category !== undefined && { category: updateData.category }),
          ...(updateData.frequency !== undefined && { frequency: updateData.frequency }),
          ...(updateData.startDate !== undefined && { startDate: updateData.startDate }),
          ...(updateData.endDate !== undefined && { endDate: updateData.endDate }),
          ...(updateData.dayOfMonth !== undefined && { dayOfMonth: updateData.dayOfMonth }),
          ...(updateData.dayOfWeek !== undefined && { dayOfWeek: updateData.dayOfWeek }),
          ...(updateData.paymentMethod !== undefined && { paymentMethod: updateData.paymentMethod }),
          ...(metadata !== undefined && { metadata }),
          ...(updateData.walletId !== undefined && { walletId: updateData.walletId })
        }
      });

      return {
        success: true,
        recurringTransaction: updatedRecurringTransaction
      };
    } catch (error) {
      console.error("Erro ao atualizar transação recorrente:", error);
      return {
        success: false,
        error: "Erro ao atualizar transação recorrente"
      };
    }
  }

  /**
   * Ativa ou desativa uma transação recorrente
   */
  static async toggleRecurringTransaction(
    id: string,
    userId: string,
    active: boolean
  ): Promise<RecurringTransactionOperationResult> {
    try {
      // Verificar se a transação recorrente existe
      const recurringTransaction = await db.recurringTransaction.findUnique({
        where: {
          id,
          userId
        }
      });

      if (!recurringTransaction) {
        return { success: false, error: "Transação recorrente não encontrada" };
      }

      // Atualizar estado de ativação
      const updatedRecurringTransaction = await db.recurringTransaction.update({
        where: { id },
        data: { active }
      });

      return {
        success: true,
        recurringTransaction: updatedRecurringTransaction
      };
    } catch (error) {
      console.error("Erro ao atualizar status da transação recorrente:", error);
      return {
        success: false,
        error: "Erro ao atualizar status da transação recorrente"
      };
    }
  }

  /**
   * Exclui uma transação recorrente
   */
  static async deleteRecurringTransaction(
    id: string,
    userId: string
  ): Promise<RecurringTransactionOperationResult> {
    try {
      // Verificar se a transação recorrente existe
      const recurringTransaction = await db.recurringTransaction.findUnique({
        where: {
          id,
          userId
        }
      });

      if (!recurringTransaction) {
        return { success: false, error: "Transação recorrente não encontrada" };
      }

      // Excluir a transação recorrente
      await db.recurringTransaction.delete({
        where: { id }
      });

      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir transação recorrente:", error);
      return {
        success: false,
        error: "Erro ao excluir transação recorrente"
      };
    }
  }

  /**
   * Gera uma transação única a partir de uma transação recorrente
   */
  static async generateTransaction(recurringTransactionId: string, userId: string, date?: Date): Promise<RecurringTransactionOperationResult> {
    try {
      // Buscar a transação recorrente
      const recurringTx = await this.getRecurringTransactionById(recurringTransactionId, userId);
      
      if (!recurringTx) {
        return { success: false, error: "Transação recorrente não encontrada" };
      }
      
      // Criar a transação
      const result = await TransactionService.createTransaction({
        userId: recurringTx.userId,
        walletId: recurringTx.walletId,
        amount: recurringTx.amount,
        description: `[Manual] ${recurringTx.description}`,
        date: date || new Date(),
        type: recurringTx.type,
        category: recurringTx.category,
        paymentMethod: recurringTx.paymentMethod || undefined,
        metadata: {
          recurringTransactionId: recurringTx.id,
          isRecurring: true,
          manuallyGenerated: true,
          ...((recurringTx.metadata as Record<string, any>) || {})
        }
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Atualizar a data de processamento
      await db.recurringTransaction.update({
        where: { id: recurringTransactionId },
        data: {
          lastProcessedDate: new Date()
        }
      });

      return {
        success: true,
        recurringTransaction: {
          ...recurringTx,
          generatedTransaction: result.transaction
        }
      };
    } catch (error) {
      console.error("Erro ao gerar transação a partir de recorrente:", error);
      return {
        success: false,
        error: "Erro ao gerar transação"
      };
    }
  }

  /**
   * Processa transações recorrentes devidas
   */
  static async processRecurringTransactions(): Promise<number> {
    try {
      const today = startOfDay(new Date());
      let processedCount = 0;

      // Buscar transações recorrentes ativas e devidas
      const dueRecurringTransactions = await db.recurringTransaction.findMany({
        where: {
          active: true,
          nextOccurrence: {
            lte: today
          }
        }
      });

      // Processar cada transação recorrente
      for (const recurringTx of dueRecurringTransactions) {
        try {
          // Criar a transação
          const result = await TransactionService.createTransaction({
            userId: recurringTx.userId,
            walletId: recurringTx.walletId,
            amount: recurringTx.amount,
            description: `[Auto] ${recurringTx.description}`,
            date: new Date(),
            type: recurringTx.type,
            category: recurringTx.category,
            paymentMethod: recurringTx.paymentMethod || undefined,
            metadata: {
              recurringTransactionId: recurringTx.id,
              isRecurring: true,
              ...((recurringTx.metadata as Record<string, any>) || {})
            }
          });

          if (result.success) {
            processedCount++;
            
            // Calcular próxima ocorrência
            const nextDate = this.calculateNextOccurrence(
              recurringTx.frequency as RecurringFrequency,
              recurringTx.startDate,
              recurringTx.dayOfMonth,
              recurringTx.dayOfWeek
            );

            // Atualizar a data de processamento e próxima ocorrência
            await db.recurringTransaction.update({
              where: { id: recurringTx.id },
              data: {
                lastProcessedDate: today,
                nextOccurrence: nextDate,
                // Se a data de término estiver definida e a próxima ocorrência for após ela, desativar
                active: recurringTx.endDate ? isBefore(nextDate, recurringTx.endDate) : true
              }
            });
          }
        } catch (error) {
          console.error(`Erro ao processar transação recorrente ${recurringTx.id}:`, error);
          // Continuar com a próxima transação mesmo que uma falhe
        }
      }

      return processedCount;
    } catch (error) {
      console.error("Erro ao processar transações recorrentes:", error);
      throw error;
    }
  }

  /**
   * Calcula a próxima ocorrência com base na frequência
   */
  private static calculateNextOccurrence(
    frequency: RecurringFrequency,
    startDate: Date,
    dayOfMonth?: number | null,
    dayOfWeek?: number | null
  ): Date {
    const today = startOfDay(new Date());
    let nextDate: Date;

    switch (frequency) {
      case RecurringFrequency.DAILY:
        nextDate = addDays(today, 1);
        break;
      
      case RecurringFrequency.WEEKLY:
        // Se o dia da semana foi especificado, usar
        if (dayOfWeek !== undefined && dayOfWeek !== null) {
          nextDate = this.getNextDayOfWeek(today, dayOfWeek);
        } else {
          nextDate = addWeeks(today, 1);
        }
        break;
      
      case RecurringFrequency.BIWEEKLY:
        nextDate = addWeeks(today, 2);
        break;
      
      case RecurringFrequency.MONTHLY:
        // Se o dia do mês foi especificado, usar
        if (dayOfMonth !== undefined && dayOfMonth !== null) {
          nextDate = this.getNextDayOfMonth(today, dayOfMonth);
        } else {
          // Usar o mesmo dia do mês que a data de início
          const originalDay = startDate.getDate();
          nextDate = this.getNextDayOfMonth(today, originalDay);
        }
        break;
      
      case RecurringFrequency.QUARTERLY:
        nextDate = addMonths(today, 3);
        break;
      
      case RecurringFrequency.ANNUALLY:
        nextDate = addYears(today, 1);
        break;
      
      default:
        nextDate = addMonths(today, 1);
    }

    return nextDate;
  }

  /**
   * Obtém o próximo dia específico da semana
   */
  private static getNextDayOfWeek(fromDate: Date, dayOfWeek: number): Date {
    const date = new Date(fromDate);
    const currentDay = date.getDay();
    
    // Dias até o próximo dia da semana desejado
    let daysToAdd = dayOfWeek - currentDay;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // Ir para a próxima semana
    }
    
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  /**
   * Obtém o próximo dia específico do mês
   */
  private static getNextDayOfMonth(fromDate: Date, dayOfMonth: number): Date {
    const date = new Date(fromDate);
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    
    // Definir para o dia do mês atual
    date.setDate(dayOfMonth);
    
    // Se a data resultante for no passado, avançar um mês
    if (date < fromDate) {
      date.setMonth(currentMonth + 1);
    }
    
    // Ajustar se o dia não existir no mês (por exemplo, 31 de fevereiro)
    const newMonth = date.getMonth();
    const expectedMonth = (currentMonth + 1) % 12;
    
    if (newMonth !== currentMonth && newMonth !== expectedMonth) {
      // Definir para o último dia do mês anterior
      date.setDate(0);
    }
    
    return date;
  }
}