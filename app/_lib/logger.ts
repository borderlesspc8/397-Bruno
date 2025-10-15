/**
 * Sistema de Logs centralizado com controle de verbosidade e persistência em arquivo
 */

import fs from 'fs';
import path from 'path';
import { appendFile } from 'fs/promises';

// Níveis de log suportados pelo sistema
export enum LogLevel {
  ERROR = 0,   // Apenas erros
  WARN = 1,    // Erros e avisos
  INFO = 2,    // Informações importantes (padrão)
  DEBUG = 3,   // Informações de debug
  TRACE = 4    // Logs extremamente detalhados
}

// Tipo de string para os níveis de log utilizados nas funções
export type LogLevelString = 'error' | 'warn' | 'info' | 'debug' | 'trace';

// Configuração global do logger
export interface LoggerConfig {
  // Nível de log atual
  level: LogLevel;
  // Controle de timestamp
  showTimestamp: boolean;
  // Controle de saída
  console: boolean;
  file: boolean;
  // Configuração de arquivo
  logDir: string;
  filePrefix: string;
  // Filtros para ocultar determinados logs
  filters: {
    disablePrismaLogs: boolean;     // Ocultar logs de query do Prisma
    disableAuthLogs: boolean;       // Ocultar logs de autenticação
    disableNetworkLogs: boolean;    // Ocultar logs de rede detalhados
  }
}

// Configuração padrão
const defaultConfig: LoggerConfig = {
  level: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO,
  showTimestamp: true,
  console: true,
  file: true,
  logDir: path.join(process.cwd(), 'logs'),
  filePrefix: 'server',
  filters: {
    disablePrismaLogs: true,
    disableAuthLogs: true,
    disableNetworkLogs: true
  }
};

// Configuração atual
let config: LoggerConfig = { ...defaultConfig };

// Prefixos de mensagem por tipo
const prefixes: Record<LogLevel, string> = {
  [LogLevel.ERROR]: '[ERRO]',
  [LogLevel.WARN]: '[AVISO]',
  [LogLevel.INFO]: '[INFO]',
  [LogLevel.DEBUG]: '[DEBUG]',
  [LogLevel.TRACE]: '[TRACE]',
};

// Mapeamento de LogLevelString para LogLevel enum
const levelStringToEnum: Record<LogLevelString, LogLevel> = {
  'error': LogLevel.ERROR,
  'warn': LogLevel.WARN,
  'info': LogLevel.INFO,
  'debug': LogLevel.DEBUG,
  'trace': LogLevel.TRACE
};

// Cores para logs no terminal
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

// Mapeamento de nível para cor
const levelColors: Record<LogLevel, string> = {
  [LogLevel.ERROR]: colors.red,
  [LogLevel.WARN]: colors.yellow,
  [LogLevel.INFO]: colors.green,
  [LogLevel.DEBUG]: colors.blue,
  [LogLevel.TRACE]: colors.gray,
};

/**
 * Verifica se um log deve ser filtrado com base no seu conteúdo
 */
function shouldFilter(message: string): boolean {
  if (config.filters.disablePrismaLogs && message.includes('prisma:query')) {
    return true;
  }
  
  if (config.filters.disableAuthLogs && (
    message.includes('[AUTH]') || 
    message.includes('Authorization') || 
    message.includes('Bearer')
  )) {
    return true;
  }
  
  if (config.filters.disableNetworkLogs && (
    message.includes('Cabeçalhos') || 
    message.includes('Opções da requisição') ||
    message.includes('HTTP Request')
  )) {
    return true;
  }
  
  return false;
}

/**
 * Formata uma mensagem de log com timestamp, nível e módulo
 */
function formatLogMessage(level: LogLevel, module: string, message: string): string {
  const timestamp = config.showTimestamp ? `[${new Date().toISOString()}] ` : '';
  return `${timestamp}${prefixes[level]} [${module}] ${message}`;
}

/**
 * Gera o nome do arquivo de log para o dia atual
 */
function getLogFileName(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  return path.join(config.logDir, `${config.filePrefix}-${date}.log`);
}

/**
 * Escreve uma mensagem no arquivo de log
 */
async function writeToLogFile(message: string): Promise<void> {
  if (!config.file) return;
  
  try {
    const logFile = getLogFileName();
    
    // Garantir que o diretório existe
    if (!fs.existsSync(config.logDir)) {
      fs.mkdirSync(config.logDir, { recursive: true });
    }
    
    await appendFile(logFile, message + '\n');
  } catch (error) {
    // Usar console diretamente para evitar loops infinitos
    console.error('Erro ao escrever no arquivo de log:', error);
  }
}

/**
 * Interface para logger de módulo específico
 */
export interface ModuleLogger {
  error: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  trace: (message: string, ...args: any[]) => void;
}

/**
 * Cria um logger específico para um módulo 
 */
export function createLogger(moduleName: string): ModuleLogger {
  return {
    error: (message: string, ...args: any[]) => {
      logMessage(LogLevel.ERROR, moduleName, message, args);
    },
    
    warn: (message: string, ...args: any[]) => {
      logMessage(LogLevel.WARN, moduleName, message, args);
    },
    
    info: (message: string, ...args: any[]) => {
      logMessage(LogLevel.INFO, moduleName, message, args);
    },
    
    debug: (message: string, ...args: any[]) => {
      logMessage(LogLevel.DEBUG, moduleName, message, args);
    },
    
    trace: (message: string, ...args: any[]) => {
      logMessage(LogLevel.TRACE, moduleName, message, args);
    }
  };
}

/**
 * Função centralizada para processamento de logs
 */
function logMessage(level: LogLevel, module: string, message: string, args: any[] = []): void {
  // Verificar se este nível está habilitado na configuração
  if (level > config.level) return;
  
  // Verificar filtros
  if (shouldFilter(message)) return;
  
  // Formatar a mensagem
  const formattedMessage = formatLogMessage(level, module, message);
  
  // Enviar para o console se habilitado
  if (config.console) {
    const color = levelColors[level];
    const consoleMethod = level === LogLevel.ERROR ? console.error :
                          level === LogLevel.WARN ? console.warn :
                          console.log;
                          
    if (args.length > 0) {
      consoleMethod(`${color}${formattedMessage}${colors.reset}`, ...args);
    } else {
      consoleMethod(`${color}${formattedMessage}${colors.reset}`);
    }
  }
  
  // Enviar para o arquivo se habilitado
  if (config.file) {
    let fileMessage = formattedMessage;
    
    // Adicionar args ao log em arquivo, se houver
    if (args.length > 0) {
      try {
        const argsStr = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        fileMessage += ' ' + argsStr;
      } catch (err) {
        fileMessage += ' [Argumentos não serializáveis]';
      }
    }
    
    writeToLogFile(fileMessage);
  }
}

/**
 * Configura o sistema de logs
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
  
  // Garantir que o diretório existe, se o log em arquivo estiver habilitado
  if (config.file && config.logDir) {
    try {
      fs.mkdirSync(config.logDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de logs:', error);
    }
  }
}

/**
 * Retorna a configuração atual do logger
 */
export function getLoggerConfig(): LoggerConfig {
  return { ...config };
}

// Logger principal da aplicação
export const logger = createLogger('APP');

// Exportação padrão para facilitar o uso
export default logger; 
