"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { CashFlowData } from "../types";

interface CashFlowChartProps {
  data: CashFlowData[];
  loading?: boolean;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: {
    income?: string;
    expenses?: string;
    balance?: string;
  };
}

export function CashFlowChart({ 
  data, 
  height = 400, 
  showLegend = true, 
  showGrid = true,
  colors = {
    income: '#10B981',
    expenses: '#EF4444',
    balance: '#3B82F6'
  },
  loading = false 
}: CashFlowChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular a escala do gráfico
  const maxValue = Math.max(
    ...data.map(item => Math.max(item.income, item.expenses, Math.abs(item.balance)))
  );
  const scale = maxValue > 0 ? 100 / maxValue : 100;

  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);
  const finalBalance = data[data.length - 1]?.balance || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL', 
      minimumFractionDigits: 0 
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Fluxo de Caixa</span>
          {showLegend && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.income }}></div>
                <span>Receitas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.expenses }}></div>
                <span>Despesas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: colors.balance }}></div>
                <span>Saldo</span>
              </div>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gráfico de barras */}
          <div className="overflow-x-auto">
            <div style={{ minWidth: '100%' }}>
              {data.map((item, index) => (
                <div key={index} className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                      {new Date(item.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-green-600 dark:text-green-400">
                        +{formatCurrency(item.income)}
                      </span>
                      <span className="text-red-600 dark:text-red-400">
                        -{formatCurrency(item.expenses)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Barras de progresso */}
                  <div className="flex gap-1 h-8">
                    <div
                      className="rounded-l bg-green-500 dark:bg-green-600"
                      style={{
                        width: `${Math.min((item.income * scale) / 2, 45)}%`,
                        minWidth: '2px'
                      }}
                      title={`Receitas: ${formatCurrency(item.income)}`}
                    />
                    <div
                      className="bg-red-500 dark:bg-red-600"
                      style={{
                        width: `${Math.min((item.expenses * scale) / 2, 45)}%`,
                        minWidth: '2px'
                      }}
                      title={`Despesas: ${formatCurrency(item.expenses)}`}
                    />
                    <div
                      className={`rounded-r ${item.balance >= 0 ? 'bg-blue-500 dark:bg-blue-600' : 'bg-orange-500 dark:bg-orange-600'}`}
                      style={{
                        width: `${Math.min((Math.abs(item.balance) * scale) / 2, 45)}%`,
                        minWidth: '2px'
                      }}
                      title={`Saldo: ${formatCurrency(item.balance)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Receitas</p>
              <p className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Despesas</p>
              <p className="font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Saldo Acumulado</p>
              <p className="font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(finalBalance)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}