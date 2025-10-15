import { NextResponse } from "next/server";
import { logger } from "../_services/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (error: any) => {
  logger.error("Erro na aplicação", {
    context: "ERROR_HANDLER",
    data: error,
  });

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  // Erro de validação do Zod
  if (error.name === "ZodError") {
    return NextResponse.json(
      {
        error: "Erro de validação",
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // Erro de autenticação
  if (error.name === "AuthenticationError") {
    return NextResponse.json(
      {
        error: "Não autorizado",
        details: error.message,
      },
      { status: 401 }
    );
  }

  // Erro genérico
  return NextResponse.json(
    {
      error: "Erro interno do servidor",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    },
    { status: 500 }
  );
}; 
