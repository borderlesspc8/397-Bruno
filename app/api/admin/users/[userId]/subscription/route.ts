import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/_lib/supabase-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // TODO: Implementar funcionalidade de admin com Supabase quando necessário
    return NextResponse.json({ 
      error: "Funcionalidade de admin será implementada com Supabase Auth",
      message: "Use o painel de administração do Supabase por enquanto"
    }, { status: 501 });

  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 