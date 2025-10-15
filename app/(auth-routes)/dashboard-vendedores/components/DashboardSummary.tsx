"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/app/_components/ui/card";
import { cn } from "@/app/_lib/utils";
import { formatCurrency } from "@/app/_lib/formatters";
import { roundToCents, parseValueSafe } from "@/app/_utils/number-processor";
import { 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  ShoppingCart, 
  CreditCard, 
  DollarSign, 
  Info,
  Target,
  Percent,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BarChart2
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

export const DashboardSummary = React.memo(({ totais, metas, vendedores }: DashboardSummaryProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    faturamento: false,
    vendas: true,
    ticketMedio: true,
    lucro: true
  });
  
  // Detectar tela mobile
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Em telas não-mobile, expandir todas as seções
      if (!mobile) {
        setCollapsedSections({
          faturamento: false,
          vendas: false,
          ticketMedio: false,
          lucro: false
        });
      }
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Função para alternar visibilidade de seção
  const toggleSection = (section: keyof typeof collapsedSections) => {
    if (isMobile) {
      setCollapsedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    }
  };

  // Dados do lucro e informações associadas
  const {
    lucro,
    margemLucro,
    lucroRemark,
    infoSecundaria
  } = useMemo(() => {
    const faturamento = parseValueSafe(totais.faturamento);
    const custo = parseValueSafe(totais.custo || 0);
    const descontos = parseValueSafe(totais.descontos || 0);
    const fretes = parseValueSafe(totais.fretes || 0);
    
    // Log dos valores para debug
    console.log('🔍 [DashboardSummary] Valores de entrada:', {
      faturamento,
      custo,
      descontos,
      fretes,
      lucroOriginal: totais.lucro,
      calculoManual: faturamento - custo + fretes,
      diferenca: totais.lucro ? totais.lucro - (faturamento - custo + fretes) : null,
      dadosCompletos: totais
    });
    
    // Se o lucro já está definido nos dados, usar ele
    // Caso contrário, calcular: Faturamento - Custos - Fretes (descontos removidos)
    const lucroCalculado = totais.lucro !== undefined 
      ? parseValueSafe(totais.lucro)
      : roundToCents(faturamento - custo - fretes);
    
    // Calcular margem de lucro: (Lucro / Faturamento) * 100
    const margemLucroCalculada = faturamento > 0 
      ? roundToCents((lucroCalculado / faturamento) * 100)
      : 0;
    
    // Log do cálculo final
    console.log('💰 [DashboardSummary] Cálculo do lucro:', {
      formula: `${faturamento} - ${custo} - ${fretes}`,
      calculoManual: faturamento - custo - fretes,
      lucroCalculado,
      margemLucroCalculada: `${margemLucroCalculada.toFixed(2)}%`,
      usandoLucroOriginal: totais.lucro !== undefined
    });
    
    const infoSecundariaTexto = [
      custo > 0 ? `Custo total: ${formatCurrency(custo)}` : null,
      fretes > 0 ? `Fretes: ${formatCurrency(fretes)}` : null
    ].filter(Boolean).join(' • ');

    return {
      lucro: lucroCalculado,
      margemLucro: margemLucroCalculada,
      infoSecundaria: infoSecundariaTexto
    };
  }, [totais.faturamento, totais.custo, totais.descontos, totais.fretes, totais.lucro]);

  // Formatar valores
  const formattedValues = useMemo(() => {
    return {
      faturamento: formatCurrency(totais.faturamento || 0),
      vendas: (totais.vendas || 0).toString(),
      ticketMedio: formatCurrency(totais.ticketMedio || 0),
      lucro: formatCurrency(lucro || 0)
    };
  }, [totais.faturamento, totais.vendas, totais.ticketMedio, lucro]);

  // Calcula informações sobre as metas
  const metasInfo = useMemo(() => {
    if (!metas) return null;
    
    const faturamentoTotal = totais.faturamento || 0;
    const metaMensal = metas.metaMensal || 0;
    const metaSalvio = metas.metaSalvio || 0;
    
    return {
      faturamentoTotal: faturamentoTotal,
      metaMensal,
      metaSalvio,
      percentualMeta: metaMensal > 0 ? (faturamentoTotal / metaMensal) * 100 : 0,
      percentualMetaSalvio: metaSalvio > 0 ? (faturamentoTotal / metaSalvio) * 100 : 0,
      faltaParaMeta: Math.max(0, metaMensal - faturamentoTotal),
      faltaParaMetaSalvio: Math.max(0, metaSalvio - faturamentoTotal)
    };
  }, [totais.faturamento, metas]);

  return (
    <div className={`ios26-grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
      {/* Card de Faturamento Total */}
      <div className="ios26-metric-card">
        <div 
          className={`flex items-center justify-between mb-6 ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={() => toggleSection('faturamento')}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
              <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Faturamento Total
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {totais.variacoes?.faturamento !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full",
                totais.variacoes.faturamento >= 0 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              )}>
                <span className="flex items-center gap-1">
                  {totais.variacoes.faturamento >= 0 ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  {Math.abs(totais.variacoes.faturamento).toFixed(1)}%
                </span>
              </div>
            )}
            
            {isMobile && (
              <button className="p-2 hover:bg-muted rounded-xl transition-colors">
                {collapsedSections.faturamento ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronUp className="h-5 w-5" />
                }
              </button>
            )}
          </div>
        </div>
        
        <div className={`space-y-4 ${isMobile && collapsedSections.faturamento ? 'hidden' : 'block'}`}>
          <div className="ios26-currency-large text-foreground">
            {formattedValues.faturamento}
          </div>
          
          {metasInfo && (
            <div className="space-y-4">
              {/* Meta Mensal */}
              <div>
                <div className="flex justify-between items-center mb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-muted-foreground font-medium">Meta Mensal</span>
                  </div>
                  <div className="text-orange-600 dark:text-orange-400 font-semibold">
                    {metasInfo.percentualMeta.toFixed(1)}%
                  </div>
                </div>
                <div className="ios26-progress">
                  <div 
                    className="ios26-progress-bar" 
                    style={{ width: `${Math.min(metasInfo.percentualMeta, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span className="font-medium">{formatCurrency(metasInfo.faturamentoTotal)}</span>
                  <span className="font-medium">{formatCurrency(metasInfo.metaMensal)}</span>
                </div>
              </div>

              {/* Meta Salvio */}
              <div>
                <div className="flex justify-between items-center mb-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground font-medium">Meta Salvio</span>
                  </div>
                  <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                    {metasInfo.percentualMetaSalvio.toFixed(1)}%
                  </div>
                </div>
                <div className="ios26-progress">
                  <div 
                    className="ios26-progress-bar" 
                    style={{ 
                      width: `${Math.min(metasInfo.percentualMetaSalvio, 100)}%`,
                      background: 'linear-gradient(90deg, hsl(var(--yellow-primary)), hsl(var(--orange-primary)))'
                    }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span className="font-medium">{formatCurrency(metasInfo.faturamentoTotal)}</span>
                  <span className="font-medium">{formatCurrency(metasInfo.metaSalvio)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Card de Total de Vendas */}
      <div className="ios26-metric-card">
        <div 
          className={`flex items-center justify-between mb-6 ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={() => toggleSection('vendas')}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Total de Vendas
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {totais.variacoes?.vendas !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full",
                totais.variacoes.vendas >= 0 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              )}>
                <span className="flex items-center gap-1">
                  {totais.variacoes.vendas >= 0 ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  {Math.abs(totais.variacoes.vendas).toFixed(1)}%
                </span>
              </div>
            )}
            
            {isMobile && (
              <button className="p-2 hover:bg-muted rounded-xl transition-colors">
                {collapsedSections.vendas ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronUp className="h-5 w-5" />
                }
              </button>
            )}
          </div>
        </div>
        
        <div className={`space-y-4 ${isMobile && collapsedSections.vendas ? 'hidden' : 'block'}`}>
          <div className="ios26-currency-large text-foreground">
            {formattedValues.vendas}
          </div>
          
          {vendedores && vendedores.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground font-medium">
                Vendedores ativos: {vendedores.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Média por vendedor: {Math.round(totais.vendas / vendedores.length)}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Card de Ticket Médio */}
      <div className="ios26-metric-card">
        <div 
          className={`flex items-center justify-between mb-6 ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={() => toggleSection('ticketMedio')}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl">
              <BarChart2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Ticket Médio
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {totais.variacoes?.ticketMedio !== undefined && (
              <div className={cn(
                "flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full",
                totais.variacoes.ticketMedio >= 0 
                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              )}>
                <span className="flex items-center gap-1">
                  {totais.variacoes.ticketMedio >= 0 ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  {Math.abs(totais.variacoes.ticketMedio).toFixed(1)}%
                </span>
              </div>
            )}
            
            {isMobile && (
              <button className="p-2 hover:bg-muted rounded-xl transition-colors">
                {collapsedSections.ticketMedio ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronUp className="h-5 w-5" />
                }
              </button>
            )}
          </div>
        </div>
        
        <div className={`space-y-4 ${isMobile && collapsedSections.ticketMedio ? 'hidden' : 'block'}`}>
          <div className="ios26-currency-large text-foreground">
            {formattedValues.ticketMedio}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground font-medium">
              Por venda
            </div>
            {totais.vendas > 0 && (
              <div className="text-sm text-muted-foreground">
                Baseado em {totais.vendas} vendas
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardSummary.displayName = "DashboardSummary";
