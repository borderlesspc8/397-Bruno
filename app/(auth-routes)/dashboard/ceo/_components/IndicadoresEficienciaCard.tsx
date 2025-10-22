/**
 * 📊 INDICADORES DE EFICIÊNCIA OPERACIONAL
 * 
 * Exibe:
 * - Relação custos operacionais / receita
 * - CAC (Custo de Aquisição de Cliente)
 * - Rentabilidade por centro de custo
 * - Ticket médio
 * - Margem de contribuição
 */

'use client';

import React from 'react';

interface Props {
  dados: {
    custoOperacionalSobreReceita: number;
    custoAquisicaoCliente: number;
    rentabilidadePorCentroCusto: Array<{
      id: number;
      nome: string;
      receita: number;
      despesas: number;
      lucro: number;
      margem: number;
    }>;
    ticketMedio: number;
    margemContribuicao: number;
  };
}

export function IndicadoresEficienciaCard({ dados }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
  
  const getStatusColor = (value: number, tipo: 'custos' | 'margem') => {
    if (tipo === 'custos') {
      if (value < 30) return 'text-green-600 bg-green-50';
      if (value < 50) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    } else {
      if (value > 40) return 'text-green-600 bg-green-50';
      if (value > 25) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        Indicadores de Eficiência Operacional
      </h2>
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Custo Operacional / Receita */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Custos Operacionais / Receita</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold px-3 py-1 rounded ${getStatusColor(dados.custoOperacionalSobreReceita, 'custos')}`}>
              {dados.custoOperacionalSobreReceita.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {dados.custoOperacionalSobreReceita < 30 ? '✅ Ótimo controle' : 
             dados.custoOperacionalSobreReceita < 50 ? '⚠️ Atenção necessária' : 
             '❌ Revisão urgente'}
          </p>
        </div>
        
        {/* CAC */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">CAC - Custo Aquisição Cliente</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {formatCurrency(dados.custoAquisicaoCliente)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Investimento por novo cliente
          </p>
        </div>
        
        {/* Margem de Contribuição */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Margem de Contribuição</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold px-3 py-1 rounded ${getStatusColor(dados.margemContribuicao, 'margem')}`}>
              {dados.margemContribuicao.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {dados.margemContribuicao > 40 ? '✅ Excelente margem' : 
             dados.margemContribuicao > 25 ? '⚠️ Margem adequada' : 
             '❌ Margem baixa'}
          </p>
        </div>
      </div>
      
      {/* Rentabilidade por Centro de Custo */}
      {dados.rentabilidadePorCentroCusto && dados.rentabilidadePorCentroCusto.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Rentabilidade por Centro de Custo
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Centro de Custo
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Receita
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Despesas
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Lucro
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Margem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dados.rentabilidadePorCentroCusto.slice(0, 5).map((cc) => (
                  <tr key={cc.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{cc.nome}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(cc.receita)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600">
                      {formatCurrency(cc.despesas)}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      cc.lucro >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(cc.lucro)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={`px-2 py-1 rounded ${
                        cc.margem > 20 ? 'bg-green-100 text-green-700' :
                        cc.margem > 10 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {cc.margem.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


