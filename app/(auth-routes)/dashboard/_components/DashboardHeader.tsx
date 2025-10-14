"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/app/_hooks/useAuth";
import { Calendar, User, ChevronDown, CalendarDays, BarChart2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { env } from "@/app/_lib/env";
// Hook removido para evitar requisições duplicadas

interface DashboardHeaderProps {
  title: string;
  description?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

export function DashboardHeader({ title, description, dateRange, onRefresh, isRefreshing: externalIsRefreshing }: DashboardHeaderProps) {
  const router = useRouter();
  const [internalIsRefreshing, setInternalIsRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const userName = user?.name || "Usuário";
  const [showFullInfo, setShowFullInfo] = useState(false);
  
  // Usar o estado de refresh externo se fornecido, senão usar o interno
  const isRefreshing = externalIsRefreshing !== undefined ? externalIsRefreshing : internalIsRefreshing;
  // Estado para controlar a largura da tela, inicialmente null para evitar hydration mismatch
  const [screenWidth, setScreenWidth] = useState<number | null>(null);
  const isMobileView = screenWidth !== null && screenWidth < 640;

  const handleRefresh = async () => {
    if (onRefresh) {
      // Usar a função de refresh externa se fornecida
      try {
        await onRefresh();
        toast.success("Dados atualizados com sucesso!", {
          description: "Os dados foram recarregados sem cache."
        });
      } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        toast.error("Erro ao atualizar os dados", {
          description: "Tente novamente em alguns instantes."
        });
      }
    } else {
      // Fallback para o comportamento antigo se não houver função externa
      console.log('⚠️ DashboardHeader: Nenhuma função de refresh fornecida')
      toast.info("Função de refresh não configurada", {
        description: "Configure a função onRefresh no DashboardHeader."
      });
    }
  };

  // Atualizar a data a cada 5 minutos (reduzido para evitar conflitos)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 300000); // 5 minutos em vez de 1 minuto

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
    <div className="ios26-card mb-6 ios26-animate-fade-in relative z-10">
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-4">
          {/* Título e ícones do usuário */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
                    <BarChart2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  {title}
                </h1>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  title={isRefreshing ? "Atualizando dados..." : "Atualizar dados sem cache"}
                >
                  <RefreshCw className={`h-4 w-4 text-foreground transition-transform duration-200 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                </button>
              </div>
              {description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            
            <div 
              className="flex items-center gap-2.5 bg-muted rounded-xl px-3 py-2 text-foreground text-sm cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => setShowFullInfo(!showFullInfo)}
            >
              <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="truncate max-w-[150px]">{userName}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFullInfo ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          {/* Informações adicionais (expansíveis em mobile) */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all overflow-hidden ${showFullInfo ? 'max-h-40' : 'max-h-0 sm:max-h-40'}`}>
            {/* Data atual */}
            <div className="bg-muted rounded-xl px-3 py-2.5 flex items-center gap-2.5">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Data atual</span>
                <span className="text-foreground text-sm font-semibold">
                  {/* Renderização condicional com base no estado do cliente */}
                  {screenWidth === null ? capitalizedDate : (isMobileView ? shortFormattedDate : capitalizedDate)}
                </span>
              </div>
            </div>
            
            {/* Período de análise */}
            {formattedDateRange && (
              <div className="bg-muted rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                <div className="p-1.5 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg">
                  <CalendarDays className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-muted-foreground text-xs">Período de análise</span>
                  <span className="text-foreground text-sm font-semibold">{formattedDateRange}</span>
                </div>
                {isRefreshing && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Atualizando...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Barra inferior decorativa */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600"></div>
    </div>
  );
} 