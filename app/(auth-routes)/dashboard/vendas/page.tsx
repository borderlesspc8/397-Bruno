"use client";

import { useState, useEffect } from "react";
import { DashboardSummary } from "./components/DashboardSummary";
import { VendedoresChart } from "./components/VendedoresChart";
import { VendedoresTable } from "./components/VendedoresTable";
import RankingVendedores from "./components/RankingVendedores";
import { DateRangeSelector } from "./_components/DateRangeSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BetelTecnologiaService } from "@/app/_services/betelTecnologia";
import { VendedoresService } from "@/app/_services/vendedores";
import { Vendedor } from "@/app/_services/betelTecnologia";

// Importamos os componentes refatorados mas removemos os não utilizados
import { VendedorDetalhesModal } from "./components/VendedorDetalhesModal";
import { VendaDetalheModal } from "./components/VendaDetalheModal";
import { ProdutosMaisVendidos } from "./components/ProdutosMaisVendidos";

export default function DashboardVendas() {
  // Inicializa com o primeiro dia do mês atual até o dia atual
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return {
      from: primeiroDiaMes,
      to: hoje
    };
  });
  
  // Estados para dados e carregamento
  const [loading, setLoading] = useState(true);
  const [dadosSummary, setDadosSummary] = useState({
    faturamento: 0,
    vendas: 0,
    ticketMedio: 0,
    clientes: 0
  });
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loadingVendedores, setLoadingVendedores] = useState(true);
  const [erroVendedores, setErroVendedores] = useState<string | null>(null);
  
  // Estados para gerenciar modais
  const [modalAberto, setModalAberto] = useState(false);
  const [vendaModalAberto, setVendaModalAberto] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<any>(null);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);
  
  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      await fetchDadosDashboard(dateRange.from, dateRange.to);
    };
    fetchData();
  }, []);
  
  // Handler para mudança de período
  const handleDateRangeChange = async (range: { from: Date; to: Date }) => {
    setDateRange(range);
    await fetchDadosDashboard(range.from, range.to);
  };

  // Função para buscar todos os dados do dashboard
  const fetchDadosDashboard = async (dataInicio: Date, dataFim: Date) => {
    setLoading(true);
    setLoadingVendedores(true);
    
    try {
      // Dados de vendedores
      const vendedoresResponse = await VendedoresService.buscarVendedores({
        dataInicio,
        dataFim
      });
      
      if (vendedoresResponse.erro) {
        setErroVendedores(vendedoresResponse.erro);
        setVendedores([]);
      } else {
        setErroVendedores(null);
        
        // Verificar se Diuly está na lista de vendedores retornada pelo serviço
        const vendedoresList = vendedoresResponse.vendedores || [];
        const temDiuly = vendedoresList.some(v => v.nome.includes('Diuly'));
        console.log(`Dashboard: API retornou ${vendedoresList.length} vendedores`);
        console.log(`Dashboard: Diuly ${temDiuly ? 'ESTÁ' : 'NÃO está'} na lista de vendedores da API`);
        
        // Se a Diuly não estiver na lista mas sabemos que deveria estar, forçar sua adição
        if (!temDiuly) {
          console.log('Dashboard: Verificando se Diuly precisa ser adicionada manualmente...');
          // Isto seria apenas uma solução temporária até resolver a API
          // Não implementaremos a adição manual, pois as correções anteriores devem resolver o problema
        }
        
        // Adicionar os vendedores ao estado
        setVendedores(vendedoresList);
      
        // Atualizar dados do summary
        setDadosSummary({
          faturamento: vendedoresResponse.totalFaturamento || 0,
          vendas: vendedoresResponse.totalVendas || 0,
          ticketMedio: vendedoresResponse.totalVendas 
            ? vendedoresResponse.totalFaturamento / vendedoresResponse.totalVendas 
            : 0,
          clientes: 0 // Esse valor viria de outra API
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setErroVendedores(error instanceof Error ? error.message : 'Erro ao buscar dados');
      setVendedores([]);
    } finally {
      setLoading(false);
      setLoadingVendedores(false);
    }
  };
  
  // Abrir modal de detalhes do vendedor
  const handleOpenVendedorDetails = (vendedor: Vendedor, index?: number) => {
    setVendedorSelecionado({
      ...vendedor,
      posicao: index !== undefined ? index + 1 : 
        vendedores.findIndex(v => v.id === vendedor.id) + 1
    });
    setModalAberto(true);
  };
  
  // Abrir modal com detalhes da venda
  const abrirDetalhesVenda = (venda: any) => {
    setVendaSelecionada(venda);
    setVendaModalAberto(true);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Vendas</h1>
          <p className="text-muted-foreground">
            Visualize e analise dados de vendas, atendimentos e performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
        </div>
      </div>

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
          <DashboardSummary totais={dadosSummary} />
        )}
      
        <div className="grid grid-cols-1 gap-6">
          {loadingVendedores ? (
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Vendedores</CardTitle>
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
                <CardTitle>Ranking de Vendedores</CardTitle>
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
            <RankingVendedores vendedores={vendedores} titulo="Ranking de Vendedores" />
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Desempenho de Vendedores</CardTitle>
              <CardDescription>
                Detalhes de vendas e faturamento por vendedor
                </CardDescription>
              </CardHeader>
              <CardContent>
              {loadingVendedores ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando dados de vendedores...</p>
                  </div>
                </div>
              ) : erroVendedores ? (
                <div className="flex items-center justify-center h-[300px] text-red-500">
                  <p>{erroVendedores}</p>
                </div>
              ) : vendedores.length === 0 ? (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-muted-foreground">Nenhum vendedor encontrado no período selecionado</p>
                </div>
              ) : (
                <VendedoresTable 
                  vendedores={vendedores} 
                  onClickVendedor={handleOpenVendedorDetails}
                />
              )}
              </CardContent>
            </Card>
          
          {/* Card de Produtos Mais Vendidos */}
          <ProdutosMaisVendidos dataInicio={dateRange.from} dataFim={dateRange.to} />
        </div>
      </div>
      
      {/* Modal para detalhes do vendedor */}
      <VendedorDetalhesModal
        vendedor={vendedorSelecionado}
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        dataInicio={dateRange.from}
        dataFim={dateRange.to}
        totalFaturamento={dadosSummary.faturamento}
        onVendaClick={abrirDetalhesVenda}
      />

      {/* Modal para detalhes da venda */}
      <VendaDetalheModal
        venda={vendaSelecionada}
        aberto={vendaModalAberto}
        onOpenChange={setVendaModalAberto}
      />
    </div>
  );
} 