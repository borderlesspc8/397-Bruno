"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { Calendar, User, ChevronDown, CalendarDays, BarChart2 } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  dateRange?: { from: Date; to: Date };
}

export function DashboardHeader({ title, description, dateRange }: DashboardHeaderProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { data: session } = useSession();
  const userName = session?.user?.name || "Usuário";
  const [showFullInfo, setShowFullInfo] = useState(false);
  // Estado para controlar a largura da tela, inicialmente null para evitar hydration mismatch
  const [screenWidth, setScreenWidth] = useState<number | null>(null);
  const isMobileView = screenWidth !== null && screenWidth < 640;

  // Atualizar a data a cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Verificar se o dispositivo é mobile para ajustar visualização
  useEffect(() => {
    // Definir a largura inicial da tela
    setScreenWidth(window.innerWidth);
    setShowFullInfo(window.innerWidth >= 768);
    
    const checkIsMobile = () => {
      setScreenWidth(window.innerWidth);
      setShowFullInfo(window.innerWidth >= 768);
    };
    
    // Verificar quando a tela for redimensionada
    window.addEventListener('resize', checkIsMobile);
    
    // Limpar o evento quando o componente for desmontado
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const formattedDate = format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  
  // Versão mais curta da data para telas muito pequenas
  const shortFormattedDate = format(currentDate, "dd/MM/yyyy", { locale: ptBR });

  // Formatar range de datas se disponível
  const formattedDateRange = dateRange 
    ? `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md mb-4 md:mb-6 transition-all duration-300 border border-gray-200 dark:border-gray-700">
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-3">
          {/* Título e ícones do usuário */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <BarChart2 className="h-7 w-7 text-amber-500" />
                {title}
              </h1>
              {description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            
            <div 
              className="flex items-center gap-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              onClick={() => setShowFullInfo(!showFullInfo)}
            >
              <User className="h-4 w-4 text-amber-500" />
              <span className="truncate max-w-[150px]">{userName}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFullInfo ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          {/* Informações adicionais (expansíveis em mobile) */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all overflow-hidden ${showFullInfo ? 'max-h-40' : 'max-h-0 sm:max-h-40'}`}>
            {/* Data atual */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-xs">Data atual</span>
                <span className="text-gray-900 dark:text-white text-sm font-medium">
                  {/* Renderização condicional com base no estado do cliente */}
                  {screenWidth === null ? capitalizedDate : (isMobileView ? shortFormattedDate : capitalizedDate)}
                </span>
              </div>
            </div>
            
            {/* Período de análise */}
            {formattedDateRange && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2.5 flex items-center gap-2.5">
                <CalendarDays className="h-5 w-5 text-amber-500" />
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">Período de análise</span>
                  <span className="text-gray-900 dark:text-white text-sm font-medium">{formattedDateRange}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Barra inferior decorativa */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-500"></div>
    </div>
  );
} 