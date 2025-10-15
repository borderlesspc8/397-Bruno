import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/_lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado usando Supabase Auth
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário atual é o administrador autorizado (mvcas95@gmail.com)
    if (user.email !== "mvcas95@gmail.com") {
      return NextResponse.json({ 
        error: "Acesso restrito apenas ao administrador autorizado" 
      }, { status: 403 });
    }

    // TODO: Implementar busca de usuários no Supabase quando necessário
    // Por enquanto, retornar apenas o usuário atual
    const currentUser = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
      image: user.user_metadata?.avatar_url,
      subscriptionPlan: 'FREE',
      isActive: true,
      role: 'ADMIN',
      isOnboarded: true,
      isTermsAccepted: true,
      lastLogin: user.last_sign_in_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    return NextResponse.json({ users: [currentUser] });

  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 
