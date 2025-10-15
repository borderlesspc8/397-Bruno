import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useDashboardTransactions } from "@/app/_hooks/transaction";

interface ExpenseCategoriesProps {
  month: number;
  year: number;
}

export function ExpenseCategories({ month, year }: ExpenseCategoriesProps) {
  const { expensesByCategory, formatCurrency } = useDashboardTransactions(month, year);

  // Se não houver dados, retorna null
  if (!expensesByCategory || expensesByCategory.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expensesByCategory.slice(0, 5).map((category) => (
            <div key={category.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm font-medium">{category.category}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold">
                  {formatCurrency(category.amount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {category.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
          
          {expensesByCategory.length > 5 && (
            <Link href="/reports/categories" className="inline-block w-full">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2 text-xs"
              >
                Ver todas as categorias
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
