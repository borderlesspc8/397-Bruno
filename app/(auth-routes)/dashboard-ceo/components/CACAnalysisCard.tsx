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
  AlertTriangle,
  Download,
  TrendingDown as ArrowDown,
  TrendingUp as ArrowUp
} from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CardSkeleton, ErrorState } from './loading-states';

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

        const response = await fetch(
          `/api/ceo/cac-analysis?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}`
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar análise de CAC');
        }

        const data = await response.json();
        setCacData(data);
      } catch (err) {
        setCacError(err instanceof Error ? err.message : 'Erro ao carregar análise');
        console.error('[CACAnalysisCard] Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCACAnalysis();
  }, [params.startDate, params.endDate]);

  // Formatadores
  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
    return formatted.replace(',00', '');
  };

  const formatPercentage = (value: number) => {
    const formatted = value.toFixed(2);
    return formatted.endsWith('.00') ? `${Math.round(value)}%` : `${formatted}%`;
  };

  const getCACStatus = (cac: number) => {
    if (cac <= 50) return { 
      status: 'Excelente', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50', 
      borderColor: 'border-green-200',
      icon: <TrendingUp className="h-5 w-5 text-green-600" /> 
    };
    if (cac <= 100) return { 
      status: 'Bom', 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50', 
      borderColor: 'border-blue-200',
      icon: <Activity className="h-5 w-5 text-blue-600" /> 
    };
    if (cac <= 150) return { 
      status: 'Atenção', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50', 
      borderColor: 'border-yellow-200',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-600" /> 
    };
    return { 
      status: 'Crítico', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50', 
      borderColor: 'border-red-200',
      icon: <TrendingDown className="h-5 w-5 text-red-600" /> 
    };
  };

  // Exportar dados
  const handleExport = () => {
    if (!cacData) return;
    
    const data = {
      periodo: cacData.periodo,
      metricas: {
        cacAtual: cacData.cacAtual,
        novosClientes: cacData.novosClientes,
        investimentoMarketing: cacData.investimentoMarketing,
        comparacao: cacData.comparacao,
        roi: cacData.roi
      },
      evolucao: cacData.evolucaoCAC,
      canais: cacData.canaisMarketing
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-cac-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <Badge className="bg-orange-100 text-orange-700 font-semibold">⚠️ Sem Dados</Badge>
        </div>
        <div className="text-center text-gray-600 py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-orange-500" />
          <p className="font-medium mb-2">Dados de CAC Indisponíveis</p>
          <p className="text-sm">Configure o módulo de Marketing para habilitar esta métrica</p>
        </div>
      </div>
    );
  }

  const cacStatus = getCACStatus(cacData.cacAtual);

  return (
    <div className="ios26-card p-6 ios26-animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-[#faba33]" />
            <h3 className="text-lg font-semibold">Análise de CAC</h3>
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
            disabled={!cacData}
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
        {/* CAC Principal */}
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              <h4 className="text-md font-semibold text-gray-900">Custo de Aquisição de Cliente</h4>
            </div>
            <Badge className={`${cacStatus.bgColor} ${cacStatus.color} border-2 ${cacStatus.borderColor} font-semibold`}>
              {cacStatus.status}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-gray-600 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium">CAC Atual</span>
              </div>
              <div className={`text-3xl font-bold ${cacStatus.color}`}>
                {formatCurrency(cacData.cacAtual)}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-gray-600 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Novos Clientes</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {cacData.novosClientes}
              </div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-gray-600 mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">Investimento</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatCurrency(cacData.investimentoMarketing)}
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-4">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  cacData.cacAtual > 150 ? 'bg-red-500' : 
                  cacData.cacAtual > 100 ? 'bg-yellow-500' : 
                  cacData.cacAtual > 50 ? 'bg-blue-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min((cacData.cacAtual / 200) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span className="text-green-600 font-medium">R$ 50</span>
              <span className="text-blue-600 font-medium">R$ 100</span>
              <span className="text-yellow-600 font-medium">R$ 150</span>
              <span className="text-red-600 font-medium">R$ 200+</span>
            </div>
          </div>
        </div>

        {/* Comparação e ROI em grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Comparação com Período Anterior */}
          <div className={`${
            cacData.comparacao.tendencia === 'melhorando' ? 'bg-green-50 border-green-200' :
            cacData.comparacao.tendencia === 'piorando' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          } rounded-xl p-4 border-2`}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">vs. Período Anterior</span>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">CAC Anterior</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(cacData.comparacao.cacAnterior)}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Variação</div>
                <div className="flex items-center gap-2">
                  {cacData.comparacao.tendencia === 'melhorando' ? (
                    <ArrowDown className="h-5 w-5 text-green-600" />
                  ) : cacData.comparacao.tendencia === 'piorando' ? (
                    <ArrowUp className="h-5 w-5 text-red-600" />
                  ) : (
                    <Activity className="h-5 w-5 text-blue-600" />
                  )}
                  <span className={`text-2xl font-bold ${
                    cacData.comparacao.tendencia === 'melhorando' ? 'text-green-600' :
                    cacData.comparacao.tendencia === 'piorando' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {cacData.comparacao.variacaoPercentual > 0 ? '+' : ''}{formatPercentage(cacData.comparacao.variacaoPercentual)}
                  </span>
                </div>
                <div className={`text-xs font-medium mt-1 capitalize ${
                  cacData.comparacao.tendencia === 'melhorando' ? 'text-green-600' :
                  cacData.comparacao.tendencia === 'piorando' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {cacData.comparacao.tendencia}
                </div>
              </div>
            </div>
          </div>

          {/* ROI e LTV */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border-2 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-700">ROI e Valor do Cliente</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">LTV Estimado</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatCurrency(cacData.roi.ltvEstimado)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">ROI</div>
                <div className="text-lg font-bold text-green-600">
                  {formatPercentage(cacData.roi.roiPercentual)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">LTV/CAC Ratio</div>
                <div className="text-lg font-bold text-blue-600">
                  {cacData.roi.ratioLtvCac.toFixed(1)}x
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Payback</div>
                <div className="text-lg font-bold text-orange-600">
                  {cacData.roi.paybackPeriod.toFixed(1)} meses
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de detalhes */}
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="outline"
          size="sm"
          className="w-full ios26-button"
        >
          {showDetails ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {showDetails ? 'Ocultar' : 'Mostrar'} Análise Detalhada
        </Button>

        {/* Detalhes expandidos */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Evolução do CAC */}
            {cacData.evolucaoCAC.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Evolução do CAC (últimos 6 meses)
                </h5>
                <div className="space-y-2">
                  {cacData.evolucaoCAC.map((mes, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium text-gray-700">{mes.mes}</span>
                      <div className="flex items-center gap-3">
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

            {/* Benchmarking */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-600" />
                Benchmarks de Mercado
              </h5>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 bg-green-50 rounded text-xs border border-green-200">
                  <div className="font-medium text-green-800">Excelente</div>
                  <div className="text-green-600">≤ {formatCurrency(cacData.benchmarking.benchmarks.excelente)}</div>
                </div>
                <div className="p-2 bg-blue-50 rounded text-xs border border-blue-200">
                  <div className="font-medium text-blue-800">Bom</div>
                  <div className="text-blue-600">≤ {formatCurrency(cacData.benchmarking.benchmarks.bom)}</div>
                </div>
                <div className="p-2 bg-yellow-50 rounded text-xs border border-yellow-200">
                  <div className="font-medium text-yellow-800">Atenção</div>
                  <div className="text-yellow-600">≤ {formatCurrency(cacData.benchmarking.benchmarks.regular)}</div>
                </div>
                <div className="p-2 bg-red-50 rounded text-xs border border-red-200">
                  <div className="font-medium text-red-800">Crítico</div>
                  <div className="text-red-600">&gt; {formatCurrency(cacData.benchmarking.benchmarks.critico)}</div>
                </div>
              </div>
              <div className="p-3 bg-white rounded border border-gray-200">
                <div className="text-xs font-medium text-gray-700 mb-1">💡 Recomendação</div>
                <div className="text-sm text-gray-600">{cacData.benchmarking.recomendacao}</div>
              </div>
            </div>

            {/* Insights */}
            {cacData.insights.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  Insights e Recomendações
                </h5>
                <div className="space-y-2">
                  {cacData.insights.slice(0, 3).map((insight, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      insight.tipo === 'positivo' ? 'border-green-200 bg-green-50' :
                      insight.tipo === 'negativo' ? 'border-red-200 bg-red-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-start gap-2">
                        {insight.tipo === 'positivo' ? (
                          <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : insight.tipo === 'negativo' ? (
                          <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Activity className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{insight.titulo}</span>
                            <Badge className={`text-xs ${
                              insight.prioridade === 'alta' ? 'bg-red-100 text-red-800' :
                              insight.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {insight.prioridade}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-700">{insight.descricao}</p>
                          <p className="text-xs text-gray-600 mt-1">→ {insight.acao}</p>
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
