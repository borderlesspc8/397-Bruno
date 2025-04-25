import { toast } from "sonner";

/**
 * Tipos de importação suportados
 */
export enum ImportSourceType {
  GESTAO_CLICK = "GESTAO_CLICK",
  OFX = "OFX",
  CSV = "CSV",
  MANUAL = "MANUAL",
  BANK_API = "BANK_API"
}

/**
 * Estrutura padronizada para erros de importação
 */
export interface ImportError {
  message: string;
  statusCode?: number;
  source: ImportSourceType;
  details?: any;
  timestamp: Date;
  transactionId?: string;
  walletId?: string;
  userId?: string;
}

/**
 * Logs de importação para registro e depuração
 */
export interface ImportLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: ImportSourceType;
  timestamp: Date;
  details?: any;
  userId?: string;
}

// Armazenamento de logs na memória para depuração
const importLogs: ImportLog[] = [];

/**
 * Adiciona um log de importação
 */
export function addImportLog(log: Omit<ImportLog, 'timestamp'>): void {
  const fullLog = {
    ...log,
    timestamp: new Date()
  };
  
  importLogs.push(fullLog);
  
  // Limitar o número de logs armazenados
  if (importLogs.length > 1000) {
    importLogs.shift();
  }
  
  // Log para console
  switch (log.level) {
    case 'error':
      console.error(`[IMPORT_${log.source}] ${log.message}`, log.details || '');
      break;
    case 'warn':
      console.warn(`[IMPORT_${log.source}] ${log.message}`, log.details || '');
      break;
    case 'debug':
      console.debug(`[IMPORT_${log.source}] ${log.message}`, log.details || '');
      break;
    default:
      console.log(`[IMPORT_${log.source}] ${log.message}`, log.details || '');
  }
}

/**
 * Obtém logs de importação para uma fonte específica
 */
export function getImportLogs(source?: ImportSourceType): ImportLog[] {
  if (source) {
    return [...importLogs.filter(log => log.source === source)];
  }
  return [...importLogs];
}

/**
 * Limpa os logs de importação
 */
export function clearImportLogs(source?: ImportSourceType): void {
  if (source) {
    const index = importLogs.findIndex(log => log.source === source);
    if (index !== -1) {
      importLogs.splice(index, 1);
    }
  } else {
    importLogs.length = 0;
  }
}

/**
 * Manipula um erro de importação de forma padronizada
 */
export function handleImportError(
  error: any, 
  source: ImportSourceType,
  options: {
    userId?: string;
    walletId?: string;
    transactionId?: string;
    showToast?: boolean;
    throwError?: boolean;
  } = {}
): ImportError {
  const { 
    userId, 
    walletId, 
    transactionId, 
    showToast = true, 
    throwError = false 
  } = options;
  
  // Determinar mensagem de erro
  let message = 'Erro durante importação';
  let statusCode = 500;
  let details = null;
  
  if (error instanceof Error) {
    message = error.message;
    details = error.stack;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    if ('message' in error) message = String(error.message);
    if ('statusCode' in error) statusCode = Number(error.statusCode);
    if ('status' in error) statusCode = Number(error.status);
    details = error;
  }
  
  // Montar objeto de erro padronizado
  const importError: ImportError = {
    message,
    statusCode,
    source,
    details,
    timestamp: new Date(),
    userId,
    walletId,
    transactionId
  };
  
  // Registrar o erro
  addImportLog({
    level: 'error',
    message: `Erro de importação: ${message}`,
    source,
    details: importError,
    userId
  });
  
  // Mostrar notificação
  if (showToast) {
    toast.error(`Erro na importação: ${message}`);
  }
  
  // Lançar erro se necessário
  if (throwError) {
    throw new Error(`[${source}] ${message}`);
  }
  
  return importError;
}

/**
 * Manipula vários erros de importação
 */
export function handleBulkImportErrors(
  errors: any[], 
  source: ImportSourceType,
  options: {
    userId?: string;
    walletId?: string;
    showToast?: boolean;
  } = {}
): ImportError[] {
  if (!errors || errors.length === 0) return [];
  
  const importErrors = errors.map(error => 
    handleImportError(error, source, { ...options, showToast: false, throwError: false })
  );
  
  // Mostrar uma única notificação resumida
  if (options.showToast && importErrors.length > 0) {
    toast.error(`${importErrors.length} erros durante a importação. Veja os detalhes nos logs.`);
  }
  
  return importErrors;
}

/**
 * Exporta logs de importação para um arquivo
 */
export async function exportImportLogs(source?: ImportSourceType): Promise<string> {
  const logs = getImportLogs(source);
  
  // Formatar logs para JSON
  const logsJson = JSON.stringify(logs, null, 2);
  
  // No navegador, criar um arquivo para download
  if (typeof window !== 'undefined') {
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  return logsJson;
} 