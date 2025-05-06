'use client';

import React from 'react';
import { SubscriptionPlan } from '@/app/types';
import useSubscriptionCheck from './use-subscription-check';
import FreePlanRestriction from '@/app/components/free-plan-restriction';
import { Loader2 } from 'lucide-react';

interface WithSubscriptionCheckProps {
  allowedPlans?: SubscriptionPlan[];
  redirectTo?: string;
  onlyShowWarning?: boolean;
  restrictionMessage?: string;
}

// Higher Order Component que protege uma página verificando a assinatura do usuário
export function withSubscriptionCheck<P extends object>(
  Component: React.ComponentType<P>,
  {
    allowedPlans = [SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
    redirectTo = '/dashboard',
    onlyShowWarning = false,
    restrictionMessage
  }: WithSubscriptionCheckProps = {}
) {
  const ProtectedComponent = (props: P) => {
    const { isLoading, hasAccess } = useSubscriptionCheck({
      allowedPlans,
      redirectTo,
      onlyCheckDontRedirect: onlyShowWarning
    });

    if (isLoading) {
      return (
        <div className="w-full flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      );
    }

    if (!hasAccess && onlyShowWarning) {
      return (
        <>
          <FreePlanRestriction message={restrictionMessage} />
          <Component {...props} />
        </>
      );
    }

    // Se tem acesso, renderiza o componente normalmente
    // (Se não tem acesso e onlyShowWarning=false, 
    // useSubscriptionCheck já vai redirecionar, então isso nem seria executado)
    return <Component {...props} />;
  };

  // Copiar displayName para mantermos nomes de componentes corretos para depuração
  const displayName = Component.displayName || Component.name || 'Component';
  ProtectedComponent.displayName = `WithSubscriptionCheck(${displayName})`;

  return ProtectedComponent;
}

export default withSubscriptionCheck; 