"use client";

import { Card, CardContent } from "@/app/_components/ui/card";

interface DashboardSummaryProps {
  totais: {
    faturamento: number;
    vendas: number;
    ticketMedio: number;
  };
}

// Função formatCurrency implementada localmente para evitar dependências externas
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function DashboardSummary({ totais }: DashboardSummaryProps) {
  if (!totais) return null;
  
  return (
    <Card className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-[#faba33]/20">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-amber-800 dark:text-amber-300">Faturamento Total</span>
            <span className="text-3xl font-bold text-amber-700 dark:text-amber-200">{formatCurrency(totais.faturamento)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-amber-800 dark:text-amber-300">Vendas Realizadas</span>
            <span className="text-3xl font-bold text-amber-700 dark:text-amber-200">{totais.vendas}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-amber-800 dark:text-amber-300">Ticket Médio</span>
            <span className="text-3xl font-bold text-amber-700 dark:text-amber-200">{formatCurrency(totais.ticketMedio)}</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-right text-amber-600/70 dark:text-amber-400/70">
          <span>Dados obtidos da API em tempo real</span>
        </div>
      </CardContent>
    </Card>
  );
} 