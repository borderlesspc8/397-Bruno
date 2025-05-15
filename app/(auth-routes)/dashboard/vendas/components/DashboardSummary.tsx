"use client";

import React, { useMemo, useState, useEffect } from "react";
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
    
    // Verificar na primeira renderização
    checkIsMobile();
    
    // Verificar quando a tela for redimensionada
    window.addEventListener('resize', checkIsMobile);
    
    // Limpar o evento quando o componente for desmontado
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
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

    // Calculamos o faturamento sem as vendas de ADMINISTRATIVO e Personal Prime MATRIZ
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
      progressoMetaSalvio
    };
  }, [metas, totais.faturamento, vendedores]);

  return (
    <div className={`grid gap-4 grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
      {/* Card de Faturamento Total */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md relative border border-gray-200 dark:border-gray-700">
        <div 
          className={`p-4 flex items-center justify-between ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={() => toggleSection('faturamento')}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                    Faturamento Total
            </h3>
                  </div>
                  
          <div className="flex items-center gap-2">
                  {totais.variacoes?.faturamento !== undefined && (
              <div className={`rounded-full py-0.5 px-2 text-xs font-medium ${
                        totais.variacoes.faturamento >= 0 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                <span className="flex items-center gap-0.5">
                        {totais.variacoes.faturamento >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                        ) : (
                    <ArrowDown className="h-3 w-3" />
                        )}
                        {Math.abs(totais.variacoes.faturamento).toFixed(1)}%
                      </span>
                    </div>
                  )}
            
            {isMobile && (
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {collapsedSections.faturamento ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronUp className="h-5 w-5" />
                }
              </button>
            )}
                </div>
              </div>
              
        <div className={`px-4 pb-4 ${isMobile && collapsedSections.faturamento ? 'hidden' : 'block'}`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {formattedValues.faturamento}
                    </div>
          
          {metasInfo && (
            <div className="space-y-3 mt-3">
              {/* Meta Mensal */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-gray-600 dark:text-gray-300">Meta Mensal</span>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium">{metasInfo.progressoMetaMensal.toFixed(1)}%</div>
                </div>
                <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${metasInfo.progressoMetaMensal}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatCurrency(metasInfo.faturamentoSemAdministrativo)}</span>
                    <span>{metasInfo.formattedMetaMensal}</span>
                  </div>
                </div>

              {/* Meta Salvio */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-gray-600 dark:text-gray-300">Meta Salvio</span>
                  </div>
                  <div className="text-amber-600 dark:text-amber-400 font-medium">{metasInfo.progressoMetaSalvio.toFixed(1)}%</div>
                </div>
                <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${metasInfo.progressoMetaSalvio}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatCurrency(metasInfo.faturamentoTotal)}</span>
                    <span>{metasInfo.formattedMetaSalvio}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Card de Total de Vendas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md relative border border-gray-200 dark:border-gray-700">
        <div 
          className={`p-4 flex items-center justify-between ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={() => toggleSection('vendas')}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
              Total de Vendas
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {totais.variacoes?.vendas !== undefined && (
              <div className={`rounded-full py-0.5 px-2 text-xs font-medium ${
                totais.variacoes.vendas >= 0 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                <span className="flex items-center gap-0.5">
                  {totais.variacoes.vendas >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
      )}
                  {Math.abs(totais.variacoes.vendas).toFixed(1)}%
                </span>
              </div>
            )}
            
            {isMobile && (
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {collapsedSections.vendas ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronUp className="h-5 w-5" />
                }
              </button>
            )}
          </div>
        </div>
        
        <div className={`px-4 pb-4 ${isMobile && collapsedSections.vendas ? 'hidden' : 'block'}`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formattedValues.vendas}
          </div>
          
        </div>
      </div>
      
      {/* Card de Ticket Médio */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md relative border border-gray-200 dark:border-gray-700">
        <div 
          className={`p-4 flex items-center justify-between ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={() => toggleSection('ticketMedio')}
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
              Ticket Médio
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {totais.variacoes?.ticketMedio !== undefined && (
              <div className={`rounded-full py-0.5 px-2 text-xs font-medium ${
                totais.variacoes.ticketMedio >= 0 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                <span className="flex items-center gap-0.5">
                  {totais.variacoes.ticketMedio >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(totais.variacoes.ticketMedio).toFixed(1)}%
                </span>
              </div>
            )}
            
            {isMobile && (
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {collapsedSections.ticketMedio ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronUp className="h-5 w-5" />
                }
              </button>
            )}
          </div>
        </div>
        
        <div className={`px-4 pb-4 ${isMobile && collapsedSections.ticketMedio ? 'hidden' : 'block'}`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formattedValues.ticketMedio}
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {totais.vendas ? `Baseado em ${totais.vendas} ${totais.vendas === 1 ? 'venda' : 'vendas'} no período` : 'Nenhuma venda no período'}
          </div>
        </div>
      </div>
      
      {/* Card de Lucro */}
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md relative border border-gray-200 dark:border-gray-700">
        <div 
          className={`p-4 flex items-center justify-between ${isMobile ? 'cursor-pointer' : ''}`}
          onClick={() => toggleSection('lucro')}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-500" />
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
              Lucro do Período
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {totais.variacoes?.lucro !== undefined && (
              <div className={`rounded-full py-0.5 px-2 text-xs font-medium ${
                totais.variacoes.lucro >= 0 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                <span className="flex items-center gap-0.5">
                  {totais.variacoes.lucro >= 0 ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(totais.variacoes.lucro).toFixed(1)}%
                </span>
              </div>
            )}
            
            {isMobile && (
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                {collapsedSections.lucro ? 
                  <ChevronDown className="h-5 w-5" /> : 
                  <ChevronUp className="h-5 w-5" />
                }
              </button>
            )}
          </div>
        </div>
        
        <div className={`px-4 pb-4 ${isMobile && collapsedSections.lucro ? 'hidden' : 'block'}`}>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formattedValues.lucro}
          </div>
          
          <div className="mt-3 flex items-center text-sm">
            <div className="flex items-center gap-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full px-2 py-1">
              <Percent className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-700 dark:text-purple-400">
                Margem: {margemLucro.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {infoSecundaria && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {infoSecundaria}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Componente SummaryCard otimizado
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
  return (
    <Card className={cn(
      "bg-white dark:bg-gray-800 overflow-hidden transition-all duration-300",
      "hover:shadow-lg border-none",
      "relative"
    )}>
      <CardContent className="p-3 xs:p-4 sm:p-6">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-2 xs:mb-3 sm:mb-4">
            <div>
              <div className="text-xs xs:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {title}
              </div>
              <h3 className={cn(
                "text-lg xs:text-xl sm:text-2xl font-bold tracking-tight",
                isHighlight ? "text-primary" : "text-gray-900 dark:text-white"
              )}>
                {value}
              </h3>
              
              {percentChange !== undefined && (
                <div className="flex items-center mt-1 xs:mt-2 text-[10px] xs:text-xs">
                  <span className={cn(
                    "flex items-center gap-1 font-medium rounded-full px-1.5 xs:px-2 py-0.5",
                    percentChange >= 0 
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" 
                      : "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                  )}>
                    {percentChange >= 0 ? (
                      <ArrowUp className="h-2.5 xs:h-3 w-2.5 xs:w-3" />
                    ) : (
                      <ArrowDown className="h-2.5 xs:h-3 w-2.5 xs:w-3" />
                    )}
                    {Math.abs(percentChange).toFixed(1)}%
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 ml-1 xs:ml-2 text-[8px] xs:text-[10px] sm:text-xs">
                    vs. período anterior
                  </span>
                </div>
              )}
            </div>
            
            <div className={cn(
              "p-1.5 xs:p-2 rounded-full",
              isHighlight ? "bg-primary/10 dark:bg-primary/20" : "bg-gray-100 dark:bg-gray-700"
            )}>
              {icon}
            </div>
          </div>

          {(remark || secondaryInfo) && (
            <div className="mt-auto pt-2 xs:pt-3 sm:pt-4 space-y-0.5 xs:space-y-1">
              {remark && (
                <p className="text-[10px] xs:text-xs font-medium text-gray-900 dark:text-white">
                  {remark}
                </p>
              )}
              {secondaryInfo && (
                <p className="text-[8px] xs:text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  {secondaryInfo}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

SummaryCard.displayName = 'SummaryCard';
DashboardSummary.displayName = 'DashboardSummary'; 