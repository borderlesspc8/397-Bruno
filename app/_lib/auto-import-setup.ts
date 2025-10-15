/**
 * Módulo para configurar automaticamente a importação do Gestão Click
 * Este módulo é carregado na inicialização do servidor
 */

import { prisma } from "./prisma";
import { GestaoClickService } from "../_services/gestao-click-service";
import { createServerNotification } from "./server-notifications";
import { NotificationType, NotificationPriority } from "../_types/notification";
import { env } from './env';

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
  try {
    // Verifica se o auto-import está habilitado
    if (env.AUTO_IMPORT_ENABLED !== 'true') {
      return;
    }

    // Verifica as credenciais do Gestão Click
    const accessToken = env.GESTAO_CLICK_ACCESS_TOKEN;
    const secretToken = env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;

    if (!accessToken || !secretToken) {
      console.warn('[AUTO_IMPORT] Credenciais do Gestão Click não encontradas nas variáveis de ambiente.');
      console.warn('[AUTO_IMPORT] Adicione GESTAO_CLICK_ACCESS_TOKEN e GESTAO_CLICK_SECRET_ACCESS_TOKEN ao arquivo .env');
      return;
    }

    // Configura o intervalo de auto-import (a cada 5 minutos)
    const INTERVAL = 5 * 60 * 1000;

    // Função para executar o auto-import
    const runAutoImport = async () => {
      try {
        const baseUrl = env.NEXT_PUBLIC_APP_URL;
        const response = await fetch(`${baseUrl}/api/gestao-click/auto-import-all`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`Erro ao executar auto-import: ${response.statusText}`);
        }

        console.log('[AUTO_IMPORT] Auto-import executado com sucesso');
      } catch (error) {
        console.error('[AUTO_IMPORT] Erro ao executar auto-import:', error);
      }
    };

    // Removido a execução imediata do auto-import e o setInterval
    // Agora o auto-import só será executado quando explicitamente chamado

  } catch (error) {
    console.error('[AUTO_IMPORT] Erro ao configurar auto-import:', error);
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
  
  console.log(`[AUTO_IMPORT] Agendamento não disponível - serviço removido`);
} 
