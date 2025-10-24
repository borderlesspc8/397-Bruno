"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/app/_lib/utils';

interface ApiErrorAlertProps {
  error: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export function ApiErrorAlert({ 
  error, 
  onRetry, 
  isRetrying = false, 
  className 
}: ApiErrorAlertProps) {
  const isAuthError = error.includes('autenticação') || error.includes('401');
  const isAuthzError = error.includes('autorização') || error.includes('403');
  const isApiError = error.includes('API externa');

  const getErrorIcon = () => {
    if (isAuthError || isAuthzError) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-orange-500" />;
  };

  const getErrorTitle = () => {
    if (isAuthError) {
      return 'Erro de Autenticação';
    }
    if (isAuthzError) {
      return 'Erro de Autorização';
    }
    if (isApiError) {
      return 'Erro na API Externa';
    }
    return 'Erro ao Carregar Dados';
  };

  const getErrorDescription = () => {
    if (isAuthError) {
      return 'As credenciais de acesso à API externa estão inválidas ou expiradas.';
    }
    if (isAuthzError) {
      return 'Acesso negado pela API externa. Verifique se as credenciais têm permissão para acessar este recurso.';
    }
    if (isApiError) {
      return 'Houve um problema na comunicação com a API externa.';
    }
    return 'Ocorreu um erro inesperado ao carregar os dados.';
  };

  const getActionText = () => {
    if (isAuthError || isAuthzError) {
      return 'Verificar Configurações';
    }
    return 'Tentar Novamente';
  };

  return (
    <div className={cn(
      "rounded-lg border p-6 space-y-4",
      isAuthError || isAuthzError 
        ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20" 
        : "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20",
      className
    )}>
      <div className="flex items-start gap-3">
        {getErrorIcon()}
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {getErrorTitle()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {getErrorDescription()}
          </p>
          <div className="text-xs font-mono bg-muted p-2 rounded border">
            {error}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              isAuthError || isAuthzError
                ? "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                : "bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
            {isRetrying ? 'Tentando...' : getActionText()}
          </button>
        )}

        {(isAuthError || isAuthzError) && (
          <a
            href="/admin/configuracoes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-foreground/20"
          >
            <ExternalLink className="h-4 w-4" />
            Ir para Configurações
          </a>
        )}
      </div>

      {isAuthError || isAuthzError ? (
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Possíveis soluções:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Verifique se as credenciais da API estão corretas</li>
            <li>Confirme se os tokens de acesso não expiraram</li>
            <li>Verifique se a URL da API está configurada corretamente</li>
            <li>Entre em contato com o administrador do sistema</li>
          </ul>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          <p>O dashboard continuará funcionando com dados limitados. Tente novamente em alguns minutos.</p>
        </div>
      )}
    </div>
  );
}

