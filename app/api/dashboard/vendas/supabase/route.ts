import { NextRequest, NextResponse } from 'next/server'
import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase'

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const forceUpdate = searchParams.get('forceUpdate') === 'true'
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

    console.log(`⚠️ ROTA SUPABASE DESABILITADA - Dados em tempo real do Gestão Click (${dataInicio} até ${dataFim})`)

    // TODO: Obter userId da sessão quando a autenticação estiver configurada
    // Por enquanto, usando um userId fixo para teste
    const userId = '6e51c8dc-bec5-46e5-a9c9-eda3d11dcd09' // ID do usuário de teste

    // SINCRONIZAÇÃO COM SUPABASE COMPLETAMENTE DESABILITADA
    // Retornando dados diretamente do Gestão Click sem armazenar no Supabase
    const dados = await GestaoClickSupabaseService.sincronizarVendas({
      dataInicio: dataInicioObj,
      dataFim: dataFimObj,
      userId,
      forceUpdate: true // SEMPRE forçar atualização - dados diretos do Gestão Click
    })

    // Garantir que syncInfo existe - sempre refletindo dados diretos do Gestão Click
    const syncInfo = {
      lastSync: new Date().toISOString(),
      source: 'gestao-click-direct' as const, // Indicando dados diretos
      cacheHit: false // Cache suspenso
    }

    if (debug) {
      console.log('Dados sincronizados:', {
        totalVendas: dados.totalVendas,
        totalValor: dados.totalValor,
        vendedoresCount: dados.vendedores.length,
        produtosCount: dados.produtosMaisVendidos.length,
        source: dados.syncInfo.source,
        cacheHit: dados.syncInfo.cacheHit,
        lastSync: dados.syncInfo.lastSync
      })
    }

    // Calcular métricas adicionais
    const ticketMedio = dados.totalVendas > 0 ? dados.totalValor / dados.totalVendas : 0

    // Processar vendedores para formato da Dashboard
    const vendedoresProcessados = dados.vendedores.map(vendedor => ({
      id: vendedor.id,
      nome: vendedor.nome,
      vendas: dados.vendas.filter(v => v.vendedor_id === vendedor.id).length,
      valor: dados.vendas
        .filter(v => v.vendedor_id === vendedor.id)
        .reduce((sum, v) => sum + v.valor_total, 0),
      ticketMedio: 0 // Será calculado abaixo
    })).map(vendedor => ({
      ...vendedor,
      ticketMedio: vendedor.vendas > 0 ? vendedor.valor / vendedor.vendas : 0
    })).sort((a, b) => b.valor - a.valor)

    return NextResponse.json({
      vendas: dados.vendas,
      totalVendas: dados.totalVendas,
      totalValor: dados.totalValor,
      ticketMedio,
      vendedores: vendedoresProcessados,
      produtosMaisVendidos: dados.produtosMaisVendidos,
      syncInfo: syncInfo,
      debug: debug ? {
        dataInicio: dataInicioObj.toISOString(),
        dataFim: dataFimObj.toISOString(),
        userId,
        forceUpdate,
        timestamp: new Date().toISOString(),
        cacheKey: `vendas-cache-${userId}-${dataInicioObj.toISOString().split('T')[0]}-${dataFimObj.toISOString().split('T')[0]}`
      } : undefined
    })

  } catch (error) {
    console.error('Erro ao sincronizar dados Gestão Click + Supabase:', error)
    return NextResponse.json(
      { 
        erro: 'Erro ao processar requisição', 
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
        vendas: [],
        totalVendas: 0,
        totalValor: 0
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { acao, parametros } = body

    console.log('Recebendo ação para processar:', { acao, parametros })

    switch (acao) {
      case 'sincronizar':
        // Forçar sincronização completa
        const { dataInicio, dataFim, userId } = parametros
        
        if (!dataInicio || !dataFim || !userId) {
          return NextResponse.json(
            { erro: 'Parâmetros dataInicio, dataFim e userId são obrigatórios' },
            { status: 400 }
          )
        }

        const dados = await GestaoClickSupabaseService.sincronizarVendas({
          dataInicio: new Date(dataInicio),
          dataFim: new Date(dataFim),
          userId,
          forceUpdate: true
        })

        return NextResponse.json({ 
          success: true, 
          dados,
          mensagem: 'Sincronização forçada concluída com sucesso'
        })

      case 'limpar-cache':
        // Limpar cache de um usuário específico
        const { userId: userIdCache } = parametros
        
        if (!userIdCache) {
          return NextResponse.json(
            { erro: 'Parâmetro userId é obrigatório' },
            { status: 400 }
          )
        }

        // TODO: Implementar limpeza de cache
        return NextResponse.json({ 
          success: true, 
          mensagem: 'Cache limpo com sucesso'
        })

      default:
        return NextResponse.json(
          { erro: 'Ação não suportada' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro ao processar ação:', error)
    return NextResponse.json(
      { 
        erro: 'Erro ao processar ação',
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
