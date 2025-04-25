import { useState } from 'react';
import { useToast } from '@/app/_components/ui/use-toast';

interface UseTransactionReconciliationProps {
  onSuccess?: () => void;
}

export function useTransactionReconciliation({ onSuccess }: UseTransactionReconciliationProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const reconcileTransactions = async (code: string, transactionIds: string[]) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/transactions/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, transactionIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao conciliar transações');
      }

      const data = await response.json();
      
      toast({
        title: 'Sucesso',
        description: 'Transações conciliadas com sucesso',
      });

      onSuccess?.();
      
      return data;
    } catch (error) {
      console.error('Erro ao conciliar transações:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao conciliar transações',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reconcileTransactions,
    isLoading,
  };
} 