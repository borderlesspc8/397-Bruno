// FASE 4: PredictabilityCard - Análise de Previsibilidade
// ISOLADO - componente exclusivo para Dashboard CEO

'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/_components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/_components/ui/select';
import { Badge } from '@/app/_components/ui/badge';
import { Progress } from '@/app/_components/ui/progress';
import { Alert, AlertDescription } from '@/app/_components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  BarChart3,
  PieChart,
  Activity,
  Brain,
  Zap,
  Calendar,
  LineChart,
  Gauge
} from 'lucide-react';
import { CEODashboardParams, DetailedPredictabilityData, VolatilityAnalysis, CorrelationAnalysis, SeasonalityAnalysis, PredictiveModel, ScenarioAnalysis, ForecastData } from '../types/ceo-dashboard.types';
import { CEORiskService } from '../services/risk-analysis';

interface PredictabilityCardProps {
  params: CEODashboardParams;
  className?: string;
}

export default function PredictabilityCard({ params, className }: PredictabilityCardProps) {
  const [data, setData] = useState<DetailedPredictabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'volatility' | 'models' | 'scenarios'>('overview');

  useEffect(() => {
    loadData();
  }, [params]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const riskAnalysis = await CEORiskService.getRiskAnalysis(params);
      setData(riskAnalysis.predictability);
    } catch (err) {
      setError('Erro ao carregar análise de previsibilidade');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPredictabilityLevel = (score: number) => {
    if (score >= 80) return { level: 'Excelente', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 60) return { level: 'Bom', color: 'bg-orange-500', textColor: 'text-orange-700' };
    if (score >= 40) return { level: 'Moderado', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Baixo', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getVolatilityLevel = (volatility: number) => {
    if (volatility < 10) return { level: 'Baixa', color: 'bg-green-500', textColor: 'text-green-700' };
    if (volatility < 20) return { level: 'Moderada', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Alta', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'linear': return <LineChart className="h-4 w-4 text-orange-500" />;
      case 'exponential': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'seasonal': return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'arima': return <Brain className="h-4 w-4 text-orange-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análise de Previsibilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análise de Previsibilidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || 'Erro ao carregar dados'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const revenuePredictabilityLevel = getPredictabilityLevel(data.revenuePredictability);
  const costPredictabilityLevel = getPredictabilityLevel(data.costPredictability);
  const profitPredictabilityLevel = getPredictabilityLevel(data.profitPredictability);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Análise de Previsibilidade
            </CardTitle>
            <CardDescription>
              Análise de volatilidade, correlações e modelos preditivos
            </CardDescription>
          </div>
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="volatility">Volatilidade</SelectItem>
              <SelectItem value="models">Modelos</SelectItem>
              <SelectItem value="scenarios">Cenários</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Indicadores Principais de Previsibilidade */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{data.revenuePredictability.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Previsibilidade Receita</div>
            <Badge className={`${revenuePredictabilityLevel.color} ${revenuePredictabilityLevel.textColor} mt-2`}>
              {revenuePredictabilityLevel.level}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{data.costPredictability.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Previsibilidade Custos</div>
            <Badge className={`${costPredictabilityLevel.color} ${costPredictabilityLevel.textColor} mt-2`}>
              {costPredictabilityLevel.level}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{data.profitPredictability.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Previsibilidade Lucro</div>
            <Badge className={`${profitPredictabilityLevel.color} ${profitPredictabilityLevel.textColor} mt-2`}>
              {profitPredictabilityLevel.level}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{data.confidence.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Confiança Geral</div>
            <Badge variant="outline" className="mt-2">
              {data.confidence >= 80 ? 'Alta' : data.confidence >= 60 ? 'Média' : 'Baixa'}
            </Badge>
          </div>
        </div>

        {/* Conteúdo baseado na visualização selecionada */}
        {selectedView === 'overview' && (
          <div className="space-y-4">
            {/* Análise de Volatilidade */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                Análise de Volatilidade
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const revenueVolLevel = getVolatilityLevel(data.volatility.revenueVolatility);
                  const costVolLevel = getVolatilityLevel(data.volatility.costVolatility);
                  const profitVolLevel = getVolatilityLevel(data.volatility.profitVolatility);
                  
                  return (
                    <>
                      <div className="text-center border rounded-lg p-4">
                        <div className="text-2xl font-bold text-orange-600">
                          {data.volatility.revenueVolatility.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Volatilidade Receita</div>
                        <Badge className={`${revenueVolLevel.color} ${revenueVolLevel.textColor} mt-2`}>
                          {revenueVolLevel.level}
                        </Badge>
                      </div>
                      <div className="text-center border rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {data.volatility.costVolatility.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Volatilidade Custos</div>
                        <Badge className={`${costVolLevel.color} ${costVolLevel.textColor} mt-2`}>
                          {costVolLevel.level}
                        </Badge>
                      </div>
                      <div className="text-center border rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600">
                          {data.volatility.profitVolatility.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Volatilidade Lucro</div>
                        <Badge className={`${profitVolLevel.color} ${profitVolLevel.textColor} mt-2`}>
                          {profitVolLevel.level}
                        </Badge>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="mt-4 flex items-center gap-2">
                {getTrendIcon(data.volatility.volatilityTrend)}
                <span className="text-sm capitalize">Tendência: {data.volatility.volatilityTrend}</span>
              </div>
            </div>

            {/* Análise de Correlações */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Análise de Correlações
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Receita vs Custos</h5>
                  <div className="text-2xl font-bold text-orange-600">
                    {data.correlations.revenueCostCorrelation.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.correlations.revenueCostCorrelation > 0.7 ? 'Alta correlação' : 
                     data.correlations.revenueCostCorrelation > 0.3 ? 'Correlação moderada' : 'Baixa correlação'}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Receita vs Mercado</h5>
                  <div className="text-2xl font-bold text-green-600">
                    {data.correlations.marketCorrelation.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.correlations.marketCorrelation > 0.7 ? 'Alta correlação' : 
                     data.correlations.marketCorrelation > 0.3 ? 'Correlação moderada' : 'Baixa correlação'}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Receita vs Sazonalidade</h5>
                  <div className="text-2xl font-bold text-purple-600">
                    {data.correlations.seasonalCorrelation.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.correlations.seasonalCorrelation > 0.7 ? 'Alta correlação' : 
                     data.correlations.seasonalCorrelation > 0.3 ? 'Correlação moderada' : 'Baixa correlação'}
                  </div>
                </div>
              </div>
            </div>

            {/* Análise de Sazonalidade */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Análise de Sazonalidade
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Índice de Sazonalidade</h5>
                  <div className="text-2xl font-bold text-orange-600">
                    {data.seasonality.seasonalityIndex.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.seasonality.seasonalityIndex > 0.8 ? 'Alta sazonalidade' : 
                     data.seasonality.seasonalityIndex > 0.5 ? 'Sazonalidade moderada' : 'Baixa sazonalidade'}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Fatores Sazonais</h5>
                  <div className="text-sm space-y-1">
                    {data.seasonality.seasonalFactors.slice(0, 3).map((factor, index) => (
                      <div key={index} className="flex justify-between">
                        <span>Mês {factor.month}:</span>
                        <span className="font-medium">{factor.factor.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'volatility' && (
          <div className="space-y-4">
            {/* Histórico de Volatilidade */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Histórico de Volatilidade
              </h4>
              <div className="space-y-3">
                {data.volatility.historicalVolatility.map((history, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">{history.period}</span>
                      <Badge variant="outline">
                        Volatilidade: {((history.revenueVol + history.costVol + history.profitVol) / 3).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-orange-600">{history.revenueVol.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">Receita</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{history.costVol.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">Custos</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">{history.profitVol.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">Lucro</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Matriz de Correlações */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Matriz de Correlações
              </h4>
              <div className="space-y-3">
                {data.correlations.correlationMatrix.map((correlation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{correlation.variable1} ↔ {correlation.variable2}</span>
                      <Badge variant="outline">
                        {(correlation.correlation * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Significância: {(correlation.significance * 100).toFixed(1)}%</span>
                      <span className={
                        Math.abs(correlation.correlation) > 0.7 ? 'text-green-600' : 
                        Math.abs(correlation.correlation) > 0.3 ? 'text-yellow-600' : 'text-red-600'
                      }>
                        {Math.abs(correlation.correlation) > 0.7 ? 'Alta' : 
                         Math.abs(correlation.correlation) > 0.3 ? 'Moderada' : 'Baixa'}
                      </span>
                    </div>
                    <Progress value={Math.abs(correlation.correlation) * 100} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Análise de Sazonalidade Detalhada */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Análise de Sazonalidade Detalhada
              </h4>
              <div className="space-y-3">
                {data.seasonality.seasonalFactors.map((factor, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Mês {factor.month}</span>
                      <Badge variant="outline">
                        {(factor.confidence * 100).toFixed(0)}% confiança
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Fator Sazonal</span>
                      <span className="font-medium">{factor.factor.toFixed(3)}</span>
                    </div>
                    <Progress value={factor.factor * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'models' && (
          <div className="space-y-4">
            {/* Modelos Preditivos */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Modelos Preditivos
              </h4>
              <div className="space-y-4">
                {data.predictiveModels.map((model, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {getModelTypeIcon(model.modelType)}
                        <span className="font-medium capitalize">{model.modelType}</span>
                      </div>
                      <Badge variant="outline">
                        {(model.accuracy * 100).toFixed(1)}% precisão
                      </Badge>
                    </div>
                    
                    {/* Análise de Resíduos */}
                    <div className="mb-4">
                      <h5 className="font-medium mb-2">Análise de Resíduos</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-orange-600">{model.residuals.meanResidual.toFixed(4)}</div>
                          <div className="text-xs text-gray-600">Resíduo Médio</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{model.residuals.standardDeviation.toFixed(4)}</div>
                          <div className="text-xs text-gray-600">Desvio Padrão</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-600">{(model.residuals.normality * 100).toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Normalidade</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-orange-600">{model.residuals.autocorrelation.toFixed(3)}</div>
                          <div className="text-xs text-gray-600">Autocorrelação</div>
                        </div>
                      </div>
                    </div>

                    {/* Previsões */}
                    <div>
                      <h5 className="font-medium mb-2">Previsões</h5>
                      <div className="space-y-2">
                        {model.forecast.slice(0, 3).map((forecast, forecastIndex) => (
                          <div key={forecastIndex} className="border rounded p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{forecast.period}</span>
                              <Badge variant="outline">
                                {(forecast.confidence * 100).toFixed(0)}% confiança
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="text-center">
                                <div className="font-medium text-green-600">
                                  R$ {forecast.lowerBound.toLocaleString('pt-BR')}
                                </div>
                                <div className="text-xs text-gray-600">Limite Inferior</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-orange-600">
                                  R$ {forecast.forecast.toLocaleString('pt-BR')}
                                </div>
                                <div className="text-xs text-gray-600">Previsão</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-purple-600">
                                  R$ {forecast.upperBound.toLocaleString('pt-BR')}
                                </div>
                                <div className="text-xs text-gray-600">Limite Superior</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'scenarios' && (
          <div className="space-y-4">
            {/* Análise de Cenários */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Análise de Cenários
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cenário Base */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium">{data.scenarioAnalysis.baseCase.name}</h5>
                    <Badge className="bg-orange-500 text-white">
                      {(data.scenarioAnalysis.baseCase.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Receita</span>
                      <span className="font-medium">R$ {data.scenarioAnalysis.baseCase.revenue.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custos</span>
                      <span className="font-medium">R$ {data.scenarioAnalysis.baseCase.costs.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lucro</span>
                      <span className="font-medium text-green-600">R$ {data.scenarioAnalysis.baseCase.profit.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Cenário Otimista */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium">{data.scenarioAnalysis.optimisticCase.name}</h5>
                    <Badge className="bg-green-500 text-white">
                      {(data.scenarioAnalysis.optimisticCase.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Receita</span>
                      <span className="font-medium">R$ {data.scenarioAnalysis.optimisticCase.revenue.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custos</span>
                      <span className="font-medium">R$ {data.scenarioAnalysis.optimisticCase.costs.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lucro</span>
                      <span className="font-medium text-green-600">R$ {data.scenarioAnalysis.optimisticCase.profit.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Cenário Pessimista */}
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium">{data.scenarioAnalysis.pessimisticCase.name}</h5>
                    <Badge className="bg-red-500 text-white">
                      {(data.scenarioAnalysis.pessimisticCase.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Receita</span>
                      <span className="font-medium">R$ {data.scenarioAnalysis.pessimisticCase.revenue.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custos</span>
                      <span className="font-medium">R$ {data.scenarioAnalysis.pessimisticCase.costs.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lucro</span>
                      <span className="font-medium text-green-600">R$ {data.scenarioAnalysis.pessimisticCase.profit.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Teste de Stress */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Teste de Stress
              </h4>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-medium">{data.scenarioAnalysis.stressTest.scenario}</h5>
                    <p className="text-sm text-gray-600">Cenário de crise econômica severa</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-red-600">
                      Impacto: {data.scenarioAnalysis.stressTest.impact}%
                    </Badge>
                    <Badge variant="outline">
                      Probabilidade: {(data.scenarioAnalysis.stressTest.probability * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                <div className="mb-3">
                  <h6 className="font-medium mb-2">Estratégias de Mitigação:</h6>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {data.scenarioAnalysis.stressTest.mitigation.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Premissas Principais */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Premissas Principais
              </h4>
              <div className="space-y-3">
                {data.scenarioAnalysis.baseCase.keyAssumptions.map((assumption, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{assumption.variable}</span>
                      <Badge className={
                        assumption.impact === 'high' ? 'bg-red-500 text-white' :
                        assumption.impact === 'medium' ? 'bg-yellow-500 text-black' :
                        'bg-green-500 text-white'
                      }>
                        {assumption.impact}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Valor:</span>
                      <span className="ml-2 font-medium">{assumption.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
