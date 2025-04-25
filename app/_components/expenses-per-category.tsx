"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

interface CategoryExpense {
  id: string;
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

interface ExpensesPerCategoryProps {
  data: CategoryExpense[];
  totalExpenses: number;
}

export default function ExpensesPerCategory({ data = [], totalExpenses }: ExpensesPerCategoryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Verificar se data é undefined ou vazio
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
          <CardDescription>
            Análise detalhada de suas despesas por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Sem dados para exibir
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Ordenar os dados por valor (maior para menor)
  const sortedData = [...data].sort((a, b) => b.amount - a.amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>
          Análise detalhada de suas despesas por categoria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedData.map((category) => (
            <div key={category.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="text-sm">
                  {formatCurrency(category.amount)} ({category.percentage.toFixed(1)}%)
                </div>
              </div>
              <Progress 
                value={category.percentage} 
                className="h-2" 
                style={{ 
                  "--progress-foreground": category.color 
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 