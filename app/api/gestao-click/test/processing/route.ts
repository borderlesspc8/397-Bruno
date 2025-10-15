import { NextResponse } from 'next/server';
import { processarVenda } from '@/app/_utils/venda-processor';

/**
 * Dados de exemplo para testar o processamento de venda
 */
const mockVendaData = {
  id: "12345",
  codigo: "V-2023-001",
  data: "2023-04-22T00:00:00",
  cliente_id: "C-789",
  nome_cliente: "Empresa XYZ Ltda",
  valor_total: "2610.00",
  nome_situacao: "Concretizada",
  nome_vendedor: "João da Silva",
  
  // Produtos com formato variado para testar a robustez
  produtos: [
    {
      nome_produto: "RACK PAREDE BARRA GUIADA",
      codigo_interno: "2039402761767",
      quantidade: "1",
      valor_venda: "2610.00",
      valor_total: "2610.00"
    },
    {
      produto: {
        nome: "BIKE SPINNING EMBREEX 344",
        codigo: "2094090315203",
        qtd: "1",
        valorUnitario: "8974.00",
        valorTotal: "8974.00"
      }
    },
    {
      produto_id: "75945452",
      nome: "EXTENSOR FUNCIONAL INTENSIDADE LEVE",
      quantidade: "2",
      preco_unitario: "179.38",
      total: "358.76"
    }
  ],
  
  // Pagamentos com formato variado para testar a robustez
  pagamentos: [
    {
      forma_pagamento: "Dinheiro",
      data_vencimento: "2023-04-22T00:00:00",
      valor: "1000.00",
      parcelas: "1"
    },
    {
      pagamento: {
        nome_forma_pagamento: "Cartão de Crédito",
        dataVencimento: "2023-05-22T00:00:00",
        valor: "1610.00",
        parcelas: "2"
      }
    },
    {
      forma_pagamento_id: "3",
      nome: "Boleto Bancário",
      data: "2023-06-22T00:00:00",
      valor: "8332.76",
      parcelas: "1"
    }
  ],
  
  condicao_pagamento: "a_vista",
  valor_frete: "0.00",
  nome_canal_venda: "Presencial",
  nome_loja: "Personal Prime MATRI"
};

/**
 * POST /api/gestao-click/test/processing
 * Rota para testar o processamento de uma venda
 * Você pode enviar uma venda no corpo da requisição ou usar a venda de exemplo
 */
export async function POST(request: Request) {
  try {
    let vendaData = mockVendaData;
    
    // Verificar se a requisição tem corpo
    try {
      const body = await request.json();
      if (body && Object.keys(body).length > 0) {
        vendaData = body;
      }
    } catch (error) {
      // Se não conseguir processar o corpo da requisição, usa os dados de exemplo
      console.log("Usando dados de exemplo para o teste de processamento");
    }
    
    // Processar a venda usando a função processarVenda
    const vendaProcessada = processarVenda(vendaData);
    
    // Resultado do teste
    return NextResponse.json({
      success: true,
      original: vendaData,
      processed: vendaProcessada,
      products: {
        count: vendaProcessada?.produtos?.length || 0,
        details: vendaProcessada?.produtos || []
      },
      payments: {
        count: vendaProcessada?.pagamentos?.length || 0,
        details: vendaProcessada?.pagamentos || []
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * GET /api/gestao-click/test/processing
 * Versão GET da rota para facilitar testes via navegador
 */
export async function GET() {
  try {
    // Processar a venda usando a função processarVenda
    const vendaProcessada = processarVenda(mockVendaData);
    
    // Resultado do teste
    return NextResponse.json({
      success: true,
      original: mockVendaData,
      processed: vendaProcessada,
      products: {
        count: vendaProcessada?.produtos?.length || 0,
        details: vendaProcessada?.produtos || []
      },
      payments: {
        count: vendaProcessada?.pagamentos?.length || 0,
        details: vendaProcessada?.pagamentos || []
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
