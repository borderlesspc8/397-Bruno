'use client';

import { isDemoMode } from '../_lib/config';
import { AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

/**
 * Banner que é exibido quando a aplicação está no modo de demonstração
 * Informa ao usuário que os dados são apenas para fins de demonstração
 */
export function DemoBanner() {
  const [mounted, setMounted] = useState(false);

  // Garante que o componente só é renderizado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Se não estiver no modo de demonstração ou não estiver montado, não renderiza nada
  if (!mounted || !isDemoMode) {
    return null;
  }

  return (
    <div className="bg-indigo-600 dark:bg-indigo-800 text-white py-2 px-4 text-center relative">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <span>
          Modo de demonstração ativo - Todos os dados são fictícios. 
          <span className="hidden sm:inline"> Acesse com o email <strong>demo@acceleracrm.com.br</strong> e senha <strong>123456</strong></span>
        </span>
      </div>
    </div>
  );
} 