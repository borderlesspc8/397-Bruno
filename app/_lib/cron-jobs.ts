/**
 * Serviço de agendamento de tarefas (CRON jobs)
 * Este módulo gerencia a execução periódica de tarefas automatizadas do sistema
 */

import { prisma } from "./prisma";
import { GestaoClickService } from "../_services/gestao-click-service";
import { createServerNotification } from "./server-notifications";
import { NotificationType, NotificationPriority } from "../_types/notification";

// Interface para configurações de sincronização
interface SyncSettings {
  userId: string;
  apiKey: string;
  secretToken?: string;
  apiUrl?: string;
  syncFrequency: string;
  lastSync?: string;
}

/**
 * Executa sincronização automática de transações do Gestão Click
 * para todos os usuários com sincronização habilitada
 */
export async function runAutoSyncGestaoClick(): Promise<{
  processed: number;
  success: number;
  failed: number;
  newTransactions: number;
  details: any[];
}> {
  try {
    console.log("[CRON_JOB] Iniciando sincronização automática do Gestão Click");
    
    // Resultado da execução
    const result = {
      processed: 0,
      success: 0,
      failed: 0,
      newTransactions: 0,
      details: [] as any[]
    };
    
    // Buscar todas as configurações de sincronização ativas
    const activeSettings = await prisma.integrationSettings.findMany({
      where: {
        provider: 'gestao-click',
        walletId: 'global',
        active: true
      },
      select: {
        id: true,
        userId: true,
        metadata: true
      }
    });
    
    console.log(`[CRON_JOB] Encontradas ${activeSettings.length} configurações ativas para sincronização`);
    result.processed = activeSettings.length;
    
    // Para cada configuração, executar sincronização
    for (const setting of activeSettings) {
      try {
        const metadata = setting.metadata as Record<string, any>;
        
        // Verificar se é hora de sincronizar com base na frequência
        if (!shouldRunSync(metadata)) {
          console.log(`[CRON_JOB] Sincronização ignorada para usuário ${setting.userId} - ainda não é hora`);
          continue;
        }
        
        // Extrair configurações necessárias
        const syncSettings: SyncSettings = {
          userId: setting.userId,
          apiKey: metadata.apiKey,
          secretToken: metadata.secretToken,
          apiUrl: metadata.apiUrl,
          syncFrequency: metadata.syncFrequency || 'daily',
          lastSync: metadata.lastSync
        };
        
        if (!syncSettings.apiKey) {
          console.warn(`[CRON_JOB] Configuração incompleta para usuário ${setting.userId} - API key não encontrada`);
          continue;
        }
        
        // Iniciar sincronização
        console.log(`[CRON_JOB] Iniciando sincronização para usuário ${setting.userId}`);
        
        // Criar serviço de gestão click
        const gestaoClickService = new GestaoClickService({
          apiKey: syncSettings.apiKey,
          secretToken: syncSettings.secretToken,
          apiUrl: syncSettings.apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
          userId: syncSettings.userId
        });
        
        // Executar importação automática
        const syncResult = await gestaoClickService.autoImportTransactions();
        
        // Atualizar contador de transações
        result.newTransactions += syncResult.newTransactions;
        result.success++;
        
        // Adicionar ao log de detalhes
        result.details.push({
          userId: syncSettings.userId,
          success: true,
          newTransactions: syncResult.newTransactions,
          timestamp: new Date().toISOString()
        });
        
        // Notificar o usuário se houver novas transações
        if (syncResult.newTransactions > 0) {
          await createServerNotification({
            userId: syncSettings.userId,
            title: "Novas transações importadas",
            message: `${syncResult.newTransactions} novas transações foram importadas automaticamente do Gestão Click`,
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.MEDIUM,
            link: "/transactions",
            metadata: {
              source: "GESTAO_CLICK",
              feature: "auto_sync",
              type: "scheduled",
              result: syncResult,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        console.log(`[CRON_JOB] Sincronização concluída para usuário ${setting.userId} - ${syncResult.newTransactions} novas transações`);
      } catch (error: any) {
        console.error(`[CRON_JOB] Erro na sincronização para usuário ${setting.userId}:`, error);
        
        result.failed++;
        result.details.push({
          userId: setting.userId,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        // Notificar erro
        try {
          await createServerNotification({
            userId: setting.userId,
            title: "Erro na sincronização automática",
            message: `Ocorreu um erro ao sincronizar suas transações do Gestão Click: ${error.message}`,
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.HIGH,
            link: "/settings/integrations",
            metadata: {
              source: "GESTAO_CLICK",
              feature: "auto_sync",
              type: "scheduled",
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (notifyError) {
          console.error(`[CRON_JOB] Erro ao notificar usuário ${setting.userId}:`, notifyError);
        }
      }
    }
    
    console.log(`[CRON_JOB] Sincronização automática concluída. Resultado: ${result.success} sucessos, ${result.failed} falhas, ${result.newTransactions} novas transações`);
    
    return result;
  } catch (error) {
    console.error("[CRON_JOB] Erro global na sincronização automática:", error);
    throw error;
  }
}

/**
 * Verifica se é hora de executar a sincronização com base na frequência configurada
 */
function shouldRunSync(metadata: Record<string, any>): boolean {
  // Se não houver registro de última sincronização, executar
  if (!metadata.lastSync) {
    return true;
  }
  
  const lastSyncDate = new Date(metadata.lastSync);
  const now = new Date();
  const diffHours = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);
  
  // Determinar intervalo mínimo com base na frequência
  const syncFrequency = metadata.syncFrequency || 'daily';
  
  switch (syncFrequency) {
    case 'hourly':
      return diffHours >= 1; // A cada hora
    case 'daily':
      return diffHours >= 24; // A cada dia
    case 'weekly':
      return diffHours >= 168; // A cada semana (7 dias)
    default:
      return diffHours >= 24; // Padrão: diário
  }
} 
