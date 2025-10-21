'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Building2,
  Target,
  BarChart3,
  Eye,
  EyeOff,
  Percent,
  Award,
  TrendingUpIcon,
  Activity
} from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CardSkeleton, ErrorState, FadeIn } from './loading-states';

interface CostCenter {
  id: string;
  nome: string;
  cadastrado_em: string;
}

interface CostCenterProfitability {
  centroCustoId: string;
  centroCustoNome: string;
  receita: number;
  custosProdutos: number;
  custosOperacionais: number;
  custosTotais: number;
  lucroBruto: number;
  lucroLiquido: number;
  rentabilidade: number;
  margemBruta: number;
  margemLiquida: number;
  ranking: number;
  totalCentros: number;
  percentualReceitaTotal: number;
  percentualCustosTotal: number;
  custosPorCategoria: Array<{
    categoria: string;
    valor: number;
    percentual: number;
  }>;
  evolucaoRentabilidade: Array<{
    mes: string;
    receita: number;
    custos: number;
    rentabilidade: number;
  }>;
  insights: Array<{
    tipo: 'positivo' | 'negativo' | 'neutro';
    mensagem: string;
    recomendacao?: string;
  }>;
  periodo: {
    inicio: string;
    fim: string;
  };
  timestamp: string;
}

interface OperationalMetrics {
  costRevenueRatio: number;
  customerAcquisitionCost: number;
  costCenterProfitability: Array<{
    id: string;
    name: string;
    revenue: number;
    costs: number;
    profitability: number;
    margin: number;
  }>;
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
  const [centrosCusto, setCentrosCusto] = useState<CostCenter[]>([]);
  const [selectedCentroCusto, setSelectedCentroCusto] = useState<string>('');
  const [operationalData, setOperationalData] = useState<OperationalMetrics | null>(null);
  const [profitabilityData, setProfitabilityData] = useState<CostCenterProfitability | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCentros, setLoadingCentros] = useState(true);
  const [profitabilityError, setProfitabilityError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Carregar lista de centros de custo
  useEffect(() => {
    const loadCentrosCusto = async () => {
      try {
        setLoadingCentros(true);
        const response = await fetch('/api/ceo/data/centros-custos');
        const data = await response.json();
        
        if (data.data && Array.isArray(data.data)) {
          setCentrosCusto(data.data);
          console.log('[OperationalIndicatorsCard] Centros de custo carregados:', data.data.length);
        }
      } catch (err) {
        console.error('[OperationalIndicatorsCard] Erro ao carregar centros de custo:', err);
      } finally {
        setLoadingCentros(false);
      }
    };

    loadCentrosCusto();
  }, []);

  // Carregar dados operacionais gerais
  useEffect(() => {
    const loadOperationalData = async () => {
      try {
        // Garantir que sempre usa as datas do dashboard CEO
        const startDate = params.startDate.toISOString().split('T')[0];
        const endDate = params.endDate.toISOString().split('T')[0];
        
        console.log('[OperationalIndicatorsCard] Carregando métricas operacionais para período:', { 
          startDate, 
          endDate 
        });

        const response = await fetch(
          `/api/ceo/operational-metrics?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}`
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar métricas operacionais');
        }

        const data = await response.json();
        setOperationalData(data);
        console.log('[OperationalIndicatorsCard] Métricas operacionais carregadas:', {
          costRevenueRatio: data.costRevenueRatio,
          cac: data.customerAcquisitionCost
        });
      } catch (err) {
        console.error('[OperationalIndicatorsCard] Erro ao carregar métricas:', err);
      }
    };

    loadOperationalData();
  }, [params.startDate, params.endDate]);

  // Carregar análise de rentabilidade do centro de custo selecionado
  useEffect(() => {
    const loadProfitability = async () => {
      if (!selectedCentroCusto) {
        setProfitabilityData(null);
        return;
      }

      try {
        setLoading(true);
        setProfitabilityError(null);

        // Garantir que sempre usa as datas do dashboard CEO
        const startDate = params.startDate.toISOString().split('T')[0];
        const endDate = params.endDate.toISOString().split('T')[0];
        
        console.log('[OperationalIndicatorsCard] Carregando rentabilidade para período:', { 
          startDate, 
          endDate,
          centroCustoId: selectedCentroCusto
        });

        const response = await fetch(
          `/api/ceo/cost-center-profitability?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}&centroCustoId=${selectedCentroCusto}`
        );

        if (!response.ok) {
          throw new Error('Erro ao carregar análise de rentabilidade');
        }

        const data = await response.json();
        setProfitabilityData(data);
        console.log('[OperationalIndicatorsCard] Análise de rentabilidade carregada:', {
          centroCusto: data.centroCustoNome,
          receita: data.receita,
          custos: data.custosTotais,
          rentabilidade: data.rentabilidade,
          periodo: data.periodo
        });
      } catch (err) {
        setProfitabilityError(err instanceof Error ? err.message : 'Erro ao carregar análise');
        console.error('[OperationalIndicatorsCard] Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfitability();
  }, [selectedCentroCusto, params.startDate, params.endDate]);

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

  const getProfitabilityStatus = (rentabilidade: number) => {
    if (rentabilidade > 20) return { status: 'excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (rentabilidade > 10) return { status: 'good', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    if (rentabilidade > 0) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
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

  // Estado de Loading inicial
  if (loadingCentros || isLoading) {
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

  return (
    <FadeIn duration={400} delay={500}>
      <Card className="w-full h-full transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Métricas Operacionais</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Período: {params.startDate.toLocaleDateString('pt-BR')} até {params.endDate.toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => {
                setSelectedCentroCusto('');
                setProfitabilityData(null);
                onRefresh?.();
              }}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Métricas Gerais */}
          {operationalData && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center space-x-2 text-purple-600 mb-2">
                  <Percent className="h-4 w-4" />
                  <span className="text-sm font-medium">Custos/Receita</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {formatPercentage(operationalData.costRevenueRatio * 100)}
                </div>
                <div className="text-xs text-purple-700 mt-1">
                  {operationalData.costRevenueRatio <= 0.6 ? 'Excelente' :
                   operationalData.costRevenueRatio <= 0.8 ? 'Bom' : 'Atenção'}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center space-x-2 text-green-600 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">CAC</span>
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(operationalData.customerAcquisitionCost)}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  Por cliente adquirido
                </div>
              </div>
            </div>
          )}

          {/* Seletor de Centro de Custo */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Análise de Rentabilidade por Centro de Custo
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
          <div className="flex items-center justify-between">
                  <span className={selectedCentroCusto ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                    {selectedCentroCusto 
                      ? centrosCusto.find(c => c.id === selectedCentroCusto)?.nome || 'Selecione...'
                      : 'Selecione um centro de custo para análise...'}
            </span>
                  <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showDropdown && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  <div className="p-2">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2">
                      {centrosCusto.length} Centros de Custo Disponíveis
                    </div>
                    {centrosCusto.map((centro) => (
                      <button
                        key={centro.id}
                        onClick={() => {
                          setSelectedCentroCusto(centro.id);
                          setShowDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-md hover:bg-purple-50 transition-colors ${
                          selectedCentroCusto === centro.id ? 'bg-purple-100 text-purple-900 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">{centro.nome}</span>
                          {selectedCentroCusto === centro.id && (
                            <Badge className="bg-purple-600 text-white">Selecionado</Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              💡 Selecione um centro de custo para ver análise detalhada de rentabilidade
            </div>
          </div>
          
          {/* Loading da Análise */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <RefreshCw className="h-8 w-8 mx-auto text-purple-600 animate-spin" />
                <p className="text-sm text-gray-600">Analisando rentabilidade...</p>
              </div>
            </div>
          )}

          {/* Erro na Análise */}
          {profitabilityError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Erro ao carregar análise</p>
              </div>
              <p className="text-sm text-red-600 mt-1">{profitabilityError}</p>
            </div>
          )}

          {/* Estado Inicial - Sem Centro Selecionado */}
          {!selectedCentroCusto && !loading && (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum Centro de Custo Selecionado
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Selecione um centro de custo acima para visualizar análise de rentabilidade
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-purple-800">
                  <strong>{centrosCusto.length} centros de custo</strong> disponíveis para análise de rentabilidade
                </p>
              </div>
            </div>
          )}

          {/* Análise de Rentabilidade */}
          {profitabilityData && !loading && (
            <div className="space-y-6">
              {/* Resumo de Rentabilidade */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-purple-900">
                    {profitabilityData.centroCustoNome}
                  </h3>
                  <Badge className={`${getProfitabilityStatus(profitabilityData.rentabilidade).bgColor} ${getProfitabilityStatus(profitabilityData.rentabilidade).color}`}>
                    #{profitabilityData.ranking} de {profitabilityData.totalCentros}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-purple-600 mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs font-medium">Receita</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(profitabilityData.receita)}
                    </div>
          </div>
          
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-purple-600 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-medium">Custos</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {formatCurrency(profitabilityData.custosTotais)}
          </div>
        </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 text-purple-600 mb-1">
                      <TrendingUpIcon className="h-4 w-4" />
                      <span className="text-xs font-medium">Rentabilidade</span>
                    </div>
                    <div className={`text-2xl font-bold ${getProfitabilityStatus(profitabilityData.rentabilidade).color}`}>
                      {formatPercentage(profitabilityData.rentabilidade)}
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
                  {/* Métricas Financeiras */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span>Métricas Financeiras</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">Lucro Bruto</div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(profitabilityData.lucroBruto)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Margem: {formatPercentage(profitabilityData.margemBruta)}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-xs text-gray-600">Lucro Líquido</div>
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(profitabilityData.lucroLiquido)}
                        </div>
                        <div className="text-xs text-gray-600">
                          Margem: {formatPercentage(profitabilityData.margemLiquida)}
                        </div>
                      </div>
          </div>
        </div>

                  {/* Custos por Categoria */}
                  {profitabilityData.custosPorCategoria.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Target className="h-4 w-4 text-orange-600" />
                        <span>Custos por Categoria</span>
                      </h4>
                      <div className="space-y-2">
                        {profitabilityData.custosPorCategoria.map((categoria, index) => (
                          <div key={index} className="space-y-1">
          <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{categoria.categoria}</span>
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-orange-100 text-orange-800">{categoria.percentual}%</Badge>
                                <span className="text-sm font-bold text-gray-900">
                                  {formatCurrency(categoria.valor)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-orange-500"
                                style={{ width: `${categoria.percentual}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evolução da Rentabilidade */}
                  {profitabilityData.evolucaoRentabilidade.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>Evolução da Rentabilidade</span>
                      </h4>
                      <div className="space-y-2">
                        {profitabilityData.evolucaoRentabilidade.map((mes, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">{mes.mes}</span>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs text-gray-600">{formatCurrency(mes.receita)}</span>
                              <span className={`text-sm font-bold ${
                                mes.rentabilidade > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatPercentage(mes.rentabilidade)}
              </span>
            </div>
          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {profitabilityData.insights.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span>Insights e Recomendações</span>
                      </h4>
                      <div className="space-y-2">
                        {profitabilityData.insights.map((insight, index) => (
                          <div key={index} className={`p-3 rounded-lg border ${getInsightColor(insight.tipo)}`}>
                            <div className="flex items-start space-x-2">
                              {getInsightIcon(insight.tipo)}
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{insight.mensagem}</p>
                                {insight.recomendacao && (
                                  <p className="text-xs text-gray-600 mt-1">{insight.recomendacao}</p>
                                )}
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
          )}
      </CardContent>
    </Card>
    </FadeIn>
  );
}

export default OperationalIndicatorsCard;