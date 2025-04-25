"use client";

import React from 'react';
import { AlertTriangle, XCircle, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/app/_components/ui/alert';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/app/_components/ui/card';
import { ErrorState } from '@/app/_hooks/error/use-error-handler';

interface ErrorDisplayProps {
  error: ErrorState | Error | string;
  title?: string;
  variant?: 'default' | 'destructive' | 'card' | 'inline' | 'subtle';
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
}

/**
 * Componente para exibir mensagens de erro de forma padronizada
 */
export function ErrorDisplay({
  error,
  title = 'Ocorreu um erro',
  variant = 'default',
  onRetry,
  onDismiss,
  className = '',
  showDetails = false
}: ErrorDisplayProps) {
  // Extrair mensagem de erro do objeto de erro
  const getMessage = (): string => {
    if (typeof error === 'string') {
      return error;
    } else if (error instanceof Error) {
      return error.message;
    } else if (error && typeof error === 'object' && 'message' in error && error.message) {
      return error.message as string;
    }
    return 'Ocorreu um erro inesperado.';
  };

  // Renderizar diferentes variantes de exibição de erro
  if (variant === 'card') {
    return (
      <Card className={`border-red-200 shadow-sm ${className}`}>
        <CardHeader className="bg-red-50 dark:bg-red-900/20 py-3">
          <div className="flex items-center text-red-700 dark:text-red-300">
            <XCircle className="mr-2 h-5 w-5" />
            <span className="font-medium">{title}</span>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="text-sm">{getMessage()}</div>
          
          {showDetails && error && typeof error === 'object' && 'details' in error && error.details && (
            <div className="mt-2 text-xs text-muted-foreground p-2 bg-muted rounded">
              <div className="font-medium mb-1">Detalhes:</div>
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        
        {(onRetry || onDismiss) && (
          <CardFooter className="flex justify-end gap-2 py-2 bg-muted/50">
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                Fechar
              </Button>
            )}
            {onRetry && (
              <Button variant="default" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-1 h-3 w-3" />
                Tentar Novamente
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    );
  }
  
  if (variant === 'inline') {
    return (
      <div className={`flex items-start text-red-600 dark:text-red-400 text-sm ${className}`}>
        <AlertCircle className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
        <div>
          {getMessage()}
          {(onRetry || onDismiss) && (
            <div className="mt-1 flex gap-3">
              {onDismiss && (
                <button 
                  onClick={onDismiss}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Fechar
                </button>
              )}
              {onRetry && (
                <button 
                  onClick={onRetry}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Tentar Novamente
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (variant === 'subtle') {
    return (
      <div className={`p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md ${className}`}>
        <div className="flex items-start">
          <Info className="mr-2 h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-700 dark:text-red-300">
              {title}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              {getMessage()}
            </div>
            
            {(onRetry || onDismiss) && (
              <div className="mt-2 flex justify-end gap-2">
                {onDismiss && (
                  <Button variant="ghost" size="sm" onClick={onDismiss} className="h-7 px-2 text-xs">
                    Fechar
                  </Button>
                )}
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRetry}
                    className="h-7 px-2 text-xs border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/30"
                  >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Tentar Novamente
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Variante padrão (alert)
  return (
    <Alert variant={variant === 'destructive' ? 'destructive' : 'default'} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {getMessage()}
        
        {(onRetry || onDismiss) && (
          <div className="mt-2 flex justify-end gap-2">
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss} className="h-7 px-2 text-xs">
                Fechar
              </Button>
            )}
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="h-7 px-2 text-xs">
                <RefreshCw className="mr-1 h-3 w-3" />
                Tentar Novamente
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
} 