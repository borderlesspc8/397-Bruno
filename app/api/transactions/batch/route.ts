import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { TransactionService } from "@/app/_services/transaction-service";
import { ValidationService } from "@/app/_services/validation-service";
import { ErrorCode, ErrorHandlingService } from "@/app/_services/error-handling-service";

// API para criar múltiplas transações em lote
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return ErrorHandlingService.respondWithError(ErrorCode.UNAUTHORIZED);
    }

    const userId = session.user.id;
    const body = await request.json();
    
    // Validar se há um array de transações
    if (!Array.isArray(body.transactions) || body.transactions.length === 0) {
      return ErrorHandlingService.respondWithError(
        ErrorCode.VALIDATION_ERROR,
        "É necessário fornecer um array de transações",
        { receivedData: body }
      );
    }
    
    // Limitar o tamanho do lote para evitar transações muito grandes
    const MAX_BATCH_SIZE = 50;
    if (body.transactions.length > MAX_BATCH_SIZE) {
      return ErrorHandlingService.respondWithError(
        ErrorCode.LIMIT_EXCEEDED,
        `O tamanho máximo do lote é ${MAX_BATCH_SIZE} transações`,
        { providedSize: body.transactions.length, maxSize: MAX_BATCH_SIZE }
      );
    }
    
    // Validar e preparar cada transação no lote
    const validationErrors: Record<number, Record<string, string>> = {};
    const validatedTransactions: any[] = [];
    
    body.transactions.forEach((transaction: any, index: number) => {
      // Validar a transação
      const validation = ValidationService.validateTransaction({
        ...transaction,
        userId: userId
      });
      
      if (!validation.isValid) {
        validationErrors[index] = validation.errors || { general: "Erro de validação" };
      } else if (validation.validatedData) {
        validatedTransactions.push({
          ...validation.validatedData,
          userId
        });
      }
    });
    
    // Se houver erros de validação, retornar detalhes
    if (Object.keys(validationErrors).length > 0) {
      return ErrorHandlingService.respondWithError(
        ErrorCode.VALIDATION_ERROR,
        "Erros de validação em uma ou mais transações do lote",
        { validationErrors }
      );
    }

    // Criar transações usando o serviço em lote
    const result = await TransactionService.createBatchTransactions(validatedTransactions);

    // Retornar o resultado
    return NextResponse.json({
      success: result.success,
      createdCount: result.createdCount,
      failedCount: result.failedCount,
      results: result.results
    });
  } catch (error) {
    console.error("Erro ao processar transações em lote:", error);
    return ErrorHandlingService.handleException(error);
  }
} 