'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro global na aplicação:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
          <div style={{ width: '100%', maxWidth: '42rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', backgroundColor: 'white', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Erro Fatal</h1>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>A aplicação encontrou um erro crítico.</p>
            
            <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '0.5rem' }}>Erro Crítico</p>
              <p style={{ color: '#7c2d12' }}>
                {error.message || 'Ocorreu um erro fatal. Por favor, tente reiniciar a aplicação.'}
              </p>
            </div>
            
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>
                Código de referência: {error.digest}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={reset}
                style={{ padding: '0.5rem 1rem', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '0.375rem', cursor: 'pointer' }}
              >
                Tentar reiniciar
              </button>
              <a 
                href="/"
                style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.375rem', textDecoration: 'none' }}
              >
                Voltar para página inicial
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 
