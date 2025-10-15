import { NextRequest, NextResponse } from 'next/server'

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const debug = searchParams.get('debug') === 'true'

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { 
          erro: 'Parâmetros dataInicio e dataFim são obrigatórios',
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 400 }
      )
    }

    // Converter strings para Date
    const dataInicioObj = new Date(dataInicio)
    const dataFimObj = new Date(dataFim)

    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      return NextResponse.json(
        { 
          erro: 'Formato de data inválido. Use ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)',
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 400 }
      )
    }

    console.log(`⚠️ ROTA SUPABASE PURA DESABILITADA - Use /api/dashboard/vendas/supabase para dados do Gestão Click`)

    // ROTA COMPLETAMENTE DESABILITADA - Busca direta no Supabase suspensa
    return NextResponse.json({
      erro: 'Rota Supabase desabilitada temporariamente. Use dados do Gestão Click em tempo real.',
      vendas: [],
      totalVendas: 0,
      totalValor: 0,
      ticketMedio: 0,
      vendedores: [],
      produtosMaisVendidos: [],
      syncInfo: {
        lastSync: new Date().toISOString(),
        source: 'disabled',
        cacheHit: false
      },
      message: 'Esta rota foi desabilitada. Os dados agora vêm diretamente do Gestão Click.',
      debug: debug ? {
        dataInicio: dataInicioObj.toISOString(),
        dataFim: dataFimObj.toISOString(),
        timestamp: new Date().toISOString(),
        note: 'Rota Supabase pura desabilitada - Use /api/dashboard/vendas/supabase'
      } : undefined
    })

  } catch (error) {
    console.error('Erro na rota Supabase desabilitada:', error)
    return NextResponse.json(
      { 
        erro: 'Rota Supabase desabilitada - Use dados do Gestão Click',
        vendas: [],
        totalVendas: 0,
        totalValor: 0
      },
      { status: 503 }
    )
  }
}
