'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SubscriptionPlan } from '@/app/types';

interface UseSubscriptionCheckOptions {
  redirectTo?: string;
  allowedPlans?: SubscriptionPlan[];
  onlyCheckDontRedirect?: boolean;
}

export function useSubscriptionCheck({
  redirectTo = '/dashboard',
  allowedPlans = [SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
  onlyCheckDontRedirect = false
}: UseSubscriptionCheckOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  
  useEffect(() => {
    if (status === 'loading') {
      return;
    }
    
    setIsLoading(false);
    
    if (!session || !session.user) {
      if (!onlyCheckDontRedirect) {
        router.push('/auth');
      }
      return;
    }
    
    // Verificar se o plano do usuário está na lista de planos permitidos
    const userPlan = session.user.subscriptionPlan as SubscriptionPlan || SubscriptionPlan.FREE;
    const canAccess = allowedPlans.includes(userPlan);
    
    setHasAccess(canAccess);
    
    // Se não tiver acesso e redirecionamento estiver habilitado
    if (!canAccess && !onlyCheckDontRedirect) {
      router.push(redirectTo);
    }
  }, [session, status, router, redirectTo, allowedPlans, onlyCheckDontRedirect]);
  
  return {
    isLoading,
    hasAccess,
    userPlan: session?.user?.subscriptionPlan as SubscriptionPlan || SubscriptionPlan.FREE
  };
}

export default useSubscriptionCheck; 