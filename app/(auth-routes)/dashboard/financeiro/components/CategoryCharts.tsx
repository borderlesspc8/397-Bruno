"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Badge } from "@/app/_components/ui/badge";
import { CategoryData } from "../types";
import dynamic from 'next/dynamic';

// Importação dinâmica para evitar problemas de SSR
const Doughnut = dynamic(
  () => import('react-chartjs-2').then((mod) => mod.Doughnut),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px] w-[300px] rounded-full mx-auto" />
  }
);

// Registrar os componentes necessários do Chart.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryChartProps {
  title: string;
  data: CategoryData[];
  loading?: boolean;
  showValues?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export function CategoryChart({ 
  title, 
  data, 
  loading = false, 
  showValues = true 
}: CategoryChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-[250px] w-[250px] rounded-full" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 10
      }
    ]
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Usaremos nossa própria legenda personalizada
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw as number;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%', // Cria o efeito donut
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {showValues && (
            <span className="text-lg font-bold text-primary">
              {formatCurrency(total)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Gráfico */}
          <div className="relative h-[250px] w-[250px] flex-shrink-0">
            <Doughnut data={chartData} options={options} />
            {/* Valor total no centro do donut */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(total)}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
          
          {/* Legenda personalizada */}
          <div className="flex-1 space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.percentage.toFixed(1)}% do total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    {formatCurrency(item.value)}
                  </p>
                  {item.trend !== undefined && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs mt-1 ${
                        item.trend >= 0 
                          ? 'text-green-600 border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-900/20'
                          : 'text-red-600 border-red-200 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-900/20'
                      }`}
                    >
                      {item.trend >= 0 ? '+' : ''}{item.trend.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente específico para receitas
export function IncomeCategoryChart({ data, loading }: { data: CategoryData[], loading?: boolean }) {
  return (
    <CategoryChart
      title="Receitas por Categoria"
      data={data}
      loading={loading}
      showValues={true}
    />
  );
}

// Componente específico para despesas
export function ExpenseCategoryChart({ data, loading }: { data: CategoryData[], loading?: boolean }) {
  return (
    <CategoryChart
      title="Despesas por Categoria"
      data={data}
      loading={loading}
      showValues={true}
    />
  );
}