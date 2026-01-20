"use client";

import { useState, useEffect } from "react";
import { VendedoresService } from "@/app/_services/vendedores";
import { Vendedor } from "@/app/_services/betelTecnologia";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { DateRangeSelector } from "@/app/_components/dashboard-shared/components";
import { ListaVendedores } from "./components/ListaVendedores";
import { UploadFotoModal } from "./components/UploadFotoModal";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import { toast } from "@/app/_components/ui/use-toast";
import { RankingVendedoresPodium } from "./components/RankingVendedoresPodium";

export default function GerenciamentoVendedores() {
  // Estados para gerenciar vendedores e período
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Estado para o vendedor selecionado para upload de foto
  const [vendedorSelecionado, setVendedorSelecionado] = useState<Vendedor | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  
  // Inicializa com o primeiro dia do mês atual até o dia atual
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return {
      from: primeiroDiaMes,
      to: hoje
    };
  });

  // Carregar dados iniciais
  useEffect(() => {
    buscarVendedores(dateRange.from, dateRange.to);
  }, []);

  // Função para buscar vendedores
  const buscarVendedores = async (dataInicio: Date, dataFim: Date) => {
    setLoading(true);
    
    try {
      const response = await VendedoresService.buscarVendedores({
        dataInicio,
        dataFim
      });
      
      if (response.erro) {
        setErro(response.erro);
        setVendedores([]);
      } else {
        setErro(null);
        setVendedores(response.vendedores || []);
      }
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao buscar vendedores');
      setVendedores([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handler para mudança de período
  const handleDateRangeChange = async (range: { from: Date; to: Date }) => {
    setDateRange(range);
    await buscarVendedores(range.from, range.to);
  };
  
  // Abrir modal para upload de foto
  const handleAbrirUploadFoto = (vendedor: Vendedor) => {
    setVendedorSelecionado(vendedor);
    setModalAberto(true);
  };
  
  // Abrir modal de detalhes do vendedor
  const handleAbrirDetalhesVendedor = (vendedor: Vendedor) => {
    setVendedorSelecionado(vendedor);
    setModalAberto(true);
  };
  
  // Fechar modal e atualizar lista se necessário
  const handleFotoAtualizada = () => {
    // Limpar o cache de imagens antes de recarregar
    import('@/app/_services/vendedorImagens').then(module => {
      const VendedorImagensService = module.VendedorImagensService;
      // Limpar todo o cache de imagens para garantir atualização
      VendedorImagensService.limparCache();
      
      // Adicionar um pequeno atraso antes de recarregar para garantir que o cache seja limpo
      setTimeout(() => {
        // Recarregar os dados para refletir as mudanças
        buscarVendedores(dateRange.from, dateRange.to);
        
        // Mostrar notificação de sucesso
        toast({
          title: "Foto atualizada",
          description: "A foto do vendedor foi atualizada com sucesso!",
          variant: "success"
        });
      }, 300);
    });
  };
  
  // Renderizar conteúdo baseado no estado de carregamento
  const renderizarConteudo = () => {
    if (loading) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-[200px]">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (erro) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      );
    }
    
    if (vendedores.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Vendedores</CardTitle>
            <CardDescription>
              Nenhum vendedor encontrado no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Selecione outro período para visualizar os vendedores</p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Adicionar o pódio antes da lista */}
        <RankingVendedoresPodium 
          vendedores={vendedores}
          onUploadFoto={handleAbrirUploadFoto}
          onVendedorClick={handleAbrirDetalhesVendedor}
        />
        
        {/* Lista de vendedores */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Equipe de Vendedores</h2>
          <ListaVendedores
            vendedores={vendedores}
            onUploadFoto={handleAbrirUploadFoto}
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Vendedores</h1>
          <p className="text-muted-foreground">
            Gerencie os dados e fotos dos vendedores da sua equipe.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
        </div>
      </div>

      <div className="grid gap-6">
        {renderizarConteudo()}
      </div>
      
      {/* Modal para upload de foto */}
      <UploadFotoModal
        vendedor={vendedorSelecionado}
        aberto={modalAberto}
        onOpenChange={setModalAberto}
        onFotoAtualizada={handleFotoAtualizada}
      />
    </div>
  );
} 
