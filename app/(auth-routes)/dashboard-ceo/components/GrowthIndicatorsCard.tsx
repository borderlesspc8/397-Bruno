// FASE 4: GrowthIndicatorsCard - Indicadores de Crescimento
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
  Target, 
  CheckCircle, 
  BarChart3,
  PieChart,
  Globe,
  Users,
  Package,
  MapPin,
  Zap,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { CEODashboardParams, DetailedGrowthAnalysis, GrowthBySegment, GrowthByProduct, GrowthByRegion, GrowthDriver, GrowthBarrier, MarketAnalysis, CompetitiveAnalysis, CapacityAnalysis, GrowthProjection } from '../types/ceo-dashboard.types';
import { CEOGrowthService } from '../services/growth-analysis';

interface GrowthIndicatorsCardProps {
  params: CEODashboardParams;
  className?: string;
}

export default function GrowthIndicatorsCard({ params, className }: GrowthIndicatorsCardProps) {
  const [data, setData] = useState<DetailedGrowthAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'segments' | 'market' | 'capacity'>('overview');

  useEffect(() => {
    loadData();
  }, [params]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const growthAnalysis = await CEOGrowthService.getGrowthAnalysis(params);
      setData(growthAnalysis);
    } catch (err) {
      setError('Erro ao carregar indicadores de crescimento');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGrowthLevel = (growth: number) => {
    if (growth >= 20) return { level: 'Excelente', color: 'bg-green-500', textColor: 'text-green-700' };
    if (growth >= 10) return { level: 'Bom', color: 'bg-orange-500', textColor: 'text-orange-700' };
    if (growth >= 5) return { level: 'Moderado', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (growth >= 0) return { level: 'Baixo', color: 'bg-orange-500', textColor: 'text-orange-700' };
    return { level: 'Negativo', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getTrendIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getMarketPositionColor = (position: string) => {
    switch (position) {
      case 'leader': return 'bg-green-500 text-white';
      case 'challenger': return 'bg-orange-500 text-white';
      case 'follower': return 'bg-yellow-500 text-black';
      case 'niche': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getLifecycleColor = (lifecycle: string) => {
    switch (lifecycle) {
      case 'introduction': return 'bg-orange-500 text-white';
      case 'growth': return 'bg-green-500 text-white';
      case 'maturity': return 'bg-yellow-500 text-black';
      case 'decline': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Indicadores de Crescimento
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
            <TrendingUp className="h-5 w-5" />
            Indicadores de Crescimento
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

  const momGrowth = data.growthMetrics.monthOverMonth;
  const yoyGrowth = data.growthMetrics.yearOverYear;
  const momGrowthLevel = getGrowthLevel(momGrowth);
  const yoyGrowthLevel = getGrowthLevel(yoyGrowth);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Indicadores de Crescimento
            </CardTitle>
            <CardDescription>
              Análise de crescimento, mercado e capacidade de expansão
            </CardDescription>
          </div>
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="segments">Segmentos</SelectItem>
              <SelectItem value="market">Mercado</SelectItem>
              <SelectItem value="capacity">Capacidade</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Indicadores Principais de Crescimento */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
              {momGrowth >= 0 ? '+' : ''}{momGrowth.toFixed(1)}%
              {getTrendIcon(momGrowth)}
            </div>
            <div className="text-sm text-gray-600">Crescimento MoM</div>
            <Badge className={`${momGrowthLevel.color} ${momGrowthLevel.textColor} mt-2`}>
              {momGrowthLevel.level}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
              {yoyGrowth >= 0 ? '+' : ''}{yoyGrowth.toFixed(1)}%
              {getTrendIcon(yoyGrowth)}
            </div>
            <div className="text-sm text-gray-600">Crescimento YoY</div>
            <Badge className={`${yoyGrowthLevel.color} ${yoyGrowthLevel.textColor} mt-2`}>
              {yoyGrowthLevel.level}
            </Badge>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {data.growthMetrics.compoundGrowth.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">CAGR</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {data.targetComparison.achievement.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Meta Atingida</div>
          </div>
        </div>

        {/* Conteúdo baseado na visualização selecionada */}
        {selectedView === 'overview' && (
          <div className="space-y-4">
            {/* Crescimento por Segmento */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Crescimento por Segmento
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.growthMetrics.growthBySegment.slice(0, 4).map((segment, index) => {
                  const segmentGrowthLevel = getGrowthLevel(segment.currentGrowth);
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-medium">{segment.segment}</h5>
                          <p className="text-sm text-gray-600">
                            Participação: {segment.penetration.toFixed(1)}%
                          </p>
                        </div>
                        <Badge className={`${segmentGrowthLevel.color} ${segmentGrowthLevel.textColor}`}>
                          {segment.currentGrowth.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Crescimento Atual</span>
                          <span>{segment.currentGrowth.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Crescimento Anterior</span>
                          <span>{segment.previousGrowth.toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.abs(segment.currentGrowth) * 2} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Crescimento por Produto */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Crescimento por Produto
              </h4>
              <div className="space-y-3">
                {data.growthMetrics.growthByProduct.map((product, index) => {
                  const productGrowthLevel = getGrowthLevel(product.currentGrowth);
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium">{product.product}</h5>
                          <p className="text-sm text-gray-600">
                            Participação no Mercado: {product.marketShare.toFixed(1)}%
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getLifecycleColor(product.lifecycle)}>
                            {product.lifecycle}
                          </Badge>
                          <Badge className={`${productGrowthLevel.color} ${productGrowthLevel.textColor}`}>
                            {product.currentGrowth.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-orange-600">{product.currentGrowth.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Crescimento Atual</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{product.previousGrowth.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Crescimento Anterior</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-600">{product.marketShare.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Market Share</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'segments' && (
          <div className="space-y-4">
            {/* Análise Detalhada por Segmento */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Análise Detalhada por Segmento
              </h4>
              <div className="space-y-4">
                {data.growthMetrics.growthBySegment.map((segment, index) => {
                  const segmentGrowthLevel = getGrowthLevel(segment.currentGrowth);
                  const growthChange = segment.currentGrowth - segment.previousGrowth;
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium text-lg">{segment.segment}</h5>
                          <p className="text-sm text-gray-600">
                            Tamanho do Mercado: R$ {segment.marketSize.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={`${segmentGrowthLevel.color} ${segmentGrowthLevel.textColor}`}>
                            {segment.currentGrowth.toFixed(1)}%
                          </Badge>
                          {growthChange > 0 ? (
                            <Badge variant="outline" className="text-green-600">
                              +{growthChange.toFixed(1)}%
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-600">
                              {growthChange.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{segment.currentGrowth.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Crescimento Atual</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{segment.previousGrowth.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Crescimento Anterior</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{segment.penetration.toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">Penetração</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">
                            R$ {(segment.marketSize * segment.penetration / 100).toLocaleString('pt-BR')}
                          </div>
                          <div className="text-sm text-gray-600">Receita Potencial</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drivers e Barreiras de Crescimento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Drivers de Crescimento
                </h4>
                <div className="space-y-3">
                  {data.growthMetrics.growthDrivers.map((driver, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">{driver.driver}</h5>
                        <Badge variant="outline">{driver.impact}%</Badge>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Sustentabilidade</span>
                        <span className="capitalize">{driver.sustainability}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Investimento</span>
                        <span>R$ {driver.cost.toLocaleString('pt-BR')}</span>
                      </div>
                      <Progress value={driver.impact} className="h-2 mt-2" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Barreiras ao Crescimento
                </h4>
                <div className="space-y-3">
                  {data.growthMetrics.growthBarriers.map((barrier, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">{barrier.barrier}</h5>
                        <Badge variant="outline" className="text-red-600">{barrier.impact}%</Badge>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Probabilidade</span>
                        <span>{(barrier.probability * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Mitigação:</span>
                        <ul className="list-disc list-inside mt-1">
                          {barrier.mitigation.slice(0, 2).map((item, idx) => (
                            <li key={idx} className="text-xs">{item}</li>
                          ))}
                        </ul>
                      </div>
                      <Progress value={barrier.impact} className="h-2 mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'market' && (
          <div className="space-y-4">
            {/* Análise de Mercado */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Análise de Mercado
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center border rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    R$ {data.marketAnalysis.marketSize.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-gray-600">Tamanho do Mercado</div>
                </div>
                <div className="text-center border rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {data.marketAnalysis.marketGrowth.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Crescimento do Mercado</div>
                </div>
                <div className="text-center border rounded-lg p-4">
                  <Badge className={`${getMarketPositionColor(data.marketAnalysis.marketPosition)} text-lg px-4 py-2`}>
                    {data.marketAnalysis.marketPosition}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">Posição no Mercado</div>
                </div>
              </div>
            </div>

            {/* Crescimento por Região */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Crescimento por Região
              </h4>
              <div className="space-y-3">
                {data.growthMetrics.growthByRegion.map((region, index) => {
                  const regionGrowthLevel = getGrowthLevel(region.currentGrowth);
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h5 className="font-medium">{region.region}</h5>
                          <p className="text-sm text-gray-600">
                            População: {region.population.toLocaleString('pt-BR')} | 
                            PIB: R$ {region.gdp.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge className={`${regionGrowthLevel.color} ${regionGrowthLevel.textColor}`}>
                          {region.currentGrowth.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-medium text-orange-600">{region.currentGrowth.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Crescimento Atual</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{region.previousGrowth.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">Crescimento Anterior</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-600">
                            R$ {(region.gdp / region.population).toLocaleString('pt-BR')}
                          </div>
                          <div className="text-xs text-gray-600">PIB per Capita</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tendências de Mercado */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Tendências de Mercado
              </h4>
              <div className="space-y-3">
                {data.marketAnalysis.marketTrends.map((trend, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">{trend.trend}</h5>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={
                          trend.impact === 'positive' ? 'text-green-600' : 
                          trend.impact === 'negative' ? 'text-red-600' : 'text-gray-600'
                        }>
                          {trend.impact}
                        </Badge>
                        <Badge variant="outline">{(trend.probability * 100).toFixed(0)}%</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{trend.timeframe}</span>
                      <span className="text-gray-600">Probabilidade: {(trend.probability * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'capacity' && (
          <div className="space-y-4">
            {/* Análise de Capacidade */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Análise de Capacidade
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-center border rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">
                    {data.capacityAnalysis.capacityUtilization.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Utilização da Capacidade</div>
                </div>
                <div className="text-center border rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {data.capacityAnalysis.currentCapacity.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-gray-600">Capacidade Atual</div>
                </div>
              </div>
            </div>

            {/* Restrições de Capacidade */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Restrições de Capacidade
              </h4>
              <div className="space-y-3">
                {data.capacityAnalysis.capacityConstraints.map((constraint, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium">{constraint.constraint}</h5>
                      <Badge variant="outline" className="text-red-600">{constraint.impact}%</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Timeline:</span>
                        <span className="ml-2 font-medium">{constraint.timeline}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Solução:</span>
                        <span className="ml-2 font-medium">{constraint.solution}</span>
                      </div>
                    </div>
                    <Progress value={constraint.impact} className="h-2 mt-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Opções de Expansão */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Opções de Expansão
              </h4>
              <div className="space-y-3">
                {data.capacityAnalysis.expansionOptions.map((option, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h5 className="font-medium">{option.option}</h5>
                      <Badge variant="outline" className="text-green-600">
                        ROI: {option.roi.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-orange-600">R$ {option.cost.toLocaleString('pt-BR')}</div>
                        <div className="text-xs text-gray-600">Investimento</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{option.timeline}</div>
                        <div className="text-xs text-gray-600">Timeline</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">+{option.capacityIncrease}%</div>
                        <div className="text-xs text-gray-600">Aumento Capacidade</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-orange-600">{option.roi.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">ROI</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projeções de Crescimento */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Projeções de Crescimento
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.growthProjections.map((projection, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">{projection.year}</span>
                      <Badge variant="outline">
                        {projection.confidence.toFixed(0)}% confiança
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Receita Projetada</span>
                        <span className="font-medium text-orange-600">
                          R$ {projection.projectedRevenue.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crescimento Projetado</span>
                        <span className="font-medium text-green-600">
                          {projection.projectedGrowth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs text-gray-600 mb-1">Principais Premissas:</div>
                      <ul className="list-disc list-inside text-xs">
                        {projection.keyAssumptions.slice(0, 2).map((assumption, idx) => (
                          <li key={idx}>{assumption}</li>
                        ))}
                      </ul>
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
