import { prisma } from "@/app/_lib/prisma";
import { GestaoClickService } from "@/app/_services/gestao-click-service";

/**
 * Classe para gerenciar agendamento de importações
 */
export class ImportScheduler {
  /**
   * Agenda uma importação do Gestão Click
   * 
   * @param userId ID do usuário
   * @param credentials Credenciais para acessar o Gestão Click
   * @param scheduledAt Data agendada para a importação (opcional, padrão é imediato)
   * @returns Resultado do agendamento
   */
  static async scheduleGestaoClickImport(
    userId: string,
    credentials: { apiKey: string; secretToken: string; apiUrl: string },
    scheduledAt?: Date
  ) {
    try {
      // Validar credenciais
      if (!credentials.apiKey || !credentials.secretToken || !credentials.apiUrl) {
        throw new Error("Credenciais inválidas para o Gestão Click");
      }
      
      // Se não for agendado, executar imediatamente
      if (!scheduledAt) {
        return await this.executeGestaoClickImport(userId, credentials);
      }
      
      // Caso contrário, agendar para execução futura
      const importJob = await prisma.importSchedule.create({
        data: {
          userId,
          source: "GESTAO_CLICK",
          status: "SCHEDULED",
          scheduledAt,
          credentials: credentials as any
        }
      });
      
      console.log(`[IMPORT] Importação do Gestão Click agendada para ${scheduledAt} (ID: ${importJob.id})`);
      
      return {
        success: true,
        scheduled: true,
        importId: importJob.id,
        scheduledAt
      };
    } catch (error: any) {
      console.error("[IMPORT] Erro ao agendar importação do Gestão Click:", error);
      throw new Error(`Falha ao agendar importação: ${error.message}`);
    }
  }
  
  /**
   * Executa uma importação do Gestão Click imediatamente
   * 
   * @param userId ID do usuário
   * @param credentials Credenciais para acessar o Gestão Click
   * @returns Resultado da importação
   */
  static async executeGestaoClickImport(
    userId: string,
    credentials: { apiKey: string; secretToken: string; apiUrl: string }
  ) {
    try {
      // Criar entrada no histórico de importação
      const importHistory = await prisma.importHistory.create({
        data: {
          userId,
          source: "GESTAO_CLICK",
          status: "IN_PROGRESS",
          totalItems: 0,
          details: { 
            credentials: {
              apiKey: credentials.apiKey ? "***" : null,
              secretToken: credentials.secretToken ? "***" : null,
              apiUrl: credentials.apiUrl
            }
          }
        }
      });
      
      console.log(`[IMPORT] Iniciando importação do Gestão Click (ID: ${importHistory.id})`);
      
      // Criar serviço e executar importação
      const service = new GestaoClickService({
        apiKey: credentials.apiKey,
        secretToken: credentials.secretToken,
        apiUrl: credentials.apiUrl,
        userId
      });
      
      // Executar importação
      const result = await service.importAllData();
      
      // Atualizar histórico com sucesso
      await prisma.importHistory.update({
        where: { id: importHistory.id },
        data: {
          status: "SUCCESS",
          totalItems: 
            result.wallets.fromAccounts.totalCreated +
            result.wallets.fromCostCenters.totalCreated +
            result.transactions.totalImported,
          details: {
            wallets: {
              accounts: result.wallets.fromAccounts.totalCreated,
              costCenters: result.wallets.fromCostCenters.totalCreated
            },
            transactions: result.transactions.totalImported,
            errors: result.transactions.failed
          }
        }
      });
      
      console.log(`[IMPORT] Importação do Gestão Click concluída com sucesso (ID: ${importHistory.id})`);
      
      return {
        success: true,
        scheduled: false,
        importId: importHistory.id,
        result
      };
    } catch (error: any) {
      console.error("[IMPORT] Erro ao executar importação do Gestão Click:", error);
      
      // Atualizar histórico com erro
      try {
        await prisma.importHistory.update({
          where: { id: importHistory.id },
          data: {
            status: "ERROR",
            details: {
              error: error.message || "Erro desconhecido"
            }
          }
        });
      } catch (historyError) {
        console.error("[IMPORT] Erro ao atualizar histórico de importação:", historyError);
      }
      
      throw new Error(`Falha na importação: ${error.message}`);
    }
  }
} 