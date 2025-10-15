import { NextResponse } from "next/server";

// Códigos de erro padronizados
export enum ErrorCode {
  // Erros de autenticação (4xx)
  UNAUTHORIZED = "AUTH_001",
  SESSION_EXPIRED = "AUTH_002",
  INVALID_CREDENTIALS = "AUTH_003",

  // Erros de validação (4xx)
  VALIDATION_ERROR = "VAL_001",
  MISSING_REQUIRED_FIELDS = "VAL_002",
  INVALID_FORMAT = "VAL_003",
  INVALID_DATE = "VAL_004",
  INVALID_AMOUNT = "VAL_005",

  // Erros de recursos (4xx)
  RESOURCE_NOT_FOUND = "RES_001",
  WALLET_NOT_FOUND = "RES_002",
  TRANSACTION_NOT_FOUND = "RES_003",
  CATEGORY_NOT_FOUND = "RES_004",
  ATTACHMENT_NOT_FOUND = "RES_005",
  RESOURCE_ALREADY_EXISTS = "RES_006",

  // Erros de negócio (4xx)
  INSUFFICIENT_FUNDS = "BIZ_001",
  OPERATION_NOT_ALLOWED = "BIZ_002",
  LIMIT_EXCEEDED = "BIZ_003",
  INVALID_OPERATION = "BIZ_004",

  // Erros de servidor (5xx)
  INTERNAL_SERVER_ERROR = "SRV_001",
  DATABASE_ERROR = "SRV_002",
  EXTERNAL_SERVICE_ERROR = "SRV_003"
}

// Interface para erro estruturado
export interface StructuredError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  status: number;
}

export class ErrorHandlingService {
  // Mapa de mensagens de erro padrão
  private static errorMessages: Record<ErrorCode, { message: string, status: number }> = {
    // Erros de autenticação
    [ErrorCode.UNAUTHORIZED]: { 
      message: "Usuário não autorizado a acessar este recurso", 
      status: 401 
    },
    [ErrorCode.SESSION_EXPIRED]: { 
      message: "Sua sessão expirou, por favor faça login novamente", 
      status: 401 
    },
    [ErrorCode.INVALID_CREDENTIALS]: { 
      message: "Credenciais inválidas", 
      status: 401 
    },

    // Erros de validação
    [ErrorCode.VALIDATION_ERROR]: { 
      message: "Erro de validação nos dados fornecidos", 
      status: 400 
    },
    [ErrorCode.MISSING_REQUIRED_FIELDS]: { 
      message: "Campos obrigatórios não fornecidos", 
      status: 400 
    },
    [ErrorCode.INVALID_FORMAT]: { 
      message: "Formato de dados inválido", 
      status: 400 
    },
    [ErrorCode.INVALID_DATE]: { 
      message: "Data inválida", 
      status: 400 
    },
    [ErrorCode.INVALID_AMOUNT]: { 
      message: "Valor inválido", 
      status: 400 
    },

    // Erros de recursos
    [ErrorCode.RESOURCE_NOT_FOUND]: { 
      message: "Recurso não encontrado", 
      status: 404 
    },
    [ErrorCode.WALLET_NOT_FOUND]: { 
      message: "Carteira não encontrada", 
      status: 404 
    },
    [ErrorCode.TRANSACTION_NOT_FOUND]: { 
      message: "Transação não encontrada", 
      status: 404 
    },
    [ErrorCode.CATEGORY_NOT_FOUND]: { 
      message: "Categoria não encontrada", 
      status: 404 
    },
    [ErrorCode.ATTACHMENT_NOT_FOUND]: { 
      message: "Anexo não encontrado", 
      status: 404 
    },
    [ErrorCode.RESOURCE_ALREADY_EXISTS]: { 
      message: "Recurso já existe", 
      status: 409 
    },

    // Erros de negócio
    [ErrorCode.INSUFFICIENT_FUNDS]: { 
      message: "Saldo insuficiente para realizar a operação", 
      status: 400 
    },
    [ErrorCode.OPERATION_NOT_ALLOWED]: { 
      message: "Operação não permitida", 
      status: 403 
    },
    [ErrorCode.LIMIT_EXCEEDED]: { 
      message: "Limite excedido", 
      status: 400 
    },
    [ErrorCode.INVALID_OPERATION]: { 
      message: "Operação inválida", 
      status: 400 
    },

    // Erros de servidor
    [ErrorCode.INTERNAL_SERVER_ERROR]: { 
      message: "Erro interno do servidor", 
      status: 500 
    },
    [ErrorCode.DATABASE_ERROR]: { 
      message: "Erro no banco de dados", 
      status: 500 
    },
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: { 
      message: "Erro em serviço externo", 
      status: 500 
    }
  };

  /**
   * Cria um erro estruturado
   */
  static createError(
    code: ErrorCode,
    customMessage?: string,
    details?: Record<string, any>
  ): StructuredError {
    const errorInfo = this.errorMessages[code];
    
    return {
      code,
      message: customMessage || errorInfo.message,
      details,
      status: errorInfo.status
    };
  }

  /**
   * Cria uma resposta HTTP a partir de um erro estruturado
   */
  static createErrorResponse(error: StructuredError): NextResponse {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && { details: error.details })
        }
      },
      { status: error.status }
    );
  }

  /**
   * Método utilitário para gerar resposta de erro diretamente
   */
  static respondWithError(
    code: ErrorCode,
    customMessage?: string,
    details?: Record<string, any>
  ): NextResponse {
    const error = this.createError(code, customMessage, details);
    return this.createErrorResponse(error);
  }

  /**
   * Método para lidar com exceções e gerar respostas de erro apropriadas
   */
  static handleException(
    error: any,
    defaultCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
  ): NextResponse {
    console.error("Erro capturado:", error);
    
    // Se o erro já for estruturado, retorne-o diretamente
    if (error.code && Object.values(ErrorCode).includes(error.code)) {
      return this.createErrorResponse(error);
    }
    
    // Caso contrário, crie um erro padrão
    return this.respondWithError(
      defaultCode,
      error.message || this.errorMessages[defaultCode].message
    );
  }

  /**
   * Método para validar dados e retornar erros estruturados
   */
  static validateData(
    data: Record<string, any>,
    requiredFields: string[]
  ): { valid: boolean; error?: NextResponse } {
    // Verificar campos obrigatórios
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      const error = this.respondWithError(
        ErrorCode.MISSING_REQUIRED_FIELDS,
        "Campos obrigatórios não fornecidos",
        { missingFields }
      );
      
      return { valid: false, error };
    }

    return { valid: true };
  }
} 
