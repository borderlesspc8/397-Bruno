import { BBCredentials } from './types';
import { makeRequest } from './api-client';
import { createHttpsAgent } from './certificates';
import { prisma } from '../prisma';

/**
 * Obtém um token de acesso para uma conexão bancária
 * @param connectionIdOrToken ID da conexão ou token direto
 * @param walletId ID da carteira (opcional)
 * @returns Token de acesso
 */
export async function getAccessToken(connectionIdOrToken: string, walletId?: string): Promise<string> {
  try {
    // Se o connectionIdOrToken parece ser um token, retorná-lo diretamente
    if (connectionIdOrToken.length > 32) {
      return connectionIdOrToken;
    }

    // Buscar a carteira e seus metadados
    if (!walletId) {
      console.warn("[BB_AUTH] ID da carteira não fornecido");
      return "";
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId }
    });

    if (!wallet?.metadata) {
      console.warn("[BB_AUTH] Carteira não encontrada ou sem metadados");
      return "";
    }

    const metadata = wallet.metadata as Record<string, any>;
    
    // Verificar se temos as credenciais mínimas para prosseguir
    if (!metadata.clientBasic) {
      console.warn("[BB_AUTH] Credenciais insuficientes para continuar");
      return "";
    }

    return metadata.clientBasic;
  } catch (error) {
    console.error("[BB_AUTH] Erro ao obter token de acesso:", error);
    return "";
  }
}

/**
 * Obtém um token OAuth autenticado para uma conexão bancária
 * @param credentials Credenciais da conexão
 * @returns Token OAuth autenticado
 */
export async function getAuthToken(credentials: BBCredentials): Promise<string> {
  try {
    // Criar agente HTTPS com certificados
    const httpsAgent = createHttpsAgent(credentials.certPaths);

    // Fazer requisição para obter token
    const response = await makeRequest<{ access_token: string }>(
      "BB_AUTH",
      `${credentials.apiUrl || "https://api-extratos.bb.com.br/extratos/v1"}/oauth/token`,
      "POST",
      {
        'Authorization': `Basic ${credentials.clientBasic}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      httpsAgent,
      'grant_type=client_credentials'
    );

    return response.access_token;
  } catch (error) {
    console.error("[BB_AUTH] Erro ao obter token OAuth:", error);
    throw error;
  }
} 