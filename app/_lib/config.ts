/**
 * Configurações globais da aplicação
 */

/**
 * Verifica se a aplicação está executando em modo de demonstração
 * No modo de demonstração, são utilizados dados mockados pré-definidos
 */
export const isDemoMode = false;

/**
 * Verifica se o recurso de importação automática está habilitado
 */
export const isAutoImportEnabled = process.env.AUTO_IMPORT_ENABLED === 'true';

/**
 * Configurações específicas para o modo de demonstração
 */
export const demoConfig = {
  userId: 'demo-user-id',
  email: 'demo@acceleracrm.com.br',
  defaultWalletId: 'demo-wallet-1',
};

/**
 * Retorna se a aplicação está executando em ambiente de desenvolvimento
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Define o modo de debug da aplicação
 */
export const isDebugMode = process.env.NEXTAUTH_DEBUG === 'true';

/**
 * Configurações de integração com serviços externos
 */
export const integrations = {
}; 
