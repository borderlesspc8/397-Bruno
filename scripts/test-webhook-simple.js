/**
 * Script para testar o endpoint do webhook
 * Envia requisições de teste para o webhook com dados de exemplo
 */

import fetch from 'node-fetch';

// Dados de exemplo para uma parcela
const installmentData = {
  event: "installment.created",
  userId: "test123",
  data: {
    id: "12345",
    vendaId: "67890",
    numero: 1,
    valor: 250.00,
    data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "pendente"
  }
};

// Dados de exemplo para uma venda
const saleData = {
  event: "sale.created",
  userId: "test123",
  data: {
    id: "67890",
    codigo: "VENDA-67890",
    valor_total: 1000.00,
    valor_liquido: 950.00,
    status: "concluída",
    data_venda: new Date().toISOString(),
    cliente: {
      id: "9876",
      nome: "Cliente de Teste"
    },
    loja: {
      id: "5432",
      nome: "Loja de Teste"
    },
    forma_pagamento: "Cartão de Crédito",
    parcelas: [
      {
        id: "12345-1",
        numero: 1,
        valor: 250.00,
        data_vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pendente"
      },
      {
        id: "12345-2",
        numero: 2,
        valor: 250.00,
        data_vencimento: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pendente"
      },
      {
        id: "12345-3",
        numero: 3,
        valor: 250.00,
        data_vencimento: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pendente"
      },
      {
        id: "12345-4",
        numero: 4,
        valor: 250.00,
        data_vencimento: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pendente"
      }
    ]
  }
};

/**
 * Função para testar o webhook
 */
async function testWebhook() {
  console.log("🧪 INICIANDO TESTE DO WEBHOOK");
  console.log("-------------------------------------");
  
  try {
    // 1. Testar evento de parcela
    console.log("✅ Enviando evento de parcela...");
    console.log(JSON.stringify(installmentData, null, 2));
    
    const installmentResponse = await fetch('http://localhost:3000/api/test-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(installmentData),
    });
    
    const installmentResult = await installmentResponse.json();
    
    console.log(`📬 Resposta (${installmentResponse.status}):`);
    console.log(JSON.stringify(installmentResult, null, 2));
    console.log("-------------------------------------");
    
    // Aguardar 2 segundos entre as requisições
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Testar evento de venda
    console.log("✅ Enviando evento de venda...");
    console.log(JSON.stringify(saleData, null, 2));
    
    const saleResponse = await fetch('http://localhost:3000/api/test-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(saleData),
    });
    
    const saleResult = await saleResponse.json();
    
    console.log(`📬 Resposta (${saleResponse.status}):`);
    console.log(JSON.stringify(saleResult, null, 2));
    
    console.log("-------------------------------------");
    console.log("🎉 TESTE CONCLUÍDO");
    
  } catch (error) {
    console.error("❌ ERRO NO TESTE:", error);
  }
}

// Executar teste
testWebhook(); 