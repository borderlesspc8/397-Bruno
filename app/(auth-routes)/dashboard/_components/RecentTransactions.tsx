import { useDashboardTransactions } from "@/app/_hooks/transaction";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getCategoryColor, dashboardColors } from "./utils";

interface RecentTransactionsProps {
  month: number;
  year: number;
}

export function RecentTransactions({ month, year }: RecentTransactionsProps) {
  const { recentTransactions, formatCurrency } = useDashboardTransactions(month, year);
  
  // Se não houver transações recentes, não renderiza o componente
  if (!recentTransactions || recentTransactions.length === 0) {
    return null;
  }
  
  // Função para formatar a data
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('pt-BR');
  };
  
  // Função para obter o ícone correto baseado no tipo da transação
  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'income':
      case 'deposit':
      case 'receita':
        return <ArrowUpRight className={`h-4 w-4 ${dashboardColors.income.text}`} />;
      case 'expense':
      case 'expense':
      case 'despesa':
        return <ArrowDownRight className={`h-4 w-4 ${dashboardColors.expense.text}`} />;
      case 'investment':
      case 'investimento':
        return <ArrowDownRight className={`h-4 w-4 ${dashboardColors.investment.text}`} />;
      case 'transfer':
      case 'transferencia':
      case 'transferência':
        return <ArrowDownRight className={`h-4 w-4 ${dashboardColors.transfer.text}`} />;
      default:
        return <ArrowDownRight className={`h-4 w-4 ${dashboardColors.expense.text}`} />;
    }
  };
  
  // Função para obter a classe de cor baseada no tipo da transação
  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('income') || lowerType.includes('deposit') || lowerType.includes('receita')) {
      return dashboardColors.income.text;
    } else if (lowerType.includes('expense') || lowerType.includes('despesa')) {
      return dashboardColors.expense.text;
    } else if (lowerType.includes('investment') || lowerType.includes('investimento')) {
      return dashboardColors.investment.text;
    } else if (lowerType.includes('transfer') || lowerType.includes('transferencia') || lowerType.includes('transferência')) {
      return dashboardColors.transfer.text;
    }
    return dashboardColors.expense.text;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md font-medium">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="flex items-center">
              <div className="mr-4 rounded-full p-2" style={{ 
                backgroundColor: transaction.category 
                  ? `${getCategoryColor(transaction.category)}20` 
                  : '#94a3b820' 
              }}>
                {getTransactionIcon(transaction.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none line-clamp-1">
                  {transaction.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.category || 'Sem categoria'} • {formatDate(transaction.date)}
                </p>
              </div>
              <div className={`font-medium ${getTypeColor(transaction.type)}`}>
                {transaction.type.toLowerCase().includes('income') || 
                 transaction.type.toLowerCase().includes('deposit') || 
                 transaction.type.toLowerCase().includes('receita') 
                   ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
          
          <Link href="/transactions" className="inline-block w-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
            >
              Ver todas as transações
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 