/**
 * API para processamento automático de agendamentos de importação
 * Esta rota deve ser chamada por um serviço CRON externo
 */

import { NextRequest, NextResponse } from "next/server";
import { ImportSchedulerService } from "@/app/_services/import-scheduler-service";

// Chave de acesso para autenticar chamadas ao endpoint
const CRON_API_KEY = process.env.CRON_API_KEY;

// Força comportamento dinâmico para este endpoint
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/process-schedules
 * Processa todos os agendamentos pendentes
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar token de autenticação
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    if (!token || token !== CRON_API_KEY) {
      console.error('[CRON] Tentativa de acesso não autorizado ao endpoint de processamento de agendamentos');
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Processar agendamentos pendentes
    const schedulerService = new ImportSchedulerService();
    const processedCount = await schedulerService.processPendingSchedules();
    
    console.log(`[CRON] Processados ${processedCount} agendamentos pendentes`);
    
    // Retornar resultado
    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[CRON] Erro ao processar agendamentos pendentes:', error);
    
    return NextResponse.json(
      { 
        error: "Erro ao processar agendamentos",
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 