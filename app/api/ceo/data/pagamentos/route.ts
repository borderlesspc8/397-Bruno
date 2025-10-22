/**
 * 🔌 CEO DASHBOARD - PROXY PARA /pagamentos
 * 
 * ✅ ISOLADO - Não afeta outros dashboards
 * ✅ Usa BetelTecnologiaService (que funciona)
 */

import { NextRequest, NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    
    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: 'data_inicio e data_fim são obrigatórios' }, { status: 400 });
    }
    
    const url = `/pagamentos?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=1000`;
    
    // @ts-ignore - Usar método interno do BetelTecnologiaService
    const result = await BetelTecnologiaService.fetchWithRetry(url);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    const data = result.data?.data || result.data || [];
    
    return NextResponse.json({ data });
    
  } catch (error: any) {
    console.error('[CEO-API-Pagamentos] Erro:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao buscar pagamentos',
      data: []
    }, { status: 500 });
  }
}



