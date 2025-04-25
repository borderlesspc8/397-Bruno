"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { SubscriptionPlan } from "@/app/types";
import Link from "next/link";
import { Button } from "./ui/button";

interface RequireSubscriptionProps {
  children: ReactNode;
  requiredPlan: SubscriptionPlan[];
  fallback?: ReactNode;
}

export function RequireSubscription({ 
  children, 
  requiredPlan,
  fallback
}: RequireSubscriptionProps) {
  const { data: session } = useSession();
  
  // Se não houver sessão, mostra nada
  if (!session?.user) {
    return null;
  }
  
  const userPlan = session.user.subscriptionPlan || SubscriptionPlan.FREE;
  
  // Se algum dos planos exigidos for FREE, permitir acesso independente do status isActive
  if (requiredPlan.includes(SubscriptionPlan.FREE)) {
    return <>{children}</>;
  }
  
  // Para outros planos, verificar isActive
  const isActive = session.user.isActive !== false; // Se undefined, assume true
  
  // Verifica se o plano do usuário está na lista de planos permitidos
  const hasAccess = isActive && requiredPlan.includes(userPlan);
  
  if (!hasAccess) {
    // Renderiza o conteúdo alternativo ou o componente padrão de upgrade
    return fallback || (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <h3 className="mb-2 text-lg font-medium">Recurso Premium</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Este recurso está disponível apenas para assinantes do plano{" "}
          {requiredPlan.length === 1 
            ? `${requiredPlan[0]}` 
            : requiredPlan.slice(0, -1).join(", ") + " ou " + requiredPlan.slice(-1)
          }.
        </p>
        <Link href="/subscription">
          <Button>Fazer upgrade</Button>
        </Link>
      </div>
    );
  }
  
  return <>{children}</>;
}
