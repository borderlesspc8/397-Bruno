import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/_lib/auth";
import { z } from "zod";
import { MLReconciliationService } from "@/app/_services/ml-reconciliation-service";
import { logger } from "@/app/_services/logger";
import { db } from "@/app/_lib/db";

// Esquema de validação para os parâmetros da API
const reconciliationSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  walletId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Validar sessão
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter parâmetros da requisição
    const body = await request.json();
    
    // Validar parâmetros
    const validationResult = reconciliationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Parâmetros inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { startDate, endDate, walletId } = validationResult.data;

    // Converter datas
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    // Executar conciliação com ML
    const reconciliationResult = await MLReconciliationService.reconcileWithML(
      session.user.id,
      parsedStartDate,
      parsedEndDate,
      walletId
    );

    // Retornar resultado
    return NextResponse.json({
      success: true,
      data: reconciliationResult
    });
  } catch (error: any) {
    logger.error("[ML_RECONCILIATION_API] Erro na conciliação:", { error: error.message || String(error) });
    
    return NextResponse.json(
      { 
        error: "Erro ao executar conciliação automática", 
        message: error.message || "Erro desconhecido" 
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar status do modelo ML
export async function GET(request: NextRequest) {
  try {
    // Validar sessão
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o modelo está pronto
    const isModelReady = await MLReconciliationService["isModelReady"](session.user.id);
    
    // Obter estatísticas básicas
    const matchCount = await db.sales_transaction.count({
      where: {
        salesRecord: {
          userId: session.user.id
        },
        metadata: {
          path: ['manuallyConfirmed'],
          equals: true
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        isModelReady,
        trainingMatches: matchCount,
        minTrainingRequired: MLReconciliationService["MIN_TRAINING_SAMPLES"]
      }
    });
  } catch (error: any) {
    logger.error("[ML_RECONCILIATION_API] Erro ao verificar status do modelo:", { error: error.message || String(error) });
    
    return NextResponse.json(
      { 
        error: "Erro ao verificar status do modelo", 
        message: error.message || "Erro desconhecido" 
      },
      { status: 500 }
    );
  }
} 