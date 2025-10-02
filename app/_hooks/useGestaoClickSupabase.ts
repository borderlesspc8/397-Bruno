import { useState, useEffect, useCallback, useRef } from 'react'
import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase'

interface UseGestaoClickSupabaseProps {
  dataInicio: Date
  dataFim: Date
  userId?: string
  autoRefresh?: boolean
  refreshInterval?: number
  forceUpdate?: boolean
  enabled?: boolean
}

interface SyncInfo {
  lastSync: string
  source: 'supabase-cache' | 'gestao-click' | 'gestao-click-direct'
  cacheHit: boolean
}

interface DashboardData {
  vendas: any[]
  vendedores: Array<{
    id: string
    nome: string
    vendas: number
    valor: number
    ticketMedio: number
  }>
  produtos: any[]
  totalVendas: number
  totalValor: number
  ticketMedio: number
  syncInfo: SyncInfo
  loading: boolean
  error: string | null
}

export function useGestaoClickSupabase({
  dataInicio,
  dataFim,
  userId,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutos
  forceUpdate = false,
  enabled = true
}: UseGestaoClickSupabaseProps) {
  const [data, setData] = useState<DashboardData>({
    vendas: [],
    vendedores: [],
    produtos: [],
    totalVendas: 0,
    totalValor: 0,
    ticketMedio: 0,
    syncInfo: {
      lastSync: '',
      source: 'gestao-click' as const,
      cacheHit: false
    },
    loading: true,
    error: null
  })

  const [subscription, setSubscription] = useState<any>(null)
  
  // Controle de requisições em andamento para evitar duplicatas
  const [isFetching, setIsFetching] = useState(false)
  const fetchingRef = useRef(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchRef = useRef<string>('')

  // Função para buscar dados - otimizada para evitar loops
  const fetchData = useCallback(async () => {
    // Verificar se já há uma requisição em andamento
    if (fetchingRef.current) {
      return
    }

    if (!userId) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: null
      }))
      return
    }

    try {
      // Marcar como carregando e em andamento
      fetchingRef.current = true
      setIsFetching(true)
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Sincronizar dados do Gestão Click com Supabase
      // Usar forceUpdate apenas quando necessário (não sempre true)
      const dados = await GestaoClickSupabaseService.sincronizarVendas({
        dataInicio,
        dataFim,
        userId,
        forceUpdate: forceUpdate // Usar o parâmetro passado
      })

      // Processar vendedores para formato da Dashboard
      const vendedoresProcessados = dados.vendedores.map(vendedor => ({
        id: vendedor.id,
        nome: vendedor.nome,
        vendas: dados.vendas.filter(v => v.vendedor_id === vendedor.id).length,
        valor: dados.vendas
          .filter(v => v.vendedor_id === vendedor.id)
          .reduce((sum, v) => sum + v.valor_total, 0),
        ticketMedio: 0
      })).map(vendedor => ({
        ...vendedor,
        ticketMedio: vendedor.vendas > 0 ? vendedor.valor / vendedor.vendas : 0
      })).sort((a, b) => b.valor - a.valor)

      setData({
        vendas: dados.vendas,
        vendedores: vendedoresProcessados,
        produtos: dados.produtosMaisVendidos,
        totalVendas: dados.totalVendas,
        totalValor: dados.totalValor,
        ticketMedio: dados.totalVendas > 0 ? dados.totalValor / dados.totalVendas : 0,
        syncInfo: dados.syncInfo as SyncInfo,
        loading: false,
        error: null
      })

      // Marcar como concluído
      fetchingRef.current = false
      setIsFetching(false)

    } catch (error) {
      console.error('❌ Erro ao sincronizar dados:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }))
      
      // Marcar como concluído mesmo em caso de erro
      fetchingRef.current = false
      setIsFetching(false)
    }
  }, [dataInicio, dataFim, userId, forceUpdate])

  // Função para configurar tempo real - DESABILITADA TEMPORARIAMENTE
  const setupRealtime = useCallback(() => {
    // TEMPO REAL DESABILITADO PARA EVITAR LOOPS
    return
  }, [])

  // Função para limpar subscription
  const cleanupSubscription = useCallback(() => {
    if (subscription) {
      try {
        if (typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe()
        } else if (typeof subscription.close === 'function') {
          subscription.close()
        } else if (typeof subscription === 'function') {
          subscription()
        }
      } catch (error) {
        console.warn('Erro ao limpar subscription:', error)
      }
      setSubscription(null)
    }
  }, [subscription])

  // Função para forçar sincronização
  const forceSync = useCallback(async () => {
    if (!userId) return

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      const dados = await GestaoClickSupabaseService.sincronizarVendas({
        dataInicio,
        dataFim,
        userId,
        forceUpdate: true
      })

      // Processar vendedores
      const vendedoresProcessados = dados.vendedores.map(vendedor => ({
        id: vendedor.id,
        nome: vendedor.nome,
        vendas: dados.vendas.filter(v => v.vendedor_id === vendedor.id).length,
        valor: dados.vendas
          .filter(v => v.vendedor_id === vendedor.id)
          .reduce((sum, v) => sum + v.valor_total, 0),
        ticketMedio: 0
      })).map(vendedor => ({
        ...vendedor,
        ticketMedio: vendedor.vendas > 0 ? vendedor.valor / vendedor.vendas : 0
      })).sort((a, b) => b.valor - a.valor)

      setData({
        vendas: dados.vendas,
        vendedores: vendedoresProcessados,
        produtos: dados.produtosMaisVendidos,
        totalVendas: dados.totalVendas,
        totalValor: dados.totalValor,
        ticketMedio: dados.totalVendas > 0 ? dados.totalValor / dados.totalVendas : 0,
        syncInfo: dados.syncInfo as SyncInfo,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Erro na sincronização forçada:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }))
    }
  }, [dataInicio, dataFim, userId])

  // Effect para buscar dados iniciais - OTIMIZADO PARA EVITAR LOOPS
  useEffect(() => {
    if (!enabled || !userId) {
      return
    }

    // Limpar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Criar chave única para esta requisição
    const key = `${dataInicio?.toISOString()}-${dataFim?.toISOString()}-${userId}-${forceUpdate}`
    
    // Verificar se já foi feita uma busca recente com os mesmos parâmetros
    if (lastFetchRef.current === key && !forceUpdate) {
      return
    }
    
    // Debounce de 300ms para evitar múltiplas chamadas (reduzido de 500ms)
    debounceRef.current = setTimeout(() => {
      // Só executar se não estiver carregando
      if (!fetchingRef.current) {
        lastFetchRef.current = key // Marcar como realizada
        fetchData()
      }
    }, 300)
    
    // Cleanup do timeout
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [dataInicio?.toISOString(), dataFim?.toISOString(), userId, forceUpdate, enabled])

  // Effect para auto-refresh - DESABILITADO TEMPORARIAMENTE
  useEffect(() => {
    // AUTO-REFRESH DESABILITADO PARA EVITAR LOOPS
    return
  }, [])

  // Effect para tempo real - DESABILITADO TEMPORARIAMENTE
  useEffect(() => {
    // TEMPO REAL DESABILITADO PARA EVITAR LOOPS
    return
  }, [])

  // Função para refresh manual
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    ...data,
    forceSync,
    refresh,
    isRealtimeConnected: !!subscription,
    // Informações úteis para debug
    lastSync: data.syncInfo.lastSync,
    dataSource: data.syncInfo.source,
    isFromCache: data.syncInfo.cacheHit
  }
}
