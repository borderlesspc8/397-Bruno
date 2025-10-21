/**
 * 🪝 CEO DASHBOARD - HOOK PRINCIPAL
 * 
 * Hook React para gerenciar dados do Dashboard CEO
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/_hooks/useAuth';
import CEODashboardService from '../_services/ceo-dashboard.service';
import type { CEODashboardData, CEODashboardFilters } from '../_types/ceo-dashboard.types';

export interface UseCEODashboardOptions {
  dataInicio: Date;
  dataFim: Date;
  autoLoad?: boolean;
  forceUpdate?: boolean;
}

export function useCEODashboard(options: UseCEODashboardOptions) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<CEODashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  
  const { dataInicio, dataFim, autoLoad = true, forceUpdate = false } = options;
  
  const load = useCallback(async () => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const filtros: CEODashboardFilters = {
        dataInicio,
        dataFim,
        userId: user.id,
        forceUpdate: true, // ✅ SEMPRE BUSCAR DADOS FRESCOS - SEM CACHE
      };
      
      console.log('🔄 [useCEODashboard] Buscando dados FRESCOS (forceUpdate: true)');
      
      const resultado = await CEODashboardService.buscarDadosCompletos(filtros);
      
      if (resultado.success && resultado.data) {
        setData(resultado.data);
        setCached(resultado.cached);
        
        // ✅ LOG DE CONFIRMAÇÃO
        console.log('✅ [useCEODashboard] Dados carregados com sucesso!');
        console.log('📊 [useCEODashboard] Tem dadosBrutos?', !!resultado.data.dadosBrutos);
        console.log('📊 [useCEODashboard] Tem indicadores?', !!resultado.data.dadosBrutos?.indicadores);
        
        if (resultado.data.dadosBrutos?.indicadores) {
          console.log('🎉 [useCEODashboard] SUCESSO! Todos os indicadores das 25 APIs carregados!');
        } else {
          console.error('❌ [useCEODashboard] dadosBrutos.indicadores não existe!');
        }
      } else {
        setError(resultado.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [user?.id, dataInicio, dataFim, forceUpdate]);
  
  const reload = useCallback(() => {
    return load();
  }, [load]);
  
  const invalidateCache = useCallback(() => {
    if (user?.id) {
      CEODashboardService.invalidarCache(user.id);
    }
  }, [user?.id]);
  
  useEffect(() => {
    if (autoLoad && user?.id && !authLoading) {
      load();
    }
  }, [autoLoad, user?.id, authLoading, load]);
  
  return {
    data,
    loading: loading || authLoading,
    error,
    cached,
    reload,
    invalidateCache,
  };
}

