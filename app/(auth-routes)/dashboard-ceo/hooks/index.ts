/**
 * EXPORTAÇÕES CENTRALIZADAS DOS HOOKS CEO
 * 
 * Facilita importações dos hooks isolados da Dashboard CEO
 * 
 * @module CEOHooks
 */

// ==================== HOOKS DE CACHE ====================
export {
  useCEOSmartCache,
  useCEOCacheStats,
  useCEOCacheInvalidation,
  useCEOCachePrefetch,
  useCEOCacheSync,
} from './useCEOSmartCache';

export type {
  UseCEOCacheOptions,
  UseCEOCacheResult,
} from './useCEOSmartCache';

// ==================== EXPORTAÇÃO DEFAULT ====================
export { default } from './useCEOSmartCache';

