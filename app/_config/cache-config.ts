/**
 * Configurações centralizadas de cache para dashboards
 * 
 * Este arquivo define as configurações de cache para diferentes tipos de dados
 * do sistema, permitindo controle centralizado e otimização de performance.
 */

export interface CacheConfig {
  ttl: number; // Time to live em milissegundos
  maxSize: number; // Tamanho máximo do cache
  enabled: boolean; // Se o cache está habilitado
}

export const CACHE_CONFIGS = {
  // Cache para dados de vendas (mais crítico - dados mais frescos)
  VENDAS: {
    ttl: 2 * 60 * 1000, // 2 minutos
    maxSize: 100,
    enabled: true
  } as CacheConfig,

  // Cache para dados de vendedores (menos crítico - pode ser mais longo)
  VENDEDORES: {
    ttl: 5 * 60 * 1000, // 5 minutos
    maxSize: 50,
    enabled: true
  } as CacheConfig,

  // Cache para dados de atendimentos (médio crítico)
  ATENDIMENTOS: {
    ttl: 3 * 60 * 1000, // 3 minutos
    maxSize: 75,
    enabled: true
  } as CacheConfig,

  // Cache para dados de consultores (menos crítico)
  CONSULTORES: {
    ttl: 10 * 60 * 1000, // 10 minutos
    maxSize: 25,
    enabled: true
  } as CacheConfig,

  // Cache para dados de metas (pouco crítico - pode ser mais longo)
  METAS: {
    ttl: 30 * 60 * 1000, // 30 minutos
    maxSize: 20,
    enabled: true
  } as CacheConfig,

  // Cache para dados de produtos (médio crítico)
  PRODUTOS: {
    ttl: 5 * 60 * 1000, // 5 minutos
    maxSize: 100,
    enabled: true
  } as CacheConfig
} as const;

/**
 * Função para obter configuração de cache por tipo
 */
export function getCacheConfig(type: keyof typeof CACHE_CONFIGS): CacheConfig {
  return CACHE_CONFIGS[type];
}

/**
 * Função para verificar se um cache está expirado
 */
export function isCacheExpired(timestamp: number, cacheType: keyof typeof CACHE_CONFIGS): boolean {
  const config = getCacheConfig(cacheType);
  if (!config.enabled) return true;
  
  const cacheAge = Date.now() - timestamp;
  return cacheAge > config.ttl;
}

/**
 * Função para limpar cache expirado
 */
export function cleanupExpiredCache<T>(
  cache: Map<string, { timestamp: number, data: T }>,
  cacheType: keyof typeof CACHE_CONFIGS
): void {
  const config = getCacheConfig(cacheType);
  if (!config.enabled) return;

  for (const [key, value] of cache.entries()) {
    if (isCacheExpired(value.timestamp, cacheType)) {
      cache.delete(key);
    }
  }
}

/**
 * Função para verificar se o cache está no limite de tamanho
 */
export function isCacheAtLimit(
  cache: Map<string, any>,
  cacheType: keyof typeof CACHE_CONFIGS
): boolean {
  const config = getCacheConfig(cacheType);
  return cache.size >= config.maxSize;
}

/**
 * Função para limpar cache mais antigo quando atingir limite
 */
export function evictOldestCache<T>(
  cache: Map<string, { timestamp: number, data: T }>,
  cacheType: keyof typeof CACHE_CONFIGS
): void {
  const config = getCacheConfig(cacheType);
  if (cache.size < config.maxSize) return;

  // Encontrar e remover o item mais antigo
  let oldestKey = '';
  let oldestTimestamp = Date.now();

  for (const [key, value] of cache.entries()) {
    if (value.timestamp < oldestTimestamp) {
      oldestTimestamp = value.timestamp;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    cache.delete(oldestKey);
  }
}
