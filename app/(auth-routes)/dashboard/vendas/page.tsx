"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { PageContainer } from "@/app/_components/page-container";
import { DashboardSummary } from "./components/DashboardSummary";
import { VendedoresChart } from "./components/VendedoresChart";
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

// Importamos os componentes refatorados
import { VendedorDetalhesModal } from "./components/VendedorDetalhesModal";
import { VendaDetalheModal } from "./components/VendaDetalheModal";
import { ProdutosMaisVendidos } from "./components/ProdutosMaisVendidos";
import { VendasPorDiaChart } from "./components/VendasPorDiaChart";
import { VendasPorFormaPagamentoChart } from "./components/VendasPorFormaPagamentoChart";

// Componentes para tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";

// Componente com carregamento lazy para otimizar a renderização inicial
const LazyProdutosMaisVendidos = React.lazy(() => import('./components/ProdutosMaisVendidos').then(mod => ({ default: mod.ProdutosMaisVendidos })));
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

export default function DashboardVendas() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Período de datas padrão: mês atual completo (abril), garantindo que começa no dia 1
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
      
      // Armazenar em cache
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
  
  // Renderização do seletor de datas
  const renderDateRangeSelector = useMemo(() => (
    <div className="flex justify-end w-full mb-4">
      <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
    </div>
  ), [handleDateRangeChange]);
  
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

  // Handler para upload de foto (necessário para o RankingVendedoresPodium)
  const handleAbrirUploadFoto = useCallback((vendedor: Vendedor) => {
    // Aqui você pode implementar a lógica para abrir o modal de upload de foto
    // ou apenas usar o mesmo modal de detalhes do vendedor como fallback
    handleOpenVendedorDetails(vendedor);
  }, [handleOpenVendedorDetails]);
  
  // Handler para trocar de tab - com lazy loading
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);
  
  return (
    <PageContainer
      title="Dashboard de Vendas"
      description="Visualize e analise dados de vendas, atendimentos e performance."
      actions={renderDateRangeSelector}
    >
      <div className="grid gap-6">
        {/* Sumário do dashboard */}
        {loading ? (
          <Card className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-[#faba33]/20">
            <CardContent className="pt-6">
              <div className="flex justify-center items-center h-[100px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DashboardSummary totais={dadosSummary} metas={metasAtuais} vendedores={vendedores} />
        )}
      
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="ranking" onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="ranking">Ranking de Vendas</TabsTrigger>
                <TabsTrigger value="produtos">Produtos Mais Vendidos</TabsTrigger>
                <TabsTrigger value="como-nos-conheceu">Como nos Conheceu</TabsTrigger>
              </TabsList>
              
              <TabsContent value="ranking" className="mt-4">
                <div className="grid grid-cols-1 gap-6">
                  {loadingVendedores ? (
                    <Card>
                      <CardHeader>
                        <CardDescription>
                          Carregando dados...
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[500px]">
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4"></div>
                            <p className="text-muted-foreground">Carregando dados de vendedores...</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : erroVendedores ? (
                    <Card>
                      <CardHeader>
                        <CardDescription>
                          Erro ao carregar dados
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[500px]">
                        <div className="flex items-center justify-center h-full text-red-500">
                          <p>{erroVendedores}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Componente RankingVendedoresPodium com React.memo para evitar re-renderizações desnecessárias */}
                      <Card>
                        <RankingVendedoresPodium 
                          vendedores={vendedores}
                          onUploadFoto={handleAbrirUploadFoto}
                          onVendedorClick={handleOpenVendedorDetails}
                          erro={erroVendedores}
                        />
                      </Card>
                      
                      {/* Componente VendedoresChart com lazy loading e suspense */}
                      <Suspense fallback={
                        <Card>
                          <div className="flex items-center justify-center h-96">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
                          </div>
                        </Card>
                      }>
                        <Card>
                          <VendedoresChart 
                            vendedores={vendedores} 
                          />
                        </Card>
                      </Suspense>
                      
                      {/* Tabela de vendedores */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Listagem de Vendedores</CardTitle>
                          <CardDescription>
                            Detalhes de vendas por vendedor no período de {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} a {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <VendedoresTable 
                            vendedores={vendedores} 
                            onClickVendedor={handleOpenVendedorDetails}
                          />
                        </CardContent>
                      </Card>
                      
                      {/* Gráfico de vendas por dia */}
                      <Suspense fallback={
                        <Card>
                          <div className="flex items-center justify-center h-96">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
                          </div>
                        </Card>
                      }>
                        <VendasPorDiaChart
                          dataInicio={dateRange.from}
                          dataFim={dateRange.to}
                        />
                      </Suspense>
                      
                      {/* Gráfico de vendas por forma de pagamento */}
                      <Suspense fallback={
                        <Card>
                          <div className="flex items-center justify-center h-96">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
                          </div>
                        </Card>
                      }>
                        <VendasPorFormaPagamentoChart
                          dataInicio={dateRange.from}
                          dataFim={dateRange.to}
                        />
                      </Suspense>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="produtos" className="mt-4">
                {activeTab === "produtos" ? (
                  <Suspense fallback={
                    <Card>
                      <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
                      </div>
                    </Card>
                  }>
                    <LazyProdutosMaisVendidos
                      dataInicio={dateRange.from}
                      dataFim={dateRange.to}
                    />
                  </Suspense>
                ) : null}
              </TabsContent>
              
              <TabsContent value="como-nos-conheceu" className="mt-4">
                {activeTab === "como-nos-conheceu" ? (
                  <Suspense fallback={
                    <Card>
                      <div className="flex items-center justify-center h-96">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
                      </div>
                    </Card>
                  }>
                    <LazyComoNosConheceuProdutos
                      dataInicio={dateRange.from}
                      dataFim={dateRange.to}
                    />
                  </Suspense>
                ) : null}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Modais de detalhes */}
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