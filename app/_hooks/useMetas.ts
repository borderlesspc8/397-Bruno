import { useState, useEffect, useCallback } from 'react';

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

  // Carregar todas as metas
  const loadMetas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/metas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar metas');
      }

      const result = await response.json();

      if (result.success) {
        // Processar metas para converter datas
        const metasProcessadas = (result.metas || []).map((meta: any) => ({
          id: meta.id,
          mesReferencia: new Date(meta.mesReferencia),
          metaMensal: meta.metaMensal,
          metaSalvio: meta.metaSalvio,
          metaCoordenador: meta.metaCoordenador,
          metasVendedores: meta.metasVendedores || [],
          criadoPor: meta.criadoPor,
          atualizadoPor: meta.atualizadoPor,
          createdAt: new Date(meta.createdAt),
          updatedAt: new Date(meta.updatedAt)
        }));

        setMetas(metasProcessadas);
      } else {
        setMetas([]);
      }
    } catch (err) {
      console.error('Erro ao carregar metas:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar metas');
      setMetas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar nova meta
  const createMeta = useCallback(async (metaData: MetaFormData): Promise<Meta> => {
    try {
      const response = await fetch('/api/metas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mesReferencia: metaData.mesReferencia.toISOString(),
          metaMensal: metaData.metaMensal,
          metaSalvio: metaData.metaSalvio,
          metaCoordenador: metaData.metaCoordenador,
          metasVendedores: metaData.metasVendedores || [],
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar meta');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar meta');
      }

      // Processar resposta
      const metaProcessada = {
        id: result.meta.id,
        mesReferencia: new Date(result.meta.mesReferencia),
        metaMensal: result.meta.metaMensal,
        metaSalvio: result.meta.metaSalvio,
        metaCoordenador: result.meta.metaCoordenador,
        metasVendedores: result.meta.metasVendedores || [],
        criadoPor: result.meta.criadoPor,
        atualizadoPor: result.meta.atualizadoPor,
        createdAt: new Date(result.meta.createdAt),
        updatedAt: new Date(result.meta.updatedAt)
      };

      // Atualizar lista local
      setMetas(prev => [metaProcessada, ...prev]);
      
      return metaProcessada;
    } catch (err) {
      console.error('Erro ao criar meta:', err);
      throw err;
    }
  }, []);

  // Atualizar meta existente
  const updateMeta = useCallback(async (id: string, metaData: MetaFormData): Promise<Meta> => {
    try {
      // Por enquanto, apenas atualiza localmente
      // TODO: Implementar endpoint PUT /api/metas/[id]
      throw new Error('Atualização de metas ainda não implementada');
    } catch (err) {
      console.error('Erro ao atualizar meta:', err);
      throw err;
    }
  }, []);

  // Excluir meta
  const deleteMeta = useCallback(async (id: string): Promise<void> => {
    try {
      // Por enquanto, apenas remove localmente
      // TODO: Implementar endpoint DELETE /api/metas/[id]
      setMetas(prev => prev.filter(meta => meta.id !== id));
    } catch (err) {
      console.error('Erro ao excluir meta:', err);
      throw err;
    }
  }, []);

  // Buscar meta por ID
  const getMetaById = useCallback(async (id: string): Promise<Meta | null> => {
    try {
      const meta = metas.find(m => m.id === id);
      return meta || null;
    } catch (err) {
      console.error('Erro ao buscar meta:', err);
      throw err;
    }
  }, [metas]);

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
