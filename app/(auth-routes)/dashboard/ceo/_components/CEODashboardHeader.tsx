/**
 * 📊 CEO DASHBOARD - HEADER COM FILTROS
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CEODashboardHeaderProps {
  dataInicio: Date;
  dataFim: Date;
  onDataChange?: (inicio: Date, fim: Date) => void;
  onReload?: () => void;
  loading?: boolean;
  cached?: boolean;
}

export function CEODashboardHeader({
  dataInicio,
  dataFim,
  onDataChange,
  onReload,
  loading = false,
  cached = false,
}: CEODashboardHeaderProps) {
  const [showFilters, setShowFilters] = useState(false);
  
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Título */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <span className="text-4xl">📊</span>
              Dashboard CEO
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Visão executiva completa • {format(dataInicio, 'dd MMM', { locale: ptBR })} - {format(dataFim, 'dd MMM yyyy', { locale: ptBR })}
              {cached && <span className="ml-2 text-blue-600 font-medium">• Cache ativo</span>}
            </p>
          </div>
          
          {/* Ações */}
          <div className="flex items-center gap-3">
            {/* Botão Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
            >
              <span>🔍</span>
              Filtros
            </button>
            
            {/* Botão Atualizar */}
            <button
              onClick={onReload}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
            
            {/* Botão Exportar */}
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              title="Exportar relatório (em breve)"
            >
              <span>📥</span>
              Exportar
            </button>
          </div>
        </div>
        
        {/* Painel de Filtros (colapsável) */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={format(dataInicio, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const novaData = new Date(e.target.value);
                    onDataChange?.(novaData, dataFim);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={format(dataFim, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const novaData = new Date(e.target.value);
                    onDataChange?.(dataInicio, novaData);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    // Reset para mês atual
                    const hoje = new Date();
                    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
                    onDataChange?.(inicio, fim);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Mês Atual
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


