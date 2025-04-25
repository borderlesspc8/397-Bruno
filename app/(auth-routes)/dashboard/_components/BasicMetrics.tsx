import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Progress } from "@/app/_components/ui/progress";
import { 
  ArrowDownUp, 
  LineChart, 
  PlusCircle, 
  TrendingUp 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDashboardTransactions } from "@/app/_hooks/transaction";
import { dashboardColors, getProgressColor, getProgressBadgeStyle } from "./utils";

interface BasicMetricsProps {
  month: number;
  year: number;
}

export function BasicMetrics({ month, year }: BasicMetricsProps) {
  console.log(`[BasicMetrics] Renderizando para mês=${month}, ano=${year}`);
  
  const { 
    totalIncome,
    totalExpenses,
    balance,
    incomeCount,
    expenseCount,
    formatCurrency,
    loading,
    error,
    period
  } = useDashboardTransactions(month, year);

  // Log dos valores obtidos do hook
  console.log(`[BasicMetrics] Receitas=${totalIncome}, Despesas=${totalExpenses}, Saldo=${balance}`);
  console.log(`[BasicMetrics] Loading=${loading}, Error=${error ? 'Sim' : 'Não'}`);

  // Estado para controlar a animação da barra de progresso
  const [expenseProgress, setExpenseProgress] = useState(0);

  // Efeito para animar a barra de progresso
  useEffect(() => {
    const calculatedProgress = totalIncome > 0 
      ? Math.min(Math.round((totalExpenses / totalIncome) * 100), 100)
      : 0;
    
    // Define um timeout para animar a barra
    const timeout = setTimeout(() => {
      setExpenseProgress(calculatedProgress);
    }, 300);

    return () => clearTimeout(timeout);
  }, [totalIncome, totalExpenses]);

  // Se estiver carregando, mostrar placeholders
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card animate-pulse h-32 rounded-lg shadow-sm"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Cards de resumo com dados das transações */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-none relative">
          <div className={`absolute inset-0 bg-gradient-to-br ${dashboardColors.income.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <div className={`rounded-full p-1.5 ${dashboardColors.income.iconBg} ${dashboardColors.income.icon}`}>
              <PlusCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <div className={`text-2xl font-bold ${dashboardColors.income.text}`}>
              {formatCurrency(totalIncome)}
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                {incomeCount} {incomeCount === 1 ? 'entrada' : 'entradas'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-none relative">
          <div className={`absolute inset-0 bg-gradient-to-br ${dashboardColors.expense.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <div className={`rounded-full p-1.5 ${dashboardColors.expense.iconBg} ${dashboardColors.expense.icon}`}>
              <ArrowDownUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <div className={`text-2xl font-bold ${dashboardColors.expense.text}`}>
              {formatCurrency(totalExpenses)}
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                {expenseCount} {expenseCount === 1 ? 'saída' : 'saídas'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden group hover:shadow-md transition-all duration-300 border-none relative">
          <div className={`absolute inset-0 bg-gradient-to-br ${dashboardColors.balance.gradient} opacity-60 group-hover:opacity-100 transition-opacity`}></div>
          <CardHeader className="relative z-10 flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <div className={`rounded-full p-1.5 ${dashboardColors.balance.iconBg} ${dashboardColors.balance.icon}`}>
              <LineChart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10 pt-0">
            <div className={`text-2xl font-bold ${balance >= 0 ? dashboardColors.balance.text : dashboardColors.expense.text}`}>
              {formatCurrency(balance)}
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Barra de progresso de gastos (só exibir se houver receitas ou despesas) */}
      {totalIncome > 0 && totalExpenses > 0 && (
        <Card className="p-4 border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60 group-hover:opacity-100 transition-opacity"></div>
          <div className="space-y-2 relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Progresso de Gastos do Mês</p>
                <Badge 
                  variant="outline" 
                  className={`text-xs font-normal ${getProgressBadgeStyle(expenseProgress)}`}
                >
                  {expenseProgress}% utilizado
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(totalExpenses)} de {formatCurrency(totalIncome)}
              </div>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full ${getProgressColor(expenseProgress)}`} 
                style={{ width: `${expenseProgress}%`, transition: "width 1s ease-in-out" }}
              ></div>
            </div>
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground">
                {expenseProgress < 50 
                  ? 'Seus gastos estão sob controle.' 
                  : expenseProgress < 80 
                    ? 'Monitore seus gastos com atenção.' 
                    : 'Alerta: Gastos excedendo receitas!'}
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
} 