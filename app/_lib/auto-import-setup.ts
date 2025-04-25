/**
 * Módulo para configurar automaticamente a importação do Gestão Click
 * Este módulo é carregado na inicialização do servidor
 */

import { prisma } from "./prisma";
import { GestaoClickService } from "../_services/gestao-click-service";
import { ImportSchedulerService } from "../_services/import-scheduler-service";
import { createServerNotification } from "./server-notifications";
import { NotificationType, NotificationPriority } from "../_types/notification";

// Obtém credenciais do ambiente
const GESTAO_CLICK_API_KEY = process.env.GESTAO_CLICK_API_KEY;
const GESTAO_CLICK_SECRET_TOKEN = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;
const GESTAO_CLICK_API_URL = process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com";
const AUTO_IMPORT_ENABLED = process.env.AUTO_IMPORT_ENABLED === "true";

/**
 * Configura importação automática para todos os usuários
 * Este método é chamado durante a inicialização do servidor
 */
export async function setupAutoImport() {
  // Verificar se a importação automática está habilitada
  if (!AUTO_IMPORT_ENABLED) {
    console.log("[AUTO_IMPORT] Importação automática desabilitada. Configure AUTO_IMPORT_ENABLED=true no .env para ativá-la.");
    return;
  }

  // Verificar se as credenciais estão configuradas
  if (!GESTAO_CLICK_API_KEY) {
    console.error("[AUTO_IMPORT] Credenciais do Gestão Click não encontradas nas variáveis de ambiente.");
    console.error("[AUTO_IMPORT] Adicione GESTAO_CLICK_API_KEY e GESTAO_CLICK_SECRET_ACCESS_TOKEN ao arquivo .env");
    return;
  }

  try {
    console.log("[AUTO_IMPORT] Iniciando configuração de importação automática do Gestão Click...");
    
    // Buscar todos os usuários do sistema
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    if (users.length === 0) {
      console.log("[AUTO_IMPORT] Nenhum usuário encontrado no sistema.");
      return;
    }
    
    console.log(`[AUTO_IMPORT] Configurando importação automática para ${users.length} usuários.`);
    
    // Para cada usuário, configurar integração e agendamento
    for (const user of users) {
      await configureUserAutoImport(user.id, user.email);
    }
    
    console.log("[AUTO_IMPORT] Configuração de importação automática concluída.");
  } catch (error) {
    console.error("[AUTO_IMPORT] Erro durante configuração da importação automática:", error);
  }
}

/**
 * Configura importação automática para um usuário específico
 */
async function configureUserAutoImport(userId: string, email: string) {
  try {
    console.log(`[AUTO_IMPORT] Configurando usuário: ${email}`);
    
    // 1. Verificar/Criar configuração de integração
    await configureIntegration(userId);
    
    // 2. Configurar agendamento automático (diário)
    await configureSchedule(userId);
    
    // 3. Notificar o usuário
    await createServerNotification({
      userId,
      title: "Importação automática configurada",
      message: "A importação automática de transações do Gestão Click foi configurada no sistema.",
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      link: "/transactions",
      metadata: {
        source: "GESTAO_CLICK",
        feature: "auto_import",
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error(`[AUTO_IMPORT] Erro ao configurar importação para usuário ${email}:`, error);
  }
}

/**
 * Configura a integração com o Gestão Click para um usuário
 */
async function configureIntegration(userId: string): Promise<any> {
  // Verificar se já existe configuração
  const existingSettings = await prisma.integrationSettings.findFirst({
    where: {
      userId,
      provider: 'gestao-click',
      walletId: 'global',
    },
  });
  
  if (existingSettings) {
    console.log(`[AUTO_IMPORT] Atualizando configuração de integração para usuário ${userId}`);
    
    // Atualizar configurações existentes
    return prisma.integrationSettings.update({
      where: { id: existingSettings.id },
      data: {
        active: true,
        metadata: {
          apiKey: GESTAO_CLICK_API_KEY,
          secretToken: GESTAO_CLICK_SECRET_TOKEN,
          apiUrl: GESTAO_CLICK_API_URL,
          autoSync: true,
          syncFrequency: "daily",
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } else {
    console.log(`[AUTO_IMPORT] Criando nova configuração de integração para usuário ${userId}`);
    
    // Criar novas configurações
    return prisma.integrationSettings.create({
      data: {
        userId,
        provider: 'gestao-click',
        walletId: 'global',
        active: true,
        metadata: {
          apiKey: GESTAO_CLICK_API_KEY,
          secretToken: GESTAO_CLICK_SECRET_TOKEN,
          apiUrl: GESTAO_CLICK_API_URL,
          autoSync: true,
          syncFrequency: "daily",
          lastUpdated: new Date().toISOString()
        }
      }
    });
  }
}

/**
 * Configura agendamento diário para um usuário
 */
async function configureSchedule(userId: string): Promise<void> {
  // Verificar se já existe um agendamento ativo
  const existingSchedule = await prisma.importSchedule.findFirst({
    where: {
      userId,
      source: "GESTAO_CLICK",
      status: "SCHEDULED"
    }
  });
  
  if (existingSchedule) {
    console.log(`[AUTO_IMPORT] Agendamento já existe para usuário ${userId}`);
    return;
  }
  
  // Definir horário para importação (3:00 AM)
  const scheduleTime = "03:00";
  
  // Criar serviço de agendamento
  const schedulerService = new ImportSchedulerService();
  
  console.log(`[AUTO_IMPORT] Criando agendamento para usuário ${userId}`);
  
  // Criar agendamento diário
  await schedulerService.createGestaoClickSchedule(
    userId,
    {
      frequency: "daily",
      time: scheduleTime,
      credentials: {
        apiKey: GESTAO_CLICK_API_KEY,
        secretToken: GESTAO_CLICK_SECRET_TOKEN,
        apiUrl: GESTAO_CLICK_API_URL
      }
    }
  );
} 