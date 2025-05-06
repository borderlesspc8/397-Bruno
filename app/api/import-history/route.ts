import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/_lib/auth";
import { ImportHistoryService } from "@/app/_services/import-history-service";
import { ImportStatus } from "@/app/types/import-history";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


/**
 * API para obter histórico de importações
 */
const importHistoryService = new ImportHistoryService();

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: "Para visualizar histórico de importações, você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Obter parâmetros de filtro e paginação
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const source = searchParams.get("source") || undefined;
    const walletId = searchParams.get("walletId") || undefined;
    
    // Converter datas
    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate") as string) 
      : undefined;
    
    const endDate = searchParams.get("endDate") 
      ? new Date(searchParams.get("endDate") as string) 
      : undefined;
    
    // Obter status como array
    const statusParams = searchParams.getAll("status");
    const status = statusParams.length > 0 
      ? statusParams as ImportStatus[] 
      : undefined;
    
    // Obter histórico de importações com filtros
    const result = await importHistoryService.getImportHistory(userId, {
      limit,
      offset,
      source,
      startDate,
      endDate,
      walletId,
      status,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao obter histórico de importações:", error);
    return NextResponse.json(
      { message: `Erro ao obter histórico: ${error.message}` },
      { status: 500 }
    );
  }
} 
