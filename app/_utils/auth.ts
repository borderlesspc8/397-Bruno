import { createClient } from "../_lib/supabase-server";
import { NextRequest } from "next/server";

/**
 * Valida a sessão do usuário para chamadas de API usando Supabase Auth
 * @param request - Requisição Next.js (opcional, para debug)
 * @returns Usuário do Supabase ou null se inválido
 */
export async function validateSessionForAPI(request?: NextRequest) {
  try {
    // Usar o createClient do supabase-server que usa cookies() do Next.js
    const supabase = createClient();
    
    // Tentar obter a sessão primeiro
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Se temos sessão válida, usar ela
    if (session?.user && !sessionError) {
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          image: session.user.user_metadata?.avatar_url,
        }
      };
    }
    
    // Se não há sessão ou erro, tentar getUser diretamente
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        image: user.user_metadata?.avatar_url,
      }
    };
  } catch (error) {
    console.error("Erro ao validar sessão para API:", error);
    return null;
  }
} 
