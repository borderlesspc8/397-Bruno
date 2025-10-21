'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { TrendingUp, TrendingDown, Minus, DollarSign, RefreshCw, AlertTriangle } from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CEOLiquidityService, LiquidityMetrics, WorkingCapitalAnalysis, CashFlowMetrics } from '../services/liquidity-service';
import { CardSkeleton, ErrorState, FadeIn, InlineLoader } from './loading-states';

interface LiquidityIndicatorsCardProps {
  params: CEODashboardParams;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function LiquidityIndicatorsCard({ params, isLoading = false, onRefresh }: LiquidityIndicatorsCardProps) {
  const [liquidityData, setLiquidityData] = useState<LiquidityMetrics | null>(null);
  const [workingCapital, setWorkingCapital] = useState<WorkingCapitalAnalysis | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowMetrics | null>(null);
  const [trend, setTrend] = useState<{ trend: string; values: number[]; average: number; volatility: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Garantir que sempre usa as datas do dashboard CEO
      const startDate = params.startDate.toISOString().split('T')[0];
      const endDate = params.endDate.toISOString().split('T')[0];
      
      console.log('[LiquidityIndicatorsCard] Carregando dados para período:', { startDate, endDate });

      const [
        liquidity,
        workingCapitalData,
        cashFlowData,
        trendAnalysis
      ] = await Promise.all([
        CEOLiquidityService.getLiquidityAnalysis(params),
        CEOLiquidityService.getWorkingCapitalAnalysis(params),
        CEOLiquidityService.getCashFlowMetrics(params),
        CEOLiquidityService.getLiquidityTrend(params, 6)
      ]);

      setLiquidityData(liquidity || null);
      setWorkingCapital(workingCapitalData || null);
      setCashFlow(cashFlowData || null);
      setTrend(trendAnalysis || null);
      
      console.log('[LiquidityIndicatorsCard] Dados carregados:', {
        liquidityData: liquidity ? 'OK' : 'null',
        workingCapital: workingCapitalData ? 'OK' : 'null',
        cashFlow: cashFlowData ? 'OK' : 'null',
        trend: trendAnalysis ? 'OK' : 'null'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar indicadores de liquidez');
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

  const getLiquidityStatus = (ratio: number, type: 'current' | 'quick' | 'cash'): { status: string; color: string; icon: React.ReactNode } => {
    let status = '';
    let color = '';
    let icon: React.ReactNode = null;

    switch (type) {
      case 'current':
        if (ratio >= 2.0) {
          status = 'Excelente';
          color = 'text-green-600 bg-green-100';
          icon = <TrendingUp className="h-4 w-4" />;
        } else if (ratio >= 1.5) {
          status = 'Boa';
          color = 'text-orange-600 bg-orange-100';
          icon = <Minus className="h-4 w-4" />;
        } else if (ratio >= 1.0) {
          status = 'Adequada';
          color = 'text-yellow-600 bg-yellow-100';
          icon = <Minus className="h-4 w-4" />;
        } else {
          status = 'Crítica';
          color = 'text-red-600 bg-red-100';
          icon = <AlertTriangle className="h-4 w-4" />;
        }
        break;
      
      case 'quick':
        if (ratio >= 1.0) {
          status = 'Boa';
          color = 'text-green-600 bg-green-100';
          icon = <TrendingUp className="h-4 w-4" />;
        } else if (ratio >= 0.8) {
          status = 'Adequada';
          color = 'text-yellow-600 bg-yellow-100';
          icon = <Minus className="h-4 w-4" />;
        } else {
          status = 'Baixa';
          color = 'text-red-600 bg-red-100';
          icon = <AlertTriangle className="h-4 w-4" />;
        }
        break;
      
      case 'cash':
        if (ratio >= 0.2) {
          status = 'Adequada';
          color = 'text-green-600 bg-green-100';
          icon = <TrendingUp className="h-4 w-4" />;
        } else if (ratio >= 0.1) {
          status = 'Baixa';
          color = 'text-yellow-600 bg-yellow-100';
          icon = <Minus className="h-4 w-4" />;
        } else {
          status = 'Crítica';
          color = 'text-red-600 bg-red-100';
          icon = <AlertTriangle className="h-4 w-4" />;
        }
        break;
    }

    return { status, color, icon };
  };

  const getTrendIcon = (trendDirection: string) => {
    switch (trendDirection) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'deteriorating': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatRatio = (value: number) => {
    return `${value.toFixed(2)}x`;
  };

  const formatDays = (value: number) => {
    return `${Math.round(value)} dias`;
  };

  // Estado de Loading
  if (loading || isLoading) {
    return <CardSkeleton showHeader={true} contentRows={6} className="h-full" />;
  }

  // Estado de Erro
  if (error) {
    return (
      <ErrorState
        title="Erro nos Indicadores de Liquidez"
        message="Não foi possível carregar os indicadores de liquidez."
        error={error}
        onRetry={handleRefresh}
        variant="card"
        className="h-full"
      />
    );
  }

  // Estado sem dados
  if (!liquidityData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Indicadores de Liquidez</CardTitle>
          </div>
          <CardDescription>
            Análise de liquidez e capital de giro
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
    <FadeIn duration={400} delay={200}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Indicadores de Liquidez</CardTitle>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>
            Análise de liquidez e capital de giro - Período: {params.startDate.toLocaleDateString('pt-BR')} até {params.endDate.toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
        {/* Indicadores Principais de Liquidez */}
        {liquidityData && (
          <div className="grid grid-cols-2 gap-4">
            {/* Liquidez Corrente */}
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Liquidez Corrente</span>
                {getLiquidityStatus(liquidityData.currentRatio, 'current').icon}
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {formatRatio(liquidityData?.currentRatio || 0)}
              </div>
              <Badge className={`text-xs ${getLiquidityStatus(liquidityData?.currentRatio || 0, 'current').color}`}>
                {getLiquidityStatus(liquidityData?.currentRatio || 0, 'current').status}
              </Badge>
            </div>

            {/* Liquidez Seca */}
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Liquidez Seca</span>
                {getLiquidityStatus(liquidityData?.quickRatio || 0, 'quick').icon}
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatRatio(liquidityData?.quickRatio || 0)}
              </div>
              <Badge className={`text-xs ${getLiquidityStatus(liquidityData?.quickRatio || 0, 'quick').color}`}>
                {getLiquidityStatus(liquidityData?.quickRatio || 0, 'quick').status}
              </Badge>
            </div>
          </div>
        )}

        {/* Capital de Giro e Ciclo de Conversão */}
        {liquidityData && workingCapital && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Capital de Giro</div>
              <div className="text-lg font-bold text-gray-800">
                {formatCurrency(liquidityData?.workingCapital || 0)}
              </div>
              <div className="flex items-center mt-1">
                {getTrendIcon(workingCapital?.workingCapitalTrend || 'stable')}
                <span className="text-xs text-gray-600 ml-1 capitalize">
                  {workingCapital?.workingCapitalTrend || 'Estável'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-600 mb-1">Ciclo de Conversão</div>
              <div className="text-lg font-bold text-gray-800">
                {formatDays(liquidityData?.cashConversionCycle || 0)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Tempo médio de conversão
              </div>
            </div>
          </div>
        )}

        {/* Análise de Capital de Giro */}
        {workingCapital && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 text-sm">Composição do Capital de Giro</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Caixa e Equivalentes</span>
                <span className="font-medium">{formatCurrency(workingCapital?.cash || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Contas a Receber</span>
                <span className="font-medium">{formatCurrency(workingCapital?.receivables || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Estoques</span>
                <span className="font-medium">{formatCurrency(workingCapital?.inventory || 0)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Contas a Pagar</span>
                <span className="font-medium">{formatCurrency(workingCapital?.payables || 0)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fluxo de Caixa */}
        {cashFlow && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 text-sm">Fluxo de Caixa</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Operacional</span>
                <span className={`font-medium ${(cashFlow?.operatingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlow?.operatingCashFlow || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Investimentos</span>
                <span className={`font-medium ${(cashFlow?.investingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlow?.investingCashFlow || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Financiamento</span>
                <span className={`font-medium ${(cashFlow?.financingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlow?.financingCashFlow || 0)}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Fluxo Livre</span>
                  <span className={`${(cashFlow?.freeCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cashFlow?.freeCashFlow || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tendência de Liquidez */}
        {trend && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tendência de Liquidez</span>
              <div className="flex items-center space-x-1">
                {getTrendIcon(trend?.trend || 'stable')}
                <span className="font-medium capitalize">{trend?.trend || 'Estável'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Média (6 períodos)</span>
              <span className="font-medium">{formatRatio(trend?.average || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Volatilidade</span>
              <span className="font-medium">{(trend?.volatility || 0).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </FadeIn>
  );
}
