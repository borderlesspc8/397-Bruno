"use client";

// DASHBOARD DE VENDAS - DADOS EM TEMPO REAL
// Os dados são buscados diretamente do Gestão Click com configuração de cache otimizada
// para garantir dados sempre atualizados sem comprometer performance.

import React, { useState, useCallback, Suspense, useMemo, useEffect } from "react";
import { PageContainer } from "@/app/_components/page-container";
import { DashboardSummary } from "./components/DashboardSummary";
import RankingVendedoresPodium from "../vendedores/components/RankingVendedoresPodium";
import { DateRangeSelector } from "@/app/_components/dashboard-shared/components";
import { SituacaoFilter } from "./components/SituacaoFilter";
import { format, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calcularVariacaoPercentual } from "@/app/_utils/calculoFinanceiro";
import { DashboardHeader } from "@/app/(auth-routes)/dashboard/_components/DashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/_hooks/useAuth";
import { useGestaoClickSupabase } from "@/app/_hooks/useGestaoClickSupabase";
import { useMetas } from "@/app/_hooks/useMetas";
import { createClient } from "@/app/_lib/supabase";
import { AdminRouteProtection } from "@/app/_components/AdminRouteProtection";

// Criar instância única do Supabase
const supabase = createClient();

// Importar tipos centralizados
import { VendaItem, Meta, RespostaAPI } from './types';

// Componentes compartilhados (consolidados)
import { 
  VendaDetalheModal,
  VendedoresChartImproved,
  VendedorDetalhesModal
} from "@/app/_components/dashboard-shared/components";
import { VendasPorFormaPagamentoChart } from "./components/VendasPorFormaPagamentoChart";
import { VendasPorDiaCard } from "./components/VendasPorDiaCard";
import { LazyFallback } from "@/app/_components/ui/lazy-fallback";
import { ComoNosConheceuUnidade } from "./components/ComoNosConheceuUnidade";
import { CanalDeVendasUnidade } from "./components/CanalDeVendasUnidade";

// Componente com carregamento lazy para otimizar a renderização inicial
const LazyProdutosMaisVendidos = React.lazy(() => 
  import('./components/ProdutosMaisVendidos').then(mod => {
    // Verificar se o módulo e o componente existem
    if (!mod || !mod.ProdutosMaisVendidos) {
      throw new Error('ProdutosMaisVendidos component not found');
    }
    return { default: mod.ProdutosMaisVendidos };
  }).catch(error => {
    console.error('Erro ao carregar ProdutosMaisVendidos:', error);
    // Retornar um componente de fallback simples
    return { 
      default: React.memo(() => (
        <div className="p-4 text-center text-red-500">
          Erro ao carregar componente de produtos
        </div>
      ))
    };
  })
) as React.LazyExoticComponent<React.ComponentType<any>>;

  // Função para buscar dados com cache otimizado
const fetchWithCache = async (endpoint: string, params: Record<string, string>, forceRefresh = false) => {
  const url = `${endpoint}?${new URLSearchParams(params)}`;
  const cacheOptions: RequestInit = forceRefresh ? { cache: 'no-store' } : { 
    cache: 'default',
    next: { revalidate: 60 } // Cache por 1 minuto para otimizar performance
  } as RequestInit;
  const response = await fetch(url, cacheOptions);
  if (!response.ok) throw new Error('Erro ao buscar dados');
  return await response.json();
};

// Componente de carregamento para exibir durante carregamento de dados
const LoadingSkeleton = () => (
  <div className="space-y-6 ios26-animate-fade-in">
    <div className="ios26-skeleton h-[200px] w-full" />
    <div className="ios26-grid">
      <div className="ios26-skeleton h-[180px]" />
      <div className="ios26-skeleton h-[180px]" />
      <div className="ios26-skeleton h-[180px]" />
      <div className="ios26-skeleton h-[180px]" />
    </div>
  </div>
);

export default function DashboardVendas() {
  const { user, loading: authLoading } = useAuth();
  const { metas, loading: isLoadingMetas } = useMetas();
  

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Período de datas padrão: do dia 1 até o dia atual (configurado para dados em tempo real)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  
  // Inicializar dateRange com valores padrão seguros
  useEffect(() => {
    if (!dateRange) {
      const from = new Date(currentYear, currentMonth, 1);
      const to = new Date(today);
      setDateRange({ from, to });
    }
  }, [currentYear, currentMonth, today, dateRange]);
  
  // Metas reais do banco de dados - busca meta do mês selecionado no filtro
  const metasAtuais = useMemo(() => {
    if (!metas || metas.length === 0) {
      // Fallback para metas padrão se não houver metas no banco
      const mesSelecionado = dateRange?.from ? dateRange.from.getMonth() + 1 : new Date().getMonth() + 1;
      const metasPadrao = {
        1: { metaMensal: 50000, metaSalvio: 30000, metaCoordenador: 40000 },
        2: { metaMensal: 55000, metaSalvio: 35000, metaCoordenador: 45000 },
        3: { metaMensal: 60000, metaSalvio: 40000, metaCoordenador: 50000 },
        4: { metaMensal: 65000, metaSalvio: 45000, metaCoordenador: 55000 },
        5: { metaMensal: 70000, metaSalvio: 50000, metaCoordenador: 60000 },
        6: { metaMensal: 75000, metaSalvio: 55000, metaCoordenador: 65000 },
        7: { metaMensal: 80000, metaSalvio: 60000, metaCoordenador: 70000 },
        8: { metaMensal: 85000, metaSalvio: 65000, metaCoordenador: 75000 },
        9: { metaMensal: 90000, metaSalvio: 70000, metaCoordenador: 80000 },
        10: { metaMensal: 95000, metaSalvio: 75000, metaCoordenador: 85000 },
        11: { metaMensal: 100000, metaSalvio: 80000, metaCoordenador: 90000 },
        12: { metaMensal: 120000, metaSalvio: 100000, metaCoordenador: 110000 },
      };
      
      return metasPadrao[mesSelecionado as keyof typeof metasPadrao] || {
        metaMensal: 50000,
        metaSalvio: 30000,
        metaCoordenador: 40000
      };
    }
    
    // Encontrar a meta para o mês selecionado no filtro (dateRange)
    const mesSelecionado = dateRange?.from 
      ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), 1)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    let metaDoMesSelecionado = metas.find((meta) => {
      const mesRef = new Date(meta.mesReferencia);
      const match = mesRef.getMonth() === mesSelecionado.getMonth() && 
             mesRef.getFullYear() === mesSelecionado.getFullYear();
      return match;
    });
    
    // Se não encontrar meta para o mês selecionado, pega a meta mais recente
    if (!metaDoMesSelecionado && metas.length > 0) {
      metaDoMesSelecionado = metas.sort((a, b) => 
        new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
      )[0];
    }
    
    if (metaDoMesSelecionado) {
      return {
        metaMensal: metaDoMesSelecionado.metaMensal,
        metaSalvio: metaDoMesSelecionado.metaSalvio,
        metaCoordenador: metaDoMesSelecionado.metaCoordenador
      };
    }
    
    // Fallback final
    return {
      metaMensal: 50000,
      metaSalvio: 30000,
      metaCoordenador: 40000
    };
  }, [metas, dateRange?.from]);

  // Usar o userId do hook useAuth em vez de buscar separadamente
  const userId = user?.id || null;

  // Callback memoizado para atualizar o período de datas
  const handleDateRangeChange = useCallback((range: { from: Date; to: Date }) => {
    setDateRange(prevRange => {
      // Só atualizar se realmente mudou
      if (prevRange && 
          prevRange.from.getTime() === range.from.getTime() && 
          prevRange.to.getTime() === range.to.getTime()) {
        return prevRange;
      }
      return range;
    });
  }, []);

  // Hook personalizado para dados do Supabase + Gestão Click
  const {
    vendas,
    vendedores,
    produtos,
    totalVendas,
    totalValor,
    ticketMedio,
    loading,
    error,
    refresh,
    forceSync,
    isRealtimeConnected,
    lastSync,
    dataSource,
    isFromCache
  } = useGestaoClickSupabase({
    dataInicio: dateRange?.from || new Date(),
    dataFim: dateRange?.to || new Date(),
    userId: userId || '',
    autoRefresh: false, // DESABILITADO PARA EVITAR TELA BRANCA
    refreshInterval: 300000, // 5 minutos (quando reativado)
    forceUpdate: false, // Usar cache otimizado
    enabled: !!userId && !authLoading && !!dateRange
  });
  
  // Estados para gerenciar modais
  const [modalAberto, setModalAberto] = useState(false);
  const [vendaModalAberto, setVendaModalAberto] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<any>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaItem | null>(null);
  
  // Tab ativa - começa com "pagamentos" no mobile, "ranking" no desktop
  const [activeTab, setActiveTab] = useState(() => {
    // No servidor, sempre começa com "ranking" (será ajustado no cliente)
    if (typeof window === 'undefined') return "ranking";
    // No cliente, verificar se é mobile
    return window.innerWidth < 1024 ? "pagamentos" : "ranking";
  });
  
  // Detectar mobile e ajustar tab se necessário
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      // Se for mobile e a tab atual for "ranking", mudar para "pagamentos"
      if (mobile && activeTab === "ranking") {
        setActiveTab("pagamentos");
      }
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [activeTab]);
  
  // Estado para filtro de situações - padrão: apenas "Concretizada"
  const [situacoesFiltro, setSituacoesFiltro] = useState<string[]>(["concretizada"]);
  
  // Parâmetros do período anterior - memoizado
  const previousDateParams = useMemo(() => {
    if (!dateRange?.from) {
      return {
        dataInicio: new Date(),
        dataFim: new Date()
      };
    }
    
    const mesAnteriorInicio = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() - 1, 1);
    const mesAnteriorFim = endOfMonth(mesAnteriorInicio);
    return {
      dataInicio: mesAnteriorInicio,
      dataFim: mesAnteriorFim
    };
  }, [dateRange?.from]);

  // Hook para dados do período anterior - DESABILITADO PARA EVITAR LOOPS
  // const {
  //   totalVendas: totalVendasAnterior,
  //   totalValor: totalValorAnterior,
  //   ticketMedio: ticketMedioAnterior
  // } = useGestaoClickSupabase({
  //   dataInicio: previousDateParams.dataInicio,
  //   dataFim: previousDateParams.dataFim,
  //   userId: userId || '',
  //   autoRefresh: false,
  //   forceUpdate: false,
  //   enabled: false // DESABILITADO PARA EVITAR LOOPS
  // });

  // Dados fixos para evitar loops - será reativado quando necessário
  const totalVendasAnterior = 0;
  const totalValorAnterior = 0;
  const ticketMedioAnterior = 0;

  // Calcular variações percentuais
  const variacoes = useMemo(() => {
    const variacaoFaturamento = calcularVariacaoPercentual(totalValor, totalValorAnterior);
    const variacaoVendas = calcularVariacaoPercentual(totalVendas, totalVendasAnterior);
    const variacaoTicket = calcularVariacaoPercentual(ticketMedio, ticketMedioAnterior);
    
    return {
      faturamento: variacaoFaturamento,
      vendas: variacaoVendas,
      ticketMedio: variacaoTicket,
      lucro: undefined // TODO: Implementar cálculo de lucro
    };
  }, [totalValor, totalValorAnterior, totalVendas, totalVendasAnterior, ticketMedio, ticketMedioAnterior]);

  // Mapear vendedores para incluir faturamento
  const vendedoresMapeados = useMemo(() => {
    return vendedores.map(vendedor => ({
      ...vendedor,
      faturamento: vendedor.valor || 0
    }));
  }, [vendedores]);


  // Dados do summary calculados
  const dadosSummary = useMemo(() => {
    // Cálculos financeiros - otimizados para usar apenas uma iteração
    let custoTotal = 0;
    let descontosTotal = 0;
    let fretesTotal = 0;
    
    if (vendas && Array.isArray(vendas)) {
      vendas.forEach((venda: VendaItem) => {
        custoTotal += parseFloat(String(venda.valor_custo || '0'));
        descontosTotal += parseFloat(String(venda.desconto_valor || '0'));
        fretesTotal += parseFloat(String(venda.valor_frete || '0'));
      });
    }
    
    // Lucro = Faturamento - Custo - Fretes (descontos removidos)
    const lucroTotal = totalValor - custoTotal ;
    
    // Calcular margem de lucro
    const margemLucro = totalValor > 0 ? (lucroTotal / totalValor) * 100 : 0;

    return {
      faturamento: totalValor,
      vendas: totalVendas,
      ticketMedio: ticketMedio,
      lucro: lucroTotal,
      custo: custoTotal,
      descontos: descontosTotal,
      fretes: fretesTotal,
      margemLucro: margemLucro,
      variacoes
    };
  }, [totalValor, totalVendas, ticketMedio, vendas, variacoes]);
  
  
  // Abrir modal de detalhes do vendedor
  const handleOpenVendedorDetails = useCallback((vendedor: any, index?: number) => {
    // Adicionar a posição correta baseada no índice (index + 1)
    const vendedorComPosicao = {
      ...vendedor,
      posicao: index !== undefined ? index + 1 : 1
    };
    setVendedorSelecionado(vendedorComPosicao);
    setModalAberto(true);
  }, []);
  
  // Abrir modal com detalhes da venda
  const abrirDetalhesVenda = useCallback((venda: VendaItem) => {
    setVendaSelecionada(venda);
    setVendaModalAberto(true);
  }, []);

  // Função para forçar sincronização
  const handleForceSync = useCallback(async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Erro na sincronização forçada:', error);
    }
  }, [forceSync]);

  // Função para refresh dos dados com cache otimizado
  const handleRefreshData = useCallback(async () => {
    try {
      await forceSync();
    } catch (error) {
      console.error('Erro no refresh:', error);
      throw error; // Re-throw para que o DashboardHeader possa tratar o erro
    }
  }, [forceSync]);

  // Atualizar dados quando o período de datas mudar
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      handleForceSync();
    }
  }, [dateRange?.from, dateRange?.to, handleForceSync]);

  // Renderizar loading (incluindo quando dateRange não está inicializado)
  if (loading || !dateRange) {
    return (
      <PageContainer>
        <LoadingSkeleton />
      </PageContainer>
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h3 className="text-lg font-semibold text-red-800">Erro ao carregar dados</h3>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={refresh}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <AdminRouteProtection>
      <PageContainer>
        <div className="space-y-6 ios26-animate-fade-in">
        {/* Header */}
        <div className="col-span-12">
          <DashboardHeader 
            title="Dashboard de Vendas" 
            description="Análise de desempenho e métricas de vendas"
            dateRange={dateRange}
            onRefresh={handleRefreshData}
            isRefreshing={loading}
          />
        </div>

        {/* ===== COMPONENTES TOTALMENTE FUNCIONAIS ===== */}
        
        {/* Informações do período */}
        <div className="text-sm text-muted-foreground font-medium">
          Dados de {dateRange.from && format(dateRange.from, "dd 'de' MMMM", { locale: ptBR })} até {dateRange.to && format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          {situacoesFiltro.length > 0 && (
            <span className="ml-2 text-primary">
              • Filtrado por {situacoesFiltro.length} situação{situacoesFiltro.length > 1 ? 'ões' : ''}
            </span>
          )}
        </div>
        
        {/* Filtros - CORRIGIDOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
          <div className="w-full">
            <DateRangeSelector 
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange} 
            />
          </div>
          <div className="w-full">
            <SituacaoFilter 
              value={situacoesFiltro}
              onChange={setSituacoesFiltro}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-4">
          <DashboardSummary 
            totais={dadosSummary} 
            metas={metasAtuais} 
            vendedores={vendedoresMapeados} 
          />
        </div>

        <div className="ios26-grid">
          <VendedoresChartImproved 
            vendedores={vendedoresMapeados}
            onVendedorClick={handleOpenVendedorDetails}
            totalVendas={totalVendas}
            totalValor={totalValor}
            ticketMedio={ticketMedio}
            mesSelecionado={dateRange?.from}
          />
        </div>
        
        <div className="ios26-card p-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="ios26-tabs overflow-x-auto custom-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
              <TabsList className="bg-transparent h-12 p-0 lg:w-full min-w-max lg:min-w-0 justify-start space-x-4 flex-nowrap">
                <TabsTrigger 
                  value="ranking" 
                  className="ios26-tab-trigger whitespace-nowrap hidden lg:inline-flex flex-shrink-0"
                >
                  <span className="hidden xs:inline">Ranking e Vendas Diárias</span>
                  <span className="xs:hidden">Ranking</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pagamentos" 
                  className="ios26-tab-trigger whitespace-nowrap flex-shrink-0"
                >
                  Formas de Pagamento
                </TabsTrigger>
                <TabsTrigger 
                  value="produtos" 
                  className="ios26-tab-trigger whitespace-nowrap flex-shrink-0"
                >
                  Produtos Vendidos
                </TabsTrigger>
                <TabsTrigger 
                  value="origem" 
                  className="ios26-tab-trigger whitespace-nowrap flex-shrink-0"
                >
                  Como nos Conheceu
                </TabsTrigger>
                <TabsTrigger 
                  value="canal" 
                  className="ios26-tab-trigger whitespace-nowrap flex-shrink-0"
                >
                  Canal de Vendas
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="mt-6">
              <TabsContent value="ranking" className="mt-0 hidden lg:block">
                <div className="space-y-6">
                  <RankingVendedoresPodium 
                    vendedores={vendedoresMapeados}
                    onVendedorClick={handleOpenVendedorDetails}
                    totalVendas={totalVendas}
                    totalValor={totalValor}
                    ticketMedio={ticketMedio}
                  />
                  
                  {dateRange && (
                    <VendasPorDiaCard 
                      dataInicio={dateRange.from}
                      dataFim={dateRange.to}
                    />
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="pagamentos" className="mt-0">
                {dateRange && (
                  <VendasPorFormaPagamentoChart 
                    dataInicio={dateRange.from}
                    dataFim={dateRange.to}
                    vendedores={vendedoresMapeados}
                    vendas={vendas}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="produtos" className="mt-0">
                <Suspense fallback={<LazyFallback message="Carregando produtos mais vendidos..." />}>
                  {dateRange && (
                    <LazyProdutosMaisVendidos 
                      dataInicio={dateRange.from}
                      dataFim={dateRange.to}
                      onVendaClick={abrirDetalhesVenda}
                      vendas={vendas}
                    />
                  )}
                </Suspense>
              </TabsContent>
              
              <TabsContent value="origem" className="mt-0">
                {dateRange && (
                  <ComoNosConheceuUnidade 
                    dataInicio={dateRange.from}
                    dataFim={dateRange.to}
                    vendas={vendas}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="canal" className="mt-0">
                {dateRange && (
                  <CanalDeVendasUnidade 
                    dataInicio={dateRange.from}
                    dataFim={dateRange.to}
                    vendas={vendas}
                  />
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Modais */}
        {modalAberto && vendedorSelecionado && dateRange && (
          <VendedorDetalhesModal
            vendedor={vendedorSelecionado}
            aberto={modalAberto}
            onOpenChange={setModalAberto}
            onClose={() => setModalAberto(false)}
            dataInicio={dateRange.from}
            dataFim={dateRange.to}
            totalFaturamento={dadosSummary.faturamento}
            onVendaClick={abrirDetalhesVenda}
            vendasExternas={vendas}
            lastSync={lastSync}
          />
        )}
        
        {vendaModalAberto && vendaSelecionada && (
          <VendaDetalheModal
            venda={vendaSelecionada}
            aberto={vendaModalAberto}
            onOpenChange={setVendaModalAberto}
            onClose={() => setVendaModalAberto(false)}
          />
        )}

        </div>
      </PageContainer>
    </AdminRouteProtection>
  );
} 
