/**
 * ⚠️ CEO DASHBOARD - ALERT CARD COMPONENT
 */

'use client';

import type { AlertaFinanceiro } from '../_types/ceo-dashboard.types';

interface AlertCardProps {
  alerta: AlertaFinanceiro;
  onDismiss?: (id: string) => void;
}

export function AlertCard({ alerta, onDismiss }: AlertCardProps) {
  const alertStyles = {
    critico: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      icon: '🚨',
      iconBg: 'bg-red-100',
    },
    atencao: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-900',
      icon: '⚠️',
      iconBg: 'bg-yellow-100',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-900',
      icon: 'ℹ️',
      iconBg: 'bg-blue-100',
    },
  };
  
  const style = alertStyles[alerta.tipo];
  
  const categoriaLabels = {
    liquidez: 'Liquidez',
    inadimplencia: 'Inadimplência',
    margem: 'Margem',
    crescimento: 'Crescimento',
    meta: 'Meta',
    despesa: 'Despesa',
  };
  
  return (
    <div className={`${style.bg} border-l-4 ${style.border} p-4 rounded-lg shadow-sm`}>
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center text-xl`}>
          {style.icon}
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-base font-semibold ${style.text}`}>
              {alerta.titulo}
            </h3>
            <span className="text-xs text-gray-500 px-2 py-1 bg-white rounded">
              {categoriaLabels[alerta.categoria]}
            </span>
          </div>
          
          {/* Descrição */}
          <p className={`text-sm ${style.text} mb-2 opacity-90`}>
            {alerta.descricao}
          </p>
          
          {/* Ação Recomendada */}
          {alerta.acaoRecomendada && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-current opacity-20">
              <span className="text-xs font-semibold">💡 Ação:</span>
              <p className="text-xs flex-1">{alerta.acaoRecomendada}</p>
            </div>
          )}
        </div>
        
        {/* Botão Dispensar */}
        {onDismiss && (
          <button
            onClick={() => onDismiss(alerta.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            title="Dispensar alerta"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}


