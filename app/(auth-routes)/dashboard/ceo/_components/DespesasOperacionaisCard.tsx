/**
 * 💸 CEO DASHBOARD - CARD DE DESPESAS OPERACIONAIS
 * 
 * Componente para exibir despesas operacionais detalhadas
 * com dados REAIS das APIs
 */

'use client';

import React from 'react';
import type { DREDespesasOperacionais } from '../_types/dre.types';

interface DespesasOperacionaisCardProps {
  despesas: DREDespesasOperacionais;
  receitaLiquida?: number;
}

export function DespesasOperacionaisCard({ 
  despesas, 
  receitaLiquida = 0 
}: DespesasOperacionaisCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calcularPercentual = (valor: number) => {
    if (receitaLiquida === 0) return 0;
    return ((valor / receitaLiquida) * 100).toFixed(1);
  };

  const despesasVendas = [
    { label: 'Comissões', valor: despesas.vendas.comissoes },
    { label: 'Marketing', valor: despesas.vendas.marketing },
    { label: 'Publicidade', valor: despesas.vendas.publicidade },
    { label: 'Promoções', valor: despesas.vendas.promocoes },
    { label: 'Fretes/Entrega', valor: despesas.vendas.fretesEntrega },
    { label: 'Outros', valor: despesas.vendas.outros },
  ].filter(item => item.valor > 0);

  const despesasAdm = [
    { label: 'Aluguel', valor: despesas.administrativas.aluguel },
    { label: 'Contas (Energia, Água, Internet)', valor: despesas.administrativas.contas },
    { label: 'Materiais', valor: despesas.administrativas.materiais },
    { label: 'Serviços', valor: despesas.administrativas.servicos },
    { label: 'Manutenção', valor: despesas.administrativas.manutencao },
    { label: 'Seguros', valor: despesas.administrativas.seguros },
    { label: 'Taxas', valor: despesas.administrativas.taxas },
    { label: 'Outros', valor: despesas.administrativas.outros },
  ].filter(item => item.valor > 0);

  const despesasPessoal = [
    { label: 'Salários', valor: despesas.pessoal.salarios },
    { label: 'Encargos', valor: despesas.pessoal.encargos },
    { label: 'Benefícios', valor: despesas.pessoal.beneficios },
    { label: 'Treinamento', valor: despesas.pessoal.treinamento },
    { label: 'Outros', valor: despesas.pessoal.outros },
  ].filter(item => item.valor > 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          💸 Despesas Operacionais
        </h2>
        <p className="text-sm text-gray-600">
          Detalhamento completo das despesas operacionais do período
        </p>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-xs text-orange-600 font-medium uppercase mb-1">
            Despesas de Vendas
          </p>
          <p className="text-2xl font-bold text-orange-900">
            {formatCurrency(despesas.vendas.total)}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {calcularPercentual(despesas.vendas.total)}% da receita
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-blue-600 font-medium uppercase mb-1">
            Despesas Administrativas
          </p>
          <p className="text-2xl font-bold text-blue-900">
            {formatCurrency(despesas.administrativas.total)}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {calcularPercentual(despesas.administrativas.total)}% da receita
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-xs text-purple-600 font-medium uppercase mb-1">
            Despesas com Pessoal
          </p>
          <p className="text-2xl font-bold text-purple-900">
            {formatCurrency(despesas.pessoal.total)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {calcularPercentual(despesas.pessoal.total)}% da receita
          </p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-xs text-red-600 font-medium uppercase mb-1">
            Total Despesas
          </p>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(despesas.total)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {calcularPercentual(despesas.total)}% da receita
          </p>
        </div>
      </div>

      {/* Detalhamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Despesas de Vendas */}
        {despesasVendas.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="text-orange-500 mr-2">🛒</span>
              Despesas de Vendas
            </h3>
            <div className="space-y-2">
              {despesasVendas.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.valor)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between items-center font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-orange-600">
                  {formatCurrency(despesas.vendas.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Despesas Administrativas */}
        {despesasAdm.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="text-blue-500 mr-2">🏢</span>
              Despesas Administrativas
            </h3>
            <div className="space-y-2">
              {despesasAdm.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.valor)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between items-center font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-blue-600">
                  {formatCurrency(despesas.administrativas.total)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Despesas com Pessoal */}
        {despesasPessoal.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <span className="text-purple-500 mr-2">👥</span>
              Despesas com Pessoal
            </h3>
            <div className="space-y-2">
              {despesasPessoal.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(item.valor)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between items-center font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-purple-600">
                  {formatCurrency(despesas.pessoal.total)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alerta se despesas acima de 70% da receita */}
      {receitaLiquida > 0 && (despesas.total / receitaLiquida) > 0.7 && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-yellow-500 text-xl mr-2">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Atenção: Despesas Elevadas
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                As despesas operacionais representam {calcularPercentual(despesas.total)}% da receita líquida. 
                Considere revisar e otimizar custos para melhorar a margem de lucro.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DespesasOperacionaisCard;


