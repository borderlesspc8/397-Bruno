import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/_lib/auth";
import { ImportHistoryService } from "@/app/_services/import-history-service";

/**
 * API para obter resumo de importações
 */
const importHistoryService = new ImportHistoryService();

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para visualizar resumo de importações, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Obter resumo das importações
    const summary = await importHistoryService.getImportSummary(userId);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Erro ao obter resumo de importações:", error);
    return NextResponse.json(
      { message: `Erro ao obter resumo: ${error.message}` },
      { status: 500 }
    );
  }
} 