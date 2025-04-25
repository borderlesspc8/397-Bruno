import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { verificarIntegracaoGestaoClick } from "@/app/_data/get-dashboard";

/**
 * Endpoint para verificar reconciliação com Gestão Click
 * GET /api/dashboard/reconciliacao?month=MM&year=YYYY
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para continuar." },
        { status: 401 }
      );
    }

    // Obter parâmetros da consulta
    const searchParams = req.nextUrl.searchParams;
    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");
    
    // Usar valores padrão atuais se não fornecidos
    const month = monthStr ? parseInt(monthStr, 10) : new Date().getMonth() + 1;
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

    // Executar reconciliação com parâmetros corretos
    const resultado = await verificarIntegracaoGestaoClick(
      session.user.id, 
      month,
      year
    );

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("[API] Erro na reconciliação:", error);
    return NextResponse.json(
      { error: "Erro ao processar a reconciliação: " + String(error) },
      { status: 500 }
    );
  }
} 