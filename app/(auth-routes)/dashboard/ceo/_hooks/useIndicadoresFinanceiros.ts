/**
 * 🪝 CEO DASHBOARD - HOOK INDICADORES FINANCEIROS
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import CEOFinanceiroService from '../_services/ceo-financeiro.service';
import type { CEODashboardFilters } from '../_types/ceo-dashboard.types';

export function useIndicadoresFinanceiros(filtros: Omit<CEODashboardFilters, 'userId'>) {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fullFiltros: CEODashboardFilters = {
        ...filtros,
        userId: session.user.id,
      };
      
      const resultado = await CEOFinanceiroService.calcularIndicadoresFinanceiros(fullFiltros);
      
      if (resultado.success && resultado.data) {
        setData(resultado.data);
      } else {
        setError(resultado.error || 'Erro ao carregar indicadores');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, filtros.dataInicio, filtros.dataFim]);
  
  useEffect(() => {
    if (session?.user?.id) {
      load();
    }
  }, [session?.user?.id, load]);
  
  return { data, loading, error, reload: load };
}


