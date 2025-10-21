/**
 * 🔍 ROTA DE DIAGNÓSTICO COMPLETO
 * 
 * Testa TODAS as 25 APIs da Betel e mostra:
 * - Estrutura real dos dados
 * - Campos disponíveis
 * - Exemplos de dados
 * - Status de cada API
 * 
 * ⚠️ EXCLUSIVO para Dashboard CEO - NÃO afeta outras dashboards
 */

import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
const ACCESS_TOKEN = process.env.GESTAO_CLICK_ACCESS_TOKEN;
const SECRET_TOKEN = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;

interface DiagnosticoAPI {
  endpoint: string;
  status: 'success' | 'error';
  temDados: boolean;
  totalRegistros: number;
  exemplo: any;
  campos: string[];
  erro?: string;
}

export async function GET() {
  console.log('🔍 [Diagnóstico] Iniciando teste de TODAS as 25 APIs...');
  
  const headers = {
    'Content-Type': 'application/json',
    'access-token': ACCESS_TOKEN || '',
    'secret-access-token': SECRET_TOKEN || '',
  };
  
  const hoje = new Date();
  const dataFim = hoje.toISOString().split('T')[0];
  const dataInicio = new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0];
  
  const endpoints = [
    // Vendas & Comercial
    { nome: 'vendas', url: `${API_BASE_URL}/vendas?data_inicio=${dataInicio}&data_fim=${dataFim}`, comParametros: true },
    { nome: 'situacoes_vendas', url: `${API_BASE_URL}/situacoes_vendas`, comParametros: false },
    { nome: 'atributos_vendas', url: `${API_BASE_URL}/atributos_vendas`, comParametros: false },
    { nome: 'orcamentos', url: `${API_BASE_URL}/orcamentos?data_inicio=${dataInicio}&data_fim=${dataFim}`, comParametros: true },
    { nome: 'situacoes_orcamentos', url: `${API_BASE_URL}/situacoes_orcamentos`, comParametros: false },
    { nome: 'ordens_servicos', url: `${API_BASE_URL}/ordens_servicos?data_inicio=${dataInicio}&data_fim=${dataFim}`, comParametros: true },
    
    // Produtos & Serviços
    { nome: 'produtos', url: `${API_BASE_URL}/produtos`, comParametros: false },
    { nome: 'grupos_produtos', url: `${API_BASE_URL}/grupos_produtos`, comParametros: false },
    { nome: 'servicos', url: `${API_BASE_URL}/servicos`, comParametros: false },
    
    // Compras
    { nome: 'compras', url: `${API_BASE_URL}/compras?data_inicio=${dataInicio}&data_fim=${dataFim}`, comParametros: true },
    { nome: 'situacoes_compras', url: `${API_BASE_URL}/situacoes_compras`, comParametros: false },
    
    // Financeiro
    { nome: 'recebimentos', url: `${API_BASE_URL}/recebimentos?data_inicio=${dataInicio}&data_fim=${dataFim}`, comParametros: true },
    { nome: 'pagamentos', url: `${API_BASE_URL}/pagamentos?data_inicio=${dataInicio}&data_fim=${dataFim}`, comParametros: true },
    { nome: 'centros_custos', url: `${API_BASE_URL}/centros_custos`, comParametros: false },
    { nome: 'planos_contas', url: `${API_BASE_URL}/planos_contas`, comParametros: false },
    { nome: 'contas_bancarias', url: `${API_BASE_URL}/contas_bancarias`, comParametros: false },
    { nome: 'formas_pagamentos', url: `${API_BASE_URL}/formas_pagamentos`, comParametros: false },
    
    // Notas Fiscais
    { nome: 'notas_fiscais_servicos', url: `${API_BASE_URL}/notas_fiscais_servicos?data_inicio=${dataInicio}&data_fim=${dataFim}`, comParametros: true },
    { nome: 'notas_fiscais_consumidores', url: `${API_BASE_URL}/notas_fiscais_consumidores?data_inicio=${dataInicio}&data_fim=${dataFim}`, comParametros: true },
    { nome: 'notas_fiscais_produtos', url: `${API_BASE_URL}/notas_fiscais_produtos?data_inicio=${dataInicio}&data_fim=${dataFim}`, comParametros: true },
    
    // Cadastros
    { nome: 'clientes', url: `${API_BASE_URL}/clientes`, comParametros: false },
    { nome: 'fornecedores', url: `${API_BASE_URL}/fornecedores`, comParametros: false },
    { nome: 'funcionarios', url: `${API_BASE_URL}/funcionarios`, comParametros: false },
  ];
  
  const resultados: DiagnosticoAPI[] = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 [Diagnóstico] Testando: ${endpoint.nome}...`);
      
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });
      
      if (!response.ok) {
        resultados.push({
          endpoint: endpoint.nome,
          status: 'error',
          temDados: false,
          totalRegistros: 0,
          exemplo: null,
          campos: [],
          erro: `HTTP ${response.status}: ${response.statusText}`,
        });
        continue;
      }
      
      const json = await response.json();
      const dados = json.data || json;
      const isDadosArray = Array.isArray(dados);
      const primeiroItem = isDadosArray ? dados[0] : dados;
      
      const campos = primeiroItem ? Object.keys(primeiroItem) : [];
      
      resultados.push({
        endpoint: endpoint.nome,
        status: 'success',
        temDados: isDadosArray ? dados.length > 0 : !!dados,
        totalRegistros: isDadosArray ? dados.length : (dados ? 1 : 0),
        exemplo: primeiroItem || null,
        campos,
      });
      
      console.log(`✅ [Diagnóstico] ${endpoint.nome}: ${isDadosArray ? dados.length : 1} registro(s)`);
      
    } catch (error) {
      console.error(`❌ [Diagnóstico] Erro em ${endpoint.nome}:`, error);
      resultados.push({
        endpoint: endpoint.nome,
        status: 'error',
        temDados: false,
        totalRegistros: 0,
        exemplo: null,
        campos: [],
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
  
  // Resumo
  const totalAPIs = resultados.length;
  const apisComSucesso = resultados.filter(r => r.status === 'success').length;
  const apisComDados = resultados.filter(r => r.temDados).length;
  const apisComErro = resultados.filter(r => r.status === 'error').length;
  
  const resumo = {
    totalAPIs,
    apisComSucesso,
    apisComDados,
    apisComErro,
    percentualSucesso: ((apisComSucesso / totalAPIs) * 100).toFixed(1) + '%',
  };
  
  console.log('📊 [Diagnóstico] Resumo:', resumo);
  
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    periodo: { inicio: dataInicio, fim: dataFim },
    resumo,
    resultados,
    credenciais: {
      apiUrl: API_BASE_URL,
      temAccessToken: !!ACCESS_TOKEN,
      temSecretToken: !!SECRET_TOKEN,
    },
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

