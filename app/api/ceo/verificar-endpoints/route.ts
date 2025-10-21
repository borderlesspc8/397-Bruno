/**
 * 🔍 VERIFICAR SE OS ENDPOINTS EXISTEM NA API
 * 
 * Acesse: http://localhost:3000/api/ceo/verificar-endpoints
 * 
 * Testa DIRETAMENTE cada endpoint na API externa
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const dataInicio = inicioMes.toISOString().split('T')[0];
  const dataFim = fimMes.toISOString().split('T')[0];
  
  const accessToken = process.env.GESTAO_CLICK_ACCESS_TOKEN;
  const secretToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;
  const baseUrl = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
  
  const headers = {
    'Content-Type': 'application/json',
    'access-token': accessToken || '',
    'secret-access-token': secretToken || '',
  };
  
  console.log('\n========================================');
  console.log('🔍 VERIFICANDO ENDPOINTS NA API');
  console.log('========================================');
  console.log('URL Base:', baseUrl);
  console.log('Tokens:', {
    access: accessToken ? 'PRESENTE' : 'AUSENTE',
    secret: secretToken ? 'PRESENTE' : 'AUSENTE',
  });
  console.log('Período:', dataInicio, 'até', dataFim);
  console.log('');
  
  const resultados: any = {};
  
  // Endpoints para testar
  const endpoints = [
    { nome: 'vendas', url: `/vendas?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=3` },
    { nome: 'pagamentos', url: `/pagamentos?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=3` },
    { nome: 'recebimentos', url: `/recebimentos?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=3` },
    { nome: 'centros_custos', url: `/centros_custos` },
    { nome: 'planos_contas', url: `/planos_contas` },
    { nome: 'contas_bancarias', url: `/contas_bancarias` },
    { nome: 'formas_pagamentos', url: `/formas_pagamentos` },
  ];
  
  for (const endpoint of endpoints) {
    const urlCompleta = `${baseUrl}${endpoint.url}`;
    console.log(`\n📡 Testando: ${endpoint.nome}`);
    console.log(`URL: ${urlCompleta}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(urlCompleta, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const statusCode = response.status;
      console.log(`Status: ${statusCode}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`❌ Erro ${statusCode}`);
        
        resultados[endpoint.nome] = {
          existe: false,
          statusCode,
          erro: errorText.substring(0, 200),
        };
        continue;
      }
      
      const data = await response.json();
      const registros = data.data || data || [];
      const total = Array.isArray(registros) ? registros.length : 0;
      
      console.log(`✅ FUNCIONA! ${total} registros`);
      
      resultados[endpoint.nome] = {
        existe: true,
        statusCode,
        total,
        estrutura: Array.isArray(data) ? 'array_direto' : data.data ? 'objeto_com_data' : 'objeto',
        exemplo: Array.isArray(registros) && registros.length > 0 ? {
          campos: Object.keys(registros[0]),
          primeiro_registro: registros[0],
        } : null,
      };
      
    } catch (error: any) {
      console.log(`❌ Exceção: ${error.message}`);
      
      resultados[endpoint.nome] = {
        existe: false,
        erro: error.message,
        tipo: error.name,
      };
    }
  }
  
  console.log('\n========================================');
  console.log('RESUMO:');
  console.log('========================================');
  
  Object.entries(resultados).forEach(([nome, res]: [string, any]) => {
    if (res.existe) {
      console.log(`✅ ${nome}: ${res.total} registros`);
    } else {
      console.log(`❌ ${nome}: ${res.erro || res.statusCode || 'Erro'}`);
    }
  });
  
  console.log('\n');
  
  const funcionando = Object.values(resultados).filter((r: any) => r.existe).length;
  const total = Object.keys(resultados).length;
  
  return NextResponse.json({
    baseUrl,
    periodo: { inicio: dataInicio, fim: dataFim },
    resultados,
    resumo: {
      total_testados: total,
      funcionando,
      com_erro: total - funcionando,
      porcentagem: ((funcionando / total) * 100).toFixed(1) + '%',
    },
    conclusao: {
      vendas_funciona: resultados.vendas?.existe || false,
      pagamentos_funciona: resultados.pagamentos?.existe || false,
      recebimentos_funciona: resultados.recebimentos?.existe || false,
      centros_custos_funciona: resultados.centros_custos?.existe || false,
      contas_bancarias_funciona: resultados.contas_bancarias?.existe || false,
      
      mensagem: funcionando === 0
        ? '❌ NENHUM ENDPOINT FUNCIONA'
        : funcionando === total
        ? '✅ TODOS OS ENDPOINTS FUNCIONAM'
        : `⚠️ ${funcionando}/${total} ENDPOINTS FUNCIONAM`,
    },
  });
}


