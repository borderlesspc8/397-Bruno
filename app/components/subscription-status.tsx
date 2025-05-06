'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { SubscriptionPlan } from '@/app/types';
import Link from 'next/link';
import { Crown, AlertCircle, ChevronUp } from 'lucide-react';

const SubscriptionStatus: React.FC = () => {
  const { data: session } = useSession();
  const userPlan = session?.user?.subscriptionPlan as SubscriptionPlan || SubscriptionPlan.FREE;
  
  const isPlanFree = userPlan === SubscriptionPlan.FREE;
  
  if (!isPlanFree) {
    return null; // Não mostrar nada para usuários pagos
  }
  
  return (
    <div className="w-full p-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg shadow-md mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4 bg-white p-2 rounded-full">
            <Crown className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Versão Gratuita</h3>
            <p className="text-xs text-white/80 mt-1">
              Você está usando a versão gratuita com recursos limitados.
            </p>
          </div>
        </div>
        
        <Link 
          href="/subscription"
          className="inline-flex items-center px-3 py-2 border border-white text-sm rounded-md font-medium shadow-sm text-purple-700 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <ChevronUp className="h-4 w-4 mr-1" />
          Fazer upgrade
        </Link>
      </div>
      
      <div className="mt-3 text-xs flex items-start">
        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />
        <p>Acesso limitado apenas ao Dashboard. Faça upgrade para acessar todos os recursos disponíveis.</p>
      </div>
    </div>
  );
};

export default SubscriptionStatus; 