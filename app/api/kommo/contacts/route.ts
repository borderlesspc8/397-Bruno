import { NextRequest, NextResponse } from 'next/server';
import { KommoService } from '@/app/_services/kommo-service';
import { logger } from '@/app/_services/logger';
import { kommoConfig } from '@/app/_config/kommo';

/**
 * GET /api/kommo/contacts
 * Obtém contatos do KOMMO CRM
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

    logger.info(`Buscando contatos KOMMO (página ${page})`, {
      context: 'API_GET_CONTACTS',
      data: { userId, page, limit, hasQuery: !!query }
    });

    const contacts = await kommoService.getContacts(page, limit, query);

    return NextResponse.json({
      success: true,
      data: contacts._embedded?.contacts || [],
      pagination: {
        page,
        limit,
        pageCount: contacts.page_count,
      },
      message: `${contacts._embedded?.contacts?.length || 0} contatos obtidos`,
    });
  } catch (error) {
    logger.error('Erro ao obter contatos KOMMO', {
      context: 'API_GET_CONTACTS_ERROR',
      data: {
        error: error instanceof Error ? error.message : String(error),
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao obter contatos',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/kommo/contacts
 * Busca um contato específico
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jwtToken: bodyToken, userId, contactId } = body;
    const jwtToken = bodyToken || kommoConfig.jwtToken;
    const finalUserId = userId || '1';

    if (!jwtToken) {
      return NextResponse.json(
        { error: 'JWT token não foi fornecido' },
        { status: 400 }
      );
    }

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId é obrigatório' },
        { status: 400 }
      );
    }

    const kommoService = new KommoService({
      jwtToken,
      userId: finalUserId,
    });

    logger.info(`Buscando contato ${contactId} do KOMMO`, {
      context: 'API_GET_CONTACT',
      data: { userId: finalUserId, contactId }
    });

    const contact = await kommoService.getContact(contactId);

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    logger.error('Erro ao obter contato KOMMO', {
      context: 'API_GET_CONTACT_ERROR',
      data: {
        error: error instanceof Error ? error.message : String(error),
      }
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao obter contato',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
