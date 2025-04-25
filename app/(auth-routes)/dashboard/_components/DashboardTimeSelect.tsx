"use client";

import { Button } from "@/app/_components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Componente para seleção de período (mês e ano) no dashboard
 */
export default function DashboardTimeSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Garantir que temos valores numéricos válidos para mês e ano
  const today = new Date();
  
  // Obter mês da URL ou usar mês atual
  let monthParam = searchParams?.get("month");
  let monthValue = monthParam ? parseInt(monthParam, 10) : today.getMonth() + 1;
  
  // Validar intervalo do mês (1-12)
  if (isNaN(monthValue) || monthValue < 1 || monthValue > 12) {
    console.warn(`[DashboardTimeSelect] Mês inválido: ${monthParam}, usando mês atual`);
    monthValue = today.getMonth() + 1;
  }
  
  // Obter ano da URL ou usar ano atual
  let yearParam = searchParams?.get("year");
  let yearValue = yearParam ? parseInt(yearParam, 10) : today.getFullYear();
  
  // Validar intervalo do ano (1900-2100)
  if (isNaN(yearValue) || yearValue < 1900 || yearValue > 2100) {
    console.warn(`[DashboardTimeSelect] Ano inválido: ${yearParam}, usando ano atual`);
    yearValue = today.getFullYear();
  }
  
  console.log(`[DashboardTimeSelect] Exibindo período: mês=${monthValue}, ano=${yearValue}`);
  
  // Criar data com o mês selecionado e o ano dos parâmetros
  const currentDate = new Date(yearValue, monthValue - 1, 1);

  // Função para navegar para o mês anterior
  const goToPreviousMonth = () => {
    let newMonth = monthValue - 1;
    let newYear = yearValue;
    
    // Se estamos em janeiro, voltar para dezembro do ano anterior
    if (newMonth < 1) {
      newMonth = 12;
      newYear = yearValue - 1;
    }
    
    console.log(`[DashboardTimeSelect] Navegando para o mês anterior: ${newMonth}/${newYear}`);
    router.push(`/dashboard?month=${newMonth}&year=${newYear}`);
  };
  
  // Função para navegar para o próximo mês
  const goToNextMonth = () => {
    let newMonth = monthValue + 1;
    let newYear = yearValue;
    
    // Se estamos em dezembro, avançar para janeiro do próximo ano
    if (newMonth > 12) {
      newMonth = 1;
      newYear = yearValue + 1;
    }
    
    console.log(`[DashboardTimeSelect] Navegando para o próximo mês: ${newMonth}/${newYear}`);
    router.push(`/dashboard?month=${newMonth}&year=${newYear}`);
  };
  
  // Função para ir para o mês atual
  const goToCurrentMonth = () => {
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    console.log(`[DashboardTimeSelect] Navegando para o mês atual: ${currentMonth}/${currentYear}`);
    router.push(`/dashboard?month=${currentMonth}&year=${currentYear}`);
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