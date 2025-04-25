import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { parse, subMonths, isEqual, isValid } from "date-fns";
import { useSearchParams } from "next/navigation";

export function useDateRange() {
  const searchParams = useSearchParams();
  
  // Obter parâmetros da URL
  const dataInicioParam = searchParams?.get("dataInicio") || null;
  const dataFimParam = searchParams?.get("dataFim") || null;
  
  // Datas padrão: Último mês até hoje
  const dataHoje = new Date();
  const dataUltimoMes = subMonths(dataHoje, 1);
  
  // Converter parâmetros de URL para objetos Date
  const parseDate = (dateString: string | null, defaultDate: Date): Date => {
    if (!dateString) return defaultDate;
    
    try {
      const parsedDate = parse(dateString, "yyyy-MM-dd", new Date());
      
      // Verificar apenas se a data é válida
      if (!isValid(parsedDate)) {
        console.warn(`Data inválida: ${dateString}, usando data padrão.`);
        return defaultDate;
      }
      
      return parsedDate;
    } catch (error) {
      console.error(`Erro ao analisar data ${dateString}:`, error);
      return defaultDate;
    }
  };
  
  const dataInicio = parseDate(dataInicioParam, dataUltimoMes);
  const dataFim = parseDate(dataFimParam, dataHoje);
  
  // Configurar o intervalo de datas inicial baseado nos parâmetros da URL
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: dataInicio,
    to: dataFim,
  });
  
  // Atualizar o estado dateRange quando os parâmetros da URL mudarem
  useEffect(() => {
    if (!dataInicioParam && !dataFimParam) return;
    
    const newFrom = parseDate(dataInicioParam, dataUltimoMes);
    const newTo = parseDate(dataFimParam, dataHoje);
    
    // Verificar se as datas realmente mudaram antes de atualizar o estado
    if (dateRange?.from && dateRange?.to) {
      const fromChanged = !isEqual(dateRange.from, newFrom);
      const toChanged = !isEqual(dateRange.to, newTo);
      
      if (!fromChanged && !toChanged) return;
    }
    
    setDateRange({
      from: newFrom,
      to: newTo
    });
  }, [dataInicioParam, dataFimParam]);
  
  return {
    dateRange,
    setDateRange
  };
} 