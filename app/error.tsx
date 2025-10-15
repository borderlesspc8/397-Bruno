'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/app/_components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Opcional: registrar o erro em serviço de monitoramento
    console.error('Erro na aplicação:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Algo deu errado</CardTitle>
          <CardDescription>
            Ocorreu um erro inesperado na aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="my-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              {error.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
            </AlertDescription>
          </Alert>
          
          {error.digest && (
            <p className="text-xs text-gray-500 mt-2">
              Código de referência: {error.digest}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={reset}>
            Tentar novamente
          </Button>
          <Button asChild>
            <Link href="/">
              Voltar para página inicial
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 
