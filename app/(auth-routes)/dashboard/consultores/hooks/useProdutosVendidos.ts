import { useState, useEffect, useCallback } from 'react';
import { ProdutosResponse } from '@/app/types/consultores';
import { ConsultoresService } from '@/app/_services/consultores';

export interface UseProdutosVendidosProps {
  dateRange: { from: Date; to: Date };
  consultorId?: string | null;
}

export interface UseProdutosVendidosResult {
  data: ProdutosResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProdutosVendidos({ dateRange, consultorId }: UseProdutosVendidosProps): UseProdutosVendidosResult {
  const [data, setData] = useState<ProdutosResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ConsultoresService.getProdutos({
        dataInicio: dateRange.from,
        dataFim: dateRange.to,
        consultorId
      });
      
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar produtos vendidos:', err);
      setError('Não foi possível carregar os produtos vendidos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to, consultorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
} 
