/**
 * 🔄 CEO DASHBOARD - CACHE SERVICE
 * 
 * Sistema de cache COMPLETAMENTE ISOLADO para o Dashboard CEO
 * ⚠️ NÃO compartilha cache com outros dashboards
 * ⚠️ Prefixo obrigatório: "ceo-dashboard:"
 */

// ============================================================================
// CONFIGURAÇÕES DE CACHE
// ============================================================================

const CACHE_PREFIX = 'ceo-dashboard:'; // Prefixo OBRIGATÓRIO para isolamento

const CACHE_DURATIONS = {
  // Dados principais
  dashboard_completo: 5 * 60 * 1000,      // 5 minutos
  indicadores_financeiros: 10 * 60 * 1000, // 10 minutos
  indicadores_crescimento: 10 * 60 * 1000, // 10 minutos
  sazonalidade: 30 * 60 * 1000,           // 30 minutos
  dre: 15 * 60 * 1000,                    // 15 minutos
  metas: 5 * 60 * 1000,                   // 5 minutos
  
  // Dados detalhados
  aging_recebiveis: 15 * 60 * 1000,       // 15 minutos
  inadimplencia: 15 * 60 * 1000,          // 15 minutos
  liquidez: 30 * 60 * 1000,               // 30 minutos
  
  // Listas e relatórios
  lista_metas: 5 * 60 * 1000,             // 5 minutos
  evolucao_metas: 10 * 60 * 1000,         // 10 minutos
  heatmap_metas: 15 * 60 * 1000,          // 15 minutos
  
  // Padrão
  default: 10 * 60 * 1000,                // 10 minutos
} as const;

// ============================================================================
// TIPOS
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

interface CacheStats {
  totalKeys: number;
  totalSize: number;
  hits: number;
  misses: number;
  hitRate: number;
}

type CacheKey = keyof typeof CACHE_DURATIONS;

// ============================================================================
// CLASSE DO SERVICE
// ============================================================================

class CEOCacheService {
  private cache: Map<string, CacheEntry<any>>;
  private stats: {
    hits: number;
    misses: number;
  };
  
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
    };
    
    // Inicializar com log
    console.log('[CEOCache] ✅ Cache isolado inicializado com prefixo:', CACHE_PREFIX);
  }
  
  // ==========================================================================
  // MÉTODOS PRINCIPAIS
  // ==========================================================================
  
  /**
   * Gera chave de cache com prefixo isolado
   */
  private generateKey(tipo: CacheKey | string, params?: Record<string, any>): string {
    let key = `${CACHE_PREFIX}${tipo}`;
    
    if (params) {
      // Ordenar chaves para consistência
      const sortedKeys = Object.keys(params).sort();
      const paramsString = sortedKeys
        .map(k => `${k}=${JSON.stringify(params[k])}`)
        .join('&');
      
      key += `:${paramsString}`;
    }
    
    return key;
  }
  
  /**
   * Obtém duração do cache para um tipo
   */
  private getDuration(tipo: CacheKey | string): number {
    return CACHE_DURATIONS[tipo as CacheKey] || CACHE_DURATIONS.default;
  }
  
  /**
   * Salva dados no cache
   */
  set<T>(tipo: CacheKey | string, data: T, params?: Record<string, any>): void {
    const key = this.generateKey(tipo, params);
    const duration = this.getDuration(tipo);
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + duration,
      key,
    };
    
    this.cache.set(key, entry);
    
    console.log(`[CEOCache] ✅ Dados salvos em cache: ${key}`, {
      expiraEm: `${duration / 1000}s`,
      tamanho: JSON.stringify(data).length,
    });
  }
  
  /**
   * Obtém dados do cache
   */
  get<T>(tipo: CacheKey | string, params?: Record<string, any>): T | null {
    const key = this.generateKey(tipo, params);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      this.stats.misses++;
      console.log(`[CEOCache] ❌ Cache miss: ${key}`);
      return null;
    }
    
    const now = Date.now();
    
    // Verificar se expirou
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`[CEOCache] ⏰ Cache expirado: ${key}`);
      return null;
    }
    
    this.stats.hits++;
    console.log(`[CEOCache] ✅ Cache hit: ${key}`, {
      idade: `${Math.floor((now - entry.timestamp) / 1000)}s`,
      expiraEm: `${Math.floor((entry.expiresAt - now) / 1000)}s`,
    });
    
    return entry.data;
  }
  
  /**
   * Verifica se existe cache válido
   */
  has(tipo: CacheKey | string, params?: Record<string, any>): boolean {
    const data = this.get(tipo, params);
    return data !== null;
  }
  
  /**
   * Deleta entrada específica do cache
   */
  delete(tipo: CacheKey | string, params?: Record<string, any>): boolean {
    const key = this.generateKey(tipo, params);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      console.log(`[CEOCache] 🗑️ Cache deletado: ${key}`);
    }
    
    return deleted;
  }
  
  /**
   * Limpa cache por tipo (todas as variações de params)
   */
  clearByType(tipo: CacheKey | string): number {
    const prefix = `${CACHE_PREFIX}${tipo}`;
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`[CEOCache] 🗑️ Limpeza por tipo: ${tipo} (${count} entradas)`);
    }
    
    return count;
  }
  
  /**
   * Limpa cache por userId
   */
  clearByUserId(userId: string): number {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Verificar se a entrada contém userId nos params
      if (key.includes(`userId="${userId}"`)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`[CEOCache] 🗑️ Limpeza por userId: ${userId} (${count} entradas)`);
    }
    
    return count;
  }
  
  /**
   * Limpa todo o cache do CEO Dashboard
   */
  clearAll(): void {
    const count = this.cache.size;
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    
    console.log(`[CEOCache] 🗑️ Cache limpo completamente (${count} entradas)`);
  }
  
  /**
   * Remove entradas expiradas
   */
  prune(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      console.log(`[CEOCache] 🧹 Limpeza de expirados (${count} entradas)`);
    }
    
    return count;
  }
  
  // ==========================================================================
  // MÉTODOS DE UTILIDADE
  // ==========================================================================
  
  /**
   * Obtém estatísticas do cache
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 
      ? (this.stats.hits / totalRequests) * 100 
      : 0;
    
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += JSON.stringify(entry.data).length;
    }
    
    return {
      totalKeys: this.cache.size,
      totalSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
  
  /**
   * Lista todas as chaves do cache
   */
  listKeys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Obtém informações detalhadas de uma entrada
   */
  getEntryInfo(tipo: CacheKey | string, params?: Record<string, any>): {
    exists: boolean;
    expired: boolean;
    age?: number;
    expiresIn?: number;
    size?: number;
  } {
    const key = this.generateKey(tipo, params);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return { exists: false, expired: false };
    }
    
    const now = Date.now();
    const expired = now > entry.expiresAt;
    const age = now - entry.timestamp;
    const expiresIn = entry.expiresAt - now;
    const size = JSON.stringify(entry.data).length;
    
    return {
      exists: true,
      expired,
      age,
      expiresIn: expiresIn > 0 ? expiresIn : 0,
      size,
    };
  }
  
  /**
   * Força atualização (bypass cache)
   */
  async getOrFetch<T>(
    tipo: CacheKey | string,
    params: Record<string, any> | undefined,
    fetchFn: () => Promise<T>,
    forceUpdate: boolean = false
  ): Promise<T> {
    // Se forceUpdate, não usar cache
    if (!forceUpdate) {
      const cached = this.get<T>(tipo, params);
      if (cached !== null) {
        return cached;
      }
    }
    
    // Buscar dados
    console.log(`[CEOCache] 🔄 Buscando dados frescos: ${tipo}`);
    const data = await fetchFn();
    
    // Salvar no cache
    this.set(tipo, data, params);
    
    return data;
  }
  
  /**
   * Invalida cache relacionado a uma operação
   */
  invalidateRelated(tipo: CacheKey | string): void {
    // Mapear tipos relacionados que devem ser invalidados juntos
    const relatedTypes: Record<string, string[]> = {
      'metas': [
        'lista_metas',
        'evolucao_metas',
        'heatmap_metas',
        'dashboard_completo',
      ],
      'vendas': [
        'dashboard_completo',
        'indicadores_financeiros',
        'indicadores_crescimento',
        'sazonalidade',
        'dre',
      ],
    };
    
    const related = relatedTypes[tipo] || [];
    
    let totalCleared = 0;
    for (const relatedType of related) {
      totalCleared += this.clearByType(relatedType);
    }
    
    if (totalCleared > 0) {
      console.log(`[CEOCache] 🔄 Invalidação em cascata: ${tipo} (${totalCleared} entradas)`);
    }
  }
  
  /**
   * Verificar saúde do cache
   */
  healthCheck(): {
    healthy: boolean;
    issues: string[];
    stats: CacheStats;
  } {
    const issues: string[] = [];
    const stats = this.getStats();
    
    // Verificar se há muitas entradas
    if (stats.totalKeys > 1000) {
      issues.push(`Muitas entradas em cache (${stats.totalKeys})`);
    }
    
    // Verificar tamanho total
    const sizeMB = stats.totalSize / (1024 * 1024);
    if (sizeMB > 50) {
      issues.push(`Cache muito grande (${sizeMB.toFixed(2)}MB)`);
    }
    
    // Verificar hit rate
    if (stats.hitRate < 50 && stats.hits + stats.misses > 100) {
      issues.push(`Hit rate baixo (${stats.hitRate}%)`);
    }
    
    // Fazer limpeza de expirados
    const pruned = this.prune();
    if (pruned > 0) {
      issues.push(`${pruned} entradas expiradas foram removidas`);
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      stats,
    };
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const ceoCacheService = new CEOCacheService();

// Log inicial
console.log('[CEOCache] 🚀 CEO Cache Service carregado');

// Executar prune periódico (a cada 5 minutos)
if (typeof window !== 'undefined') {
  setInterval(() => {
    ceoCacheService.prune();
  }, 5 * 60 * 1000);
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default ceoCacheService;

// ============================================================================
// TIPOS EXPORTADOS
// ============================================================================

export type { CacheKey, CacheStats };


