import { NextRequest, NextResponse } from 'next/server';
import { KommoService } from '@/app/_services/kommo-service';
import { logger } from '@/app/_services/logger';
import { kommoConfig } from '@/app/_config/kommo';
import { prisma } from '@/app/_lib/prisma';

/**
 * POST /api/kommo/sync
 * Sincroniza dados do KOMMO CRM
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jwtToken = body.jwtToken || kommoConfig.jwtToken;
    const userId = body.userId || '1';

    if (!jwtToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'JWT token não foi fornecido',
        },
        { status: 400 }
      );
    }

    logger.info('Iniciando sincronização KOMMO', {
      context: 'API_SYNC_KOMMO',
      data: { userId }
    });

    const kommoService = new KommoService({
      jwtToken,
      userId,
    });

    // Verificar conexão primeiro
    await kommoService.testConnection();

    // Realizar sincronização
    const result = await kommoService.syncData();

    // Salvar resultado da sincronização no banco de dados
    try {
      await prisma.integrationSettings.upsert({
        where: {
          userId_provider_walletId: {
            userId,
            provider: 'kommo',
            walletId: 'global',
          }
        },
        update: {
          active: true,
          metadata: {
            lastSync: new Date().toISOString(),
            contactsCount: result.contactsCount,
            dealsCount: result.dealsCount,
            syncSuccess: result.success,
            errors: result.errors || [],
          }
        },
        create: {
          userId,
          provider: 'kommo',
          walletId: 'global',
          active: true,
          metadata: {
            lastSync: new Date().toISOString(),
            contactsCount: result.contactsCount,
            dealsCount: result.dealsCount,
            syncSuccess: result.success,
            errors: result.errors || [],
          }
        }
      });
    } catch (error) {
      logger.warn('Erro ao salvar resultado de sincronização no banco', {
        context: 'API_SYNC_KOMMO_DB_ERROR',
        data: {
          error: error instanceof Error ? error.message : String(error),
        }
      });
    }

    logger.info('Sincronização KOMMO concluída', {
      context: 'API_SYNC_KOMMO_SUCCESS',
      data: {
        contactsCount: result.contactsCount,
        dealsCount: result.dealsCount,
        success: result.success,
        userId,
      }
    });

    return NextResponse.json({
      success: result.success,
      message: `Sincronização concluída: ${result.contactsCount} contatos, ${result.dealsCount} negociações`,
      data: {
        contactsCount: result.contactsCount,
        dealsCount: result.dealsCount,
        lastSync: result.lastSync,
        errors: result.errors,
      }
    });
  } catch (error) {
    logger.error('Erro na sincronização KOMMO', {
      context: 'API_SYNC_KOMMO_ERROR',
      data: {
        error: error instanceof Error ? error.message : String(error),
      }
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Erro na sincronização com KOMMO CRM',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kommo/sync
 * Obtém status da última sincronização
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId') || '1';

    logger.info('Buscando status de sincronização KOMMO', {
      context: 'API_GET_SYNC_STATUS',
      data: { userId }
    });

    // Buscar integração no banco de dados
    const integration = await prisma.integrationSettings.findUnique({
      where: {
        userId_provider_walletId: {
          userId,
          provider: 'kommo',
          walletId: 'global',
        }
      }
    });

    if (!integration) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma sincronização anterior encontrada',
        data: null,
      });
    }

    const metadata = integration.metadata as any;

    return NextResponse.json({
      success: true,
      message: 'Status de sincronização obtido',
      data: {
        lastSync: metadata?.lastSync,
        contactsCount: metadata?.contactsCount || 0,
        dealsCount: metadata?.dealsCount || 0,
        syncSuccess: metadata?.syncSuccess || false,
        errors: metadata?.errors || [],
      }
    });
  } catch (error) {
    logger.error('Erro ao obter status de sincronização', {
      context: 'API_GET_SYNC_STATUS_ERROR',
      data: {
        error: error instanceof Error ? error.message : String(error),
      }
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao obter status',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
