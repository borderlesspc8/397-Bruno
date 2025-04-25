/**
 * Endpoint para corrigir problemas do webhook do Gestão Click
 */

import { NextRequest, NextResponse } from "next/server";
import { verificarECorrigirConfiguracao, corrigirVendaEParcelas } from "../utils/fix-webhook";

// Definir segredo para proteção do endpoint
const FIX_SECRET = process.env.WEBHOOK_FIX_SECRET || "webhook-fix-secret";

// Configurar como dinâmico para evitar cache
export const dynamic = "force-dynamic";

/**
 * GET /api/webhooks/gestao-click/fix
 * Verifica o status da configuração do webhook
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação básica para segurança
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    // Em produção, validar o token
    if (process.env.NODE_ENV === "production" && token !== FIX_SECRET) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      status: "ready",
      message: "Endpoint de correção do webhook disponível",
      usage: "Faça uma requisição POST com o userId para corrigir a configuração"
    });
  } catch (error: any) {
    console.error("[GESTAO_CLICK] Erro ao verificar status:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/gestao-click/fix
 * Corrige a configuração do webhook para um usuário específico
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação básica para segurança
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    // Em produção, validar o token
    if (process.env.NODE_ENV === "production" && token !== FIX_SECRET) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    
    // Obter corpo da requisição
    const body = await request.json();
    const { userId, action, saleId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Parâmetro ausente", message: "userId é obrigatório" },
        { status: 400 }
      );
    }
    
    // Se foi especificada uma ação e um saleId, processar essa ação específica
    if (action === "fix_installments" && saleId) {
      const resultado = await corrigirVendaEParcelas(userId, saleId);
      
      return NextResponse.json({
        success: true,
        message: `Correção de parcelas concluída para venda ${saleId}`,
        resultado
      });
    }
    
    // Executar a verificação e correção geral
    const resultado = await verificarECorrigirConfiguracao(userId);
    
    return NextResponse.json({
      success: true,
      message: `Configuração do webhook corrigida para o usuário ${userId}`,
      resultado
    });
  } catch (error: any) {
    console.error("[GESTAO_CLICK] Erro ao corrigir webhook:", error);
    return NextResponse.json(
      { error: "Erro ao corrigir webhook", message: error.message },
      { status: 500 }
    );
  }
} 