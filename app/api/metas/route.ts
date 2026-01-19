import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { prisma } from '@/app/_lib/prisma';

/**
 * GET /api/metas
 * Retorna as metas de vendas (pode vir do Gestão Click ou banco de dados local)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Buscar metas do banco de dados local (Prisma)
    // Verificar se a tabela 'meta' existe no schema
    try {
      const metas = await (prisma as any).meta?.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          mesReferencia: 'desc',
        },
      });

      if (metas) {
        return NextResponse.json({
          success: true,
          metas: metas.map((meta: any) => ({
            id: meta.id,
            mesReferencia: meta.mesReferencia,
            metaMensal: meta.metaMensal,
            metaSalvio: meta.metaSalvio,
            metaCoordenador: meta.metaCoordenador,
            metasVendedores: meta.metasVendedores,
            criadoPor: meta.criadoPor,
            atualizadoPor: meta.atualizadoPor,
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt,
          })),
        });
      }
    } catch (error) {
      console.log('[API_METAS] Tabela meta não encontrada, retornando array vazio');
    }

    // Se não houver metas ou a tabela não existir, retornar array vazio
    return NextResponse.json({
      success: true,
      metas: [],
      message: 'Nenhuma meta encontrada. Configure suas primeiras metas!',
    });

  } catch (error) {
    console.error('[API_METAS] Erro ao buscar metas:', error);
    return NextResponse.json(
      {
        error: 'Erro ao carregar metas',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/metas
 * Cria uma nova meta de vendas
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();

    const { mesReferencia, metaMensal, metaSalvio, metaCoordenador, metasVendedores } = body;

    // Validar dados obrigatórios
    if (!mesReferencia || !metaMensal) {
      return NextResponse.json(
        { error: 'Mês de referência e meta mensal são obrigatórios' },
        { status: 400 }
      );
    }

    try {
      const novaMeta = await (prisma as any).meta.create({
        data: {
          userId,
          mesReferencia: new Date(mesReferencia),
          metaMensal: parseFloat(metaMensal),
          metaSalvio: parseFloat(metaSalvio || '0'),
          metaCoordenador: parseFloat(metaCoordenador || '0'),
          metasVendedores: metasVendedores || [],
          criadoPor: userId,
          atualizadoPor: userId,
        },
      });

      return NextResponse.json({
        success: true,
        meta: novaMeta,
        message: 'Meta criada com sucesso!',
      });
    } catch (error) {
      console.error('[API_METAS] Erro ao criar meta:', error);
      return NextResponse.json(
        {
          error: 'Erro ao criar meta',
          details: 'Tabela de metas não configurada. Execute as migrations do Prisma.',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[API_METAS] Erro no POST:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar requisição',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
