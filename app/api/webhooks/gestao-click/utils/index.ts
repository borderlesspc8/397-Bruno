/**
 * Utilitários para o webhook do Gestão Click
 */

import { prisma } from "@/app/_lib/prisma";
import { WalletType, TransactionType } from "@prisma/client";

/**
 * Mapeia status do Gestão Click para o sistema
 */
export function mapInstallmentStatus(status: string): string {
  // Normalizar string removendo acentos e convertendo para minúsculas
  const normalizedStatus = status.toString().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  if (normalizedStatus.includes("pag") || normalizedStatus.includes("liquidado")) {
    return "PAID";
  } else if (normalizedStatus.includes("atraso") || normalizedStatus.includes("vencido")) {
    return "OVERDUE";
  } else if (normalizedStatus.includes("cancel")) {
    return "CANCELED";
  } else {
    return "PENDING";
  }
}

/**
 * Mapeia categorias do Gestão Click para o nosso sistema
 * Isso garante que as transações sejam classificadas corretamente
 */
export function mapGestaoClickCategoryToType(category: string, amount: number): {
  type: TransactionType;
  category: string;
} {
  // Normalizar a categoria para facilitar a comparação
  const normalizedCategory = category.toString().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

  // Mapeamento específico para categorias da DRE do Gestão Click
  
  // RECEITAS
  if (
    normalizedCategory.includes("receita bruta") || 
    normalizedCategory.includes("venda") || 
    normalizedCategory.includes("faturamento") ||
    normalizedCategory.includes("receitas de vendas")
  ) {
    return {
      type: "DEPOSIT",
      category: "Receitas de Vendas"
    };
  } 
  
  // DEDUÇÕES
  else if (
    normalizedCategory.includes("deducoes") || 
    normalizedCategory.includes("imposto sobre venda") || 
    normalizedCategory.includes("comissoes sobre venda") ||
    normalizedCategory.includes("devolucao")
  ) {
    return {
      type: "EXPENSE",
      category: "Deduções da Receita"
    };
  } 
  
  // CUSTOS OPERACIONAIS
  else if (
    normalizedCategory.includes("custo operacional") || 
    normalizedCategory.includes("custo dos produtos vendidos") ||
    normalizedCategory.includes("custo das mercadorias vendidas") ||
    normalizedCategory.includes("cmv")
  ) {
    return {
      type: "EXPENSE",
      category: "Custos Operacionais"
    };
  } 
  
  // DESPESAS OPERACIONAIS
  else if (
    normalizedCategory.includes("despesa") && 
    (
      normalizedCategory.includes("operacional") || 
      normalizedCategory.includes("administrativa") ||
      normalizedCategory.includes("comercial")
    )
  ) {
    return {
      type: "EXPENSE",
      category: "Despesas Operacionais"
    };
  } 
  
  // DESPESAS FINANCEIRAS
  else if (
    normalizedCategory.includes("despesa") && 
    (
      normalizedCategory.includes("financeira") ||
      normalizedCategory.includes("juro") ||
      normalizedCategory.includes("taxa") ||
      normalizedCategory.includes("tarifa bancaria")
    )
  ) {
    return {
      type: "EXPENSE",
      category: "Despesas Financeiras"
    };
  } 
  
  // RECEITAS FINANCEIRAS
  else if (
    normalizedCategory.includes("receita") && 
    (
      normalizedCategory.includes("financeira") ||
      normalizedCategory.includes("rendimento") ||
      normalizedCategory.includes("juro recebido") ||
      normalizedCategory.includes("desconto recebido")
    )
  ) {
    return {
      type: "INCOME",
      category: "Receitas Financeiras"
    };
  } 
  
  // OUTRAS RECEITAS
  else if (
    (normalizedCategory.includes("outra") && normalizedCategory.includes("receita")) ||
    normalizedCategory.includes("receita extraordinaria")
  ) {
    return {
      type: "INCOME",
      category: "Outras Receitas"
    };
  } 
  
  // OUTRAS DESPESAS
  else if (
    (normalizedCategory.includes("outra") && normalizedCategory.includes("despesa")) ||
    normalizedCategory.includes("despesa extraordinaria")
  ) {
    return {
      type: "EXPENSE",
      category: "Outras Despesas"
    };
  } 
  
  // INVESTIMENTOS
  else if (
    normalizedCategory.includes("investimento") || 
    normalizedCategory.includes("aplicacao")
  ) {
    return {
      type: "INVESTMENT",
      category: "Investimentos"
    };
  } 
  
  // VALOR PADRÃO BASEADO NO SINAL
  else {
    // Valor positivo = receita, valor negativo = despesa
    if (amount >= 0) {
      return {
        type: "DEPOSIT",
        category: "Receitas Diversas"
      };
    } else {
      return {
        type: "EXPENSE",
        category: "Despesas Diversas"
      };
    }
  }
}

/**
 * Obtém configurações do Gestão Click
 */
export async function getGestaoClickSettings(userId: string) {
  try {
    // Buscar as configurações globais
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: userId,
        type: "SETTINGS" as WalletType,
        name: "GESTAO_CLICK_GLOBAL"
      },
      select: {
        metadata: true
      }
    });
    
    if (!wallet || !wallet.metadata) {
      // Em modo de desenvolvimento/teste, permitir usar sem configurações
      if (process.env.NODE_ENV === "development") {
        return {
          apiKey: "api_key_test",
          apiUrl: "https://api.teste.com",
          testMode: true
        };
      }
      return null;
    }

    // @ts-ignore - O prisma trata o campo metadata como any
    return wallet.metadata.gestaoClick || null;
  } catch (error) {
    console.error("Erro ao obter configurações:", error);
    return null;
  }
} 