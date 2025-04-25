import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useDashboardTransactions } from "@/app/_hooks/transaction";

interface RecentTransactionsProps {
  month: number;
  year: number;
}

export function RecentTransactions({ month, year }: RecentTransactionsProps) {
  const { recentTransactions, formatCurrency } = useDashboardTransactions(month, year);

  // Se não houver dados, retorna null
  if (!recentTransactions || recentTransactions.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTransactions.map((transaction) => (
            <Link 
              href={`/transactions/${transaction.id}`} 
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium">{transaction.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <span className={`font-semibold ${transaction.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Number(transaction.amount))}
              </span>
            </Link>
          ))}
          
          <Link href="/transactions" className="inline-block w-full">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 text-xs"
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