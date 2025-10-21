/**
 * INTEGRAÇÃO DO CACHE INTELIGENTE NAS APIS CEO
 * 
 * Este arquivo demonstra como integrar o cache nas APIs existentes
 * sem modificar a lógica principal
 * 
 * @module APICacheIntegration
 */

import getCEOSmartCache, { CEOCacheKey } from './smart-cache';

// ==================== EXEMPLO 1: WRAPPER PARA APIs ====================

/**
 * Wrapper genérico para adicionar cache a qualquer API
 */
export async function withCEOCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  customTTL?: number
): Promise<T> {
  const cache = getCEOSmartCache();
  
  return await cache.getOrSet(cacheKey, fetchFn, customTTL);
}

// ==================== EXEMPLO 2: INTEGRATION PARA OPERATIONAL METRICS ====================

/**
 * Integração de cache para métricas operacionais
 * 
 * ANTES (sem cache):
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const data = await CEOBetelService.getOperationalMetrics();
 *   return NextResponse.json(data);
 * }
 * ```
 * 
 * DEPOIS (com cache):
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const cacheKey = `${CEOCacheKey.OPERATIONAL_METRICS}:${startDate}:${endDate}`;
 *   const data = await withCEOCache(cacheKey, async () => {
 *     return await CEOBetelService.getOperationalMetrics();
 *   });
 *   return NextResponse.json(data);
 * }
 * ```
 */
export async function getOperationalMetricsWithCache(
  startDate: string,
  endDate: string
): Promise<any> {
  const cacheKey = `${CEOCacheKey.OPERATIONAL_METRICS}:${startDate}:${endDate}`;
  
  return await withCEOCache(cacheKey, async () => {
    // Aqui ficaria a lógica original da API
    // Por enquanto, retornamos estrutura de exemplo
    return {
      costRevenueRatio: 0,
      customerAcquisitionCost: 0,
      costCenterProfitability: [],
      lastUpdated: new Date().toISOString(),
    };
  });
}

// ==================== EXEMPLO 3: INTEGRATION PARA ADVANCED METRICS ====================

/**
 * Integração de cache para métricas avançadas
 */
export async function getAdvancedMetricsWithCache(
  startDate: string,
  endDate: string
): Promise<any> {
  const cacheKey = `${CEOCacheKey.CAC_ANALYSIS}:${startDate}:${endDate}`;
  
  // TTL customizado de 15 minutos para análises avançadas
  return await withCEOCache(
    cacheKey,
    async () => {
      // Lógica original aqui
      return {
        cac: 0,
        ltv: 0,
        churnRate: 0,
        conversionRate: 0,
      };
    },
    15 * 60 * 1000 // 15 minutos
  );
}

// ==================== EXEMPLO 4: INTEGRATION PARA CASH FLOW ====================

/**
 * Integração de cache para fluxo de caixa
 * TTL curto (1 minuto) pois muda frequentemente
 */
export async function getCashFlowWithCache(
  startDate: string,
  endDate: string
): Promise<any> {
  const cacheKey = `${CEOCacheKey.CASH_FLOW}:${startDate}:${endDate}`;
  
  // TTL de 1 minuto para dados em tempo real
  return await withCEOCache(
    cacheKey,
    async () => {
      // Lógica original aqui
      return {
        inflows: [],
        outflows: [],
        balance: 0,
      };
    },
    60 * 1000 // 1 minuto
  );
}

// ==================== EXEMPLO 5: INTEGRATION PARA AUXILIARY DATA ====================

/**
 * Integração de cache para dados auxiliares
 * TTL longo (1 hora) pois raramente mudam
 */
export async function getCostCentersWithCache(): Promise<any[]> {
  const cacheKey = CEOCacheKey.COST_CENTERS;
  
  // TTL de 1 hora para dados auxiliares
  return await withCEOCache(
    cacheKey,
    async () => {
      // Lógica original aqui
      return [];
    },
    60 * 60 * 1000 // 1 hora
  );
}

/**
 * Integração de cache para formas de pagamento
 */
export async function getPaymentMethodsWithCache(): Promise<any[]> {
  const cacheKey = CEOCacheKey.PAYMENT_METHODS;
  
  return await withCEOCache(
    cacheKey,
    async () => {
      // Lógica original aqui
      return [];
    },
    60 * 60 * 1000 // 1 hora
  );
}

/**
 * Integração de cache para categorias
 */
export async function getCategoriesWithCache(): Promise<any[]> {
  const cacheKey = CEOCacheKey.CATEGORIES;
  
  return await withCEOCache(
    cacheKey,
    async () => {
      // Lógica original aqui
      return [];
    },
    60 * 60 * 1000 // 1 hora
  );
}

// ==================== EXEMPLO 6: CACHE COM PARÂMETROS MÚLTIPLOS ====================

/**
 * Cache com múltiplos parâmetros
 */
export async function getSalesAnalysisWithCache(
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month',
  vendorId?: number
): Promise<any> {
  // Criar chave única incluindo todos os parâmetros
  const params = {
    startDate,
    endDate,
    groupBy,
    vendorId: vendorId || 'all',
  };
  
  const cacheKey = `${CEOCacheKey.REVENUE_CHART}:${JSON.stringify(params)}`;
  
  return await withCEOCache(cacheKey, async () => {
    // Lógica original aqui
    return {
      data: [],
      total: 0,
    };
  });
}

// ==================== EXEMPLO 7: CACHE COM INVALIDAÇÃO CONDICIONAL ====================

/**
 * Cache que invalida automaticamente quando detecta dados desatualizados
 */
export async function getSmartCachedData<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  shouldInvalidate?: () => boolean
): Promise<T> {
  const cache = getCEOSmartCache();
  
  // Verificar se deve invalidar
  if (shouldInvalidate && shouldInvalidate()) {
    cache.invalidate(cacheKey);
  }
  
  return await cache.getOrSet(cacheKey, fetchFn);
}

// ==================== EXEMPLO 8: BATCH CACHE ====================

/**
 * Carregar múltiplos dados em cache de uma vez
 */
export async function batchLoadCache(configs: Array<{
  key: string;
  fetchFn: () => Promise<any>;
  ttl?: number;
}>) {
  const cache = getCEOSmartCache();
  
  await Promise.allSettled(
    configs.map(({ key, fetchFn, ttl }) =>
      cache.getOrSet(key, fetchFn, ttl)
    )
  );
}

/**
 * Exemplo de uso do batch load
 */
export async function preloadCEODashboardData(
  startDate: string,
  endDate: string
) {
  await batchLoadCache([
    {
      key: `${CEOCacheKey.OPERATIONAL_METRICS}:${startDate}:${endDate}`,
      fetchFn: async () => await getOperationalMetricsWithCache(startDate, endDate),
    },
    {
      key: `${CEOCacheKey.CASH_FLOW}:${startDate}:${endDate}`,
      fetchFn: async () => await getCashFlowWithCache(startDate, endDate),
      ttl: 60 * 1000, // 1 minuto
    },
    {
      key: CEOCacheKey.COST_CENTERS,
      fetchFn: async () => await getCostCentersWithCache(),
      ttl: 60 * 60 * 1000, // 1 hora
    },
  ]);
  
  console.log('[CEOCache] Dashboard data preloaded');
}

// ==================== EXEMPLO 9: CACHE COM RETRY ====================

/**
 * Cache com retry automático quando falha
 */
export async function getCachedDataWithRetry<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  const cache = getCEOSmartCache();
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await cache.getOrSet(cacheKey, fetchFn);
    } catch (error) {
      lastError = error as Error;
      console.error(`[CEOCache] Attempt ${attempt + 1} failed:`, error);
      
      // Aguardar antes de tentar novamente (backoff exponencial)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError || new Error('Failed after max retries');
}

// ==================== EXEMPLO 10: CACHE COM VALIDAÇÃO ====================

/**
 * Cache que valida dados antes de armazenar
 */
export async function getCachedDataWithValidation<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  validateFn: (data: T) => boolean
): Promise<T> {
  const cache = getCEOSmartCache();
  
  return await cache.getOrSet(cacheKey, async () => {
    const data = await fetchFn();
    
    // Validar dados antes de armazenar
    if (!validateFn(data)) {
      throw new Error('Data validation failed');
    }
    
    return data;
  });
}

/**
 * Exemplo de uso com validação
 */
export async function getValidatedOperationalMetrics(
  startDate: string,
  endDate: string
) {
  const cacheKey = `${CEOCacheKey.OPERATIONAL_METRICS}:${startDate}:${endDate}`;
  
  return await getCachedDataWithValidation(
    cacheKey,
    async () => await getOperationalMetricsWithCache(startDate, endDate),
    (data) => {
      // Validar estrutura dos dados
      return (
        typeof data === 'object' &&
        data !== null &&
        'costRevenueRatio' in data &&
        'customerAcquisitionCost' in data &&
        Array.isArray(data.costCenterProfitability)
      );
    }
  );
}

// ==================== EXPORTAÇÕES ====================

export default {
  withCEOCache,
  getOperationalMetricsWithCache,
  getAdvancedMetricsWithCache,
  getCashFlowWithCache,
  getCostCentersWithCache,
  getPaymentMethodsWithCache,
  getCategoriesWithCache,
  getSalesAnalysisWithCache,
  getSmartCachedData,
  batchLoadCache,
  preloadCEODashboardData,
  getCachedDataWithRetry,
  getCachedDataWithValidation,
  getValidatedOperationalMetrics,
};

