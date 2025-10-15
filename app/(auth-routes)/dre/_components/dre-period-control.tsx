"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { format, addMonths, subMonths, addYears, subYears, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DREPeriodControlProps {
  period: "month" | "year";
  date: Date;
  onPeriodChange: (period: "month" | "year") => void;
  onDateChange: (date: Date) => void;
}

/**
 * Componente para controle de período do DRE
 */
export function DREPeriodControl({
  period,
  date,
  onPeriodChange,
  onDateChange,
}: DREPeriodControlProps) {
  // Estado local para data e período
  const [currentDate, setCurrentDate] = useState(date);
  const [currentPeriod, setCurrentPeriod] = useState<"month" | "year">(period);
  
  // Atualiza estado local quando as props mudam
  useEffect(() => {
    setCurrentDate(date);
    setCurrentPeriod(period);
  }, [date, period]);
  
  // Formatar a data de acordo com o período
  const formattedDate = period === "month"
    ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
    : format(currentDate, "yyyy", { locale: ptBR });
  
  // Função para navegar para o período anterior
  const goToPreviousPeriod = () => {
    const newDate = currentPeriod === "month"
      ? subMonths(currentDate, 1)
      : subYears(currentDate, 1);
    
    setCurrentDate(newDate);
    onDateChange(newDate);
  };
  
  // Função para navegar para o próximo período
  const goToNextPeriod = () => {
    const newDate = currentPeriod === "month"
      ? addMonths(currentDate, 1)
      : addYears(currentDate, 1);
    
    setCurrentDate(newDate);
    onDateChange(newDate);
  };
  
  // Função para mudar o tipo de período
  const handlePeriodChange = (value: string) => {
    const newPeriod = value as "month" | "year";
    
    // Ajustar a data para o início do período selecionado
    let newDate;
    if (newPeriod === "month") {
      newDate = startOfMonth(currentDate);
    } else {
      newDate = startOfYear(currentDate);
    }
    
    setCurrentPeriod(newPeriod);
    setCurrentDate(newDate);
    
    onPeriodChange(newPeriod);
    onDateChange(newDate);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Select value={currentPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Mensal</SelectItem>
          <SelectItem value="year">Anual</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousPeriod}
          aria-label="Período anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="px-4 font-medium min-w-[180px] text-center">
          {formattedDate}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextPeriod}
          aria-label="Próximo período"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 
