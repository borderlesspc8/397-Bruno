import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";
import { redirect } from "next/navigation";
import { NextAuthOptions } from "next-auth";

/**
 * Função para obter a sessão de autenticação do usuário
 * Para compatibilidade com as mudanças entre versões do NextAuth
 */
export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  return { user: session?.user };
}

// Esta função pode ser necessária para páginas mais antigas que esperam 'auth()'
export const auth = getAuthSession;

export async function requireAuth() {
  const { user } = await getAuthSession();
  
  if (!user) {
    redirect("/auth");
  }
  
  return { user };
}

// Re-exportamos os authOptions para outras partes da aplicação
export { authOptions }; 