/**
 * API para importação de dados do Gestão Click
 * Permite importar transações financeiras do Gestão Click para o sistema
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { prisma } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { validateSessionForAPI } from "@/app/_utils/auth";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";



// Função formatadora de datas
function formatDateForStorage(date: string | Date): string {
  if (!date) return '';

  let dateObj: Date;
  
  // Se for uma string, converter para Date
  if (typeof date === 'string') {
    // Se já estiver no formato YYYY-MM-DD, retornar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Verificar se está no formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const parts = date.split('/');
      dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      // Tentar converter diretamente
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Data inválida: ${date}`);
  }
  
  // Formatar como YYYY-MM-DD
  return dateObj.toISOString().split('T')[0];
}

/**
 * POST /api/gestao-click/import
 * 
 * Importa transações do Gestão Click para uma carteira específica
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação do usuário apenas em produção
    // Em ambiente de desenvolvimento, permitir testes sem autenticação
    const isDevelopment = process.env.NODE_ENV === 'development';
    const session = await getAuthSession();
    
    if (!isDevelopment && !session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Obter e validar dados da requisição
    const body = await req.json();
    const { 
      walletId, 
      startDate, 
      endDate, 
      accessToken, 
      secretToken, 
      apiUrl, 
      filterCategories, 
      filterAccounts,
      apiFilters = {}
    } = body;

    // Validar dados de entrada
    if (!walletId) {
      return NextResponse.json({ error: 'ID da carteira é obrigatório' }, { status: 400 });
    }

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Datas de início e fim são obrigatórias' }, { status: 400 });
    }

    // Verificar se o usuário tem acesso à carteira (pular em desenvolvimento)
    let wallet = null;
    if (!isDevelopment) {
      wallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId: session?.user?.id || 'unknown-user'
        }
      });

      if (!wallet) {
        return NextResponse.json({ error: 'Carteira não encontrada ou acesso negado' }, { status: 404 });
      }
    } else {
      // Em desenvolvimento, criar um objeto wallet simples para teste
      wallet = { id: walletId, name: 'Test Wallet', userId: 'test-user-id' };
    }

    // Criar instância do serviço Gestão Click com as credenciais
    const gestaoClickService = new GestaoClickService({
      apiKey: accessToken || process.env.GESTAO_CLICK_ACCESS_TOKEN || '',
      secretToken: secretToken || process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
      apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
      userId: session?.user?.id || 'test-user-id'
    });

    // Verificar se a conexão com a API está funcionando
    try {
      const connected = await gestaoClickService.testConnection();
      if (!connected) {
        return NextResponse.json({ 
          error: 'Não foi possível conectar ao Gestão Click. Verifique suas credenciais.' 
        }, { status: 400 });
      }
    } catch (error: any) {
      console.error('Erro ao testar conexão com Gestão Click:', error);
      return NextResponse.json({ 
        error: `Falha na conexão com Gestão Click: ${error.message}` 
      }, { status: 400 });
    }

    // Configurar filtros avançados, se fornecidos
    const maxTransactions = apiFilters.maxTransactions || 20000;
    
    // Definir filtros completos
    const completeFilters = {
      ...apiFilters,
      maxTransactions: maxTransactions
    };

    // Importar transações com limite máximo configurado
    const result = await gestaoClickService.importTransactions(walletId, {
      startDate,
      endDate,
      filterCategories,
      filterAccounts,
      apiFilters: completeFilters
    });

    // Atualizar as configurações de integração na carteira
    await gestaoClickService.storeIntegrationSettings(walletId, {
      apiKey: accessToken || process.env.GESTAO_CLICK_ACCESS_TOKEN || '',
      secretToken: secretToken || process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
      apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
      lastSync: new Date().toISOString()
    });

    // Revalidar caminhos para atualizar a UI
    revalidatePath(`/wallets/${walletId}`);
    revalidatePath("/transactions");
    revalidatePath("/wallets");

    return NextResponse.json({
      success: true,
      message: `Importação concluída com sucesso`,
      totalImported: result.totalImported,
      details: {
        ...result.details,
        periodo: {
          inicio: startDate,
          fim: endDate
        },
        filtros: {
          maxTransactions,
          ...apiFilters
        }
      }
    });
  } catch (error: any) {
    console.error('Erro ao importar do Gestão Click:', error);
    return NextResponse.json({ 
      error: `Falha na importação: ${error.message}` 
    }, { status: 500 });
  }
}

/**
 * GET /api/gestao-click/import
 * Endpoint para obter as configurações de integração salvas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const walletId = searchParams.get("walletId");

    if (!walletId) {
      return NextResponse.json(
        { error: "ID da carteira é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a carteira existe e pertence ao usuário
    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId: session.user.id
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Carteira não encontrada ou não pertence ao usuário" },
        { status: 404 }
      );
    }

    // Obter as configurações de integração
    const settings = await getIntegrationSettings(session.user.id, walletId);

    // Verificar se existem configurações globais como fallback
    let globalSettings = null;
    if (!settings?.apiKey) {
      globalSettings = await getIntegrationSettings(session.user.id, "global");
    }

    // Mesclar configurações, priorizando as específicas da carteira
    const mergedSettings = {
      ...globalSettings,
      ...settings,
    };

    return NextResponse.json({
      success: true,
      settings: mergedSettings || null
    });
  } catch (error: any) {
    console.error("Erro ao obter configurações de integração:", error);

    return NextResponse.json(
      {
        error: "Falha ao obter configurações",
        message: error.message
      },
      { status: 500 }
    );
  }
}

// Funções auxiliares

/**
 * Armazena as configurações de integração para uso futuro
 */
async function storeIntegrationSettings(
  userId: string,
  walletId: string,
  settings: any
): Promise<void> {
  try {
    // Atualizar ou criar a carteira com as configurações da integração
    await prisma.wallet.update({
      where: {
        id: walletId,
        userId: userId
      },
      data: {
        metadata: {
          ...(await getWalletMetadata(walletId)),
          gestaoClick: {
            apiKey: settings.apiKey,
            secretToken: settings.secretToken,
            apiUrl: settings.apiUrl,
            lastSync: settings.lastSync
          }
        }
      }
    });
  } catch (error) {
    console.error("Erro ao armazenar configurações de integração:", error);
    throw error;
  }
}

/**
 * Obtém as configurações de integração salvas
 */
async function getIntegrationSettings(userId: string, walletId: string): Promise<any> {
  try {
    let wallet;
    
    if (walletId === "global") {
      // Buscar as configurações globais (armazenadas em um registro especial)
      wallet = await prisma.wallet.findFirst({
        where: {
          userId: userId,
          type: "SETTINGS",
          name: "GESTAO_CLICK_GLOBAL"
        },
        select: {
          metadata: true
        }
      });
      
      if (!wallet) {
        // Criar o registro global se não existir
        wallet = await prisma.wallet.create({
          data: {
            userId: userId,
            name: "GESTAO_CLICK_GLOBAL",
            type: "SETTINGS",
            balance: 0,
            metadata: {
              // Inicialmente sem configurações
            }
          },
          select: {
            metadata: true
          }
        });
      }
    } else {
      // Buscar configurações específicas da carteira
      wallet = await prisma.wallet.findFirst({
        where: {
          id: walletId,
          userId: userId
        },
        select: {
          metadata: true
        }
      });
    }

    if (!wallet || !wallet.metadata) return null;

    // @ts-ignore - O Prisma trata o campo metadata como any
    return wallet.metadata.gestaoClick || null;
  } catch (error) {
    console.error("Erro ao obter configurações de integração:", error);
    return null;
  }
}

/**
 * Obtém os metadados da carteira para preservar outros dados
 */
async function getWalletMetadata(walletId: string): Promise<any> {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      select: { metadata: true }
    });

    return wallet?.metadata || {};
  } catch (error) {
    console.error("Erro ao obter metadados da carteira:", error);
    return {};
  }
} 
