"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Progress } from "@/app/_components/ui/progress";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import Link from "next/link";
import { formatCurrency } from "@/app/_lib/formatters";
import { Skeleton } from "@/app/_components/ui/skeleton";
import React from "react";
import { cn } from "@/app/_lib/utils";
import { Sparkles } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import { getProgressColor, getCategoryColor } from "./utils";

type Budget = {
  id: string;
  title: string;
  amount: number;
  spent: number;
  remaining: number;
  progress: number;
  colorAccent: string;
};

export function BudgetSummary() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuggested, setIsSuggested] = useState(false);
  const [lastMonth, setLastMonth] = useState("");

  useEffect(() => {
    async function loadBudgetSummary() {
      try {
        setIsLoading(true);
        
        // Obter o mês atual formatado para uso nas sugestões
        const date = new Date();
        const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        setLastMonth(currentMonth);
        
        // Tentar carregar orçamentos reais primeiro
        const response = await fetch('/api/budgets');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar os orçamentos');
        }
        
        const data = await response.json();
        
        // Verificar se há orçamentos reais
        if (data && data.length > 0) {
          // Ordenar por porcentagem de uso (do maior para o menor)
          const sortedBudgets = data.sort((a: Budget, b: Budget) => b.progress - a.progress);
          
          // Pegar apenas os 3 principais orçamentos
          setBudgets(sortedBudgets.slice(0, 3));
          setIsSuggested(false);
        } else {
          // Se não houver orçamentos reais, solicitar sugestões da IA com base nas transações
          console.log('Sem orçamentos encontrados, solicitando sugestões da IA');
          await requestAISuggestions(currentMonth);
        }
      } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
        // Em caso de erro, solicitar sugestões da IA
        await requestAISuggestions(lastMonth);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadBudgetSummary();
  }, []);

  // Função para solicitar sugestões de orçamentos baseadas nas transações reais
  async function requestAISuggestions(month: string) {
    try {
      // Primeiro, precisamos obter as transações do usuário
      const transactionsResponse = await fetch(`/api/transactions?month=${month}`);
      
      if (!transactionsResponse.ok) {
        throw new Error('Falha ao carregar transações para análise');
      }
      
      const transactionsData = await transactionsResponse.json();
      
      // Se não houver transações suficientes, não podemos fazer sugestões precisas
      if (!transactionsData.transactions || transactionsData.transactions.length < 5) {
        console.log('Transações insuficientes para sugestões precisas de orçamento');
        generateBasicSuggestions();
        return;
      }
      
      // Agora, solicitar à API de IA para analisar as transações e sugerir orçamentos
      const aiResponse = await fetch('/api/ai/budget-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: transactionsData.transactions,
          month: month
        }),
      });
      
      if (!aiResponse.ok) {
        throw new Error('Falha ao obter sugestões de orçamento da IA');
      }
      
      const suggestionsData = await aiResponse.json();
      
      if (suggestionsData.suggestions && suggestionsData.suggestions.length > 0) {
        // Transformar as sugestões no formato esperado pelo componente
        const formattedSuggestions = suggestionsData.suggestions.map((suggestion: any) => ({
          id: `suggestion-${suggestion.category.toLowerCase().replace(/\s+/g, '-')}`,
          title: suggestion.category,
          amount: suggestion.suggestedAmount,
          spent: suggestion.currentSpent || 0,
          remaining: suggestion.suggestedAmount - (suggestion.currentSpent || 0),
          progress: suggestion.currentSpent ? (suggestion.currentSpent / suggestion.suggestedAmount) * 100 : 0,
          colorAccent: getCategoryColor(suggestion.category),
        }));
        
        setBudgets(formattedSuggestions.slice(0, 3));
        setIsSuggested(true);
      } else {
        generateBasicSuggestions();
      }
    } catch (error) {
      console.error('Erro ao solicitar sugestões de orçamento:', error);
      generateBasicSuggestions();
    }
  }
  
  // Função para gerar sugestões básicas com base em padrões financeiros comuns
  function generateBasicSuggestions() {
    // Categorias comuns de despesas e porcentagens recomendadas do orçamento total
    const commonBudgetCategories = [
      { category: "Alimentação", percentage: 25, colorAccent: getCategoryColor("Alimentação") },
      { category: "Moradia", percentage: 35, colorAccent: getCategoryColor("Moradia") },
      { category: "Transporte", percentage: 15, colorAccent: getCategoryColor("Transporte") },
      { category: "Lazer", percentage: 10, colorAccent: getCategoryColor("Lazer") },
      { category: "Saúde", percentage: 10, colorAccent: getCategoryColor("Saúde") },
      { category: "Outros", percentage: 5, colorAccent: getCategoryColor("Outros") }
    ];
    
    // Renda mensal estimada (valor genérico como exemplo)
    const estimatedIncome = 5000;
    
    // Criar sugestões básicas
    const basicSuggestions = commonBudgetCategories.map(category => ({
      id: `suggestion-${category.category.toLowerCase().replace(/\s+/g, '-')}`,
      title: category.category,
      amount: (estimatedIncome * category.percentage) / 100,
      spent: 0,
      remaining: (estimatedIncome * category.percentage) / 100,
      progress: 0,
      colorAccent: category.colorAccent,
    }));
    
    // Selecionar as três principais categorias
    setBudgets(basicSuggestions.slice(0, 3));
    setIsSuggested(true);
  }

  // Estilização personalizada para o Progress
  const CustomProgress = React.forwardRef<
    React.ElementRef<typeof Progress>,
    React.ComponentPropsWithoutRef<typeof Progress> & { indicatorColor: string }
  >(({ className, value, indicatorColor, ...props }, ref) => (
    <Progress
      ref={ref}
      className={className}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", indicatorColor)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </Progress>
  ));
  CustomProgress.displayName = "CustomProgress";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-md font-medium">Orçamentos</CardTitle>
        <Link href="/budgets">
          <Button variant="ghost" size="sm">Ver tudo</Button>
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading Skeletons
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : budgets.length > 0 ? (
          <div className="space-y-4">
            {isSuggested && (
              <Badge variant="outline" className="mb-2 bg-[#faba33]/10 text-[#faba33] border-[#faba33]/20 inline-flex items-center">
                <Sparkles className="h-3 w-3 mr-1" />
                Sugestões baseadas em seus gastos
              </Badge>
            )}
            
            {budgets.map((budget) => (
              <div key={budget.id} className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <Link href={isSuggested ? "/budgets/new?suggested=true&category=" + encodeURIComponent(budget.title) + "&amount=" + budget.amount : `/budgets/${budget.id}`}>
                    <span className="font-medium text-sm hover:underline">
                      {budget.title}
                    </span>
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-white bg-opacity-[3%]">
                    <div
                      className={cn("h-full w-full flex-1 transition-all", getProgressColor(budget.progress))}
                      style={{ transform: `translateX(-${100 - (budget.progress || 0)}%)` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">
                    {budget.progress.toFixed(0)}% utilizado
                  </p>
                </div>
              </div>
            ))}
            
            <div className="pt-2">
              <Link href={isSuggested ? "/budgets/new?suggested=true" : "/budgets/new"}>
                <Button variant="outline" size="sm" className="w-full">
                  Criar novo orçamento
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Você ainda não tem orçamentos definidos.
            </p>
            <Link href="/budgets/new">
              <Button variant="outline" size="sm">
                Criar orçamento
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 