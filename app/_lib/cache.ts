/**
 * Serviço de cache para otimizar o carregamento da aplicação
 * Implementa estratégias de caching para diferentes tipos de dados
 */

// Tempo de expiração do cache em milissegundos
const DEFAULT_CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutos
const API_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos
const MOCK_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hora (dados mockados podem ser cacheados por mais tempo)

// Tipo para armazenar dados no cache
type CacheItem<T> = {
  data: T;
  timestamp: number;
  key: string;
  source: 'api' | 'mock' | 'other';
};

// Classe para gerenciar o cache da aplicação
class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private fetchingPromises: Map<string, Promise<any>> = new Map();
  
  /**
   * Obtém um item do cache ou busca-o utilizando a função fornecida
   * 
   * @param key Chave única para o item
   * @param fetchFn Função para buscar o item caso não esteja em cache ou tenha expirado
   * @param options Opções de cache (expiração, fonte dos dados, etc)
   * @returns O item do cache ou o resultado da função de busca
   */
  async get<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options: { 
      expiry?: number; 
      source?: 'api' | 'mock' | 'other';
      forceRefresh?: boolean;
    } = {}
  ): Promise<T> {
    // Definir opções com valores padrão
    const { 
      expiry = this.getExpiryTime(options.source || 'other'),
      source = 'other',
      forceRefresh = false
    } = options;
    
    // Verificar cache se não estiver forçando atualização
    if (!forceRefresh) {
      const cachedItem = this.cache.get(key);
      const now = Date.now();
      
      // Se o item estiver em cache e não tiver expirado
      if (cachedItem && (now - cachedItem.timestamp < expiry)) {
        console.log(`[CACHE] Usando dados em cache para: ${key}`);
        return cachedItem.data;
      }
    }
    
    // Verificar se já existe uma busca em andamento para esta chave
    if (this.fetchingPromises.has(key)) {
      console.log(`[CACHE] Reutilizando promessa existente para: ${key}`);
      return this.fetchingPromises.get(key)!;
    }
    
    // Criar e armazenar a promessa de busca
    console.log(`[CACHE] Buscando dados para: ${key} (fonte: ${source})`);
    const fetchPromise = fetchFn().then(data => {
      // Armazenar o resultado no cache
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        key,
        source
      });
      
      // Remover a promessa do mapa de promessas em andamento
      this.fetchingPromises.delete(key);
      
      return data;
    }).catch(error => {
      // Em caso de erro, remover a promessa para permitir novas tentativas
      this.fetchingPromises.delete(key);
      throw error;
    });
    
    // Armazenar a promessa para evitar requisições duplicadas
    this.fetchingPromises.set(key, fetchPromise);
    
    return fetchPromise;
  }
  
  /**
   * Invalida um item específico do cache ou todos os itens com base em um prefixo
   * 
   * @param keyOrPrefix Chave exata ou prefixo para invalidar múltiplos itens
   * @param isPrefix Se verdadeiro, invalida todos os itens cujas chaves começam com keyOrPrefix
   */
  invalidate(keyOrPrefix: string, isPrefix = false): void {
    if (isPrefix) {
      // Invalidar todas as chaves que começam com o prefixo fornecido
      // Convertendo para array antes de iterar para evitar problema com MapIterator
      const keys = Array.from(this.cache.keys());
      keys.forEach(key => {
        if (key.startsWith(keyOrPrefix)) {
          console.log(`[CACHE] Invalidando item: ${key}`);
          this.cache.delete(key);
        }
      });
    } else {
      // Invalidar apenas a chave exata
      console.log(`[CACHE] Invalidando item: ${keyOrPrefix}`);
      this.cache.delete(keyOrPrefix);
    }
  }
  
  /**
   * Limpa todo o cache
   */
  clear(): void {
    console.log(`[CACHE] Limpando todo o cache (${this.cache.size} itens)`);
    this.cache.clear();
  }
  
  /**
   * Obtém informações sobre o cache atual
   * Útil para debugging
   */
  getStats(): { size: number; keys: string[]; itemAges: { key: string; age: number }[] } {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    const itemAges = Array.from(this.cache.entries()).map(([key, item]) => ({
      key,
      age: now - item.timestamp
    }));
    
    return {
      size: this.cache.size,
      keys,
      itemAges
    };
  }
  
  /**
   * Retorna o tempo de expiração adequado com base na fonte dos dados
   */
  private getExpiryTime(source: 'api' | 'mock' | 'other'): number {
    switch (source) {
      case 'api':
        return API_CACHE_EXPIRY;
      case 'mock':
        return MOCK_CACHE_EXPIRY;
      case 'other':
      default:
        return DEFAULT_CACHE_EXPIRY;
    }
  }
}

// Exportar uma instância singleton do serviço de cache
export const cacheService = new CacheService(); 