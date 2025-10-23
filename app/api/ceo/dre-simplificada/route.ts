/**
 * 🔌 CEO DASHBOARD - API DRE SIMPLIFICADA
 * 
 * Endpoint para DRE simplificada com dados REAIS das APIs da Betel
 * Filtra por unidades Matriz e Filial Golden
 */

import { NextRequest, NextResponse } from 'next/server';
import CEODREBetelService from '@/app/(auth-routes)/dashboard/ceo/_services/ceo-dre-betel.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const unidade = searchParams.get('unidade') as 'Matriz' | 'Filial Golden' | 'Consolidado' || 'Consolidado';
    
    if (!dataInicio || !dataFim) {
      return NextResponse.json({ 
        error: 'data_inicio e data_fim são obrigatórios' 
      }, { status: 400 });
    }
    
    const dataInicioDate = new Date(dataInicio);
    const dataFimDate = new Date(dataFim);
    
    if (isNaN(dataInicioDate.getTime()) || isNaN(dataFimDate.getTime())) {
      return NextResponse.json({ 
        error: 'Datas inválidas' 
      }, { status: 400 });
    }
    
    console.log(`[CEO-API-DRE] 📊 Calculando DRE para ${unidade}`, {
      dataInicio: dataInicioDate.toISOString().split('T')[0],
      dataFim: dataFimDate.toISOString().split('T')[0],
    });
    
    let resultado;
    
    if (unidade === 'Consolidado') {
      // Retornar dados consolidados (Matriz + Filial Golden)
      resultado = await CEODREBetelService.calcularDREConsolidada(dataInicioDate, dataFimDate);
    } else {
      // Retornar dados de uma unidade específica
      const dre = await CEODREBetelService.calcularDRESimplificada(dataInicioDate, dataFimDate, unidade);
      resultado = { [unidade.toLowerCase()]: dre };
    }
    
    return NextResponse.json({ 
      success: true,
      data: resultado,
      timestamp: new Date().toISOString(),
      unidade,
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      }
    });
    
  } catch (error: any) {
    console.error('[CEO-API-DRE] ❌ Erro:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro ao calcular DRE',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
