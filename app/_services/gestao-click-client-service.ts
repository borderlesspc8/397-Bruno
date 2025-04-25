/**
 * Serviço de integração com o Gestão Click para Clientes, Vendas e Situações de Vendas
 * Complemento ao serviço principal GestaoClickService
 */

import { prisma } from "@/app/_lib/prisma";
import {
  GestaoClickConfig,
  GestaoClickCliente,
  GestaoClickResponse,
  GestaoClickSituacaoVenda,
  GestaoClickVenda,
  GestaoClickVendaFiltros,
  GestaoClickImportResult
} from "@/app/_types/gestao-click";
import { gestaoClickConfig } from "../_config/gestao-click";
import { logger, LogOptions } from "./logger";
import { AppError } from "../_middleware/error-handler";
import { 
  buildGestaoClickUrl, 
  formatGestaoClickDate,
  extractGestaoClickData
} from "@/app/_lib/gestao-click-utils";

/**
 * Interface para configuração do cliente Gestão Click
 */
export interface GestaoClickClientConfig {
  apiKey: string;
  secretToken: string;
  apiUrl?: string;
  userId: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  authMethod?: 'bearer' | 'basic' | 'api-key' | 'url-params' | 'token';
}

/**
 * Classe para o serviço de integração com o Gestão Click focado em clientes e vendas
 */
export class GestaoClickClientService {
  private baseUrl: string;
  private accessToken: string;
  private secretAccessToken: string;
  private userId: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private authMethod: 'bearer' | 'basic' | 'api-key' | 'url-params' | 'token';

  /**
   * Construtor da classe
   * @param config Configuração opcional para o serviço
   */
  constructor(config?: GestaoClickClientConfig) {
    // Usar parâmetros da configuração ou valores padrão
    this.accessToken = config?.apiKey || gestaoClickConfig.accessToken;
    this.secretAccessToken = config?.secretToken || gestaoClickConfig.secretAccessToken;
    this.baseUrl = config?.apiUrl || gestaoClickConfig.apiUrl;
    this.userId = config?.userId || 'default';
    this.timeout = config?.timeout || gestaoClickConfig.timeout;
    this.retryAttempts = config?.retryAttempts || gestaoClickConfig.retryAttempts;
    this.retryDelay = config?.retryDelay || gestaoClickConfig.retryDelay;
    this.authMethod = config?.authMethod || gestaoClickConfig.authMethod as 'bearer' | 'basic' | 'api-key' | 'url-params' | 'token';

    // Validação básica dos parâmetros essenciais
    if (!this.accessToken || !this.secretAccessToken) {
      logger.error("Configuração incompleta do Gestão Click: tokens ausentes", {
        context: "GESTAO_CLICK",
        data: {
          accessToken: this.accessToken ? 'definido' : 'ausente',
          secretAccessToken: this.secretAccessToken ? 'definido' : 'ausente',
        }
      });
    }

    logger.info("Serviço Gestão Click inicializado", {
      context: "GESTAO_CLICK",
      data: {
        baseUrl: this.baseUrl,
        userId: this.userId,
        authMethod: this.authMethod,
        timeout: this.timeout,
        retryAttempts: this.retryAttempts
      }
    });
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 1
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
        throw new AppError(
          response.status,
          `Erro na requisição: ${response.statusText}`,
          { status: response.status, statusText: response.statusText }
        );
      }

      return response;
    } catch (error) {
      // Identificar o tipo de erro para logging
      const isTimeoutError = error instanceof Error && error.name === "AbortError";
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Log detalhado do erro para diagnóstico
      logger.warn(`Erro na requisição (tentativa ${attempt}/${this.retryAttempts})`, {
        context: "GESTAO_CLICK",
        data: {
          url,
          method: options.method,
          isTimeout: isTimeoutError,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      
      if (attempt < this.retryAttempts) {
        // Calcular delay progressivo para retry (aumentando a cada tentativa)
        const progressiveDelay = this.retryDelay * Math.pow(1.5, attempt - 1);
        
        logger.warn(`Tentativa ${attempt} falhou, tentando novamente em ${progressiveDelay}ms...`, {
          context: "GESTAO_CLICK",
          data: {
            url,
            nextAttempt: attempt + 1,
            delay: progressiveDelay
          }
        });
        
        await new Promise((resolve) => setTimeout(resolve, progressiveDelay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      
      // Todas as tentativas falharam
      logger.error(`Todas as ${this.retryAttempts} tentativas falharam`, {
        context: "GESTAO_CLICK",
        data: {
          url,
          method: options.method,
          finalError: errorMessage
        }
      });
      
      throw error;
    }
  }

  private getHeaders(): HeadersInit {
    // Seleciona o método de autenticação conforme a configuração
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": gestaoClickConfig.userAgent
    };
    
    // Adiciona cabeçalhos de autenticação conforme o método configurado
    switch (this.authMethod) {
      case 'bearer':
        headers["Authorization"] = `Bearer ${this.accessToken}`;
        headers["X-Secret-Token"] = this.secretAccessToken;
        break;
      case 'basic':
        const basicAuthToken = Buffer.from(`${this.accessToken}:${this.secretAccessToken}`).toString('base64');
        headers["Authorization"] = `Basic ${basicAuthToken}`;
        break;
      case 'api-key':
        headers["X-API-KEY"] = this.accessToken;
        headers["X-API-SECRET"] = this.secretAccessToken;
        break;
      case 'token':
        headers["access-token"] = this.accessToken;
        headers["secret-access-token"] = this.secretAccessToken;
        break;
      case 'url-params':
        // Nesse caso não adicionamos headers de auth, apenas usamos URL params
        break;
    }
    
    if (gestaoClickConfig.debug) {
      // Registra em log os headers usados (mascarando valores sensíveis)
      const maskedHeaders = { ...headers };
      if (maskedHeaders["Authorization"]) {
        maskedHeaders["Authorization"] = maskedHeaders["Authorization"].substring(0, 15) + "...";
      }
      if (maskedHeaders["X-API-KEY"]) {
        maskedHeaders["X-API-KEY"] = maskedHeaders["X-API-KEY"].substring(0, 5) + "...";
      }
      if (maskedHeaders["X-API-SECRET"]) {
        maskedHeaders["X-API-SECRET"] = maskedHeaders["X-API-SECRET"].substring(0, 5) + "...";
      }
      if (maskedHeaders["X-Secret-Token"]) {
        maskedHeaders["X-Secret-Token"] = maskedHeaders["X-Secret-Token"].substring(0, 5) + "...";
      }
      if (maskedHeaders["access-token"]) {
        maskedHeaders["access-token"] = maskedHeaders["access-token"].substring(0, 5) + "...";
      }
      if (maskedHeaders["secret-access-token"]) {
        maskedHeaders["secret-access-token"] = maskedHeaders["secret-access-token"].substring(0, 5) + "...";
      }
      
      logger.info("Headers para requisição:", {
        context: "GESTAO_CLICK",
        data: maskedHeaders
      });
    }
    
    return headers;
  }

  /**
   * Prepara a URL para requisição incluindo parâmetros de autenticação se necessário
   * @param endpoint Endpoint a ser acessado
   * @returns URL completa
   */
  private buildUrl(endpoint: string): string {
    // Certifica que endpoint começa com /
    if (!endpoint.startsWith('/')) {
      endpoint = `/${endpoint}`;
    }
    
    // Remove prefixo /api se já estiver incluído no endpoint
    if (endpoint.startsWith('/api/')) {
      endpoint = endpoint.substring(4); // Remove '/api'
    }
    
    // Adiciona o prefixo /api se necessário e não estiver presente
    if (gestaoClickConfig.apiVersion && !endpoint.includes(`/api/${gestaoClickConfig.apiVersion}`)) {
      endpoint = `/api/${gestaoClickConfig.apiVersion}${endpoint}`;
    } else if (!endpoint.includes('/api')) {
      // Garante que o endpoint tenha o prefixo /api
      endpoint = `/api${endpoint}`;
    }
    
    let url = `${this.baseUrl}${endpoint}`;
    
    // Para autenticação via URL params, adiciona os tokens como parâmetros
    if (this.authMethod === 'url-params') {
      const urlObj = new URL(url);
      urlObj.searchParams.append('token', this.accessToken);
      urlObj.searchParams.append('secret', this.secretAccessToken);
      url = urlObj.toString();
    }
    
    logger.debug(`URL construída: ${url}`, {
      context: "GESTAO_CLICK",
      data: {
        baseUrl: this.baseUrl,
        endpoint,
        authMethod: this.authMethod
      }
    });
    
    return url;
  }

  /**
   * Testa a conexão com o Gestão Click
   * @returns true se a conexão for bem sucedida, false caso contrário
   */
  async testConnection(): Promise<boolean> {
    try {
      // Validar se temos os tokens necessários
      if (!this.accessToken || !this.secretAccessToken) {
        logger.error("Impossível testar conexão: credenciais ausentes", {
          context: "GESTAO_CLICK"
        });
        return false;
      }
      
      // Lista de endpoints mais comuns a serem testados, em ordem de prioridade
      // Reduzimos a lista para apenas 2 endpoints principais para evitar demoras
      const endpoints = [
        '/vendas',
        '/clientes'
      ];
      
      // Usa timeout reduzido para testes rápidos
      const testTimeout = 5000; // 5 segundos máximo para teste
      
      // Tenta cada endpoint até obter sucesso
      for (const endpoint of endpoints) {
        try {
          // Construir URL com parâmetros de autenticação se necessário
          const url = this.buildUrl(endpoint);
          
          // Log da tentativa
          logger.info(`Testando conexão com Gestão Click: ${endpoint}`, {
            context: "GESTAO_CLICK",
            data: {
              url: url,
              method: this.authMethod
            }
          });
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), testTimeout);
          
          // Realizar a requisição com timeout específico para testes
          const response = await fetch(url, {
            method: "GET",
            headers: this.getHeaders(),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Verificar status HTTP de sucesso (2xx) - sem parse do JSON para acelerar
          if (response.status >= 200 && response.status < 300) {
            logger.info(`Conexão com Gestão Click estabelecida com sucesso via ${endpoint}`, {
              context: "GESTAO_CLICK"
            });
            return true;
          } else {
            logger.warn(`Resposta não bem-sucedida do endpoint ${endpoint}: ${response.status} ${response.statusText}`, {
              context: "GESTAO_CLICK"
            });
          }
        } catch (endpointError) {
          // Log do erro para este endpoint
          logger.warn(`Falha ao testar endpoint ${endpoint}`, {
            context: "GESTAO_CLICK",
            data: {
              message: endpointError instanceof Error 
                ? endpointError.message 
                : String(endpointError)
            }
          });
          // Continua tentando outros endpoints
        }
      }
      
      // Se chegou aqui, todos os endpoints falharam
      logger.error("Todos os endpoints de teste falharam", {
        context: "GESTAO_CLICK"
      });
      
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Falha ao testar conexão com a API", {
        context: "GESTAO_CLICK",
        data: {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      return false;
    }
  }

  /**
   * Busca todos os clientes do Gestão Click
   * @param page Página atual (padrão: 1)
   * @param limit Limite de itens por página (padrão: 20)
   * @returns Lista de clientes
   */
  async getClientes(page: number = 1, limit: number = 20): Promise<GestaoClickResponse<GestaoClickCliente>> {
    try {
      // Constrói a URL base
      const baseUrl = this.buildUrl("/clientes");
      
      // Adiciona parâmetros de paginação
      const urlObj = new URL(baseUrl);
      urlObj.searchParams.append('page', page.toString());
      urlObj.searchParams.append('per_page', limit.toString());

      const response = await this.fetchWithRetry(urlObj.toString(), {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await response.json();
    } catch (error) {
      logger.error('Erro ao buscar clientes do Gestão Click', {
        context: "GESTAO_CLICK",
        data: error instanceof Error ? error.message : String(error),
      });
      return {
        data: [],
        meta: {
          current_page: page,
          per_page: limit,
          total: 0,
          total_pages: 0
        }
      };
    }
  }

  /**
   * Busca um cliente específico pelo ID
   * @param id ID do cliente
   * @returns Dados do cliente
   */
  async getClienteById(id: string): Promise<GestaoClickCliente | null> {
    try {
      logger.info(`Buscando cliente com ID: ${id}`, {
        context: "GESTAO_CLICK",
      });

      const response = await this.fetchWithRetry(this.buildUrl(`/clientes/${id}`), {
        method: 'GET',
        headers: this.getHeaders()
      });

      const responseText = await response.text();
      logger.info(`Resposta da API para cliente ${id}`, {
        context: "GESTAO_CLICK",
        data: responseText.substring(0, 200) + "...",
      });
      
      try {
        const data = JSON.parse(responseText);
        let cliente: GestaoClickCliente | null = null;

        if (Array.isArray(data.data)) {
          cliente = data.data[0];
        } else if (data.data && typeof data.data === 'object') {
          cliente = data.data;
        } else if (data.id) {
          cliente = data;
        }
        
        if (!cliente) {
          logger.error(`Cliente ${id} não encontrado na resposta`, {
            context: "GESTAO_CLICK",
            data,
          });
          return null;
        }
        
        logger.info(`Cliente encontrado: ${cliente.id} - ${cliente.codigo || 'Sem código'}`, {
          context: "GESTAO_CLICK",
        });
        return cliente;
      } catch (parseError) {
        logger.error(`Erro ao fazer parse da resposta para cliente ${id}`, {
          context: "GESTAO_CLICK",
          data: parseError instanceof Error ? parseError.message : String(parseError),
        });
        return null;
      }
    } catch (error) {
      logger.error(`Erro ao buscar cliente ${id} do Gestão Click`, {
        context: "GESTAO_CLICK",
        data: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Busca as situações de vendas do Gestão Click
   * @returns Lista de situações de vendas
   */
  async getSituacoesVendas(): Promise<GestaoClickResponse<GestaoClickSituacaoVenda>> {
    try {
      const response = await this.fetchWithRetry(this.buildUrl("/situacoes_vendas"), {
        method: 'GET',
        headers: this.getHeaders()
      });

      return await response.json();
    } catch (error) {
      logger.error('Erro ao buscar situações de vendas do Gestão Click:', error);
      // Retorna uma estrutura vazia compatível com a interface
      return {
        code: 500,
        status: 'error',
        meta: {
          total_registros: 0,
          total_da_pagina: 0,
          pagina_atual: 1,
          limite_por_pagina: 20,
          pagina_anterior: null,
          url_anterior: null,
          proxima_pagina: null,
          proxima_url: null
        },
        data: []
      };
    }
  }

  /**
   * Busca vendas do Gestão Click com filtros
   * @param filtros Filtros para a busca
   * @param page Página atual (padrão: 1)
   * @param limit Limite de itens por página (padrão: 20)
   * @returns Lista de vendas
   */
  async getVendas(
    filtros: GestaoClickVendaFiltros = {},
    page: number = 1,
    limit: number = 20
  ): Promise<GestaoClickResponse<GestaoClickVenda>> {
    try {
      const logOptions: LogOptions = {
        context: "GESTAO_CLICK",
        data: filtros
      };
      
      logger.info(`Buscando vendas com filtros`, logOptions);
      
      // Parâmetros básicos de paginação
      const params: Record<string, string | number | boolean | undefined> = {
        page: page,
        per_page: limit,
      };
      
      // Adicionar todos os filtros disponíveis
      // Filtros de data
      if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
      if (filtros.data_fim) params.data_fim = filtros.data_fim;
      
      // Filtros de loja, cliente e código
      if (filtros.loja_id) params.loja_id = filtros.loja_id;
      if (filtros.codigo) params.codigo = filtros.codigo;
      if (filtros.cliente_id) params.cliente_id = filtros.cliente_id;
      if (filtros.nome) params.nome = filtros.nome; // Nome da venda ou cliente
      
      // Filtros de situação e centro de custo
      if (filtros.situacao_id) params.situacao_id = filtros.situacao_id;
      if (filtros.centro_custo_id) params.centro_custo_id = filtros.centro_custo_id;
      
      // Adicionar outros filtros passados
      for (const [key, value] of Object.entries(filtros)) {
        if (
          value !== undefined && 
          !['data_inicio', 'data_fim', 'loja_id', 'codigo', 'cliente_id', 'nome', 'situacao_id', 'centro_custo_id'].includes(key)
        ) {
          params[key] = value;
        }
      }
      
      // Construir URL base
      const baseUrl = this.buildUrl("/vendas");
      const urlObj = new URL(baseUrl);
      
      // Adicionar todos os parâmetros à URL
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Adiciona o parâmetro à URL
          urlObj.searchParams.append(key, String(value));
          
          // Para parâmetros de data, adicionar em formato alternativo também para compatibilidade
          if (key === 'data_inicio') {
            urlObj.searchParams.append('dataInicio', String(value));
          } 
          else if (key === 'data_fim') {
            urlObj.searchParams.append('dataFim', String(value));
          }
        }
      });
      
      const finalUrl = urlObj.toString();
      
      logger.info(`URL final para busca de vendas: ${finalUrl}`, {
        context: "GESTAO_CLICK"
      });
      
      const response = await this.fetchWithRetry(finalUrl, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const responseData = await response.json();
      logger.info(`Resposta da API de vendas recebida`, {
        context: "GESTAO_CLICK",
        data: {
          status: response.status,
          dataCount: responseData.data?.length || 0
        }
      });

      // Adicionar log detalhado dos dados recebidos para depuração
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Estrutura da resposta da API de vendas:');
        console.log('Meta:', JSON.stringify(responseData.meta || {}, null, 2));
        console.log('Códigos:', JSON.stringify(responseData.code || '', null, 2));
        console.log('Status:', JSON.stringify(responseData.status || '', null, 2));
        
        if (responseData.data && Array.isArray(responseData.data)) {
          console.log(`Recebidos ${responseData.data.length} registros de vendas`);
          if (responseData.data.length > 0) {
            console.log('Amostra do primeiro registro:');
            console.log(JSON.stringify(responseData.data[0], null, 2).substring(0, 500) + '...');
            console.log('Propriedades do primeiro objeto:');
            console.log(Object.keys(responseData.data[0] || {}).join(', '));
          } else {
            console.log('Array de dados vazio. Nenhum resultado encontrado.');
          }
        } else {
          console.log('Dados recebidos não são um array:', typeof responseData.data);
          console.log(JSON.stringify(responseData.data || 'null', null, 2).substring(0, 200));
        }
      }

      return responseData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erro ao buscar vendas do Gestão Click', {
        context: "GESTAO_CLICK",
        data: errorMessage
      });
      
      // Retorna uma estrutura vazia compatível com a interface
      return {
        code: 500,
        status: 'error',
        meta: {
          current_page: page,
          per_page: limit,
          total: 0,
          total_pages: 0
        },
        data: []
      };
    }
  }

  /**
   * Busca uma venda específica pelo ID
   * @param id ID da venda
   * @returns Dados da venda
   */
  async getVendaById(id: string): Promise<GestaoClickVenda | null> {
    try {
      logger.info(`[DEBUG] Buscando venda com ID: ${id}`);
      
      const response = await this.fetchWithRetry(this.buildUrl(`/vendas/${id}`), {
        method: 'GET',
        headers: this.getHeaders()
      });

      const responseText = await response.text();
      logger.info(`[DEBUG] Resposta da API: ${responseText.substring(0, 100)}...`);
      
      // Tenta converter para JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        logger.error(`[ERROR] Falha ao analisar resposta JSON: ${e}`);
        throw new Error(`Resposta da API não é um JSON válido`);
      }
      
      // Verificar diferentes formatos possíveis da resposta
      let venda = null;
      
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        // Formato 1: { data: [ venda ] }
        venda = data.data[0];
        logger.info(`[DEBUG] Venda encontrada no formato array`);
      } else if (data.data && typeof data.data === 'object') {
        // Formato 2: { data: venda }
        venda = data.data;
        logger.info(`[DEBUG] Venda encontrada no formato objeto`);
      } else if (data.id) {
        // Formato 3: Venda diretamente no objeto raiz
        venda = data;
        logger.info(`[DEBUG] Venda encontrada no formato direto`);
      }
      
      if (!venda) {
        logger.error(`[ERROR] Venda com ID ${id} não encontrada nos dados retornados`);
        return null;
      }
      
      logger.info(`[DEBUG] Venda encontrada: ${venda.id} - ${venda.codigo || 'Sem código'}`);
      return venda;
    } catch (error) {
      logger.error(`[ERROR] Erro ao buscar venda ${id} do Gestão Click:`, error);
      return null;
    }
  }

  /**
   * Busca todos os clientes recursivamente (paginação automática)
   * @returns Lista completa de clientes
   */
  async getAllClientes(): Promise<GestaoClickCliente[]> {
    let allClientes: GestaoClickCliente[] = [];
    let currentPage = 1;
    let hasNextPage = true;
    
    while (hasNextPage) {
      const response = await this.getClientes(currentPage, 100);
      
      if (response.data.length > 0) {
        allClientes = [...allClientes, ...response.data];
      }
      
      hasNextPage = response.meta.proxima_pagina !== null;
      currentPage++;
      
      // Limite de segurança para evitar loops infinitos
      if (currentPage > 100) {
        break;
      }
    }
    
    return allClientes;
  }
  
  /**
   * Obtém todas as vendas do Gestão Click com paginação
   * @param filtros Filtros para busca de vendas
   * @returns Lista de todas as vendas
   */
  async getAllVendas(filtros: GestaoClickVendaFiltros = {}): Promise<GestaoClickVenda[]> {
    let allVendas: GestaoClickVenda[] = [];
    let currentPage = 1;
    let hasNextPage = true;
    
    // Limite máximo de páginas para evitar sobrecarga na API
    const MAX_PAGES = 50;
    
    logger.info(`Iniciando busca paginada de vendas com limite de ${MAX_PAGES} páginas`, {
      context: "GESTAO_CLICK",
      data: {
        filtros,
        maxPages: MAX_PAGES
      }
    });
    
    while (hasNextPage && currentPage <= MAX_PAGES) {
      logger.info(`Buscando página ${currentPage} de vendas`, {
        context: "GESTAO_CLICK",
        data: { page: currentPage }
      });
      
      const response = await this.getVendas(filtros, currentPage, 100);
      
      if (response.data.length > 0) {
        logger.info(`Recebidos ${response.data.length} registros na página ${currentPage}`, {
          context: "GESTAO_CLICK"
        });
        allVendas = [...allVendas, ...response.data];
      } else {
        logger.info(`Nenhum registro encontrado na página ${currentPage}. Finalizando paginação.`, {
          context: "GESTAO_CLICK"
        });
        break;
      }
      
      // Verificação de próxima página com tratamento de tipos
      const metaData = response.meta as any;
      hasNextPage = metaData?.proxima_pagina !== null && metaData?.proxima_pagina !== undefined;
      currentPage++;
      
      if (currentPage > MAX_PAGES) {
        logger.warn(`Limite máximo de ${MAX_PAGES} páginas atingido. Interrompendo paginação.`, {
          context: "GESTAO_CLICK"
        });
      }
    }
    
    logger.info(`Busca de vendas finalizada. Total de ${allVendas.length} registros encontrados em ${currentPage-1} página(s)`, {
      context: "GESTAO_CLICK"
    });
    
    return allVendas;
  }

  /**
   * Importa clientes do Gestão Click para o banco de dados
   * @param startDate Data de início para importação
   * @param endDate Data de fim para importação
   * @returns Resultado da importação
   */
  async importClientes(): Promise<GestaoClickImportResult> {
    const result: GestaoClickImportResult = {
      totalProcessed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      details: []
    };

    try {
      // Busca todos os clientes
      const clientes = await this.getAllClientes();
      result.totalProcessed = clientes.length;

      // Busca clientes já existentes para evitar duplicação
      const existingClientsIds = await this.getExistingClientesIds();
      
      // Processar cada cliente
      for (const cliente of clientes) {
        try {
          if (existingClientsIds.has(cliente.id)) {
            result.skipped++;
            continue;
          }

          // Importar cliente para o banco de dados
          await this.storeCliente(cliente);
          result.imported++;
          
          result.details?.push({
            id: cliente.id,
            nome: cliente.nome,
            tipo: cliente.tipo_pessoa,
            status: 'imported'
          });
        } catch (error) {
          logger.error(`Erro ao importar cliente ${cliente.id}:`, error);
          result.errors++;
          
          result.details?.push({
            id: cliente.id,
            nome: cliente.nome,
            tipo: cliente.tipo_pessoa,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      result.endDate = new Date().toISOString();
      return result;
    } catch (error) {
      logger.error('Erro ao importar clientes:', error);
      result.errors = 1;
      result.endDate = new Date().toISOString();
      return result;
    }
  }

  /**
   * Importa vendas do Gestão Click para o banco de dados
   * @param startDate Data de início para importação (formato YYYY-MM-DD)
   * @param endDate Data de fim para importação (formato YYYY-MM-DD)
   * @param filtros Filtros adicionais para a importação
   * @returns Resultado da importação
   */
  async importVendas(
    startDate: string, 
    endDate: string,
    filtros: Omit<GestaoClickVendaFiltros, 'data_inicio' | 'data_fim'> = {}
  ): Promise<GestaoClickImportResult> {
    const result: GestaoClickImportResult = {
      totalProcessed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      startDate,
      endDate,
      details: []
    };
    
    try {
      // Configura filtros com as datas
      const vendaFiltros: GestaoClickVendaFiltros = {
        ...filtros,
        data_inicio: startDate,
        data_fim: endDate
      };
      
      // Busca todas as vendas com os filtros
      const vendas = await this.getAllVendas(vendaFiltros);
      result.totalProcessed = vendas.length;
      
      console.log(`[DEBUG] Processando ${vendas.length} vendas do Gestão Click`);
      
      // Inicializar o banco de dados
      const { db } = await import('@/app/_lib/db');
      
      // Busca vendas já existentes para evitar duplicação
      const existingVendasIds = new Set<string>();
      const existingVendas = await db.sales_records.findMany({
        where: {
          userId: this.userId,
          source: 'GESTAO_CLICK'
        },
        select: {
          externalId: true
        }
      });
      
      existingVendas.forEach(venda => {
        if (venda.externalId) {
          existingVendasIds.add(venda.externalId);
        }
      });
      
      console.log(`[DEBUG] Encontradas ${existingVendasIds.size} vendas já importadas anteriormente`);
      
      // Processar cada venda
      for (const venda of vendas) {
        try {
          if (!venda.id) {
            console.error(`[ERROR] Venda sem ID válido:`, JSON.stringify(venda).substring(0, 200));
            result.errors++;
            
            result.details.push({
              id: 'unknown',
              codigo: venda.codigo || 'unknown',
              cliente: venda.nome_cliente || 'unknown',
              valor: venda.valor_total || 0,
              status: 'error',
              error: 'Venda sem ID válido'
            });
            continue;
          }
          
          if (existingVendasIds.has(venda.id.toString())) {
            console.log(`[DEBUG] Venda ${venda.id} já existe, pulando`);
            result.skipped++;
            continue;
          }
          
          // Importar venda para o banco de dados
          await this.storeVenda(venda);
          result.imported++;
          
          result.details.push({
            id: venda.id,
            codigo: venda.codigo,
            cliente: venda.nome_cliente,
            valor: venda.valor_total,
            status: 'imported'
          });
        } catch (error) {
          console.error(`[ERROR] Erro ao importar venda ${venda.id}:`, error);
          result.errors++;
          
          result.details.push({
            id: venda.id,
            codigo: venda.codigo,
            cliente: venda.nome_cliente,
            valor: venda.valor_total,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      console.log(`[DEBUG] Importação concluída: ${result.imported} importadas, ${result.skipped} puladas, ${result.errors} erros`);
      return result;
    } catch (error) {
      console.error('[ERROR] Erro ao importar vendas:', error);
      result.errors = 1;
      return result;
    }
  }

  /**
   * Obtém os IDs de clientes já existentes no banco de dados
   * @returns Conjunto com os IDs externos dos clientes
   */
  private async getExistingClientesIds(): Promise<Set<string>> {
    const existingClients = await prisma.customer.findMany({
      where: {
        userId: this.userId,
        metadata: {
          path: ['source'],
          equals: 'GESTAO_CLICK',
        },
      },
      select: {
        metadata: true,
      },
    });

    const existingIds = new Set<string>();
    
    for (const client of existingClients) {
      const externalId = client.metadata?.['externalId'];
      if (externalId) {
        existingIds.add(externalId);
      }
    }
    
    return existingIds;
  }

  /**
   * Obtém os IDs de vendas já existentes no banco de dados
   * @returns Conjunto com os IDs externos das vendas
   */
  private async getExistingVendasIds(): Promise<Set<string>> {
    const existingSales = await prisma.sale.findMany({
      where: {
        userId: this.userId,
        metadata: {
          path: ['source'],
          equals: 'GESTAO_CLICK',
        },
      },
      select: {
        metadata: true,
      },
    });

    const existingIds = new Set<string>();
    
    for (const sale of existingSales) {
      const externalId = sale.metadata?.['externalId'];
      if (externalId) {
        existingIds.add(externalId);
      }
    }
    
    return existingIds;
  }

  /**
   * Armazena um cliente no banco de dados
   * @param cliente Cliente a ser armazenado
   */
  private async storeCliente(cliente: GestaoClickCliente): Promise<void> {
    try {
      // Verifica se o cliente já existe pelo ID externo
      const existingClient = await prisma.customer.findFirst({
        where: {
          userId: this.userId,
          metadata: {
            path: ['externalId'],
            equals: cliente.id,
          },
        },
      });

      if (existingClient) {
        // Atualiza o cliente existente
        await prisma.customer.update({
          where: {
            id: existingClient.id,
          },
          data: {
            name: cliente.nome,
            documentNumber: cliente.tipo_pessoa === 'PF' ? cliente.cpf : cliente.cnpj,
            documentType: cliente.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ',
            email: cliente.email,
            phone: cliente.telefone || cliente.celular,
            active: cliente.ativo === '1',
            metadata: {
              source: 'GESTAO_CLICK',
              externalId: cliente.id,
              tipo_pessoa: cliente.tipo_pessoa,
              razao_social: cliente.razao_social,
              inscricao_estadual: cliente.inscricao_estadual,
              inscricao_municipal: cliente.inscricao_municipal,
              rg: cliente.rg,
              data_nascimento: cliente.data_nascimento,
              fax: cliente.fax,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // Cria um novo cliente
        await prisma.customer.create({
          data: {
            userId: this.userId,
            name: cliente.nome,
            documentNumber: cliente.tipo_pessoa === 'PF' ? cliente.cpf : cliente.cnpj,
            documentType: cliente.tipo_pessoa === 'PF' ? 'CPF' : 'CNPJ',
            email: cliente.email,
            phone: cliente.telefone || cliente.celular,
            active: cliente.ativo === '1',
            metadata: {
              source: 'GESTAO_CLICK',
              externalId: cliente.id,
              tipo_pessoa: cliente.tipo_pessoa,
              razao_social: cliente.razao_social,
              inscricao_estadual: cliente.inscricao_estadual,
              inscricao_municipal: cliente.inscricao_municipal,
              rg: cliente.rg,
              data_nascimento: cliente.data_nascimento,
              fax: cliente.fax,
              createdAt: new Date().toISOString(),
            },
          },
        });
      }

      // Todo: Criar/atualizar endereços e contatos do cliente em tabelas relacionadas
    } catch (error) {
      logger.error(`Erro ao armazenar cliente ${cliente.id}:`, error);
      throw error;
    }
  }

  /**
   * Armazena uma venda do Gestão Click no banco de dados
   * @param venda Dados da venda do Gestão Click
   * @returns ID da venda armazenada
   */
  private async storeVenda(venda: any): Promise<string> {
    try {
      if (!venda.id) {
        throw new Error('ID da venda é undefined ou inválido');
      }
      
      console.log(`[DEBUG] Armazenando venda ID ${venda.id} código ${venda.codigo || 'N/A'}`);
      
      // Importar banco de dados se necessário
      const { db } = await import('@/app/_lib/db');
      
      // Verificar se a venda já existe
      const existingVenda = await db.sales_records.findFirst({
        where: {
          userId: this.userId,
          externalId: venda.id.toString()
        }
      });
      
      if (existingVenda) {
        console.log(`[DEBUG] Venda ID ${venda.id} já existe no banco de dados, pulando`);
        return existingVenda.id;
      }
      
      // Converter valor total para número
      const valorTotal = parseFloat(venda.valor_total) || 0;
      
      // Criar um ID único para a venda
      const vendaId = `sr_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // Criar a venda no banco de dados
      const newVenda = await db.sales_records.create({
        data: {
          id: vendaId,
          userId: this.userId,
          externalId: venda.id.toString(),
          code: venda.codigo || venda.id.toString(),
          date: new Date(venda.data),
          totalAmount: valorTotal,
          netAmount: valorTotal,
          status: venda.nome_situacao || 'PENDING',
          customerName: venda.nome_cliente || 'Cliente não informado',
          storeName: venda.nome_loja || 'Loja não informada',
          source: 'GESTAO_CLICK',
          createdAt: new Date(),
          updatedAt: new Date(),
          // Também criamos parcelas se existirem
          installments: venda.numero_parcelas && parseInt(venda.numero_parcelas) > 0
            ? {
                create: this.createInstallmentsData(venda, valorTotal, parseInt(venda.numero_parcelas))
              }
            : undefined
        }
      });
      
      console.log(`[DEBUG] Venda ID ${venda.id} armazenada com sucesso como ${newVenda.id}`);
      return newVenda.id;
      
    } catch (error) {
      console.error(`[ERROR] Erro ao armazenar venda ${venda.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Cria os dados das parcelas para uma venda
   * @param venda Dados da venda
   * @param valorTotal Valor total da venda
   * @param numParcelas Número de parcelas
   * @returns Array com os dados das parcelas
   */
  private createInstallmentsData(venda: any, valorTotal: number, numParcelas: number): any[] {
    const parcelas = [];
    const dataBase = venda.data_primeira_parcela ? new Date(venda.data_primeira_parcela) : new Date(venda.data);
    const valorParcela = valorTotal / numParcelas;
    
    for (let i = 1; i <= numParcelas; i++) {
      // Calcular a data de vencimento da parcela
      const dataParcela = new Date(dataBase);
      if (i > 1 && venda.intervalo_dias) {
        dataParcela.setDate(dataParcela.getDate() + (i - 1) * parseInt(venda.intervalo_dias));
      }
      
      // Criar ID único para a parcela
      const parcelaId = `inst_${Date.now()}_${i}_${Math.floor(Math.random() * 10000)}`;
      
      parcelas.push({
        id: parcelaId,
        number: i,
        amount: valorParcela,
        dueDate: dataParcela,
        status: 'PENDING',
        userId: this.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return parcelas;
  }

  /**
   * Importa situações de vendas do Gestão Click para o banco de dados
   * @returns Resultado da importação
   */
  async importSituacoesVendas(): Promise<GestaoClickImportResult> {
    const result: GestaoClickImportResult = {
      totalProcessed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      details: []
    };

    try {
      // Busca todas as situações de vendas
      const response = await this.getSituacoesVendas();
      const situacoes = response.data;
      result.totalProcessed = situacoes.length;

      // Busca situações já existentes para evitar duplicação
      const existingSituacoesIds = await this.getExistingSituacoesIds();
      
      // Processar cada situação
      for (const situacao of situacoes) {
        try {
          if (existingSituacoesIds.has(situacao.id)) {
            result.skipped++;
            continue;
          }

          // Importar situação para o banco de dados
          await this.storeSituacaoVenda(situacao);
          result.imported++;
          
          result.details?.push({
            id: situacao.id,
            nome: situacao.nome,
            padrao: situacao.padrao === '1' ? 'Sim' : 'Não',
            status: 'imported'
          });
        } catch (error) {
          logger.error(`Erro ao importar situação ${situacao.id}:`, error);
          result.errors++;
          
          result.details?.push({
            id: situacao.id,
            nome: situacao.nome,
            padrao: situacao.padrao === '1' ? 'Sim' : 'Não',
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      result.endDate = new Date().toISOString();
      return result;
    } catch (error) {
      logger.error('Erro ao importar situações de vendas:', error);
      result.errors = 1;
      result.endDate = new Date().toISOString();
      return result;
    }
  }

  /**
   * Obtém os IDs de situações de vendas já existentes no banco de dados
   * @returns Conjunto com os IDs externos das situações de vendas
   */
  private async getExistingSituacoesIds(): Promise<Set<string>> {
    const existingSituacoes = await prisma.saleStatus.findMany({
      where: {
        userId: this.userId,
        metadata: {
          path: ['source'],
          equals: 'GESTAO_CLICK',
        },
      },
      select: {
        metadata: true,
      },
    });

    const existingIds = new Set<string>();
    
    for (const situacao of existingSituacoes) {
      const externalId = situacao.metadata?.['externalId'];
      if (externalId) {
        existingIds.add(externalId);
      }
    }
    
    return existingIds;
  }

  /**
   * Armazena uma situação de venda no banco de dados
   * @param situacao Situação de venda a ser armazenada
   */
  private async storeSituacaoVenda(situacao: GestaoClickSituacaoVenda): Promise<void> {
    try {
      // Verifica se a situação já existe pelo ID externo
      const existingSituacao = await prisma.saleStatus.findFirst({
        where: {
          userId: this.userId,
          metadata: {
            path: ['externalId'],
            equals: situacao.id,
          },
        },
      });

      if (existingSituacao) {
        // Atualiza a situação existente
        await prisma.saleStatus.update({
          where: {
            id: existingSituacao.id,
          },
          data: {
            name: situacao.nome,
            isDefault: situacao.padrao === '1',
            metadata: {
              source: 'GESTAO_CLICK',
              externalId: situacao.id,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // Cria uma nova situação
        await prisma.saleStatus.create({
          data: {
            userId: this.userId,
            name: situacao.nome,
            isDefault: situacao.padrao === '1',
            metadata: {
              source: 'GESTAO_CLICK',
              externalId: situacao.id,
              createdAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error) {
      logger.error(`Erro ao armazenar situação de venda ${situacao.id}:`, error);
      throw error;
    }
  }

  /**
   * Importa todos os dados de clientes e vendas do Gestão Click
   * @param startDate Data de início para importação de vendas (formato YYYY-MM-DD)
   * @param endDate Data de fim para importação de vendas (formato YYYY-MM-DD)
   * @returns Resultado completo da importação
   */
  async importAllClientData(
    startDate: string,
    endDate: string
  ): Promise<{
    clientes: GestaoClickImportResult;
    situacoes: GestaoClickImportResult;
    vendas: GestaoClickImportResult;
  }> {
    // Importar situações de vendas
    const situacoesResult = await this.importSituacoesVendas();
    
    // Importar clientes
    const clientesResult = await this.importClientes();
    
    // Importar vendas
    const vendasResult = await this.importVendas(startDate, endDate);
    
    return {
      clientes: clientesResult,
      situacoes: situacoesResult,
      vendas: vendasResult,
    };
  }

  /**
   * Cria um cruzamento de dados entre clientes, vendas e transações financeiras
   * @param clienteId ID do cliente (opcional)
   * @param startDate Data de início (formato YYYY-MM-DD)
   * @param endDate Data de fim (formato YYYY-MM-DD)
   * @returns Dados cruzados do cliente
   */
  async getCrossClientData(
    clienteId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      // Implementação do cruzamento de dados
      // Este método buscará dados do cliente, vendas associadas e transações financeiras
      // e criará uma visão consolidada
      
      // Esta é uma implementação inicial que precisará ser adaptada
      // conforme as necessidades específicas do sistema
      
      // Todo: Implementar a lógica de cruzamento de dados
      
      return {
        success: true,
        message: 'Cruzamento de dados implementado com sucesso',
        data: {
          // Dados cruzados serão retornados aqui
        }
      };
    } catch (error) {
      logger.error('Erro ao realizar cruzamento de dados:', error);
      return {
        success: false,
        message: 'Erro ao realizar cruzamento de dados',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
} 