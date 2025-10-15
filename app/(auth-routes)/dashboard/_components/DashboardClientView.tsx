"use client";

import { useEffect, useState } from "react";
import { useDashboardTransactions } from "@/app/_hooks/transaction";
import { Badge } from "@/app/_components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { 
  Sparkles, 
  PiggyBank,
} from "lucide-react";
import { BasicMetrics } from "./BasicMetrics";
import { ExpenseCategories } from "./ExpenseCategories";
import { RecentTransactions } from "./RecentTransactions";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import DashboardTimeSelect from "./DashboardTimeSelect";
import { dashboardColors } from "./utils";

interface DashboardClientViewProps {
  month: number;
  year: number;
  userName: string;
  isPremium: boolean;
}

export function DashboardClientView({ 
  month, 
  year,
  userName,
  isPremium
}: DashboardClientViewProps) {
  // Logging dos parâmetros recebidos para diagnóstico
  console.log(`[DashboardClientView] Renderizando para mês=${month}, ano=${year}`);
  
  const { 
    period,
    filteredTransactions,
    totalIncome,
    totalExpenses,
    formatCurrency,
    loading,
    error
  } = useDashboardTransactions(month, year);

  // Log do estado do hook para diagnóstico
  console.log(`[DashboardClientView] Hook retornou: loading=${loading}, error=${error}, transactions=${filteredTransactions?.length || 0}`);
  console.log(`[DashboardClientView] Períodos - hook: ${period?.month}/${period?.year}, props: ${month}/${year}`);
  
  // Verificar se estamos carregando
  if (loading) {
    return (
      <div className="flex-1 space-y-4 pb-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between gap-3 bg-gradient-to-br from-card/60 to-background rounded-lg p-4 shadow-sm border">
          <div className="space-y-1">
            <div className="h-7 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-5 w-64 bg-muted animate-pulse rounded opacity-70"></div>
          </div>
        </div>
        
        {/* Placeholders para métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card animate-pulse h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Verificar se temos um erro
  if (error) {
    return (
      <div className="flex-1 space-y-4 pb-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full p-3 bg-destructive/10 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium">Erro ao carregar dados</h3>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Verifica se há dados para exibir (deve ser após verificações de loading e error)
  const hasTransactionData = Array.isArray(filteredTransactions) && filteredTransactions.length > 0;
  
  // Logging para diagnóstico
  console.log(`[DashboardClientView] hasTransactionData=${hasTransactionData}, filteredTransactions=`, 
    Array.isArray(filteredTransactions) ? filteredTransactions.slice(0, 2) : null);
  
  // Formatação do período para exibição
  const formattedPeriod = period?.formatted || `${month}/${year}`;

  return (
    <div className="flex-1 space-y-4 pb-8 max-w-7xl mx-auto">
      {/* Cabeçalho do Dashboard com Boas-vindas Personalizadas */}
      <div className="flex flex-col lg:flex-row justify-between gap-3 bg-gradient-to-br from-card/60 to-background rounded-lg p-4 shadow-sm border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Olá, {userName}
            </h1>
            {isPremium && (
              <Badge className="bg-[#faba33] hover:bg-[#eaaa23] text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Aqui está um resumo financeiro para <span className="font-medium capitalize">{formattedPeriod}</span>
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 lg:items-start">
          <DashboardTimeSelect />
        </div>
      </div>

      {/* Métricas Básicas - mostrar sempre, mesmo sem dados detalhados */}
      <BasicMetrics month={month} year={year} />
      
      {/* Exibe mensagem quando não há dados */}
      {!hasTransactionData && (
        <Card className="p-8 text-center">
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="rounded-full p-3 bg-muted">
                <PiggyBank className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Sem dados financeiros</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Parece que você ainda não possui transações registradas para este período.
                Adicione transações para visualizar seus dados financeiros.
              </p>
              <Link href="/transactions/new" className="mt-3">
                <Button>
                  Adicionar Transação
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Grid para categorias e transações recentes */}
      {hasTransactionData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ExpenseCategories month={month} year={year} />
          <RecentTransactions month={month} year={year} />
        </div>
      )}
      
      {/* Dica financeira - mostrar sempre */}
      <Card className="border-none overflow-hidden group hover:shadow-md transition-all duration-300 relative bg-gradient-to-r from-[#faba33]/5 via-background to-[#faba33]/5">
        <CardHeader className="pb-2 pt-4 relative z-10">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#faba33]" />
            Dica Financeira
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 relative z-10">
          <blockquote className="text-sm italic text-muted-foreground border-l-2 border-[#faba33]/20 pl-3">
            "Reserve de 10% a 15% da sua renda para emergências. Tente manter um fundo que cubra pelo menos 3 a 6 meses de despesas básicas."
          </blockquote>
        </CardContent>
      </Card>
    </div>
  );
} 
