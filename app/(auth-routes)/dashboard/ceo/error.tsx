/**
 * 📊 CEO DASHBOARD - ERROR BOUNDARY
 */

'use client';

import { useEffect } from 'react';

export default function CEODashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[CEODashboard] Error:', error);
  }, [error]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-lg mx-auto px-4">
        <div className="text-red-600 text-6xl mb-6">⚠️</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Algo deu errado!</h2>
        <p className="text-gray-600 mb-2">Ocorreu um erro ao carregar o Dashboard CEO.</p>
        <p className="text-sm text-gray-500 mb-8 font-mono bg-gray-100 p-3 rounded">
          {error.message}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}



