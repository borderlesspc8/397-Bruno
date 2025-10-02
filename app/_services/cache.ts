import { LRUCache } from 'lru-cache';

// Tipo para armazenar promessas em andamento
type PromiseCache = Map<string, Promise<any>>;

// Interface para registros de métricas de cache
interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  lastAccessed: number;
}

// Configuração do cache LRU com TTL (time-to-live)
const cacheOptions = {
  max: 100, // número máximo de itens no cache
  ttl: 1000 * 60 * 5, // 5 minutos (padrão)
  allowStale: false,
  updateAgeOnGet: true,
  // Necessário definir maxSize quando sizeCalculation é usado
  maxSize: 5000, // limite total do tamanho do cache
  // Calcular o tamanho dos itens para evitar memory leaks
  sizeCalculation: (value: any) => {
    // Estimar o tamanho do valor baseado no tipo
    if (typeof value === 'string') {
      return value.length;
    } else if (Array.isArray(value)) {
      return value.length;
    } else if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length;
    }
    return 1;
  },
};

// Cache para armazenar dados
export const dataCache = new LRUCache<string, any>(cacheOptions);

// Cache para armazenar promessas em andamento (deduplicação de requisições)
export const promiseCache: PromiseCache = new Map();

// Cache de métricas para otimização
export const metricsCache = new Map<string, CacheMetrics>();

// Prefixos de cache para diferentes tipos de dados
export const CachePrefix = {
  DASHBOARD: 'dashboard:',
  VENDAS: 'vendas:',
  VENDEDORES: 'vendedores:',
  PRODUTOS: 'produtos:',
  API: 'api:',
};

// TTLs específicos por tipo de dado
const cacheTTLByPrefix = {
  [CachePrefix.DASHBOARD]: 1000 * 60 * 5, // 5 minutos
  [CachePrefix.VENDAS]: 1000 * 60 * 10, // 10 minutos
  [CachePrefix.VENDEDORES]: 1000 * 60 * 15, // 15 minutos
  [CachePrefix.PRODUTOS]: 1000 * 60 * 30, // 30 minutos
  [CachePrefix.API]: 1000 * 60 * 60, // 60 minutos
};

/**
 * Determina o TTL adequado com base no prefixo da chave
 */
function getTTLByKeyPrefix(key: string, defaultTTL: number = cacheOptions.ttl): number {
  // Verifica se a chave corresponde a algum prefixo conhecido
  for (const [prefix, ttl] of Object.entries(cacheTTLByPrefix)) {
    if (key.startsWith(prefix)) {
      return ttl;
    }
  }
  return defaultTTL;
}

/**
 * Atualiza as métricas de cache para uma chave
 */
function updateMetrics(key: string, hit: boolean): void {
  if (!metricsCache.has(key)) {
    metricsCache.set(key, {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      lastAccessed: Date.now()
    });
  }
  
  const metrics = metricsCache.get(key)!;
  metrics.totalRequests++;
  hit ? metrics.hits++ : metrics.misses++;
  metrics.lastAccessed = Date.now();
}

/**
 * Obtém dados do cache ou busca se não existir
 * @param key Chave única para o cache
 * @param fetchFunction Função que retorna uma Promise com os dados
 * @returns Dados do cache ou da função de busca
 */
export async function getCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  cacheTTLOverride?: number,
  forceUpdate?: boolean
): Promise<T> {
  // Se forceUpdate for true, ignorar o cache e buscar os dados novamente
  if (forceUpdate) {
    console.log(`[CACHE] Ignorando cache para: ${key} (forceUpdate: true)`);
    updateMetrics(key, false);
    
    // Buscar os dados diretamente
    const data = await fetchFunction();
    
    // Atualizar o cache com os novos dados
    const effectiveTTL = cacheTTLOverride || getTTLByKeyPrefix(key);
    dataCache.set(key, data, { ttl: effectiveTTL });
    
    // Adicionar timestamp
    if (typeof data === 'object' && data !== null) {
      try {
        (data as any)._cacheTimestamp = Date.now();
      } catch (e) {
        // Ignorar erros ao adicionar metadados
      }
    }
    
    return data;
  }
  
  // Verificar se os dados já estão no cache
  const cachedData = dataCache.get(key) as T | undefined;
  if (cachedData) {
    console.log(`[CACHE] Usando dados em cache para: ${key}`);
    updateMetrics(key, true);
    return cachedData;
  }

  // Verificar se já existe uma promessa em andamento para esta chave
  if (promiseCache.has(key)) {
    console.log(`[CACHE] Reutilizando promessa existente para: ${key}`);
    return promiseCache.get(key) as Promise<T>;
  }

  // Registrar o miss de cache para métricas
  updateMetrics(key, false);
  console.log(`[CACHE] Buscando dados para: ${key} (fonte: api)`);

  // Determinar o TTL adequado para esta chave
  const effectiveTTL = cacheTTLOverride || getTTLByKeyPrefix(key);

  // Criar uma nova promessa com timeout para evitar promessas pendentes infinitas
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      promiseCache.delete(key);
      reject(new Error(`Timeout ao buscar dados para: ${key}`));
    }, 15000); // 15 segundos de timeout
  });

  // Criar uma nova promessa e armazená-la no cache de promessas
  const dataPromise = fetchFunction()
    .then((data) => {
      // Limpar o timeout quando a promessa for resolvida
      clearTimeout(timeoutId);
      
      // Armazenar no cache com TTL apropriado
      dataCache.set(key, data, { ttl: effectiveTTL });
      
      // Registrar timestamp da atualização nos dados
      if (typeof data === 'object' && data !== null) {
        try {
          (data as any)._cacheTimestamp = Date.now();
        } catch (e) {
          // Ignorar erros ao adicionar metadados (objeto imutável, etc.)
        }
      }
      
      // Remover do cache de promessas quando concluído
      promiseCache.delete(key);
      return data;
    })
    .catch((error) => {
      // Limpar o timeout em caso de erro
      clearTimeout(timeoutId);
      
      // Remover do cache de promessas em caso de erro
      promiseCache.delete(key);
      console.error(`[CACHE] Erro ao buscar dados para: ${key}`, error);
      throw error;
    });

  // Usar Promise.race para implementar o timeout
  const promise = Promise.race([dataPromise, timeoutPromise]) as Promise<T>;
  
  // Armazenar a promessa no cache
  promiseCache.set(key, promise);
  
  // Retornar a promessa
  return promise;
}

/**
 * Pré-carrega dados no cache
 * Útil para dados que serão necessários em breve
 */
export function preloadCache<T>(key: string, fetchFunction: () => Promise<T>, priority: 'high' | 'low' = 'low'): void {
  // Se já estiver no cache ou com promessa em andamento, não fazer nada
  if (dataCache.has(key) || promiseCache.has(key)) {
    return;
  }
  
  // Para prioridade alta, carregar imediatamente
  if (priority === 'high') {
    getCachedData(key, fetchFunction).catch(e => {
      console.warn(`[CACHE] Erro no pré-carregamento de alta prioridade para: ${key}`, e);
    });
    return;
  }
  
  // Para prioridade baixa, usar requestIdleCallback ou setTimeout
  const schedulePreload = () => {
    getCachedData(key, fetchFunction).catch(e => {
      console.warn(`[CACHE] Erro no pré-carregamento de baixa prioridade para: ${key}`, e);
    });
  };
  
  // Usar requestIdleCallback se disponível, ou setTimeout como fallback
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(schedulePreload);
  } else {
    setTimeout(schedulePreload, 1000); // 1 segundo de delay
  }
}

/**
 * Invalida uma entrada específica do cache
 * @param key Chave do cache a ser invalidada
 */
export function invalidateCache(key: string): void {
  dataCache.delete(key);
}

/**
 * Invalida todas as entradas que começam com um prefixo
 * @param prefix Prefixo das chaves a serem invalidadas
 * @returns Número de chaves invalidadas
 */
export function invalidateCacheByPrefix(prefix: string): number {
  let count = 0;
  // Usar Array.from para evitar erro de iteração do Generator
  const allKeys = Array.from(dataCache.keys());
  for (const key of allKeys) {
    if (key.startsWith(prefix)) {
      dataCache.delete(key);
      count++;
    }
  }
  return count;
}

/**
 * Limpa todo o cache
 */
export function clearCache(): void {
  dataCache.clear();
  metricsCache.clear();
  // Não limpamos o promiseCache para evitar problemas com promessas em andamento
}

/**
 * Obtém todas as chaves no cache atual
 * @returns Array com as chaves presentes no cache
 */
export function getCacheKeys(): string[] {
  return Array.from(dataCache.keys()) as string[];
}

/**
 * Obtém estatísticas do cache
 * @returns Objeto com estatísticas do cache
 */
export function getCacheStats(): {
  size: number,
  maxSize: number,
  hitRate: number,
  topRequested: Array<{key: string, metrics: CacheMetrics}>
} {
  // Calcular taxa de acertos
  let totalHits = 0;
  let totalRequests = 0;
  
  // Usar Array.from para evitar erro de iteração em MapIterator
  const allMetrics = Array.from(metricsCache.values());
  for (const metrics of allMetrics) {
    totalHits += metrics.hits;
    totalRequests += metrics.totalRequests;
  }
  
  const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  
  // Obter as 5 chaves mais solicitadas
  const topRequested = Array.from(metricsCache.entries())
    .sort((a, b) => b[1].totalRequests - a[1].totalRequests)
    .slice(0, 5)
    .map(([key, metrics]) => ({ key, metrics }));
  
  return {
    size: dataCache.size,
    maxSize: cacheOptions.max,
    hitRate,
    topRequested
  };
}

/**
 * Verifica se uma chave existe no cache
 * @param key Chave a ser verificada
 * @returns Verdadeiro se a chave existir no cache
 */
export function hasCacheKey(key: string): boolean {
  return dataCache.has(key);
} 