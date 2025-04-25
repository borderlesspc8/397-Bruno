import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { formatCurrency } from "@/app/_lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Receipt, ExternalLink, ArrowDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/app/_components/ui/badge";
import { Budget, Transaction } from "@/app/_lib/types";

interface BudgetTransactionsProps {
  budget: Budget;
  transactions: Transaction[];
}

export function BudgetTransactions({ budget, transactions }: BudgetTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Transações Recentes</CardTitle>
          <CardDescription>
            As últimas transações relacionadas a este orçamento
          </CardDescription>
        </div>
        <Receipt className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Receipt className="mb-2 h-10 w-10 text-muted-foreground/60" />
            <p className="mb-1 text-sm font-medium">
              Não há transações para este orçamento
            </p>
            <p className="text-xs text-muted-foreground">
              As transações serão mostradas aqui à medida que você as registrar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: transaction.categoryObj
                        ? `${transaction.categoryObj.color}20`
                        : "#e2e8f0",
                      color: transaction.categoryObj
                        ? transaction.categoryObj.color
                        : "#64748b",
                    }}
                  >
                    <ArrowDown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{transaction.name || transaction.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(transaction.date), "PPP", { locale: ptBR })}
                      </span>
                      {transaction.categoryObj && (
                        <>
                          <span>•</span>
                          <Badge
                            variant="outline"
                            style={{
                              backgroundColor: `${transaction.categoryObj.color}10`,
                              color: transaction.categoryObj.color,
                              borderColor: `${transaction.categoryObj.color}30`,
                            }}
                            className="text-[10px] h-4 px-1.5"
                          >
                            {transaction.categoryObj.name}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-right font-medium text-red-600">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    asChild
                  >
                    <Link href={`/transactions/${transaction.id}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-center pt-2">
              <Button variant="outline" asChild>
                <Link href={`/transactions?budgetId=${budget.id}`}>
                  Ver todas as transações
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 