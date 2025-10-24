import { NextRequest, NextResponse } from 'next/server';
import CEODREGerencialService from '../../../(auth-routes)/dashboard/ceo/_services/ceo-dre-gerencial.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicioStr = searchParams.get('data_inicio');
    const dataFimStr = searchParams.get('data_fim');

    if (!dataInicioStr || !dataFimStr) {
      return NextResponse.json({ error: 'data_inicio e data_fim são obrigatórios' }, { status: 400 });
    }

    const dataInicio = new Date(dataInicioStr);
    const dataFim = new Date(dataFimStr);

    if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
      return NextResponse.json({ error: 'Formato de data inválido' }, { status: 400 });
    }

    console.log('[API/CEO/DRE-Gerencial] 📊 Calculando DRE Gerencial com dados reais do GestãoClick', {
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: dataFim.toISOString().split('T')[0],
    });

    const dreData = await CEODREGerencialService.calcularDREConsolidadaGerencial(dataInicio, dataFim);

    console.log('[API/CEO/DRE-Gerencial] ✅ DRE Gerencial calculada com sucesso', {
      matriz: {
        receitaLiquida: dreData.matriz.receitaLiquida,
        lucroLiquido: dreData.matriz.lucroLiquido,
        margemLiquida: dreData.matriz.lucroLiquidoPercent,
      },
      filialGolden: {
        receitaLiquida: dreData.filialGolden.receitaLiquida,
        lucroLiquido: dreData.filialGolden.lucroLiquido,
        margemLiquida: dreData.filialGolden.lucroLiquidoPercent,
      },
      consolidado: {
        receitaLiquida: dreData.consolidado.receitaLiquida,
        lucroLiquido: dreData.consolidado.lucroLiquido,
        margemLiquida: dreData.consolidado.lucroLiquidoPercent,
      },
    });

    return NextResponse.json({ 
      success: true, 
      data: dreData,
      metadata: {
        fonte: 'GestãoClick DRE Gerencial',
        periodo: `${dataInicio.toISOString().split('T')[0]} a ${dataFim.toISOString().split('T')[0]}`,
        calculadoEm: new Date().toISOString(),
        unidades: ['Matriz', 'Filial Golden', 'Consolidado'],
      }
    });

  } catch (error: any) {
    console.error('[API/CEO/DRE-Gerencial] ❌ Erro:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao calcular DRE Gerencial',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}
