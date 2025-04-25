import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";

/**
 * Status do chat - configuração global
 */
let CHAT_DISABLED = false;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin-secret-key";

/**
 * GET /api/chat-status
 * Verifica se o chat está habilitado ou desabilitado
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar se o sistema deve verificar o status no banco de dados
    // ou usar a configuração em memória
    const shouldCheckDb = request.nextUrl.searchParams.get("check_db") === "true";
    
    if (shouldCheckDb) {
      // Buscar status no banco de dados
      const systemSettings = await prisma.systemSettings.findFirst({
        where: { key: "CHAT_DISABLED" }
      });
      
      if (systemSettings) {
        CHAT_DISABLED = systemSettings.value === "true";
      }
    }
    
    return NextResponse.json({
      status: "success",
      chatDisabled: CHAT_DISABLED
    });
  } catch (error) {
    console.error("[API] Erro ao verificar status do chat:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status do chat", message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat-status
 * Altera o status do chat (habilitar/desabilitar)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (apenas admin pode alterar)
    const session = await getAuthSession();
    const adminKey = request.headers.get("x-admin-key");
    
    // Verificar permissão: usuário deve ser admin ou fornecer chave de administrador válida
    const isAdmin = session?.user?.role === "ADMIN";
    const hasValidAdminKey = adminKey === ADMIN_SECRET;
    
    if (!isAdmin && !hasValidAdminKey) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Obter nova configuração do corpo da requisição
    const body = await request.json();
    const { disabled } = body;
    
    if (typeof disabled !== "boolean") {
      return NextResponse.json(
        { error: "Parâmetro 'disabled' deve ser um booleano" },
        { status: 400 }
      );
    }
    
    // Atualizar configuração em memória
    CHAT_DISABLED = disabled;
    
    // Salvar no banco de dados para persistência
    await prisma.systemSettings.upsert({
      where: { key: "CHAT_DISABLED" },
      create: {
        key: "CHAT_DISABLED",
        value: String(disabled),
        updatedBy: session?.user?.id || "admin"
      },
      update: {
        value: String(disabled),
        updatedBy: session?.user?.id || "admin"
      }
    });
    
    // Se estiver desabilitando, registrar quando será reativado (opcional)
    let reactivationTime = null;
    if (disabled && body.temporaryMinutes) {
      const minutes = parseInt(body.temporaryMinutes);
      if (!isNaN(minutes) && minutes > 0) {
        reactivationTime = new Date(Date.now() + minutes * 60 * 1000);
        
        // Opcional: configurar um job para reativar automaticamente
        // Isso seria implementado com um cron job ou similar
      }
    }
    
    return NextResponse.json({
      status: "success",
      chatDisabled: CHAT_DISABLED,
      message: CHAT_DISABLED 
        ? "Chat desativado com sucesso" 
        : "Chat ativado com sucesso",
      reactivationTime
    });
  } catch (error) {
    console.error("[API] Erro ao alterar status do chat:", error);
    return NextResponse.json(
      { error: "Erro ao alterar status do chat", message: String(error) },
      { status: 500 }
    );
  }
} 