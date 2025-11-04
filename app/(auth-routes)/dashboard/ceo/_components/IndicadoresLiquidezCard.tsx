/**
 * 💧 INDICADORES DE LIQUIDEZ
 * 
 * Exibe:
 * - Liquidez Corrente
 * - Liquidez Imediata
 * - Capital de Giro
 * - Ciclo de Conversão de Caixa
 * - Saldo Disponível
 */

'use client';

import React from 'react';

interface Props {
  dados: {
    liquidezCorrente: number;
    liquidezImediata: number;
    capitalGiro: number;
    cicloConversaoCaixa: number;
    saldoDisponivel: number;
  };
}

export function IndicadoresLiquidezCard({ dados }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const getLiquidezStatus = (value: number) => {
    if (value >= 1.5) return { 
      color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30', 
      text: 'Excelente', 
      icon: '✅' 
    };
    if (value >= 1.0) return { 
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30', 
      text: 'Adequada', 
      icon: '👍' 
    };
    if (value >= 0.5) return { 
      color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30', 
      text: 'Atenção', 
      icon: '⚠️' 
    };
    return { 
      color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30', 
      text: 'Crítica', 
      icon: '❌' 
    };
  };
  
  const statusCorrente = getLiquidezStatus(dados.liquidezCorrente);
  const statusImediata = getLiquidezStatus(dados.liquidezImediata);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <span className="text-2xl">💧</span>
        Indicadores de Liquidez
      </h2>
      
      {/* Grid de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Liquidez Corrente */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-blue-500 dark:border-blue-400">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Liquidez Corrente</p>
            <span className="text-xl">{statusCorrente.icon}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold px-3 py-1 rounded ${statusCorrente.color}`}>
              {dados.liquidezCorrente.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {statusCorrente.text} • Ativo Circulante / Passivo Circulante
          </p>
        </div>
        
        {/* Liquidez Imediata */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-purple-500 dark:border-purple-400">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Liquidez Imediata</p>
            <span className="text-xl">{statusImediata.icon}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold px-3 py-1 rounded ${statusImediata.color}`}>
              {dados.liquidezImediata.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {statusImediata.text} • Disponível / Passivo Circulante
          </p>
        </div>
        
        {/* Capital de Giro */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-green-500 dark:border-green-400">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Capital de Giro</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${dados.capitalGiro >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(dados.capitalGiro)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {dados.capitalGiro >= 0 ? '✅ Capital positivo' : '❌ Capital negativo'}
          </p>
        </div>
        
        {/* Saldo Disponível */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border-l-4 border-yellow-500 dark:border-yellow-400">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Saldo Disponível</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(dados.saldoDisponivel)}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Caixa + Bancos
          </p>
        </div>
      </div>
      
      {/* Ciclo de Conversão de Caixa */}
      <div className="mt-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Ciclo de Conversão de Caixa</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Tempo entre pagamento a fornecedores e recebimento de clientes
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {dados.cicloConversaoCaixa}
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400 ml-1">dias</span>
          </div>
        </div>
      </div>
      
      {/* Interpretação */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">📖 Como Interpretar:</p>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong className="text-gray-700 dark:text-gray-300">Liquidez Corrente &gt; 1.5:</strong> Empresa saudável financeiramente</li>
          <li>• <strong className="text-gray-700 dark:text-gray-300">Liquidez Imediata &gt; 0.5:</strong> Boa capacidade de pagamento imediato</li>
          <li>• <strong className="text-gray-700 dark:text-gray-300">Capital de Giro positivo:</strong> Empresa pode cobrir obrigações de curto prazo</li>
        </ul>
      </div>
    </div>
  );
}



