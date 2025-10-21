/**
 * 🪝 CEO DASHBOARD - HOOK DRE
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import CEODREService from '../_services/ceo-dre.service';
import type { DRECompleta, DRECascata, DRECalculoParams } from '../_types/dre.types';

export function useDREData(params: Omit<DRECalculoParams, 'userId'>) {
  const { data: session } = useSession();
  const [dre, setDre] = useState<DRECompleta | null>(null);
  const [cascata, setCascata] = useState<DRECascata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fullParams: DRECalculoParams = {
        ...params,
        userId: session.user.id,
      };
      
      const [dreData, cascataData] = await Promise.all([
        CEODREService.calcularDRE(fullParams),
        CEODREService.gerarDRECascata(fullParams),
      ]);
      
      setDre(dreData);
      setCascata(cascataData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar DRE');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, params.dataInicio, params.dataFim, params.tipo]);
  
  useEffect(() => {
    if (session?.user?.id) {
      load();
    }
  }, [session?.user?.id, load]);
  
  return { dre, cascata, loading, error, reload: load };
}


