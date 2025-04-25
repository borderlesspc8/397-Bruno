/**
 * Arquivo de teste para verificar a funcionalidade de processamento de parcelas
 * Este script simula diferentes cenários de resposta da API para garantir que o tratamento
 * de parcelas está funcionando corretamente
 */

import { installmentHandler } from "../handlers/installment-handler";
import { prisma } from "@/app/_lib/prisma";
import { GestaoClickInstallment, GestaoClickSale } from "../types";

// Função para simular o processamento de parcelas
export async function testarProcessamentoParcelas(userId: string, options: {
  saleId?: string;
  installmentId?: string;
  mockApiResponse?: any;
  forceErrorApi?: boolean;
  forceEmptyResult?: boolean;
  forceInvalidFormat?: boolean;
}) {
  console.log("[TESTE] Iniciando teste de processamento de parcelas");
  
  // Usar valores padrão se não fornecidos
  const saleId = options.saleId || `test-sale-${Date.now()}`;
  const installmentId = options.installmentId || `test-inst-${Date.now()}`;
  
  // Criar dados do evento de teste
  const eventData = {
    id: installmentId,
    parcelaId: installmentId,
    vendaId: saleId,
    saleId: saleId,
    valor: 100,
    status: "PENDENTE",
    data_vencimento: new Date().toISOString(),
    // Flag especial para indicar que é um teste
    _isTest: true,
    // Mock da resposta da API
    _mockApiResponse: options.mockApiResponse,
    _forceErrorApi: options.forceErrorApi,
    _forceEmptyResult: options.forceEmptyResult,
    _forceInvalidFormat: options.forceInvalidFormat
  };
  
  // Substituir o método original de busca de parcelas com uma versão de teste
  const originalMethod = installmentHandler.buscarParcelasDaVenda;
  installmentHandler.buscarParcelasDaVenda = async (saleId: string, settings: any): Promise<GestaoClickInstallment[]> => {
    console.log(`[TESTE] Interceptando chamada buscarParcelasDaVenda para saleId ${saleId}`);
    
    // Se opção para forçar erro está ativa
    if (options.forceErrorApi) {
      console.log("[TESTE] Simulando erro na API");
      throw new Error("Erro simulado da API");
    }
    
    // Se opção para forçar resultado vazio está ativa
    if (options.forceEmptyResult) {
      console.log("[TESTE] Simulando resposta vazia");
      return [];
    }
    
    // Se opção para forçar formato inválido está ativa
    if (options.forceInvalidFormat) {
      console.log("[TESTE] Simulando formato inválido");
      return [null, undefined, {} as any];
    }
    
    // Usar resposta simulada, se fornecida
    if (options.mockApiResponse) {
      console.log("[TESTE] Retornando resposta mockada");
      return options.mockApiResponse;
    }
    
    // Caso contrário, criar um conjunto padrão de parcelas para teste
    console.log("[TESTE] Retornando parcelas padrão de teste");
    const parcelas: GestaoClickInstallment[] = [
      {
        id: installmentId,
        numero: 1,
        valor: 100,
        data_vencimento: new Date().toISOString(),
        status: "PENDENTE"
      },
      {
        id: `${installmentId}-2`,
        numero: 2,
        valor: 100,
        data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "PENDENTE"
      }
    ];
    
    return parcelas;
  };
  
  try {
    // Verificar se o usuário existe, caso contrário criar um usuário de teste
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userExists) {
      console.log(`[TESTE] Criando usuário de teste ${userId}`);
      await prisma.user.create({
        data: {
          id: userId,
          name: "Usuário de Teste",
          email: `test-${Date.now()}@example.com`
        }
      });
    }
    
    // Criar carteira de configurações se não existir
    const configWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "SETTINGS"
      }
    });
    
    if (!configWallet) {
      console.log(`[TESTE] Criando carteira de configurações para ${userId}`);
      await prisma.wallet.create({
        data: {
          userId,
          name: "GESTAO_CLICK_GLOBAL",
          type: "SETTINGS",
          balance: 0,
          metadata: {
            gestaoClick: {
              apiKey: "api_key_test",
              secretToken: "secret_token_test",
              apiUrl: "https://api.teste.com",
              testMode: true
            }
          }
        }
      });
    }
    
    // Criar carteira de integração se não existir
    const integrationWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "CHECKING"
      }
    });
    
    if (!integrationWallet) {
      console.log(`[TESTE] Criando carteira de integração para ${userId}`);
      await prisma.wallet.create({
        data: {
          userId,
          name: "GESTAO_CLICK_GLOBAL",
          type: "CHECKING",
          balance: 0,
          metadata: {
            testMode: true
          }
        }
      });
    }
    
    // Executar o processamento de parcelas
    console.log("[TESTE] Executando processInstallmentEvent");
    const resultado = await installmentHandler.processInstallmentEvent("installment.created", eventData, userId);
    
    console.log("[TESTE] Resultado:", resultado);
    
    // Restaurar o método original
    installmentHandler.buscarParcelasDaVenda = originalMethod;
    
    // Verificar o resultado
    if (resultado === false) {
      console.log("[TESTE] Falha no processamento de parcelas");
      return { success: false, message: "Falha no processamento de parcelas" };
    }
    
    console.log("[TESTE] Processamento de parcelas bem-sucedido");
    return {
      success: true,
      message: "Teste concluído com sucesso",
      resultado
    };
  } catch (error) {
    console.error("[TESTE] Erro durante o teste:", error);
    
    // Restaurar o método original mesmo em caso de erro
    installmentHandler.buscarParcelasDaVenda = originalMethod;
    
    return {
      success: false,
      message: "Erro durante o teste",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Função para testar todos os cenários
export async function executarTestesCompletos(userId: string) {
  console.log("\n==== Iniciando testes completos de parcelas ====\n");
  
  const resultados = [];
  
  // Teste 1: Cenário padrão - deve funcionar normalmente
  console.log("\n==> TESTE 1: Cenário padrão");
  resultados.push({
    teste: "Cenário padrão",
    resultado: await testarProcessamentoParcelas(userId, {})
  });
  
  // Teste 2: Erro na API
  console.log("\n==> TESTE 2: Erro na API");
  resultados.push({
    teste: "Erro na API",
    resultado: await testarProcessamentoParcelas(userId, { forceErrorApi: true })
  });
  
  // Teste 3: Resultado vazio
  console.log("\n==> TESTE 3: Resultado vazio");
  resultados.push({
    teste: "Resultado vazio",
    resultado: await testarProcessamentoParcelas(userId, { forceEmptyResult: true })
  });
  
  // Teste 4: Formato inválido
  console.log("\n==> TESTE 4: Formato inválido");
  resultados.push({
    teste: "Formato inválido",
    resultado: await testarProcessamentoParcelas(userId, { forceInvalidFormat: true })
  });
  
  // Teste 5: Resposta mockada personalizada
  console.log("\n==> TESTE 5: Resposta mockada personalizada");
  resultados.push({
    teste: "Resposta mockada",
    resultado: await testarProcessamentoParcelas(userId, {
      mockApiResponse: [
        {
          id: `custom-${Date.now()}`,
          numero: 1,
          valor: 250,
          data_vencimento: new Date().toISOString(),
          status: "PAGO",
          data_pagamento: new Date().toISOString()
        }
      ]
    })
  });
  
  console.log("\n==== Resumo dos testes ====\n");
  resultados.forEach((r, i) => {
    console.log(`Teste ${i+1} (${r.teste}): ${r.resultado.success ? 'SUCESSO' : 'FALHA'}`);
  });
  
  return {
    success: resultados.every(r => r.resultado.success),
    resultados
  };
} 