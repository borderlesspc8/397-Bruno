import { useState, useEffect, useCallback } from 'react';
import { HistoricoResponse } from '@/app/types/consultores';
import { ConsultoresService } from '@/app/_services/consultores';

export interface UseHistoricoVendasProps {
  dateRange: { from: Date; to: Date };
  consultorId?: string | null;
  tipoPeriodo?: 'diario' | 'semanal' | 'mensal';
}

export interface UseHistoricoVendasResult {
  data: HistoricoResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useHistoricoVendas({ dateRange, consultorId, tipoPeriodo = 'mensal' }: UseHistoricoVendasProps): UseHistoricoVendasResult {
  const [data, setData] = useState<HistoricoResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ConsultoresService.getHistorico({
        dataInicio: dateRange.from,
        dataFim: dateRange.to,
        consultorId,
        tipoPeriodo
      });
      
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar histórico de vendas:', err);
      setError('Não foi possível carregar o histórico de vendas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to, consultorId, tipoPeriodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
} 
