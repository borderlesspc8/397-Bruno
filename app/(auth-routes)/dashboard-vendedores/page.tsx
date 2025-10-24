"use client";

// ATENÇÃO: CACHE SUSPENSO TEMPORARIAMENTE
// Os dados do dashboard de vendas estão sendo buscados diretamente do Gestão Click
// sem utilizar o cache do Supabase. Para reativar o cache, reverter as alterações
// nos arquivos: GestaoClickSupabaseService, API routes e hooks.

import React, { useState, useCallback, Suspense, useMemo, useEffect } from "react";
import { PageContainer } from "@/app/_components/page-container";
import { DashboardSummary } from "./components/DashboardSummary";
import RankingVendedoresPodium from "../dashboard/vendedores/components/RankingVendedoresPodium";
import { DateRangeSelector } from "./_components/DateRangeSelector";
import { SituacaoFilter } from "./components/SituacaoFilter";
import { format, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calcularVariacaoPercentual } from "@/app/_utils/calculoFinanceiro";
import { BarChart2 } from "lucide-react";
import { DashboardHeader } from "@/app/(auth-routes)/dashboard/_components/DashboardHeader";
import dynamic from "next/dynamic";
import { useAuth } from "@/app/_hooks/useAuth";
import { useGestaoClickSupabase } from "@/app/_hooks/useGestaoClickSupabase";
import { useMetas } from "@/app/_hooks/useMetas";
import { createClient } from "@/app/_lib/supabase";
import { VendorRouteProtection } from "@/app/_components/VendorRouteProtection";

// Criar instância única do Supabase
const supabase = createClient();

// Importar tipos centralizados
import { VendaItem, Meta, RespostaAPI } from './types';

// Importamos os componentes refatorados
import { VendedorDetalhesModal } from "./components/VendedorDetalhesModal";
import { VendaDetalheModal } from "./components/VendaDetalheModal";
import { VendasPorDiaCard } from "./components/VendasPorDiaCard";
import { VendedoresChartImproved } from "./components/VendedoresChartImproved";
import { MobileRankingVendedores } from "./components/MobileRankingVendedores";
import { ApiErrorAlert } from "./components/ApiErrorAlert";


// Função para buscar dados com cache
const fetchSemCache = async (endpoint: string, params: Record<string, string>) => {
  const url = `${endpoint}?${new URLSearchParams(params)}`;
  const response = await fetch(url, { cache: 'no-store' });
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

export default function DashboardVendedores() {
  const { user, loading: authLoading } = useAuth();
  const { metas, loading: isLoadingMetas } = useMetas();
  
  // Logs detalhados para debug - OTIMIZADO
  useEffect(() => {
    if (user?.id) { // Só logar quando tiver usuário
      console.log("=== DASHBOARD VENDEDORES - DEBUG ===");
      console.log("User ID:", user.id);
      console.log("User Email:", user.email);
      console.log("=================================");
    }
  }, [user?.id]); // Só depender do ID para evitar logs desnecessários

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Período de datas padrão: do dia 1 até o dia atual (evita problemas de cache)
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const from = new Date(currentYear, currentMonth, 1);
    const to = new Date(today);
    return { from, to };
  });
  
  // Metas reais do banco de dados
  const metasAtuais = useMemo(() => {
    if (!metas || metas.length === 0) {
      // Fallback para metas padrão se não houver metas no banco
      const mesAtual = new Date().getMonth() + 1;
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
      
      return metasPadrao[mesAtual as keyof typeof metasPadrao] || {
        metaMensal: 50000,
        metaSalvio: 30000,
        metaCoordenador: 40000
      };
    }
    
    // Encontrar a meta para o mês atual
    const hoje = new Date();
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    let metaDoMesAtual = metas.find((meta) => {
      const mesRef = new Date(meta.mesReferencia);
      return mesRef.getMonth() === mesAtual.getMonth() && 
             mesRef.getFullYear() === mesAtual.getFullYear();
    });
    
    // Se não encontrar meta para o mês atual, pega a meta mais recente
    if (!metaDoMesAtual && metas.length > 0) {
      metaDoMesAtual = metas.sort((a, b) => 
        new Date(b.mesReferencia).getTime() - new Date(a.mesReferencia).getTime()
      )[0];
    }
    
    if (metaDoMesAtual) {
      console.log('🎯 Meta encontrada:', {
        mes: metaDoMesAtual.mesReferencia,
        metaMensal: metaDoMesAtual.metaMensal,
        metaSalvio: metaDoMesAtual.metaSalvio,
        metaCoordenador: metaDoMesAtual.metaCoordenador
      });
      
      return {
        metaMensal: metaDoMesAtual.metaMensal,
        metaSalvio: metaDoMesAtual.metaSalvio,
        metaCoordenador: metaDoMesAtual.metaCoordenador
      };
    }
    
    // Fallback final
    return {
      metaMensal: 50000,
      metaSalvio: 30000,
      metaCoordenador: 40000
    };
  }, [metas]);

  // Usar o userId do hook useAuth em vez de buscar separadamente
  const userId = user?.id || null;

  // Callback memoizado para atualizar o período de datas
  const handleDateRangeChange = useCallback((range: { from: Date; to: Date }) => {
    setDateRange(prevRange => {
      // Só atualizar se realmente mudou
      if (prevRange.from.getTime() === range.from.getTime() && 
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
    dataInicio: dateRange.from,
    dataFim: dateRange.to,
    userId: userId || '',
    autoRefresh: true, // REATIVADO COM CONTROLE OTIMIZADO
    refreshInterval: 60000, // 1 minuto para dados frescos
    forceUpdate: false, // Usar cache otimizado
    enabled: !!userId && !authLoading
  });
  
  // Estados para gerenciar modais
  const [modalAberto, setModalAberto] = useState(false);
  const [vendaModalAberto, setVendaModalAberto] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<any>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<VendaItem | null>(null);
  
  
  // Estado para filtro de situações - padrão: apenas "Concretizada"
  const [situacoesFiltro, setSituacoesFiltro] = useState<string[]>(["concretizada"]);
  
  // Parâmetros do período anterior - memoizado
  const previousDateParams = useMemo(() => {
    const mesAnteriorInicio = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth() - 1, 1);
    const mesAnteriorFim = endOfMonth(mesAnteriorInicio);
    return {
      dataInicio: mesAnteriorInicio,
      dataFim: mesAnteriorFim
    };
  }, [dateRange.from]);

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

  // Mapear vendedores para incluir faturamento e filtrar vendedores específicos
  const vendedoresMapeados = useMemo(() => {
    // Lista de vendedores a serem ocultados
    const vendedoresOcultos = ['FERNANDO LOYO', 'ADMINISTRATIVO'];
    
    return vendedores
      .filter(vendedor => {
        // Filtrar vendedores por nome (case insensitive)
        const nomeVendedor = vendedor.nome?.toUpperCase() || '';
        const deveOcultar = vendedoresOcultos.some(oculto => 
          nomeVendedor.includes(oculto.toUpperCase())
        );
        
        if (deveOcultar) {
          console.log(`🚫 [DashboardVendedores] Vendedor oculto: ${vendedor.nome}`);
        }
        
        return !deveOcultar;
      })
      .map(vendedor => ({
        ...vendedor,
        faturamento: vendedor.valor || 0
      }));
  }, [vendedores]);

  // Log para debug das vendas
  useEffect(() => {
    if (vendas && vendas.length > 0) {
      console.log('📦 [page.tsx] Vendas disponíveis para componentes filhos:', {
        totalVendas: vendas.length,
        primeirasVendas: vendas.slice(0, 3).map(v => ({
          id: v.id,
          canal_venda: v.canal_venda,
          origem: v.origem,
          como_nos_conheceu: v.como_nos_conheceu,
          metadata: v.metadata ? {
            canal_venda: v.metadata.canal_venda,
            origem: v.metadata.origem,
            como_nos_conheceu: v.metadata.como_nos_conheceu,
          } : null,
          valor_total: v.valor_total,
          // Mostrar TODOS os campos disponíveis
          todosOsCampos: Object.keys(v),
          metadataCampos: v.metadata ? Object.keys(v.metadata) : null
        }))
      });
    }
  }, [vendas]);

  // Dados do summary calculados
  const dadosSummary = useMemo(() => {
    // Cálculos financeiros - otimizados para usar apenas uma iteração
    let custoTotal = 0;
    let descontosTotal = 0;
    let fretesTotal = 0;
    
    if (vendas && Array.isArray(vendas)) {
      console.log('🔍 [DashboardVendedores] Processando vendas para cálculo financeiro:', {
        totalVendas: vendas.length,
        primeirasVendas: vendas.slice(0, 3).map(v => ({
          id: v.id,
          valor_total: v.valor_total,
          valor_custo: v.valor_custo,
          desconto_valor: v.desconto_valor,
          valor_frete: v.valor_frete
        }))
      });
      
      vendas.forEach((venda: VendaItem) => {
        custoTotal += parseFloat(String(venda.valor_custo || '0'));
        descontosTotal += parseFloat(String(venda.desconto_valor || '0'));
        fretesTotal += parseFloat(String(venda.valor_frete || '0'));
      });
      
      console.log('💰 [DashboardVendedores] Totais calculados:', {
        custoTotal,
        descontosTotal,
        fretesTotal,
        totalValor,
        lucroCalculado: totalValor - custoTotal
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
      console.log('Sincronização forçada concluída');
    } catch (error) {
      console.error('Erro na sincronização forçada:', error);
    }
  }, [forceSync]);

  // Função para refresh dos dados sem cache
  const handleRefreshData = useCallback(async () => {
    try {
      console.log('🔄 Iniciando refresh dos dados sem cache...');
      await forceSync();
      console.log('✅ Refresh concluído com sucesso');
    } catch (error) {
      console.error('❌ Erro no refresh:', error);
      throw error; // Re-throw para que o DashboardHeader possa tratar o erro
    }
  }, [forceSync]);

  // Forçar atualização dos dados para resolver problema do cache
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      console.log('🔄 Forçando atualização dos dados para resolver cache antigo...');
      handleForceSync();
    }
  }, [dateRange.from, dateRange.to, handleForceSync]);

  // Renderizar loading
  if (loading) {
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
          <ApiErrorAlert 
            error={error}
            onRetry={refresh}
            isRetrying={loading}
          />
        </div>
      </PageContainer>
    );
  }

  return (
    <VendorRouteProtection allowedRoles={['vendor', 'user', 'admin']}>
      <div style={{ overflow: 'visible', position: 'relative' }}>
        <PageContainer>
        <div className="space-y-6 ios26-animate-fade-in">
        {/* Header */}
        <div className="col-span-12">
          <DashboardHeader 
            title="Dashboard Vendedores" 
            description="Análise de desempenho e métricas de vendedores"
            dateRange={dateRange}
            onRefresh={handleRefreshData}
            isRefreshing={loading}
          />
        </div>

        {/* ===== COMPONENTES TOTALMENTE FUNCIONAIS ===== */}
        
        
        {/* Informações do período */}
        <div className="text-sm text-muted-foreground font-medium">
          Dados de {format(dateRange.from, "dd 'de' MMMM", { locale: ptBR })} até {format(dateRange.to, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
           <div className="hidden lg:block">
             <VendedoresChartImproved 
               vendedores={vendedoresMapeados}
               onVendedorClick={handleOpenVendedorDetails}
               vendas={vendas}
               totalVendas={totalVendas}
               totalValor={totalValor}
               ticketMedio={ticketMedio}
             />
           </div>
           
           <div className="lg:hidden">
             <MobileRankingVendedores 
                 vendedores={vendedoresMapeados}
               onVendedorClick={handleOpenVendedorDetails}
               vendas={vendas}
               totalVendas={totalVendas}
               totalValor={totalValor}
               ticketMedio={ticketMedio}
               />
           </div>
         </div>
        
        <div className="ios26-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl">
                <BarChart2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">
                Ranking e Vendas Diárias
              </h2>
            </div>
            
            <RankingVendedoresPodium 
              vendedores={vendedoresMapeados}
              onVendedorClick={handleOpenVendedorDetails}
              vendas={vendas}
              totalVendas={totalVendas}
              totalValor={totalValor}
              ticketMedio={ticketMedio}
            />
            
             <VendasPorDiaCard 
               dataInicio={dateRange.from}
               dataFim={dateRange.to}
               vendas={vendas}
               totalVendas={totalVendas}
               totalValor={totalValor}
             />
          </div>
        </div>

        {/* Modais */}
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
      </div>
    </VendorRouteProtection>
  );
}


