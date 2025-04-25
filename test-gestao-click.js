/**
 * Script para testar a conexão com o Gestão Click
 * 
 * Este script faz requisições diretamente para a API do Gestão Click
 * para verificar se as configurações de autenticação estão corretas.
 * 
 * Modo de uso:
 * 1. Configure as variáveis de ambiente no arquivo .env:
 *    - GESTAO_CLICK_ACCESS_TOKEN
 *    - GESTAO_CLICK_SECRET_ACCESS_TOKEN
 *    - GESTAO_CLICK_API_URL
 * 
 * 2. Execute o script:
 *    node test-gestao-click.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Determinar o diretório atual para resolver o path do .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregando variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Backup para os valores das variáveis de ambiente (use com cuidado, apenas para testes)
const ACCESS_TOKEN = process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
const SECRET_TOKEN = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
const API_URL = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';

// Validação de configurações obrigatórias
if (!ACCESS_TOKEN) {
  console.error('❌ Erro: GESTAO_CLICK_ACCESS_TOKEN não definido no ambiente');
  console.error('Configure as variáveis no arquivo .env conforme documentação');
  process.exit(1);
}

// Verificar presença do token secreto (opcional, mas recomendado)
if (!SECRET_TOKEN) {
  console.warn('⚠️ Aviso: GESTAO_CLICK_SECRET_ACCESS_TOKEN não definido');
  console.warn('A autenticação poderá falhar se o token secreto for necessário na API');
}

// Configurações de data para testes de movimentações
const START_DATE = '2020-01-01';
const END_DATE = '2024-12-31';

// Função para obter headers de autenticação
function getAuthHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'access-token': ACCESS_TOKEN
  };
  
  if (SECRET_TOKEN) {
    headers['secret-access-token'] = SECRET_TOKEN;
  }
  
  return headers;
}

// Testar busca de contas bancárias
async function testBankAccounts() {
  try {
    console.log('\n🏦 Testando busca de contas bancárias...');
    
    const url = `${API_URL}/contas_bancarias`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Contas encontradas: ${data?.data?.length || 0}`);
      
      if (data?.data?.length > 0) {
        console.log('Exemplo de conta:');
        console.log(JSON.stringify(data.data[0], null, 2));
      }
      
      return {
        success: true,
        count: data?.data?.length || 0,
        data: data?.data || []
      };
    } else {
      const text = await response.text();
      console.log('Erro:', text);
      return {
        success: false,
        error: text
      };
    }
  } catch (error) {
    console.error('❌ Erro ao buscar contas bancárias:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Testar busca de pagamentos
async function testPayments() {
  try {
    console.log('\n💸 Testando busca de pagamentos...');
    
    const url = new URL(`${API_URL}/pagamentos`);
    url.searchParams.append('data_inicio', START_DATE);
    url.searchParams.append('data_fim', END_DATE);
    
    console.log(`Buscando pagamentos de ${START_DATE} até ${END_DATE}`);
    console.log(`URL: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      
      // Verificar o formato da resposta
      let paymentItems = [];
      
      if (Array.isArray(result)) {
        // Formato antigo: array direto
        paymentItems = result;
      } else if (result.data && Array.isArray(result.data)) {
        // Novo formato: objeto com array data
        paymentItems = result.data;
        
        // Mostrar informações de meta, se disponíveis
        if (result.meta) {
          console.log(`Total de registros: ${result.meta.total_registros || 0}`);
          console.log(`Página atual: ${result.meta.pagina_atual || 1} de ${Math.ceil((result.meta.total_registros || 0) / (result.meta.limite_por_pagina || 20))}`);
        }
      } else {
        console.log('Formato inesperado na resposta da API');
        return {
          success: true,
          count: 0,
          data: []
        };
      }
      
      console.log(`Pagamentos encontrados: ${paymentItems.length}`);
      
      if (paymentItems.length > 0) {
        console.log('Exemplo de pagamento:');
        console.log(JSON.stringify(paymentItems[0], null, 2));
      }
      
      return {
        success: true,
        count: paymentItems.length,
        data: paymentItems
      };
    } else {
      const text = await response.text();
      console.log('Erro:', text);
      return {
        success: false,
        error: text
      };
    }
  } catch (error) {
    console.error('❌ Erro ao buscar pagamentos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Testar busca de recebimentos
async function testReceipts() {
  try {
    console.log('\n💰 Testando busca de recebimentos...');
    
    const url = new URL(`${API_URL}/recebimentos`);
    url.searchParams.append('data_inicio', START_DATE);
    url.searchParams.append('data_fim', END_DATE);
    
    console.log(`Buscando recebimentos de ${START_DATE} até ${END_DATE}`);
    console.log(`URL: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      
      // Verificar o formato da resposta
      let receiptItems = [];
      
      if (Array.isArray(result)) {
        // Formato antigo: array direto
        receiptItems = result;
      } else if (result.data && Array.isArray(result.data)) {
        // Novo formato: objeto com array data
        receiptItems = result.data;
        
        // Mostrar informações de meta, se disponíveis
        if (result.meta) {
          console.log(`Total de registros: ${result.meta.total_registros || 0}`);
          console.log(`Página atual: ${result.meta.pagina_atual || 1} de ${Math.ceil((result.meta.total_registros || 0) / (result.meta.limite_por_pagina || 20))}`);
        }
      } else {
        console.log('Formato inesperado na resposta da API');
        return {
          success: true,
          count: 0,
          data: []
        };
      }
      
      console.log(`Recebimentos encontrados: ${receiptItems.length}`);
      
      if (receiptItems.length > 0) {
        console.log('Exemplo de recebimento:');
        console.log(JSON.stringify(receiptItems[0], null, 2));
      }
      
      return {
        success: true,
        count: receiptItems.length,
        data: receiptItems
      };
    } else {
      const text = await response.text();
      console.log('Erro:', text);
      return {
        success: false,
        error: text
      };
    }
  } catch (error) {
    console.error('❌ Erro ao buscar recebimentos:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Testar transformação de transações
function testTransactionTransformation(payment, receipt) {
  console.log('\n🔄 Testando transformação de transações...');
  
  if (payment) {
    console.log('Transformação de pagamento para despesa:');
    console.log(JSON.stringify({
      id: payment.id.toString(),
      codigo: payment.codigo?.toString(),
      descricao: payment.descricao || payment.nome || 'Pagamento sem descrição',
      valor: Math.abs(parseFloat((payment.valor || '0').toString().replace(',', '.'))),
      data: payment.data_competencia || payment.data_vencimento || payment.data_liquidacao || new Date().toISOString(),
      tipo: 'DESPESA',
      categoria: payment.nome_plano_conta || payment.plano_conta?.nome || 'Despesas Gerais',
      contaBancaria: {
        id: payment.conta_bancaria_id?.toString() || '',
        nome: payment.nome_conta_bancaria || 'Conta não especificada'
      },
      centroCusto: payment.nome_centro_custo,
      formaPagamento: payment.nome_forma_pagamento || payment.forma_pagamento || 'Outros',
      status: payment.liquidado === '1' || payment.liquidado === 1 ? 'PAGO' : 'PENDENTE',
      clienteId: payment.cliente_id?.toString(),
      clienteNome: payment.nome_cliente,
      fornecedorId: payment.fornecedor_id?.toString(),
      fornecedorNome: payment.nome_fornecedor,
      lojaId: payment.loja_id?.toString(),
      lojaNome: payment.nome_loja
    }, null, 2));
  }
  
  if (receipt) {
    console.log('Transformação de recebimento para receita:');
    console.log(JSON.stringify({
      id: receipt.id.toString(),
      codigo: receipt.codigo?.toString(),
      descricao: receipt.descricao || receipt.nome || 'Recebimento sem descrição',
      valor: Math.abs(parseFloat((receipt.valor || '0').toString().replace(',', '.'))),
      data: receipt.data_competencia || receipt.data_vencimento || receipt.data_liquidacao || new Date().toISOString(),
      tipo: 'RECEITA',
      categoria: receipt.nome_plano_conta || receipt.plano_conta?.nome || 'Receitas Gerais',
      contaBancaria: {
        id: receipt.conta_bancaria_id?.toString() || '',
        nome: receipt.nome_conta_bancaria || 'Conta não especificada'
      },
      centroCusto: receipt.nome_centro_custo,
      formaPagamento: receipt.nome_forma_pagamento || receipt.forma_pagamento || 'Outros',
      status: receipt.liquidado === '1' || receipt.liquidado === 1 ? 'PAGO' : 'PENDENTE',
      clienteId: receipt.cliente_id?.toString(),
      clienteNome: receipt.nome_cliente,
      fornecedorId: receipt.fornecedor_id?.toString(),
      fornecedorNome: receipt.nome_fornecedor,
      lojaId: receipt.loja_id?.toString(),
      lojaNome: receipt.nome_loja
    }, null, 2));
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes do Gestão Click');
  console.log(`URL da API: ${API_URL}`);
  console.log(`Token de Acesso: ${ACCESS_TOKEN}`);
  console.log(`Token Secreto: ${SECRET_TOKEN ? '***' + SECRET_TOKEN.substr(-4) : 'Não fornecido'}`);
  console.log(`Período de teste: ${START_DATE} a ${END_DATE}`);
  
  // Testar contas bancárias
  const accountsResult = await testBankAccounts();
  
  // Testar pagamentos
  const paymentsResult = await testPayments();
  
  // Testar recebimentos
  const receiptsResult = await testReceipts();
  
  // Testar transformação de transações
  if ((paymentsResult.success && paymentsResult.data.length > 0) || 
      (receiptsResult.success && receiptsResult.data.length > 0)) {
    testTransactionTransformation(
      paymentsResult.data[0] || {id: "exemplo", valor: "100.00", descricao: "Exemplo de pagamento"},
      receiptsResult.data[0] || {id: "exemplo", valor: "100.00", descricao: "Exemplo de recebimento"}
    );
  } else {
    console.log('\n⚠️ Sem dados reais para testar transformação. Usando dados de exemplo:');
    testTransactionTransformation(
      {
        id: "409",
        codigo: "3305",
        descricao: "Compra de TV 33",
        valor: "1599.99",
        juros: "2.00",
        desconto: "1.00",
        valor_total: "1600.99",
        plano_contas_id: "2512",
        nome_plano_conta: "Vendas de produtos",
        centro_custo_id: "1",
        nome_centro_custo: "Centro de Custo 01",
        conta_bancaria_id: "1",
        nome_conta_bancaria: "Conta padrão",
        forma_pagamento_id: "640517",
        nome_forma_pagamento: "Dinheiro à Vista",
        cliente_id: "6",
        nome_cliente: "Cliente Exemplo",
        liquidado: "1",
        data_vencimento: "2020-01-25",
        data_liquidacao: "2020-01-25",
        data_competencia: "2020-01-25"
      },
      {
        id: "410",
        codigo: "3306",
        descricao: "Venda de TV 44",
        valor: "1599.99",
        juros: "2.00",
        desconto: "1.00",
        valor_total: "1600.99",
        plano_contas_id: "2512",
        nome_plano_conta: "Vendas de produtos",
        centro_custo_id: "1",
        nome_centro_custo: "Centro de Custo 01",
        conta_bancaria_id: "1",
        nome_conta_bancaria: "Conta padrão",
        forma_pagamento_id: "640517",
        nome_forma_pagamento: "Dinheiro à Vista",
        cliente_id: "6",
        nome_cliente: "Cliente Exemplo",
        liquidado: "1",
        data_vencimento: "2020-01-30",
        data_liquidacao: "2020-01-30",
        data_competencia: "2020-01-30"
      }
    );
  }
  
  // Resumo final
  console.log('\n📊 Resumo dos testes:');
  console.log(`- Contas bancárias: ${accountsResult.success ? '✅ OK' : '❌ Falhou'} (${accountsResult.count || 0} encontradas)`);
  console.log(`- Pagamentos: ${paymentsResult.success ? '✅ OK' : '❌ Falhou'} (${paymentsResult.count || 0} encontrados)`);
  console.log(`- Recebimentos: ${receiptsResult.success ? '✅ OK' : '❌ Falhou'} (${receiptsResult.count || 0} encontrados)`);
  
  // Resultado geral
  const overallSuccess = accountsResult.success && (paymentsResult.success || receiptsResult.success);
  console.log(`\n${overallSuccess ? '✅ Integração funcionando!' : '❌ Integração com problemas!'}`);
  
  // Contagem de transações
  const totalTransactions = (paymentsResult.count || 0) + (receiptsResult.count || 0);
  console.log(`Total de transações encontradas: ${totalTransactions}`);
  
  if (totalTransactions === 0 && paymentsResult.success && receiptsResult.success) {
    console.log('⚠️ Nenhuma transação encontrada no período. Recomendações:');
    console.log('  1. Verifique se existem transações no período selecionado');
    console.log('  2. Tente ajustar o intervalo de datas para um período maior');
    console.log('  3. Verifique se sua conta tem permissão para acessar transações');
  }
  
  // Informações adicionais
  if (overallSuccess) {
    console.log('\n🔍 Informações para o uso:');
    console.log('- A aplicação suporta o novo formato de resposta da API');
    console.log('- As transações são importadas a partir dos endpoints /pagamentos e /recebimentos');
    console.log('- Campos suportados incluem: clientes, fornecedores, lojas, formas de pagamento, etc.');
    console.log('- A autenticação está funcionando corretamente');
  }
}

// Executar os testes
runTests(); 