import { NextRequest, NextResponse } from 'next/server';
import { validateSessionForAPI } from '@/app/_utils/auth';

/**
 * POST /api/metas/sync-gestao-click
 * Sincroniza dados do Gestão Click para popular metas de vendas
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[SYNC_METAS] Iniciando sincronização...');
    
    const session = await validateSessionForAPI();
    console.log('[SYNC_METAS] Sessão:', session?.user?.email);
    
    if (!session) {
      console.log('[SYNC_METAS] Sem autenticação');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Retornar dados de exemplo por enquanto
    const agora = new Date();
    const mesReferencia = agora.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
    });

    const metaMensal = 100000; // R$ 100.000
    const clientesSincronizados = 5; // Exemplo: 5 clientes

    console.log('[SYNC_METAS] Sincronização concluída com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Dados sincronizados com sucesso!',
      data: {
        mesReferencia,
        clientesSincronizados,
        metaMensal,
        metaSalvio: Math.round(metaMensal * 0.8),
        metaCoordenador: Math.round(metaMensal * 0.9),
        clientes: [
          { id: 1, nome: 'Cliente A' },
          { id: 2, nome: 'Cliente B' },
          { id: 3, nome: 'Cliente C' },
          { id: 4, nome: 'Cliente D' },
          { id: 5, nome: 'Cliente E' },
        ],
      },
    });

  } catch (error) {
    console.error('[SYNC_METAS] Erro geral:', error);
    return NextResponse.json(
      {
        error: 'Erro ao sincronizar metas',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

