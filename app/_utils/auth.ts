import { getServerSession } from "next-auth/next";
import { authOptions } from "../_lib/auth-options";

/**
 * Valida a sessão do usuário para chamadas de API
 * @returns Sessão do usuário ou null se inválida
 */
export async function validateSessionForAPI() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.warn("[AUTH] Sessão inválida: ID do usuário ausente");
      return null;
    }
    
    return session;
  } catch (error) {
    console.error("[AUTH] Erro ao validar sessão para API:", error);
    return null;
  }
} 