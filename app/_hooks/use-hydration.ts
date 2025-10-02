"use client";

import { useEffect, useState } from 'react';

interface HydrationState {
  isHydrated: boolean;
  hasHydrationError: boolean;
  error?: Error;
}

export function useHydration(): HydrationState {
  const [state, setState] = useState<HydrationState>({
    isHydrated: false,
    hasHydrationError: false
  });

  useEffect(() => {
    // Marcar como hidratado após a montagem no cliente
    setState(prev => ({ ...prev, isHydrated: true }));

    // Listener para capturar erros de hidratação
    const handleError = (event: ErrorEvent) => {
      const isHydrationError = 
        event.message?.includes('hydration') ||
        event.message?.includes('originalFactory.call') ||
        event.message?.includes('readChunk') ||
        event.message?.includes('mountLazyComponent');

      if (isHydrationError) {
        console.error('Erro de hidratação detectado:', event);
        setState(prev => ({
          ...prev,
          hasHydrationError: true,
          error: new Error(event.message)
        }));
      }
    };

    // Listener para capturar erros não tratados
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const isHydrationError = 
        event.reason?.message?.includes('hydration') ||
        event.reason?.message?.includes('originalFactory.call') ||
        event.reason?.message?.includes('readChunk') ||
        event.reason?.message?.includes('mountLazyComponent');

      if (isHydrationError) {
        console.error('Erro de hidratação (Promise rejection):', event.reason);
        setState(prev => ({
          ...prev,
          hasHydrationError: true,
          error: event.reason instanceof Error ? event.reason : new Error(String(event.reason))
        }));
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return state;
}

export default useHydration;
