"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious } from "@/app/_components/ui/pagination";
import { Alert, AlertTitle, AlertDescription } from "@/app/_components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Loader2, ShoppingCart, RefreshCw, CalendarIcon, Search } from "lucide-react";
import { GestaoClickVenda, GestaoClickResponse, GestaoClickSituacaoVenda } from "@/app/_types/gestao-click";
import { Badge } from "@/app/_components/ui/badge";
import { useToast } from "@/app/_components/ui/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";
import VendaDetailModal from "@/app/_components/gestao-click/VendaDetailModal";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { Label } from "@/app/_components/ui/label";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { DebugModal } from "@/app/_components/debug-modal";

// Definir os tipos dos componentes de paginação que estão faltando
import type { MouseEvent } from "react";

/**
 * Formata um valor numérico para exibição como moeda
 * @param valor Valor a ser formatado
 * @returns Valor formatado como moeda brasileira (R$)
 */
const formatarValor = (valor: string | number): string => {
  const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(isNaN(valorNumerico) ? 0 : valorNumerico);
};

/**
 * Define o estilo do badge da situação da venda
 * @param situacao Nome da situação
 * @returns Classes CSS para estilizar o badge
 */
const getSituacaoBadgeStyle = (situacao: string): string => {
  switch (situacao?.toLowerCase()) {
    case 'cancelado':
    case 'cancelada':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'pago':
    case 'paga':
    case 'concluído':
    case 'concluída':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'em análise':
    case 'em processamento':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return '';
  }
};

/**
 * Página de listagem e importação de vendas do Gestão Click
 */
export default function VendasGestaoClickPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [vendas, setVendas] = useState<GestaoClickVenda[]>([]);
  const [situacoes, setSituacoes] = useState<GestaoClickSituacaoVenda[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [situacaoId, setSituacaoId] = useState<string>("all");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [autoReconcile, setAutoReconcile] = useState<boolean>(true);
  const { toast } = useToast();
  
  // Estado para debug
  const [debugInfo, setDebugInfo] = useState<{
    request: any;
    response: any;
    pagination: any;
    error?: any;
  }>({
    request: {},
    response: {},
    pagination: {}
  });
  
  // Estados para o modal de detalhes da venda
  const [selectedVendaId, setSelectedVendaId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Adicionar estado para somatório
  const [somatorioPeriodo, setSomatorioPeriodo] = useState<number>(0);

  /**
   * Busca situações de vendas para o filtro
   */
  const fetchSituacoes = useCallback(async () => {
    try {
      const response = await fetch(`/api/gestao-click/sales/situacoes`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar situações: ${response.statusText}`);
      }

      const data: GestaoClickResponse<GestaoClickSituacaoVenda> = await response.json();
      setSituacoes(data.data);
    } catch (error) {
      console.error("Erro ao buscar situações de vendas:", error);
    }
  }, []);

  /**
   * Busca vendas do Gestão Click
   */
  const fetchVendas = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (searchTerm) {
        params.append("nome", searchTerm);
      }

      if (situacaoId && situacaoId !== 'all') {
        params.append("situacao_id", situacaoId);
      }

      // Validar e formatar datas corretamente
      if (dataInicio) {
        try {
          // Garantir que dataInicio seja o início exato do dia (00:00:00)
          const dataInicioObj = new Date(dataInicio);
          dataInicioObj.setHours(0, 0, 0, 0);
          
          const dataInicioFormatada = format(dataInicioObj, "yyyy-MM-dd");
          console.log("Data início formatada:", dataInicioFormatada);
          params.append("data_inicio", dataInicioFormatada);
        } catch (error) {
          console.error("Erro ao formatar data de início:", error);
          // Se houver erro, não adiciona o parâmetro
        }
      }

      if (dataFim) {
        try {
          // Garantir que dataFim seja o fim exato do dia (23:59:59)
          const dataFimObj = new Date(dataFim);
          dataFimObj.setHours(23, 59, 59, 999);
          
          const dataFimFormatada = format(dataFimObj, "yyyy-MM-dd");
          console.log("Data fim formatada:", dataFimFormatada);
          params.append("data_fim", dataFimFormatada);
        } catch (error) {
          console.error("Erro ao formatar data de fim:", error);
          // Se houver erro, não adiciona o parâmetro
        }
      }

      // Armazenar os parâmetros da requisição para debug
      const requestParams = Object.fromEntries(params.entries());
      setDebugInfo(prev => ({ ...prev, request: { url: `/api/gestao-click/sales`, params: requestParams } }));
      
      // Log de debug dos parâmetros de busca
      console.log("Parâmetros de busca:", requestParams);

      const response = await fetch(`/api/gestao-click/sales?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar vendas: ${response.statusText}`);
      }

      const data: GestaoClickResponse<GestaoClickVenda> & { summary?: { somatorioPeriodo: number } } = await response.json();
      
      // Armazenar resposta para debug
      setDebugInfo(prev => ({ 
        ...prev, 
        response: data, 
        pagination: {
          total: data.meta?.total || data.meta?.total_registros || 0,
          totalPages: data.meta?.total_pages || data.meta?.total_paginas || 0,
          currentPage: data.meta?.current_page || data.meta?.pagina_atual || 0,
          original: data.meta
        }
      }));
      
      // Debug para verificar a estrutura da resposta
      console.log("Resposta da API:", {
        data: data.data?.length || 0, 
        meta: data.meta,
        summary: data.summary || 'Não disponível',
        pagination: {
          total: data.meta?.total,
          totalPages: data.meta?.total_pages,
          currentPage: data.meta?.current_page,
          // Compatibilidade com formato antigo
          totalRegistros: data.meta?.total_registros,
          paginaAtual: data.meta?.pagina_atual
        }
      });
      
      setVendas(data.data || []);
      setSomatorioPeriodo(data.summary?.somatorioPeriodo || 0);
      
      // Verificar os campos corretos com fallback para campos legados
      const total = data.meta?.total || data.meta?.total_registros || 0;
      const totalPages = data.meta?.total_pages || data.meta?.total_paginas || Math.ceil(total / pageSize) || 1;
      const currentPage = data.meta?.current_page || data.meta?.pagina_atual || 1;
      
      setTotalRegistros(total);
      setTotalPages(totalPages);
      setCurrentPage(currentPage);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
      setError(error instanceof Error ? error.message : "Erro ao buscar vendas");
      setDebugInfo(prev => ({ ...prev, error }));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, situacaoId, dataInicio, dataFim, pageSize]);

  /**
   * Busca situações e vendas ao carregar a página
   */
  useEffect(() => {
    fetchSituacoes();
    fetchVendas(currentPage);
  }, [fetchSituacoes, fetchVendas, currentPage]);

  /**
   * Importa vendas do Gestão Click
   */
  const handleImportVendas = async () => {
    if (!dataInicio || !dataFim) {
      toast({
        title: "Erro",
        description: "Selecione o período para importação",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const response = await fetch("/api/gestao-click/sales/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: format(dataInicio, "yyyy-MM-dd"),
          endDate: format(dataFim, "yyyy-MM-dd"),
          filtros: {
            situacao_id: situacaoId ? parseInt(situacaoId) : undefined
          },
          autoReconcile
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao importar vendas");
      }

      const result = await response.json();
      
      let toastMessage = `${result.result.imported} vendas importadas, ${result.result.skipped} já existentes.`;
      
      if (result.reconciliation) {
        if (result.reconciliation.error) {
          toastMessage += ` Conciliação: erro (${result.reconciliation.message}).`;
        } else {
          toastMessage += ` Conciliação: ${result.reconciliation.matched} vendas conciliadas.`;
        }
      }
      
      toast({
        title: "Importação concluída",
        description: toastMessage,
        variant: "success",
      });

      // Recarregar lista após importação
      fetchVendas(1);
    } catch (error) {
      console.error("Erro ao importar vendas:", error);
      setError(error instanceof Error ? error.message : "Erro ao importar vendas");
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro ao importar vendas",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Limpa os filtros
   */
  const handleClearFilters = () => {
    setSearchTerm("");
    setSituacaoId("all");
    setDataInicio(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setDataFim(new Date());
    fetchVendas(1);
  };

  /**
   * Renderiza paginação
   */
  const renderPagination = () => {
    const pageNumbers = [];
    const maxPageItems = 7;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPageItems - 1);
    
    if (endPage - startPage + 1 < maxPageItems) {
      startPage = Math.max(1, endPage - maxPageItems + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href="#"
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (currentPage > 1 && !isLoading) {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                }
              }}
              className={cn(currentPage === 1 || isLoading ? "pointer-events-none opacity-50" : "")}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <a 
                  href="#"
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    if (!isLoading) setCurrentPage(1);
                  }}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md px-3 text-sm", 
                    isLoading ? "pointer-events-none opacity-50" : "hover:bg-accent"
                  )}
                >
                  1
                </a>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}
          
          {pageNumbers.map(pageNumber => (
            <PaginationItem key={pageNumber}>
              <a 
                href="#"
                className={cn(
                  "flex h-9 items-center justify-center rounded-md px-3 text-sm",
                  pageNumber === currentPage ? "bg-primary text-primary-foreground" : "",
                  isLoading ? "pointer-events-none opacity-50" : "hover:bg-accent"
                )}
                onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  if (!isLoading) setCurrentPage(pageNumber);
                }}
              >
                {pageNumber}
              </a>
            </PaginationItem>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <a 
                  href="#"
                  onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    if (!isLoading) setCurrentPage(totalPages);
                  }}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-md px-3 text-sm", 
                    isLoading ? "pointer-events-none opacity-50" : "hover:bg-accent"
                  )}
                >
                  {totalPages}
                </a>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              href="#"
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                if (currentPage < totalPages && !isLoading) {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                }
              }}
              className={cn(currentPage === totalPages || isLoading ? "pointer-events-none opacity-50" : "")}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  // Adicionar esta função para abrir o modal de detalhes da venda
  const handleVendaClick = (vendaId: string) => {
    setSelectedVendaId(vendaId);
    setIsDetailModalOpen(true);
  };

  // Adicionar esta função para fechar o modal
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vendas do Gestão Click</h1>
          <p className="text-muted-foreground">
            Visualize e importe vendas do sistema Gestão Click
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/gestao-click">
            <Button variant="outline">Voltar</Button>
          </Link>
          
          <Button 
            onClick={handleImportVendas} 
            disabled={isImporting || !dataInicio || !dataFim}
            className="flex items-center gap-2"
          >
            {isImporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            Importar Vendas
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="bg-card shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="searchTerm">Pesquisar</Label>
            <Input
              id="searchTerm"
              type="text"
              placeholder="Código, cliente ou produto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="situacao">Situação</Label>
            <Select 
              value={situacaoId} 
              onValueChange={(value) => setSituacaoId(value)}
            >
              <SelectTrigger id="situacao">
                <SelectValue placeholder="Todas as situações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as situações</SelectItem>
                {situacoes.map((situacao) => (
                  <SelectItem key={situacao.id} value={situacao.id.toString()}>
                    {situacao.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dataInicio">De</Label>
            <DatePicker
              id="dataInicio"
              date={dataInicio}
              setDate={setDataInicio}
            />
          </div>

          <div>
            <Label htmlFor="dataFim">Até</Label>
            <DatePicker
              id="dataFim"
              date={dataFim}
              setDate={setDataFim}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="autoReconcile" 
              checked={autoReconcile}
              onCheckedChange={(checked) => setAutoReconcile(checked as boolean)}
            />
            <Label 
              htmlFor="autoReconcile" 
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Conciliar automaticamente com transações existentes
            </Label>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
            >
              Limpar Filtros
            </Button>
            
            <Button 
              onClick={() => fetchVendas(1)}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Vendas</CardTitle>
              <CardDescription>
                {totalRegistros} 
                {totalRegistros === 1 ? ' venda encontrada' : ' vendas encontradas'}
                {dataInicio && dataFim && (
                  <span> no período de {format(dataInicio, "dd/MM/yyyy")} até {format(dataFim, "dd/MM/yyyy")}</span>
                )}
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <DebugModal 
                title="Informações de Depuração" 
                data={debugInfo} 
              />
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => fetchVendas(currentPage)} 
                disabled={isLoading}
                title="Atualizar lista"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {somatorioPeriodo > 0 && (
          <div className="px-6 pb-2">
            <div className="p-4 rounded-md bg-muted flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
                <span className="mr-2">Somatório de vendas no período:</span>
                {dataInicio && dataFim && (
                  <span className="text-xs opacity-75">
                    {format(dataInicio, "dd/MM/yyyy")} - {format(dataFim, "dd/MM/yyyy")}
                  </span>
                )}
              </div>
              <div className="text-xl font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(somatorioPeriodo)}
              </div>
            </div>
          </div>
        )}
        
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Carregando vendas...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : vendas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhuma venda encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  vendas.map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">{venda.codigo}</TableCell>
                      <TableCell>
                        <button 
                          onClick={() => handleVendaClick(venda.id)} 
                          className="text-primary hover:underline"
                        >
                          {venda.nome_cliente}
                        </button>
                      </TableCell>
                      <TableCell>
                        {format(new Date(venda.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {formatarValor(venda.valor_total)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            venda.nome_situacao === "Cancelado" 
                              ? "destructive" 
                              : "default"
                          }
                          className={getSituacaoBadgeStyle(venda.nome_situacao)}
                        >
                          {venda.nome_situacao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVendaClick(venda.id)}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Exibindo {vendas.length} de {totalRegistros} vendas
          </div>
          
          {totalPages > 1 && renderPagination()}
        </CardFooter>
      </Card>
      
      {/* Modal de detalhes da venda */}
      <VendaDetailModal 
        vendaId={selectedVendaId}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
    </div>
  );
} 
