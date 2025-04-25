import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { formatCurrency } from "@/app/_lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PiggyBank, CalendarIcon, ArrowLeft, Edit, BarChart } from "lucide-react";
import Link from "next/link";

interface Budget {
  id: string;
  title: string;
  description?: string;
  amount: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | string;
  startDate?: Date | null;
  endDate?: Date | null;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
  wallet?: {
    id: string;
    name: string;
  } | null;
  colorAccent: string;
  iconName: string;
  spent?: number;
  remaining?: number;
  progress?: number;
}

interface BudgetDetailsProps {
  budget: Budget;
}

export function BudgetDetails({ budget }: BudgetDetailsProps) {
  // Função para formatar o período
  const formatPeriod = (period: string) => {
    const periods: Record<string, string> = {
      DAILY: "Diário",
      WEEKLY: "Semanal",
      MONTHLY: "Mensal",
      YEARLY: "Anual",
    };
    
    return periods[period] || period;
  };
  
  // Função para formatar data
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Não definido";
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/budgets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para orçamentos
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/budgets/${budget.id}/report`}>
              <BarChart className="mr-2 h-4 w-4" />
              Relatório
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/budgets/${budget.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader
          className="flex flex-row items-start justify-between pb-2"
          style={{ borderBottom: `2px solid ${budget.colorAccent}` }}
        >
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{budget.title}</CardTitle>
              <Badge variant="outline" className="ml-2">
                {formatPeriod(budget.period)}
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {budget.description || `Orçamento ${formatPeriod(budget.period).toLowerCase()}`}
            </CardDescription>
          </div>
          <PiggyBank 
            className="h-8 w-8" 
            style={{ color: budget.colorAccent }} 
          />
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Orçamento total
              </div>
              <div className="mt-1 text-2xl font-bold">
                {formatCurrency(budget.amount)}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Gasto atual
              </div>
              <div className="mt-1 text-2xl font-bold text-primary-foreground">
                <span className="space-x-1 text-nowrap">
                  <span className="text-xl font-semibold">
                    {formatCurrency(budget.spent || 0)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    de {formatCurrency(budget.amount)}
                  </span>
                </span>
                <div className="flex items-center space-x-2 text-nowrap">
                  <span className="text-sm text-muted-foreground">
                    Disponível:
                  </span>
                  <span className="text-sm font-medium text-green-500">
                    {formatCurrency(budget.remaining || 0)}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium text-muted-foreground">
                Restante
              </div>
              <div 
                className={`mt-1 text-2xl font-bold ${
                  (budget.remaining || 0) >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(budget.remaining || 0)}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <span 
                className={`text-sm font-medium ${
                  (budget.progress || 0) > 90 ? "text-red-600" : "text-muted-foreground"
                }`}
              >
                {(budget.progress || 0).toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={budget.progress || 0} 
              className="h-3" 
              style={{ 
                backgroundColor: `${budget.colorAccent}20`,
                "--tw-progress-fill": budget.colorAccent,
                ...(budget.progress && budget.progress > 100 ? { backgroundColor: "rgb(239 68 68 / 0.2)" } : {})
              } as React.CSSProperties} 
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{(budget.progress || 0).toFixed(0)}% utilizado</span>
              <span>100%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium">Detalhes do orçamento</h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Categoria</span>
                  <span className="text-sm font-medium">
                    {budget.category ? (
                      <Badge 
                        variant="outline" 
                        style={{ 
                          backgroundColor: `${budget.category.color}20`,
                          color: budget.category.color,
                          borderColor: budget.category.color,
                        }}
                      >
                        {budget.category.name}
                      </Badge>
                    ) : (
                      "Todas as categorias"
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Carteira</span>
                  <span className="text-sm font-medium">{budget.wallet?.name || "Não definida"}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Período do orçamento</h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    <CalendarIcon className="mr-1 inline-block h-4 w-4" />
                    Data de início
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(budget.startDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    <CalendarIcon className="mr-1 inline-block h-4 w-4" />
                    Data de término
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(budget.endDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 