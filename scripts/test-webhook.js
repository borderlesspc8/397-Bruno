// Script para testar o webhook de processamento de parcelas
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

// Mapeamento de status para InstallmentStatus
function mapInstallmentStatus(status) {
  // Normalizar string removendo acentos e convertendo para minúsculas
  const normalizedStatus = status.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

// Obtém as configurações do Gestão Click
async function getGestaoClickSettings(userId) {
  try {
    // Buscar as configurações globais
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: userId,
        type: "SETTINGS",
        name: "GESTAO_CLICK_GLOBAL"
      },
      select: {
        metadata: true
      }
    });
    
    if (!wallet || !wallet.metadata) {
      console.log("Configurações não encontradas, criando configurações de teste");
      return {
        apiKey: "api_key_test",
        apiUrl: "https://api.teste.com",
        testMode: true
      };
    }

    return wallet.metadata.gestaoClick || {
      apiKey: "api_key_test",
      apiUrl: "https://api.teste.com",
      testMode: true
    };
  } catch (error) {
    console.error("Erro ao obter configurações:", error);
    return {
      apiKey: "api_key_test",
      apiUrl: "https://api.teste.com",
      testMode: true
    };
  }
}

// Função para criar uma carteira de teste
async function createTestWallet(userId) {
  try {
    const existingWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_TEST"
      }
    });
    
    if (existingWallet) {
      console.log("Carteira de teste já existe:", existingWallet.id);
      return existingWallet;
    }
    
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        name: "GESTAO_CLICK_TEST",
        balance: 0,
        type: "CHECKING",
        isActive: true,
        metadata: {
          isTestWallet: true
        }
      }
    });
    
    console.log("Carteira de teste criada:", wallet.id);
    return wallet;
  } catch (error) {
    console.error("Erro ao criar carteira de teste:", error);
    throw error;
  }
}

// Função principal do script
async function main() {
  try {
    // Criar ou obter usuário de teste
    const testUserId = "test123";
    const existingUser = await prisma.user.findUnique({
      where: { id: testUserId }
    });
    
    if (!existingUser) {
      console.log("Criando usuário de teste");
      await prisma.user.create({
        data: {
          id: testUserId,
          email: "test@example.com",
          name: "Usuário de Teste"
        }
      });
    }
    
    // Criar ou obter carteira de teste
    const wallet = await createTestWallet(testUserId);
    
    // Criar configurações do Gestão Click
    const settings = await getGestaoClickSettings(testUserId);
    if (!settings) {
      console.log("Criando configurações de teste");
      await prisma.wallet.create({
        data: {
          userId: testUserId,
          name: "GESTAO_CLICK_GLOBAL",
          type: "SETTINGS",
          balance: 0,
          metadata: {
            gestaoClick: {
              apiKey: "api_key_test",
              apiUrl: "https://api.teste.com",
              testMode: true
            }
          }
        }
      });
    }
    
    // Criar dados de teste para o webhook
    const saleId = "TESTE-1234";
    const installmentData = {
      event: "installment.created",
      userId: testUserId,
      saleId: saleId,
      parcelaId: "PARC-001",
      numero: 1,
      valor: 100.00,
      data_vencimento: "2025-02-28",
      status: "PENDENTE",
      _realProcessing: true
    };
    
    // Enviar o evento para o webhook
    console.log("Enviando dados para o webhook:", JSON.stringify(installmentData, null, 2));
    
    try {
      // Testar localmente
      const response = await axios.post('http://localhost:3000/api/webhooks/gestao-click', installmentData);
      console.log("Resposta do webhook:", response.status, response.data);
    } catch (error) {
      console.error("Erro ao chamar o webhook:", error.response?.status, error.response?.data || error.message);
    }
    
    // Verificar se a parcela foi criada
    const installments = await prisma.installment.findMany({
      where: {
        userId: testUserId,
        externalId: { contains: saleId }
      }
    });
    
    console.log(`Foram encontradas ${installments.length} parcelas criadas pelo webhook:`);
    console.log(JSON.stringify(installments, null, 2));
    
  } catch (error) {
    console.error("Erro durante a execução do script:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
main(); 