import { NextRequest, NextResponse } from 'next/server';
import { KommoService } from '@/app/_services/kommo-service';
import { logger } from '@/app/_services/logger';
import { kommoConfig } from '@/app/_config/kommo';

/**
 * POST /api/kommo/test-connection
 * Testa a conexão com a API do KOMMO CRM
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jwtToken = body.jwtToken || kommoConfig.jwtToken;
    const userId = body.userId || '1';

    if (!jwtToken) {
      logger.warn('Teste de conexão KOMMO: JWT não fornecido', {
        context: 'KOMMO_TEST_CONNECTION',
        data: { userId }
      });

      return NextResponse.json(
        {
          success: false,
          message: 'JWT token não foi fornecido. Configure KOMMO_JWT_TOKEN nas variáveis de ambiente.',
          connection: {
            status: 'failed',
            reason: 'JWT token ausente'
          }
        },
        { status: 400 }
      );
    }

    const kommoService = new KommoService({
      jwtToken,
      userId,
    });

    logger.info('Iniciando teste de conexão com KOMMO', {
      context: 'KOMMO_TEST_CONNECTION',
      data: { userId, hasToken: !!jwtToken }
    });

    // Testar conexão
    const isConnected = await kommoService.testConnection();

    // Obter informações do JWT
    const jwtInfo = kommoService['getJWTInfo']();

    if (isConnected) {
      logger.info('Teste de conexão KOMMO bem-sucedido', {
        context: 'KOMMO_TEST_CONNECTION_SUCCESS',
        data: {
          userId,
          accountId: jwtInfo?.accountId,
          expiresAt: jwtInfo?.expiresAt,
        }
      });

      // Tentar buscar alguns contatos como verificação adicional
      try {
        const contacts = await kommoService.getContacts(1, 5);
        
        return NextResponse.json({
          success: true,
          message: 'Conexão com KOMMO CRM estabelecida com sucesso',
          connection: {
            status: 'connected',
            apiUrl: kommoConfig.apiUrl,
          },
          account: jwtInfo ? {
            accountId: jwtInfo.accountId,
            baseDomain: jwtInfo.baseDomain,
            apiDomain: jwtInfo.apiDomain,
            scopes: jwtInfo.scopes,
            expiresAt: jwtInfo.expiresAt?.toISOString(),
          } : null,
          diagnostics: {
            contacts: {
              count: contacts._embedded?.contacts?.length || 0,
              items: (contacts._embedded?.contacts || []).slice(0, 3).map(c => ({
                id: c.id,
                name: c.name,
              })),
            }
          }
        });
      } catch (error) {
        return NextResponse.json({
          success: true,
          message: 'Autenticação validada, mas erro ao buscar contatos',
          connection: {
            status: 'authenticated',
          },
          account: jwtInfo ? {
            accountId: jwtInfo.accountId,
            baseDomain: jwtInfo.baseDomain,
            expiresAt: jwtInfo.expiresAt?.toISOString(),
          } : null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Falha na conexão com KOMMO CRM',
        connection: {
          status: 'failed'
        }
      },
      { status: 500 }
    );
  } catch (error) {
    logger.error('Erro ao testar conexão com KOMMO', {
      context: 'KOMMO_TEST_CONNECTION_ERROR',
      data: {
        error: error instanceof Error ? error.message : String(error),
      }
    });

    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao testar conexão com KOMMO CRM',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kommo/test-connection
 * Testa a conexão usando variáveis de ambiente
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const jwtToken = searchParams.get('jwtToken') || kommoConfig.jwtToken;
    const userId = searchParams.get('userId') || '1';

    if (!jwtToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'JWT token não foi fornecido',
          connection: {
            status: 'failed',
            reason: 'JWT token ausente'
          }
        },
        { status: 400 }
      );
    }

    const kommoService = new KommoService({
      jwtToken,
      userId,
    });

    logger.info('GET: Testando conexão com KOMMO', {
      context: 'KOMMO_TEST_CONNECTION_GET',
      data: { userId }
    });

    const isConnected = await kommoService.testConnection();

    if (isConnected) {
      const jwtInfo = kommoService['getJWTInfo']();
      
      return NextResponse.json({
        success: true,
        message: 'Conexão com KOMMO CRM validada',
        connection: {
          status: 'connected'
        },
        account: jwtInfo ? {
          accountId: jwtInfo.accountId,
          baseDomain: jwtInfo.baseDomain,
          expiresAt: jwtInfo.expiresAt?.toISOString(),
        } : null,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Falha na validação da conexão',
      },
      { status: 500 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Erro ao validar conexão',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
