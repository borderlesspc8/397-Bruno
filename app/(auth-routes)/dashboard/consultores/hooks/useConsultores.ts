import { useState, useEffect, useCallback } from 'react';
import { ConsultorIndicadores, ConsultoresResponse } from '@/app/types/consultores';
import { ConsultoresService } from '@/app/_services/consultores';

export interface UseConsultoresProps {
  dateRange: { from: Date; to: Date };
  consultorId?: string | null;
}

export interface UseConsultoresResult {
  data: ConsultoresResponse | null;
  consultor: ConsultorIndicadores | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useConsultores({ dateRange, consultorId }: UseConsultoresProps): UseConsultoresResult {
  const [data, setData] = useState<ConsultoresResponse | null>(null);
  const [consultor, setConsultor] = useState<ConsultorIndicadores | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ConsultoresService.getConsultores({
        dataInicio: dateRange.from,
        dataFim: dateRange.to,
        consultorId
      });
      
      if (consultorId && result.consultores.length === 1) {
        setConsultor(result.consultores[0]);
        setData(null);
      } else {
        setData(result);
        if (consultorId) {
          const consultorFiltrado = result.consultores.find(c => c.id === consultorId);
          setConsultor(consultorFiltrado || null);
        } else {
          setConsultor(null);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados dos consultores:', err);
      setError('Não foi possível carregar os dados dos consultores. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.from, dateRange.to, consultorId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, consultor, isLoading, error, refetch: fetchData };
} 