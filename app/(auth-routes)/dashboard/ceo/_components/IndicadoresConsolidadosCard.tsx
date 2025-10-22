/**
 * 🎯 INDICADORES CONSOLIDADOS
 * 
 * Exibe em um único card:
 * - Sustentabilidade Financeira
 * - Previsibilidade de Receitas
 * - Indicadores de Crescimento
 * - Metas Financeiras
 */

'use client';

import React from 'react';

interface Props {
  sustentabilidade: {
    coberturaReservas: number;
    capitalProprioSobreTerceiros: number;
    endividamento: number;
    saudeFinanceira: 'Excelente' | 'Boa' | 'Atenção' | 'Crítica';
    reservasAtuais: number;
    despesasMensaisMedias: number;
  };
  previsibilidade: {
    receitasRecorrentes: number;
    receitasPontuais: number;
    percentualRecorrente: number;
    desviadoPadrao: number;
    coeficienteVariacao: number;
    estabilidade: 'Alta' | 'Média' | 'Baixa';
  };
  crescimento: {
    crescimentoMoM: number;
    crescimentoYoY: number;
    crescimentoMedioMensal: number;
    tendencia: 'Crescimento' | 'Estável' | 'Declínio';
    projecaoProximoMes: number;
    atingimentoMeta: number;
  };
  metas: {
    metaReceitaMensal: number;
    receitaAtual: number;
    percentualAtingimento: number;
    faltaParaMeta: number;
    metaMargemLiquida: number;
    margemLiquidaAtual: number;
    metaTicketMedio: number;
    ticketMedioAtual: number;
    status: 'Superou' | 'Atingiu' | 'Próximo' | 'Distante';
  };
}

export function IndicadoresConsolidadosCard({ sustentabilidade, previsibilidade, crescimento, metas }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };
  
  const formatCurrencyFull = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const getCorSaude = (saude: string) => {
    switch (saude) {
      case 'Excelente': return 'bg-green-100 text-green-800 border-green-300';
      case 'Boa': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Atenção': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Crítica': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getCorEstabilidade = (est: string) => {
    switch (est) {
      case 'Alta': return 'bg-green-100 text-green-800';
      case 'Média': return 'bg-yellow-100 text-yellow-800';
      case 'Baixa': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getCorCrescimento = (valor: number) => {
    if (valor > 5) return 'text-green-600';
    if (valor > 0) return 'text-blue-600';
    return 'text-red-600';
  };
  
  const getIconeTendencia = (tendencia: string) => {
    switch (tendencia) {
      case 'Crescimento': return '📈';
      case 'Estável': return '➡️';
      case 'Declínio': return '📉';
      default: return '➖';
    }
  };
  
  const getCorMeta = (status: string) => {
    switch (status) {
      case 'Superou': return 'bg-green-100 text-green-800 border-green-400';
      case 'Atingiu': return 'bg-blue-100 text-blue-800 border-blue-400';
      case 'Próximo': return 'bg-yellow-100 text-yellow-800 border-yellow-400';
      case 'Distante': return 'bg-red-100 text-red-800 border-red-400';
      default: return 'bg-gray-100 text-gray-800 border-gray-400';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 1️⃣ SUSTENTABILIDADE FINANCEIRA */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">🏦</span>
          Sustentabilidade Financeira
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Saúde Financeira */}
          <div className={`rounded-lg border-2 p-4 ${getCorSaude(sustentabilidade.saudeFinanceira)}`}>
            <p className="text-sm font-medium mb-2">Saúde Financeira Geral</p>
            <p className="text-3xl font-bold">{sustentabilidade.saudeFinanceira}</p>
          </div>
          
          {/* Cobertura de Reservas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Cobertura de Reservas</p>
            <p className="text-3xl font-bold text-blue-600">
              {sustentabilidade.coberturaReservas.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 mt-1">meses de operação</p>
          </div>
          
          {/* Endividamento */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Endividamento</p>
            <p className={`text-3xl font-bold ${sustentabilidade.endividamento < 30 ? 'text-green-600' : sustentabilidade.endividamento < 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {sustentabilidade.endividamento.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {sustentabilidade.endividamento < 30 ? '✅ Baixo' : sustentabilidade.endividamento < 50 ? '⚠️ Moderado' : '❌ Alto'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-xs text-gray-600">Reservas Atuais</p>
            <p className="text-lg font-bold text-blue-600">{formatCurrencyFull(sustentabilidade.reservasAtuais)}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <p className="text-xs text-gray-600">Despesas Mensais Médias</p>
            <p className="text-lg font-bold text-purple-600">{formatCurrencyFull(sustentabilidade.despesasMensaisMedias)}</p>
          </div>
        </div>
      </div>
      
      {/* 2️⃣ PREVISIBILIDADE DE RECEITAS */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">🔮</span>
          Previsibilidade de Receitas
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Estabilidade */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Estabilidade das Receitas</p>
            <span className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${getCorEstabilidade(previsibilidade.estabilidade)}`}>
              {previsibilidade.estabilidade}
            </span>
            <p className="text-xs text-gray-500 mt-2">
              Coef. Variação: {previsibilidade.coeficienteVariacao.toFixed(1)}%
            </p>
          </div>
          
          {/* Receitas Recorrentes */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-gray-700 mb-1">Receitas Recorrentes</p>
            <p className="text-2xl font-bold text-green-600">
              {previsibilidade.percentualRecorrente.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {formatCurrency(previsibilidade.receitasRecorrentes)}
            </p>
          </div>
          
          {/* Receitas Pontuais */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-700 mb-1">Receitas Pontuais</p>
            <p className="text-2xl font-bold text-blue-600">
              {(100 - previsibilidade.percentualRecorrente).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {formatCurrency(previsibilidade.receitasPontuais)}
            </p>
          </div>
        </div>
      </div>
      
      {/* 3️⃣ INDICADORES DE CRESCIMENTO */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">{getIconeTendencia(crescimento.tendencia)}</span>
          Indicadores de Crescimento
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* MoM */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Crescimento MoM</p>
            <p className={`text-3xl font-bold ${getCorCrescimento(crescimento.crescimentoMoM)}`}>
              {crescimento.crescimentoMoM > 0 ? '+' : ''}{crescimento.crescimentoMoM.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Mês sobre mês</p>
          </div>
          
          {/* YoY */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Crescimento YoY</p>
            <p className={`text-3xl font-bold ${getCorCrescimento(crescimento.crescimentoYoY)}`}>
              {crescimento.crescimentoYoY > 0 ? '+' : ''}{crescimento.crescimentoYoY.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Ano sobre ano</p>
          </div>
          
          {/* Tendência */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Tendência</p>
            <p className="text-2xl font-bold text-gray-900">{crescimento.tendencia}</p>
            <p className="text-xs text-gray-500 mt-1">
              Média: {crescimento.crescimentoMedioMensal > 0 ? '+' : ''}{crescimento.crescimentoMedioMensal.toFixed(1)}%/mês
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Projeção Próximo Mês</p>
              <p className="text-xs text-blue-700 mt-1">Baseada na média móvel</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(crescimento.projecaoProximoMes)}
            </p>
          </div>
        </div>
      </div>
      
      {/* 4️⃣ METAS FINANCEIRAS */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          Dashboard de Metas Financeiras
        </h2>
        
        {/* Status Geral */}
        <div className={`rounded-lg border-2 p-6 mb-6 ${getCorMeta(metas.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1">Status Geral das Metas</p>
              <p className="text-4xl font-bold">{metas.status}</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">
                {metas.percentualAtingimento.toFixed(0)}%
              </p>
              <p className="text-sm mt-1">Atingimento Médio</p>
            </div>
          </div>
        </div>
        
        {/* Metas Detalhadas */}
        <div className="space-y-4">
          {/* Meta de Receita */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Meta de Receita Mensal</p>
              <span className="text-sm font-bold text-blue-600">
                {((metas.receitaAtual / metas.metaReceitaMensal) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((metas.receitaAtual / metas.metaReceitaMensal) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Atual: {formatCurrency(metas.receitaAtual)}</span>
              <span>Meta: {formatCurrency(metas.metaReceitaMensal)}</span>
            </div>
            {metas.faltaParaMeta > 0 && (
              <p className="text-xs text-red-600 mt-2">
                Faltam {formatCurrency(metas.faltaParaMeta)} para atingir a meta
              </p>
            )}
          </div>
          
          {/* Meta de Margem Líquida */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Meta de Margem Líquida</p>
              <span className={`text-sm font-bold ${metas.margemLiquidaAtual >= metas.metaMargemLiquida ? 'text-green-600' : 'text-red-600'}`}>
                {metas.margemLiquidaAtual.toFixed(1)}% / {metas.metaMargemLiquida.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${metas.margemLiquidaAtual >= metas.metaMargemLiquida ? 'bg-green-600' : 'bg-orange-600'}`}
                style={{ width: `${Math.min((metas.margemLiquidaAtual / metas.metaMargemLiquida) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Meta de Ticket Médio */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Meta de Ticket Médio</p>
              <span className={`text-sm font-bold ${metas.ticketMedioAtual >= metas.metaTicketMedio ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrencyFull(metas.ticketMedioAtual)} / {formatCurrencyFull(metas.metaTicketMedio)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${metas.ticketMedioAtual >= metas.metaTicketMedio ? 'bg-green-600' : 'bg-orange-600'}`}
                style={{ width: `${Math.min((metas.ticketMedioAtual / metas.metaTicketMedio) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


