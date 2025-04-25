// Script simples para testar o webhook
import axios from 'axios';

// Dados de teste para o webhook
const saleData = {
  event: "sale.created",
  userId: "test123",
  data: {
    id: "VENDA-1234",
    codigo: "VENDA-1234",
    referencia: "REF-1234",
    valor_total: 1000.00,
    valor_liquido: 950.00,
    data: "2024-06-20",
    status: "CONCLUIDA",
    cliente: {
      id: 5001,
      nome: "Cliente de Teste"
    },
    loja: {
      id: 2001,
      nome: "Loja Principal"
    },
    forma_pagamento: {
      nome: "Cartão de Crédito"
    },
    parcelas: [
      {
        id: "PARCELA-001",
        numero: 1,
        valor: 333.33,
        data_vencimento: "2024-07-20",
        status: "PENDENTE"
      },
      {
        id: "PARCELA-002",
        numero: 2,
        valor: 333.33,
        data_vencimento: "2024-08-20",
        status: "PENDENTE"
      },
      {
        id: "PARCELA-003",
        numero: 3,
        valor: 333.34,
        data_vencimento: "2024-09-20",
        status: "PENDENTE"
      }
    ],
    _realProcessing: true
  }
};

// Função para testar o webhook
async function testWebhook() {
  try {
    console.log("Enviando dados para o webhook:", JSON.stringify(saleData, null, 2));
    
    // Enviar para o webhook
    const response = await axios.post('http://localhost:3000/api/webhooks/gestao-click', saleData);
    console.log("Resposta do webhook:", response.status, response.data);
  } catch (error) {
    console.error("Erro ao chamar o webhook:", error.response?.status, error.response?.data || error.message);
  }
}

// Executar o teste
testWebhook(); 