/**
 * API para executar a sincronização automática de transações do Gestão Click
 * Esta rota é chamada por um serviço de CRON externo (ex: GitHub Actions, Vercel Cron Jobs)
 */

import { NextRequest, NextResponse } from "next/server";
import { runAutoSyncGestaoClick } from "@/app/_lib/cron-jobs";

// Chave de acesso para autenticar chamadas ao endpoint
const CRON_API_KEY = process.env.CRON_API_KEY;

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/gestao-click-sync
 * Executa a sincronização automática de transações do Gestão Click
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (chave API do CRON)
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");
    
    // Verificar se a chave é válida (em produção)
    if (process.env.NODE_ENV === "production" && apiKey !== CRON_API_KEY) {
      console.error("[CRON_API] Tentativa de acesso não autorizado");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Extrair opções (se houver)
    const { searchParams } = new URL(request.url);
    const forceSync = searchParams.get("force") === "true";
    
    console.log(`[CRON_API] Iniciando sincronização automática do Gestão Click (force=${forceSync})`);
    
    // Executar sincronização
    const result = await runAutoSyncGestaoClick();
    
    // Retornar resultado
    return NextResponse.json({
      success: true,
      message: `Sincronização automática concluída: ${result.newTransactions} novas transações importadas`,
      statistics: {
        processed: result.processed,
        success: result.success,
        failed: result.failed,
        newTransactions: result.newTransactions
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("[CRON_API] Erro na execução da sincronização automática:", error);
    
    return NextResponse.json(
      {
        error: "Falha na sincronização automática",
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 