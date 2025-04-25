'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/app/_components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Registrar o erro em serviço de monitoramento
    console.error('Erro global na aplicação:', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Erro Fatal</CardTitle>
              <CardDescription>
                A aplicação encontrou um erro crítico.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="my-4">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Erro Crítico</AlertTitle>
                <AlertDescription>
                  {error.message || 'Ocorreu um erro fatal. Por favor, tente reiniciar a aplicação.'}
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
                Tentar reiniciar
              </Button>
              <Button asChild>
                <Link href="/">
                  Voltar para página inicial
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </body>
    </html>
  );
} 