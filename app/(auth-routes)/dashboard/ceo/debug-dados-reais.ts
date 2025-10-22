/**
 * 🔍 SCRIPT DE DIAGNÓSTICO - VER DADOS REAIS DAS APIS
 * 
 * Execute: node -r esbuild-register app/\(auth-routes\)/dashboard/ceo/debug-dados-reais.ts
 * Ou crie uma rota API para executar
 */

import { GestaoClickSupabaseService } from '@/app/_services/gestao-click-supabase';
import GestaoClickAPIService from './_services/gestao-click-api.service';

async function diagnosticarDadosReais() {
  console.log('========================================');
  console.log('🔍 DIAGNÓSTICO DE DADOS REAIS');
  console.log('========================================\n');

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

  try {
    // 1. VENDAS
    console.log('📊 1. BUSCANDO VENDAS DO SUPABASE...\n');
    const vendas = await GestaoClickSupabaseService.sincronizarVendas({
      dataInicio: inicioMes,
      dataFim: fimMes,
      userId: 'SEU_USER_ID_AQUI', // TROCAR
      forceUpdate: false,
    });

    console.log(`✅ Total de vendas: ${vendas.vendas.length}`);
    
    if (vendas.vendas.length > 0) {
      const primeiraVenda = vendas.vendas[0];
      console.log('\n📝 EXEMPLO DE VENDA (primeira venda):');
      console.log(JSON.stringify({
        id: primeiraVenda.id,
        valor_total: primeiraVenda.valor_total,
        valor_custo: primeiraVenda.valor_custo,
        desconto_valor: primeiraVenda.desconto_valor,
        valor_frete: primeiraVenda.valor_frete,
        forma_pagamento: primeiraVenda.forma_pagamento,
        metadata: primeiraVenda.metadata,
      }, null, 2));
    }

    // 2. PAGAMENTOS (DESPESAS)
    console.log('\n\n💸 2. BUSCANDO PAGAMENTOS (DESPESAS)...\n');
    const apiData = await GestaoClickAPIService.buscarDadosComplementares({
      dataInicio: inicioMes,
      dataFim: fimMes,
      userId: 'SEU_USER_ID_AQUI', // TROCAR
    });

    console.log(`✅ Total de pagamentos: ${apiData.pagamentos.length}`);
    console.log(`✅ Total de recebimentos: ${apiData.recebimentos.length}`);
    console.log(`✅ Total de centros de custo: ${apiData.centrosCustos.length}`);
    console.log(`✅ Total de contas bancárias: ${apiData.contasBancarias.length}`);

    // MOSTRAR TODOS OS CENTROS DE CUSTO
    console.log('\n📋 TODOS OS CENTROS DE CUSTO DISPONÍVEIS:');
    apiData.centrosCustos.forEach((cc, index) => {
      console.log(`${index + 1}. ID: ${cc.id} | Nome: ${cc.nome} | Tipo: ${cc.tipo} | Ativo: ${cc.ativo}`);
    });

    // MOSTRAR EXEMPLOS DE PAGAMENTOS
    if (apiData.pagamentos.length > 0) {
      console.log('\n💰 EXEMPLOS DE PAGAMENTOS (primeiros 10):');
      apiData.pagamentos.slice(0, 10).forEach((pag, index) => {
        console.log(`\n${index + 1}. ${pag.descricao}`);
        console.log(`   Valor: R$ ${pag.valor}`);
        console.log(`   Centro de Custo ID: ${pag.centro_custo_id}`);
        console.log(`   Centro de Custo Nome: ${pag.centro_custo_nome}`);
        console.log(`   Liquidado: ${pag.liquidado} (pg=pago, ab=aberto, at=atrasado)`);
        console.log(`   Data Vencimento: ${pag.data_vencimento}`);
      });
    } else {
      console.log('⚠️ NENHUM PAGAMENTO ENCONTRADO!');
      console.log('Isso significa que a API /pagamentos não está retornando dados.');
    }

    // AGRUPAR PAGAMENTOS POR CENTRO DE CUSTO
    if (apiData.pagamentos.length > 0 && apiData.centrosCustos.length > 0) {
      console.log('\n\n📊 AGRUPAMENTO POR CENTRO DE CUSTO:');
      
      const pagamentosPagos = apiData.pagamentos.filter(p => p.liquidado === 'pg');
      console.log(`\nPagamentos efetivados (liquidado='pg'): ${pagamentosPagos.length}`);
      
      const porCentroCusto = new Map();
      
      pagamentosPagos.forEach(pag => {
        const ccId = pag.centro_custo_id;
        const ccNome = pag.centro_custo_nome || 'SEM NOME';
        
        if (!porCentroCusto.has(ccId)) {
          porCentroCusto.set(ccId, {
            id: ccId,
            nome: ccNome,
            total: 0,
            quantidade: 0,
          });
        }
        
        const cc = porCentroCusto.get(ccId);
        cc.total += parseFloat(pag.valor || '0');
        cc.quantidade += 1;
      });
      
      console.log('\n📊 RESUMO POR CENTRO DE CUSTO:');
      const sorted = Array.from(porCentroCusto.values()).sort((a, b) => b.total - a.total);
      sorted.forEach((cc, index) => {
        console.log(`${index + 1}. ${cc.nome} (ID: ${cc.id})`);
        console.log(`   Total: R$ ${cc.total.toFixed(2)}`);
        console.log(`   Quantidade: ${cc.quantidade} pagamentos`);
      });
    }

    // VERIFICAR ESTRUTURA DE VENDAS
    console.log('\n\n🔍 VERIFICANDO ESTRUTURA DE VENDAS:');
    if (vendas.vendas.length > 0) {
      const venda = vendas.vendas[0];
      console.log('\nCampos disponíveis na venda:');
      console.log('- valor_total:', typeof venda.valor_total, venda.valor_total);
      console.log('- valor_custo:', typeof venda.valor_custo, venda.valor_custo);
      console.log('- desconto_valor:', typeof venda.desconto_valor, venda.desconto_valor);
      console.log('- metadata.centro_custo_id:', venda.metadata?.centro_custo_id);
      console.log('- metadata.centro_custo_nome:', venda.metadata?.centro_custo_nome);
      
      if (venda.produtos && venda.produtos.length > 0) {
        console.log('\nProdutos na venda:');
        console.log('- Quantidade de produtos:', venda.produtos.length);
        console.log('- Primeiro produto:', JSON.stringify(venda.produtos[0], null, 2));
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO NO DIAGNÓSTICO:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Executar
diagnosticarDadosReais().then(() => {
  console.log('\n========================================');
  console.log('✅ DIAGNÓSTICO CONCLUÍDO');
  console.log('========================================');
  process.exit(0);
}).catch(error => {
  console.error('❌ ERRO FATAL:', error);
  process.exit(1);
});



