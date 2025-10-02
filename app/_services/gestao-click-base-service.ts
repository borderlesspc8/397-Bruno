import { logger } from "./logger";

/**
 * Interface para configuração base do Gestão Click
 */
export interface GestaoClickBaseConfig {
  apiKey: string;
  secretToken?: string;
  apiUrl?: string;
  userId: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  authMethod?: 'bearer' | 'basic' | 'api-key' | 'url-params' | 'token';
}

/**
 * Classe base para serviços do Gestão Click
 */
export class GestaoClickBaseService {
  protected apiKey: string;
  protected secretToken?: string;
  protected apiUrl: string;
  protected userId: string;
  protected timeout: number;
  protected retryAttempts: number;
  protected retryDelay: number;
  protected authMethod: 'bearer' | 'basic' | 'api-key' | 'url-params' | 'token';

  constructor(config?: GestaoClickBaseConfig) {
    this.apiKey = config?.apiKey || process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
    this.secretToken = config?.secretToken || process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;
    this.apiUrl = config?.apiUrl || process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
    this.userId = config?.userId || 'system';
    this.timeout = config?.timeout || 30000;
    this.retryAttempts = config?.retryAttempts || 3;
    this.retryDelay = config?.retryDelay || 1000;
    this.authMethod = config?.authMethod || 'token';
  }

  /**
   * Obtém os headers de autenticação
   */
  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    switch (this.authMethod) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        break;
      case 'basic':
        headers['Authorization'] = `Basic ${Buffer.from(`${this.apiKey}:${this.secretToken}`).toString('base64')}`;
        break;
      case 'api-key':
        headers['X-API-Key'] = this.apiKey;
        break;
      case 'token':
      default:
        headers['access-token'] = this.apiKey;
        if (this.secretToken) {
          headers['Secret-Access-Token'] = this.secretToken;
        }
        break;
    }

    return headers;
  }

  /**
   * Constrói a URL completa para a API
   */
  protected buildUrl(path: string): string {
    const baseUrl = this.apiUrl.endsWith('/') ? this.apiUrl.slice(0, -1) : this.apiUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanPath}`;
  }

  /**
   * Faz uma requisição com retry em caso de falha
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Log da resposta
      logger.debug(`[GESTAO_CLICK] Status da resposta: ${response.status} ${response.statusText}`, {
        url,
        status: response.status,
        statusText: response.statusText,
        attempt
      });

      // Se a resposta não for ok e ainda temos tentativas
      if (!response.ok && attempt < this.retryAttempts) {
        logger.warn(`[GESTAO_CLICK] Tentativa ${attempt} falhou, tentando novamente em ${this.retryDelay}ms`, {
          url,
          status: response.status,
          statusText: response.statusText
        });

        // Espera antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      return response;
    } catch (error) {
      // Se ainda temos tentativas, tenta novamente
      if (attempt < this.retryAttempts) {
        logger.warn(`[GESTAO_CLICK] Erro na tentativa ${attempt}, tentando novamente em ${this.retryDelay}ms`, {
          url,
          error: error instanceof Error ? error.message : String(error)
        });

        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      // Se não temos mais tentativas, lança o erro
      throw error;
    }
  }
} 