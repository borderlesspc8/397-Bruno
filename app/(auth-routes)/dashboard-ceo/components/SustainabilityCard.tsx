// FASE 4: SustainabilityCard - Sustentabilidade Financeira
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
  Shield,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Activity
} from 'lucide-react';
import { CEODashboardParams, DetailedSustainabilityData, DebtStructure, InterestCoverageAnalysis, DetailedProfitability, EfficiencyMetrics } from '../types/ceo-dashboard.types';
import { CEORiskService } from '../services/risk-analysis';

interface SustainabilityCardProps {
  params: CEODashboardParams;
  className?: string;
}

export default function SustainabilityCard({ params, className }: SustainabilityCardProps) {
  const [data, setData] = useState<DetailedSustainabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'debt' | 'profitability' | 'efficiency'>('overview');

  useEffect(() => {
    loadData();
  }, [params]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const riskAnalysis = await CEORiskService.getRiskAnalysis(params);
      setData(riskAnalysis.sustainability);
    } catch (err) {
      setError('Erro ao carregar análise de sustentabilidade');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSustainabilityLevel = (roe: number, debtToEquity: number, interestCoverage: number) => {
    let score = 0;
    
    // ROE scoring (0-40 points)
    if (roe >= 20) score += 40;
    else if (roe >= 15) score += 30;
    else if (roe >= 10) score += 20;
    else if (roe >= 5) score += 10;
    
    // Debt-to-Equity scoring (0-30 points)
    if (debtToEquity <= 0.3) score += 30;
    else if (debtToEquity <= 0.5) score += 20;
    else if (debtToEquity <= 0.7) score += 10;
    
    // Interest Coverage scoring (0-30 points)
    if (interestCoverage >= 5) score += 30;
    else if (interestCoverage >= 3) score += 20;
    else if (interestCoverage >= 2) score += 10;

    if (score >= 80) return { level: 'Excelente', color: 'bg-green-500', textColor: 'text-green-700' };
    if (score >= 60) return { level: 'Bom', color: 'bg-orange-500', textColor: 'text-orange-700' };
    if (score >= 40) return { level: 'Regular', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    return { level: 'Crítico', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'deteriorating': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sustentabilidade Financeira
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
            <Shield className="h-5 w-5" />
            Sustentabilidade Financeira
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

  const sustainabilityLevel = getSustainabilityLevel(
    data.profitability.returnOnEquity,
    data.debtStructure.debtToEquity,
    data.interestCoverage.currentRatio
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sustentabilidade Financeira
            </CardTitle>
            <CardDescription>
              Análise de endividamento, rentabilidade e eficiência operacional
            </CardDescription>
          </div>
          <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="debt">Endividamento</SelectItem>
              <SelectItem value="profitability">Rentabilidade</SelectItem>
              <SelectItem value="efficiency">Eficiência</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Score de Sustentabilidade */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {data.profitability.returnOnEquity.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">ROE</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {(data.debtStructure.debtToEquity * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">D/E Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {data.interestCoverage.currentRatio.toFixed(1)}x
            </div>
            <div className="text-sm text-gray-600">Cobertura Juros</div>
          </div>
          <div className="text-center">
            <Badge className={`${sustainabilityLevel.color} ${sustainabilityLevel.textColor} text-lg px-4 py-2`}>
              {sustainabilityLevel.level}
            </Badge>
            <div className="text-sm text-gray-600 mt-1">Sustentabilidade</div>
          </div>
        </div>

        {/* Conteúdo baseado na visualização selecionada */}
        {selectedView === 'overview' && (
          <div className="space-y-4">
            {/* Indicadores Principais */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Indicadores Principais
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>ROE (Retorno sobre Patrimônio)</span>
                    <span>{data.profitability.returnOnEquity.toFixed(2)}%</span>
                  </div>
                  <Progress value={Math.min(data.profitability.returnOnEquity * 4, 100)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>ROA (Retorno sobre Ativos)</span>
                    <span>{data.profitability.returnOnAssets.toFixed(2)}%</span>
                  </div>
                  <Progress value={Math.min(data.profitability.returnOnAssets * 6, 100)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>ROIC (Retorno sobre Capital Investido)</span>
                    <span>{data.profitability.returnOnInvestedCapital.toFixed(2)}%</span>
                  </div>
                  <Progress value={Math.min(data.profitability.returnOnInvestedCapital * 4, 100)} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Margem Líquida</span>
                    <span>{data.profitability.netMargin.toFixed(2)}%</span>
                  </div>
                  <Progress value={Math.min(data.profitability.netMargin * 4, 100)} className="h-2" />
                </div>
              </div>
            </div>

            {/* Estrutura de Dívida */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Estrutura de Dívida
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center border rounded-lg p-3">
                  <div className="text-lg font-bold text-orange-600">
                    R$ {data.debtStructure.shortTermDebt.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-gray-600">Dívida Curto Prazo</div>
                </div>
                <div className="text-center border rounded-lg p-3">
                  <div className="text-lg font-bold text-green-600">
                    R$ {data.debtStructure.longTermDebt.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-gray-600">Dívida Longo Prazo</div>
                </div>
                <div className="text-center border rounded-lg p-3">
                  <div className="text-lg font-bold text-purple-600">
                    R$ {data.debtStructure.totalDebt.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-gray-600">Dívida Total</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'debt' && (
          <div className="space-y-4">
            {/* Análise de Endividamento */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Análise de Endividamento
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Ratios de Endividamento</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Dívida/Patrimônio</span>
                      <span className="font-medium">{(data.debtStructure.debtToEquity * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Dívida/Ativos</span>
                      <span className="font-medium">{(data.debtStructure.debtToAssets * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={data.debtStructure.debtToEquity * 100} className="h-2" />
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-medium mb-2">Cobertura de Juros</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Ratio Atual</span>
                      <span className="font-medium">{data.interestCoverage.currentRatio.toFixed(1)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">EBIT Mínimo</span>
                      <span className="font-medium">R$ {data.interestCoverage.breakevenEBIT.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(data.interestCoverage.trend)}
                      <span className="text-sm capitalize">{data.interestCoverage.trend}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vencimento da Dívida */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Vencimento da Dívida
              </h4>
              <div className="space-y-3">
                {data.debtStructure.debtMaturity.map((maturity, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Ano {maturity.year}</span>
                      <Badge variant="outline">{maturity.percentage.toFixed(1)}%</Badge>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Valor</span>
                      <span className="font-medium">R$ {maturity.amount.toLocaleString('pt-BR')}</span>
                    </div>
                    <Progress value={maturity.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Histórico de Cobertura de Juros */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Histórico de Cobertura de Juros
              </h4>
              <div className="space-y-3">
                {data.interestCoverage.historicalRatio.map((history, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{history.period}</span>
                      <Badge variant="outline">{history.ratio.toFixed(1)}x</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">EBIT:</span>
                        <span className="ml-2 font-medium">R$ {history.ebit.toLocaleString('pt-BR')}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Despesas Financeiras:</span>
                        <span className="ml-2 font-medium">R$ {history.interestExpense.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'profitability' && (
          <div className="space-y-4">
            {/* Análise de Rentabilidade */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Análise de Rentabilidade
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">ROE</span>
                      <span className="text-green-600 font-bold">{data.profitability.returnOnEquity.toFixed(2)}%</span>
                    </div>
                    <Progress value={Math.min(data.profitability.returnOnEquity * 4, 100)} className="h-2" />
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">ROA</span>
                      <span className="text-orange-600 font-bold">{data.profitability.returnOnAssets.toFixed(2)}%</span>
                    </div>
                    <Progress value={Math.min(data.profitability.returnOnAssets * 6, 100)} className="h-2" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">ROIC</span>
                      <span className="text-purple-600 font-bold">{data.profitability.returnOnInvestedCapital.toFixed(2)}%</span>
                    </div>
                    <Progress value={Math.min(data.profitability.returnOnInvestedCapital * 4, 100)} className="h-2" />
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Margem Líquida</span>
                      <span className="text-orange-600 font-bold">{data.profitability.netMargin.toFixed(2)}%</span>
                    </div>
                    <Progress value={Math.min(data.profitability.netMargin * 4, 100)} className="h-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Histórico de Rentabilidade */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Histórico de Rentabilidade
              </h4>
              <div className="space-y-3">
                {data.profitability.profitabilityHistory.map((history, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">{history.period}</span>
                      <Badge variant="outline">ROE: {history.roe.toFixed(1)}%</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-green-600">{history.roe.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">ROE</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-orange-600">{history.roa.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">ROA</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-purple-600">{history.roic.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">ROIC</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                      <div className="text-center">
                        <div className="font-medium text-orange-600">{history.grossMargin.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">Margem Bruta</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-indigo-600">{history.operatingMargin.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">Margem Oper.</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-pink-600">{history.netMargin.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">Margem Líq.</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'efficiency' && (
          <div className="space-y-4">
            {/* Métricas de Eficiência */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Métricas de Eficiência
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Giro de Ativos</span>
                      <span className="text-orange-600 font-bold">{data.efficiency.assetTurnover.toFixed(2)}x</span>
                    </div>
                    <Progress value={Math.min(data.efficiency.assetTurnover * 25, 100)} className="h-2" />
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Giro de Estoque</span>
                      <span className="text-green-600 font-bold">{data.efficiency.inventoryTurnover.toFixed(2)}x</span>
                    </div>
                    <Progress value={Math.min(data.efficiency.inventoryTurnover * 8, 100)} className="h-2" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Giro de Contas a Receber</span>
                      <span className="text-purple-600 font-bold">{data.efficiency.receivablesTurnover.toFixed(2)}x</span>
                    </div>
                    <Progress value={Math.min(data.efficiency.receivablesTurnover * 8, 100)} className="h-2" />
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Giro de Contas a Pagar</span>
                      <span className="text-orange-600 font-bold">{data.efficiency.payablesTurnover.toFixed(2)}x</span>
                    </div>
                    <Progress value={Math.min(data.efficiency.payablesTurnover * 6, 100)} className="h-2" />
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="border rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Giro de Capital de Giro</span>
                    <span className="text-indigo-600 font-bold">{data.efficiency.workingCapitalTurnover.toFixed(2)}x</span>
                  </div>
                  <Progress value={Math.min(data.efficiency.workingCapitalTurnover * 20, 100)} className="h-2" />
                </div>
              </div>
            </div>

            {/* Interpretação dos Indicadores */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Interpretação dos Indicadores
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-green-600 mb-1">Giro de Ativos</h5>
                    <p className="text-sm text-gray-600">
                      {data.efficiency.assetTurnover > 1.5 ? 'Excelente' : data.efficiency.assetTurnover > 1 ? 'Bom' : 'Abaixo da média'} 
                      - Indica eficiência no uso dos ativos para gerar receita.
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-orange-600 mb-1">Giro de Estoque</h5>
                    <p className="text-sm text-gray-600">
                      {data.efficiency.inventoryTurnover > 6 ? 'Excelente' : data.efficiency.inventoryTurnover > 4 ? 'Bom' : 'Abaixo da média'} 
                      - Velocidade de renovação do estoque.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-purple-600 mb-1">Giro de Contas a Receber</h5>
                    <p className="text-sm text-gray-600">
                      {data.efficiency.receivablesTurnover > 8 ? 'Excelente' : data.efficiency.receivablesTurnover > 6 ? 'Bom' : 'Abaixo da média'} 
                      - Eficiência na cobrança de vendas.
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <h5 className="font-medium text-orange-600 mb-1">Giro de Capital de Giro</h5>
                    <p className="text-sm text-gray-600">
                      {data.efficiency.workingCapitalTurnover > 4 ? 'Excelente' : data.efficiency.workingCapitalTurnover > 2 ? 'Bom' : 'Abaixo da média'} 
                      - Eficiência no uso do capital de giro.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Projeções de Sustentabilidade */}
        {data.sustainabilityProjections.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Projeções de Sustentabilidade
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.sustainabilityProjections.map((projection, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium">{projection.year}</span>
                    <Badge variant="outline">
                      {projection.confidence.toFixed(0)}% confiança
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>ROE Projetado</span>
                      <span className="font-medium text-green-600">{projection.projectedROE.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ROA Projetado</span>
                      <span className="font-medium text-orange-600">{projection.projectedROA.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>D/E Projetado</span>
                      <span className="font-medium text-purple-600">{(projection.projectedDebtToEquity * 100).toFixed(1)}%</span>
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
