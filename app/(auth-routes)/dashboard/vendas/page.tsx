"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { TrendingUp, DollarSign, Users, ShoppingCart } from "lucide-react";

// DADOS MOCKADOS - Demonstração ao Cliente
const mockVendas = [
  { id: 1, cliente: "Empresa A", valor: 15000, data: "2026-01-20", vendedor: "João Silva", status: "Concretizada" },
  { id: 2, cliente: "Empresa B", valor: 8500, data: "2026-01-19", vendedor: "Maria Santos", status: "Concretizada" },
  { id: 3, cliente: "Empresa C", valor: 12300, data: "2026-01-18", vendedor: "Pedro Costa", status: "Em andamento" },
  { id: 4, cliente: "Empresa D", valor: 22000, data: "2026-01-17", vendedor: "João Silva", status: "Concretizada" },
  { id: 5, cliente: "Empresa E", valor: 9800, data: "2026-01-16", vendedor: "Ana Garcia", status: "Concretizada" },
];

export default function VendasPage() {
  const [vendas] = useState(mockVendas);
  
  const totalVendas = vendas.length;
  const totalFaturamento = vendas.reduce((acc, v) => acc + v.valor, 0);
  const ticketMedio = totalFaturamento / totalVendas;
  const vendasConcretizadas = vendas.filter(v => v.status === "Concretizada").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Dashboard de Vendas</h1>
        <p className="text-gray-600 mt-2">Visão geral das vendas do mês</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVendas}</div>
            <p className="text-xs text-gray-500">{vendasConcretizadas} concretizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {(totalFaturamento / 1000).toFixed(1)}k</div>
            <p className="text-xs text-gray-500">+12% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ {ticketMedio.toLocaleString('pt-BR', {maximumFractionDigits: 0})}</div>
            <p className="text-xs text-gray-500">Por venda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Conversão</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{((vendasConcretizadas / totalVendas) * 100).toFixed(0)}%</div>
            <p className="text-xs text-gray-500">Vendas concretizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Vendas</CardTitle>
          <CardDescription>Registros recentes de vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4">Cliente</th>
                  <th className="text-left py-2 px-4">Vendedor</th>
                  <th className="text-right py-2 px-4">Valor</th>
                  <th className="text-left py-2 px-4">Data</th>
                  <th className="text-center py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((venda) => (
                  <tr key={venda.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{venda.cliente}</td>
                    <td className="py-3 px-4">{venda.vendedor}</td>
                    <td className="py-3 px-4 text-right font-semibold">R$ {venda.valor.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4">{new Date(venda.data).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        venda.status === 'Concretizada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {venda.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Nota para o cliente */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>ℹ️ Demonstração:</strong> Os dados mostrados são mockados para demonstração. 
          Quando APIs reais forem integradas, os dados virão de fontes em produção.
        </p>
      </div>
    </div>
  );
}
