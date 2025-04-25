"use client";

import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Calendar, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/_lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarComponent } from "./ui/calendar";
import { normalizarPeriodo } from "@/app/_lib/bb-integration/utils";
import { Alert, AlertDescription } from "./ui/alert";
import { useRouter, useSearchParams } from "next/navigation";

// TimeSelect original para compatibilidade com a página existente
export default function TimeSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams?.get("month") || new Date().getMonth() + 1;
  
  // Usar o ano da URL ou o ano atual como fallback
  const year = searchParams?.get("year") || new Date().getFullYear();
  const currentYear = Number(year);
  const currentMonth = Number(month);
  
  // Criar data com o mês selecionado e o ano dos parâmetros
  const currentDate = new Date(currentYear, currentMonth - 1, 1);

  // Função para navegar para o mês anterior
  const goToPreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    
    // Se estamos em janeiro, voltar para dezembro do ano anterior
    if (newMonth < 1) {
      newMonth = 12;
      newYear = currentYear - 1;
    }
    
    router.push(`?month=${newMonth}&year=${newYear}`);
  };
  
  // Função para navegar para o próximo mês
  const goToNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    
    // Se estamos em dezembro, avançar para janeiro do próximo ano
    if (newMonth > 12) {
      newMonth = 1;
      newYear = currentYear + 1;
    }
    
    router.push(`?month=${newMonth}&year=${newYear}`);
  };
  
  // Função para ir para o mês atual
  const goToCurrentMonth = () => {
    const today = new Date();
    router.push(`?month=${today.getMonth() + 1}&year=${today.getFullYear()}`);
  };

  return (
    <div className="flex items-center bg-background border rounded-lg px-2 shadow-sm hover:border-primary/20 transition duration-200 w-[240px]">
      <Button
        variant="ghost"
        size="icon"
        onClick={goToPreviousMonth}
        className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div 
        className="flex items-center px-3 py-1 group cursor-pointer flex-1 justify-center" 
        onClick={goToCurrentMonth}
        title="Voltar para o mês atual"
      >
        <Calendar className="h-4 w-4 mr-2 text-primary/60 group-hover:text-primary transition-colors" />
        <span className="capitalize font-medium text-sm whitespace-nowrap">
          {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={goToNextMonth}
        className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
        aria-label="Próximo mês"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Versão aprimorada do TimeSelect com intervalo de datas e limitação de datas futuras
interface TimeSelectRangeProps {
  startDate: Date;
  endDate: Date;
  onChange: (startDate: Date, endDate: Date) => void;
  className?: string;
}

export function TimeSelectRange({ 
  startDate, 
  endDate, 
  onChange, 
  className
}: TimeSelectRangeProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: startDate,
    to: endDate,
  });
  
  const [showFutureWarning, setShowFutureWarning] = useState(false);
  
  // Função para ir para o mês anterior
  const goToPreviousMonth = () => {
    const currentDate = new Date(dateRange.from);
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
    
    // Calcular a nova data final, mantendo a mesma duração do intervalo
    let newEndDate;
    if (dateRange.to) {
      const durationInDays = Math.floor((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      newEndDate = new Date(newDate);
      newEndDate.setDate(newDate.getDate() + durationInDays);
    }
    
    const { dataInicio, dataFim } = normalizarPeriodo(newDate, newEndDate || newDate);
    setDateRange({ from: dataInicio, to: dataFim });
    onChange(dataInicio, dataFim);
  };
  
  // Função para ir para o próximo mês
  const goToNextMonth = () => {
    const currentDate = new Date(dateRange.from);
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate());
    
    // Calcular a nova data final, mantendo a mesma duração do intervalo
    let newEndDate;
    if (dateRange.to) {
      const durationInDays = Math.floor((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      newEndDate = new Date(newDate);
      newEndDate.setDate(newDate.getDate() + durationInDays);
    }
    
    const { dataInicio, dataFim } = normalizarPeriodo(newDate, newEndDate || newDate);
    setDateRange({ from: dataInicio, to: dataFim });
    onChange(dataInicio, dataFim);
  };
  
  // Função para ir para o mês atual
  const goToCurrentMonth = () => {
    const today = new Date();
    const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const { dataInicio, dataFim } = normalizarPeriodo(firstDayMonth, lastDayMonth);
    setDateRange({ from: dataInicio, to: dataFim });
    onChange(dataInicio, dataFim);
  };
  
  useEffect(() => {
    // Verificar se a data final é no futuro (comparando apenas as datas, sem considerar a hora)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const endDateCopy = new Date(endDate);
    endDateCopy.setHours(0, 0, 0, 0);
    
    setShowFutureWarning(endDateCopy > now);
    
    // Normalizar o período para garantir que não haja datas no futuro
    const { dataInicio, dataFim } = normalizarPeriodo(startDate, endDate);
    
    // Só atualizar se as datas forem diferentes
    if (dataInicio.getTime() !== startDate.getTime() || dataFim.getTime() !== endDate.getTime()) {
      setDateRange({
        from: dataInicio,
        to: dataFim,
      });
      
      // Notificar o componente pai sobre a mudança
      onChange(dataInicio, dataFim);
    }
  }, [startDate, endDate, onChange]);
  
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex items-center bg-background border rounded-lg px-2 shadow-sm hover:border-primary/20 transition duration-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <div 
              className="flex items-center px-3 py-1 group cursor-pointer" 
              title="Selecionar intervalo de datas"
            >
              <Calendar className="h-4 w-4 mr-2 text-primary/60 group-hover:text-primary transition-colors" />
              <span className="capitalize font-medium text-sm whitespace-nowrap">
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })}
                      {" - "}
                      {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                  )
                ) : (
                  "Selecione um período"
                )}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[660px] p-0 shadow-lg border-primary/10 rounded-xl overflow-hidden" 
            align="start"
          >
            <div className="bg-gradient-to-br from-primary/5 to-transparent p-2 border-b">
              <h3 className="font-medium text-center text-sm">
                Selecione um intervalo de datas
              </h3>
            </div>
            <div className="calendar-wrapper max-w-[660px] [&_.rdp-months]:justify-center [&_.rdp-caption]:text-lg [&_.rdp-caption]:font-medium [&_.rdp-day_today]:font-bold [&_.rdp-day_today]:border [&_.rdp-day_today]:border-primary [&_.rdp-day_today]:text-primary [&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground [&_.rdp-day_selected]:font-bold [&_.rdp-day_range_start]:rounded-l-md [&_.rdp-day_range_end]:rounded-r-md [&_.rdp-day_range_middle]:bg-primary/20">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from) {
                    const fromDate = range.from;
                    // Se não houver data final, usar a data inicial
                    const toDate = range.to || range.from;
                    
                    // Normalizar o período para garantir que não tenhamos datas no futuro
                    const { dataInicio, dataFim } = normalizarPeriodo(fromDate, toDate);
                    
                    setDateRange({
                      from: dataInicio,
                      to: dataFim,
                    });
                    
                    // Notificar o componente pai
                    onChange(dataInicio, dataFim);
                    
                    // Verificar se a data selecionada pelo usuário está no futuro
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    
                    const toDateCopy = new Date(toDate);
                    toDateCopy.setHours(0, 0, 0, 0);
                    
                    setShowFutureWarning(toDateCopy > now);
                  }
                }}
                numberOfMonths={1}
                locale={ptBR}
                className="rounded-md"
              />
            </div>
            <div className="p-2 border-t border-primary/10 bg-muted/30 flex justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const today = new Date();
                  const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  
                  const { dataInicio, dataFim } = normalizarPeriodo(firstDayMonth, lastDayMonth);
                  
                  setDateRange({
                    from: dataInicio,
                    to: dataFim,
                  });
                  
                  onChange(dataInicio, dataFim);
                }}
                className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                Este mês
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  const today = new Date();
                  
                  setDateRange({
                    from: today,
                    to: today,
                  });
                  
                  onChange(today, today);
                }}
                className="text-xs text-primary hover:text-primary/80 hover:bg-primary/10"
              >
                Hoje
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {showFutureWarning && (
        <Alert variant="destructive" className="mt-2 bg-amber-50 border-amber-200 text-amber-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            O período selecionado inclui datas futuras. As consultas serão limitadas até a data atual.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 