import { prisma } from "@/app/_lib/prisma";
import { ImportHistory, ImportStatus } from "@/app/types/import-history";

/**
 * Serviço para gerenciar o histórico de importações
 */
export class ImportHistoryService {
  /**
   * Cria um novo registro de importação
   * @param data Dados da importação
   * @returns O registro de importação criado
   */
  async createImportRecord(data: Omit<ImportHistory, "id" | "createdAt" | "updatedAt">): Promise<ImportHistory> {
    return prisma.importHistory.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Atualiza o status de uma importação
   * @param id ID do registro de importação
   * @param status Novo status
   * @param data Dados adicionais para atualizar
   * @returns O registro atualizado
   */
  async updateImportStatus(
    id: string, 
    status: ImportStatus, 
    data?: Partial<ImportHistory>
  ): Promise<ImportHistory> {
    const now = new Date();
    
    // Se estiver concluindo a importação, calcular duração
    if (status === ImportStatus.COMPLETED || status === ImportStatus.FAILED || status === ImportStatus.CANCELLED) {
      const current = await prisma.importHistory.findUnique({
        where: { id },
        select: { startTime: true },
      });
      
      if (current && current.startTime) {
        const durationInSeconds = Math.round((now.getTime() - current.startTime.getTime()) / 1000);
        
        return prisma.importHistory.update({
          where: { id },
          data: {
            ...data,
            status,
            endTime: now,
            duration: durationInSeconds,
            updatedAt: now,
          },
        });
      }
    }
    
    return prisma.importHistory.update({
      where: { id },
      data: {
        ...data,
        status,
        updatedAt: now,
      },
    });
  }

  /**
   * Incrementa contadores de transações
   * @param id ID do registro de importação
   * @param counters Contadores a incrementar
   * @returns O registro atualizado
   */
  async incrementTransactionCounters(
    id: string,
    counters: {
      totalTransactions?: number;
      importedTransactions?: number;
      skippedTransactions?: number;
      errorTransactions?: number;
    }
  ): Promise<ImportHistory> {
    const current = await prisma.importHistory.findUnique({
      where: { id },
      select: {
        totalTransactions: true,
        importedTransactions: true,
        skippedTransactions: true,
        errorTransactions: true,
      },
    });
    
    if (!current) {
      throw new Error(`Registro de importação não encontrado: ${id}`);
    }
    
    return prisma.importHistory.update({
      where: { id },
      data: {
        totalTransactions: (counters.totalTransactions || 0) + current.totalTransactions,
        importedTransactions: (counters.importedTransactions || 0) + current.importedTransactions,
        skippedTransactions: (counters.skippedTransactions || 0) + current.skippedTransactions,
        errorTransactions: (counters.errorTransactions || 0) + current.errorTransactions,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Busca o histórico de importações do usuário
   * @param userId ID do usuário
   * @param options Opções de filtro
   * @returns Lista de importações e total
   */
  async getImportHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      source?: string;
      startDate?: Date;
      endDate?: Date;
      walletId?: string;
      status?: ImportStatus[];
    }
  ): Promise<{ imports: ImportHistory[]; total: number }> {
    const { limit = 10, offset = 0, source, startDate, endDate, walletId, status } = options || {};
    
    const where: any = { userId };
    
    if (source) {
      where.source = source;
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.createdAt = {
        gte: startDate,
      };
    } else if (endDate) {
      where.createdAt = {
        lte: endDate,
      };
    }
    
    if (walletId) {
      where.walletId = walletId;
    }
    
    if (status && status.length > 0) {
      where.status = {
        in: status,
      };
    }
    
    const [imports, total] = await Promise.all([
      prisma.importHistory.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.importHistory.count({ where }),
    ]);
    
    return { imports, total };
  }

  /**
   * Obtém resumo das importações do usuário por status
   * @param userId ID do usuário
   * @returns Resumo das importações
   */
  async getImportSummary(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    cancelled: number;
    lastWeekCount: number;
    lastMonthCount: number;
  }> {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      total,
      pending,
      inProgress,
      completed,
      failed,
      cancelled,
      lastWeekCount,
      lastMonthCount
    ] = await Promise.all([
      prisma.importHistory.count({ where: { userId } }),
      prisma.importHistory.count({ where: { userId, status: ImportStatus.PENDING } }),
      prisma.importHistory.count({ where: { userId, status: ImportStatus.IN_PROGRESS } }),
      prisma.importHistory.count({ where: { userId, status: ImportStatus.COMPLETED } }),
      prisma.importHistory.count({ where: { userId, status: ImportStatus.FAILED } }),
      prisma.importHistory.count({ where: { userId, status: ImportStatus.CANCELLED } }),
      prisma.importHistory.count({ where: { userId, createdAt: { gte: lastWeek } } }),
      prisma.importHistory.count({ where: { userId, createdAt: { gte: lastMonth } } }),
    ]);
    
    return {
      total,
      pending,
      inProgress,
      completed,
      failed,
      cancelled,
      lastWeekCount,
      lastMonthCount,
    };
  }

  /**
   * Busca os detalhes de uma importação específica
   * @param id ID da importação
   * @param userId ID do usuário
   * @returns Detalhes da importação
   */
  async getImportDetails(id: string, userId: string): Promise<ImportHistory | null> {
    return prisma.importHistory.findUnique({
      where: {
        id,
        userId, // Garantir que pertence ao usuário
      },
    });
  }
} 