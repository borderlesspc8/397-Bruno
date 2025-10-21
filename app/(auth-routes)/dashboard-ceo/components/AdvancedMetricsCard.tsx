'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface MetricItemProps {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  benchmark: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  unit?: string;
  format?: 'currency' | 'percentage' | 'number';
}

const MetricItem: React.FC<MetricItemProps> = ({
  label,
  value,
  trend,
  changePercent,
  benchmark,
  status,
  unit = '',
  format = 'number'
}) => {
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (format === 'percentage') {
      return `${val.toFixed(2)}%`;
    }
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusColor = () => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'excellent':
        return 'Excelente';
      case 'good':
        return 'Bom';
      case 'warning':
        return 'Atenção';
      case 'critical':
        return 'Crítico';
      default:
        return 'N/A';
    }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <div className={`p-4 rounded-lg border-2 ${getStatusColor()}`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor()}`}>
          {getStatusLabel()}
        </span>
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold">
          {formatValue(value)}
          {unit && <span className="text-sm ml-1">{unit}</span>}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span className="font-medium">
            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
          </span>
          <span className="text-gray-500">vs período anterior</span>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Benchmark:</span>
          <span className="font-semibold">{formatValue(benchmark)}</span>
        </div>
      </div>
    </div>
  );
};

interface ROIChannelItemProps {
  channel: string;
  investment: number;
  return: number;
  roi: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

const ROIChannelItem: React.FC<ROIChannelItemProps> = ({
  channel,
  investment,
  return: returnValue,
  roi,
  status
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800';
      case 'good':
        return 'bg-orange-100 text-orange-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <p className="font-medium text-sm text-gray-900">{channel}</p>
        <div className="flex gap-4 mt-1 text-xs text-gray-600">
          <span>Investimento: R$ {investment.toLocaleString('pt-BR')}</span>
          <span>Retorno: R$ {returnValue.toLocaleString('pt-BR')}</span>
        </div>
      </div>
      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor()}`}>
        {roi > 0 ? '+' : ''}{roi.toFixed(1)}%
      </div>
    </div>
  );
};

interface AdvancedMetrics {
  realCAC: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    benchmark: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
  churnRate: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    benchmark: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
  lifetimeValue: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    benchmark: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
  conversionRate: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    benchmark: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
  realProfitMargin: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
    benchmark: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  };
  roiByChannel: Array<{
    channel: string;
    investment: number;
    return: number;
    roi: number;
    status: 'excellent' | 'good' | 'warning' | 'critical';
  }>;
}

interface AdvancedMetricsCardProps {
  data: AdvancedMetrics | null;
  loading?: boolean;
}

export function AdvancedMetricsCard({ data, loading }: AdvancedMetricsCardProps) {
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Métricas Avançadas</CardTitle>
          <CardDescription>Análise detalhada de performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Métricas Avançadas</CardTitle>
          <CardDescription>Análise detalhada de performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-sm">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Métricas Avançadas</CardTitle>
        <CardDescription>
          Análise detalhada de performance com dados reais da API Betel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métricas principais em grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricItem
            label="CAC - Custo de Aquisição de Cliente"
            value={data.realCAC.value}
            trend={data.realCAC.trend}
            changePercent={data.realCAC.changePercent}
            benchmark={data.realCAC.benchmark}
            status={data.realCAC.status}
            format="currency"
          />

          <MetricItem
            label="Churn Rate - Taxa de Cancelamento"
            value={data.churnRate.value}
            trend={data.churnRate.trend}
            changePercent={data.churnRate.changePercent}
            benchmark={data.churnRate.benchmark}
            status={data.churnRate.status}
            format="percentage"
          />

          <MetricItem
            label="LTV - Lifetime Value"
            value={data.lifetimeValue.value}
            trend={data.lifetimeValue.trend}
            changePercent={data.lifetimeValue.changePercent}
            benchmark={data.lifetimeValue.benchmark}
            status={data.lifetimeValue.status}
            format="currency"
          />

          <MetricItem
            label="Taxa de Conversão"
            value={data.conversionRate.value}
            trend={data.conversionRate.trend}
            changePercent={data.conversionRate.changePercent}
            benchmark={data.conversionRate.benchmark}
            status={data.conversionRate.status}
            format="percentage"
          />

          <MetricItem
            label="Margem de Lucro Real"
            value={data.realProfitMargin.value}
            trend={data.realProfitMargin.trend}
            changePercent={data.realProfitMargin.changePercent}
            benchmark={data.realProfitMargin.benchmark}
            status={data.realProfitMargin.status}
            format="percentage"
          />

          {/* Placeholder para manter o grid alinhado */}
          <div className="hidden lg:block"></div>
        </div>

        {/* ROI por Canal */}
        {data.roiByChannel && data.roiByChannel.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              ROI por Canal de Marketing
            </h3>
            <div className="space-y-2">
              {data.roiByChannel.map((channel, index) => (
                <ROIChannelItem
                  key={index}
                  channel={channel.channel}
                  investment={channel.investment}
                  return={channel.return}
                  roi={channel.roi}
                  status={channel.status}
                />
              ))}
            </div>
          </div>
        )}

        {/* Legenda de Status */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold mb-3 text-gray-700">Legenda de Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600">Excelente - Acima do ideal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-gray-600">Bom - Dentro do esperado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-gray-600">Atenção - Requer monitoramento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-gray-600">Crítico - Ação imediata</span>
            </div>
          </div>
        </div>

        {/* Nota sobre dados reais */}
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-xs text-orange-800">
            <strong>📊 Dados Reais:</strong> Todas as métricas são calculadas com base em dados reais 
            obtidos da API Betel, incluindo vendas, clientes, leads e investimentos em marketing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdvancedMetricsCard;

