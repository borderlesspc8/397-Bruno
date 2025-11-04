'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/_components/ui/button';
import { Badge } from '@/app/_components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import { CEODashboardParams } from '../types/ceo-dashboard.types';
import { CEOSeasonalService, MonthlyData, SeasonalPattern, TrendData } from '../services/seasonal-analysis';
import { ChartSkeleton, ErrorState, FadeIn } from './loading-states';

interface SeasonalAnalysisCardProps {
  params: CEODashboardParams;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function SeasonalAnalysisCard({ params, isLoading = false, onRefresh }: SeasonalAnalysisCardProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [patterns, setPatterns] = useState<SeasonalPattern[]>([]);
  const [trend, setTrend] = useState<TrendData | null>(null);
  const [seasonalityIndex, setSeasonalityIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Garantir que sempre usa as datas do dashboard CEO
      const startDate = params.startDate.toISOString().split('T')[0];
      const endDate = params.endDate.toISOString().split('T')[0];
      
      console.log('[SeasonalAnalysisCard] Carregando dados para período:', { startDate, endDate });

      const [
        monthly,
        seasonalPatterns,
        trendAnalysis,
        seasonality
      ] = await Promise.all([
        CEOSeasonalService.getMonthlyComparison(params),
        CEOSeasonalService.getSeasonalPatterns(params),
        CEOSeasonalService.getTrendAnalysis(params),
        CEOSeasonalService.getSeasonalityIndex(params)
      ]);

      setMonthlyData(monthly || []);
      setPatterns(seasonalPatterns || []);
      setTrend(trendAnalysis || null);
      setSeasonalityIndex(seasonality || 0);
      
      console.log('[SeasonalAnalysisCard] Dados carregados:', {
        monthlyDataCount: monthly?.length,
        patternsCount: seasonalPatterns?.length,
        seasonalityIndex: seasonality
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados sazonais');
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

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default: return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSeasonalityLevel = (index: number): { level: string; color: string } => {
    if (index < 0.1) return { 
      level: 'Baixa', 
      color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
    };
    if (index < 0.3) return { 
      level: 'Média', 
      color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' 
    };
    return { 
      level: 'Alta', 
      color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' 
    };
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
    return <ChartSkeleton showLegend={true} height="h-80" className="h-full" />;
  }

  // Estado de Erro
  if (error) {
    return (
      <ErrorState
        title="Erro na Análise Sazonal"
        message="Não foi possível carregar a análise sazonal."
        error={error}
        onRetry={handleRefresh}
        variant="card"
        className="h-full"
      />
    );
  }

  // Estado sem dados
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="ios26-card p-6 ios26-animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[#faba33]" />
            <h3 className="text-lg font-semibold">Análise Sazonal</h3>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Nenhum dado disponível para o período selecionado</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-4 ios26-button">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="ios26-card p-6 ios26-animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[#faba33]" />
            <h3 className="text-lg font-semibold">Análise Sazonal</h3>
          </div>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Análise de padrões sazonais e tendências temporais - Período: {params.startDate.toLocaleDateString('pt-BR')} até {params.endDate.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading} className="ios26-button">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
        
      {/* Content */}
      <div className="space-y-6">
        {/* Indicadores Principais */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatPercentage((seasonalityIndex || 0) * 100)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sazonalidade</div>
            <Badge className={`mt-1 ${getSeasonalityLevel(seasonalityIndex || 0).color}`}>
              {getSeasonalityLevel(seasonalityIndex || 0).level}
            </Badge>
          </div>
          
          {trend && (
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center space-x-1">
                {getTrendIcon(trend.direction)}
                <span className={`text-lg font-bold ${getTrendColor(trend.direction)}`}>
                  {formatPercentage(trend.strength)}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tendência</div>
              <div className={`text-xs mt-1 ${getTrendColor(trend.direction)}`}>
                {trend.direction === 'up' ? 'Crescimento' : 
                 trend.direction === 'down' ? 'Declínio' : 'Estável'}
              </div>
            </div>
          )}
        </div>

        {/* Padrões Sazonais */}
        {patterns.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">Padrões Identificados</h4>
            </div>
            
            <div className="space-y-2">
              {patterns.map((pattern, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{pattern?.pattern || 'Padrão'}</span>
                    <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600">
                      {formatPercentage(pattern?.strength || 0)}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Pico: {pattern?.peakMonth || 'N/A'} | Baixa: {pattern?.lowMonth || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dados Mensais Recentes */}
        {monthlyData.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Últimos Períodos</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {monthlyData.slice(-4).map((data, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-700 text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{data?.month || 'Mês'}</div>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      {formatCurrency(data?.revenue || 0)}
                    </span>
                    <span className={`${(data?.growth || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {(data?.growth || 0) >= 0 ? '+' : ''}{formatPercentage(data?.growth || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo de Tendência */}
        {trend && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Confiança da Previsão</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{formatPercentage(trend?.confidence || 0)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Volatilidade</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{formatPercentage(trend?.volatility || 0)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
