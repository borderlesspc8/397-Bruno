import { toast } from "sonner";

interface ApiFetchOptions extends RequestInit {
  showErrorToast?: boolean;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

/**
 * Utilitário para fazer requisições fetch com timeout e retries
 */
export async function apiFetch<T = any>(
  url: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    showErrorToast = true,
    timeout = 30000, // 30 segundos de timeout padrão
    retries = 3,
    retryDelay = 1000,
    ...fetchOptions
  } = options;

  // Adiciona headers padrão se não fornecidos
  const headers = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  let attempt = 0;
  
  while (attempt < retries) {
    try {
      // Criar um AbortController para o timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });
      
      // Limpar o timeout após a resposta
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      attempt++;
      
      // Se for o último retry, lance o erro
      if (attempt >= retries) {
        if (showErrorToast) {
          toast.error(error.message || "Erro na requisição");
        }
        
        console.error(`[API_ERROR] ${url}:`, error);
        throw error;
      }
      
      // Aguardar antes de tentar novamente
      console.log(`Tentativa ${attempt}/${retries} falhou, tentando novamente em ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  // Este código nunca deve ser alcançado devido aos retries
  throw new Error("Erro inesperado na requisição");
} 
