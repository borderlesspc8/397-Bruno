type LogLevel = "debug" | "info" | "warn" | "error";

// Exportando a interface para poder ser usada em outros arquivos
export interface LogOptions {
  level?: LogLevel;
  context?: string;
  data?: any;
  // Campos adicionais genéricos para maior flexibilidade
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private isDebugEnabled: boolean;

  private constructor() {
    this.isDebugEnabled = process.env.NODE_ENV === "development";
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(message: string, options: LogOptions = {}): string {
    const timestamp = new Date().toISOString();
    const context = options.context ? `[${options.context}]` : "";
    return `${timestamp} ${context} ${message}`;
  }

  private log(level: LogLevel, message: string, options: LogOptions = {}) {
    const formattedMessage = this.formatMessage(message, options);
    
    if (level === "debug" && !this.isDebugEnabled) return;
    
    switch (level) {
      case "debug":
        console.debug(formattedMessage, options.data);
        break;
      case "info":
        console.info(formattedMessage, options.data);
        break;
      case "warn":
        console.warn(formattedMessage, options.data);
        break;
      case "error":
        console.error(formattedMessage, options.data);
        break;
    }
  }

  public debug(message: string, options?: LogOptions) {
    this.log("debug", message, options);
  }

  public info(message: string, options?: LogOptions) {
    this.log("info", message, options);
  }

  public warn(message: string, options?: LogOptions) {
    this.log("warn", message, options);
  }

  public error(message: string, options?: LogOptions) {
    this.log("error", message, options);
  }
}

export const logger = Logger.getInstance(); 