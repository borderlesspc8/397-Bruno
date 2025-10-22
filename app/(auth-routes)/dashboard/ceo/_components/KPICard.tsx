/**
 * 📊 CEO DASHBOARD - KPI CARD COMPONENT
 */

'use client';

import { formatarMoeda, formatarPercentual, formatarNumero } from '../_utils/formatadores';
import { CORES_STATUS, TEXTOS, FUNDOS } from '../_constants/cores-graficos';

interface KPICardProps {
  titulo: string;
  valor: number;
  unidade: 'currency' | 'percentage' | 'number';
  variacao?: number;
  variacaoLabel?: string;
  status?: 'excelente' | 'bom' | 'atencao' | 'critico';
  tendencia?: 'alta' | 'baixa' | 'estavel';
  meta?: number;
  icon?: string;
  loading?: boolean;
}

export function KPICard({
  titulo,
  valor,
  unidade,
  variacao,
  variacaoLabel = 'vs mês anterior',
  status = 'bom',
  tendencia,
  meta,
  icon = '📊',
  loading = false,
}: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-full mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  const statusColors = {
    excelente: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' },
    bom: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-500' },
    atencao: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
    critico: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
  };
  
  const statusStyle = statusColors[status];
  
  const formatarValor = () => {
    switch (unidade) {
      case 'currency':
        return formatarMoeda(valor);
      case 'percentage':
        return formatarPercentual(valor);
      case 'number':
        return formatarNumero(valor);
      default:
        return valor.toString();
    }
  };
  
  const percentualMeta = meta ? (valor / meta) * 100 : undefined;
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 ${statusStyle.border} p-6 hover:shadow-md transition-shadow`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600">{titulo}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      
      {/* Valor Principal */}
      <p className="text-3xl font-bold text-gray-900 mb-3">
        {formatarValor()}
      </p>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Status Badge */}
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        
        {/* Variação */}
        {variacao !== undefined && variacao !== 0 && (
          <div className="flex items-center gap-1">
            <span className={`text-sm font-semibold ${variacao > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {variacao > 0 ? '↑' : '↓'} {Math.abs(variacao).toFixed(1)}%
            </span>
            <span className="text-xs text-gray-500">{variacaoLabel}</span>
          </div>
        )}
        
        {/* Tendência */}
        {tendencia && !variacao && (
          <span className="text-sm text-gray-500">
            {tendencia === 'alta' ? '📈' : tendencia === 'baixa' ? '📉' : '➡️'}
          </span>
        )}
      </div>
      
      {/* Meta Progress */}
      {meta && percentualMeta !== undefined && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Meta</span>
            <span className="font-semibold">{percentualMeta.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                percentualMeta >= 100 ? 'bg-green-500' : percentualMeta >= 75 ? 'bg-blue-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${Math.min(percentualMeta, 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}



