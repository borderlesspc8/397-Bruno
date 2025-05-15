"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { PageContainer } from "@/app/_components/page-container";
import { DashboardSummary } from "./components/DashboardSummary";
import { VendedoresTable } from "./components/VendedoresTable";
import RankingVendedoresPodium from "../vendedores/components/RankingVendedoresPodium";
import { DateRangeSelector } from "./_components/DateRangeSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BetelTecnologiaService } from "@/app/_services/betelTecnologia";
import { VendedoresService } from "@/app/_services/vendedores";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { calcularLucroVendas, calcularVariacaoPercentual } from "@/app/_utils/calculoFinanceiro";
import { CalculoFinanceiroService } from "@/app/_services/calculoFinanceiroService";
import { DashboardHeader } from "@/app/(auth-routes)/dashboard/_components/DashboardHeader";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";

// Importamos os componentes refatorados
import { VendedorDetalhesModal } from "./components/VendedorDetalhesModal";
import { VendaDetalheModal } from "./components/VendaDetalheModal";
import { ProdutosMaisVendidos } from "./components/ProdutosMaisVendidos";
import { VendasPorDiaChart } from "./components/VendasPorDiaChart";
import { VendasPorFormaPagamentoChart } from "./components/VendasPorFormaPagamentoChart";
import { RankingVendedoresCard } from "./components/RankingVendedoresCard";
import { VendasPorDiaCard } from "./components/VendasPorDiaCard";
import { VendedoresChartImproved } from "./components/VendedoresChartImproved";

// Componente com carregamento lazy para otimizar a renderização inicial
const LazyProdutosMaisVendidos = React.lazy(() => 
  import('./components/ProdutosMaisVendidos').then(mod => ({ 
    default: mod.ProdutosMaisVendidos 
  }))
);
const LazyComoNosConheceuProdutos = React.lazy(() => import('./components/ComoNosConheceuProdutos').then(mod => ({ default: mod.ComoNosConheceuProdutos })));

// Cache para evitar requisições duplicadas
const dataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Interface para os dados de metas
interface Meta {
  id: string;
  mesReferencia: Date;
  metaMensal: number;
  metaSalvio: number;
  metaCoordenador: number;
  metasVendedores?: Array<{
    vendedorId: string;
    nome: string;
    meta: number;
  }>;
}

// Função para gerar chave de cache
const getCacheKey = (endpoint: string, params: Record<string, string>) => {
  return `${endpoint}?${new URLSearchParams(params).toString()}`;
};

// Função para buscar dados com cache
const fetchWithCache = async (endpoint: string, params: Record<string, string>) => {
  const cacheKey = getCacheKey(endpoint, params);
  const now = Date.now();
  
  // Verificar se temos dados em cache e se ainda são válidos
  if (dataCache.has(cacheKey)) {
    const cachedData = dataCache.get(cacheKey);
    if (now - cachedData.timestamp < CACHE_TTL) {
      return cachedData.data;
    }
  }
  
  // Se não estiver em cache ou expirado, buscar novos dados
  const response = await fetch(endpoint + '?' + new URLSearchParams(params), { 
    cache: 'no-store',
    // Timeout de 10 segundos para evitar requisições lentas
    signal: AbortSignal.timeout(10000)
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Salvar em cache
  dataCache.set(cacheKey, {
    data,
    timestamp: now
  });
  
  return data;
};

// Componente de carregamento para exibir durante carregamento de dados
const LoadingSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-[200px] w-full rounded-lg" />
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-[180px] rounded-lg" />
      <Skeleton className="h-[180px] rounded-lg" />
      <Skeleton className="h-[180px] rounded-lg" />
      <Skeleton className="h-[180px] rounded-lg" />
    </div>
  </div>
);

export default function DashboardVendas() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Período de datas padrão: mês atual completo
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(currentYear, currentMonth, 1), // Primeiro dia do mês atual
    to: endOfMonth(new Date(currentYear, currentMonth, 1)) // Último dia do mês atual
  });
  
  // Estados para dados e carregamento
  const [loading, setLoading] = useState(true);
  const [dadosSummary, setDadosSummary] = useState({
    faturamento: 0,
    vendas: 0,
    ticketMedio: 0,
    lucro: undefined as number | undefined,
    custo: undefined as number | undefined,
    descontos: undefined as number | undefined,
    fretes: undefined as number | undefined,
    margemLucro: undefined as number | undefined,
    variacoes: {
      faturamento: undefined as number | undefined,
      vendas: undefined as number | undefined,
      ticketMedio: undefined as number | undefined,
      lucro: undefined as number | undefined
    }
  });
  // Estado para armazenar as metas
  const [metasAtuais, setMetasAtuais] = useState<{
    metaMensal: number;
    metaSalvio: number;
    metaCoordenador: number;
  }>({
    metaMensal: 0,
    metaSalvio: 0,
    metaCoordenador: 0
  });

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loadingVendedores, setLoadingVendedores] = useState(true);
  const [erroVendedores, setErroVendedores] = useState<string | null>(null);
  
  // Estados para gerenciar modais
  const [modalAberto, setModalAberto] = useState(false);
  const [vendaModalAberto, setVendaModalAberto] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<any>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);
  
  // Tab ativa
  const [activeTab, setActiveTab] = useState("ranking");
  
  // Parâmetros de data formatados para requisições - memoizado para evitar recálculos
  const dateParams = useMemo(() => ({
    dataInicio: format(dateRange.from, 'yyyy-MM-dd'),
    dataFim: format(dateRange.to, 'yyyy-MM-dd')
  }), [dateRange.from, dateRange.to]);
  
  // Parâmetros do período anterior - memoizado
  const previousDateParams = useMemo(() => {
    const mesAnteriorInicio = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() - 1, 1);
    const mesAnteriorFim = endOfMonth(mesAnteriorInicio);
    return {
      dataInicio: format(mesAnteriorInicio, 'yyyy-MM-dd'),
      dataFim: format(mesAnteriorFim, 'yyyy-MM-dd')
    };
  }, [dateRange.from]);

  // Função para buscar metas do mês atual
  const fetchMetas = useCallback(async () => {
    try {
      const cacheKey = `metas:${format(dateRange.from, 'yyyy-MM')}`;
      
      if (dataCache.has(cacheKey)) {
        const cachedData = dataCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
          setMetasAtuais(cachedData.data);
          return cachedData.data;
        }
      }
      
      const response = await fetch('/api/dashboard/metas');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar metas');
      }
      
      const metas = await response.json();
      
      // Buscar a meta do mês atual
      const mesAtual = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), 1);
      const metaDoMes = metas.find((meta: Meta) => {
        const metaDate = new Date(meta.mesReferencia);
        return metaDate.getMonth() === mesAtual.getMonth() && 
               metaDate.getFullYear() === mesAtual.getFullYear();
      });
      
      let metaAtual = {
        metaMensal: 0,
        metaSalvio: 0,
        metaCoordenador: 0
      };
      
      if (metaDoMes) {
        metaAtual = {
          metaMensal: metaDoMes.metaMensal,
          metaSalvio: metaDoMes.metaSalvio,
          metaCoordenador: metaDoMes.metaCoordenador
        };
      }
      
      // Salvar em cache
      dataCache.set(cacheKey, {
        data: metaAtual,
        timestamp: Date.now()
      });
      
      setMetasAtuais(metaAtual);
      return metaAtual;
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      return {
        metaMensal: 0,
        metaSalvio: 0,
        metaCoordenador: 0
      };
    }
  }, [dateRange.from]);

  // Função otimizada para buscar vendas
  const fetchVendas = useCallback(async (params: Record<string, string>) => {
    try {
      return await fetchWithCache('/api/dashboard/vendas', params);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      return { vendas: [], totalVendas: 0, totalValor: 0 };
    }
  }, []);

  // Função otimizada para buscar vendedores
  const fetchVendedores = useCallback(async (dataInicio: Date, dataFim: Date) => {
    try {
      const cacheKey = `vendedores:${format(dataInicio, 'yyyy-MM-dd')}:${format(dataFim, 'yyyy-MM-dd')}`;
      
      if (dataCache.has(cacheKey)) {
        const cachedData = dataCache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < CACHE_TTL) {
          return cachedData.data;
        }
      }
      
      const response = await VendedoresService.buscarVendedores({ dataInicio, dataFim });
      
      // Armazenar em cache
      dataCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });
      
      return response;
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      return { vendedores: [], erro: "Erro ao buscar vendedores" };
    }
  }, []);

  // Função principal para buscar dados do dashboard - otimizada com Promise.all
  const fetchDadosDashboard = useCallback(async (dataInicio: Date, dataFim: Date) => {
    setLoading(true);
    setLoadingVendedores(true);
    
    try {
      // Buscar dados em paralelo para otimizar, incluindo as metas
      const [vendasData, vendasDataAnterior, vendedoresResponse, vendedoresAnteriorResponse, metas] = await Promise.all([
        // Dados do período atual
        fetchVendas(dateParams),
        // Dados do período anterior para comparação
        fetchVendas(previousDateParams),
        // Vendedores do período atual
        fetchVendedores(dataInicio, dataFim),
        // Vendedores do período anterior (para referência futura)
        fetchVendedores(
          new Date(dataInicio.getFullYear(), dataInicio.getMonth() - 1, 1),
          endOfMonth(new Date(dataInicio.getFullYear(), dataInicio.getMonth() - 1, 1))
        ),
        // Metas do mês atual
        fetchMetas()
      ]);

      if (vendedoresResponse.erro) {
        setErroVendedores(vendedoresResponse.erro);
        setVendedores([]);
      } else {
        setErroVendedores(null);
        
        // Adicionar os vendedores ao estado
        const vendedoresList = vendedoresResponse.vendedores || [];
        setVendedores(vendedoresList);
        
        // Memoizar os cálculos para melhorar o desempenho
        // Extrair dados do período atual
        const faturamentoAtual = vendasData.totalValor || 0;
        const vendasAtual = vendasData.totalVendas || 0;
        const ticketMedioAtual = vendasAtual > 0 ? faturamentoAtual / vendasAtual : 0;
        
        // Extrair dados do período anterior
        const faturamentoAnterior = vendasDataAnterior.totalValor || 0;
        const vendasAnterior = vendasDataAnterior.totalVendas || 0;
        const ticketMedioAnterior = vendasAnterior > 0 ? faturamentoAnterior / vendasAnterior : 0;
        
        // Calcular variações percentuais
        const variacaoFaturamento = calcularVariacaoPercentual(faturamentoAtual, faturamentoAnterior);
        const variacaoVendas = calcularVariacaoPercentual(vendasAtual, vendasAnterior);
        const variacaoTicket = calcularVariacaoPercentual(ticketMedioAtual, ticketMedioAnterior);
        
        // Usar useMemo em vez de recalcular a cada renderização
        // Cálculos financeiros - otimizados para usar apenas uma iteração
        let custoTotal = 0;
        let descontosTotal = 0;
        let fretesTotal = 0;
        
        if (vendasData.vendas && Array.isArray(vendasData.vendas)) {
          vendasData.vendas.forEach((venda: any) => {
            custoTotal += parseFloat(venda.valor_custo || 0);
            descontosTotal += parseFloat(venda.desconto_valor || 0);
            fretesTotal += parseFloat(venda.valor_frete || 0);
          });
        }
        
        // Lucro = Faturamento - Custo - Descontos + Fretes
        const lucroTotal = faturamentoAtual - custoTotal - descontosTotal + fretesTotal;
        
        // Calcular margem de lucro
        const margemLucro = faturamentoAtual > 0 ? (lucroTotal / faturamentoAtual) * 100 : 0;
        
        // Cálculos financeiros do período anterior - otimizados para usar apenas uma iteração
        let custoAnterior = 0;
        let descontosAnterior = 0;
        let fretesAnterior = 0;
        
        if (vendasDataAnterior.vendas && Array.isArray(vendasDataAnterior.vendas)) {
          vendasDataAnterior.vendas.forEach((venda: any) => {
            custoAnterior += parseFloat(venda.valor_custo || 0);
            descontosAnterior += parseFloat(venda.desconto_valor || 0);
            fretesAnterior += parseFloat(venda.valor_frete || 0);
          });
        }
        
        const lucroAnterior = faturamentoAnterior - custoAnterior - descontosAnterior + fretesAnterior;
        const variacaoLucro = calcularVariacaoPercentual(lucroTotal, lucroAnterior);
      
        // Atualizar dados do summary com as variações calculadas
        setDadosSummary({
          faturamento: faturamentoAtual,
          vendas: vendasAtual,
          ticketMedio: ticketMedioAtual,
          lucro: lucroTotal,
          custo: custoTotal,
          descontos: descontosTotal,
          fretes: fretesTotal,
          margemLucro: margemLucro,
          variacoes: {
            faturamento: variacaoFaturamento,
            vendas: variacaoVendas,
            ticketMedio: variacaoTicket,
            lucro: variacaoLucro
          }
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      setErroVendedores('Erro ao carregar dados do dashboard. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
      setLoadingVendedores(false);
    }
  }, [dateParams, previousDateParams, fetchVendas, fetchVendedores, fetchMetas]);
  
  // Efeito para carregar dados iniciais - com verificação para evitar múltiplas requisições
  useEffect(() => {
    fetchDadosDashboard(dateRange.from, dateRange.to);
    
    // Limpeza do cache a cada 5 minutos
    const cacheCleanupInterval = setInterval(() => {
      const now = Date.now();
      // Usar Array.from para evitar erro com MapIterator
      Array.from(dataCache.entries()).forEach(([key, value]) => {
        if (now - value.timestamp > CACHE_TTL) {
          dataCache.delete(key);
        }
      });
    }, CACHE_TTL);
    
    return () => clearInterval(cacheCleanupInterval);
  }, [dateRange, fetchDadosDashboard]);
  
  // Função para atualizar a seleção de datas
  const handleDateRangeChange = useCallback((newDateRange: { from: Date; to: Date }) => {
    // Atualizar o estado com as datas exatas selecionadas pelo usuário
    setDateRange(newDateRange);
    
    // Buscar dados com as novas datas
    fetchDadosDashboard(newDateRange.from, newDateRange.to);
  }, [fetchDadosDashboard]);
  
  // Abrir modal de detalhes do vendedor
  const handleOpenVendedorDetails = useCallback((vendedor: Vendedor, index?: number) => {
    setVendedorSelecionado({
      ...vendedor,
      posicao: index !== undefined ? index + 1 : 
        vendedores.findIndex(v => v.id === vendedor.id) + 1
    });
    setModalAberto(true);
  }, [vendedores]);
  
  // Abrir modal com detalhes da venda
  const abrirDetalhesVenda = useCallback((venda: any) => {
    setVendaSelecionada(venda);
    setVendaModalAberto(true);
  }, []);

  return (
    <PageContainer>
      <DashboardHeader 
        title="Dashboard de Vendas" 
        description="Análise de desempenho e métricas de vendas"
        dateRange={dateRange}
      />

      <div className="mb-3 sm:mb-4 md:mb-6 flex flex-col xs:flex-row justify-between gap-2 sm:gap-4 items-start xs:items-center">
        <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-400 w-full xs:w-auto">
          Dados de {format(dateRange.from, "dd 'de' MMMM", { locale: ptBR })} até {format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
        <div className="w-full xs:w-auto">
          <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
        </div>
      </div>
      
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <DashboardSummary 
            totais={dadosSummary} 
            metas={metasAtuais} 
            vendedores={vendedores} 
          />
          
          <div className="grid grid-cols-1 gap-3">
            {/* VendedoresChart visível apenas em telas grandes */}
            <div className="hidden lg:block">
              <VendedoresChartImproved 
                vendedores={vendedores}
                onVendedorClick={handleOpenVendedorDetails}
              />
            </div>
            
            {/* RankingVendedoresCard visível apenas em dispositivos móveis */}
            <div className="lg:hidden">
              <RankingVendedoresCard 
                vendedores={vendedores}
                onVendedorClick={handleOpenVendedorDetails}
              />
            </div>
          </div>
          
          <div className="mt-3 sm:mt-4 md:mt-6">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
                <TabsList className="bg-transparent h-10 sm:h-12 p-0 w-full justify-start space-x-2 sm:space-x-4 flex-nowrap">
                  <TabsTrigger 
                    value="ranking" 
                    className="px-1 py-2 sm:py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-medium rounded-none h-full whitespace-nowrap text-xs sm:text-sm"
                  >
                    <span className="hidden xs:inline">Ranking e Vendas Diárias</span>
                    <span className="xs:hidden">Ranking</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pagamentos" 
                    className="px-1 py-2 sm:py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-medium rounded-none h-full whitespace-nowrap text-xs sm:text-sm"
                  >
                    Formas de Pagamento
                  </TabsTrigger>
                  <TabsTrigger 
                    value="produtos" 
                    className="px-1 py-2 sm:py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:font-medium rounded-none h-full whitespace-nowrap text-xs sm:text-sm"
                  >
                    Produtos Vendidos
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="mt-3 sm:mt-4 md:mt-6">
                <TabsContent value="ranking" className="mt-0">
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <RankingVendedoresPodium 
                      vendedores={vendedores}
                      onVendedorClick={handleOpenVendedorDetails}
                    />
                    
                    {/* VendasPorDiaCard exibido em todos os dispositivos */}
                    <VendasPorDiaCard 
                      dataInicio={dateRange.from}
                      dataFim={dateRange.to}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="pagamentos" className="mt-0">
                  <VendasPorFormaPagamentoChart 
                    dataInicio={dateRange.from}
                    dataFim={dateRange.to}
                  />
                </TabsContent>
                
                <TabsContent value="produtos" className="mt-0">
                  <Suspense fallback={<LoadingSkeleton />}>
                    <LazyProdutosMaisVendidos 
                      dataInicio={dateRange.from}
                      dataFim={dateRange.to}
                      onVendaClick={abrirDetalhesVenda}
                    />
                  </Suspense>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </>
      )}
      
      {modalAberto && vendedorSelecionado && (
        <VendedorDetalhesModal
          vendedor={vendedorSelecionado}
          aberto={modalAberto}
          onOpenChange={setModalAberto}
          onClose={() => setModalAberto(false)}
          dataInicio={dateRange.from}
          dataFim={dateRange.to}
          totalFaturamento={dadosSummary.faturamento}
          onVendaClick={abrirDetalhesVenda}
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
    </PageContainer>
  );
} 