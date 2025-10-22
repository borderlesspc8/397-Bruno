/**
 * 🔌 CEO DASHBOARD - PROXY PARA /formas_pagamentos
 * 
 * ✅ ISOLADO - Não afeta outros dashboards
 * ✅ Usa BetelTecnologiaService (que funciona)
 */

import { NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = `/formas_pagamentos`;
    
    // @ts-ignore - Usar método interno do BetelTecnologiaService
    const result = await BetelTecnologiaService.fetchWithRetry(url);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    const data = result.data?.data || result.data || [];
    
    return NextResponse.json({ data });
    
  } catch (error: any) {
    console.error('[CEO-API-FormasPagamento] Erro:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao buscar formas de pagamento',
      data: []
    }, { status: 500 });
  }
}



