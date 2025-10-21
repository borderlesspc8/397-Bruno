/**
 * EXPORTAÇÕES CENTRALIZADAS DOS SERVIÇOS CEO
 * 
 * Facilita importações dos serviços isolados da Dashboard CEO
 * 
 * @module CEOServices
 */

// ==================== CACHE INTELIGENTE ====================
export {
  getCEOSmartCache,
  destroyCEOSmartCache,
  CEOSmartCacheManager,
  CEOCacheKey,
  ceoInvalidateCacheOnUpdate,
  ceoInvalidateSalesCache,
  ceoInvalidateExpensesCache,
  ceoInvalidateCashFlowCache,
} from './smart-cache';

export type {
  CEOCacheConfig,
  CEOCacheEntry,
  CEOCacheStats,
} from './smart-cache';

// ==================== INTEGRAÇÃO DE CACHE COM APIs ====================
export {
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
} from './api-cache-integration';

// ==================== EXPORTAÇÃO DEFAULT ====================
export { default } from './smart-cache';
