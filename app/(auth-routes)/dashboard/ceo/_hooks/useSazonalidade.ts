/**
 * 🪝 CEO DASHBOARD - HOOK SAZONALIDADE
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import CEOCrescimentoService from '../_services/ceo-crescimento.service';
import type { CEODashboardFilters } from '../_types/ceo-dashboard.types';
import type { SazonalidadeData } from '../_types/sazonalidade.types';

export function useSazonalidade(filtros: Omit<CEODashboardFilters, 'userId'>) {
  const { data: session } = useSession();
  const [data, setData] = useState<SazonalidadeData | null>(null);
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
      
      const resultado = await CEOCrescimentoService.analisarSazonalidade(fullFiltros);
      setData(resultado);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar sazonalidade');
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


