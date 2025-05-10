"use client";

import React, { useMemo } from "react";
import { Card, CardContent } from "@/app/_components/ui/card";
import { cn } from "@/app/_lib/utils";
import { formatCurrency } from "@/app/_lib/formatters";
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  ShoppingCart, 
  CreditCard, 
  DollarSign, 
  Info,
  Target
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";
import { Progress } from "@/app/_components/ui/progress";

interface DashboardSummaryProps {
  totais: {
    faturamento: number;
    vendas: number;
    ticketMedio: number;
    lucro?: number;
    custo?: number;
    descontos?: number;
    fretes?: number;
    margemLucro?: number;
    variacoes?: {
      faturamento?: number;
      vendas?: number;
      ticketMedio?: number;
      lucro?: number;
    };
  };
  metas?: {
    metaMensal?: number;
    metaSalvio?: number;
  };
  vendedores?: Array<{
    id: string;
    nome: string;
    faturamento: number;
    vendas: number;
    ticketMedio: number;
    lojaNome?: string;
  }>;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = React.memo(({ totais, metas, vendedores }) => {
  // Dados do lucro e informações associadas
  const {
    lucro,
    margemLucro,
    lucroRemark,
    infoSecundaria
  } = useMemo(() => {
    // Extrair valores dos dados recebidos
    const faturamento = totais.faturamento || 0;
    const custo = totais.custo || 0;
    const descontos = totais.descontos || 0;
    const fretes = totais.fretes || 0;
    
    // Calcular lucro de forma mais precisa
    // Se lucro já estiver definido, usar esse valor
    // Caso contrário, calcular a partir dos outros valores
    const lucroCalculado = totais.lucro !== undefined 
      ? totais.lucro 
      : faturamento - custo - descontos + fretes;
    
    // Calcular margem de lucro
    const margemLucroCalculada = totais.margemLucro !== undefined 
      ? totais.margemLucro 
      : (faturamento > 0 ? (lucroCalculado / faturamento) * 100 : 0);
    
    // Texto para o card de lucro
    const lucroRemarkTexto = `Margem de lucro: ${margemLucroCalculada.toFixed(2)}%`;

    // Informações adicionais
    let infoSecundariaTexto = '';
    if (custo) {
      infoSecundariaTexto += `Custo total: ${formatCurrency(custo)}`;
    }
    if (descontos && descontos > 0) {
      infoSecundariaTexto += infoSecundariaTexto ? ' • ' : '';
      infoSecundariaTexto += `Descontos: ${formatCurrency(descontos)}`;
    }
    if (fretes && fretes > 0) {
      infoSecundariaTexto += infoSecundariaTexto ? ' • ' : '';
      infoSecundariaTexto += `Fretes: ${formatCurrency(fretes)}`;
    }

    return {
      lucro: lucroCalculado,
      margemLucro: margemLucroCalculada,
      lucroRemark: lucroRemarkTexto,
      infoSecundaria: infoSecundariaTexto
    };
  }, [totais.faturamento, totais.custo, totais.descontos, totais.fretes, totais.lucro, totais.margemLucro]);

  // Formatar valores uma única vez para evitar operações de string repetidas
  const formattedValues = useMemo(() => {
    return {
      faturamento: formatCurrency(totais.faturamento || 0),
      vendas: (totais.vendas || 0).toString(),
      ticketMedio: formatCurrency(totais.ticketMedio || 0),
      lucro: formatCurrency(lucro || 0)
    };
  }, [totais.faturamento, totais.vendas, totais.ticketMedio, lucro]);

  // Componente de título do lucro com tooltip para reutilização
  const lucroPeriodoTitle = useMemo(() => (
    <div className="flex items-center gap-1">
      Lucro do Período
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
            <p className="max-w-xs">Este valor é calculado como Faturamento - Custo - Descontos + Fretes para vendas Concretizadas e Em Andamento.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
    </div>
  ), []);

  // Calcula informações sobre as metas
  const metasInfo = useMemo(() => {
    if (!metas) return null;
    
    const faturamentoTotal = totais.faturamento || 0;
    const metaMensal = metas.metaMensal || 0;
    const metaSalvio = metas.metaSalvio || 0;

    // Calculamos o faturamento sem as vendas de ADMINISTRATIVO e Personal Prime MATRIZ
    // Este valor será usado para calcular o progresso da meta mensal
    let faturamentoSemAdministrativo = faturamentoTotal;
    
    // Se temos dados de vendedores, filtramos o faturamento
    if (vendedores && vendedores.length > 0) {
      // Identificamos vendedores que contenham "ADMINISTRATIVO" ou "MATRIZ" no nome
      const vendedoresAdministrativos = vendedores.filter(
        v => {
          if (!v || !v.nome) return false; // Proteção contra vendedores sem nome
          
          const nome = (v.nome || '').toUpperCase();
          const lojaNome = (v.lojaNome || '').toUpperCase();
          
          return (
            nome.includes('ADMINISTRATIVO') || 
            nome.includes('PERSONAL PRIME MATRIZ') || 
            nome.includes('ADMIN') && nome.includes('MATRIZ') ||
            lojaNome.includes('MATRIZ') && (nome.includes('ADMIN') || nome.includes('ADMINISTRATIVO'))
          );
        }
      );
      
      // Log para debug
      console.log('Vendedores administrativos excluídos da meta mensal:', 
        vendedoresAdministrativos.map(v => ({nome: v.nome, faturamento: v.faturamento}))
      );
      
      // Subtraímos o faturamento desses vendedores do total para a meta mensal
      const faturamentoAdministrativo = vendedoresAdministrativos.reduce(
        (sum, v) => sum + (v.faturamento || 0), 0
      );
      
      faturamentoSemAdministrativo = faturamentoTotal - faturamentoAdministrativo;
    }

    // Percentuais de progresso
    // Meta mensal: usa faturamento sem administrativo
    const progressoMetaMensal = metaMensal > 0 ? Math.min(100, (faturamentoSemAdministrativo / metaMensal) * 100) : 0;
    // Meta Salvio: usa faturamento total incluindo administrativo
    const progressoMetaSalvio = metaSalvio > 0 ? Math.min(100, (faturamentoTotal / metaSalvio) * 100) : 0;
    
    return {
      metaMensal,
      metaSalvio,
      faturamentoTotal,
      faturamentoSemAdministrativo,
      formattedMetaMensal: formatCurrency(metaMensal),
      formattedMetaSalvio: formatCurrency(metaSalvio),
      progressoMetaMensal,
      progressoMetaSalvio,
    };
  }, [metas, totais.faturamento, vendedores]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      {/* Card de Faturamento com Metas */}
      {metasInfo ? (
        <Card className={cn(
          "bg-gradient-to-br border overflow-hidden transition-all duration-300 hover:shadow-md",
          "from-primary/5 to-primary/10",
          "border-primary/20"
        )}>
          <CardContent className="pt-6 pb-5 relative">
            <div className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    Faturamento Total
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {formattedValues.faturamento}
                  </h3>
                  
                  {totais.variacoes?.faturamento !== undefined && (
                    <div className="flex items-center mt-2 text-xs">
                      <span className={cn(
                        "flex items-center gap-0.5 font-medium",
                        totais.variacoes.faturamento >= 0 
                          ? "text-emerald-600 dark:text-emerald-500" 
                          : "text-rose-600 dark:text-rose-500"
                      )}>
                        {totais.variacoes.faturamento >= 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {Math.abs(totais.variacoes.faturamento).toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground ml-1.5">
                        comparado ao período anterior
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-2 rounded-full bg-background/80 backdrop-blur">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
              </div>
              
              {/* Comparativo com metas */}
              <div className="mt-3 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-primary" />
                      <span>Meta Mensal:</span>
                    </div>
                    <div className="font-medium">
                      {metasInfo.progressoMetaMensal.toFixed(1)}%
                    </div>
                  </div>
                  <Progress 
                    value={metasInfo.progressoMetaMensal} 
                    className="h-1.5" 
                    indicatorClassName={
                      metasInfo.progressoMetaMensal >= 100 
                        ? "bg-emerald-500" 
                        : metasInfo.progressoMetaMensal >= 75 
                          ? "bg-amber-500"
                          : metasInfo.progressoMetaMensal >= 50
                            ? "bg-primary"
                            : "bg-rose-500"
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(metasInfo.faturamentoSemAdministrativo)} de {metasInfo.formattedMetaMensal}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help inline-block ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Meta Mensal: {metasInfo.formattedMetaMensal}</p>
                          <p className="max-w-xs text-xs mt-1">Exclui vendas de "ADMINISTRATIVO" e "PERSONAL PRIME MATRIZ" do cálculo de progresso</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-indigo-500" />
                      <span>Meta Salvio:</span>
                    </div>
                    <div className="font-medium">
                      {metasInfo.progressoMetaSalvio.toFixed(1)}%
                    </div>
                  </div>
                  <Progress 
                    value={metasInfo.progressoMetaSalvio} 
                    className="h-1.5" 
                    indicatorClassName={
                      metasInfo.progressoMetaSalvio >= 100 
                        ? "bg-emerald-500" 
                        : metasInfo.progressoMetaSalvio >= 75 
                          ? "bg-amber-500"
                          : metasInfo.progressoMetaSalvio >= 50
                            ? "bg-indigo-500"
                            : "bg-rose-500"
                    }
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(metasInfo.faturamentoTotal)} de {metasInfo.formattedMetaSalvio}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help inline-block ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Meta Salvio: {metasInfo.formattedMetaSalvio}</p>
                          <p className="max-w-xs text-xs mt-1">Inclui todas as vendas no cálculo de progresso, inclusive de setores administrativos</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-muted-foreground">
                Apenas vendas Concretizadas
              </div>
            </div>
            
            <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </CardContent>
        </Card>
      ) : (
        <SummaryCard
          title="Faturamento Total"
          value={formattedValues.faturamento}
          icon={<CreditCard className="h-5 w-5 text-primary" />}
          percentChange={totais.variacoes?.faturamento}
          gradient="from-primary/5 to-primary/10"
          isHighlight
          remark="Apenas vendas Concretizadas e Em Andamento"
        />
      )}
      
      {/* Card de Vendas */}
      <SummaryCard
        title="Vendas Realizadas"
        value={formattedValues.vendas}
        icon={<ShoppingCart className="h-5 w-5 text-indigo-500" />}
        percentChange={totais.variacoes?.vendas}
        gradient="from-indigo-50 to-indigo-100 dark:from-indigo-950/20 dark:to-indigo-900/20"
        remark="Apenas vendas Concretizadas e Em Andamento"
      />
      
      {/* Card de Ticket Médio */}
      <SummaryCard
        title="Ticket Médio"
        value={formattedValues.ticketMedio}
        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
        percentChange={totais.variacoes?.ticketMedio}
        gradient="from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20"
        remark="Média de valor por venda"
      />
      
      {/* Card de Lucro do Período */}
      <SummaryCard
        title={lucroPeriodoTitle}
        value={formattedValues.lucro}
        icon={<DollarSign className="h-5 w-5 text-green-500" />}
        percentChange={totais.variacoes?.lucro}
        gradient="from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20"
        remark={lucroRemark}
        secondaryInfo={infoSecundaria || undefined}
      />
    </div>
  );
});

// Definir displayName para melhorar a depuração
DashboardSummary.displayName = 'DashboardSummary';

interface SummaryCardProps {
  title: string | React.ReactNode;
  value: string;
  icon: React.ReactNode;
  percentChange?: number;
  gradient: string;
  isHighlight?: boolean;
  remark?: string;
  secondaryInfo?: string;
}

// Memoizar SummaryCard para evitar re-renderizações desnecessárias
const SummaryCard: React.FC<SummaryCardProps> = React.memo(({
  title, 
  value, 
  icon, 
  percentChange,
  gradient,
  isHighlight,
  remark,
  secondaryInfo
}) => {
  // Memoizar o elemento de percentChange para evitar recálculos
  const percentChangeElement = useMemo(() => {
    if (percentChange === undefined) return null;
    
    return (
      <div className="flex items-center mt-2 text-xs">
        <span className={cn(
          "flex items-center gap-0.5 font-medium",
          percentChange >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"
        )}>
          {percentChange >= 0 ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {Math.abs(percentChange).toFixed(1)}%
        </span>
        <span className="text-muted-foreground ml-1.5">
          comparado ao período anterior
        </span>
      </div>
    );
  }, [percentChange]);

  return (
    <Card className={cn(
      "bg-gradient-to-br border overflow-hidden transition-all duration-300 hover:shadow-md",
      gradient,
      isHighlight && "border-primary/20"
    )}>
      <CardContent className="pt-6 pb-5 relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </div>
            <h3 className={cn(
              "text-2xl font-bold tracking-tight"
            )}>
              {value}
            </h3>
            
            {percentChangeElement}
            
            {remark && (
              <div className="mt-2 text-xs text-muted-foreground">
                {remark}
              </div>
            )}
            
            {secondaryInfo && (
              <div className="mt-1.5 text-xs text-muted-foreground">
                {secondaryInfo}
              </div>
            )}
          </div>
          
          <div className="p-2 rounded-full bg-background/80 backdrop-blur">
            {icon}
          </div>
        </div>
        
        {isHighlight && (
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        )}
      </CardContent>
    </Card>
  );
});

// Definir displayName para melhorar a depuração
SummaryCard.displayName = 'SummaryCard'; 