/**
 * API para gerenciar o agendamento de sincronização automática com o Gestão Click
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { createServerNotification } from "@/app/_lib/server-notifications";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";
import { GestaoClickService } from "@/app/_services/gestao-click-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/gestao-click/sync-schedule
 * Recupera a configuração atual de sincronização automática
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Buscar configurações de sincronização
    const settings = await prisma.integrationSettings.findFirst({
      where: {
        userId,
        provider: 'gestao-click',
        walletId: 'global'
      }
    });
    
    // Se não existir configuração, retornar status padrão
    if (!settings || !settings.metadata) {
      return NextResponse.json({
        success: true,
        status: "not_configured",
        message: "Sincronização automática não configurada",
        lastSync: null,
        autoSync: false
      });
    }
    
    // Extrair dados da configuração
    const metadata = settings.metadata as Record<string, any>;
    const lastSync = metadata.lastSync || null;
    const autoSync = metadata.autoSync === true;
    const syncFrequency = metadata.syncFrequency || 'daily';
    
    // Calcular próxima sincronização
    let nextSync = null;
    if (lastSync && autoSync) {
      const lastSyncDate = new Date(lastSync);
      const nextSyncDate = new Date(lastSyncDate);
      
      // Ajustar data com base na frequência
      switch (syncFrequency) {
        case 'hourly':
          nextSyncDate.setHours(nextSyncDate.getHours() + 1);
          break;
        case 'daily':
          nextSyncDate.setDate(nextSyncDate.getDate() + 1);
          break;
        case 'weekly':
          nextSyncDate.setDate(nextSyncDate.getDate() + 7);
          break;
        default:
          nextSyncDate.setDate(nextSyncDate.getDate() + 1); // Padrão: diário
      }
      
      nextSync = nextSyncDate.toISOString();
    }
    
    return NextResponse.json({
      success: true,
      status: autoSync ? "active" : "inactive",
      message: autoSync 
        ? `Sincronização automática ativa (${syncFrequency})` 
        : "Sincronização automática desativada",
      lastSync,
      nextSync,
      autoSync,
      syncFrequency
    });
  } catch (error: any) {
    console.error("[GESTAO_CLICK] Erro ao verificar status da sincronização automática:", error);

    return NextResponse.json(
      {
        error: "Falha ao verificar status",
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/gestao-click/sync-schedule
 * Configura o agendamento de sincronização automática
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Obter dados da requisição
    const body = await request.json();
    const { 
      autoSync, 
      syncFrequency = 'daily', 
      apiKey, 
      secretToken, 
      apiUrl 
    } = body;
    
    // Validar dados
    if (autoSync === undefined) {
      return NextResponse.json(
        { error: "Dados incompletos", message: "O parâmetro autoSync é obrigatório" },
        { status: 400 }
      );
    }
    
    // Para ativar a sincronização, apiKey é obrigatório
    if (autoSync && !apiKey) {
      return NextResponse.json(
        { error: "Dados incompletos", message: "Para ativar a sincronização automática, as credenciais de API são obrigatórias" },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    
    if (autoSync) {
      // Testar conexão com a API antes de salvar
      const testService = new GestaoClickService({
        apiKey,
        secretToken,
        apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
        userId
      });
      
      const connectionOk = await testService.testConnection();
      
      if (!connectionOk) {
        return NextResponse.json(
          { error: "Erro de conexão", message: "Não foi possível conectar à API do Gestão Click com as credenciais fornecidas" },
          { status: 400 }
        );
      }
    }
    
    // Buscar configuração existente
    const existingSettings = await prisma.integrationSettings.findFirst({
      where: {
        userId,
        provider: 'gestao-click',
        walletId: 'global'
      }
    });
    
    const currentTimestamp = new Date().toISOString();
    
    if (existingSettings) {
      // Atualizar configuração existente
      const currentMetadata = existingSettings.metadata as Record<string, any> || {};
      
      await prisma.integrationSettings.update({
        where: { id: existingSettings.id },
        data: {
          active: autoSync,
          metadata: {
            ...currentMetadata,
            autoSync,
            syncFrequency,
            lastUpdated: currentTimestamp,
            ...(apiKey && { apiKey }),
            ...(secretToken && { secretToken }),
            ...(apiUrl && { apiUrl })
          }
        }
      });
    } else if (autoSync) {
      // Criar nova configuração apenas se estiver ativando
      await prisma.integrationSettings.create({
        data: {
          userId,
          provider: 'gestao-click',
          walletId: 'global',
          active: true,
          metadata: {
            autoSync: true,
            syncFrequency,
            lastUpdated: currentTimestamp,
            apiKey,
            secretToken,
            apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com'
          }
        }
      });
    }
    
    // Executar primeira sincronização se estiver ativando
    if (autoSync) {
      try {
        // Criar serviço de gestão click
        const gestaoClickService = new GestaoClickService({
          apiKey,
          secretToken,
          apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
          userId
        });
        
        // Executar importação automática
        const importResult = await gestaoClickService.autoImportTransactions();
        
        // Criar notificação com resultado
        await createServerNotification({
          userId,
          title: "Sincronização automática concluída",
          message: `${importResult.newTransactions} novas transações foram importadas do Gestão Click`,
          type: NotificationType.IMPORT,
          priority: NotificationPriority.MEDIUM,
          link: "/transactions",
          metadata: {
            source: "GESTAO_CLICK",
            feature: "auto_sync",
            result: importResult,
            timestamp: currentTimestamp
          }
        });
      } catch (syncError: any) {
        console.error("[GESTAO_CLICK] Erro na primeira sincronização:", syncError);
        
        // Notificar erro, mas não falhar a configuração
        await createServerNotification({
          userId,
          title: "Erro na sincronização",
          message: `Erro ao importar transações do Gestão Click: ${syncError.message}`,
          type: NotificationType.IMPORT,
          priority: NotificationPriority.HIGH,
          link: "/settings/integrations",
          metadata: {
            source: "GESTAO_CLICK",
            feature: "auto_sync",
            error: syncError.message,
            timestamp: currentTimestamp
          }
        });
      }
    }
    
    // Criar notificação para o usuário
    await createServerNotification({
      userId,
      title: autoSync ? "Sincronização automática ativada" : "Sincronização automática desativada",
      message: autoSync 
        ? `Suas transações do Gestão Click serão sincronizadas automaticamente (${syncFrequency})` 
        : "A sincronização automática do Gestão Click foi desativada",
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      link: "/settings/integrations",
      metadata: {
        source: "GESTAO_CLICK",
        feature: "auto_sync",
        status: autoSync ? "enabled" : "disabled",
        timestamp: currentTimestamp,
      }
    });
    
    return NextResponse.json({
      success: true,
      message: autoSync 
        ? `Sincronização automática ativada (${syncFrequency})` 
        : "Sincronização automática desativada"
    });
  } catch (error: any) {
    console.error("[GESTAO_CLICK] Erro ao configurar sincronização automática:", error);
    
    return NextResponse.json(
      {
        error: "Falha ao configurar sincronização",
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/gestao-click/sync-schedule
 * Executa uma sincronização imediata
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Buscar configurações de sincronização
    const settings = await prisma.integrationSettings.findFirst({
      where: {
        userId,
        provider: 'gestao-click',
        walletId: 'global'
      }
    });
    
    // Se não existir configuração, retornar erro
    if (!settings || !settings.metadata) {
      return NextResponse.json(
        { error: "Não configurado", message: "A sincronização automática não está configurada" },
        { status: 400 }
      );
    }
    
    // Extrair credenciais
    const metadata = settings.metadata as Record<string, any>;
    const apiKey = metadata.apiKey;
    const secretToken = metadata.secretToken;
    const apiUrl = metadata.apiUrl;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Configuração incompleta", message: "Credenciais da API não configuradas" },
        { status: 400 }
      );
    }
    
    // Criar serviço Gestão Click
    const gestaoClickService = new GestaoClickService({
      apiKey,
      secretToken,
      apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
      userId
    });
    
    // Notificar início da sincronização
    await createServerNotification({
      userId,
      title: "Sincronização iniciada",
      message: "Iniciando sincronização manual com o Gestão Click",
      type: NotificationType.IMPORT,
      priority: NotificationPriority.LOW,
      metadata: {
        source: "GESTAO_CLICK",
        feature: "auto_sync",
        type: "manual",
        timestamp: new Date().toISOString()
      }
    });
    
    // Executar importação
    const importResult = await gestaoClickService.autoImportTransactions();
    
    // Notificar conclusão
    await createServerNotification({
      userId,
      title: "Sincronização concluída",
      message: `${importResult.newTransactions} novas transações foram importadas do Gestão Click`,
      type: NotificationType.IMPORT,
      priority: NotificationPriority.MEDIUM,
      link: "/transactions",
      metadata: {
        source: "GESTAO_CLICK",
        feature: "auto_sync",
        type: "manual",
        result: importResult,
        timestamp: new Date().toISOString()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: `Sincronização concluída. ${importResult.newTransactions} novas transações importadas.`,
      result: importResult
    });
  } catch (error: any) {
    console.error("[GESTAO_CLICK] Erro ao executar sincronização manual:", error);
    
    const userId = (await getAuthSession())?.user?.id;
    
    // Notificar erro
    if (userId) {
      await createServerNotification({
        userId,
        title: "Erro na sincronização",
        message: `Erro ao sincronizar com o Gestão Click: ${error.message}`,
        type: NotificationType.IMPORT,
        priority: NotificationPriority.HIGH,
        link: "/settings/integrations",
        metadata: {
          source: "GESTAO_CLICK",
          feature: "auto_sync",
          type: "manual",
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json(
      {
        error: "Falha na sincronização",
        message: error.message
      },
      { status: 500 }
    );
  }
} 