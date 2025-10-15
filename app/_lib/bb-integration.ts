// Este arquivo está sendo substituído pela nova estrutura modular em /app/_lib/bb-integration/

import { BBIntegrationService, bbService } from './bb-integration/index';

// Re-exportar o serviço principal
export { BBIntegrationService, bbService };

// Re-exportar tipos e utilitários
export * from './bb-integration/types';
export * from './bb-integration/utils';

// Exportar a classe principal como padrão
export default BBIntegrationService; 
