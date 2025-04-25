"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { formatCurrency } from "@/app/_lib/utils";
import { ArrowDown, ArrowUp, ArrowRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export interface DRESummaryProps {
  data: any;
  period: "month" | "year";
  showComparison?: boolean;
}

/**
 * Componente para exibir o resumo do DRE
 */
export function DRESummary({ data, period, showComparison = false }: DRESummaryProps) {
  // Usar dados consolidados se disponíveis, senão usar dados da ContaRápida
  const dreData = data.consolidated || data.contaRapida;
  
  // Extrair os valores necessários
  const revenue = dreData.revenue?.total || 0;
  const expenses = dreData.expenses?.total || 0;
  const grossProfit = dreData.grossProfit || 0;
  const netProfit = dreData.netProfit || 0;
  const margin = dreData.margin || 0;
  
  // Determinar classes de cor com base no valor
  const getProfitColorClass = (value: number) => {
    if (value > 0) return "text-green-600";
    if (value < 0) return "text-red-600";
    return "text-gray-500";
  };
  
  // Determinar ícone com base no valor
  const getProfitIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-6 w-6 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-6 w-6 text-red-600" />;
    return <ArrowRight className="h-6 w-6 text-gray-500" />;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Receitas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(revenue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {period === "month" ? "Total mensal" : "Total do período"}
          </p>
        </CardContent>
      </Card>
      
      {/* Despesas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(expenses)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {period === "month" ? "Total mensal" : "Total do período"}
          </p>
        </CardContent>
      </Card>
      
      {/* Lucro Líquido */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lucro Líquido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end">
            <div className={`text-2xl font-bold ${getProfitColorClass(netProfit)}`}>
              {formatCurrency(netProfit)}
            </div>
            <div className="ml-2 mb-1">
              {getProfitIcon(netProfit)}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {period === "month" ? "Resultado mensal" : "Resultado do período"}
          </p>
        </CardContent>
      </Card>
      
      {/* Margem */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Margem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getProfitColorClass(margin)}`}>
            {margin.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Proporção de lucro sobre as receitas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export interface DREComparisonSummaryProps {
  data: any;
  period: "month" | "year";
}

/**
 * Componente para exibir o resumo comparativo do DRE
 */
export function DREComparisonSummary({ data, period }: DREComparisonSummaryProps) {
  // Extrair dados do período atual e anterior
  const currentData = data.current.consolidated || data.current.contaRapida;
  const previousData = data.previous.consolidated || data.previous.contaRapida;
  
  // Extrair os valores do período atual
  const currentRevenue = currentData.revenue?.total || 0;
  const currentExpenses = currentData.expenses?.total || 0;
  const currentProfit = currentData.netProfit || 0;
  const currentMargin = currentData.margin || 0;
  
  // Extrair os valores do período anterior
  const previousRevenue = previousData.revenue?.total || 0;
  const previousExpenses = previousData.expenses?.total || 0;
  const previousProfit = previousData.netProfit || 0;
  const previousMargin = previousData.margin || 0;
  
  // Calcular as mudanças percentuais
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };
  
  const revenueChange = calculateChange(currentRevenue, previousRevenue);
  const expensesChange = calculateChange(currentExpenses, previousExpenses);
  const profitChange = calculateChange(currentProfit, previousProfit);
  const marginChange = currentMargin - previousMargin;
  
  // Função para obter ícone baseado na mudança
  const getChangeIcon = (value: number, inverse: boolean = false) => {
    // Se inverse for true, valores positivos são ruins (ex: aumento de despesas)
    const isPositive = inverse ? value < 0 : value > 0;
    
    if (value === 0) return <ArrowRight className="h-4 w-4 text-gray-500" />;
    if (isPositive) return <ArrowUp className="h-4 w-4 text-green-600" />;
    return <ArrowDown className="h-4 w-4 text-red-600" />;
  };
  
  // Função para obter classe de cor baseada na mudança
  const getChangeColorClass = (value: number, inverse: boolean = false) => {
    // Se inverse for true, valores positivos são ruins (ex: aumento de despesas)
    const isPositive = inverse ? value < 0 : value > 0;
    
    if (value === 0) return "text-gray-500";
    if (isPositive) return "text-green-600";
    return "text-red-600";
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Receitas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Receitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(currentRevenue)}
          </div>
          <div className="flex items-center mt-2">
            <Badge variant="outline" className="mr-2">
              Anterior: {formatCurrency(previousRevenue)}
            </Badge>
            <div className={`text-sm font-medium flex items-center ${getChangeColorClass(revenueChange)}`}>
              {getChangeIcon(revenueChange)}
              <span className="ml-1">{Math.abs(revenueChange).toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Despesas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Despesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(currentExpenses)}
          </div>
          <div className="flex items-center mt-2">
            <Badge variant="outline" className="mr-2">
              Anterior: {formatCurrency(previousExpenses)}
            </Badge>
            <div className={`text-sm font-medium flex items-center ${getChangeColorClass(expensesChange, true)}`}>
              {getChangeIcon(expensesChange, true)}
              <span className="ml-1">{Math.abs(expensesChange).toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Lucro Líquido */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lucro Líquido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${currentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(currentProfit)}
          </div>
          <div className="flex items-center mt-2">
            <Badge variant="outline" className="mr-2">
              Anterior: {formatCurrency(previousProfit)}
            </Badge>
            <div className={`text-sm font-medium flex items-center ${getChangeColorClass(profitChange)}`}>
              {getChangeIcon(profitChange)}
              <span className="ml-1">{Math.abs(profitChange).toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Margem */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Margem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${currentMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currentMargin.toFixed(2)}%
          </div>
          <div className="flex items-center mt-2">
            <Badge variant="outline" className="mr-2">
              Anterior: {previousMargin.toFixed(2)}%
            </Badge>
            <div className={`text-sm font-medium flex items-center ${getChangeColorClass(marginChange)}`}>
              {getChangeIcon(marginChange)}
              <span className="ml-1">{Math.abs(marginChange).toFixed(1)}pp</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 