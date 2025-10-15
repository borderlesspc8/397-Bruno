import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/_lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    // Obter o usuário atual usando Supabase Auth
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }
    
    // Por enquanto, retornar status ativo para todos os usuários
    // TODO: Implementar sistema de assinatura com Supabase quando necessário
    
    return NextResponse.json({
      success: true,
      status: "ACTIVE",
      endDate: null,
      userId: user.id,
      email: user.email
    });
    
  } catch (error) {
    console.error("Erro ao atualizar sessão:", error);
    
    return NextResponse.json(
      { error: "Falha ao atualizar sessão" },
      { status: 500 }
    );
  }
} 
