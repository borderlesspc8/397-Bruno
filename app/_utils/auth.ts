import { createClient } from "../_lib/supabase-server";
import { NextRequest } from "next/server";

/**
 * Valida a sessão do usuário para chamadas de API usando Supabase Auth
 * @param request - Requisição Next.js (opcional, para debug)
 * @returns Usuário do Supabase ou null se inválido
 */
export async function validateSessionForAPI(request?: NextRequest) {
  try {
    console.log("[AUTH] Iniciando validação de sessão...");
    
    // Debug: mostrar headers da requisição se disponível
    if (request) {
      const authHeader = request.headers.get('authorization');
      const cookieHeader = request.headers.get('cookie');
      console.log("[AUTH] Headers da requisição:", {
        hasAuthHeader: !!authHeader,
        hasCookieHeader: !!cookieHeader,
        cookieLength: cookieHeader?.length || 0,
        cookies: cookieHeader ? cookieHeader.split(';').map(c => c.trim().split('=')[0]) : []
      });
    }
    
    const supabase = createClient();
    console.log("[AUTH] Cliente Supabase criado");
    
    // Tentar obter a sessão primeiro
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log("[AUTH] Resultado getSession:", { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userId: session?.user?.id, 
      userEmail: session?.user?.email,
      error: sessionError?.message 
    });
    
    // Se temos sessão válida, usar ela
    if (session?.user && !sessionError) {
      console.log("[AUTH] Sessão válida encontrada, retornando usuário");
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
    console.log("[AUTH] Tentando getUser diretamente...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("[AUTH] Resultado getUser:", { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      error: userError?.message 
    });
    
    if (userError || !user) {
      console.warn("[AUTH] Sessão inválida:", userError?.message || "Usuário não encontrado");
      return null;
    }
    
    console.log("[AUTH] Sessão válida via getUser, retornando usuário");
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        image: user.user_metadata?.avatar_url,
      }
    };
  } catch (error) {
    console.error("[AUTH] Erro ao validar sessão para API:", error);
    return null;
  }
} 
