import { useDashboardTransactions } from "@/app/_hooks/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/app/_lib/formatters";
import { getCategoryColor } from "./utils";

interface ExpenseCategoriesProps {
  month: number;
  year: number;
}

interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
}

interface PieChartData {
  name: string;
  value: number;
  color: string;
}

export function ExpenseCategories({ month, year }: ExpenseCategoriesProps) {
  const { expensesByCategory, loading, formatCurrency } = useDashboardTransactions(month, year);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-md font-medium">Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-muted/20 border-t-primary/40 animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Verificar se temos dados de categorias para exibir
  const hasData = expensesByCategory && expensesByCategory.length > 0;
  
  // Preparar dados para o gráfico de pizza
  const pieData: PieChartData[] = hasData 
    ? expensesByCategory
      // Limitar a 6 categorias para o gráfico não ficar poluído
      .slice(0, 6)
      .map((category: CategoryExpense) => ({
        name: category.category,
        value: category.amount,
        // Usar a função de cor do utils para garantir consistência
        color: getCategoryColor(category.category)
      }))
    : [];
  
  // Calcular total para mostrar no centro do gráfico
  const totalExpenses: number = hasData 
    ? expensesByCategory.reduce((acc: number, curr: CategoryExpense) => acc + curr.amount, 0)
    : 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md font-medium">Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center p-6 h-[230px]">
            <p className="text-muted-foreground text-sm">
              Sem dados para exibir neste período
            </p>
          </div>
        ) : (
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={1}
                  stroke="hsl(var(--card))"
                >
                  {pieData.map((entry: PieChartData, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), "Valor"]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid #faba33',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        )}
        
        {/* Legenda do gráfico */}
        {hasData && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {pieData.map((category: PieChartData) => (
              <div key={category.name} className="flex items-center gap-2 text-xs">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                ></div>
                <div className="flex-1 truncate">{category.name}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 
