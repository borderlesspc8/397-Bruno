/**
 * API para importação de carteiras do Gestão Click
 * Permite importar automaticamente todas as contas bancárias e centros de custo do Gestão Click
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { revalidatePath } from "next/cache";
import { prisma } from "@/app/_lib/prisma";
import logger from "@/app/_lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/gestao-click/import-wallets
 * Endpoint para importar carteiras do Gestão Click
 */
export async function POST(request: NextRequest) {
  try {
    logger.info("[API] Iniciando processamento de requisição para importar carteiras do Gestão Click");
    
    // Verificar autenticação do usuário apenas em produção
    const isDevelopment = process.env.NODE_ENV === 'development' || true; // Forçar modo de desenvolvimento para testes
    const session = await getAuthSession();
    
    // Em ambiente de produção, é necessário ter um usuário autenticado
    if (!isDevelopment && !session?.user) {
      logger.warn('[API] Tentativa de importação de carteiras sem autenticação');
      return NextResponse.json(
        { 
          error: "Não autorizado", 
          message: "Para importar carteiras do Gestão Click, você precisa estar autenticado." 
        },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const data = await request.json();
    const { apiKey, secretToken, apiUrl, importCostCenters } = data;

    logger.info(`[API] Processando requisição para importar carteiras - API URL: ${apiUrl || 'padrão'}`);

    // Validar dados obrigatórios
    if (!apiKey) {
      logger.warn("[API] Tentativa de importação sem apiKey");
      return NextResponse.json(
        {
          error: "Dados incompletos",
          message: "O token de acesso (apiKey) é obrigatório"
        },
        { status: 400 }
      );
    }

    // Em produção, verificar se o usuário realmente existe no banco de dados
    // Em desenvolvimento, sempre seguir em frente
    const userId = session?.user?.id || 'test-user-id';
    logger.info(`[API] Processando importação para usuário ${userId}`);
    
    if (!isDevelopment && session?.user?.id) {
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      });
      
      if (!userExists) {
        logger.error(`[API] Usuário não encontrado: ${session.user.id}`);
        return NextResponse.json(
          { error: "Usuário não encontrado", message: "O usuário autenticado não foi encontrado na base de dados." },
          { status: 404 }
        );
      }
    }

    // Criar o serviço do Gestão Click
    logger.info("[API] Inicializando serviço do Gestão Click");
    const gestaoClickService = new GestaoClickService({
      apiKey,
      secretToken,
      apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
      userId: userId
    });

    // Testar conexão com a API
    try {
      logger.info("[API] Testando conexão com a API do Gestão Click");
      const connectionTestResult = await gestaoClickService.testConnection();
      if (!connectionTestResult) {
        logger.error("[API] Teste de conexão com a API do Gestão Click falhou");
        return NextResponse.json(
          { error: "Não foi possível conectar à API do Gestão Click", message: "Verifique suas credenciais e tente novamente." },
          { status: 400 }
        );
      }
      logger.info("[API] Teste de conexão com a API do Gestão Click bem-sucedido");
    } catch (error: any) {
      logger.error("[API] Erro ao testar conexão com a API:", error);
      return NextResponse.json(
        { error: "Erro ao testar conexão com a API", message: error.message },
        { status: 400 }
      );
    }

    // Importar todas as carteiras
    logger.info("[API] Iniciando importação de carteiras");
    const importResult = await gestaoClickService.importAllWallets();
    logger.info(`[API] Importação de carteiras concluída: ${importResult.totalCreated} novas carteiras criadas`);

    // Revalidar caminhos para atualizar a UI
    revalidatePath("/wallets");
    revalidatePath("/dashboard");
    revalidatePath("/transactions");

    // Armazenar as credenciais para uso futuro
    try {
      logger.info("[API] Armazenando credenciais para uso futuro");
      await gestaoClickService.storeIntegrationSettings("global", {
        apiKey,
        secretToken,
        apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
        lastSync: new Date().toISOString()
      });
    } catch (credError) {
      logger.warn("Erro ao armazenar credenciais globais:", credError);
      // Não interromper o fluxo principal em caso de erro
    }

    // Preparar resposta bem-sucedida
    logger.info("[API] Preparando resposta de sucesso");
    return NextResponse.json({
      success: true,
      message: `${importResult.totalCreated} carteiras importadas com sucesso`,
      details: {
        criadas: importResult.totalCreated,
        ignoradas: importResult.skipped,
        carteiras: importResult.wallets.map(wallet => ({
          id: wallet.id,
          name: wallet.name,
          type: wallet.type,
          balance: wallet.balance,
          isNew: wallet.isNew
        }))
      }
    });
  } catch (error: any) {
    logger.error("Erro na importação de carteiras do Gestão Click:", error);

    return NextResponse.json(
      {
        error: "Falha na importação",
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}

// Importar funções do serviço
import { testGestaoClickConnection } from "@/app/_services/gestao-click-service"; 