// Sistema de tratamento de erros específico para APIs CEO
// Isolado e independente - não afeta outras dashboards

import { NextResponse } from 'next/server';

// Tipos de erros específicos da API Betel
export enum CEOErrorType {
  // Erros de conectividade
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  
  // Erros de autenticação
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // Erros de dados
  INVALID_DATA = 'INVALID_DATA',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  MALFORMED_RESPONSE = 'MALFORMED_RESPONSE',
  
  // Erros de servidor
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Erros de validação
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_PARAMETERS = 'MISSING_PARAMETERS',
  
  // Erros desconhecidos
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Interface para informações de erro estruturadas
export interface CEOErrorInfo {
  type: CEOErrorType;
  message: string;
  details?: any;
  timestamp: string;
  endpoint?: string;
  retryAttempt?: number;
  maxRetries?: number;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
}

// Interface para configuração de retry
export interface CEORetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: CEOErrorType[];
}

// Interface para dados históricos de fallback
export interface CEOFallbackData {
  data: any;
  timestamp: string;
  source: 'historical' | 'cached' | 'estimated';
  confidence: number; // 0-1
}

// Configuração padrão de retry para diferentes tipos de erro
const DEFAULT_RETRY_CONFIG: CEORetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 segundo
  maxDelay: 30000, // 30 segundos
  backoffMultiplier: 2,
  retryableErrors: [
    CEOErrorType.NETWORK_ERROR,
    CEOErrorType.TIMEOUT_ERROR,
    CEOErrorType.SERVER_ERROR,
    CEOErrorType.SERVICE_UNAVAILABLE,
    CEOErrorType.RATE_LIMIT_EXCEEDED
  ]
};

// Classe principal para tratamento de erros CEO
export class CEOErrorHandler {
  private static errorHistory: CEOErrorInfo[] = [];
  private static fallbackDataCache = new Map<string, CEOFallbackData>();

  // Mapear códigos HTTP para tipos de erro CEO
  private static mapHttpErrorToCEOError(status: number, message: string): CEOErrorType {
    switch (status) {
      case 400:
        return CEOErrorType.INVALID_DATA;
      case 401:
        return CEOErrorType.UNAUTHORIZED;
      case 403:
        return CEOErrorType.FORBIDDEN;
      case 404:
        return CEOErrorType.DATA_NOT_FOUND;
      case 408:
        return CEOErrorType.TIMEOUT_ERROR;
      case 422:
        return CEOErrorType.VALIDATION_ERROR;
      case 429:
        return CEOErrorType.RATE_LIMIT_EXCEEDED;
      case 500:
        return CEOErrorType.SERVER_ERROR;
      case 502:
      case 503:
      case 504:
        return CEOErrorType.SERVICE_UNAVAILABLE;
      default:
        return CEOErrorType.UNKNOWN_ERROR;
    }
  }

  // Mapear mensagens de erro para tipos específicos
  private static mapErrorMessageToCEOError(message: string): CEOErrorType {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return CEOErrorType.NETWORK_ERROR;
    }
    if (lowerMessage.includes('timeout')) {
      return CEOErrorType.TIMEOUT_ERROR;
    }
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('invalid token')) {
      return CEOErrorType.UNAUTHORIZED;
    }
    if (lowerMessage.includes('forbidden')) {
      return CEOErrorType.FORBIDDEN;
    }
    if (lowerMessage.includes('not found')) {
      return CEOErrorType.DATA_NOT_FOUND;
    }
    if (lowerMessage.includes('malformed') || lowerMessage.includes('invalid json')) {
      return CEOErrorType.MALFORMED_RESPONSE;
    }
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
      return CEOErrorType.RATE_LIMIT_EXCEEDED;
    }
    
    return CEOErrorType.UNKNOWN_ERROR;
  }

  // Determinar severidade do erro
  private static determineSeverity(errorType: CEOErrorType): 'low' | 'medium' | 'high' | 'critical' {
    switch (errorType) {
      case CEOErrorType.NETWORK_ERROR:
      case CEOErrorType.TIMEOUT_ERROR:
        return 'medium';
      case CEOErrorType.UNAUTHORIZED:
      case CEOErrorType.FORBIDDEN:
        return 'high';
      case CEOErrorType.SERVER_ERROR:
      case CEOErrorType.SERVICE_UNAVAILABLE:
        return 'high';
      case CEOErrorType.RATE_LIMIT_EXCEEDED:
        return 'medium';
      case CEOErrorType.DATA_NOT_FOUND:
        return 'low';
      default:
        return 'medium';
    }
  }

  // Determinar se o erro é acionável pelo usuário
  private static isActionable(errorType: CEOErrorType): boolean {
    return [
      CEOErrorType.UNAUTHORIZED,
      CEOErrorType.FORBIDDEN,
      CEOErrorType.INVALID_CREDENTIALS,
      CEOErrorType.VALIDATION_ERROR,
      CEOErrorType.MISSING_PARAMETERS
    ].includes(errorType);
  }

  // Gerar mensagem amigável para o usuário
  private static generateUserMessage(errorType: CEOErrorType, details?: any): string {
    switch (errorType) {
      case CEOErrorType.NETWORK_ERROR:
        return 'Problema de conectividade detectado. Verificando automaticamente...';
      case CEOErrorType.TIMEOUT_ERROR:
        return 'Tempo limite excedido. Tentando novamente...';
      case CEOErrorType.UNAUTHORIZED:
        return 'Sessão expirada. Faça login novamente.';
      case CEOErrorType.FORBIDDEN:
        return 'Acesso negado. Verifique suas permissões.';
      case CEOErrorType.DATA_NOT_FOUND:
        return 'Dados não encontrados para o período solicitado.';
      case CEOErrorType.SERVER_ERROR:
        return 'Erro interno do servidor. Tentando recuperar dados históricos...';
      case CEOErrorType.SERVICE_UNAVAILABLE:
        return 'Serviço temporariamente indisponível. Usando dados em cache...';
      case CEOErrorType.RATE_LIMIT_EXCEEDED:
        return 'Muitas solicitações. Aguardando antes de tentar novamente...';
      case CEOErrorType.VALIDATION_ERROR:
        return 'Dados inválidos fornecidos. Verifique os parâmetros.';
      case CEOErrorType.MISSING_PARAMETERS:
        return 'Parâmetros obrigatórios não fornecidos.';
      default:
        return 'Erro inesperado. Verificando alternativas...';
    }
  }

  // Criar informações estruturadas de erro
  public static createErrorInfo(
    error: Error | any,
    endpoint?: string,
    retryAttempt?: number,
    maxRetries?: number
  ): CEOErrorInfo {
    let errorType: CEOErrorType;
    let message: string;

    // Determinar tipo de erro baseado na origem
    if (error.status) {
      errorType = this.mapHttpErrorToCEOError(error.status, error.message);
      message = error.message || `HTTP ${error.status}`;
    } else if (error.message) {
      errorType = this.mapErrorMessageToCEOError(error.message);
      message = error.message;
    } else {
      errorType = CEOErrorType.UNKNOWN_ERROR;
      message = 'Erro desconhecido';
    }

    const errorInfo: CEOErrorInfo = {
      type: errorType,
      message,
      details: error,
      timestamp: new Date().toISOString(),
      endpoint,
      retryAttempt,
      maxRetries,
      userMessage: this.generateUserMessage(errorType, error),
      severity: this.determineSeverity(errorType),
      actionable: this.isActionable(errorType)
    };

    // Adicionar ao histórico
    this.errorHistory.push(errorInfo);
    
    // Manter apenas os últimos 100 erros
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }

    return errorInfo;
  }

  // Verificar se o erro pode ser retentado
  public static isRetryable(errorType: CEOErrorType): boolean {
    return DEFAULT_RETRY_CONFIG.retryableErrors.includes(errorType);
  }

  // Calcular delay para retry com backoff exponencial
  public static calculateRetryDelay(attempt: number, config: CEORetryConfig = DEFAULT_RETRY_CONFIG): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  // Aguardar com delay calculado
  public static async waitForRetry(attempt: number, config: CEORetryConfig = DEFAULT_RETRY_CONFIG): Promise<void> {
    const delay = this.calculateRetryDelay(attempt, config);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Executar operação com retry automático
  public static async executeWithRetry<T>(
    operation: () => Promise<T>,
    endpoint?: string,
    config: CEORetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Se chegou aqui, a operação foi bem-sucedida
        if (attempt > 1) {
          console.log(`CEO: Operação bem-sucedida na tentativa ${attempt} para ${endpoint}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        const errorInfo = this.createErrorInfo(error, endpoint, attempt, config.maxRetries);
        
        console.error(`CEO: Tentativa ${attempt}/${config.maxRetries} falhou para ${endpoint}:`, errorInfo);

        // Se não é o último erro, verificar se pode retentar
        if (attempt < config.maxRetries) {
          const errorType = errorInfo.type;
          
          if (this.isRetryable(errorType)) {
            const delay = this.calculateRetryDelay(attempt, config);
            console.log(`CEO: Aguardando ${delay}ms antes da próxima tentativa...`);
            await this.waitForRetry(attempt, config);
            continue;
          } else {
            console.log(`CEO: Erro não retentável (${errorType}), interrompendo tentativas`);
            break;
          }
        }
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const finalErrorInfo = this.createErrorInfo(lastError, endpoint, config.maxRetries, config.maxRetries);
    console.error(`CEO: Todas as tentativas falharam para ${endpoint}:`, finalErrorInfo);
    
    throw finalErrorInfo;
  }

  // Armazenar dados de fallback
  public static storeFallbackData(key: string, data: any, source: 'historical' | 'cached' | 'estimated', confidence: number = 0.8): void {
    const fallbackData: CEOFallbackData = {
      data,
      timestamp: new Date().toISOString(),
      source,
      confidence
    };
    
    this.fallbackDataCache.set(key, fallbackData);
    
    // Limitar cache a 50 entradas
    if (this.fallbackDataCache.size > 50) {
      const firstKey = this.fallbackDataCache.keys().next().value;
      this.fallbackDataCache.delete(firstKey);
    }
  }

  // Recuperar dados de fallback
  public static getFallbackData(key: string): CEOFallbackData | null {
    const fallbackData = this.fallbackDataCache.get(key);
    
    if (!fallbackData) {
      return null;
    }

    // Verificar se os dados não estão muito antigos (1 hora)
    const dataAge = Date.now() - new Date(fallbackData.timestamp).getTime();
    const maxAge = 60 * 60 * 1000; // 1 hora
    
    if (dataAge > maxAge) {
      this.fallbackDataCache.delete(key);
      return null;
    }

    return fallbackData;
  }

  // Gerar resposta de erro estruturada para NextResponse
  public static createErrorResponse(errorInfo: CEOErrorInfo, statusCode: number = 500): NextResponse {
    const response = {
      error: true,
      type: errorInfo.type,
      message: errorInfo.userMessage,
      details: process.env.NODE_ENV === 'development' ? errorInfo.details : undefined,
      timestamp: errorInfo.timestamp,
      retryable: this.isRetryable(errorInfo.type),
      actionable: errorInfo.actionable
    };

    return NextResponse.json(response, { status: statusCode });
  }

  // Obter estatísticas de erros
  public static getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: CEOErrorInfo[];
  } {
    const errorsByType: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    
    this.errorHistory.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsBySeverity,
      recentErrors: this.errorHistory.slice(-10) // Últimos 10 erros
    };
  }

  // Limpar histórico de erros
  public static clearErrorHistory(): void {
    this.errorHistory = [];
  }

  // Limpar cache de fallback
  public static clearFallbackCache(): void {
    this.fallbackDataCache.clear();
  }
}

// Função utilitária para log estruturado
export function logCEOError(context: string, error: any, additionalData?: any): void {
  const errorInfo = CEOErrorHandler.createErrorInfo(error, context);
  
  const logData = {
    ...errorInfo,
    context,
    additionalData,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  // Log estruturado para monitoramento
  if (errorInfo.severity === 'critical' || errorInfo.severity === 'high') {
    console.error(`[CEO-CRITICAL] ${context}:`, logData);
  } else if (errorInfo.severity === 'medium') {
    console.warn(`[CEO-WARNING] ${context}:`, logData);
  } else {
    console.log(`[CEO-INFO] ${context}:`, logData);
  }
}

// Função utilitária para criar resposta de erro padronizada
export function createCEOErrorResponse(error: any, context: string, statusCode: number = 500): NextResponse {
  const errorInfo = CEOErrorHandler.createErrorInfo(error, context);
  logCEOError(context, error);
  return CEOErrorHandler.createErrorResponse(errorInfo, statusCode);
}
