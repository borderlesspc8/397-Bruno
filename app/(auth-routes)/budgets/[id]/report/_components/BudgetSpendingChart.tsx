import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { formatCurrency } from "@/app/_lib/formatters";
import { BarChart, DollarSign, LineChart, TrendingUp } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Registra os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DailySpending {
  date: string;
  amount: number;
}

interface BudgetSpendingChartProps {
  dailySpending: DailySpending[];
  totalSpent: number;
}

export function BudgetSpendingChart({ dailySpending, totalSpent }: BudgetSpendingChartProps) {
  // Preparar dados para o gráfico
  const dates = dailySpending.map(item => item.date);
  const amounts = dailySpending.map(item => item.amount);

  // Configuração comum para ambos os gráficos
  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Gastos por Dia',
        data: amounts,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Opções para gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            return `${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  // Calcular estatísticas
  const calculateStats = () => {
    if (dailySpending.length === 0) return { max: 0, min: 0, avg: 0 };
    
    const max = Math.max(...amounts);
    const min = Math.min(...amounts);
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    
    return { max, min, avg };
  };

  const stats = calculateStats();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Padrão de Gastos</CardTitle>
            <CardDescription>
              Visualização dos gastos ao longo do período
            </CardDescription>
          </div>
          <div className="rounded-md bg-primary/10 p-1.5 text-primary">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="line">
              <LineChart className="mr-2 h-4 w-4" />
              Gráfico de Linha
            </TabsTrigger>
            <TabsTrigger value="bar">
              <BarChart className="mr-2 h-4 w-4" />
              Gráfico de Barras
            </TabsTrigger>
          </TabsList>
          <TabsContent value="line" className="space-y-4">
            <div className="h-[300px]">
              <Line data={chartData} options={chartOptions} />
            </div>
          </TabsContent>
          <TabsContent value="bar" className="space-y-4">
            <div className="h-[300px]">
              <Bar 
                data={{
                  ...chartData,
                  datasets: [{
                    ...chartData.datasets[0],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                  }]
                }} 
                options={chartOptions} 
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Maior Gasto</span>
            <span className="text-lg font-bold">{formatCurrency(stats.max)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Menor Gasto</span>
            <span className="text-lg font-bold">{formatCurrency(stats.min)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Média Diária</span>
            <span className="text-lg font-bold">{formatCurrency(stats.avg)}</span>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2 rounded-md border border-dashed p-3">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Total gasto no período: <span className="font-medium">{formatCurrency(totalSpent)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 