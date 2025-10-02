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
}

export function DashboardHeader({ title, description, dateRange }: DashboardHeaderProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { user } = useAuth();
  const userName = user?.name || "Usuário";
  const [showFullInfo, setShowFullInfo] = useState(false);
  // DESABILITADO TEMPORARIAMENTE PARA EVITAR LOOPS
  // const { refreshData } = useDashboardData(dateRange);
  const refreshData = () => {
    console.log('⚠️ refreshData desabilitado temporariamente para evitar loops');
  };
  // Estado para controlar a largura da tela, inicialmente null para evitar hydration mismatch
  const [screenWidth, setScreenWidth] = useState<number | null>(null);
  const isMobileView = screenWidth !== null && screenWidth < 640;

  const handleRefresh = async () => {
    // DESABILITADO TEMPORARIAMENTE PARA EVITAR LOOPS
    console.log('⚠️ DashboardHeader: Refresh desabilitado temporariamente para evitar loops')
    toast.info("Refresh temporariamente desabilitado", {
      description: "Sistema otimizado para evitar loops de requisições."
    });
    return;
    
    setIsRefreshing(true);
    try {
      const baseUrl = env.NEXT_PUBLIC_APP_URL;

      // Força revalidação do cache no servidor
      const response = await fetch(`/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/dashboard'
        }),
        cache: 'no-store',
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        throw new Error('Falha ao revalidar cache');
      }

      // Força o Next.js a revalidar os dados
      router.refresh();

      // Prepara os parâmetros de data
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const dataInicio = format(firstDayOfMonth, 'yyyy-MM-dd');
      const dataFim = format(lastDayOfMonth, 'yyyy-MM-dd');

      // Força uma nova requisição para todas as rotas da API com os parâmetros necessários
      const apiRoutes = [
        `${baseUrl}/api/dashboard/vendas?dataInicio=${dataInicio}&dataFim=${dataFim}&forceUpdate=true`,
        `${baseUrl}/api/dashboard/vendedores?dataInicio=${dataInicio}&dataFim=${dataFim}&forceUpdate=true`,
        `${baseUrl}/api/dashboard/atendimentos?dataInicio=${dataInicio}&dataFim=${dataFim}&forceUpdate=true`,
        `${baseUrl}/api/dashboard/consultores?dataInicio=${dataInicio}&dataFim=${dataFim}&forceUpdate=true`,
        `${baseUrl}/api/dashboard/metas?forceUpdate=true`,
        `${baseUrl}/api/user/profile?forceUpdate=true`
      ];

      // Faz requisições paralelas para todas as rotas
      await Promise.all(apiRoutes.map(route => 
        fetch(route, { 
          cache: 'no-store',
          next: { revalidate: 0 }
        })
      ));

      // Força atualização dos dados do dashboard
      refreshData();

      toast.success("Cache atualizado com sucesso!", {
        description: "Os dados foram recarregados do servidor."
      });
    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
      toast.error("Erro ao atualizar o cache", {
        description: "Tente novamente em alguns instantes."
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

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
                  className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 text-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
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
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs">Período de análise</span>
                  <span className="text-foreground text-sm font-semibold">{formattedDateRange}</span>
                </div>
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