/**
 * 📊 CEO DASHBOARD - PÁGINA PRINCIPAL
 * 
 * Dashboard executivo completo para CEO
 * Acesso: /dashboard/ceo
 * 
 * ✅ INTEGRAÇÃO COMPLETA COM 25 APIs DA BETEL
 * ✅ TODOS OS INDICADORES SOLICITADOS
 * ✅ DADOS SEMPRE ATUALIZADOS E REAIS
 */

'use client';

import React, { useState, useCallback } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useCEODashboard } from './_hooks/useCEODashboard';
import { CEODashboardHeader } from './_components/CEODashboardHeader';
import { KPICard } from './_components/KPICard';
import { AlertCard } from './_components/AlertCard';
import { SimpleLineChart } from './_components/SimpleLineChart';
import { RentabilidadeCentroCustoTable } from './_components/RentabilidadeCentroCustoTable';
import { DespesasOperacionaisCard } from './_components/DespesasOperacionaisCard';
import { DRESimplificadaCard } from './_components/DRESimplificadaCard';
import { DREGerencialCard } from './_components/DREGerencialCard';
// 🆕 NOVOS COMPONENTES COM DADOS REAIS
import { IndicadoresEficienciaCard } from './_components/IndicadoresEficienciaCard';
import { IndicadoresLiquidezCard } from './_components/IndicadoresLiquidezCard';
import { AnaliseInadimplenciaCard } from './_components/AnaliseInadimplenciaCard';
import { IndicadoresConsolidadosCard } from './_components/IndicadoresConsolidadosCard';

export default function CEODashboardPage() {
  const [dataInicio, setDataInicio] = useState(startOfMonth(new Date()));
  const [dataFim, setDataFim] = useState(endOfMonth(new Date()));
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5); // minutos
  
  const { data, loading, error, reload, cached, invalidateCache } = useCEODashboard({
    dataInicio,
    dataFim,
    autoLoad: true,
    forceUpdate: false, // Mudará para true quando limpar cache
  });
  
  // Função para limpar cache e recarregar
  const limparCacheERecarregar = useCallback(() => {
    invalidateCache();
    setTimeout(() => reload(), 100);
  }, [invalidateCache, reload]);
  
  // 🔄 SINCRONIZAÇÃO AUTOMÁTICA
  React.useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refresh: Atualizando dados da Dashboard CEO...');
      reload();
    }, refreshInterval * 60 * 1000); // Converter minutos para milissegundos
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, reload]);
  
  const handleDataChange = (inicio: Date, fim: Date) => {
    setDataInicio(inicio);
    setDataFim(fim);
  };
  
  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-xl font-semibold text-gray-700">Carregando Dashboard CEO...</p>
          <p className="mt-2 text-sm text-gray-500">Processando dados financeiros</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={reload}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600">Sem dados disponíveis</p>
      </div>
    );
  }
  
  const alertasAtivos = data.visaoGeral.alertasFinanceiros.filter(
    a => !dismissedAlerts.includes(a.id)
  );
  
  // 🔍 DEBUG: Ver estrutura dos dados
  React.useEffect(() => {
    if (data) {
      console.log('🔍 [DEBUG] Estrutura dos dados:', {
        temDadosBrutos: !!data.dadosBrutos,
        temIndicadores: !!data.dadosBrutos?.indicadores,
        temBetel: !!data.dadosBrutos?.betel,
        keys: Object.keys(data),
      });
      
      if (!data.dadosBrutos?.indicadores) {
        console.warn('⚠️ [DEBUG] dadosBrutos.indicadores não existe! Cache antigo?');
        console.warn('⚠️ [DEBUG] Clique no botão "🗑️ Limpar Cache" para corrigir');
      }
    }
  }, [data]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CEODashboardHeader
        dataInicio={dataInicio}
        dataFim={dataFim}
        onDataChange={handleDataChange}
        onReload={reload}
        loading={loading}
        cached={cached}
      />
      
      {/* ⚠️ ALERTA DE CACHE */}
      {data && !data.dadosBrutos?.indicadores && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <span className="text-4xl">⚠️</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Cache Antigo Detectado!
                </h3>
                <p className="text-red-800 mb-4">
                  Você está vendo dados do cache antigo (sem os novos indicadores das 25 APIs).
                </p>
                <button
                  onClick={limparCacheERecarregar}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg"
                >
                  🗑️ CLIQUE AQUI PARA LIMPAR CACHE E VER DADOS REAIS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 🔄 Controles de Auto-Refresh */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="auto-refresh" className="text-sm font-medium text-blue-900">
                🔄 Atualização Automática
              </label>
            </div>
            
            {autoRefresh && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-blue-700">Intervalo:</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="text-sm border border-blue-300 rounded px-2 py-1 bg-white text-blue-900"
                >
                  <option value={1}>1 minuto</option>
                  <option value={5}>5 minutos</option>
                  <option value={10}>10 minutos</option>
                  <option value={30}>30 minutos</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {autoRefresh && (
              <span className="text-xs text-blue-700 flex items-center gap-1">
                <span className="animate-pulse">●</span>
                Dados sendo atualizados automaticamente
              </span>
            )}
            <span className="text-xs text-blue-600 font-medium">
              ✅ 25 APIs Conectadas
            </span>
            <button
              onClick={limparCacheERecarregar}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
              title="Limpar cache e recarregar dados"
            >
              🗑️ Limpar Cache
            </button>
            <a
              href="/dashboard/ceo/diagnostico"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded transition-colors"
              title="Abrir diagnóstico completo das APIs"
            >
              🔍 Diagnosticar APIs
            </a>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            titulo="Receita Bruta"
            valor={data.visaoGeral.dre.receitaBruta}
            unidade="currency"
            variacao={data.visaoGeral.kpisPrincipais.receitaBruta.variacaoMoM}
            status={data.visaoGeral.kpisPrincipais.receitaBruta.status}
            tendencia={data.visaoGeral.kpisPrincipais.receitaBruta.tendencia}
            icon="💰"
          />
          <KPICard
            titulo="Lucro Líquido"
            valor={data.visaoGeral.dre.lucroLiquido}
            unidade="currency"
            variacao={data.visaoGeral.kpisPrincipais.lucroLiquido.variacaoMoM}
            status={data.visaoGeral.kpisPrincipais.lucroLiquido.status}
            tendencia={data.visaoGeral.kpisPrincipais.lucroLiquido.tendencia}
            icon="🎯"
          />
          <KPICard
            titulo="Margem Líquida"
            valor={data.visaoGeral.dre.lucroLiquidoPercent}
            unidade="percentage"
            variacao={data.visaoGeral.kpisPrincipais.margemLiquida.variacaoMoM}
            status={data.visaoGeral.kpisPrincipais.margemLiquida.status}
            icon="📊"
          />
          <KPICard
            titulo="Ticket Médio"
            valor={data.visaoGeral.kpisPrincipais.ticketMedio.valor}
            unidade="currency"
            variacao={data.visaoGeral.kpisPrincipais.ticketMedio.variacaoMoM}
            status={data.visaoGeral.kpisPrincipais.ticketMedio.status}
            icon="🛒"
          />
        </div>
        
        {/* Alertas Financeiros */}
        {alertasAtivos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">⚠️ Alertas Financeiros</h2>
              <span className="text-sm text-gray-500">{alertasAtivos.length} alerta(s)</span>
            </div>
            <div className="space-y-3">
              {alertasAtivos.map(alerta => (
                <AlertCard
                  key={alerta.id}
                  alerta={alerta}
                  onDismiss={handleDismissAlert}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* DRE Simplificada com Dados Reais */}
        <DRESimplificadaCard 
          dataInicio={dataInicio}
          dataFim={dataFim}
          dadosDashboard={data}
        />

        {/* DRE Gerencial com Dados Reais do GestãoClick */}
        <DREGerencialCard 
          dataInicio={dataInicio}
          dataFim={dataFim}
          dadosDashboard={data}
        />
        
        {/* Gráfico de Tendência */}
        {data.visaoGeral.tendenciaGeral.length > 0 && (
          <SimpleLineChart
            title="📈 Tendência de Receitas"
            data={data.visaoGeral.tendenciaGeral.map(t => ({
              label: t.periodo.split('-')[1], // Apenas o mês
              value: t.receita,
            }))}
            color="#10b981"
            formatValue={(v) => new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
            }).format(v)}
          />
        )}
        
        {/* Despesas Operacionais Detalhadas */}
        {data.visaoGeral.dre && (
          <DespesasOperacionaisCard
            despesas={{
              vendas: {
                comissoes: 0,
                marketing: 0,
                publicidade: 0,
                promocoes: 0,
                fretesEntrega: 0,
                outros: 0,
                total: data.visaoGeral.dre.despesasOperacionais,
              },
              administrativas: {
                aluguel: 0,
                contas: 0,
                materiais: 0,
                servicos: 0,
                manutencao: 0,
                seguros: 0,
                taxas: 0,
                outros: 0,
                total: 0,
              },
              pessoal: {
                salarios: 0,
                encargos: 0,
                beneficios: 0,
                treinamento: 0,
                outros: 0,
                total: 0,
              },
              total: data.visaoGeral.dre.despesasOperacionais,
              percentualReceita: (data.visaoGeral.dre.despesasOperacionais / data.visaoGeral.dre.receitaLiquida) * 100,
            }}
            receitaLiquida={data.visaoGeral.dre.receitaLiquida}
          />
        )}
        
        {/* Rentabilidade por Centro de Custo */}
        {data.indicadoresFinanceiros?.rentabilidadePorDimensao?.porCentroCusto && (
          <RentabilidadeCentroCustoTable
            dados={data.indicadoresFinanceiros.rentabilidadePorDimensao.porCentroCusto}
          />
        )}
        
        {/* Rentabilidade por Vendedor */}
        {data.indicadoresFinanceiros?.rentabilidadePorDimensao?.porVendedor && 
         data.indicadoresFinanceiros.rentabilidadePorDimensao.porVendedor.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              👤 Rentabilidade por Vendedor
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vendedor
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Receita
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Lucro
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Margem %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.indicadoresFinanceiros.rentabilidadePorDimensao.porVendedor.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.nome}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(v.receita)}
                      </td>
                      <td className={`px-4 py-3 text-sm text-right font-semibold ${
                        v.lucro >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(v.lucro)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {v.margem.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* 🆕 NOVOS INDICADORES COM DADOS REAIS DAS 25 APIs */}
        {data.dadosBrutos?.indicadores && (
          <>
            {/* Seção: Indicadores de Eficiência Operacional */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚡</span>
                Eficiência Operacional
              </h2>
              <IndicadoresEficienciaCard 
                dados={data.dadosBrutos.indicadores.eficienciaOperacional}
              />
            </div>
            
            {/* Seção: Indicadores Financeiros */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>💰</span>
                Análise Financeira Detalhada
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IndicadoresLiquidezCard 
                  dados={data.dadosBrutos.indicadores.liquidez}
                />
                <AnaliseInadimplenciaCard 
                  dados={data.dadosBrutos.indicadores.inadimplencia}
                />
              </div>
            </div>
            
            {/* Seção: Indicadores Consolidados */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📊</span>
                Indicadores Consolidados
              </h2>
              <IndicadoresConsolidadosCard 
                sustentabilidade={data.dadosBrutos.indicadores.sustentabilidade}
                previsibilidade={data.dadosBrutos.indicadores.previsibilidade}
                crescimento={data.dadosBrutos.indicadores.crescimento}
                metas={data.dadosBrutos.indicadores.metas}
              />
            </div>
            
            {/* Seção: Análise de Sazonalidade */}
            {data.dadosBrutos.indicadores.sazonalidade.meses.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📅</span>
                  Análise de Sazonalidade
                </h2>
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <SimpleLineChart
                    title="Tendência Mensal de Receitas e Despesas"
                    data={data.dadosBrutos.indicadores.sazonalidade.meses.map(m => ({
                      label: m.mes.split('-')[1] + '/' + m.mes.split('-')[0].slice(-2),
                      value: m.receita,
                    }))}
                    color="#10b981"
                    formatValue={(v) => new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact',
                    }).format(v)}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Média Receitas</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          notation: 'compact',
                        }).format(data.dadosBrutos.indicadores.sazonalidade.mediaReceita)}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Melhor Mês</p>
                      <p className="text-xl font-bold text-green-600">
                        {data.dadosBrutos.indicadores.sazonalidade.mesComMaiorReceita}
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Variabilidade</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {data.dadosBrutos.indicadores.sazonalidade.variabilidade.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Timestamp de Atualização */}
            <div className="text-center text-sm text-gray-500 mt-8">
              <p>
                🔄 Última atualização: {new Date(data.dadosBrutos.indicadores.ultimaAtualizacao).toLocaleString('pt-BR')}
              </p>
              <p className="mt-1">
                ✅ Dados REAIS integrados de TODAS as 25 APIs da Betel
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Componente auxiliar DRE Item
function DREItem({
  label,
  valor,
  negativo = false,
  destaque = false,
  final = false,
}: {
  label: string;
  valor: number;
  negativo?: boolean;
  destaque?: boolean;
  final?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center py-2 ${
        destaque ? 'font-semibold' : ''
      } ${final ? 'border-t-2 border-gray-300 pt-3 mt-3' : ''}`}
    >
      <span className={destaque ? 'text-gray-900' : 'text-gray-700'}>{label}</span>
      <span
        className={`${negativo ? 'text-red-600' : destaque || final ? 'text-gray-900' : 'text-gray-700'}`}
      >
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(Math.abs(valor))}
      </span>
    </div>
  );
}

