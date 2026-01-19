import { NextRequest, NextResponse } from 'next/server';
import { KommoService } from '@/app/_services/kommo-service';
import { logger } from '@/app/_services/logger';
import { kommoConfig } from '@/app/_config/kommo';

/**
 * GET /api/kommo/deals
 * Obtém negociações (deals) do KOMMO CRM
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const jwtToken = searchParams.get('jwtToken') || kommoConfig.jwtToken;
    const userId = searchParams.get('userId') || '1';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const query = searchParams.get('query') || undefined;

    if (!jwtToken) {
      return NextResponse.json(
        { error: 'JWT token não foi fornecido' },
        { status: 400 }
      );
    }

    const kommoService = new KommoService({
      jwtToken,
      userId,
    });

    logger.info(`Buscando negociações KOMMO (página ${page})`, {
      context: 'API_GET_DEALS',
      data: { userId, page, limit, hasQuery: !!query }
    });

    const deals = await kommoService.getDeals(page, limit, query);

    return NextResponse.json({
      success: true,
      data: deals._embedded?.deals || [],
      pagination: {
        page,
        limit,
        pageCount: deals.page_count,
      },
      message: `${deals._embedded?.deals?.length || 0} negociações obtidas`,
    });
  } catch (error) {
    logger.error('Erro ao obter negociações KOMMO', {
      context: 'API_GET_DEALS_ERROR',
      data: {
        error: error instanceof Error ? error.message : String(error),
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao obter negociações',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kommo/deals
 * Busca uma negociação específica
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jwtToken: bodyToken, userId, dealId } = body;
    const jwtToken = bodyToken || kommoConfig.jwtToken;
    const finalUserId = userId || '1';

    if (!jwtToken) {
      return NextResponse.json(
        { error: 'JWT token não foi fornecido' },
        { status: 400 }
      );
    }

    if (!dealId) {
      return NextResponse.json(
        { error: 'dealId é obrigatório' },
        { status: 400 }
      );
    }

    const kommoService = new KommoService({
      jwtToken,
      userId: finalUserId,
    });

    logger.info(`Buscando negociação ${dealId} do KOMMO`, {
      context: 'API_GET_DEAL',
      data: { userId: finalUserId, dealId }
    });

    const deal = await kommoService.getDeal(dealId);

    return NextResponse.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    logger.error('Erro ao obter negociação KOMMO', {
      context: 'API_GET_DEAL_ERROR',
      data: {
        error: error instanceof Error ? error.message : String(error),
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao obter negociação',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
