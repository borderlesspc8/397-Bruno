"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/app/_components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/_components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatPercent } from "@/app/_lib/formatters";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart as PieChartIcon, BarChart as BarChartIcon, ListFilter, Package, Eye, Info, ChevronUp, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/app/_components/ui/collapsible";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";

// Interface para produto
interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  valor: number;
  percentualQuantidade: number;
}

// Interface para origem
interface Origem {
  origem: string;
  quantidade: number;
  percentual: number;
  valorTotal: number;
  produtos: Produto[];
  produtosUnicos: number;
  totalUnidades: number;
}

// Interface para props do componente
interface ComoNosConheceuProdutosProps {
  dataInicio: Date;
  dataFim: Date;
}

/**
 * ComoNosConheceuProdutos - Componente de visualização de canais de origem e produtos vendidos
 * 
 * Este componente exibe um dashboard completo para análise de:
 * - Como os clientes conheceram a empresa (canais de origem)
 * - Quais produtos foram vendidos em cada canal
 * 
 * Funcionalidades:
 * - Visualização por gráfico de pizza ou barras com animação de transição
 * - Modo de exibição por quantidade de vendas ou valor total
 * - Tabela de dados com paginação
 * - Detalhes expandíveis por origem com:
 *   - Paginação individualizada por origem
 *   - Ordenação de produtos por quantidade, valor ou nome
 *   - Contadores de produtos únicos e total de unidades
 *   - Resumo de valor total por origem
 * - Filtro por tipo de loja (matriz, filial ou todas)
 * 
 * A implementação usa a API em /api/dashboard/origens-produtos com parâmetros de data.
 */
export function ComoNosConheceuProdutos({ dataInicio, dataFim }: ComoNosConheceuProdutosProps) {
  const [dados, setDados] = useState<{
    origens: Origem[];
    totalVendas: number;
    dataInicio: string;
    dataFim: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visualizacao, setVisualizacao] = useState<'pizza' | 'barras'>('pizza');
  const [modoExibicao, setModoExibicao] = useState<'quantidade' | 'valor'>('quantidade');
  const [origemSelecionada, setOrigemSelecionada] = useState<string | null>(null);
  const [expandirTodas, setExpandirTodas] = useState<boolean>(false);
  const [paginaAtual, setPaginaAtual] = useState<{[key: string]: number}>({});
  const [itensPorPagina, setItensPorPagina] = useState<number>(5);
  const [ordenacao, setOrdenacao] = useState<{[key: string]: 'quantidade' | 'valor' | 'nome'}>({});
  const [direcao, setDirecao] = useState<{[key: string]: 'asc' | 'desc'}>({});
  
  // Filtro de tipo de loja
  const [tipoLoja, setTipoLoja] = useState<'todas' | 'Personal Prime MATRI' | 'Filial Golden'>('todas');

  // Paginação para as origens
  const [paginaOrigens, setPaginaOrigens] = useState(1);
  const origensPorPagina = 5;

  // Adicione estes estados para a paginação da tabela
  const [paginaDados, setPaginaDados] = useState(1);
  const itensPorPaginaDados = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Formatar datas para string no formato YYYY-MM-DD
        const dataInicioStr = dataInicio.toISOString().split('T')[0];
        const dataFimStr = dataFim.toISOString().split('T')[0];
        
        // Adicionar parâmetro para filtro de loja se não for 'todas'
        const tipoLojaParam = tipoLoja !== 'todas' ? `&tipoLoja=${encodeURIComponent(tipoLoja)}` : '';
        
        // Buscar dados da API unificada
        const response = await fetch(
          `/api/dashboard/origens-produtos?dataInicio=${dataInicioStr}&dataFim=${dataFimStr}${tipoLojaParam}`
        );
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.origens) {
          setDados(data);
          
          // Se houver origens e nenhuma selecionada, selecionar a primeira
          if (data.origens.length > 0 && !origemSelecionada) {
            setOrigemSelecionada(data.origens[0].origem);
          }
        } else {
          throw new Error("Formato de dados inválido");
        }
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError("Não foi possível carregar os dados de Como nos Conheceu");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dataInicio, dataFim, origemSelecionada, tipoLoja]);

  // Cores para os gráficos
  const COLORS = useMemo(() => [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
    '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
  ], []);

  // Dados para o gráfico
  const chartData = useMemo(() => {
    if (!dados?.origens) return [];
    
    return dados.origens.map(origem => ({
      name: origem.origem,
      quantidade: origem.quantidade,
      valor: origem.valorTotal,
      produtos: origem.produtosUnicos,
      percentual: origem.percentual
    }));
  }, [dados?.origens]);

  // Renderizar gráfico de pizza
  const renderPieChart = () => {
    if (!chartData.length) return null;
    
    const dataKey = modoExibicao === 'quantidade' ? 'quantidade' : 'valor';
    
    return (
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey="name"
              label={({ name, percent }) => {
                const shortName = name.length > 15 ? `${name.substring(0, 12)}...` : name;
                return `${shortName}: ${(percent * 100).toFixed(1)}%`;
              }}
              labelLine={true}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => {
                if (modoExibicao === 'valor') {
                  return formatCurrency(value);
                }
                return value;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Renderizar gráfico de barras
  const renderBarChart = () => {
    if (!chartData.length) return null;
    
    const dataKey = modoExibicao === 'quantidade' ? 'quantidade' : 'valor';
    
    return (
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => {
                if (modoExibicao === 'valor') {
                  // Formatação compacta manual para números grandes
                  if (value >= 1000000) {
                    return `${formatCurrency(value / 1000000)}M`;
                  } else if (value >= 1000) {
                    return `${formatCurrency(value / 1000)}K`;
                  }
                  return formatCurrency(value);
                }
                return value;
              }}
            />
            <Tooltip 
              formatter={(value: any) => {
                if (modoExibicao === 'valor') {
                  return formatCurrency(value);
                }
                return value;
              }}
            />
            <Legend />
            <Bar 
              dataKey={dataKey} 
              name={modoExibicao === 'quantidade' ? 'Quantidade' : 'Valor Total'} 
              fill="#8884d8"
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Renderizar tabela detalhada de origens e produtos
  const renderDetalhesOrigens = () => {
    if (!dados || !dados.origens.length) return null;
    
    // Cálculo para paginação de origens
    const totalOrigens = dados.origens.length;
    const totalPaginasOrigens = Math.ceil(totalOrigens / origensPorPagina);
    const inicioOrigens = (paginaOrigens - 1) * origensPorPagina;
    const fimOrigens = Math.min(inicioOrigens + origensPorPagina, totalOrigens);
    const origensExibidas = dados.origens.slice(inicioOrigens, fimOrigens);
    
    return (
      <div className="mt-8 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Detalhes por Origem</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExpandirTodas(!expandirTodas)}
            >
              {expandirTodas ? (
                <>
                  <ChevronUp className="mr-2 h-4 w-4" />
                  Recolher todos
                </>
              ) : (
                <>
                  <ChevronDown className="mr-2 h-4 w-4" />
                  Expandir todos
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {origensExibidas.map((origem, index) => {
            // Inicializar estados para esta origem se não existirem
            const origemKey = origem.origem;
            if (!paginaAtual[origemKey]) {
              setPaginaAtual(prev => ({...prev, [origemKey]: 1}));
            }
            if (!ordenacao[origemKey]) {
              setOrdenacao(prev => ({...prev, [origemKey]: 'quantidade'}));
            }
            if (!direcao[origemKey]) {
              setDirecao(prev => ({...prev, [origemKey]: 'desc'}));
            }
            
            // Calcular paginação
            const pagina = paginaAtual[origemKey] || 1;
            const totalPaginas = Math.ceil(origem.produtos.length / itensPorPagina);
            const inicio = (pagina - 1) * itensPorPagina;
            const fim = inicio + itensPorPagina;
            
            // Ordenar produtos
            const produtosOrdenados = [...origem.produtos].sort((a, b) => {
              const ordem = ordenacao[origemKey] || 'quantidade';
              const dir = direcao[origemKey] === 'asc' ? 1 : -1;
              
              if (ordem === 'quantidade') {
                return (a.quantidade - b.quantidade) * dir;
              } else if (ordem === 'valor') {
                return (a.valor - b.valor) * dir;
              } else {
                return a.nome.localeCompare(b.nome) * dir;
              }
            });
            
            // Produtos para exibir nesta página
            const produtosPaginados = produtosOrdenados.slice(inicio, fim);
            
            // Obter totais diretamente da API para evitar recálculos
            const totalQuantidade = origem.totalUnidades;
            const totalValorProdutos = origem.valorTotal;
            
            return (
              <Collapsible
                key={`origem-${index}`}
                open={expandirTodas || origem.origem === origemSelecionada}
                onOpenChange={(isOpen) => {
                  if (isOpen) {
                    setOrigemSelecionada(origem.origem);
                  } else if (origem.origem === origemSelecionada) {
                    setOrigemSelecionada(null);
                  }
                }}
                className="border rounded-lg shadow-sm"
              >
                <CollapsibleTrigger asChild>
                  <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted transition-colors rounded-t-lg">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <h4 className="font-medium">{origem.origem}</h4>
                      <Badge variant="outline" className="ml-2">
                        {origem.quantidade} vendas
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className="ml-2"
                      >
                        {formatCurrency(origem.valorTotal)}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="ml-2 flex items-center gap-1"
                      >
                        <Package className="h-3 w-3" /> 
                        {origem.produtosUnicos} produtos • {origem.totalUnidades} unidades
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0 border-t">
                    <div className="flex justify-between items-center mt-4 mb-2">
                      <h5 className="text-sm font-medium">
                        Produtos vendidos para clientes que conheceram por {origem.origem}
                      </h5>
                      <div className="flex items-center gap-2">
                        <Select
                          value={ordenacao[origemKey] || 'quantidade'}
                          onValueChange={(value) => {
                            setOrdenacao(prev => ({
                              ...prev, 
                              [origemKey]: value as 'quantidade' | 'valor' | 'nome'
                            }));
                          }}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Ordenar por" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quantidade">Quantidade</SelectItem>
                            <SelectItem value="valor">Valor</SelectItem>
                            <SelectItem value="nome">Nome</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDirecao(prev => ({
                              ...prev,
                              [origemKey]: prev[origemKey] === 'asc' ? 'desc' : 'asc'
                            }));
                          }}
                        >
                          {direcao[origemKey] === 'asc' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up">
                              <path d="m5 12 7-7 7 7"/>
                              <path d="M12 19V5"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-down">
                              <path d="M12 5v14"/>
                              <path d="m19 12-7 7-7-7"/>
                            </svg>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {origem.produtos.length > 0 ? (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead className="text-right">Qtd.</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                              <TableHead className="text-right">% Vendas</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {produtosPaginados.map((produto, idx) => (
                              <TableRow key={`produto-${idx}`}>
                                <TableCell className="font-medium">{produto.nome}</TableCell>
                                <TableCell className="text-right">{produto.quantidade}</TableCell>
                                <TableCell className="text-right">{formatCurrency(produto.valor)}</TableCell>
                                <TableCell className="text-right">
                                  {formatPercent(produto.percentualQuantidade)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <tfoot>
                            <TableRow>
                              <TableCell className="font-medium">Total</TableCell>
                              <TableCell className="text-right font-medium">{totalQuantidade}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(totalValorProdutos)}</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </tfoot>
                        </Table>

                        <div className="mt-2 pt-2 border-t flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">Total:</span>{" "}
                            <span>{origem.produtosUnicos} produtos • {origem.totalUnidades} unidades</span>
                          </div>
                          <div>
                            <span className="font-medium">Valor total:</span>{" "}
                            <span className="font-medium">{formatCurrency(origem.valorTotal)}</span>
                          </div>
                        </div>

                        {totalPaginas > 1 && (
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center space-x-2">
                              <Select 
                                value={itensPorPagina.toString()} 
                                onValueChange={(value) => setItensPorPagina(Number(value))}
                              >
                                <SelectTrigger className="h-8 w-[70px]">
                                  <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="5">5</SelectItem>
                                  <SelectItem value="10">10</SelectItem>
                                  <SelectItem value="20">20</SelectItem>
                                  <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                              </Select>
                              <span className="text-xs text-muted-foreground">
                                Mostrando {produtosPaginados.length > 0 ? Number(pagina - 1) * Number(itensPorPagina) + 1 : 0} a {Math.min(Number(pagina) * Number(itensPorPagina), produtosPaginados.length)} de {produtosPaginados.length} produtos ({totalQuantidade} unidades)
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pagina === 1}
                                onClick={() => {
                                  setPaginaAtual(prev => ({
                                    ...prev,
                                    [origemKey]: 1
                                  }));
                                }}
                              >
                                Primeira
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pagina === 1}
                                onClick={() => {
                                  setPaginaAtual(prev => ({
                                    ...prev,
                                    [origemKey]: Math.max(1, prev[origemKey] - 1)
                                  }));
                                }}
                              >
                                Anterior
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pagina >= totalPaginas}
                                onClick={() => {
                                  setPaginaAtual(prev => ({
                                    ...prev,
                                    [origemKey]: Math.min(totalPaginas, prev[origemKey] + 1)
                                  }));
                                }}
                              >
                                Próxima
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={pagina >= totalPaginas}
                                onClick={() => {
                                  setPaginaAtual(prev => ({
                                    ...prev,
                                    [origemKey]: totalPaginas
                                  }));
                                }}
                              >
                                Última
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum produto encontrado para esta origem.
                      </p>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
        
        {/* Paginação para origens */}
        {totalPaginasOrigens > 1 && (
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-muted-foreground">
              Mostrando {inicioOrigens + 1} a {fimOrigens} de {totalOrigens} origens
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={paginaOrigens === 1}
                onClick={() => setPaginaOrigens(1)}
              >
                Primeira
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={paginaOrigens === 1}
                onClick={() => setPaginaOrigens(prev => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={paginaOrigens >= totalPaginasOrigens}
                onClick={() => setPaginaOrigens(prev => Math.min(totalPaginasOrigens, prev + 1))}
              >
                Próxima
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={paginaOrigens >= totalPaginasOrigens}
                onClick={() => setPaginaOrigens(totalPaginasOrigens)}
              >
                Última
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Exibir nome formatado da loja
  const formatarNomeLoja = (nome: string) => {
    if (nome === 'Personal Prime MATRI') return 'Matriz';
    if (nome === 'Filial Golden') return 'Filial';
    return nome;
  };

  // Se a loja selecionada é a matriz
  const ehMatriz = (loja: string) => loja === 'Personal Prime MATRI';

  // Renderizar componente de carregamento
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-64" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-96" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar mensagem de erro
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Como nos Conheceu & Produtos</CardTitle>
          <CardDescription>Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full flex items-center justify-center">
            <div className="text-red-500 text-center">
              <p>{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Verifique sua conexão ou tente novamente mais tarde.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar mensagem de sem dados
  if (!dados || !dados.origens.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Como nos Conheceu & Produtos</CardTitle>
          <CardDescription>Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">
                Nenhum dado disponível para o período selecionado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar componente principal
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              Como nos Conheceu
              {tipoLoja !== 'todas' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                >
                  {formatarNomeLoja(tipoLoja)}
                </motion.span>
              )}
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Análise de como os clientes conheceram a empresa e quais produtos foram adquiridos em cada canal de origem.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Período: {dataInicio.toLocaleDateString()} a {dataFim.toLocaleDateString()} 
              • Total de vendas: {dados.totalVendas} • {dados.origens.length} canais de origem
              {tipoLoja !== 'todas' && (
                <>
                  • <span className="font-medium">{formatarNomeLoja(tipoLoja)}</span>
                </>
              )}
            </CardDescription>
          </div>
          
          <div className="flex gap-2 mt-2 sm:mt-0">
            <div className="flex border rounded-md overflow-hidden">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-1.5 text-sm transition-all ${
                  tipoLoja === 'todas' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-primary/10'
                }`}
                onClick={() => setTipoLoja('todas')}
              >
                Todas
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-1.5 text-sm transition-all ${
                  tipoLoja === 'Personal Prime MATRI' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-primary/10'
                }`}
                onClick={() => setTipoLoja('Personal Prime MATRI')}
              >
                Matriz
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-3 py-1.5 text-sm transition-all ${
                  tipoLoja === 'Filial Golden' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-primary/10'
                }`}
                onClick={() => setTipoLoja('Filial Golden')}
              >
                Filial
              </motion.button>
            </div>

            <Select
              value={modoExibicao}
              onValueChange={(value) => setModoExibicao(value as 'quantidade' | 'valor')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Exibir por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantidade">Quantidade</SelectItem>
                <SelectItem value="valor">Valor (R$)</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={visualizacao === 'pizza' ? 'default' : 'ghost'}
                className="rounded-none px-3"
                onClick={() => setVisualizacao('pizza')}
                size="sm"
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
              <Button
                variant={visualizacao === 'barras' ? 'default' : 'ghost'}
                className="rounded-none px-3"
                onClick={() => setVisualizacao('barras')}
                size="sm"
              >
                <BarChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="grafico" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grafico">Gráfico</TabsTrigger>
            <TabsTrigger value="dados">Dados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grafico">
            <AnimatePresence mode="wait">
              <motion.div
                key={visualizacao}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {visualizacao === 'pizza' ? renderPieChart() : renderBarChart()}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
          
          <TabsContent value="dados">
            {/* Tabela de dados */}
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Como nos Conheceu</TableHead>
                    <TableHead className="text-right">Vendas</TableHead>
                    <TableHead className="text-right">Percentual</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Produtos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.origens
                    .slice(
                      (paginaDados - 1) * itensPorPaginaDados,
                      paginaDados * itensPorPaginaDados
                    )
                    .map((origem, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center">
                            <div 
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            {origem.origem}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{origem.quantidade}</TableCell>
                        <TableCell className="text-right">{formatPercent(origem.percentual)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(origem.valorTotal)}</TableCell>
                        <TableCell className="w-20 text-center">
                          <Badge variant="outline" className="text-xs font-normal">
                            {origem.produtosUnicos} produtos • {origem.totalUnidades} unidades
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              
              {/* Paginação da tabela */}
              {dados.origens.length > itensPorPaginaDados && (
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-muted-foreground">
                    Mostrando {(paginaDados - 1) * itensPorPaginaDados + 1} a {Math.min(paginaDados * itensPorPaginaDados, dados.origens.length)} de {dados.origens.length} origens
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paginaDados === 1}
                      onClick={() => setPaginaDados(1)}
                    >
                      Primeira
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paginaDados === 1}
                      onClick={() => setPaginaDados(prev => Math.max(1, prev - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paginaDados >= Math.ceil(dados.origens.length / itensPorPaginaDados)}
                      onClick={() => setPaginaDados(prev => Math.min(Math.ceil(dados.origens.length / itensPorPaginaDados), prev + 1))}
                    >
                      Próxima
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={paginaDados >= Math.ceil(dados.origens.length / itensPorPaginaDados)}
                      onClick={() => setPaginaDados(Math.ceil(dados.origens.length / itensPorPaginaDados))}
                    >
                      Última
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {renderDetalhesOrigens()}
      </CardContent>
      
      <CardFooter className="border-t p-4 bg-muted/10">
        <p className="text-xs text-muted-foreground w-full text-center">
          Os dados são baseados nas vendas concretizadas e em andamento no período selecionado.
          A origem "Não informado" inclui vendas onde o campo "Como nos conheceu" não foi preenchido.
        </p>
      </CardFooter>
    </Card>
  );
} 