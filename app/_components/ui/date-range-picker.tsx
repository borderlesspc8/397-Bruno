"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { useFloating, offset, flip, shift, autoUpdate, Placement } from "@floating-ui/react";
import { Card } from "./card";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
  align?: "start" | "center" | "end";
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
  align = "start",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  // Estado local para controlar a seleção de data temporária 
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(dateRange);

  // Atualizar o estado temporário quando o dateRange mudar externamente
  React.useEffect(() => {
    setTempRange(dateRange);
  }, [dateRange]);

  // Convertendo o alinhamento em posição válida para o Floating UI
  const placement: Placement = align === "center" 
    ? "bottom" 
    : align === "end" 
      ? "bottom-end" 
      : "bottom-start";

  const { refs, x, y, strategy } = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    middleware: [
      offset(4),
      flip({
        fallbackPlacements: [align === "center" 
          ? "top" 
          : align === "end" 
            ? "top-end" 
            : "top-start"]
      }),
      shift()
    ],
    whileElementsMounted: autoUpdate
  });

  // Criando o objeto de estilo manualmente
  const floatingStyles = {
    position: strategy,
    top: y ?? 0,
    left: x ?? 0,
  };

  const formattedDateFrom = dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : "";
  const formattedDateTo = dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : "";
  
  const displayValue = dateRange?.from 
    ? dateRange.to 
      ? `${formattedDateFrom} - ${formattedDateTo}`
      : formattedDateFrom
    : "Selecionar período";

  // Função para aplicar a seleção e fechar o calendário
  const handleApply = () => {
    if (tempRange) {
      onDateRangeChange(tempRange);
    }
    setOpen(false);
  };

  // Função para lidar com a mudança temporária de seleção
  const handleRangeChange = (range: DateRange | undefined) => {
    setTempRange(range);
  };

  // Função para limpar a seleção
  const handleClear = () => {
    setTempRange(undefined);
    onDateRangeChange(undefined);
    setOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        ref={refs.setReference}
        id="date-range-picker"
        variant="outline"
        size="sm"
        className={cn(
          "justify-start text-left font-normal",
          !dateRange && "text-muted-foreground",
          className
        )}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-[#faba33]" />
        {displayValue}
      </Button>

      {open && (
        <Card
          style={{
            ...floatingStyles,
            zIndex: 50,
            position: strategy,
          }}
          className="p-4 bg-card shadow-xl border border-[#faba33]/20 rounded-lg"
        >
          <div ref={refs.setFloating}>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={tempRange?.from || dateRange?.from || new Date()}
              selected={tempRange}
              onSelect={handleRangeChange}
              numberOfMonths={1}
              locale={ptBR}
            />
            <div className="flex gap-2 mt-3 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClear}
              >
                Limpar
              </Button>
              <Button 
                variant="default" 
                size="sm"
                style={{ backgroundColor: "#faba33" }}
                onClick={handleApply}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Componente DatePickerWithRange como um alias para o DateRangePicker
// para manter compatibilidade com o DashboardWrapper
interface DatePickerWithRangeProps {
  dateRange: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

export function DatePickerWithRange({
  dateRange,
  onChange,
  className,
}: DatePickerWithRangeProps) {
  return (
    <DateRangePicker
      dateRange={dateRange}
      onDateRangeChange={onChange}
      className={className}
      align="end"
    />
  );
} 