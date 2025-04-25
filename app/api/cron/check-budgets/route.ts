import { NextRequest, NextResponse } from "next/server";
import { checkAllBudgetsLimits } from "@/app/api/budgets/check-limits";

// Chave secreta para autorizar o acesso ao endpoint (deve ser configurada no .env)
const CRON_SECRET = process.env.CRON_SECRET || "";

// GET /api/cron/check-budgets - Verifica todos os orçamentos e envia notificações
export async function GET(request: NextRequest) {
  try {
    // Verificar autorização com chave secreta
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (!CRON_SECRET || !secret || secret !== CRON_SECRET) {
      console.error("Tentativa de acesso não autorizado ao endpoint de cron");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Executar verificação de todos os orçamentos ativos
    const result = await checkAllBudgetsLimits();

    if (!result) {
      return NextResponse.json(
        { error: "Erro ao verificar orçamentos" },
        { status: 500 }
      );
    }

    // Registrar no console para monitoramento
    console.log(`[CRON] Verificação de orçamentos concluída: ${result.total} orçamentos verificados`);
    console.log(`[CRON] ${result.exceededCount} orçamentos excedidos, ${result.nearLimitCount} próximos do limite`);

    return NextResponse.json({
      message: "Verificação de orçamentos concluída com sucesso",
      timestamp: new Date().toISOString(),
      stats: {
        total: result.total,
        exceededCount: result.exceededCount,
        nearLimitCount: result.nearLimitCount,
      },
    });
  } catch (error) {
    console.error("Erro no endpoint de verificação de orçamentos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 