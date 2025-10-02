import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/app/_lib/supabase';

export interface Meta {
  id: string;
  mesReferencia: Date;
  metaMensal: number;
  metaSalvio: number;
  metaCoordenador: number;
  metasVendedores?: Array<{
    vendedorId: string;
    nome: string;
    meta: number;
  }>;
  criadoPor: string;
  atualizadoPor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetaFormData {
  mesReferencia: Date;
  metaMensal: number;
  metaSalvio: number;
  metaCoordenador: number;
  metasVendedores?: Array<{
    vendedorId: string;
    nome: string;
    meta: number;
  }>;
}

export function useMetas() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Carregar todas as metas
  const loadMetas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('meta')
        .select('*')
        .order('mes_referencia', { ascending: false });

      if (error) {
        throw error;
      }

      // Processar metas para converter datas e JSON
      const metasProcessadas = data.map(meta => ({
        id: meta.id,
        mesReferencia: new Date(meta.mes_referencia),
        metaMensal: meta.meta_mensal,
        metaSalvio: meta.meta_salvio,
        metaCoordenador: meta.meta_coordenador,
        metasVendedores: meta.metas_vendedores ? (typeof meta.metas_vendedores === 'string' ? JSON.parse(meta.metas_vendedores) : meta.metas_vendedores) : [],
        criadoPor: meta.criado_por,
        atualizadoPor: meta.atualizado_por,
        createdAt: new Date(meta.created_at),
        updatedAt: new Date(meta.updated_at)
      }));

      setMetas(metasProcessadas);
    } catch (err) {
      console.error('Erro ao carregar metas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Criar nova meta
  const createMeta = useCallback(async (metaData: MetaFormData): Promise<Meta> => {
    try {
      const { data, error } = await supabase
        .from('meta')
        .insert({
          mes_referencia: metaData.mesReferencia.toISOString(),
          meta_mensal: metaData.metaMensal,
          meta_salvio: metaData.metaSalvio,
          meta_coordenador: metaData.metaCoordenador,
          metas_vendedores: metaData.metasVendedores ? JSON.stringify(metaData.metasVendedores) : null,
          criado_por: (await supabase.auth.getUser()).data.user?.id || 'system',
          atualizado_por: (await supabase.auth.getUser()).data.user?.id || 'system'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Processar resposta
      const metaProcessada = {
        id: data.id,
        mesReferencia: new Date(data.mes_referencia),
        metaMensal: data.meta_mensal,
        metaSalvio: data.meta_salvio,
        metaCoordenador: data.meta_coordenador,
        metasVendedores: data.metas_vendedores ? (typeof data.metas_vendedores === 'string' ? JSON.parse(data.metas_vendedores) : data.metas_vendedores) : [],
        criadoPor: data.criado_por,
        atualizadoPor: data.atualizado_por,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Atualizar lista local
      setMetas(prev => [metaProcessada, ...prev]);
      
      return metaProcessada;
    } catch (err) {
      console.error('Erro ao criar meta:', err);
      throw err;
    }
  }, [supabase]);

  // Atualizar meta existente
  const updateMeta = useCallback(async (id: string, metaData: MetaFormData): Promise<Meta> => {
    try {
      const { data, error } = await supabase
        .from('meta')
        .update({
          mes_referencia: metaData.mesReferencia.toISOString(),
          meta_mensal: metaData.metaMensal,
          meta_salvio: metaData.metaSalvio,
          meta_coordenador: metaData.metaCoordenador,
          metas_vendedores: metaData.metasVendedores ? JSON.stringify(metaData.metasVendedores) : null,
          atualizado_por: (await supabase.auth.getUser()).data.user?.id || 'system'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Processar resposta
      const metaProcessada = {
        id: data.id,
        mesReferencia: new Date(data.mes_referencia),
        metaMensal: data.meta_mensal,
        metaSalvio: data.meta_salvio,
        metaCoordenador: data.meta_coordenador,
        metasVendedores: data.metas_vendedores ? (typeof data.metas_vendedores === 'string' ? JSON.parse(data.metas_vendedores) : data.metas_vendedores) : [],
        criadoPor: data.criado_por,
        atualizadoPor: data.atualizado_por,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      // Atualizar lista local
      setMetas(prev => prev.map(meta => meta.id === id ? metaProcessada : meta));
      
      return metaProcessada;
    } catch (err) {
      console.error('Erro ao atualizar meta:', err);
      throw err;
    }
  }, [supabase]);

  // Excluir meta
  const deleteMeta = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('meta')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Atualizar lista local
      setMetas(prev => prev.filter(meta => meta.id !== id));
    } catch (err) {
      console.error('Erro ao excluir meta:', err);
      throw err;
    }
  }, [supabase]);

  // Buscar meta por ID
  const getMetaById = useCallback(async (id: string): Promise<Meta | null> => {
    try {
      const { data, error } = await supabase
        .from('meta')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      // Processar resposta
      return {
        id: data.id,
        mesReferencia: new Date(data.mes_referencia),
        metaMensal: data.meta_mensal,
        metaSalvio: data.meta_salvio,
        metaCoordenador: data.meta_coordenador,
        metasVendedores: data.metas_vendedores ? (typeof data.metas_vendedores === 'string' ? JSON.parse(data.metas_vendedores) : data.metas_vendedores) : [],
        criadoPor: data.criado_por,
        atualizadoPor: data.atualizado_por,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (err) {
      console.error('Erro ao buscar meta:', err);
      throw err;
    }
  }, [supabase]);

  // Carregar metas na inicialização
  useEffect(() => {
    loadMetas();
  }, [loadMetas]);

  return {
    metas,
    loading,
    error,
    loadMetas,
    createMeta,
    updateMeta,
    deleteMeta,
    getMetaById
  };
}
