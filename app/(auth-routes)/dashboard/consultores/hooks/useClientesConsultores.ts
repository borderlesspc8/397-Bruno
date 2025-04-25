import { useState, useEffect, useCallback } from 'react';
import { ClientesResponse } from '@/app/types/consultores';
import { ConsultoresService } from '@/app/_services/consultores';

export interface UseClientesConsultoresProps {
  dateRange: { from: Date; to: Date };
  consultorId?: string | null;
}

export interface UseClientesConsultoresResult {
  data: ClientesResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClientesConsultores({ dateRange, consultorId }: UseClientesConsultoresProps): UseClientesConsultoresResult {
  const [data, setData] = useState<ClientesResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ConsultoresService.getClientes({
        dataInicio: dateRange.from,
        dataFim: dateRange.to,
        consultorId
      });
      
      setData(result);
    } catch (err) {
      console.error('Erro ao buscar dados dos clientes:', err);
      setError('Não foi possível carregar os dados dos clientes. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to, consultorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
} 