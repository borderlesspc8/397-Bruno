/**
 * Hook para buscar métricas avançadas com dados reais da API Betel
 * ISOLADO - Não afeta outras dashboards
 */

import { useState, useEffect, useCallback } from 'react';
import { CEOAdvancedMetricsService, AdvancedMetrics } from '../services/advanced-metrics';

interface UseAdvancedMetricsOptions {
  startDate: string;
  endDate: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseAdvancedMetricsReturn {
  data: AdvancedMetrics | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAdvancedMetrics({
  startDate,
  endDate,
  autoRefresh = false,
  refreshInterval = 300000 // 5 minutos por padrão
}: UseAdvancedMetricsOptions): UseAdvancedMetricsReturn {
  const [data, setData] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('CEO: Buscando métricas avançadas...', { startDate, endDate });

      // Buscar todas as métricas avançadas (o serviço buscará da API automaticamente)
      const metrics = await CEOAdvancedMetricsService.calculateAllAdvancedMetrics({
        startDate,
        endDate
      });

      console.log('CEO: Métricas avançadas obtidas:', metrics);

      setData(metrics);
    } catch (err) {
      console.error('CEO: Erro ao buscar métricas avançadas:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao buscar métricas'));
      
      // Em caso de erro, manter dados anteriores se existirem
      if (!data) {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Buscar dados quando as datas mudarem
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh (opcional)
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      console.log('CEO: Auto-refresh de métricas avançadas...');
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics
  };
}

export default useAdvancedMetrics;

