import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { formatCurrency, formatPercentage } from "@/app/_lib/formatters";
import { PieChart, BarChart, TrendingUp } from "lucide-react";
import { Doughnut, Bar } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from "chart.js";

// Registra os componentes do Chart.js
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

interface CategorySpending {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

interface BudgetCategoryBreakdownProps {
  categorySpending: CategorySpending[];
  totalSpent: number;
}

export function BudgetCategoryBreakdown({ categorySpending, totalSpent }: BudgetCategoryBreakdownProps) {
  // Ordenar categorias por valor gasto (maior para menor)
  const sortedCategories = [...categorySpending].sort((a, b) => b.amount - a.amount);
  
  // Preparar dados para o gráfico de pizza
  const doughnutData = {
    labels: sortedCategories.map(item => item.category),
    datasets: [
      {
        data: sortedCategories.map(item => item.amount),
        backgroundColor: sortedCategories.map(item => item.color),
        borderColor: sortedCategories.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  // Preparar dados para o gráfico de barras
  const barData = {
    labels: sortedCategories.map(item => item.category),
    datasets: [
      {
        label: 'Gastos por Categoria',
        data: sortedCategories.map(item => item.amount),
        backgroundColor: sortedCategories.map(item => item.color),
        borderColor: sortedCategories.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  // Opções para gráficos
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        align: 'center' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw;
            const percentage = (value / totalSpent * 100).toFixed(1);
            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const percentage = (value / totalSpent * 100).toFixed(1);
            return `${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Gastos por Categoria</CardTitle>
            <CardDescription>
              Análise da distribuição de gastos por categoria
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="pie">
              <PieChart className="mr-2 h-4 w-4" />
              Gráfico Pizza
            </TabsTrigger>
            <TabsTrigger value="bar">
              <BarChart className="mr-2 h-4 w-4" />
              Gráfico Barras
            </TabsTrigger>
          </TabsList>
          <TabsContent value="pie" className="space-y-4">
            <div className="h-[300px]">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </TabsContent>
          <TabsContent value="bar" className="space-y-4">
            <div className="h-[300px]">
              <Bar data={barData} options={barOptions} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-medium">Detalhamento por Categoria</h4>
          <div className="space-y-1">
            {sortedCategories.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between rounded-md p-2 hover:bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium">{item.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {formatPercentage(item.percentage)}
                  </span>
                  <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 