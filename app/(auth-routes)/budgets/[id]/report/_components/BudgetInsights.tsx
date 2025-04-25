import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/app/_components/ui/card";
import { formatCurrency, formatPercentage } from "@/app/_lib/formatters";
import { 
  AlertTriangle, 
  ArrowDownIcon, 
  ArrowUpIcon, 
  CalendarDays, 
  LightbulbIcon, 
  TrendingDown, 
  TrendingUp 
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  description?: string | null;
  date: Date;
  category: {
    name: string;
    color: string;
  };
}

interface Budget {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  spent: number;
  remaining: number;
  progress: number;
  period: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetInsightsProps {
  budget: Budget;
  transactions: Transaction[];
}

export function BudgetInsights({ budget, transactions }: BudgetInsightsProps) {
  // Função para gerar insights baseados nos dados
  const generateInsights = () => {
    const insights = [];
    
    // Verificar progresso do orçamento
    if (budget.progress > 90) {
      insights.push({
        type: "warning",
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        title: "Orçamento quase esgotado",
        description: `Você já usou ${formatPercentage(budget.progress)} do orçamento. Considere reduzir gastos nas próximas semanas.`
      });
    } else if (budget.progress > 75) {
      insights.push({
        type: "caution",
        icon: <TrendingUp className="h-5 w-5 text-amber-500" />,
        title: "Atenção ao ritmo de gastos",
        description: `Seus gastos estão acelerando e já atingiram ${formatPercentage(budget.progress)} do orçamento.`
      });
    } else if (budget.progress < 30 && transactions.length > 3) {
      insights.push({
        type: "positive",
        icon: <TrendingDown className="h-5 w-5 text-green-500" />,
        title: "Gastos controlados",
        description: `Excelente! Você só utilizou ${formatPercentage(budget.progress)} do orçamento até agora.`
      });
    }
    
    // Identificar padrões de gastos
    if (transactions.length > 0) {
      // Ordenar transações por data (mais recente primeiro)
      const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Verificar se houve transação grande (mais de 20% do orçamento)
      const largeTransactions = transactions.filter(t => (t.amount / budget.amount) > 0.2);
      if (largeTransactions.length > 0) {
        insights.push({
          type: "info",
          icon: <ArrowUpIcon className="h-5 w-5 text-blue-500" />,
          title: "Transações significativas",
          description: `Você tem ${largeTransactions.length} transação(ões) que representam mais de 20% do seu orçamento total.`
        });
      }
      
      // Verificar frequência de transações
      const daysWithTransactions = new Set(
        transactions.map(t => new Date(t.date).toLocaleDateString())
      ).size;
      
      const totalDays = transactions.length > 0 ? 
        Math.max(
          1, 
          Math.ceil(
            (new Date(sortedTransactions[0].date).getTime() - 
             new Date(sortedTransactions[sortedTransactions.length - 1].date).getTime()) / 
            (1000 * 60 * 60 * 24)
          )
        ) : 1;
      
      const transactionsPerDay = transactions.length / Math.max(totalDays, 1);
      
      if (transactionsPerDay > 2) {
        insights.push({
          type: "info",
          icon: <CalendarDays className="h-5 w-5 text-blue-500" />,
          title: "Alta frequência de gastos",
          description: `Você realizou em média ${transactionsPerDay.toFixed(1)} transações por dia neste orçamento.`
        });
      }
    }
    
    // Recomendações baseadas no progresso
    if (budget.progress > 50 && budget.remaining > 0) {
      insights.push({
        type: "tip",
        icon: <LightbulbIcon className="h-5 w-5 text-yellow-500" />,
        title: "Dica de economia",
        description: `Você ainda tem ${formatCurrency(budget.remaining)} disponíveis. Planeje cuidadosamente o uso desse valor.`
      });
    }
    
    // Se não tiver insights suficientes, adicione um genérico
    if (insights.length === 0) {
      insights.push({
        type: "info",
        icon: <LightbulbIcon className="h-5 w-5 text-blue-500" />,
        title: "Sem dados suficientes",
        description: "Continue usando este orçamento para obter insights personalizados sobre seus gastos."
      });
    }
    
    return insights;
  };
  
  const insights = generateInsights();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Análise e Recomendações</CardTitle>
            <CardDescription>
              Insights baseados no seu padrão de gastos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div 
              key={index} 
              className={`flex gap-4 rounded-lg border p-4 ${
                insight.type === "warning" ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30" :
                insight.type === "positive" ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30" :
                insight.type === "tip" ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30" :
                "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
              }`}
            >
              <div className="mt-0.5">{insight.icon}</div>
              <div>
                <h4 className="font-medium">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 rounded-lg border border-dashed p-4">
          <h4 className="mb-2 font-medium">Nota</h4>
          <p className="text-sm text-muted-foreground">
            Os insights são gerados com base no seu histórico de transações e padrões de gastos.
            Quanto mais você usar este orçamento, mais precisas serão nossas recomendações.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 