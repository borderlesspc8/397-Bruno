/**
 * 📊 CEO DASHBOARD - CARD DRE SIMPLIFICADA
 * 
 * Componente para exibir DRE simplificada com dados REAIS das APIs da Betel
 * Filtra por unidades Matriz e Filial Golden
 */

'use client';

import React, { useState, useEffect } from 'react';
import type { DRESimplificadaBetel, DREConsolidadaBetel } from '../_services/ceo-dre-betel.service';
import CEODREBetelService from '../_services/ceo-dre-betel.service';

interface DRESimplificadaCardProps {
  dataInicio: Date;
  dataFim: Date;
  dadosDashboard?: any; // Dados do dashboard CEO quando disponíveis
}

export function DRESimplificadaCard({ dataInicio, dataFim, dadosDashboard }: DRESimplificadaCardProps) {
  const [dados, setDados] = useState<DREConsolidadaBetel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<'Matriz' | 'Filial Golden' | 'Consolidado'>('Consolidado');

  useEffect(() => {
    // Se temos dados do dashboard, usar eles; senão carregar via API
    if (dadosDashboard?.dadosBrutos?.dreSimplificada) {
      setDados(dadosDashboard.dadosBrutos.dreSimplificada);
      setLoading(false);
    } else {
      carregarDados();
    }
  }, [dataInicio, dataFim, dadosDashboard]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);

    try {
      const dados = await CEODREBetelService.calcularDREConsolidada(dataInicio, dataFim);
      setDados(dados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar DRE');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getDREAtual = () => {
    if (!dados) return null;
    return dados[unidadeSelecionada.toLowerCase() as keyof DREConsolidadaBetel];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Carregando DRE...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="text-center py-8">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao Carregar DRE</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={carregarDados}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const dre = getDREAtual();
  if (!dre) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            DRE Simplificada - Dados Reais
          </h2>
          
          {/* Seletor de Unidade */}
          <div className="flex gap-2">
            <button
              onClick={() => setUnidadeSelecionada('Matriz')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                unidadeSelecionada === 'Matriz'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Matriz
            </button>
            <button
              onClick={() => setUnidadeSelecionada('Filial Golden')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                unidadeSelecionada === 'Filial Golden'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Filial Golden
            </button>
            <button
              onClick={() => setUnidadeSelecionada('Consolidado')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                unidadeSelecionada === 'Consolidado'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Consolidado
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <p><strong>Período:</strong> {dre.periodo}</p>
          <p><strong>Unidade:</strong> {dre.unidade}</p>
          <p><strong>Fonte:</strong> {dre.metadata.fonte}</p>
          <p><strong>Última atualização:</strong> {new Date(dre.metadata.ultimaAtualizacao).toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* DRE */}
      <div className="space-y-3">
        <DREItem 
          label="Receita Bruta" 
          valor={dre.receitaBruta} 
          destaque 
        />
        <DREItem 
          label="(-) Impostos" 
          valor={-dre.impostos} 
          negativo 
        />
        <DREItem 
          label="(-) Descontos e Abatimentos" 
          valor={-dre.descontosAbatimentos} 
          negativo 
        />
        <DREItem 
          label="(-) Devoluções" 
          valor={-dre.devolucoes} 
          negativo 
        />
        <DREItem 
          label="(=) Receita Líquida" 
          valor={dre.receitaLiquida} 
          destaque 
        />
        <DREItem 
          label="(-) CMV (Custo de Mercadoria Vendida)" 
          valor={-dre.cmv} 
          negativo 
        />
        <DREItem 
          label="(=) Margem Bruta" 
          valor={dre.margemBruta} 
          destaque 
          percentual={dre.margemBrutaPercent}
        />
        <DREItem 
          label="(-) Despesas Operacionais" 
          valor={-dre.despesasOperacionais} 
          negativo 
          percentual={dre.despesasOperacionaisPercent}
        />
        <DREItem 
          label="(=) Lucro Operacional" 
          valor={dre.lucroOperacional} 
          destaque 
          percentual={dre.lucroOperacionalPercent}
        />
        <DREItem 
          label="(+/-) Resultado Financeiro" 
          valor={dre.resultadoFinanceiro} 
          positivo={dre.resultadoFinanceiro >= 0}
        />
        <DREItem 
          label="(=) Lucro Líquido" 
          valor={dre.lucroLiquido} 
          destaque 
          final 
          percentual={dre.lucroLiquidoPercent}
        />
      </div>

      {/* Resumo de Margens */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Margens</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-600 mb-1">Margem Bruta</p>
            <p className="text-2xl font-bold text-blue-900">
              {formatPercentage(dre.margemBrutaPercent)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {formatCurrency(dre.margemBruta)}
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-green-600 mb-1">Margem Operacional</p>
            <p className="text-2xl font-bold text-green-900">
              {formatPercentage(dre.lucroOperacionalPercent)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {formatCurrency(dre.lucroOperacional)}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-sm text-purple-600 mb-1">Margem Líquida</p>
            <p className="text-2xl font-bold text-purple-900">
              {formatPercentage(dre.lucroLiquidoPercent)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {formatCurrency(dre.lucroLiquido)}
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas do Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{dre.metadata.totalVendas}</p>
            <p className="text-sm text-gray-600">Vendas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{dre.metadata.totalPagamentos}</p>
            <p className="text-sm text-gray-600">Pagamentos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{dre.metadata.totalRecebimentos}</p>
            <p className="text-sm text-gray-600">Recebimentos</p>
          </div>
        </div>
      </div>

      {/* Comparação entre Unidades */}
      {dados && unidadeSelecionada === 'Consolidado' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparação entre Unidades</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Matriz</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Receita:</span>
                  <span className="font-medium">{formatCurrency(dados.matriz.receitaBruta)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lucro Líquido:</span>
                  <span className="font-medium">{formatCurrency(dados.matriz.lucroLiquido)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Margem:</span>
                  <span className="font-medium">{formatPercentage(dados.matriz.lucroLiquidoPercent)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Filial Golden</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Receita:</span>
                  <span className="font-medium">{formatCurrency(dados.filialGolden.receitaBruta)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lucro Líquido:</span>
                  <span className="font-medium">{formatCurrency(dados.filialGolden.lucroLiquido)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Margem:</span>
                  <span className="font-medium">{formatPercentage(dados.filialGolden.lucroLiquidoPercent)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
  positivo = false,
  percentual,
}: {
  label: string;
  valor: number;
  negativo?: boolean;
  destaque?: boolean;
  final?: boolean;
  positivo?: boolean;
  percentual?: number;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Math.abs(value));
  };

  const getTextColor = () => {
    if (final) return 'text-gray-900 font-bold';
    if (destaque) return 'text-gray-900 font-semibold';
    if (negativo) return 'text-red-600';
    if (positivo) return 'text-green-600';
    return 'text-gray-700';
  };

  return (
    <div
      className={`flex justify-between items-center py-2 ${
        destaque ? 'font-semibold' : ''
      } ${final ? 'border-t-2 border-gray-300 pt-3 mt-3' : ''}`}
    >
      <span className={getTextColor()}>{label}</span>
      <div className="flex items-center gap-2">
        <span className={getTextColor()}>
          {formatCurrency(valor)}
        </span>
        {percentual !== undefined && (
          <span className="text-xs text-gray-500">
            ({percentual.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
}

export default DRESimplificadaCard;
