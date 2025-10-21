'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home, TrendingUp } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/app/_components/ui/alert';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  variant?: 'card' | 'alert' | 'inline';
  className?: string;
}

/**
 * Componente de estado de erro para Dashboard CEO
 * Fornece feedback visual de erro com ações de recuperação
 */
export function ErrorState({
  title = 'Erro ao carregar dados',
  message = 'Não foi possível carregar os dados. Por favor, tente novamente.',
  error,
  onRetry,
  onGoHome,
  showDetails = false,
  variant = 'card',
  className = '',
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{message}</p>
          {showDetails && errorMessage && (
            <p className="text-xs font-mono bg-destructive/10 p-2 rounded">{errorMessage}</p>
          )}
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center space-x-2 text-destructive ${className}`}>
        <AlertCircle className="h-5 w-5" />
        <span className="text-sm font-medium">{message}</span>
        {onRetry && (
          <Button onClick={onRetry} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`border-destructive ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{message}</p>
        {showDetails && errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-xs font-mono text-destructive break-words">{errorMessage}</p>
          </div>
        )}
        <div className="flex space-x-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
          {onGoHome && (
            <Button onClick={onGoHome} variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Estado de erro específico para falha de API
 */
export function ApiErrorState({
  onRetry,
  className = '',
}: {
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Erro de Conexão"
      message="Não foi possível conectar à API. Verifique sua conexão e tente novamente."
      onRetry={onRetry}
      variant="card"
      className={className}
    />
  );
}

/**
 * Estado de erro específico para dados não encontrados
 */
export function NoDataState({
  message = 'Nenhum dado disponível para o período selecionado.',
  className = '',
}: {
  message?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
        <TrendingUp className="h-12 w-12 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground text-center">{message}</p>
      </CardContent>
    </Card>
  );
}

/**
 * Estado de erro específico para validação de dados
 */
export function ValidationErrorState({
  errors,
  onRetry,
  className = '',
}: {
  errors: string[];
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <ErrorState
      title="Erro de Validação"
      message="Alguns dados não passaram na validação:"
      onRetry={onRetry}
      variant="card"
      className={className}
    >
      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </ErrorState>
  );
}

