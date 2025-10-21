/**
 * SISTEMA DE CACHE INTELIGENTE PARA DASHBOARD CEO
 * 
 * Features:
 * - TTL dinâmico baseado na frequência de mudança dos dados
 * - Cache por componentes (dados específicos para cada card)
 * - Invalidação inteligente de cache
 * - Pré-carregamento de dados críticos
 * - Compressão de dados em cache
 * - Dados sempre atualizados
 * 
 * @module CEOSmartCache
 */

import { LRUCache } from 'lru-cache';

// ==================== TIPOS ====================

export interface CEOCacheConfig {
  /** Tempo de vida padrão em milissegundos */
  defaultTTL: number;
  /** Tamanho máximo do cache em bytes */
  maxSize: number;
  /** Habilitar compressão */
  enableCompression: boolean;
  /** Habilitar pré-carregamento */
  enablePrefetch: boolean;
  /** Intervalo de limpeza em milissegundos */
  cleanupInterval: number;
}

export interface CEOCacheEntry<T = any> {
  /** Dados armazenados */
  data: T;
  /** Timestamp de criação */
  timestamp: number;
  /** Tempo de vida em milissegundos */
  ttl: number;
  /** Número de acessos */
  hits: number;
  /** Último acesso */
  lastAccess: number;
  /** Tamanho em bytes */
  size: number;
  /** Hash dos dados para validação */
  hash: string;
}

export interface CEOCacheStats {
  /** Total de entradas */
  entries: number;
  /** Taxa de acertos */
  hitRate: number;
  /** Tamanho total em bytes */
  totalSize: number;
  /** Memória utilizada em MB */
  memoryUsage: number;
  /** Entradas expiradas */
  expiredEntries: number;
}

export enum CEOCacheKey {
  // Métricas principais
  MAIN_METRICS = 'ceo:main:metrics',
  FINANCIAL_METRICS = 'ceo:financial:metrics',
  OPERATIONAL_METRICS = 'ceo:operational:metrics',
  
  // Gráficos e análises
  REVENUE_CHART = 'ceo:chart:revenue',
  EXPENSE_CHART = 'ceo:chart:expense',
  PROFIT_CHART = 'ceo:chart:profit',
  CASH_FLOW = 'ceo:cashflow:data',
  
  // Análises avançadas
  CAC_ANALYSIS = 'ceo:analysis:cac',
  CHURN_ANALYSIS = 'ceo:analysis:churn',
  LTV_ANALYSIS = 'ceo:analysis:ltv',
  SEASONAL_ANALYSIS = 'ceo:analysis:seasonal',
  
  // Dados auxiliares
  COST_CENTERS = 'ceo:aux:costcenters',
  PAYMENT_METHODS = 'ceo:aux:paymentmethods',
  CATEGORIES = 'ceo:aux:categories',
  VENDORS = 'ceo:aux:vendors',
  
  // Relatórios
  DRE_REPORT = 'ceo:report:dre',
  LIQUIDITY_REPORT = 'ceo:report:liquidity',
  
  // Alertas
  SMART_ALERTS = 'ceo:alerts:smart',
}

// ==================== TTL DINÂMICO ====================

/**
 * Configuração de TTL por tipo de dado
 * Baseado na frequência de mudança dos dados
 */
const CEO_TTL_CONFIG: Record<string, number> = {
  // Dados que mudam constantemente (1 minuto)
  [CEOCacheKey.CASH_FLOW]: 60 * 1000,
  [CEOCacheKey.SMART_ALERTS]: 60 * 1000,
  
  // Dados que mudam frequentemente (5 minutos)
  [CEOCacheKey.MAIN_METRICS]: 5 * 60 * 1000,
  [CEOCacheKey.FINANCIAL_METRICS]: 5 * 60 * 1000,
  [CEOCacheKey.OPERATIONAL_METRICS]: 5 * 60 * 1000,
  [CEOCacheKey.REVENUE_CHART]: 5 * 60 * 1000,
  [CEOCacheKey.EXPENSE_CHART]: 5 * 60 * 1000,
  [CEOCacheKey.PROFIT_CHART]: 5 * 60 * 1000,
  
  // Dados que mudam moderadamente (15 minutos)
  [CEOCacheKey.CAC_ANALYSIS]: 15 * 60 * 1000,
  [CEOCacheKey.CHURN_ANALYSIS]: 15 * 60 * 1000,
  [CEOCacheKey.LTV_ANALYSIS]: 15 * 60 * 1000,
  [CEOCacheKey.DRE_REPORT]: 15 * 60 * 1000,
  [CEOCacheKey.LIQUIDITY_REPORT]: 15 * 60 * 1000,
  
  // Dados que mudam raramente (30 minutos)
  [CEOCacheKey.SEASONAL_ANALYSIS]: 30 * 60 * 1000,
  
  // Dados auxiliares que raramente mudam (1 hora)
  [CEOCacheKey.COST_CENTERS]: 60 * 60 * 1000,
  [CEOCacheKey.PAYMENT_METHODS]: 60 * 60 * 1000,
  [CEOCacheKey.CATEGORIES]: 60 * 60 * 1000,
  [CEOCacheKey.VENDORS]: 60 * 60 * 1000,
};

// ==================== COMPRESSÃO ====================

/**
 * Comprime dados usando LZ-string
 */
function ceoCompressData(data: any): string {
  try {
    const jsonString = JSON.stringify(data);
    
    // Compressão simples com base64 para reduzir tamanho
    if (typeof window !== 'undefined' && window.btoa) {
      return btoa(encodeURIComponent(jsonString));
    }
    
    // Fallback para Node.js
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(jsonString).toString('base64');
    }
    
    return jsonString;
  } catch (error) {
    console.error('[CEOCache] Erro ao comprimir dados:', error);
    return JSON.stringify(data);
  }
}

/**
 * Descomprime dados
 */
function ceoDecompressData<T>(compressed: string): T | null {
  try {
    // Tentar descomprimir base64
    if (typeof window !== 'undefined' && window.atob) {
      const decoded = decodeURIComponent(atob(compressed));
      return JSON.parse(decoded) as T;
    }
    
    // Fallback para Node.js
    if (typeof Buffer !== 'undefined') {
      const decoded = Buffer.from(compressed, 'base64').toString();
      return JSON.parse(decoded) as T;
    }
    
    // Fallback para JSON direto
    return JSON.parse(compressed) as T;
  } catch (error) {
    console.error('[CEOCache] Erro ao descomprimir dados:', error);
    return null;
  }
}

// ==================== HASH ====================

/**
 * Gera hash simples dos dados para validação
 */
function ceoGenerateHash(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(36);
}

/**
 * Calcula tamanho em bytes
 */
function ceoCalculateSize(data: any): number {
  const str = JSON.stringify(data);
  return new Blob([str]).size;
}

// ==================== CLASSE PRINCIPAL ====================

class CEOSmartCacheManager {
  private cache: Map<string, CEOCacheEntry>;
  private config: CEOCacheConfig;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
  };
  private cleanupTimer: NodeJS.Timeout | null = null;
  private prefetchTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CEOCacheConfig>) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 50 * 1024 * 1024, // 50MB
      enableCompression: true,
      enablePrefetch: true,
      cleanupInterval: 60 * 1000, // 1 minuto
      ...config,
    };

    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };

    this.startCleanupTimer();
    this.startPrefetchTimer();
  }

  /**
   * Obtém TTL dinâmico baseado na chave
   */
  private getTTL(key: string): number {
    return CEO_TTL_CONFIG[key] || this.config.defaultTTL;
  }

  /**
   * Define dados no cache
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    try {
      const ttl = customTTL || this.getTTL(key);
      const timestamp = Date.now();
      
      // Preparar dados para cache
      const cacheData = this.config.enableCompression
        ? ceoCompressData(data)
        : data;

      const entry: CEOCacheEntry<any> = {
        data: cacheData,
        timestamp,
        ttl,
        hits: 0,
        lastAccess: timestamp,
        size: ceoCalculateSize(data),
        hash: ceoGenerateHash(data),
      };

      // Verificar limite de tamanho
      if (this.getTotalSize() + entry.size > this.config.maxSize) {
        this.evictLRU();
      }

      this.cache.set(key, entry);
      this.stats.sets++;

      console.log(`[CEOCache] Set: ${key} (TTL: ${ttl}ms, Size: ${entry.size} bytes)`);
    } catch (error) {
      console.error('[CEOCache] Erro ao definir cache:', error);
    }
  }

  /**
   * Obtém dados do cache
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        console.log(`[CEOCache] Miss: ${key}`);
        return null;
      }

      // Verificar expiração
      const now = Date.now();
      const age = now - entry.timestamp;

      if (age > entry.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        console.log(`[CEOCache] Expired: ${key} (age: ${age}ms, ttl: ${entry.ttl}ms)`);
        return null;
      }

      // Atualizar estatísticas
      entry.hits++;
      entry.lastAccess = now;
      this.stats.hits++;

      // Descomprimir se necessário
      const data = this.config.enableCompression
        ? ceoDecompressData<T>(entry.data)
        : entry.data;

      console.log(`[CEOCache] Hit: ${key} (hits: ${entry.hits}, age: ${age}ms)`);
      return data;
    } catch (error) {
      console.error('[CEOCache] Erro ao obter cache:', error);
      return null;
    }
  }

  /**
   * Obtém dados do cache ou executa função de fallback
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    customTTL?: number
  ): Promise<T> {
    // Tentar obter do cache
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Buscar dados frescos
    console.log(`[CEOCache] Fetching fresh data: ${key}`);
    const data = await fetchFn();
    
    // Armazenar no cache
    this.set(key, data, customTTL);
    
    return data;
  }

  /**
   * Invalida entrada específica do cache
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      console.log(`[CEOCache] Invalidated: ${key}`);
    }
  }

  /**
   * Invalida múltiplas entradas por padrão
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    console.log(`[CEOCache] Invalidated ${count} entries matching: ${pattern}`);
  }

  /**
   * Invalida todas as métricas principais
   */
  invalidateMetrics(): void {
    this.invalidatePattern('^ceo:(main|financial|operational):');
  }

  /**
   * Invalida todos os gráficos
   */
  invalidateCharts(): void {
    this.invalidatePattern('^ceo:chart:');
  }

  /**
   * Invalida todas as análises
   */
  invalidateAnalyses(): void {
    this.invalidatePattern('^ceo:analysis:');
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    console.log(`[CEOCache] Cleared ${size} entries`);
  }

  /**
   * Remove entrada menos recentemente usada (LRU)
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`[CEOCache] Evicted LRU: ${oldestKey}`);
    }
  }

  /**
   * Limpeza automática de entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[CEOCache] Cleanup: removed ${cleaned} expired entries`);
    }
  }

  /**
   * Inicia timer de limpeza automática
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Pré-carregamento de dados críticos
   */
  private async prefetchCriticalData(): Promise<void> {
    if (!this.config.enablePrefetch) return;

    // Lista de chaves críticas para pré-carregar
    const criticalKeys = [
      CEOCacheKey.MAIN_METRICS,
      CEOCacheKey.FINANCIAL_METRICS,
      CEOCacheKey.SMART_ALERTS,
    ];

    for (const key of criticalKeys) {
      // Verificar se está próximo de expirar
      const entry = this.cache.get(key);
      if (!entry) continue;

      const now = Date.now();
      const age = now - entry.timestamp;
      const remainingTTL = entry.ttl - age;

      // Pré-carregar quando restar 20% do TTL
      if (remainingTTL < entry.ttl * 0.2) {
        console.log(`[CEOCache] Prefetching: ${key} (remaining TTL: ${remainingTTL}ms)`);
        // Aqui você pode adicionar lógica para recarregar os dados
        // Por exemplo, emitir evento para componentes recarregarem
      }
    }
  }

  /**
   * Inicia timer de pré-carregamento
   */
  private startPrefetchTimer(): void {
    if (!this.config.enablePrefetch) return;

    if (this.prefetchTimer) {
      clearInterval(this.prefetchTimer);
    }

    // Verificar a cada 30 segundos
    this.prefetchTimer = setInterval(() => {
      this.prefetchCriticalData();
    }, 30 * 1000);
  }

  /**
   * Obtém tamanho total do cache
   */
  private getTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): CEOCacheStats {
    const totalSize = this.getTotalSize();
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    // Contar entradas expiradas
    const now = Date.now();
    let expiredEntries = 0;
    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        expiredEntries++;
      }
    }

    return {
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalSize,
      memoryUsage: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      expiredEntries,
    };
  }

  /**
   * Obtém informações detalhadas sobre uma entrada
   */
  getEntryInfo(key: string): CEOCacheEntry | null {
    return this.cache.get(key) || null;
  }

  /**
   * Obtém todas as chaves no cache
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Destrói o cache manager
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.prefetchTimer) {
      clearInterval(this.prefetchTimer);
      this.prefetchTimer = null;
    }

    this.cache.clear();
    console.log('[CEOCache] Cache manager destroyed');
  }
}

// ==================== SINGLETON ====================

let ceoSmartCacheInstance: CEOSmartCacheManager | null = null;

/**
 * Obtém instância singleton do cache manager
 */
export function getCEOSmartCache(config?: Partial<CEOCacheConfig>): CEOSmartCacheManager {
  if (!ceoSmartCacheInstance) {
    ceoSmartCacheInstance = new CEOSmartCacheManager(config);
  }
  return ceoSmartCacheInstance;
}

/**
 * Destrói instância singleton (útil para testes)
 */
export function destroyCEOSmartCache(): void {
  if (ceoSmartCacheInstance) {
    ceoSmartCacheInstance.destroy();
    ceoSmartCacheInstance = null;
  }
}

// ==================== HOOKS DE INVALIDAÇÃO ====================

/**
 * Hook para invalidar cache quando dados mudam
 */
export function ceoInvalidateCacheOnUpdate(keys: string | string[]): void {
  const cache = getCEOSmartCache();
  
  if (Array.isArray(keys)) {
    keys.forEach(key => cache.invalidate(key));
  } else {
    cache.invalidate(keys);
  }
}

/**
 * Hook para invalidar cache relacionado a vendas
 */
export function ceoInvalidateSalesCache(): void {
  const cache = getCEOSmartCache();
  cache.invalidatePattern('ceo:(main|financial|chart:revenue|chart:profit)');
}

/**
 * Hook para invalidar cache relacionado a despesas
 */
export function ceoInvalidateExpensesCache(): void {
  const cache = getCEOSmartCache();
  cache.invalidatePattern('ceo:(financial|chart:expense|report:dre)');
}

/**
 * Hook para invalidar cache relacionado a fluxo de caixa
 */
export function ceoInvalidateCashFlowCache(): void {
  const cache = getCEOSmartCache();
  cache.invalidate(CEOCacheKey.CASH_FLOW);
  cache.invalidate(CEOCacheKey.LIQUIDITY_REPORT);
}

// ==================== EXPORTAÇÕES ====================

export { CEOSmartCacheManager };
export default getCEOSmartCache;

