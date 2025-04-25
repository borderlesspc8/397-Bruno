import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth-options";
import { ReconciliationService } from "@/app/_services/reconciliation-service";
import z from "zod";

const ReconciliationRequestSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  walletId: z.string().optional(),
  tolerancePercentage: z.number().min(0).max(100).optional(),
  toleranceDays: z.number().min(0).max(30).optional(),
  saleId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parsear parâmetros da requisição
    const requestData = await request.json();
    const validationResult = ReconciliationRequestSchema.safeParse(requestData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Parâmetros inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { 
      startDate,
      endDate,
      walletId,
      tolerancePercentage = 5,
      toleranceDays = 5,
      saleId
    } = validationResult.data;

    // Executar a conciliação
    let result;
    
    if (saleId) {
      // Reconciliar apenas uma venda específica
      result = await ReconciliationService.reconcileSingleSaleRecord(
        userId,
        saleId,
        tolerancePercentage,
        toleranceDays
      );
    } else {
      // Reconciliar todas as vendas no período
      result = await ReconciliationService.reconcileSalesAndTransactions({
        userId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        walletId,
        tolerancePercentage,
        toleranceDays
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        message: `Conciliação concluída: ${result.matched} correspondências encontradas de ${result.totalProcessed} itens processados.`
      }
    });
  } catch (error: unknown) {
    console.error("Erro na API de conciliação:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Falha ao executar conciliação", 
        message: errorMessage 
      },
      { status: 500 }
    );
  }
} 