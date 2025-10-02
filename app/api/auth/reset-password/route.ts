import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // TODO: Implementar reset de senha com Supabase Auth quando necessário
    // Por enquanto, retornar erro informando que a funcionalidade será implementada
    
    return NextResponse.json(
      { 
        error: "Funcionalidade de reset de senha será implementada com Supabase Auth",
        message: "Use o link de reset enviado por email ou entre em contato com o suporte"
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 