'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  RefreshCw,
  Target,
  Percent,
  Activity,
  Download,
  Info,
  Zap,
  ShoppingCart,
  Wallet,
  PieChart
} from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CardSkeleton, ErrorState } from './loading-states';

interface OperationalMetrics {
  costRevenueRatio: number;
  customerAcquisitionCost: number;
  details?: {
    totalReceita: number;
    totalCustos: number;
    totalCustosProdutos: number;
    totalDespesasOperacionais: number;
    novosClientes: number;
    investimentoMarketing: number;
  };
}

interface OperationalIndicatorsCardProps {
  params: CEODashboardParams;
  isLoading?: boolean;
  error?: Error | string;
  onRefresh?: () => void;
}

export function OperationalIndicatorsCard({ 
  params, 
  isLoading = false,
  error,
  onRefresh 
}: OperationalIndicatorsCardProps) {
  const [operationalData, setOperationalData] = useState<OperationalMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar dados operacionais
  useEffect(() => {
    const loadOperationalData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/ceo/operational-metrics?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}`
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar métricas operacionais');
        }

        const data = await response.json();
        setOperationalData(data);
      } catch (err) {
        console.error('[OperationalIndicators] Erro ao carregar métricas:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOperationalData();
  }, [params.startDate, params.endDate]);

  // Formatadores
  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    
    // Remove ,00 se os centavos forem zero
    return formatted.replace(',00', '');
  };

  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(2);
    // Remove ,00 se os decimais forem zero
    return formatted.endsWith('.00') ? `${Math.round(value)}%` : `${formatted}%`;
  };

  const getCostRatioStatus = (ratio: number) => {
    if (ratio <= 0.6) return { status: 'Excelente', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: <TrendingUp className="h-4 w-4" /> };
    if (ratio <= 0.8) return { status: 'Bom', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: <Activity className="h-4 w-4" /> };
    if (ratio <= 1.0) return { status: 'Atenção', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', icon: <AlertTriangle className="h-4 w-4" /> };
    return { status: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: <TrendingDown className="h-4 w-4" /> };
  };

  // Exportar dados
  const handleExport = () => {
    if (!operationalData) return;
    
    const data = {
      periodo: {
        inicio: params.startDate.toISOString(),
        fim: params.endDate.toISOString()
      },
      metricas: {
        custosReceita: operationalData.costRevenueRatio,
        detalhes: operationalData.details
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metricas-operacionais-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Estado de Loading inicial
  if (loading || isLoading) {
    return <CardSkeleton showHeader={true} contentRows={8} className="h-full" />;
  }

  // Estado de Erro
  if (error) {
    return (
      <ErrorState
        title="Erro nas Métricas Operacionais"
        message="Não foi possível carregar as métricas operacionais."
        error={error}
        onRetry={onRefresh}
        variant="card"
        className="w-full h-full"
      />
    );
  }

  const costRatioStatus = operationalData ? getCostRatioStatus(operationalData.costRevenueRatio) : null;

  return (
    <div className="ios26-card p-6 ios26-animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-[#faba33]" />
            <h3 className="text-lg font-semibold">Métricas Operacionais</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {params.startDate.toLocaleDateString('pt-BR')} até {params.endDate.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="ios26-button"
            disabled={!operationalData}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            disabled={loading}
            className="ios26-button"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Resumo Financeiro */}
        {operationalData && operationalData.details && (
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 border-2 border-indigo-200">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-indigo-600" />
              <h4 className="text-md font-semibold text-gray-900">Resumo Financeiro</h4>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Receita Total</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(operationalData.details.totalReceita)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Custos Totais</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(operationalData.details.totalCustos)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Margem de Lucro</p>
                <p className={`text-xl font-bold ${(1 - operationalData.costRevenueRatio) > 0.15 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {formatPercentage((1 - operationalData.costRevenueRatio) * 100)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Lucro Líquido</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(operationalData.details.totalReceita - operationalData.details.totalCustos)}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-indigo-200 grid grid-cols-2 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-gray-600">Custos de Produtos</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(operationalData.details.totalCustosProdutos)}
                </p>
                <p className="text-xs text-purple-600 font-medium mt-0.5">
                  {formatPercentage((operationalData.details.totalCustosProdutos / operationalData.details.totalReceita) * 100)} da receita
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-orange-600" />
                  <p className="text-xs text-gray-600">Despesas Operacionais</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(operationalData.details.totalDespesasOperacionais)}
                </p>
                <p className="text-xs text-orange-600 font-medium mt-0.5">
                  {formatPercentage((operationalData.details.totalDespesasOperacionais / operationalData.details.totalReceita) * 100)} da receita
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Métrica Principal: Relação Custos/Receita */}
        {operationalData && costRatioStatus && (
          <div className={`${costRatioStatus.bgColor} rounded-xl p-6 border-2 ${costRatioStatus.borderColor}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Percent className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Relação Custos/Receita</span>
                </div>
                <div className={`text-4xl font-bold ${costRatioStatus.color}`}>
                  {formatPercentage(operationalData.costRevenueRatio * 100)}
                </div>
              </div>
              <div className={`p-3 rounded-full ${costRatioStatus.bgColor} border-2 ${costRatioStatus.borderColor}`}>
                {costRatioStatus.icon}
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <Badge className={`${costRatioStatus.bgColor} ${costRatioStatus.color} border-2 ${costRatioStatus.borderColor} font-semibold`}>
                {costRatioStatus.status}
              </Badge>
              <span className="text-sm text-gray-700 font-medium">
                Margem: {formatPercentage((1 - operationalData.costRevenueRatio) * 100)}
              </span>
            </div>

            {/* Barra de progresso visual */}
            <div className="mt-4">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${operationalData.costRevenueRatio > 0.8 ? 'bg-red-500' : operationalData.costRevenueRatio > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(operationalData.costRevenueRatio * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span className="text-green-600 font-medium">60%</span>
                <span className="text-yellow-600 font-medium">80%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Explicação */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                {operationalData.costRevenueRatio <= 0.6 ? (
                  <>✅ <strong>Excelente:</strong> Custos bem controlados. Margem de lucro saudável acima de 40%.</>
                ) : operationalData.costRevenueRatio <= 0.8 ? (
                  <>👍 <strong>Bom:</strong> Custos sob controle. Margem de lucro entre 20-40%.</>
                ) : operationalData.costRevenueRatio <= 1.0 ? (
                  <>⚠️  <strong>Atenção:</strong> Custos elevados. Margem de lucro abaixo de 20%. Revise despesas.</>
                ) : (
                  <>🚨 <strong>Crítico:</strong> Custos maiores que receita. Empresa operando com prejuízo!</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Distribuição de Custos - Visual Simplificado */}
        {operationalData && operationalData.details && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5 text-purple-600" />
              <h4 className="text-md font-semibold text-gray-900">Composição de Custos</h4>
            </div>
            
            {/* Gráfico de barras horizontal */}
            <div className="space-y-4">
              {/* Custos de Produtos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">Custos de Produtos</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(operationalData.details.totalCustosProdutos)}</p>
                    <p className="text-xs text-purple-600 font-semibold">
                      {formatPercentage((operationalData.details.totalCustosProdutos / operationalData.details.totalCustos) * 100)}
                    </p>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                    style={{ width: `${(operationalData.details.totalCustosProdutos / operationalData.details.totalCustos) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatPercentage((operationalData.details.totalCustosProdutos / operationalData.details.totalReceita) * 100)} da receita
                </p>
              </div>

              {/* Despesas Operacionais */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-gray-900">Despesas Operacionais</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(operationalData.details.totalDespesasOperacionais)}</p>
                    <p className="text-xs text-orange-600 font-semibold">
                      {formatPercentage((operationalData.details.totalDespesasOperacionais / operationalData.details.totalCustos) * 100)}
                    </p>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                    style={{ width: `${(operationalData.details.totalDespesasOperacionais / operationalData.details.totalCustos) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatPercentage((operationalData.details.totalDespesasOperacionais / operationalData.details.totalReceita) * 100)} da receita
                </p>
              </div>
            </div>

            {/* Totais */}
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Total de Custos</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(operationalData.details.totalCustos)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Insights e Alertas */}
        {operationalData && operationalData.details && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-200">
            <div className="flex items-center gap-2 mb-4">
              <Info className="h-5 w-5 text-yellow-600" />
              <h4 className="text-md font-semibold text-gray-900">Insights e Recomendações</h4>
            </div>
            
            <div className="space-y-3">
              {/* Insight sobre Margem */}
              <div className={`p-4 rounded-lg border-2 ${
                (1 - operationalData.costRevenueRatio) > 0.15 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  {(1 - operationalData.costRevenueRatio) > 0.15 ? (
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Margem de Lucro: {formatPercentage((1 - operationalData.costRevenueRatio) * 100)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {(1 - operationalData.costRevenueRatio) > 0.15 
                        ? 'Margem saudável acima de 15%. Continue monitorando para manter a rentabilidade.'
                        : 'Margem abaixo do recomendado. Revise custos e despesas para melhorar a rentabilidade.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Insight sobre Custos de Produtos */}
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Custos de Produtos: {formatPercentage((operationalData.details.totalCustosProdutos / operationalData.details.totalReceita) * 100)} da receita
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCurrency(operationalData.details.totalCustosProdutos)} gastos com fornecedores e equipamentos. 
                      {(operationalData.details.totalCustosProdutos / operationalData.details.totalReceita) > 0.55 
                        ? ' Considere negociar melhores preços com fornecedores.'
                        : ' Margem de custo de produtos está adequada.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Insight sobre Despesas Operacionais */}
              <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="flex items-start gap-3">
                  <Wallet className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      Despesas Operacionais: {formatPercentage((operationalData.details.totalDespesasOperacionais / operationalData.details.totalReceita) * 100)} da receita
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {formatCurrency(operationalData.details.totalDespesasOperacionais)} em despesas fixas, salários, marketing e outras despesas. 
                      {(operationalData.details.totalDespesasOperacionais / operationalData.details.totalReceita) > 0.35 
                        ? ' Oportunidade de otimização identificada.'
                        : ' Nível de despesas está controlado.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Links para análises detalhadas */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs text-blue-800">
              <p className="font-semibold mb-2">Para análises mais detalhadas:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Análise de CAC:</strong> Veja evolução, ROI, LTV e canais de marketing no card ao lado</li>
                <li><strong>Centros de Custo:</strong> Analise despesas individuais por centro na aba "Centros de Custo"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OperationalIndicatorsCard;
