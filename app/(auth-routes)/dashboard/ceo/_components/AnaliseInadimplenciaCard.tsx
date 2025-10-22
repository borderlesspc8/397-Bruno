/**
 * 📛 ANÁLISE DE INADIMPLÊNCIA
 * 
 * Exibe:
 * - Taxa de Inadimplência
 * - Valor Inadimplente vs Total a Receber
 * - Aging de Recebíveis (classificação por tempo de atraso)
 * - Ticket Médio Inadimplente
 */

'use client';

import React from 'react';

interface AgingRecebiveis {
  faixa: string;
  quantidade: number;
  valorTotal: number;
  percentual: number;
}

interface Props {
  dados: {
    taxaInadimplencia: number;
    valorInadimplente: number;
    valorReceber: number;
    agingRecebíveis: AgingRecebiveis[];
    ticketMedioInadimplente: number;
  };
}

export function AnaliseInadimplenciaCard({ dados }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const getStatusInadimplencia = (taxa: number) => {
    if (taxa < 2) return { color: 'text-green-600 bg-green-50', text: 'Excelente', icon: '✅' };
    if (taxa < 5) return { color: 'text-yellow-600 bg-yellow-50', text: 'Adequado', icon: '⚠️' };
    if (taxa < 10) return { color: 'text-orange-600 bg-orange-50', text: 'Atenção', icon: '🔶' };
    return { color: 'text-red-600 bg-red-50', text: 'Crítico', icon: '❌' };
  };
  
  const status = getStatusInadimplencia(dados.taxaInadimplencia);
  const valorEmDia = dados.valorReceber - dados.valorInadimplente;
  const percentualEmDia = dados.valorReceber > 0 ? ((valorEmDia / dados.valorReceber) * 100) : 100;
  
  const getCorFaixa = (faixa: string) => {
    if (faixa.includes('0-30')) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (faixa.includes('31-60')) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (faixa.includes('61-90')) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-red-200 text-red-900 border-red-400';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">📛</span>
        Análise de Inadimplência
      </h2>
      
      {/* Taxa de Inadimplência Principal */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 mb-6 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Taxa de Inadimplência</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold px-4 py-2 rounded-lg ${status.color}`}>
                {dados.taxaInadimplencia.toFixed(1)}%
              </span>
              <span className="text-2xl">{status.icon}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Status: <strong>{status.text}</strong>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Valor Inadimplente</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(dados.valorInadimplente)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              de {formatCurrency(dados.valorReceber)} total
            </p>
          </div>
        </div>
      </div>
      
      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-gray-700 mb-1">Em Dia</p>
          <p className="text-2xl font-bold text-green-600">
            {percentualEmDia.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {formatCurrency(valorEmDia)}
          </p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-gray-700 mb-1">Atrasado</p>
          <p className="text-2xl font-bold text-red-600">
            {dados.taxaInadimplencia.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {formatCurrency(dados.valorInadimplente)}
          </p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-gray-700 mb-1">Ticket Médio Inadimplente</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(dados.ticketMedioInadimplente)}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Por recebível em atraso
          </p>
        </div>
      </div>
      
      {/* Aging de Recebíveis */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span>📊</span>
          Aging de Recebíveis (Classificação por Tempo de Atraso)
        </h3>
        
        <div className="space-y-3">
          {dados.agingRecebíveis.map((faixa, index) => (
            <div key={index} className={`rounded-lg border-2 p-4 ${getCorFaixa(faixa.faixa)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{faixa.faixa}</span>
                  {faixa.quantidade > 0 && (
                    <span className="text-xs bg-white px-2 py-1 rounded-full">
                      {faixa.quantidade} {faixa.quantidade === 1 ? 'título' : 'títulos'}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(faixa.valorTotal)}</p>
                  <p className="text-xs">{faixa.percentual.toFixed(1)}% do total inadimplente</p>
                </div>
              </div>
              
              {/* Barra de Progresso */}
              {faixa.percentual > 0 && (
                <div className="w-full bg-white rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full bg-current transition-all"
                    style={{ width: `${Math.min(faixa.percentual, 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Recomendações */}
      <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm font-semibold text-blue-900 mb-2">💡 Recomendações:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          {dados.taxaInadimplencia > 10 && (
            <li>• <strong>Urgente:</strong> Implementar plano de cobrança intensiva</li>
          )}
          {dados.taxaInadimplencia > 5 && dados.taxaInadimplencia <= 10 && (
            <li>• <strong>Atenção:</strong> Revisar política de crédito e prazos</li>
          )}
          {dados.agingRecebíveis.find(f => f.faixa.includes('> 90') && f.percentual > 20) && (
            <li>• Considerar provisão para devedores duvidosos (títulos &gt; 90 dias)</li>
          )}
          <li>• Analisar perfil dos clientes inadimplentes para prevenir novos casos</li>
          <li>• Implementar sistema de alertas automáticos antes do vencimento</li>
        </ul>
      </div>
    </div>
  );
}


