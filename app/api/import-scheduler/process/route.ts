import { NextRequest, NextResponse } from "next/server";
import { ImportSchedulerService } from "@/app/_services/import-scheduler-service";

/**
 * API para processamento de agendamentos pendentes
 * Esta rota deve ser chamada por um cronjob externo (por exemplo, usando Vercel Cron Jobs)
 */
const importSchedulerService = new ImportSchedulerService();

export async function POST(request: NextRequest) {
  try {
    // Verificar token de segurança
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.SCHEDULER_API_KEY;
    
    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { message: "Acesso não autorizado" },
        { status: 401 }
      );
    }
    
    // Processar agendamentos pendentes
    const processedCount = await importSchedulerService.processPendingSchedules();
    
    return NextResponse.json({
      success: true,
      processed: processedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Erro ao processar agendamentos pendentes:", error);
    return NextResponse.json(
      { 
        message: `Erro ao processar agendamentos: ${error.message}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
} 