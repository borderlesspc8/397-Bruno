import { useState } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function useSessionRefresh() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSession = async () => {
    try {
      setIsRefreshing(true);
      
      // Com Supabase, a sessão é gerenciada automaticamente
      // Apenas recarregamos a página para garantir que todos os dados estejam atualizados
      window.location.reload();
      
      toast.success('Sessão atualizada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      toast.error('Não foi possível atualizar sua sessão. Por favor, faça logout e login novamente.');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    refreshSession,
    isRefreshing
  };
} 