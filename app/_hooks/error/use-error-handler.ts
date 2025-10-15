"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/app/_components/ui/use-toast';

export interface ErrorState {
  message: string | null;
  code: string | null;
  details?: Record<string, any> | null;
  timestamp: Date | null;
  context?: string | null;
  fatal?: boolean;
  isUserActionable?: boolean;
}

interface UseErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  logToServer?: boolean;
}

interface ApiError extends Error {
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

/**
 * Hook para manipulação padronizada de erros
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast = true, logToConsole = true, logToServer = true } = options;
  const [error, setError] = useState<ErrorState>({
    message: null,
    code: null,
    details: null,
    timestamp: null
  });
  const { toast } = useToast();
  const listenersRef = useRef<Set<(error: ErrorState) => void>>(new Set());
  
  // Notificar listeners quando o erro mudar
  useEffect(() => {
    listenersRef.current.forEach(listener => {
      listener(error);
    });
  }, [error]);
  
  /**
   * Adiciona um listener para mudanças no estado de erro
   */
  const addListener = useCallback((listener: (error: ErrorState) => void) => {
    listenersRef.current.add(listener);
    
    // Retorna uma função para remover o listener
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);
  
  /**
   * Envia o erro para o servidor para monitoramento (opcional)
   */
  const logError = useCallback(async (error: ApiError, context?: Record<string, any>) => {
    if (!logToServer) return;
    
    try {
      // Enviar o erro para o endpoint de log de erros
      await fetch('/api/log/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          stack: error.stack,
          status: error.status,
          context,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
    } catch (logError) {
      // Falha silenciosa se não conseguirmos registrar o erro
      console.error('Falha ao registrar erro no servidor:', logError);
    }
  }, [logToServer]);
  
  /**
   * Manipulador principal de erros
   */
  const handleError = useCallback(async (
    error: unknown, 
    context?: Record<string, any>,
    customMessage?: string
  ) => {
    // Converter o erro para um formato padrão
    const normalizedError: ApiError = error instanceof Error 
      ? error
      : new Error(typeof error === 'string' ? error : 'Ocorreu um erro desconhecido');
    
    // Extrair informações do erro
    const status = (normalizedError as any).status || (normalizedError as any).statusCode;
    const code = normalizedError.code || `ERROR_${status || 'UNKNOWN'}`;
    const details = normalizedError.details || (normalizedError as any).data;
    const timestamp = new Date();
    
    // Verificar se é um erro fatal ou acionável pelo usuário
    const fatal = status === 500 || (normalizedError as any).fatal === true;
    const isUserActionable = status === 401 || status === 403 || status === 409 || (normalizedError as any).isUserActionable === true;
    
    // Formatar a mensagem do erro
    const message = customMessage || normalizedError.message;
    
    // Determinar o contexto do erro
    let errorContext = 'application';
    
    if ((normalizedError as any).context) {
      errorContext = (normalizedError as any).context;
    } else if (context && typeof context === 'object' && 'source' in context) {
      errorContext = context.source as string;
    }
    
    // Atualizar o estado de erro
    setError({
      message,
      code,
      details,
      timestamp,
      context: errorContext,
      fatal,
      isUserActionable
    });
    
    // Registrar o erro no console
    if (logToConsole) {
      console.error('Erro capturado:', {
        message,
        code,
        details,
        originalError: normalizedError,
        context: errorContext,
        fatal,
        isUserActionable
      });
    }
    
    // Enviar o erro para o servidor
    if (logToServer) {
      await logError(normalizedError, context);
    }
    
    // Mostrar toast de erro
    if (showToast) {
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
    
    return { message, code, details, timestamp };
  }, [logToConsole, logToServer, logError, showToast, toast]);
  
  /**
   * Limpa o estado de erro
   */
  const clearError = useCallback(() => {
    setError({
      message: null,
      code: null,
      details: null,
      timestamp: null
    });
  }, []);
  
  /**
   * Cria um wrapper para funções async que captura erros automaticamente
   */
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Record<string, any>,
    customMessage?: string
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        return await fn(...args);
      } catch (error) {
        await handleError(error, context, customMessage);
        return undefined;
      }
    };
  }, [handleError]);
  
  return {
    error,
    setError,
    handleError,
    clearError,
    withErrorHandling,
    hasError: error.message !== null,
    addListener
  };
} 
