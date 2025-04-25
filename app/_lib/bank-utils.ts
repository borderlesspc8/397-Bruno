/**
 * Utilitários para manipulação de carteiras bancárias
 */

import { prisma } from "./prisma";
import { BBIntegrationService } from "./bb-integration";

/**
 * Interface para credenciais do Banco do Brasil
 */
export interface BBCredentials {
  applicationKey: string;
  clientBasic: string;
  clientId: string;
  clientSecret: string;
  apiUrl: string;
  agencia: string;
  conta: string;
}

/**
 * Busca as credenciais completas de uma carteira bancária
 * Esta função garante que todas as credenciais necessárias estejam disponíveis
 */
export async function getBankCredentials(
  connectionId: string,
  walletId?: string
): Promise<BBCredentials | null> {
  try {
    console.log("[BANK_UTILS] Obtendo credenciais para", { connectionId, walletId });
    
    // Buscar a carteira e seus metadados
    if (!walletId) {
      console.warn("[BANK_UTILS] ID da carteira não fornecido");
      return null;
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: { bank: true }
    });

    if (!wallet?.metadata) {
      console.warn("[BANK_UTILS] Carteira não encontrada ou sem metadados");
      return null;
    }

    const metadata = wallet.metadata as Record<string, any>;
    
    // Verificar se temos as credenciais mínimas para prosseguir
    if (!metadata.applicationKey || !metadata.clientBasic) {
      console.warn("[BANK_UTILS] Credenciais insuficientes para continuar");
      return null;
    }

    // Log para diagnóstico
    console.log("[BANK_UTILS] Credenciais recuperadas:", {
      hasApplicationKey: !!metadata.applicationKey,
      hasClientBasic: !!metadata.clientBasic,
      hasClientId: !!metadata.clientId,
      hasClientSecret: !!metadata.clientSecret,
      hasAgencia: !!metadata.agencia,
      hasConta: !!metadata.conta
    });
    
    // Construir e retornar as credenciais completas
    return {
      applicationKey: metadata.applicationKey || "",
      clientBasic: metadata.clientBasic || "",
      clientId: metadata.clientId || "",
      clientSecret: metadata.clientSecret || "",
      apiUrl: metadata.apiUrl || "https://api-extratos.bb.com.br/extratos/v1",
      agencia: metadata.agencia || "",
      conta: metadata.conta || ""
    };
  } catch (error) {
    console.error("[BANK_UTILS] Erro ao obter credenciais:", error);
    return null;
  }
}

/**
 * Testa a conexão com o banco usando as credenciais fornecidas
 */
export async function testBankConnection(
  connectionId: string,
  walletId: string
): Promise<{ 
  success: boolean; 
  message: string; 
  data?: any;
  error?: string;
  statusCode?: number;
}> {
  try {
    console.log("[BANK_UTILS] Testando conexão bancária:", { connectionId, walletId });

    // Obter credenciais
    const credentials = await getBankCredentials(connectionId, walletId);
    if (!credentials) {
      return {
        success: false,
        message: "Credenciais não encontradas",
        error: "CREDENTIALS_NOT_FOUND"
      };
    }

    // Criar instância do serviço de integração
    const bbService = BBIntegrationService.getInstance();

    // Especificar período de teste (últimos 7 dias)
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - 7);
    
    // Formatar datas para o formato DDMMAAAA
    const formatDate = (date: Date) => {
      const dia = date.getDate().toString();
      const mes = (date.getMonth() + 1).toString().padStart(2, '0');
      const ano = date.getFullYear();
      return `${dia}${mes}${ano}`;
    };

    const dataInicioFormatada = formatDate(dataInicio);
    const dataFimFormatada = formatDate(dataFim);

    try {
      // Tentar obter extrato com período limitado
      const extract = await bbService.getExtract(
        credentials.agencia,
        credentials.conta,
        connectionId,
        credentials.applicationKey,
        {
          dataInicio: dataInicioFormatada,
          dataFim: dataFimFormatada,
          numeroPagina: 1,
          quantidadeRegistros: 50,
          walletId: walletId
        }
      );

      return {
        success: true,
        message: `Conexão testada com sucesso. ${extract.quantidadeTotalRegistro} transações disponíveis no período.`,
        data: {
          totalTransactions: extract.quantidadeTotalRegistro,
          totalPages: extract.quantidadeTotalPagina
        }
      };
    } catch (error) {
      console.error("[BANK_UTILS] Erro ao testar conexão:", error);
      return {
        success: false,
        message: "Erro ao testar conexão",
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
      };
    }
  } catch (error) {
    console.error("[BANK_UTILS] Erro ao testar conexão:", error);
    return {
      success: false,
      message: "Erro ao testar conexão",
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR"
    };
  }
} 