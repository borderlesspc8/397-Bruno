/**
 * 🔍 VERIFICAR SE AS APIS RETORNAM DADOS
 * 
 * Acesse: http://localhost:3000/api/ceo/verificar-apis
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function testarAPI(url: string, headers: any) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const text = await response.text();
      return {
        sucesso: false,
        statusCode: response.status,
        erro: text.substring(0, 300),
      };
    }
    
    const data = await response.json();
    const registros = data.data || data || [];
    const total = Array.isArray(registros) ? registros.length : 0;
    
    return {
      sucesso: true,
      statusCode: response.status,
      total,
      exemplo: Array.isArray(registros) && registros.length > 0 ? registros[0] : null,
    };
    
  } catch (error: any) {
    return {
      sucesso: false,
      erro: error.message || 'Erro desconhecido',
      tipo: error.name || 'Error',
    };
  }
}

export async function GET() {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  const dataInicio = inicioMes.toISOString().split('T')[0];
  const dataFim = fimMes.toISOString().split('T')[0];
  
  const headers = {
    'Content-Type': 'application/json',
    'access-token': process.env.GESTAO_CLICK_ACCESS_TOKEN || '',
    'secret-access-token': process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '',
  };
  
  const baseUrl = 'https://api.beteltecnologia.com';
  
  console.log('\n🔍 VERIFICANDO APIS DO GESTÃO CLICK');
  console.log('URL Base:', baseUrl);
  console.log('Período:', dataInicio, 'até', dataFim);
  console.log('');
  
  const resultados: any = {};
  
  // APIs críticas para o CEO Dashboard
  const apisParaTestar = [
    { nome: 'vendas', url: `${baseUrl}/vendas?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=5` },
    { nome: 'pagamentos', url: `${baseUrl}/pagamentos?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=5` },
    { nome: 'recebimentos', url: `${baseUrl}/recebimentos?data_inicio=${dataInicio}&data_fim=${dataFim}&limit=5` },
    { nome: 'centros_custos', url: `${baseUrl}/centros_custos` },
    { nome: 'planos_contas', url: `${baseUrl}/planos_contas` },
    { nome: 'contas_bancarias', url: `${baseUrl}/contas_bancarias` },
    { nome: 'formas_pagamentos', url: `${baseUrl}/formas_pagamentos` },
  ];
  
  for (const api of apisParaTestar) {
    console.log(`\n📡 Testando: ${api.nome}`);
    console.log(`URL: ${api.url}`);
    
    const resultado = await testarAPI(api.url, headers);
    
    if (resultado.sucesso) {
      console.log(`✅ Sucesso! ${resultado.total} registros`);
      if (resultado.exemplo) {
        console.log(`📝 Campos disponíveis:`, Object.keys(resultado.exemplo).join(', '));
      }
    } else {
      console.log(`❌ Falhou:`, resultado.erro || resultado.statusCode);
    }
    
    resultados[api.nome] = {
      ...resultado,
      url: api.url,
    };
  }
  
  console.log('\n========================================');
  
  const sucessos = Object.values(resultados).filter((r: any) => r.sucesso).length;
  const total = Object.keys(resultados).length;
  
  console.log(`📊 RESULTADO: ${sucessos}/${total} APIs funcionando`);
  console.log('========================================\n');
  
  return NextResponse.json({
    baseUrl,
    periodo: { inicio: dataInicio, fim: dataFim },
    tokens_configurados: {
      access_token: !!headers['access-token'],
      secret_token: !!headers['secret-access-token'],
    },
    apis: resultados,
    resumo: {
      total_testadas: total,
      funcionando: sucessos,
      com_erro: total - sucessos,
      porcentagem: ((sucessos / total) * 100).toFixed(1) + '%',
    },
    diagnostico: {
      vendas_funciona: resultados.vendas?.sucesso || false,
      pagamentos_funciona: resultados.pagamentos?.sucesso || false,
      recebimentos_funciona: resultados.recebimentos?.sucesso || false,
      centros_custos_funciona: resultados.centros_custos?.sucesso || false,
      contas_bancarias_funciona: resultados.contas_bancarias?.sucesso || false,
    },
    conclusao: sucessos === 0 
      ? '❌ NENHUMA API FUNCIONOU - Problema de rede ou credenciais'
      : sucessos === total
      ? '✅ TODAS AS APIS FUNCIONARAM'
      : `⚠️ Apenas ${sucessos} de ${total} APIs funcionaram - Algumas podem não existir`,
  });
}


