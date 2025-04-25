"use server";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";
import { MLReconciliationService } from "@/app/_services/ml-reconciliation-service";
import { logger } from "@/app/_services/logger";

// Função auxiliar para retornar erros formatados
const errorResponse = (message: string, status: number) => {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
};

/**
 * POST /api/reconciliation/ml/transaction
 * 
 * Realiza a conciliação de uma transação específica usando ML
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { transactionId, startDate, endDate, walletId, checkForInstallments = true } = body;
    
    // Validar parâmetros obrigatórios
    if (!transactionId) {
      return errorResponse("ID da transação é obrigatório", 400);
    }
    
    // Converter datas se fornecidas
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    
    // Chamar o serviço de reconciliação ML para transação específica
    const reconciliationResult = await MLReconciliationService.reconcileTransactionWithML(
      session.user.id,
      transactionId,
      parsedStartDate,
      parsedEndDate,
      walletId
    );
    
    // Se a reconciliação direta não encontrou correspondências, tentar reconciliar como parte de um grupo
    if (checkForInstallments && reconciliationResult.matched === 0 && !reconciliationResult.alreadyLinked) {
      // Buscar 15 dias antes e depois para identificar possíveis parcelas
      const installmentStartDate = new Date(parsedStartDate || new Date());
      installmentStartDate.setDate(installmentStartDate.getDate() - 15);
      
      const installmentEndDate = new Date(parsedEndDate || new Date());
      installmentEndDate.setDate(installmentEndDate.getDate() + 15);
      
      // Tentar reconciliar como parte de um grupo de parcelas
      const installmentResult = await MLReconciliationService.reconcileInstallments(
        session.user.id,
        installmentStartDate,
        installmentEndDate,
        walletId
      );
      
      // Se houve sucesso na reconciliação de parcelas, retornar esse resultado
      if (installmentResult.matched > 0) {
        logger.info(`[ML_TRANSACTION_RECONCILIATION] Conciliação de parcelas concluída`, {
          userId: session.user.id,
          transactionId,
          result: installmentResult
        });
        
        return NextResponse.json({
          success: true,
          data: {
            ...installmentResult,
            isInstallmentGroup: true
          }
        });
      }
    }
    
    logger.info(`[ML_TRANSACTION_RECONCILIATION] Conciliação concluída para transação ${transactionId}`, {
      userId: session.user.id,
      startDate: parsedStartDate?.toISOString(),
      endDate: parsedEndDate?.toISOString(),
      walletId
    });
    
    return NextResponse.json({
      success: true,
      data: reconciliationResult
    });
  } catch (error: any) {
    logger.error(`[ML_TRANSACTION_RECONCILIATION] Erro ao conciliar transação:`, error);
    return errorResponse(
      error.message || "Erro ao realizar conciliação automática",
      500
    );
  }
} 