/**
 * 💰 CEO DASHBOARD - TABELA DE RENTABILIDADE POR CENTRO DE CUSTO
 * 
 * Componente para exibir rentabilidade detalhada por centro de custo
 * com dados REAIS das APIs
 */

'use client';

import React from 'react';
import type { RentabilidadeItem } from '../_types/indicadores-financeiros.types';

interface RentabilidadeCentroCustoTableProps {
  dados: RentabilidadeItem[];
}

export function RentabilidadeCentroCustoTable({ dados }: RentabilidadeCentroCustoTableProps) {
  if (!dados || dados.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          💰 Rentabilidade por Centro de Custo
        </h2>
        <p className="text-gray-500 text-center py-8">
          Nenhum dado disponível para o período selecionado
        </p>
      </div>
    );
  }

  // Calcular totais
  const totais = dados.reduce(
    (acc, item) => ({
      receita: acc.receita + item.receita,
      custos: acc.custos + item.custos,
      despesas: acc.despesas + item.despesas,
      lucro: acc.lucro + item.lucro,
    }),
    { receita: 0, custos: 0, despesas: 0, lucro: 0 }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lucrativo':
        return 'text-green-600 bg-green-50';
      case 'equilibrio':
        return 'text-yellow-600 bg-yellow-50';
      case 'prejuizo':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'lucrativo':
        return '✅ Lucrativo';
      case 'equilibrio':
        return '⚖️ Equilíbrio';
      case 'prejuizo':
        return '❌ Prejuízo';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          💰 Rentabilidade por Centro de Custo
        </h2>
        <p className="text-sm text-gray-600">
          Análise detalhada de receitas, custos e despesas por centro de custo
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Centro de Custo
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receita
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Custos
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Despesas
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lucro
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Margem %
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Part. %
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dados.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {item.nome}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-700">
                  {formatCurrency(item.receita)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-red-600">
                  {formatCurrency(item.custos)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-red-600">
                  {formatCurrency(item.despesas)}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-right font-semibold ${
                    item.lucro >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(item.lucro)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold">
                  {item.margem.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {item.participacao.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold">
            <tr className="border-t-2 border-gray-300">
              <td className="px-4 py-3 text-sm">TOTAL</td>
              <td className="px-4 py-3 text-sm text-right">
                {formatCurrency(totais.receita)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-red-600">
                {formatCurrency(totais.custos)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-red-600">
                {formatCurrency(totais.despesas)}
              </td>
              <td
                className={`px-4 py-3 text-sm text-right ${
                  totais.lucro >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(totais.lucro)}
              </td>
              <td className="px-4 py-3 text-sm text-right">
                {totais.receita > 0
                  ? ((totais.lucro / totais.receita) * 100).toFixed(1)
                  : '0.0'}
                %
              </td>
              <td className="px-4 py-3 text-sm text-right">100%</td>
              <td className="px-4 py-3 text-center">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Estatísticas Resumidas */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium uppercase mb-1">
            Centros Ativos
          </p>
          <p className="text-2xl font-bold text-blue-900">{dados.length}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-xs text-green-600 font-medium uppercase mb-1">
            Lucrativos
          </p>
          <p className="text-2xl font-bold text-green-900">
            {dados.filter((d) => d.status === 'lucrativo').length}
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-xs text-red-600 font-medium uppercase mb-1">
            Em Prejuízo
          </p>
          <p className="text-2xl font-bold text-red-900">
            {dados.filter((d) => d.status === 'prejuizo').length}
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-xs text-purple-600 font-medium uppercase mb-1">
            Margem Média
          </p>
          <p className="text-2xl font-bold text-purple-900">
            {totais.receita > 0
              ? ((totais.lucro / totais.receita) * 100).toFixed(1)
              : '0.0'}
            %
          </p>
        </div>
      </div>
    </div>
  );
}

export default RentabilidadeCentroCustoTable;


