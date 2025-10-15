import { getCurrentUser as getSupabaseUser } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Função para obter a sessão de autenticação do usuário
 * Para compatibilidade com as mudanças entre versões do NextAuth
 */
export async function getAuthSession() {
  try {
    const user = await getSupabaseUser();
    return user ? { user } : null;
  } catch (error) {
    console.error("Erro ao obter sessão de autenticação:", error);
    return null;
  }
}

// Esta função pode ser necessária para páginas mais antigas que esperam 'auth()'
export const auth = getAuthSession;

export async function requireAuth() {
  const user = await getSupabaseUser();
  
  if (!user) {
      redirect("/auth");
  }
  
  return { user };
}

// Função para obter o usuário atual (compatibilidade)
export async function getCurrentUser() {
  return await getSupabaseUser();
}
