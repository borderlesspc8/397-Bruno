"use client";

import { ArrowDown, ArrowUp, ExternalLink, Clock, X, Loader2 } from "lucide-react";
import { cn } from "../_lib/utils";
import Link from "next/link";
import { Button } from "./ui/button";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransactionDetails } from "./transaction-details";
import { useTransactionContext } from "../_hooks/transaction";
import { useMemo } from "react";
import { Transaction as TransactionType, TransactionType as TType } from "@/app/_types/transaction";

interface LastTransactionsProps {
  limit?: number;
  showViewMore?: boolean;
  emptyStateMessage?: string;
  walletId?: string;
}

export default function LastTransactions({
  limit = 5,
  showViewMore = true,
  emptyStateMessage = "Nenhuma transação recente encontrada",
  walletId
}: LastTransactionsProps) {
  // Usar o contexto de transações
  const { recentTransactions, isLoading, error } = useTransactionContext();
  
  // Filtrar transações por carteira se necessário
  const filteredTransactions = useMemo(() => {
    if (!walletId) return recentTransactions;
    return recentTransactions.filter(transaction => transaction.walletId === walletId);
  }, [recentTransactions, walletId]);
  
  // Formatar data de forma relativa
  const formatDate = (date: Date) => {
    if (isToday(date)) {
      return "Hoje";
    }
    
    if (isYesterday(date)) {
      return "Ontem";
    }
    
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };
  
  // Formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 p-2 rounded-md animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/5"></div>
            </div>
            <div className="h-5 bg-muted rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }
  
  // Se houver um erro
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="text-destructive mb-2">
          <X className="h-10 w-10 mx-auto" />
        </div>
        <p className="text-muted-foreground">Erro ao carregar transações</p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }
  
  // Se não há transações
  if (filteredTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <X className="h-12 w-12 text-muted-foreground mb-2 opacity-20" />
        <p className="text-muted-foreground">{emptyStateMessage}</p>
      </div>
    );
  }
  
  // Filtrar e limitar as transações
  const displayedTransactions = filteredTransactions.slice(0, limit);
  
  return (
    <div className="space-y-1 p-0">
      {displayedTransactions.map((transaction) => (
        <div 
          key={transaction.id} 
          className="group flex items-center hover:bg-muted/50 p-3 transition-colors duration-200 relative"
        >
          {/* Ícone */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white",
            transaction.type === TType.INCOME || transaction.type === TType.DEPOSIT
              ? "bg-gradient-to-br from-emerald-400 to-emerald-600" 
              : "bg-gradient-to-br from-red-400 to-red-600"
          )}>
            {transaction.type === TType.INCOME || transaction.type === TType.DEPOSIT ? (
              <ArrowUp className="h-5 w-5" />
            ) : (
              <ArrowDown className="h-5 w-5" />
            )}
          </div>
          
          {/* Informações da transação */}
          <div className="ml-4 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{transaction.name}</p>
                <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                  <Clock className="mr-1 h-3 w-3" />
                  <span>{formatDate(transaction.date)}</span>
                  
                  {transaction.category && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{transaction.category}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className={cn(
                "text-sm font-medium",
                transaction.type === TType.INCOME || transaction.type === TType.DEPOSIT 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {transaction.type === TType.INCOME || transaction.type === TType.DEPOSIT ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          </div>
          
          {/* Detalhes em hover */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      
      {showViewMore && filteredTransactions.length > limit && (
        <div className="p-3 border-t">
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
              Ver todas as transações ({filteredTransactions.length})
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
} 