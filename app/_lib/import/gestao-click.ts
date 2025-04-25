/**
 * Módulo para importação de transações do Gestão Click
 */
import { prisma } from "@/app/_lib/prisma";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { randomUUID } from "crypto";

/**
 * Interface para os parâmetros de importação
 */
interface ImportGestaoClickOptions {
  userId: string;
  gestaoClickService: GestaoClickService;
  startDate?: Date;
  endDate?: Date;
  maxTransactions?: number;
}

/**
 * Importa transações do Gestão Click
 */
export async function importGestaoClickTransactions(options: ImportGestaoClickOptions) {
  try {
    const { userId, gestaoClickService, startDate, endDate, maxTransactions } = options;
    
    // ID de importação para rastreamento
    const importId = randomUUID();
    
    console.log(`[IMPORT_GESTAO_CLICK] Iniciando importação ${importId} para usuário ${userId}`);
    
    // Criar registro de importação
    const importRecord = await prisma.importHistory.create({
      data: {
        userId,
        source: "GESTAO_CLICK",
        status: "RUNNING",
        details: {
          importId,
          startDate: startDate ? startDate.toISOString() : null,
          endDate: endDate ? endDate.toISOString() : null,
          maxTransactions
        }
      }
    });
    
    console.log(`[IMPORT_GESTAO_CLICK] Criado registro de importação: ${importRecord.id}`);
    
    try {
      // Importar carteiras e transações
      const result = await gestaoClickService.importAllData();
      
      console.log(`[IMPORT_GESTAO_CLICK] Importação concluída:`, {
        walletsFromAccounts: result.wallets.fromAccounts.totalCreated,
        walletsFromCostCenters: result.wallets.fromCostCenters.totalCreated,
        transactionsImported: result.transactions.totalImported
      });
      
      // Atualizar registro de importação
      await prisma.importHistory.update({
        where: { id: importRecord.id },
        data: {
          status: "SUCCESS",
          transactionsProcessed: result.transactions.totalImported + result.transactions.skipped,
          transactionsImported: result.transactions.totalImported,
          walletsProcessed: result.wallets.fromAccounts.totalCreated + result.wallets.fromCostCenters.totalCreated,
          walletsCreated: result.wallets.fromAccounts.totalCreated + result.wallets.fromCostCenters.totalCreated,
          details: {
            importId,
            startDate: startDate ? startDate.toISOString() : null,
            endDate: endDate ? endDate.toISOString() : null,
            result
          }
        }
      });
      
      return {
        success: true,
        message: `Importação concluída com sucesso. Importadas ${result.transactions.totalImported} transações.`,
        data: {
          wallets: {
            total: result.wallets.fromAccounts.totalCreated + result.wallets.fromCostCenters.totalCreated,
            created: result.wallets.fromAccounts.totalCreated + result.wallets.fromCostCenters.totalCreated,
            existing: 0
          },
          transactions: {
            total: result.transactions.totalImported + result.transactions.skipped,
            imported: result.transactions.totalImported,
            skipped: result.transactions.skipped,
            details: result.transactions.details.map(detail => ({
              walletId: detail.walletId,
              walletName: detail.walletName,
              newTransactions: detail.newTransactions
            }))
          }
        }
      };
    } catch (error) {
      console.error(`[IMPORT_GESTAO_CLICK] Erro na importação ${importId}:`, error);
      
      // Atualizar registro de importação com erro
      await prisma.importHistory.update({
        where: { id: importRecord.id },
        data: {
          status: "ERROR",
          details: {
            importId,
            startDate: startDate ? startDate.toISOString() : null,
            endDate: endDate ? endDate.toISOString() : null,
            error: (error as Error).message
          }
        }
      });
      
      return {
        success: false,
        message: `Erro na importação: ${(error as Error).message}`
      };
    }
  } catch (error) {
    console.error("[IMPORT_GESTAO_CLICK] Erro global:", error);
    return {
      success: false,
      message: `Erro na importação: ${(error as Error).message}`
    };
  }
} 