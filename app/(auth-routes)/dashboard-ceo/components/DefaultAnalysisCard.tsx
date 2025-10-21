// FASE 4: DefaultAnalysisCard - Análise de Inadimplência
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
  Clock,
  DollarSign,
  Users,
  BarChart3,
  PieChart
} from 'lucide-react';
import { CEODashboardParams, DetailedDefaultData, DefaultRateHistory, DefaultBySegment, DefaultByProduct } from '../types/ceo-dashboard.types';
import { CEORiskService } from '../services/risk-analysis';

interface DefaultAnalysisCardProps {
  params: CEODashboardParams;
  className?: string;
}

export default function DefaultAnalysisCard({ params, className }: DefaultAnalysisCardProps) {
  const [data, setData] = useState<DetailedDefaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'segment' | 'product' | 'history'>('overview');

  useEffect(() => {
    loadData();
  }, [params]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const riskAnalysis = await CEORiskService.getRiskAnalysis(params);
      setData(riskAnalysis.defaultAnalysis);
    } catch (err) {
      setError('Erro ao carregar análise de inadimplência');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (rate: number) => {
    if (rate < 2) return { level: 'Baixo', color: 'bg-green-500', textColor: 'text-green-700' };
    if (rate < 4) return { level: 'Médio', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Alto', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Análise de Inadimplência
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
            <AlertTriangle className="h-5 w-5" />
            Análise de Inadimplência
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

  const riskLevel = getRiskLevel(data.defaultRate);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Análise de Inadimplência
            </CardTitle>
            <CardDescription>
              Monitoramento de riscos de crédito e inadimplência
            </CardDescription>
          </div>
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="segment">Por Segmento</SelectItem>
              <SelectItem value="product">Por Produto</SelectItem>
              <SelectItem value="history">Histórico</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Taxa Atual de Inadimplência */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{data.defaultRate.toFixed(2)}%</div>
            <div className="text-sm text-gray-600">Taxa Atual</div>
            <Badge className={`${riskLevel.color} ${riskLevel.textColor} mt-2`}>
              Risco {riskLevel.level}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              R$ {data.defaultRateHistory.reduce((sum, item) => sum + item.totalExposure, 0).toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-gray-600">Exposição Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              R$ {data.recoveryMetrics.recoveryRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Taxa de Recuperação</div>
          </div>
        </div>

        {/* Conteúdo baseado na visualização selecionada */}
        {selectedView === 'overview' && (
          <div className="space-y-4">
            {/* Indicadores de Risco */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Indicadores de Risco
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risco de Crédito</span>
                    <span>{data.riskIndicators.creditRisk.toFixed(1)}</span>
                  </div>
                  <Progress value={data.riskIndicators.creditRisk * 20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risco de Mercado</span>
                    <span>{data.riskIndicators.marketRisk.toFixed(1)}</span>
                  </div>
                  <Progress value={data.riskIndicators.marketRisk * 20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risco Operacional</span>
                    <span>{data.riskIndicators.operationalRisk.toFixed(1)}</span>
                  </div>
                  <Progress value={data.riskIndicators.operationalRisk * 20} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risco de Liquidez</span>
                    <span>{data.riskIndicators.liquidityRisk.toFixed(1)}</span>
                  </div>
                  <Progress value={data.riskIndicators.liquidityRisk * 20} className="h-2" />
                </div>
              </div>
            </div>

            {/* Análise de Aging */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Análise de Vencimento
              </h4>
              <div className="space-y-3">
                {data.agingAnalysis.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{item.period}</span>
                      <span>R$ {item.amount.toLocaleString('pt-BR')} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'segment' && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Inadimplência por Segmento
            </h4>
            <div className="space-y-4">
              {data.defaultBySegment.map((segment, index) => {
                const segmentRisk = getRiskLevel(segment.defaultRate);
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium">{segment.segment}</h5>
                        <p className="text-sm text-gray-600">
                          Exposição: R$ {segment.exposure.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge className={`${segmentRisk.color} ${segmentRisk.textColor}`}>
                        {segmentRisk.level}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Taxa de Inadimplência</span>
                      <span className="font-medium">{segment.defaultRate.toFixed(2)}%</span>
                    </div>
                    <Progress value={segment.defaultRate * 10} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedView === 'product' && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Inadimplência por Produto
            </h4>
            <div className="space-y-4">
              {data.defaultByProduct.map((product, index) => {
                const productRisk = getRiskLevel(product.defaultRate);
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium">{product.product}</h5>
                        <p className="text-sm text-gray-600">
                          Ticket Médio: R$ {product.averageTicket.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge className={`${productRisk.color} ${productRisk.textColor}`}>
                        {productRisk.level}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Taxa de Inadimplência</span>
                          <span className="font-medium">{product.defaultRate.toFixed(2)}%</span>
                        </div>
                        <Progress value={product.defaultRate * 10} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Exposição</span>
                          <span className="font-medium">R$ {product.exposure.toLocaleString('pt-BR')}</span>
                        </div>
                        <Progress value={(product.exposure / 500000) * 100} className="h-2" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedView === 'history' && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Histórico de Inadimplência
            </h4>
            <div className="space-y-3">
              {data.defaultRateHistory.map((history, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{history.period}</span>
                      {getTrendIcon(history.trend)}
                    </div>
                    <Badge variant="outline">{history.defaultRate.toFixed(2)}%</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Exposição Total:</span>
                      <span className="ml-2 font-medium">
                        R$ {history.totalExposure.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor Inadimplente:</span>
                      <span className="ml-2 font-medium">
                        R$ {history.defaultedAmount.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métricas de Recuperação */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Métricas de Recuperação
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.recoveryMetrics.recoveryRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Taxa de Recuperação</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {data.recoveryMetrics.averageRecoveryTime} dias
              </div>
              <div className="text-sm text-gray-600">Tempo Médio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                R$ {data.recoveryMetrics.recoveryCost.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-gray-600">Custo de Recuperação</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {data.recoveryMetrics.legalRecoveryRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Recuperação Judicial</div>
            </div>
          </div>
        </div>

        {/* Projeções */}
        {data.defaultProjections.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Projeções de Inadimplência
            </h4>
            <div className="space-y-3">
              {data.defaultProjections.slice(0, 3).map((projection, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{projection.month}</span>
                    <Badge variant="outline">
                      {projection.confidence.toFixed(0)}% confiança
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-green-600">
                        {projection.bestCase.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-600">Melhor Caso</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-orange-600">
                        {projection.projectedDefaultRate.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-600">Projeção</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-red-600">
                        {projection.worstCase.toFixed(2)}%
                      </div>
                      <div className="text-xs text-gray-600">Pior Caso</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
