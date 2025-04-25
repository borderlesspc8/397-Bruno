"use client";

import { useState } from "react";
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
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

interface DateRangeSelectorProps {
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function DateRangeSelector({ onDateRangeChange }: DateRangeSelectorProps) {
  const today = new Date();
  
  // Período padrão: do primeiro dia do mês atual até hoje
  const defaultRange: DateRange = {
    from: startOfMonth(today),
    to: today
  };
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);
  const [presetOpen, setPresetOpen] = useState(false);
  
  // Mostra o nome do período selecionado ou as datas
  const getDisplayText = () => {
    if (!dateRange?.from) return "Selecionar período";
    
    // Verificar se é o período do mês atual (1º dia até hoje)
    const isCurrentMonthToday = 
      dateRange.from.getTime() === startOfMonth(today).getTime() && 
      dateRange.to?.getTime() === today.getTime();
    if (isCurrentMonthToday) return "Mês Atual até Hoje";
    
    // Verificar se é o mês atual completo
    const isCurrentMonth = 
      dateRange.from.getTime() === startOfMonth(today).getTime() && 
      dateRange.to?.getTime() === endOfMonth(today).getTime();
    if (isCurrentMonth) return "Mês Atual Completo";
    
    // Verificar se é o mês anterior
    const lastMonth = subMonths(today, 1);
    const isLastMonth = 
      dateRange.from.getTime() === startOfMonth(lastMonth).getTime() && 
      dateRange.to?.getTime() === endOfMonth(lastMonth).getTime();
    if (isLastMonth) return "Mês Anterior";
    
    // Verificar se é o ano atual
    const isCurrentYear = 
      dateRange.from.getTime() === startOfYear(today).getTime() && 
      dateRange.to?.getTime() === endOfYear(today).getTime();
    if (isCurrentYear) return "Ano Atual";
    
    // Caso contrário, exibir as datas formatadas
    return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to || dateRange.from, "dd/MM/yyyy")}`;
  };
  
  // Aplicar novo período e enviar para o componente pai
  const applyDateRange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
    }
  };
  
  // Opções rápidas de período
  const periodPresets = [
    { 
      name: "Hoje", 
      handler: () => {
        const range = { from: today, to: today };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Esta Semana", 
      handler: () => {
        const range = { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Mês Atual até Hoje", 
      handler: () => {
        const range = { from: startOfMonth(today), to: today };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Mês Atual Completo", 
      handler: () => {
        const range = { from: startOfMonth(today), to: endOfMonth(today) };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Mês Anterior", 
      handler: () => {
        const lastMonth = subMonths(today, 1);
        const range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    },
    { 
      name: "Ano Atual", 
      handler: () => {
        const range = { from: startOfYear(today), to: endOfYear(today) };
        setDateRange(range);
        onDateRangeChange(range);
        setPresetOpen(false);
      }
    }
  ];

  return (
    <div className="flex items-center gap-2">
      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={applyDateRange}
        className="w-auto min-w-[220px]"
      />
      
      <PositionedPopover
        trigger={
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 items-center h-9"
          >
            <span className="sr-only">Períodos</span>
            <ChevronDown className="h-4 w-4 text-[#faba33]" />
          </Button>
        }
        align="end"
      >
        <div className="p-2 w-[180px]">
          <p className="text-sm mb-2 font-medium px-2 text-[#faba33]">Períodos</p>
          {periodPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={preset.handler}
              className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-amber-50 dark:hover:bg-amber-950/30"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </PositionedPopover>
    </div>
  );
} 