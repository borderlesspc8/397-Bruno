import { kommoConfig } from "@/app/_config/kommo";
import { logger, LogOptions } from "./logger";

/**
 * Interface para configuração base do KOMMO
 */
export interface KommoBaseConfig {
  jwtToken: string;
  apiUrl?: string;
  userId: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  baseDomain?: string;
}

/**
 * Classe base para serviços do KOMMO CRM
 */
export class KommoBaseService {
  protected jwtToken: string;
  protected apiUrl: string;
  protected userId: string;
  protected timeout: number;
  protected retryAttempts: number;
  protected retryDelay: number;
  protected baseDomain: string;

  constructor(config?: KommoBaseConfig) {
    this.jwtToken = config?.jwtToken || kommoConfig.jwtToken || '';
    this.apiUrl = config?.apiUrl || kommoConfig.apiUrl || 'https://api-c.kommo.com';
    this.userId = config?.userId || 'system';
    this.timeout = config?.timeout || kommoConfig.timeout || 30000;
    this.retryAttempts = config?.retryAttempts || kommoConfig.retryAttempts || 3;
    this.retryDelay = config?.retryDelay || kommoConfig.retryDelay || 1000;
    this.baseDomain = config?.baseDomain || kommoConfig.baseDomain || 'kommo.com';
  }

  /**
   * Obtém os headers de autenticação
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.jwtToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Constrói a URL completa para a API
   */
  protected buildUrl(path: string): string {
    // Remove barras duplas
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrlClean = this.apiUrl.endsWith('/') 
      ? this.apiUrl.slice(0, -1) 
      : this.apiUrl;
    
    return `${baseUrlClean}${cleanPath}`;
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
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Em caso de erro 401 ou 403, não fazer retry
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Autenticação falhou: ${response.status} ${response.statusText}`);
        }

        // Para outros erros, fazer retry
        if (attempt < this.retryAttempts) {
          logger.warn(`Erro na requisição KOMMO (tentativa ${attempt}/${this.retryAttempts})`, {
            context: "KOMMO_REQUEST",
            data: {
              url,
              status: response.status,
              statusText: response.statusText,
              attempt,
            }
          });

          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
          return this.fetchWithRetry(url, options, attempt + 1);
        }
      }

      return response;
    } catch (error) {
      if (attempt < this.retryAttempts) {
        logger.warn(`Erro na requisição KOMMO (tentativa ${attempt}/${this.retryAttempts})`, {
          context: "KOMMO_REQUEST",
          data: {
            url,
            error: error instanceof Error ? error.message : String(error),
            attempt,
          }
        });

        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Faz uma requisição GET
   */
  protected async get<T>(
    path: string,
    queryParams?: Record<string, any>
  ): Promise<T> {
    try {
      let url = this.buildUrl(path);

      if (queryParams) {
        const params = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            params.append(key, String(value));
          }
        });
        url += `?${params.toString()}`;
      }

      logger.info(`Fazendo requisição GET KOMMO: ${path}`, {
        context: "KOMMO_GET",
        data: { url, userId: this.userId }
      });

      const response = await this.fetchWithRetry(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na requisição GET: ${response.status} ${errorText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      logger.error(`Erro ao fazer GET KOMMO para ${path}`, {
        context: "KOMMO_GET_ERROR",
        data: {
          path,
          error: error instanceof Error ? error.message : String(error),
          userId: this.userId,
        }
      });
      throw error;
    }
  }

  /**
   * Faz uma requisição POST
   */
  protected async post<T>(
    path: string,
    body?: any
  ): Promise<T> {
    try {
      const url = this.buildUrl(path);

      logger.info(`Fazendo requisição POST KOMMO: ${path}`, {
        context: "KOMMO_POST",
        data: { url, userId: this.userId, hasBody: !!body }
      });

      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na requisição POST: ${response.status} ${errorText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      logger.error(`Erro ao fazer POST KOMMO para ${path}`, {
        context: "KOMMO_POST_ERROR",
        data: {
          path,
          error: error instanceof Error ? error.message : String(error),
          userId: this.userId,
        }
      });
      throw error;
    }
  }

  /**
   * Decodifica o JWT para obter informações úteis
   */
  protected decodeJWT(): any {
    try {
      const parts = this.jwtToken.split('.');
      if (parts.length !== 3) {
        throw new Error('JWT inválido');
      }

      const decoded = JSON.parse(
        Buffer.from(parts[1], 'base64').toString('utf-8')
      );

      return decoded;
    } catch (error) {
      logger.warn('Erro ao decodificar JWT KOMMO', {
        context: "KOMMO_JWT_DECODE",
        data: {
          error: error instanceof Error ? error.message : String(error),
        }
      });
      return null;
    }
  }

  /**
   * Obtém informações do JWT
   */
  protected getJWTInfo() {
    const decoded = this.decodeJWT();
    
    if (!decoded) {
      return null;
    }

    return {
      accountId: decoded.account_id,
      accountHash: decoded.hash_uuid,
      baseDomain: decoded.base_domain,
      apiDomain: decoded.api_domain,
      sub: decoded.sub,
      scopes: decoded.scopes || [],
      expiresAt: new Date(decoded.exp * 1000),
      issuedAt: new Date(decoded.iat * 1000),
    };
  }
}
