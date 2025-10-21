'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/_components/ui/card';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { TrendingUp, TrendingDown, Minus, DollarSign, RefreshCw, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CEOCashFlowService, DetailedCashFlowData, CashFlowTrend, CashFlowProjection, CashFlowQuality } from '../services/cashflow-service';
import { CardSkeleton, ErrorState, FadeIn } from './loading-states';

interface CashFlowCardProps {
  params: CEODashboardParams;
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface CashFlowQuality {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  operatingConsistency: number;
  freeCashFlowGrowth: number;
  cashConversion: number;
  recommendations: string[];
}

export function CashFlowCard({ params, isLoading = false, onRefresh }: CashFlowCardProps) {
  const [cashFlowData, setCashFlowData] = useState<DetailedCashFlowData | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<CashFlowTrend[]>([]);
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [quality, setQuality] = useState<CashFlowQuality | null>(null);
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
      
      console.log('[CashFlowCard] Carregando dados para período:', { startDate, endDate });

      const [
        cashFlow,
        trend,
        projection,
        qualityAnalysis
      ] = await Promise.all([
        CEOCashFlowService.getDetailedCashFlow(params),
        CEOCashFlowService.getCashFlowTrend(params, 6),
        CEOCashFlowService.getCashFlowProjection(params, 3),
        CEOCashFlowService.getCashFlowQuality(params)
      ]);

      setCashFlowData(cashFlow || null);
      setTrendAnalysis(trend || []);
      setProjections(projection || []);
      setQuality(qualityAnalysis || null);
      
      console.log('[CashFlowCard] Dados carregados:', {
        totalRecebimentos: cashFlow?.totalRecebimentos,
        totalPagamentos: cashFlow?.totalPagamentos,
        saldoLiquido: cashFlow?.saldoLiquido
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar fluxo de caixa');
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

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-orange-100 text-orange-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Boa';
      case 'fair': return 'Regular';
      case 'poor': return 'Ruim';
      default: return 'N/A';
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
        title="Erro no Fluxo de Caixa"
        message="Não foi possível carregar o fluxo de caixa."
        error={error}
        onRetry={handleRefresh}
        variant="card"
        className="h-full"
      />
    );
  }

  // Estado sem dados
  if (!cashFlowData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Fluxo de Caixa</CardTitle>
          </div>
          <CardDescription>
            Análise de fluxo de caixa operacional, investimentos e financiamento
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
    <FadeIn duration={400} delay={400}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Fluxo de Caixa</CardTitle>
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
            Análise de fluxo de caixa operacional, investimentos e financiamento - Período: {params.startDate.toLocaleDateString('pt-BR')} até {params.endDate.toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
        {/* Indicadores Principais */}
        {cashFlowData && (
          <div className="grid grid-cols-2 gap-4">
            {/* Fluxo Operacional */}
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(cashFlowData?.operating || 0)}
              </div>
              <div className="text-sm text-gray-600">Fluxo Operacional</div>
              <div className="text-xs text-gray-500 mt-1">
                Margem: {formatPercentage((cashFlowData?.operatingCashFlowMargin || 0) * 100)}
              </div>
            </div>
            
            {/* Fluxo Líquido */}
            <div className="p-3 bg-green-50 rounded-lg">
              <div className={`text-lg font-bold ${(cashFlowData?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlowData?.netCashFlow || 0)}
              </div>
              <div className="text-sm text-gray-600">Fluxo Líquido</div>
              <div className="text-xs text-gray-500 mt-1">
                Livre: {formatCurrency(cashFlowData?.freeCashFlow || 0)}
              </div>
            </div>
          </div>
        )}

        {/* Qualidade do Fluxo de Caixa */}
        {quality && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Qualidade do Fluxo</span>
              <Badge className={`text-xs ${getQualityColor(quality?.quality || 'fair')}`}>
                {getQualityLabel(quality?.quality || 'fair')}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Score</span>
              <span className="font-medium">{quality?.score || 0}/100</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Consistência</span>
              <span className="font-medium">{formatPercentage((quality?.operatingConsistency || 0) * 100)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Crescimento FCF</span>
              <span className="font-medium">{formatPercentage((quality?.freeCashFlowGrowth || 0) * 100)}</span>
            </div>
          </div>
        )}

        {/* Fluxo de Caixa Detalhado (Expandido) */}
        {expanded && cashFlowData && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 text-sm">Estrutura do Fluxo de Caixa</h4>
            
            {/* Fluxo Operacional */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-orange-600">Fluxo Operacional</div>
              <div className="space-y-1 ml-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Lucro Líquido</span>
                  <span className="font-medium">{formatCurrency(cashFlowData?.netIncome || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Depreciação</span>
                  <span className="text-green-600">+{formatCurrency(cashFlowData?.depreciation || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Amortização</span>
                  <span className="text-green-600">+{formatCurrency(cashFlowData?.amortization || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Variação Capital de Giro</span>
                  <span className={`font-medium ${(cashFlowData?.changesInWorkingCapital || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(cashFlowData?.changesInWorkingCapital || 0) >= 0 ? '+' : ''}{formatCurrency(cashFlowData?.changesInWorkingCapital || 0)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm font-bold border-t pt-1">
                <span>Total Operacional</span>
                <span className={`${(cashFlowData?.operating || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlowData?.operating || 0)}
                </span>
              </div>
            </div>

            {/* Fluxo de Investimentos */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-purple-600">Fluxo de Investimentos</div>
              <div className="space-y-1 ml-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Capex</span>
                  <span className="text-red-600">{formatCurrency(cashFlowData?.capitalExpenditures || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Aquisições</span>
                  <span className="text-red-600">{formatCurrency(cashFlowData?.acquisitions || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Vendas de Ativos</span>
                  <span className="text-green-600">+{formatCurrency(cashFlowData?.assetSales || 0)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm font-bold border-t pt-1">
                <span>Total Investimentos</span>
                <span className={`${(cashFlowData?.investing || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlowData?.investing || 0)}
                </span>
              </div>
            </div>

            {/* Fluxo de Financiamento */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-orange-600">Fluxo de Financiamento</div>
              <div className="space-y-1 ml-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Empréstimos</span>
                  <span className="text-green-600">+{formatCurrency(cashFlowData?.debtIssuance || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Pagamento Dívidas</span>
                  <span className="text-red-600">{formatCurrency(cashFlowData?.debtRepayment || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Dividendos</span>
                  <span className="text-red-600">{formatCurrency(cashFlowData?.dividendPayments || 0)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm font-bold border-t pt-1">
                <span>Total Financiamento</span>
                <span className={`${(cashFlowData?.financing || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlowData?.financing || 0)}
                </span>
              </div>
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
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{trend?.period || 'N/A'}</span>
                    {getTrendIcon(trend?.trend || 'stable')}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs ${(trend?.net || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(trend?.net || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações */}
        {quality && quality?.recommendations && quality.recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-gray-800 text-sm">Recomendações</h4>
            </div>
            <div className="space-y-1">
              {quality.recommendations.slice(0, 2).map((recommendation, index) => (
                <div key={index} className="text-xs text-gray-600 p-2 bg-yellow-50 rounded">
                  • {recommendation || 'Recomendação não disponível'}
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
