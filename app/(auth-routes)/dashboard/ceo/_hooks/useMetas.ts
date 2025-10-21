/**
 * 🪝 CEO DASHBOARD - HOOK METAS
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import CEOMetasService from '../_services/ceo-metas.service';
import type { Meta, MetaFormData, MetasResumo, MetasFiltros } from '../_types/metas.types';

export function useMetas(filtros?: Partial<MetasFiltros>) {
  const { data: session } = useSession();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [resumo, setResumo] = useState<MetasResumo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const load = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fullFiltros: MetasFiltros = {
        userId: session.user.id,
        ...filtros,
      };
      
      const [metasResult, resumoData] = await Promise.all([
        CEOMetasService.listarMetas(fullFiltros),
        CEOMetasService.calcularResumoMetas(session.user.id, filtros?.periodos?.[0]),
      ]);
      
      if (metasResult.success && metasResult.data) {
        setMetas(metasResult.data);
        setResumo(resumoData);
      } else {
        setError(metasResult.error || 'Erro ao carregar metas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, JSON.stringify(filtros)]);
  
  const criarMeta = useCallback(async (data: MetaFormData) => {
    if (!session?.user?.id) return { success: false, error: 'Não autenticado' };
    
    const resultado = await CEOMetasService.criarMeta(session.user.id, data);
    if (resultado.success) {
      await load();
    }
    return resultado;
  }, [session?.user?.id, load]);
  
  const atualizarMeta = useCallback(async (id: string, data: Partial<MetaFormData>) => {
    if (!session?.user?.id) return { success: false, error: 'Não autenticado' };
    
    const resultado = await CEOMetasService.atualizarMeta(id, session.user.id, data);
    if (resultado.success) {
      await load();
    }
    return resultado;
  }, [session?.user?.id, load]);
  
  const deletarMeta = useCallback(async (id: string) => {
    if (!session?.user?.id) return { success: false, error: 'Não autenticado' };
    
    const resultado = await CEOMetasService.deletarMeta(id, session.user.id);
    if (resultado.success) {
      await load();
    }
    return resultado;
  }, [session?.user?.id, load]);
  
  useEffect(() => {
    if (session?.user?.id) {
      load();
    }
  }, [session?.user?.id, load]);
  
  return {
    metas,
    resumo,
    loading,
    error,
    reload: load,
    criarMeta,
    atualizarMeta,
    deletarMeta,
  };
}


