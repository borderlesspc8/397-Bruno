'use client';

import { Card } from '@/app/_components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface CEOMetricCardProps {
  title: string;
  value: number;
  format: 'currency' | 'percentage' | 'number';
  loading?: boolean;
  error?: string | null;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
}

export function CEOMetricCard({ 
  title, 
  value, 
  format, 
  loading = false, 
  error = null,
  trend = 'neutral',
  trendValue = 0
}: CEOMetricCardProps) {
  const formatValue = (val: number, fmt: string) => {
    switch (fmt) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(val);
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
        return new Intl.NumberFormat('pt-BR').format(val);
      default:
        return val.toString();
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-red-800">{title}</h3>
        </div>
        <p className="text-red-600 text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">{title}</h3>
        {trend !== 'neutral' && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {trendValue > 0 ? '+' : ''}{trendValue.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {formatValue(value, format)}
      </div>
      
      <div className="text-sm text-gray-500">
        {format === 'currency' && 'Valor em reais'}
        {format === 'percentage' && 'Percentual'}
        {format === 'number' && 'Valor numérico'}
      </div>
    </Card>
  );
}

