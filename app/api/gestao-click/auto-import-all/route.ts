/**
 * API para iniciar a importação automática de todos os usuários
 * Esta rota pode ser chamada por um serviço externo (CRON, webhook) para disparar a importação
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { createServerNotification } from "@/app/_lib/server-notifications";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";

// Credenciais do Gestão Click são obtidas diretamente do ambiente no serviço GestaoClickService

// Força comportamento dinâmico para este endpoint
export const dynamic = "force-dynamic";

/**
 * GET /api/gestao-click/auto-import-all
 * Inicia a importação automática para todos os usuários
 */
export async function GET(request: NextRequest) {
  try {
    console.log(`[AUTO_IMPORT] Iniciando processo de importação automática...`);
    
    // Buscar todos os usuários do sistema
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    if (users.length === 0) {
      return NextResponse.json(
        { 
          message: "Nenhum usuário encontrado para importação", 
          count: 0 
        }
      );
    }
    
    console.log(`[AUTO_IMPORT] Encontrados ${users.length} usuários para processamento`);
    
    // Resultado da operação
    const result = {
      total: users.length,
      processed: 0,
      success: 0,
      failed: 0,
      details: [] as any[]
    };
    
    // Para cada usuário, executar importação
    for (const user of users) {
      try {
        result.processed++;
        console.log(`[AUTO_IMPORT] Processando usuário: ${user.email}`);
        
        // Configurar integração
        await configureIntegration(user.id);
        
        // Executar importação
        const importResult = await runImport(user.id);
        
        // Notificar usuário
        await createServerNotification({
          userId: user.id,
          title: "Importação automática realizada",
          message: `${importResult.transactions.totalImported} transações foram importadas do Gestão Click`,
          type: NotificationType.IMPORT,
          priority: NotificationPriority.MEDIUM,
          link: "/transactions",
          metadata: {
            source: "GESTAO_CLICK",
            result: importResult,
            timestamp: new Date().toISOString()
          }
        });
        
        result.success++;
        result.details.push({
          userId: user.id,
          email: user.email,
          success: true,
          transactionsImported: importResult.transactions.totalImported
        });
        
      } catch (error: any) {
        console.error(`[AUTO_IMPORT] Erro ao processar usuário ${user.email}:`, error);
        
        result.failed++;
        result.details.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: error.message
        });
        
        // Notificar erro
        try {
          await createServerNotification({
            userId: user.id,
            title: "Erro na importação automática",
            message: `Ocorreu um erro ao importar transações do Gestão Click: ${error.message}`,
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.HIGH,
            link: "/settings/integrations",
            metadata: {
              source: "GESTAO_CLICK",
              error: error.message,
              timestamp: new Date().toISOString()
            }
          });
        } catch (notifyError) {
          console.error(`[AUTO_IMPORT] Erro ao notificar usuário ${user.id}:`, notifyError);
        }
      }
    }
    
    console.log(`[AUTO_IMPORT] Importação concluída. Sucesso: ${result.success}, Falhas: ${result.failed}`);
    
    return NextResponse.json({
      success: true,
      message: `Importação automática executada para ${result.processed} usuários`,
      result
    });
    
  } catch (error: any) {
    console.error('[AUTO_IMPORT] Erro global na importação automática:', error);
    
    return NextResponse.json(
      { 
        error: "Erro ao processar importação automática",
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * Configura a integração com o Gestão Click para um usuário
 */
async function configureIntegration(userId: string): Promise<any> {
  // Obter credenciais diretamente do ambiente
  const apiKey = process.env.GESTAO_CLICK_ACCESS_TOKEN || "";
  const secretToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || "";
  const apiUrl = process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com";
  
  // Verificar se já existe configuração
  const existingSettings = await prisma.integrationSettings.findFirst({
    where: {
      userId,
      provider: 'gestao-click',
      walletId: 'global',
    },
  });
  
  if (existingSettings) {
    // Atualizar configurações existentes
    return prisma.integrationSettings.update({
      where: { id: existingSettings.id },
      data: {
        active: true,
        metadata: {
          apiKey,
          secretToken,
          apiUrl,
          autoSync: true,
          syncFrequency: "daily",
          lastUpdated: new Date().toISOString()
        }
      }
    });
  } else {
    // Criar novas configurações
    return prisma.integrationSettings.create({
      data: {
        userId,
        provider: 'gestao-click',
        walletId: 'global',
        active: true,
        metadata: {
          apiKey,
          secretToken,
          apiUrl,
          autoSync: true,
          syncFrequency: "daily",
          lastUpdated: new Date().toISOString()
        }
      }
    });
  }
}

/**
 * Executa importação do Gestão Click para um usuário
 */
async function runImport(userId: string): Promise<any> {
  const apiKey = process.env.GESTAO_CLICK_ACCESS_TOKEN || "";
  const secretToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || "";
  const apiUrl = process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com";
  
  // Criar instância do serviço
  const gestaoClickService = new GestaoClickService({
    userId,
    apiKey,
    secretToken,
    apiUrl
  });
  
  // Executar importação completa
  return gestaoClickService.importAllData();
} 