import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { prisma } from "@/app/_lib/prisma";

/**
 * Verifica se o usuário é um administrador
 */
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  return user?.role === "ADMIN";
}

/**
 * Endpoint para limpeza específica de dados duplicados
 * Usado por ferramentas administrativas para manutenção do sistema
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await validateSessionForAPI();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se é admin
    const isAdminUser = await isAdmin(session.user.id);
    if (!isAdminUser) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores podem executar esta operação." },
        { status: 403 }
      );
    }

    // Obter parâmetros da solicitação
    const body = await request.json();
    const { type, userId = session.user.id, dryRun = false } = body;

    // Direcionar para o tipo específico de limpeza
    if (type === "transactionDuplicates") {
      return NextResponse.json(
        { 
          success: true,
          message: "Função temporariamente desativada. Use a rota /api/admin/cleanup" 
        },
        { status: 200 }
      );
    } 
    
    if (type === "walletDuplicates") {
      return NextResponse.json(
        { 
          success: true,
          message: "Função temporariamente desativada. Use a rota /api/admin/cleanup" 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: "Tipo de limpeza inválido" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro na limpeza de dados duplicados:", error);
    return NextResponse.json(
      { error: "Erro ao processar a limpeza: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

/**
 * GET para verificar o status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { status: "OK", message: "Use POST para executar limpezas" },
    { status: 200 }
  );
} 
