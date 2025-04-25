import { NextRequest, NextResponse } from "next/server";
import { RecurringTransactionService } from "@/app/_services/recurring-transaction-service";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Esta é uma rota cron protegida para ser executada automaticamente
// O ambiente de produção deve ter autenticação adequada para evitar acesso não autorizado
export async function GET(request: NextRequest) {
  try {
    // Verificar se a solicitação contém o token de autorização
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Não autorizado", { status: 401 });
    }
    
    // Processar transações recorrentes
    const processedCount = await RecurringTransactionService.processRecurringTransactions();
    
    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao processar transações recorrentes:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
} 