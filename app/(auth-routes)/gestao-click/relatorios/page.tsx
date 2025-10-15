"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Calendar } from "@/app/_components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/_components/ui/popover";
import { Alert, AlertTitle, AlertDescription } from "@/app/_components/ui/alert";
import { CalendarIcon, ArrowRight, FileBarChart, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/app/_lib/utils";

export default function RelatoriosGestaoClickPage() {
  const [clienteId, setClienteId] = useState<string>("all");
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [dataInicio, setDataInicio] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
  );
  const [dataFim, setDataFim] = useState<Date | undefined>(new Date());
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClientesLoading, setIsClientesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>("cliente");
  
  // Dados para os relatórios
  const [clienteData, setClienteData] = useState<any>(null);
  const [vendasData, setVendasData] = useState<any>(null);
  const [financeiroData, setFinanceiroData] = useState<any>(null);
  
  // Buscar lista de clientes ao carregar a página
  useEffect(() => {
    const fetchClientes = async () => {
      setIsClientesLoading(true);
      try {
        const response = await fetch("/api/gestao-click/clients?limit=100");
        if (!response.ok) throw new Error("Erro ao buscar clientes");
        
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setClientes(data.data.map((cliente: any) => ({
            id: cliente.id,
            nome: cliente.nome
          })));
        }
      } catch (error) {
        console.error("Erro ao buscar clientes:", error);
      } finally {
        setIsClientesLoading(false);
      }
    };
    
    fetchClientes();
  }, []);
  
  // Buscar dados de cruzamento
  const handleBuscar = async () => {
    if (!dataInicio || !dataFim) {
      setError("Selecione o período para o relatório");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Construir parâmetros da consulta
      const params = new URLSearchParams({
        startDate: format(dataInicio, "yyyy-MM-dd"),
        endDate: format(dataFim, "yyyy-MM-dd")
      });
      
      if (clienteId && clienteId !== 'all') {
        params.append("clienteId", clienteId);
      }
      
      // Fazer requisição
      const response = await fetch(`/api/gestao-click/relatorios/cruzamento?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao gerar relatório");
      }
      
      const data = await response.json();
      
      // Atualizar os dados dos relatórios
      setClienteData(data.cliente);
      setVendasData(data.vendas);
      setFinanceiroData(data.financeiro);
      
    } catch (error) {
      console.error("Erro ao buscar dados do relatório:", error);
      setError(error instanceof Error ? error.message : "Erro ao gerar relatório");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Formatar valor monetário
  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  // Calcular o somatório de valores de um array
  const somarValores = (items: any[], campoValor: string) => {
    return items.reduce((total, item) => total + parseFloat(item[campoValor] || 0), 0);
  };
  
  // Componente para exibir dados de teste enquanto a API não está implementada
  const DadosExemplo = () => (
    <div className="p-4 border border-dashed rounded-md">
      <p className="text-muted-foreground text-center mb-4">
        Dados de exemplo para ilustração do relatório. Os dados reais serão exibidos quando a API estiver implementada.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-muted/50 rounded-md">
          <h3 className="font-medium mb-2">Resumo do Cliente</h3>
          <p><span className="font-medium">Nome:</span> Empresa ABC Ltda</p>
          <p><span className="font-medium">Total de Vendas:</span> 12</p>
          <p><span className="font-medium">Valor Total:</span> R$ 45.750,00</p>
          <p><span className="font-medium">Ticket Médio:</span> R$ 3.812,50</p>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-md">
          <h3 className="font-medium mb-2">Financeiro</h3>
          <p><span className="font-medium">Recebido:</span> R$ 32.450,00</p>
          <p><span className="font-medium">A Receber:</span> R$ 13.300,00</p>
          <p><span className="font-medium">Índice de Pagamento:</span> 71%</p>
          <p><span className="font-medium">Atraso Médio:</span> 5 dias</p>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-md">
          <h3 className="font-medium mb-2">Histórico</h3>
          <p><span className="font-medium">Primeira Compra:</span> 12/03/2023</p>
          <p><span className="font-medium">Última Compra:</span> 05/06/2023</p>
          <p><span className="font-medium">Frequência:</span> 2,5 compras/mês</p>
          <p><span className="font-medium">Status:</span> Cliente Ativo</p>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios e Cruzamento de Dados</h1>
          <p className="text-muted-foreground">
            Visualize relatórios consolidados integrando vendas, clientes e financeiro
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link href="/gestao-click">
            <Button variant="outline">Voltar</Button>
          </Link>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Parâmetros do Relatório</CardTitle>
          <CardDescription>
            Defina os filtros para gerar o relatório integrado
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Cliente</label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {isClientesLoading ? (
                    <SelectItem value="loading" disabled>
                      Carregando clientes...
                    </SelectItem>
                  ) : (
                    clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Data Início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? (
                      format(dataInicio, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataInicio}
                    onSelect={setDataInicio}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Data Fim</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? (
                      format(dataFim, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataFim}
                    onSelect={setDataFim}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleBuscar} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileBarChart className="h-4 w-4" />
              )}
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="cliente">Por Cliente</TabsTrigger>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          </TabsList>
          
          <Button variant="outline" size="sm" disabled={isLoading || !clienteData}>
            Exportar PDF
          </Button>
        </div>
        
        <TabsContent value="cliente" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Visão Consolidada por Cliente</CardTitle>
              <CardDescription>
                Análise completa da relação com o cliente incluindo vendas e financeiro
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Dados de exemplo - serão substituídos pelos dados reais quando a API estiver implementada */}
              <DadosExemplo />
              
              {/* Estrutura para exibir dados reais quando estiverem disponíveis */}
              {clienteData && (
                <div className="mt-4">
                  {/* Conteúdo será implementado quando a API estiver disponível */}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vendas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Vendas</CardTitle>
              <CardDescription>
                Detalhamento das vendas por período, produtos e serviços
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Dados de exemplo - serão substituídos pelos dados reais quando a API estiver implementada */}
              <div className="p-4 border border-dashed rounded-md mb-6">
                <h3 className="font-medium mb-2">Evolução de Vendas</h3>
                <div className="h-48 bg-muted/50 rounded-md flex items-center justify-center">
                  Gráfico de Vendas por Período (Em desenvolvimento)
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-dashed rounded-md">
                  <h3 className="font-medium mb-2">Produtos Mais Vendidos</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Produto A</span>
                      <span>32 unidades</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Produto B</span>
                      <span>18 unidades</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Produto C</span>
                      <span>15 unidades</span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 border border-dashed rounded-md">
                  <h3 className="font-medium mb-2">Vendas por Situação</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span>Confirmado</span>
                      <span>45 vendas</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Em andamento</span>
                      <span>12 vendas</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Cancelado</span>
                      <span>3 vendas</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Estrutura para exibir dados reais quando estiverem disponíveis */}
              {vendasData && (
                <div className="mt-4">
                  {/* Conteúdo será implementado quando a API estiver disponível */}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financeiro" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise Financeira</CardTitle>
              <CardDescription>
                Visão consolidada de receitas, despesas e fluxo de caixa
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* Dados de exemplo - serão substituídos pelos dados reais quando a API estiver implementada */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium mb-2 text-green-800">Receitas</h3>
                  <p className="text-2xl font-bold text-green-700">R$ 85.750,00</p>
                  <div className="flex items-center text-sm text-green-600 mt-2">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    <span>32 transações no período</span>
                  </div>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="font-medium mb-2 text-red-800">Despesas</h3>
                  <p className="text-2xl font-bold text-red-700">R$ 42.320,00</p>
                  <div className="flex items-center text-sm text-red-600 mt-2">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    <span>18 transações no período</span>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="font-medium mb-2 text-blue-800">Saldo</h3>
                  <p className="text-2xl font-bold text-blue-700">R$ 43.430,00</p>
                  <div className="flex items-center text-sm text-blue-600 mt-2">
                    <ArrowRight className="h-4 w-4 mr-1" />
                    <span>50,6% de lucratividade</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border border-dashed rounded-md">
                <h3 className="font-medium mb-2">Fluxo de Caixa</h3>
                <div className="h-48 bg-muted/50 rounded-md flex items-center justify-center">
                  Gráfico de Fluxo de Caixa (Em desenvolvimento)
                </div>
              </div>
              
              {/* Estrutura para exibir dados reais quando estiverem disponíveis */}
              {financeiroData && (
                <div className="mt-4">
                  {/* Conteúdo será implementado quando a API estiver disponível */}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Como funciona o cruzamento de dados</CardTitle>
          <CardDescription>
            Entenda como os dados são correlacionados para gerar insights relevantes
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">1. Coleta de Dados</h3>
              <p className="text-sm text-muted-foreground">
                O sistema coleta dados de múltiplas fontes do Gestão Click: clientes, vendas, 
                recebimentos e despesas para criar uma visão unificada.
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">2. Processamento</h3>
              <p className="text-sm text-muted-foreground">
                Os dados são processados e correlacionados por cliente, período e categorias, 
                gerando métricas significativas para análise.
              </p>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">3. Visualização</h3>
              <p className="text-sm text-muted-foreground">
                Os resultados são apresentados em formatos visuais intuitivos, permitindo 
                que você tome decisões baseadas em dados concretos.
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Nota:</span> O cruzamento de dados é atualizado conforme novas informações são
              importadas do Gestão Click. Para melhores resultados, mantenha todos os dados atualizados
              através da importação regular.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
