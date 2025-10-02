"use client";

import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';

interface LazyFallbackProps {
  message?: string;
  error?: boolean;
  errorMessage?: string;
  className?: string;
}

export function LazyFallback({ 
  message = 'Carregando componente...', 
  error = false,
  errorMessage,
  className = ''
}: LazyFallbackProps) {
  if (error) {
    return (
      <Card className={`mx-auto max-w-md ${className}`}>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-lg">Erro ao Carregar</CardTitle>
          <CardDescription>
            {errorMessage || 'Ocorreu um erro ao carregar este componente'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <button 
            onClick={() => window.location.reload()}
            className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Recarregar Página
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`mx-auto max-w-md ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground text-center">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}

export default LazyFallback;
