'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { TrendingUp, TrendingDown, Minus, FileText, RefreshCw, ChevronDown, ChevronUp, DollarSign, Calculator, BarChart3 } from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CEODREService, DetailedDREData, DRERatios, DRETrendAnalysis } from '../services/dre-service';
import { CardSkeleton, ErrorState, FadeIn } from './loading-states';

interface SimplifiedDRECardProps {
  params: CEODashboardParams;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function SimplifiedDRECard({ params, isLoading = false, onRefresh }: SimplifiedDRECardProps) {
  const [dreData, setDreData] = useState<DetailedDREData | null>(null);
  const [ratios, setRatios] = useState<DRERatios | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<DRETrendAnalysis[]>([]);
  const [marginEvolution, setMarginEvolution] = useState<{
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    trend: 'improving' | 'deteriorating' | 'stable';
    volatility: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Garantir que sempre usa as datas do dashboard CEO
      const startDate = params.startDate.toISOString().split('T')[0];
      const endDate = params.endDate.toISOString().split('T')[0];
      
      console.log('[DRE Simplificada] Carregando dados para período:', { startDate, endDate });

      const [
        dre,
        dreRatios,
        trend,
        marginEvo
      ] = await Promise.all([
        CEODREService.getDetailedDRE(params),
        CEODREService.getDRERatios(params),
        CEODREService.getDRETrendAnalysis(params, 6),
        CEODREService.getMarginEvolution(params)
      ]);

      setDreData(dre || null);
      setRatios(dreRatios || null);
      setTrendAnalysis(trend || []);
      setMarginEvolution(marginEvo || null);
      
      console.log('[DRE Simplificada] Dados carregados:', {
        receita: dre?.netRevenue,
        custos: dre?.totalCostOfGoodsSold,
        lucroBruto: dre?.grossProfit,
        lucroOperacional: dre?.operatingProfit,
        lucroLiquido: dre?.netProfit
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar DRE');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.startDate, params.endDate]);

  const handleRefresh = () => {
    loadData();
    onRefresh?.();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'deteriorating': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'deteriorating': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getMarginStatus = (margin: number): { status: string; color: string } => {
    if (margin >= 15) return { status: 'Excelente', color: 'bg-green-README.md' };
    if (margin >= 10) return { status: 'Boa', color: 'bg-orange-100 text-orange-800' };
    if (margin >= 5) return { status: 'Adequada', color: 'bg-yellow-100 text-yellow-800' };
    if (margin >= 0) return { status: 'Baixa', color: 'bg-red-100 text-red-800' };
    return { status: 'Negativa', color: 'bg-red-200 text-red-900' };
  };

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

  // Estado de Loading
  if (loading || isLoading) {
    return <CardSkeleton showHeader={true} contentRows={8} className="h-full" />;
  }

  // Estado de Erro
  if (error) {
    return (
      <ErrorState
        title="Erro na DRE Simplificada"
        message="Não foi possível carregar a DRE."
        error={error}
        onRetry={handleRefresh}
        variant="card"
        className="h-full"
      />
    );
  }

  // Estado sem dados
  if (!dreData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">DRE Simplificada</CardTitle>
          </div>
          <CardDescription>
            Demonstração do Resultado do Exercício
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum dado disponível para o período selecionado</p>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <FadeIn duration={400} delay={300}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">DRE Simplificada</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={() => setExpanded(!expanded)} variant="outline" size="sm">
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <CardDescription>
            Demonstração do Resultado do Exercício - Período: {params.startDate.toLocaleDateString('pt-BR')} até {params.endDate.toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Métricas Principais - Valores Absolutos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span>Métricas Principais</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Receita Líquida */}
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Vendas no Período</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {formatCurrency(dreData?.netRevenue || 0)}
                </div>
                <div className="text-xs text-orange-600">Receita Líquida</div>
                {ratios && (
                  <div className="mt-2">
                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                      100% (Base)
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Lucro Líquido */}
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Resultado Final</span>
                </div>
                <div className={`text-2xl font-bold mb-1 ${(dreData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(dreData?.netProfit || 0)}
                </div>
                <div className="text-xs text-green-600">Lucro Líquido</div>
                {marginEvolution && (
                  <div className="mt-2">
                    <Badge className={`text-xs ${getMarginStatus(marginEvolution?.netMargin || 0).color}`}>
                      {formatPercentage(marginEvolution?.netMargin || 0)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Análise de Custos - Valores Absolutos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span>Análise de Custos</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Custo Real das Vendas */}
              <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Custo Real das Vendas</span>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {formatCurrency(dreData?.totalCostOfGoodsSold || 0)}
                </div>
                <div className="text-xs text-red-600">Custo dos Produtos</div>
                {ratios && (
                  <div className="mt-2">
                    <Badge className="bg-red-100 text-red-800 text-xs">
                      {formatPercentage(ratios?.costOfGoodsSoldRatio || 0)}
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Lucro Bruto */}
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Lucro Bruto</span>
                </div>
                <div className={`text-2xl font-bold mb-1 ${(dreData?.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(dreData?.grossProfit || 0)}
                </div>
                <div className="text-xs text-green-600">Receita - Custos</div>
                {ratios && (
                  <div className="mt-2">
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {formatPercentage(ratios?.grossMarginRatio || 0)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resultados Operacionais - Valores Absolutos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
              <Calculator className="h-4 w-4 text-purple-600" />
              <span>Resultados Operacionais</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Lucro Operacional */}
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Lucro Operacional</span>
                </div>
                <div className={`text-2xl font-bold mb-1 ${(dreData?.operatingProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(dreData?.operatingProfit || 0)}
                </div>
                <div className="text-xs text-purple-600">Bruto - Despesas Op.</div>
                {ratios && (
                  <div className="mt-2">
                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                      {formatPercentage(ratios?.operatingMarginRatio || 0)}
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Despesas Operacionais */}
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Despesas Operacionais</span>
                </div>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {formatCurrency(dreData?.operatingExpenses || 0)}
                </div>
                <div className="text-xs text-orange-600">Despesas Totais</div>
                {ratios && (
                  <div className="mt-2">
                    <Badge className="bg-orange-100 text-orange-800 text-xs">
                      {formatPercentage(ratios?.operatingExpenseRatio || 0)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Margens Principais - Porcentagens */}
          {ratios && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 text-sm flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span>Margens (%)</span>
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">
                    {formatPercentage(ratios?.grossMarginRatio || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Margem Bruta</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(dreData?.grossProfit || 0)}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">
                    {formatPercentage(ratios?.operatingMarginRatio || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Margem Oper.</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(dreData?.operatingProfit || 0)}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">
                    {formatPercentage(ratios?.netMarginRatio || 0)}
                  </div>
                  <div className="text-xs text-gray-600">Margem Líq.</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatCurrency(dreData?.netProfit || 0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DRE Detalhada (Expandida) */}
          {expanded && dreData && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800 text-sm flex items-center space-x-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <span>Estrutura Detalhada da DRE</span>
              </h4>
              
              {/* Receitas */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Receitas</h5>
                <div className="space-y-1 pl-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Receita Bruta</span>
                    <span className="font-medium">{formatCurrency(dreData?.grossRevenue || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm ml-4">
                    <span className="text-gray-500">(-) Devoluções</span>
                    <span className="text-red-600">-{formatCurrency(dreData?.salesReturns || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm ml-4">
                    <span className="text-gray-500">(-) Descontos</span>
                    <span className="text-red-600">-{formatCurrency(dreData?.salesDiscounts || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium border-t pt-1">
                    <span>Receita Líquida</span>
                    <span className="text-orange-600">{formatCurrency(dreData?.netRevenue || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Custos */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Custos</h5>
                <div className="space-y-1 pl-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Custo dos Produtos</span>
                    <span className="font-medium text-red-600">-{formatCurrency(dreData?.totalCostOfGoodsSold || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium border-t pt-1">
                    <span>Lucro Bruto</span>
                    <span className={`font-bold ${(dreData?.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(dreData?.grossProfit || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Despesas Operacionais */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Despesas Operacionais</h5>
                <div className="space-y-1 pl-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Despesas Operacionais</span>
                    <span className="font-medium text-red-600">-{formatCurrency(dreData?.operatingExpenses || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium border-t pt-1">
                    <span>Resultado Operacional</span>
                    <span className={`font-bold ${(dreData?.operatingProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(dreData?.operatingProfit || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resultado Final */}
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Resultado Final</h5>
                <div className="space-y-1 pl-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Resultado Financeiro</span>
                    <span className={`font-medium ${(dreData?.netFinancialResult || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(dreData?.netFinancialResult || 0) >= 0 ? '+' : ''}{formatCurrency(dreData?.netFinancialResult || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Impostos</span>
                    <span className="font-medium text-red-600">-{formatCurrency((dreData?.incomeTax || 0) + (dreData?.socialContribution || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold border-t-2 pt-1">
                    <span>Lucro Líquido</span>
                    <span className={`text-lg ${(dreData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(dreData?.netProfit || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evolução das Margens */}
          {marginEvolution && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Evolução das Margens</span>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(marginEvolution?.trend || 'stable')}
                  <span className={`text-xs ${getTrendColor(marginEvolution?.trend || 'stable')}`}>
                    {marginEvolution?.trend === 'improving' ? 'Melhorando' : 
                     marginEvolution?.trend === 'deteriorating' ? 'Piorando' : 'Estável'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{formatPercentage(marginEvolution?.grossMargin || 0)}</div>
                  <div className="text-gray-500">Bruta</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{formatPercentage(marginEvolution?.operatingMargin || 0)}</div>
                  <div className="text-gray-500">Operacional</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{formatPercentage(marginEvolution?.netMargin || 0)}</div>
                  <div className="text-gray-500">Líquida</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs mt-2 text-gray-600">
                <span>Volatilidade</span>
                <span>{formatPercentage(marginEvolution?.volatility || 0)}</span>
              </div>
            </div>
          )}

          {/* Tendência Histórica */}
          {trendAnalysis.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800 text-sm">Tendência Histórica</h4>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {trendAnalysis.slice(-3).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">{trend?.period || 'Período'}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-orange-600">{formatCurrency(trend?.revenue || 0)}</span>
                      <span className={`${(trend?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(trend?.growth || 0) >= 0 ? '+' : ''}{formatPercentage(trend?.growth || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}