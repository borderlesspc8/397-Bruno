"use client";

import { useEffect, useState } from "react";
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
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Período padrão: do primeiro dia do mês atual até o último dia do mês atual
  const defaultRange: DateRange = {
    from: new Date(currentYear, currentMonth, 1), // Garantindo que é o mês atual
    to: endOfMonth(new Date(currentYear, currentMonth, 1)) // Final do mês atual
  };
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultRange);
  const [presetOpen, setPresetOpen] = useState(false);
  
  // Aplicar novo período e enviar para o componente pai
  const applyDateRange = (range: DateRange | undefined) => {
    if (!range?.from) {
      setDateRange(range);
      return;
    }
    
    // Armazenar o range selecionado pelo usuário sem forçar o mês atual
    setDateRange(range);
    
    // Enviar para o componente pai o range selecionado
    onDateRangeChange({ 
      from: range.from, 
      to: range.to || range.from 
    });
  };
  
  // Quando o componente for montado, enviar o período inicial para o componente pai
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      // Usar o período padrão na inicialização, sem forçar alterações
      onDateRangeChange({
        from: dateRange.from,
        to: dateRange.to
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Mostra o nome do período selecionado ou as datas
  const getDisplayText = () => {
    if (!dateRange?.from) return "Selecionar período";
    
    // Verificar se é o mês atual completo
    const isCurrentMonth = 
      dateRange.from.getTime() === new Date(today.getFullYear(), today.getMonth(), 1).getTime() && 
      dateRange.to?.getTime() === endOfMonth(today).getTime();
    if (isCurrentMonth) return "Mês Atual";
    
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
      name: "Mês Atual", 
      handler: () => {
        const range = { 
          from: new Date(currentYear, currentMonth, 1),
          to: endOfMonth(new Date(currentYear, currentMonth, 1)) 
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
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker
        dateRange={dateRange}
        onDateRangeChange={applyDateRange}
        className="w-full xs:w-auto min-w-[220px] transition-all duration-300 shadow-sm rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
      />
      
      <PositionedPopover
        trigger={
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 items-center h-9 shadow-sm rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary/50 transition-all duration-300"
          >
            <Calendar className="h-4 w-4 text-primary mr-1 hidden xs:inline-block" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline-block">Períodos</span>
            <ChevronDown className="h-4 w-4 text-primary" />
          </Button>
        }
        align="end"
      >
        <div className="p-3 w-[220px] bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm mb-3 font-medium px-2 text-primary border-b border-gray-100 dark:border-gray-700 pb-2">Períodos Rápidos</p>
          <div className="space-y-1">
            {periodPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={preset.handler}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors duration-200 flex items-center"
              >
                <Calendar className="h-4 w-4 text-primary mr-2" />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </PositionedPopover>
    </div>
  );
} 