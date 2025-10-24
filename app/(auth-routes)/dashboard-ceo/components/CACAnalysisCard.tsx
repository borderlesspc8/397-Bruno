'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign,
  RefreshCw,
  Eye,
  EyeOff,
  Percent,
  Award,
  Activity,
  BarChart3,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CardSkeleton, ErrorState, FadeIn } from './loading-states';

interface CACAnalysis {
  cacAtual: number;
  novosClientes: number;
  investimentoMarketing: number;
  evolucaoCAC: Array<{
    mes: string;
    cac: number;
    novosClientes: number;
    investimentoMarketing: number;
  }>;
  comparacao: {
    cacAnterior: number;
    variacaoCAC: number;
    variacaoPercentual: number;
    tendencia: 'melhorando' | 'piorando' | 'estavel';
  };
  roi: {
    ltvEstimado: number;
    roiPercentual: number;
    paybackPeriod: number;
    ratioLtvCac: number;
  };
  canaisMarketing: Array<{
    canal: string;
    investimento: number;
    clientesGerados: number;
    cacCanal: number;
    eficiencia: 'excelente' | 'bom' | 'regular' | 'ruim';
  }>;
  benchmarking: {
    posicao: 'excelente' | 'bom' | 'regular' | 'critico';
    benchmarks: {
      excelente: number;
      bom: number;
      regular: number;
      critico: number;
    };
    recomendacao: string;
  };
  insights: Array<{
    tipo: 'positivo' | 'negativo' | 'neutro';
    titulo: string;
    descricao: string;
    acao: string;
    prioridade: 'alta' | 'media' | 'baixa';
  }>;
  periodo: {
    inicio: string;
    fim: string;
  };
  timestamp: string;
}

interface CACAnalysisCardProps {
  params: CEODashboardParams;
  isLoading?: boolean;
  error?: Error | string;
  onRefresh?: () => void;
}

export function CACAnalysisCard({ 
  params, 
  isLoading = false,
  error,
  onRefresh 
}: CACAnalysisCardProps) {
  const [cacData, setCacData] = useState<CACAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [cacError, setCacError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Carregar análise de CAC
  useEffect(() => {
    const loadCACAnalysis = async () => {
      try {
        setLoading(true);
        setCacError(null);

        // Garantir que sempre usa as datas do dashboard CEO
        const startDate = params.startDate.toISOString().split('T')[0];
        const endDate = params.endDate.toISOString().split('T')[0];
        
        console.log('[CACAnalysisCard] Carregando análise de CAC para período:', { 
          startDate, 
          endDate 
        });

        const response = await fetch(
          `/api/ceo/cac-analysis?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}`
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar análise de CAC');
        }

        const data = await response.json();
        setCacData(data);
        console.log('[CACAnalysisCard] Análise de CAC carregada:', {
          cacAtual: data.cacAtual,
          novosClientes: data.novosClientes,
          investimento: data.investimentoMarketing,
          periodo: data.periodo
        });
      } catch (err) {
        setCacError(err instanceof Error ? err.message : 'Erro ao carregar análise');
        console.error('[CACAnalysisCard] Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCACAnalysis();
  }, [params.startDate, params.endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getCACStatus = (cac: number) => {
    if (cac <= 50) return { status: 'excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (cac <= 100) return { status: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (cac <= 150) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getEficienciaColor = (eficiencia: string) => {
    switch (eficiencia) {
      case 'excelente': return 'text-green-600 bg-green-100';
      case 'bom': return 'text-blue-600 bg-blue-100';
      case 'regular': return 'text-yellow-600 bg-yellow-100';
      case 'ruim': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getInsightIcon = (tipo: string) => {
    switch (tipo) {
      case 'positivo': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negativo': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightColor = (tipo: string) => {
    switch (tipo) {
      case 'positivo': return 'border-green-200 bg-green-50';
      case 'negativo': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Estado de Loading
  if (loading || isLoading) {
    return <CardSkeleton showHeader={true} contentRows={8} className="h-full" />;
  }

  // Estado de Erro
  if (error || cacError) {
    return (
      <ErrorState
        title="Erro na Análise de CAC"
        message="Não foi possível carregar a análise de CAC."
        error={error || cacError}
        onRetry={onRefresh}
        variant="card"
        className="w-full h-full"
      />
    );
  }

  // Estado de Sem Dados
  if (!cacData) {
    return (
      <div className="ios26-card p-6 ios26-animate-fade-in border-orange-200 bg-orange-50/50">
        <div className="flex flex-row items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-[#faba33]" />
            <h3 className="text-lg font-semibold">Análise de CAC</h3>
          </div>
          <Badge className="bg-orange-100 text-orange-700">⚠️ Sem Dados</Badge>
        </div>
        <div className="space-y-4">
          <div className="text-center text-gray-600 py-8">
            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-orange-500" />
            <p className="font-medium mb-2">Dados de CAC Indisponíveis</p>
            <p className="text-sm">Para calcular o CAC, são necessários dados de:</p>
            <ul className="text-sm mt-2 space-y-1">
              <li>• Investimento em Marketing</li>
              <li>• Novos Clientes Adquiridos</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">Configure o módulo de Marketing para habilitar esta métrica</p>
          </div>
        </div>
      </div>
    );
  }

  const cacStatus = getCACStatus(cacData.cacAtual);

  return (
    <div className="ios26-card p-6 ios26-animate-fade-in">
      {/* Header */}
      <div className="flex flex-row items-center justify-between mb-6">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-[#faba33]" />
            <h3 className="text-lg font-semibold">Análise de CAC</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Período: {params.startDate.toLocaleDateString('pt-BR')} até {params.endDate.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button
          onClick={() => {
            setCacData(null);
            onRefresh?.();
          }}
          variant="outline"
          size="sm"
          disabled={loading}
          className="ios26-button"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
        
      {/* Content */}
      <div className="space-y-6">
          {/* CAC Principal */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-900">
                Custo de Aquisição de Cliente
              </h3>
              <Badge className={`${cacStatus.bgColor} ${cacStatus.color}`}>
                {cacData.benchmarking.posicao.toUpperCase()}
              </Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-medium">CAC Atual</span>
                </div>
                <div className={`text-3xl font-bold ${cacStatus.color}`}>
                  {formatCurrency(cacData.cacAtual)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-medium">Novos Clientes</span>
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {cacData.novosClientes}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-medium">Investimento</span>
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {formatCurrency(cacData.investimentoMarketing)}
                </div>
              </div>
            </div>
          </div>

          {/* Comparação com Período Anterior */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span>Comparação com Período Anterior</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">CAC Anterior</div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(cacData.comparacao.cacAnterior)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Variação</div>
                <div className="flex items-center space-x-1">
                  {cacData.comparacao.tendencia === 'melhorando' ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : cacData.comparacao.tendencia === 'piorando' ? (
                    <TrendingUp className="h-4 w-4 text-red-600" />
                  ) : (
                    <Activity className="h-4 w-4 text-blue-600" />
                  )}
                  <span className={`text-lg font-bold ${
                    cacData.comparacao.tendencia === 'melhorando' ? 'text-green-600' :
                    cacData.comparacao.tendencia === 'piorando' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {cacData.comparacao.variacaoPercentual > 0 ? '+' : ''}{formatPercentage(cacData.comparacao.variacaoPercentual)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 capitalize">
                  {cacData.comparacao.tendencia}
                </div>
              </div>
            </div>
          </div>

          {/* ROI e LTV */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <Award className="h-4 w-4 text-purple-600" />
              <span>ROI e Valor do Cliente</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">LTV Estimado</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatCurrency(cacData.roi.ltvEstimado)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">ROI</div>
                <div className="text-lg font-bold text-green-600">
                  {formatPercentage(cacData.roi.roiPercentual)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">LTV/CAC Ratio</div>
                <div className="text-lg font-bold text-blue-600">
                  {cacData.roi.ratioLtvCac.toFixed(1)}x
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-xs text-gray-600">Payback (meses)</div>
                <div className="text-lg font-bold text-orange-600">
                  {cacData.roi.paybackPeriod.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Detalhes */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">Análise Detalhada</h4>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="outline"
              size="sm"
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
            </Button>
          </div>

          {showDetails && (
            <div className="space-y-6">
              {/* Evolução do CAC */}
              {cacData.evolucaoCAC.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Evolução do CAC</span>
                  </h4>
                  <div className="space-y-2">
                    {cacData.evolucaoCAC.map((mes, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-700">{mes.mes}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-600">{mes.novosClientes} clientes</span>
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(mes.cac)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Canais de Marketing */}
              {cacData.canaisMarketing.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span>Canais de Marketing</span>
                  </h4>
                  <div className="space-y-2">
                    {cacData.canaisMarketing.map((canal, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{canal.canal}</span>
                          <div className="flex items-center space-x-2">
                            <Badge className={getEficienciaColor(canal.eficiencia)}>
                              {canal.eficiencia}
                            </Badge>
                            <span className="text-sm font-bold text-gray-900">
                              {formatCurrency(canal.cacCanal)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>R$ {canal.investimento} • {canal.clientesGerados} clientes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benchmarks */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span>Benchmarks de Mercado</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-green-50 rounded text-xs">
                    <div className="font-medium text-green-800">Excelente</div>
                    <div className="text-green-600">≤ {formatCurrency(cacData.benchmarking.benchmarks.excelente)}</div>
                  </div>
                  <div className="p-2 bg-blue-50 rounded text-xs">
                    <div className="font-medium text-blue-800">Bom</div>
                    <div className="text-blue-600">≤ {formatCurrency(cacData.benchmarking.benchmarks.bom)}</div>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded text-xs">
                    <div className="font-medium text-yellow-800">Regular</div>
                    <div className="text-yellow-600">≤ {formatCurrency(cacData.benchmarking.benchmarks.regular)}</div>
                  </div>
                  <div className="p-2 bg-red-50 rounded text-xs">
                    <div className="font-medium text-red-800">Crítico</div>
                    <div className="text-red-600">&gt; {formatCurrency(cacData.benchmarking.benchmarks.critico)}</div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-xs font-medium text-gray-700">Recomendação</div>
                  <div className="text-sm text-gray-600 mt-1">{cacData.benchmarking.recomendacao}</div>
                </div>
              </div>

              {/* Insights */}
              {cacData.insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span>Insights e Recomendações</span>
                  </h4>
                  <div className="space-y-2">
                    {cacData.insights.map((insight, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getInsightColor(insight.tipo)}`}>
                        <div className="flex items-start space-x-2">
                          {getInsightIcon(insight.tipo)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">{insight.titulo}</span>
                              <Badge className={getPriorityColor(insight.prioridade)}>
                                {insight.prioridade}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{insight.descricao}</p>
                            <p className="text-xs text-gray-600">{insight.acao}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export default CACAnalysisCard;