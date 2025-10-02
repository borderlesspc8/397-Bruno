import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase'

interface UseGestaoClickOptimizedProps {
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

// Cache global para evitar múltiplas requisições simultâneas
const requestCache = new Map<string, Promise<any>>()
const dataCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30000 // 30 segundos

export function useGestaoClickOptimized({
  dataInicio,
  dataFim,
  userId,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutos
  forceUpdate = false,
  enabled = true
}: UseGestaoClickOptimizedProps) {
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
  
  // Controle de requisições em andamento
  const fetchingRef = useRef(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchRef = useRef<string>('')
  const mountedRef = useRef(true)

  // Função para processar vendedores - memoizada
  const processVendedores = useCallback((vendas: any[], vendedores: any[]) => {
    return vendedores.map(vendedor => {
      const vendasVendedor = vendas.filter(v => v.vendedor_id === vendedor.id)
      const totalVendas = vendasVendedor.length
      const totalValor = vendasVendedor.reduce((sum, v) => sum + v.valor_total, 0)
      
      return {
        id: vendedor.id,
        nome: vendedor.nome,
        vendas: totalVendas,
        valor: totalValor,
        ticketMedio: totalVendas > 0 ? totalValor / totalVendas : 0
      }
    }).sort((a, b) => b.valor - a.valor)
  }, [])

  // Função para buscar dados - otimizada
  const fetchData = useCallback(async () => {
    if (!userId || !mountedRef.current) return

    // Verificar se já há uma requisição em andamento
    if (fetchingRef.current) return

    try {
      fetchingRef.current = true
      setData(prev => ({ ...prev, loading: true, error: null }))

      // Criar chave única para cache
      const cacheKey = `${userId}-${dataInicio.toISOString()}-${dataFim.toISOString()}-${forceUpdate}`
      
      // Verificar cache de dados
      const cachedData = dataCache.get(cacheKey)
      if (cachedData && !forceUpdate) {
        const now = Date.now()
        if (now - cachedData.timestamp < CACHE_TTL) {
          setData(prev => ({
            ...prev,
            ...cachedData.data,
            loading: false
          }))
          fetchingRef.current = false
          return
        }
      }

      // Verificar se já há uma requisição em andamento para a mesma chave
      if (requestCache.has(cacheKey)) {
        const result = await requestCache.get(cacheKey)
        if (mountedRef.current) {
          setData(prev => ({
            ...prev,
            ...result,
            loading: false
          }))
        }
        fetchingRef.current = false
        return
      }

      // Criar promise para cache
      const fetchPromise = (async () => {
        const dados = await GestaoClickSupabaseService.sincronizarVendas({
          dataInicio,
          dataFim,
          userId,
          forceUpdate
        })

        const vendedoresProcessados = processVendedores(dados.vendas, dados.vendedores)

        const result = {
          vendas: dados.vendas,
          vendedores: vendedoresProcessados,
          produtos: dados.produtosMaisVendidos,
          totalVendas: dados.totalVendas,
          totalValor: dados.totalValor,
          ticketMedio: dados.totalVendas > 0 ? dados.totalValor / dados.totalVendas : 0,
          syncInfo: dados.syncInfo as SyncInfo,
          loading: false,
          error: null
        }

        // Armazenar no cache
        dataCache.set(cacheKey, { data: result, timestamp: Date.now() })
        
        return result
      })()

      // Armazenar promise no cache
      requestCache.set(cacheKey, fetchPromise)

      const result = await fetchPromise

      // Limpar cache de promises após uso
      requestCache.delete(cacheKey)

      if (mountedRef.current) {
        setData(result)
      }

    } catch (error) {
      console.error('Erro ao sincronizar dados:', error)
      if (mountedRef.current) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }))
      }
    } finally {
      fetchingRef.current = false
    }
  }, [dataInicio, dataFim, userId, forceUpdate, processVendedores])

  // Effect para buscar dados iniciais - otimizado
  useEffect(() => {
    if (!enabled || !userId) {
      setData(prev => ({ ...prev, loading: false }))
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
    
    // Debounce de 200ms para evitar múltiplas chamadas
    debounceRef.current = setTimeout(() => {
      if (!fetchingRef.current && mountedRef.current) {
        lastFetchRef.current = key
        fetchData()
      }
    }, 200)
    
    // Cleanup do timeout
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [dataInicio?.toISOString(), dataFim?.toISOString(), userId, forceUpdate, enabled, fetchData])

  // Effect para auto-refresh - desabilitado temporariamente
  useEffect(() => {
    return
  }, [])

  // Effect para tempo real - desabilitado temporariamente
  useEffect(() => {
    return
  }, [])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Função para forçar sincronização
  const forceSync = useCallback(async () => {
    if (!userId || !mountedRef.current) return

    try {
      setData(prev => ({ ...prev, loading: true, error: null }))

      const dados = await GestaoClickSupabaseService.sincronizarVendas({
        dataInicio,
        dataFim,
        userId,
        forceUpdate: true
      })

      const vendedoresProcessados = processVendedores(dados.vendas, dados.vendedores)

      if (mountedRef.current) {
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
      }

    } catch (error) {
      console.error('Erro na sincronização forçada:', error)
      if (mountedRef.current) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }))
      }
    }
  }, [dataInicio, dataFim, userId, processVendedores])

  // Função para refresh manual
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Memoizar dados para evitar re-renders desnecessários
  const memoizedData = useMemo(() => data, [
    data.vendas.length,
    data.vendedores.length,
    data.totalVendas,
    data.totalValor,
    data.loading,
    data.error
  ])

  return {
    ...memoizedData,
    forceSync,
    refresh,
    isRealtimeConnected: !!subscription,
    lastSync: data.syncInfo.lastSync,
    dataSource: data.syncInfo.source,
    isFromCache: data.syncInfo.cacheHit
  }
}
