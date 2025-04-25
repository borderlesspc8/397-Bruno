import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { SubscriptionPlan } from '@/app/types';
import { toast } from 'sonner';

export function useSessionRefresh() {
  const { data: session, update } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSession = async () => {
    try {
      setIsRefreshing(true);
      
      // Chamar o endpoint para obter os dados atualizados
      const response = await fetch('/api/auth/refresh-session');
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar a sessão');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Atualizar a sessão localmente usando o método update() do useSession
        // Forçando o valor do plano de assinatura como o enum correto
        let planValue: SubscriptionPlan;
        switch (data.plan) {
          case 'BASIC':
            planValue = SubscriptionPlan.BASIC;
            break;
          case 'PREMIUM':
            planValue = SubscriptionPlan.PREMIUM;
            break;
          case 'ENTERPRISE':
            planValue = SubscriptionPlan.ENTERPRISE;
            break;
          default:
            planValue = SubscriptionPlan.FREE;
        }
        
        await update({
          ...session,
          user: {
            ...session?.user,
            subscriptionPlan: planValue,
            isActive: data.status === 'ACTIVE',
            planExpiresAt: data.endDate ? new Date(data.endDate) : undefined
          }
        });
        
        // Força uma atualização completa da sessão recarregando a página
        // Isso garante que todos os componentes recebam os dados atualizados
        window.location.reload();
        
        toast.success('Sessão atualizada com sucesso');
        return true;
      } else {
        throw new Error(data.error || 'Falha ao atualizar a sessão');
      }
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