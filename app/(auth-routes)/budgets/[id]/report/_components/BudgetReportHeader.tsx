import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Progress } from "@/app/_components/ui/progress";
import { Badge } from "@/app/_components/ui/badge";
import { formatCurrency } from "@/app/_lib/formatters";
import { PiggyBank, ArrowLeft, PrinterIcon, Download, Share2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Budget {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  period: string;
  startDate: Date | null;
  endDate: Date | null;
  spent: number;
  remaining: number;
  progress: number;
  colorAccent: string;
  category: {
    id: string;
    name: string;
    color: string;
  } | null;
  wallet?: {
    id: string;
    name: string;
  } | null;
}

interface BudgetReportHeaderProps {
  budget: Budget;
}

export function BudgetReportHeader({ budget }: BudgetReportHeaderProps) {
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
  const formatDate = (date: Date | null) => {
    if (!date) return "Não definido";
    return format(date, "PPP", { locale: ptBR });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link href={`/budgets/${budget.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para detalhes
            </Link>
          </Button>
          <h1 className="text-2xl font-bold leading-tight md:text-3xl">
            Relatório: {budget.title}
          </h1>
          <p className="text-muted-foreground">
            Período: {budget.startDate && budget.endDate 
              ? `${formatDate(budget.startDate)} a ${formatDate(budget.endDate)}`
              : formatPeriod(budget.period)
            }
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            <PrinterIcon className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button size="sm" variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">Resumo do Orçamento</CardTitle>
            <Badge variant="outline">
              {formatPeriod(budget.period)}
            </Badge>
            {budget.category && (
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
            )}
          </div>
          <CardDescription>
            {budget.description || `Acompanhamento do orçamento ${formatPeriod(budget.period).toLowerCase()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Orçamento</span>
              <span className="text-xl font-bold">{formatCurrency(budget.amount)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Gasto</span>
              <span className="text-xl font-bold text-primary-foreground">
                {formatCurrency(budget.spent)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Restante</span>
              <span 
                className={`text-xl font-bold ${
                  budget.remaining >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(budget.remaining)}
              </span>
            </div>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Progresso</span>
            <span 
              className={`text-sm font-medium ${
                budget.progress > 90 ? "text-red-600" : 
                budget.progress > 75 ? "text-amber-600" : "text-muted-foreground"
              }`}
            >
              {budget.progress.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={budget.progress} 
            className="h-3" 
            style={{ 
              backgroundColor: `${budget.colorAccent}20`,
              "--tw-progress-fill": budget.colorAccent
            } as React.CSSProperties} 
          />

          <div className="rounded-lg p-4 bg-muted/20">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Carteira</span>
                <span className="text-sm font-medium">
                  {budget.wallet?.name || "Carteira não definida"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 