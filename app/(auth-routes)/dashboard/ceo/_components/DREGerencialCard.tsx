'use client';

import React, { useState, useEffect } from 'react';
import type { DREGerencialGestaoClick, DREConsolidadaGerencial } from '../_services/ceo-dre-gerencial.service';
import CEODREGerencialService from '../_services/ceo-dre-gerencial.service';

interface DREGerencialCardProps {
  dataInicio: Date;
  dataFim: Date;
  dadosDashboard?: any; // Dados do dashboard CEO quando disponíveis
}

export function DREGerencialCard({ dataInicio, dataFim, dadosDashboard }: DREGerencialCardProps) {
  const [dados, setDados] = useState<DREConsolidadaGerencial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<'Matriz' | 'Filial Golden' | 'Consolidado'>('Consolidado');

  useEffect(() => {
    // Se temos dados do dashboard, usar eles; senão carregar via API
    if (dadosDashboard?.dadosBrutos?.dreGerencial) {
      setDados(dadosDashboard.dadosBrutos.dreGerencial);
      setLoading(false);
    } else {
      carregarDados();
    }
  }, [dataInicio, dataFim, dadosDashboard]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ceo/dre-gerencial?data_inicio=${dataInicio.toISOString()}&data_fim=${dataFim.toISOString()}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar DRE Gerencial');
      }
      const result = await response.json();
      setDados(result.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar DRE Gerencial');
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

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const dreAtual = dados ? dados[unidadeSelecionada.toLowerCase().replace(' ', '') as keyof DREConsolidadaGerencial] : null;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 text-center">
        <div className="animate-pulse text-blue-600">Carregando DRE Gerencial...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-center text-red-800">
        Erro ao carregar DRE Gerencial: {error}
      </div>
    );
  }

  if (!dreAtual) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 text-center text-gray-600">
        Nenhum dado de DRE Gerencial disponível para o período e unidade selecionados.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">📊</span>
          DRE Gerencial - GestãoClick
        </h2>
        <div className="flex items-center gap-3">
          <label htmlFor="unidade-select" className="text-sm font-medium text-gray-700">
            Unidade:
          </label>
          <select
            id="unidade-select"
            value={unidadeSelecionada}
            onChange={(e) => setUnidadeSelecionada(e.target.value as any)}
            className="block w-auto rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="Consolidado">Consolidado</option>
            <option value="Matriz">Matriz</option>
            <option value="Filial Golden">Filial Golden</option>
          </select>
        </div>
      </div>

      {/* Período */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Período</h3>
            <p className="text-blue-700">{dreAtual.periodo}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-600">Fonte: {dreAtual.metadata.fonte}</p>
            <p className="text-sm text-blue-600">Atualizado: {new Date(dreAtual.metadata.ultimaAtualizacao).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* DRE Principal */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Demonstrativo de Resultado do Exercício</h3>
        
        {/* Receitas */}
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-3">RECEITAS</h4>
          <div className="space-y-2">
            <DREItem 
              label="Receita Bruta" 
              valor={dreAtual.receitaBruta} 
              destaque 
              cor="text-green-700"
            />
            <DREItem 
              label="(-) Impostos (15%)" 
              valor={-dreAtual.receitaBruta * 0.15} 
              negativo 
              cor="text-red-600"
            />
            <DREItem 
              label="(=) Receita Líquida" 
              valor={dreAtual.receitaLiquida} 
              destaque 
              final 
              cor="text-green-800"
            />
          </div>
        </div>

        {/* Custos */}
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-3">CUSTOS E DESPESAS</h4>
          <div className="space-y-2">
            <DREItem 
              label="(-) Custo de Produtos Vendidos" 
              valor={-dreAtual.custoProdutosVendidos} 
              negativo 
              cor="text-red-600"
            />
            <DREItem 
              label="(=) Margem Bruta" 
              valor={dreAtual.margemBruta} 
              destaque 
              cor="text-orange-700"
            />
            <div className="text-sm text-orange-600 ml-4">
              Margem Bruta: {formatPercent(dreAtual.margemBrutaPercent)}
            </div>
          </div>
        </div>

        {/* Despesas Operacionais */}
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-3">DESPESAS OPERACIONAIS</h4>
          <div className="space-y-2">
            <DREItem 
              label="(-) Despesas Administrativas" 
              valor={-dreAtual.despesasAdministrativas} 
              negativo 
              cor="text-red-600"
            />
            <DREItem 
              label="(-) Despesas Comerciais" 
              valor={-dreAtual.despesasComerciais} 
              negativo 
              cor="text-red-600"
            />
            <DREItem 
              label="(-) Outras Despesas Operacionais" 
              valor={-(dreAtual.despesasOperacionais - dreAtual.despesasAdministrativas - dreAtual.despesasComerciais)} 
              negativo 
              cor="text-red-600"
            />
            <DREItem 
              label="(=) Lucro Operacional" 
              valor={dreAtual.lucroOperacional} 
              destaque 
              cor="text-red-700"
            />
            <div className="text-sm text-red-600 ml-4">
              Margem Operacional: {formatPercent(dreAtual.lucroOperacionalPercent)}
            </div>
          </div>
        </div>

        {/* Resultado Final */}
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-3">RESULTADO FINANCEIRO</h4>
          <div className="space-y-2">
            <DREItem 
              label="(-) Despesas Financeiras" 
              valor={-dreAtual.despesasFinanceiras} 
              negativo 
              cor="text-red-600"
            />
            <DREItem 
              label="(=) Lucro Antes dos Impostos" 
              valor={dreAtual.lucroAntesImpostos} 
              destaque 
              cor="text-purple-700"
            />
            <DREItem 
              label="(=) LUCRO LÍQUIDO" 
              valor={dreAtual.lucroLiquido} 
              destaque 
              final 
              cor={dreAtual.lucroLiquido >= 0 ? "text-green-800" : "text-red-800"}
            />
            <div className="text-sm text-purple-600 ml-4">
              Margem Líquida: {formatPercent(dreAtual.lucroLiquidoPercent)}
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Receita Líquida</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(dreAtual.receitaLiquida)}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Margem Bruta</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPercent(dreAtual.margemBrutaPercent)}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Margem Operacional</p>
          <p className="text-2xl font-bold text-orange-600">
            {formatPercent(dreAtual.lucroOperacionalPercent)}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">Margem Líquida</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatPercent(dreAtual.lucroLiquidoPercent)}
          </p>
        </div>
      </div>

      {/* Detalhamento por Centro de Custo */}
      {dreAtual.detalhamentoCentroCusto.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Despesas por Centro de Custo</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Centro de Custo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Despesas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % do Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dreAtual.detalhamentoCentroCusto.map((centro, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {centro.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(centro.despesas)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercent(centro.percentualReceita)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detalhamento por Forma de Pagamento */}
      {dreAtual.detalhamentoFormaPagamento.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receitas por Forma de Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dreAtual.detalhamentoFormaPagamento.map((forma, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{forma.nome}</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Receita:</span>
                    <span className="text-sm font-medium text-gray-900">{formatCurrency(forma.receita)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">% do Total:</span>
                    <span className="text-sm font-medium text-gray-900">{formatPercent(forma.percentualReceita)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transações:</span>
                    <span className="text-sm font-medium text-gray-900">{forma.quantidadeTransacoes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estatísticas do Período */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas do Período</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{dreAtual.metadata.totalVendas}</p>
            <p className="text-sm text-gray-600">Total de Vendas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{dreAtual.metadata.totalPagamentos}</p>
            <p className="text-sm text-gray-600">Total de Pagamentos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{dreAtual.metadata.totalRecebimentos}</p>
            <p className="text-sm text-gray-600">Total de Recebimentos</p>
          </div>
        </div>
      </div>

      {/* Comparativo de Unidades */}
      {unidadeSelecionada === 'Consolidado' && dados && (
        <div className="mt-8 pt-8 border-t-2 border-blue-200">
          <h3 className="text-xl font-bold text-blue-800 mb-5 text-center">
            Comparativo de Unidades
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Matriz */}
            <div className="bg-blue-50 rounded-lg p-6 shadow-md">
              <h4 className="text-lg font-bold text-blue-900 mb-4">Matriz</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Receita Líquida:</span>
                  <span className="font-semibold text-blue-700">{formatCurrency(dados.matriz.receitaLiquida)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Lucro Líquido:</span>
                  <span className={`font-semibold ${dados.matriz.lucroLiquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(dados.matriz.lucroLiquido)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Margem Líquida:</span>
                  <span className="font-semibold text-blue-700">{formatPercent(dados.matriz.lucroLiquidoPercent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Vendas:</span>
                  <span className="font-semibold text-blue-700">{dados.matriz.metadata.totalVendas}</span>
                </div>
              </div>
            </div>

            {/* Filial Golden */}
            <div className="bg-yellow-50 rounded-lg p-6 shadow-md">
              <h4 className="text-lg font-bold text-yellow-900 mb-4">Filial Golden</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Receita Líquida:</span>
                  <span className="font-semibold text-yellow-700">{formatCurrency(dados.filialGolden.receitaLiquida)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Lucro Líquido:</span>
                  <span className={`font-semibold ${dados.filialGolden.lucroLiquido >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(dados.filialGolden.lucroLiquido)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Margem Líquida:</span>
                  <span className="font-semibold text-yellow-700">{formatPercent(dados.filialGolden.lucroLiquidoPercent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Vendas:</span>
                  <span className="font-semibold text-yellow-700">{dados.filialGolden.metadata.totalVendas}</span>
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
  cor = "text-gray-700",
}: {
  label: string;
  valor: number;
  negativo?: boolean;
  destaque?: boolean;
  final?: boolean;
  cor?: string;
}) {
  return (
    <div
      className={`flex justify-between items-center py-2 ${
        destaque ? 'font-semibold' : ''
      } ${final ? 'border-t-2 border-gray-300 pt-3 mt-3' : ''}`}
    >
      <span className={destaque ? 'text-gray-900' : cor}>{label}</span>
      <span
        className={`${negativo ? 'text-red-600' : destaque || final ? 'text-gray-900' : cor}`}
      >
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(Math.abs(valor))}
      </span>
    </div>
  );
}
