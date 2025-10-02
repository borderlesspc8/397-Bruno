import { createClient } from "../_lib/supabase";
import { useState, useEffect } from "react";

/**
 * Valida a sessão do usuário no lado do cliente usando Supabase Auth
 * @returns Usuário do Supabase ou null se inválido
 */
export async function validateSessionForClient() {
  try {
    console.log("[AUTH-CLIENT] Iniciando validação de sessão no cliente...");
    
    const supabase = createClient();
    console.log("[AUTH-CLIENT] Cliente Supabase criado");
    
    // Tentar obter a sessão primeiro
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log("[AUTH-CLIENT] Resultado getSession:", { 
      hasSession: !!session, 
      hasUser: !!session?.user,
      userId: session?.user?.id, 
      userEmail: session?.user?.email,
      error: sessionError?.message 
    });
    
    // Se temos sessão válida, usar ela
    if (session?.user && !sessionError) {
      console.log("[AUTH-CLIENT] Sessão válida encontrada, retornando usuário");
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
    console.log("[AUTH-CLIENT] Tentando getUser diretamente...");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("[AUTH-CLIENT] Resultado getUser:", { 
      hasUser: !!user, 
      userId: user?.id, 
      userEmail: user?.email,
      error: userError?.message 
    });
    
    if (userError || !user) {
      console.warn("[AUTH-CLIENT] Sessão inválida:", userError?.message || "Usuário não encontrado");
      return null;
    }
    
    console.log("[AUTH-CLIENT] Sessão válida via getUser, retornando usuário");
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0],
        image: user.user_metadata?.avatar_url,
      }
    };
  } catch (error) {
    console.error("[AUTH-CLIENT] Erro ao validar sessão no cliente:", error);
    return null;
  }
}

/**
 * Hook para validar sessão no cliente
 * @returns Objeto com usuário, loading e error
 */
export function useAuthValidation() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const session = await validateSessionForClient();
        
        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
          setError("Usuário não autenticado");
        }
      } catch (err) {
        console.error("Erro na validação de sessão:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  return { user, loading, error };
}
