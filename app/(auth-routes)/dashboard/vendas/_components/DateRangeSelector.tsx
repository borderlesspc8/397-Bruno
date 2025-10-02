"use client";

import { useEffect, useState, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  subMonths,
  startOfYear,
  endOfYear,
  startOfWeek,
  endOfWeek
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRangePicker } from "@/app/_components/ui/date-range-picker";
import { PositionedPopover } from "@/app/_components/ui/positioned-popover";
import { Label } from "@/app/_components/ui/label";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRangeSelectorProps {
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function DateRangeSelector({ onDateRangeChange }: DateRangeSelectorProps) {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Período padrão: do primeiro dia do mês atual até o dia atual (evita problemas de cache)
  const defaultRange: DateRange = {
    from: new Date(currentYear, currentMonth, 1), // Primeiro dia do mês atual
    to: today // Dia atual (não o último dia do mês)
  };
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);
  const [presetOpen, setPresetOpen] = useState(false);
  
  // Aplicar novo período e enviar para o componente pai - CORRIGIDO PARA EVITAR LOOPS
  const applyDateRange = useCallback((range: DateRange | undefined) => {
    if (!range?.from) {
      setDateRange(range);
      return;
    }
    
    // Verificar se o range realmente mudou para evitar re-renderizações
    const newFrom = range.from;
    const newTo = range.to || range.from;
    
    if (dateRange?.from?.getTime() === newFrom.getTime() && 
        dateRange?.to?.getTime() === newTo.getTime()) {
      return;
    }
    
    // Armazenar o range selecionado pelo usuário
    setDateRange(range);
    
    // Enviar para o componente pai o range selecionado
    onDateRangeChange({ 
      from: newFrom, 
      to: newTo
    });
  }, [dateRange, onDateRangeChange]);
  
  // REMOVIDO: useEffect que causava loop infinito
  // O período inicial será definido pelo componente pai, não pelo DateRangeSelector
  
  // Mostra o nome do período selecionado ou as datas
  const getDisplayText = () => {
    if (!dateRange?.from) return "Selecionar período";
    
    // Verificar se é o mês atual (do dia 1 até hoje)
    const isCurrentMonth = 
      dateRange.from.getTime() === new Date(today.getFullYear(), today.getMonth(), 1).getTime() && 
      dateRange.to?.getTime() === today.getTime();
    if (isCurrentMonth) return "Mês Atual (até hoje)";
    
    // Verificar se é o mês anterior
    const lastMonth = subMonths(today, 1);
    const isLastMonth = 
      dateRange.from.getTime() === new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).getTime() && 
      dateRange.to?.getTime() === endOfMonth(lastMonth).getTime();
    if (isLastMonth) return "Mês Anterior";
    
    // Verificar se é o ano atual
    const isCurrentYear = 
      dateRange.from.getTime() === new Date(today.getFullYear(), 0, 1).getTime() && 
      dateRange.to?.getTime() === endOfYear(today).getTime();
    if (isCurrentYear) return "Ano Atual";
    
    // Para outros períodos, exibir as datas formatadas
    return `${format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateRange.to || dateRange.from, "dd/MM/yyyy", { locale: ptBR })}`;
  };
  
  // Opções rápidas de período
  const periodPresets = [
    { 
      name: "Mês Atual (até hoje)", 
      handler: () => {
        const range = { 
          from: new Date(currentYear, currentMonth, 1),
          to: today // Dia atual em vez do último dia do mês
        };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Mês Completo", 
      handler: () => {
        const range = { 
          from: new Date(currentYear, currentMonth, 1),
          to: endOfMonth(new Date(currentYear, currentMonth, 1)) // Último dia do mês
        };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Mês Anterior", 
      handler: () => {
        const lastMonth = subMonths(today, 1);
        const range = { 
          from: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
          to: endOfMonth(lastMonth) 
        };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Dois Meses Atrás", 
      handler: () => {
        const twoMonthsAgo = subMonths(today, 2);
        const range = { 
          from: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 1),
          to: endOfMonth(twoMonthsAgo) 
        };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Três Meses Atrás", 
      handler: () => {
        const threeMonthsAgo = subMonths(today, 3);
        const range = { 
          from: new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1),
          to: endOfMonth(threeMonthsAgo) 
        };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Ano Atual", 
      handler: () => {
        const range = { 
          from: new Date(today.getFullYear(), 0, 1),
          to: endOfYear(today) 
        };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    }
  ];

  return (
    <div className="ios26-animate-fade-in">
      <Label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
          <Calendar className="h-3 w-3 text-orange-600 dark:text-orange-400" />
        </div>
        Período
      </Label>
      
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={applyDateRange}
          className="flex-1 min-w-[240px] ios26-card p-3 border-0 transition-all duration-300 hover:shadow-lg"
        />
        
        <PositionedPopover
        trigger={
          <button 
            className="ios26-button flex items-center gap-2 px-4 py-2 text-sm font-semibold"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline-block">Períodos</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        }
        align="end"
      >
        <div className="ios26-card p-4 w-[260px]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl">
              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">Períodos Rápidos</p>
          </div>
          <div className="space-y-2">
            {periodPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={preset.handler}
                className="w-full text-left px-3 py-2.5 text-sm rounded-xl hover:bg-muted/50 text-foreground transition-all duration-200 flex items-center gap-3 group"
              >
                <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Calendar className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="font-medium">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </PositionedPopover>
      </div>
    </div>
  );
} 