"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Progress } from "@/app/_components/ui/progress";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
  PiggyBank,
  CreditCard,
  BarChart3
} from "lucide-react";
import { FinancialSummary } from "../types";

interface FinancialMetricsWidgetsProps {
  summary: FinancialSummary;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  loading?: boolean;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  loading, 
  color = 'blue' 
}: MetricCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400'
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-600 dark:text-red-400'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      icon: 'text-purple-600 dark:text-purple-400'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'text-orange-600 dark:text-orange-400'
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-full p-2 ${colorClasses[color].bg}`}>
          <div className={`h-4 w-4 ${colorClasses[color].icon}`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClasses[color].text} mb-1`}>
          {value}
        </div>
        {change !== undefined && (
          <div className="flex items-center space-x-2">
            <Badge
              variant="outline"
              className={`
                ${change >= 0 
                  ? 'text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-900/20' 
                  : 'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-900/20'
                }
              `}
            >
              {change >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(change)}
            </Badge>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function FinancialMetricsWidgets({ summary, loading }: FinancialMetricsWidgetsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCard
            key={i}
            title=""
            value=""
            icon={<DollarSign className="h-4 w-4" />}
            loading={true}
          />
        ))}
      </div>
    );
  }

  // Determinar a cor do saldo baseado no valor
  const balanceColor = summary.totalBalance >= 0 ? 'green' : 'red';

  // Calcular progresso de gastos (percentual das despesas em relação às receitas)
  const expenseRatio = summary.totalIncome > 0 
    ? (summary.totalExpenses / summary.totalIncome) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Saldo Total"
          value={formatCurrency(summary.totalBalance)}
          change={summary.balanceGrowth}
          changeLabel="vs. período anterior"
          icon={<Wallet className="h-4 w-4" />}
          color={balanceColor}
        />
        
        <MetricCard
          title="Total de Receitas"
          value={formatCurrency(summary.totalIncome)}
          change={summary.incomeGrowth}
          changeLabel="vs. período anterior"
          icon={<TrendingUp className="h-4 w-4" />}
          color="green"
        />
        
        <MetricCard
          title="Total de Despesas"
          value={formatCurrency(summary.totalExpenses)}
          change={summary.expensesGrowth}
          changeLabel="vs. período anterior"
          icon={<TrendingDown className="h-4 w-4" />}
          color="red"
        />
        
        <MetricCard
          title="Margem de Lucro"
          value={`${summary.totalIncome > 0 
            ? ((summary.totalBalance / summary.totalIncome) * 100).toFixed(1) 
            : '0.0'}%`}
          change={summary.balanceGrowth}
          changeLabel="vs. período anterior"
          icon={<BarChart3 className="h-4 w-4" />}
          color="purple"
        />
      </div>

      {/* Card de Análise de Gastos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Análise de Gastos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Percentual de despesas em relação às receitas
              </p>
            </div>
            <div className={`rounded-full p-3 ${
              expenseRatio > 90 ? 'bg-red-100 dark:bg-red-900/20' :
              expenseRatio > 70 ? 'bg-orange-100 dark:bg-orange-900/20' :
              'bg-green-100 dark:bg-green-900/20'
            }`}>
              <PiggyBank className={`h-5 w-5 ${
                expenseRatio > 90 ? 'text-red-600 dark:text-red-400' :
                expenseRatio > 70 ? 'text-orange-600 dark:text-orange-400' :
                'text-green-600 dark:text-green-400'
              }`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Despesas / Receitas</span>
              <span className="font-medium">{expenseRatio.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(expenseRatio, 100)} 
              className={`h-2 ${
                expenseRatio > 90 ? '[&>div]:bg-red-500' :
                expenseRatio > 70 ? '[&>div]:bg-orange-500' :
                '[&>div]:bg-green-500'
              }`}
            />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Excelente</p>
                <p className="text-xs font-medium text-green-600 dark:text-green-400">≤ 70%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Atenção</p>
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400">70-90%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Crítico</p>
                <p className="text-xs font-medium text-red-600 dark:text-red-400">&gt; 90%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}