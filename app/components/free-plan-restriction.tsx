'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

interface FreePlanRestrictionProps {
  message?: string;
}

const FreePlanRestriction: React.FC<FreePlanRestrictionProps> = ({
  message = "Esta funcionalidade está disponível apenas para assinantes. Faça upgrade do seu plano para acessar todos os recursos."
}) => {
  return (
    <div className="w-full p-4 my-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            Acesso Restrito
          </h3>
          <div className="mt-2 text-sm text-amber-700">
            <p>{message}</p>
          </div>
          <div className="mt-4">
            <Link 
              href="/subscription" 
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              Ver planos disponíveis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreePlanRestriction; 