'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na aplicação:', error);
  }, [error]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Algo deu errado!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Tentar novamente
      </button>
    </div>
  );
} 
