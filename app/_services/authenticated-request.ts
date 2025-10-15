import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth";

/**
 * Realiza uma requisição autenticada para endpoints internos da API
 * usando o cookie de sessão do servidor atual
 */
export async function authenticatedRequest(url: string, options: RequestInit = {}) {
  // Obter sessão do usuário
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("Usuário não autenticado");
  }
  
  // Prepara a URL - se for um caminho relativo, adiciona o host
  const fullUrl = url.startsWith('/') 
    ? `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}${url}` 
    : url;
  
  // Fazer a requisição
  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Cookie': `next-auth.session-token=${session}`
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`);
  }
  
  return await response.json();
} 
