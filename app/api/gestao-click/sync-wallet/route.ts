/**
 * API para sincronização automática de transações de uma carteira específica do Gestão Click
 * Este endpoint é utilizado para importar apenas novas transações sem duplicação
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { prisma } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { createServerNotification } from "@/app/_lib/server-notifications";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";

// Configurar como dinâmico para sempre buscar dados atualizados
export const dynamic = "force-dynamic";

/**
 * POST /api/gestao-click/sync-wallet
 * Sincroniza novas transações de uma carteira específica do Gestão Click
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const { user } = await getAuthSession();
    
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter dados da requisição
    const body = await request.json();
    const { walletId } = body;

    // Validar ID da carteira
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
        userId: user.id
      },
      select: {
        id: true,
        name: true,
        type: true,
        metadata: true
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Carteira não encontrada ou não pertence ao usuário" },
        { status: 404 }
      );
    }

    // Verificar se a carteira é do tipo Gestão Click
    const walletType = String(wallet.type); // Garantir que seja string
    
    // Verificar metadata de forma segura
    const metadata = wallet.metadata as Record<string, any> || {};
    const source = metadata.source as string || '';
    
    if (!walletType.includes('INTEGRATION') && !source.includes('gestao-click')) {
      return NextResponse.json(
        { error: "Esta carteira não é integrada com o Gestão Click" },
        { status: 400 }
      );
    }

    // Buscar as configurações de integração do usuário
    const settings = await (prisma as any).integrationSettings.findFirst({
      where: {
        userId: user.id,
        provider: 'gestao-click'
      },
      select: {
        metadata: true
      }
    });

    if (!settings || !settings.metadata) {
      return NextResponse.json(
        { error: "Configurações de integração não encontradas" },
        { status: 400 }
      );
    }

    // Extrair credenciais da API
    const metadataSettings = settings.metadata as Record<string, any>;
    const apiKey = metadataSettings.apiKey;
    const secretToken = metadataSettings.secretToken;
    const apiUrl = metadataSettings.apiUrl;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave de API não encontrada nas configurações" },
        { status: 400 }
      );
    }

    // Criar o serviço do Gestão Click
    const gestaoClickService = new GestaoClickService({
      apiKey,
      secretToken,
      apiUrl: apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com',
      userId: user.id
    });

    // Notificar o início da sincronização
    await createServerNotification({
      userId: user.id,
      title: "Sincronização iniciada",
      message: `Sincronizando carteira ${wallet.name} com o Gestão Click`,
      type: NotificationType.WALLET,
      priority: NotificationPriority.LOW,
      metadata: {
        walletId: wallet.id,
        operation: "sync",
        source: "GESTAO_CLICK"
      }
    });

    // Executar a importação apenas para a carteira específica
    const result = await gestaoClickService.importTransactionsForWallet(walletId);

    // Contar novas transações importadas
    const newTransactions = result.totalImported;

    // Revalidar caminhos relevantes para atualizar a UI
    revalidatePath("/transactions");
    revalidatePath(`/wallets/${walletId}`);
    revalidatePath("/wallets");
    revalidatePath("/dashboard");

    // Notificar o usuário sobre o resultado da sincronização
    if (newTransactions > 0) {
      await createServerNotification({
        userId: user.id,
        title: "Sincronização concluída",
        message: `${newTransactions} novas transações importadas para a carteira ${wallet.name}`,
        type: NotificationType.WALLET,
        priority: NotificationPriority.MEDIUM,
        link: `/wallets/${walletId}`,
        metadata: {
          walletId: wallet.id,
          operation: "sync",
          source: "GESTAO_CLICK",
          newTransactions
        }
      });
    } else {
      await createServerNotification({
        userId: user.id,
        title: "Sincronização concluída",
        message: `Nenhuma nova transação encontrada para a carteira ${wallet.name}`,
        type: NotificationType.WALLET,
        priority: NotificationPriority.LOW,
        link: `/wallets/${walletId}`,
        metadata: {
          walletId: wallet.id,
          operation: "sync",
          source: "GESTAO_CLICK",
          newTransactions: 0
        }
      });
    }

    // Atualizar a data da última sincronização
    const currentMetadata = wallet.metadata as Record<string, any> || {};
    await prisma.wallet.update({
      where: {
        id: walletId
      },
      data: {
        metadata: {
          ...currentMetadata,
          lastSync: new Date().toISOString()
        }
      }
    });

    // Retornar resultado
    return NextResponse.json({
      success: true,
      message: `Sincronização concluída com sucesso para a carteira ${wallet.name}`,
      walletId,
      newTransactions,
      details: {
        totalProcessed: result.totalImported + result.skipped,
        imported: result.totalImported,
        skipped: result.skipped,
        failed: result.failed
      }
    });
  } catch (error: any) {
    console.error("[GESTAO_CLICK] Erro ao sincronizar carteira:", error);

    // Retornar erro com detalhes
    return NextResponse.json(
      {
        error: "Falha ao sincronizar carteira",
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
} 
