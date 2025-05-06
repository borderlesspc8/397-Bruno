import { useState, useEffect, useMemo, useCallback } from "react";
import { Package, ArrowUpDown, TrendingUp, ShoppingBag, Dumbbell } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/app/_components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/app/_components/ui/tabs";
import { useSession } from "next-auth/react";
import axios from "axios";
import { ProdutoDetalhesModal } from "./ProdutoDetalhesModal";
import { VendaDetalheModal } from "./VendaDetalheModal";
import { Separator } from "@/app/_components/ui/separator";

// Importações para Chart.js
import dynamic from 'next/dynamic';
import 'chart.js/auto';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  TooltipItem,
  ChartData,
  ChartOptions
} from 'chart.js';

// Registrar componentes do Chart.js
if (typeof window !== 'undefined') {
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);
}

// Tipos mais específicos
type OrdenacaoTipo = "quantidade" | "valor" | "margem";
type VisualizacaoTipo = "grafico" | "tabela";

// Carregar o componente Bar do Chart.js de forma dinâmica para evitar problemas de SSR
const Bar = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Bar),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-[300px]" aria-label="Carregando gráfico">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
      </div>
    )
  }
);

interface ProdutoItem {
  id?: string;
  nome: string;
  quantidade: number;
  valor: number;
  custo?: number;
  margem: number;
  margemPercentual: number | string;
  percentual?: number;
  categoria?: string;
}

// Categorias específicas para filtrar acessórios
const CATEGORIAS_ACESSORIOS_ESPECIAIS = [
  "ANILHA", "HALTER", "CABO DE AÇO", "KETTLEBELL", "PAR DE CANELEIRAS"
];

interface ProdutosMaisVendidosProps {
  dataInicio: Date;
  dataFim: Date;
}

export function ProdutosMaisVendidos({ dataInicio, dataFim }: ProdutosMaisVendidosProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [equipamentos, setEquipamentos] = useState<ProdutoItem[]>([]);
  const [acessorios, setAcessorios] = useState<ProdutoItem[]>([]);
  const [acessoriosEspeciais, setAcessoriosEspeciais] = useState<ProdutoItem[]>([]);
  const [acessoriosSextavados, setAcessoriosSextavados] = useState<ProdutoItem[]>([]);
  const [acessoriosEmborrachados, setAcessoriosEmborrachados] = useState<ProdutoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>("quantidade");
  const [visualizacao, setVisualizacao] = useState<VisualizacaoTipo>("grafico");
  
  // Estados para o modal de detalhes do produto
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoItem | null>(null);
  const [vendaModalAberto, setVendaModalAberto] = useState(false);
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null);

  // Função para separar os acessórios em categorias específicas
  const separaGrupos = useCallback((acessoriosLista: ProdutoItem[]) => {
    // Filtra acessórios especiais que contêm palavras-chave das categorias
    const especiais = acessoriosLista.filter(a => 
      CATEGORIAS_ACESSORIOS_ESPECIAIS.some(cat => 
        a.nome.toUpperCase().includes(cat)
      )
    );
    
    // Filtra itens sextavados
    const sextavados = acessoriosLista.filter(a => 
      a.nome.toLowerCase().includes("sextavado")
    );
    
    // Filtra itens emborrachados
    const emborrachados = acessoriosLista.filter(a => 
      a.nome.toLowerCase().includes("emborrachado")
    );
    
    // Filtra os demais acessórios (removendo os especiais)
    const demaisAcessorios = acessoriosLista.filter(a => 
      !CATEGORIAS_ACESSORIOS_ESPECIAIS.some(cat => a.nome.toUpperCase().includes(cat)) &&
      !a.nome.toLowerCase().includes("sextavado") &&
      !a.nome.toLowerCase().includes("emborrachado")
    );
    
    return {
      especiais,
      sextavados,
      emborrachados,
      demaisAcessorios
    };
  }, []);

  // Buscar produtos - código existente
  useEffect(() => {
    const buscarProdutos = async () => {
      if (!userEmail) {
        setErro("Usuário não identificado. Faça login novamente.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErro(null);

        const dataInicioFormatada = dataInicio.toISOString().split('T')[0];
        const dataFimFormatada = dataFim.toISOString().split('T')[0];

        const response = await axios.get(`/api/gestao-click/produtos-mais-vendidos`, {
          params: {
            userEmail,
            dataInicio: dataInicioFormatada,
            dataFim: dataFimFormatada
          }
        });
        
        if (response.data) {
          const acessoriosLista = response.data.acessorios || [];
          
          // Classificar acessórios em grupos específicos
          const grupos = separaGrupos(acessoriosLista);
          
          setProdutos(response.data.produtos || []);
          setEquipamentos(response.data.equipamentos || []);
          setAcessorios(acessoriosLista);
          setAcessoriosEspeciais(grupos.especiais);
          setAcessoriosSextavados(grupos.sextavados);
          setAcessoriosEmborrachados(grupos.emborrachados);
        } else {
          setErro("Formato de dados inválido");
        }
      } catch (error) {
        console.error("Erro ao buscar produtos mais vendidos:", error);
        setErro(error instanceof Error ? error.message : "Erro ao buscar produtos");
      } finally {
        setLoading(false);
      }
    };

    buscarProdutos();
  }, [dataInicio, dataFim, userEmail, separaGrupos]);

  // Ordenar produtos (equipamentos) - memoizado para melhor performance
  const equipamentosOrdenados = useMemo(() => {
    if (!equipamentos.length) return [];
    
    return [...equipamentos]
      .sort((a, b) => {
        switch (ordenacao) {
          case "quantidade":
            return b.quantidade - a.quantidade;
          case "valor":
            return b.valor - a.valor;
          case "margem":
            // Tratar margens não calculáveis (valor -1)
            const margemA = a.margem ?? 0;
            const margemB = b.margem ?? 0;
            if (margemA < 0) return 1; // Colocar produtos sem margem no final
            if (margemB < 0) return -1;
            return margemB - margemA;
          default:
            return b.quantidade - a.quantidade;
        }
      })
      .slice(0, 10); // Limitar aos 10 primeiros
  }, [equipamentos, ordenacao]);

  // Ordenar acessórios - memoizado para melhor performance
  const acessoriosOrdenados = useMemo(() => {
    // Filtrar apenas os acessórios principais (que não são especiais, sextavados ou emborrachados)
    const acessoriosPrincipais = acessorios.filter(a => 
      !CATEGORIAS_ACESSORIOS_ESPECIAIS.some(cat => a.nome.toUpperCase().includes(cat)) &&
      !a.nome.toLowerCase().includes("sextavado") &&
      !a.nome.toLowerCase().includes("emborrachado")
    );
    
    if (!acessoriosPrincipais.length) return [];
    
    return [...acessoriosPrincipais]
      .sort((a, b) => {
        switch (ordenacao) {
          case "quantidade":
            return b.quantidade - a.quantidade;
          case "valor":
            return b.valor - a.valor;
          case "margem":
            // Tratar margens não calculáveis (valor -1)
            const margemA = a.margem ?? 0;
            const margemB = b.margem ?? 0;
            if (margemA < 0) return 1; // Colocar produtos sem margem no final
            if (margemB < 0) return -1;
            return margemB - margemA;
          default:
            return b.quantidade - a.quantidade;
        }
      })
      .slice(0, 10); // Limitar aos 10 primeiros
  }, [acessorios, ordenacao]);

  // Configuração do gráfico para equipamentos - memoizada
  const equipamentosChartData: ChartData<'bar'> = useMemo(() => ({
    labels: equipamentosOrdenados.map(p => p.nome),
    datasets: [
      {
        label: ordenacao === "quantidade" 
          ? "Quantidade" 
          : ordenacao === "valor" 
            ? "Faturamento (R$)" 
            : "Margem de Lucro (R$)",
        data: equipamentosOrdenados.map(p => 
          ordenacao === "quantidade" 
            ? p.quantidade 
            : ordenacao === "valor" 
              ? p.valor 
              : (p.margem ?? 0)
        ),
        backgroundColor: "rgba(54, 162, 235, 0.8)", // Azul para equipamentos
        borderColor: "rgb(54, 162, 235)",
        borderWidth: 1,
      },
    ],
  }), [equipamentosOrdenados, ordenacao]);

  // Configuração do gráfico para acessórios - memoizada
  const acessoriosChartData: ChartData<'bar'> = useMemo(() => ({
    labels: acessoriosOrdenados.map(p => p.nome),
    datasets: [
      {
        label: ordenacao === "quantidade" 
          ? "Quantidade" 
          : ordenacao === "valor" 
            ? "Faturamento (R$)" 
            : "Margem de Lucro (R$)",
        data: acessoriosOrdenados.map(p => 
          ordenacao === "quantidade" 
            ? p.quantidade 
            : ordenacao === "valor" 
              ? p.valor 
              : (p.margem ?? 0)
        ),
        backgroundColor: "rgba(255, 99, 132, 0.8)", // Vermelho para acessórios
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 1,
      },
    ],
  }), [acessoriosOrdenados, ordenacao]);

  // Formatação de valores monetários - memoizada
  const formatarDinheiro = useCallback((valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }, []);

  // Formatação de margem percentual - memoizada
  const formatarMargem = useCallback((valor: number | string) => {
    if (valor === undefined || valor === null) return "N/A";
    
    // Se for string 'N/A', mantém assim
    if (typeof valor === 'string') return valor;
    
    // Se for número negativo, significa que não há margem calculável
    if (typeof valor === 'number' && valor < 0) return "N/A";
    
    // Formatar como percentual
    return new Intl.NumberFormat('pt-BR', { 
      style: 'percent', 
      minimumFractionDigits: 1, 
      maximumFractionDigits: 1 
    }).format(valor / 100);
  }, []);

  // Opções do gráfico (comuns para ambos) - memoizadas
  const chartOptions = useCallback((produtos: ProdutoItem[]): ChartOptions<'bar'> => ({
    indexAxis: 'y', // Barras horizontais
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        if (index >= 0 && index < produtos.length) {
          abrirDetalhesProduto(produtos[index]);
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Quantidade Vendida',
          color: '#ffffff' // Cor branca para o título do eixo X
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)' // Linhas de grade mais sutis
        },
        ticks: {
          color: '#ffffff' // Cor branca para os valores do eixo X
        }
      },
      y: {
        ticks: {
          autoSkip: false,
          font: {
            size: 9
          },
          color: '#ffffff', // Cor branca para os valores do eixo Y
          callback: (value, index) => {
            // Limitando o comprimento para melhor visualização
            const nome = produtos[index]?.nome || '';
            return nome;
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)' // Linhas de grade mais sutis
        }
      }
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          color: '#ffffff' // Cor branca para a legenda
        }
      },
      tooltip: {
        titleColor: '#ffffff', // Cor branca para o título do tooltip
        bodyColor: '#ffffff', // Cor branca para o corpo do tooltip
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = context.raw as number;
            const produto = produtos[context.dataIndex];
            
            if (ordenacao === "quantidade") {
              return `Quantidade: ${value} unidades - Valor: ${formatarDinheiro(produto.valor)}`;
            } else if (ordenacao === "valor") {
              return `Faturamento: ${formatarDinheiro(value)} - Quantidade: ${produto.quantidade} unidades`;
            } else {
              return `Lucro: ${formatarDinheiro(value)} - Quantidade: ${produto.quantidade} unidades`;
            }
          }
        }
      }
    },
    layout: {
      padding: {
        right: 120 // Espaço para os rótulos de valor
      }
    }
  }), [ordenacao, formatarDinheiro]);

  // Handlers para alternar visualizações
  const mudarParaGrafico = useCallback(() => setVisualizacao("grafico"), []);
  const mudarParaTabela = useCallback(() => setVisualizacao("tabela"), []);
  
  // Mudar ordenação
  const mudarOrdenacao = useCallback((valor: string) => {
    setOrdenacao(valor as OrdenacaoTipo);
  }, []);

  // Função para abrir o modal de detalhes do produto
  const abrirDetalhesProduto = (produto: ProdutoItem) => {
    // Criar uma cópia para não alterar o objeto original
    const produtoCopy = { ...produto };
    
    // Garantir que temos um ID (podemos substituir por nome se necessário)
    if (!produtoCopy.id) {
      // Gerar um ID baseado no nome do produto para rastreamento
      produtoCopy.id = produtoCopy.nome.replace(/\s+/g, '_').toLowerCase();
      console.log(`ID do produto foi gerado baseado no nome: ${produtoCopy.id}`);
    } else {
      console.log(`Usando ID existente do produto: ${produtoCopy.id}`);
    }
    
    setProdutoSelecionado(produtoCopy);
    setModalAberto(true);
  };
  
  // Função para abrir o modal de detalhes da venda
  const abrirDetalhesVenda = useCallback((venda: any) => {
    setVendaSelecionada(venda);
    setVendaModalAberto(true);
  }, []);

  // Componente para loading
  const ComponenteLoading = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-500" />
          Produtos e Acessórios Mais Vendidos
        </CardTitle>
        <CardDescription>Análise de produtos por categoria</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4" 
                 role="progressbar" 
                 aria-label="Carregando dados dos produtos"/>
            <p className="text-muted-foreground">Carregando produtos e acessórios mais vendidos...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Renderização condicional para estados de loading e erro
  if (loading) {
    return <ComponenteLoading />;
  }

  if (erro && !produtos.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Produtos e Acessórios Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-red-500">
            <p>{erro}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (produtos.length === 0 && equipamentos.length === 0 && acessorios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Produtos e Acessórios Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Nenhum produto ou acessório encontrado no período selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar visualização (tabela ou gráfico) para uma categoria específica
  const renderizarVisualizacao = (produtos: ProdutoItem[], titulo: string, icone: JSX.Element, color?: string) => {
    if (produtos.length === 0) {
      return (
        <div className="flex items-center justify-center h-[150px] mb-4">
          <p className="text-muted-foreground">
            Nenhum {titulo.toLowerCase()} encontrado no período selecionado
          </p>
        </div>
      );
    }

    const chartData = titulo.includes("Produtos") ? equipamentosChartData : 
                      titulo.includes("Acessórios mais vendidos") ? acessoriosChartData :
                      {
                        labels: produtos.map(p => p.nome),
                        datasets: [
                          {
                            label: ordenacao === "quantidade" 
                              ? "Quantidade" 
                              : ordenacao === "valor" 
                                ? "Faturamento (R$)" 
                                : "Margem de Lucro (R$)",
                            data: produtos.map(p => 
                              ordenacao === "quantidade" 
                                ? p.quantidade 
                                : ordenacao === "valor" 
                                  ? p.valor 
                                  : (p.margem ?? 0)
                            ),
                            backgroundColor: color || "rgba(153, 102, 255, 0.8)",
                            borderColor: color || "rgb(153, 102, 255)",
                            borderWidth: 1,
                          },
                        ],
                      };

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          {icone}
          <h3 className="text-md font-semibold">{titulo}</h3>
        </div>
        
        {visualizacao === "grafico" ? (
          <div className="h-[350px]">
            <Bar 
              data={chartData} 
              options={chartOptions(produtos)} 
              plugins={[
                {
                  id: 'customPlugin',
                  afterDraw: (chart: any) => {
                    const ctx = chart.ctx;
                    const xAxis = chart.scales.x;
                    const yAxis = chart.scales.y;
                    
                    ctx.save();
                    ctx.font = '9px Arial';
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'middle';
                    
                    produtos.forEach((produto, i) => {
                      const valor = produto.valor;
                      const quantidade = produto.quantidade;
                      const xPos = xAxis.getPixelForValue(quantidade) + 5;
                      const yPos = yAxis.getPixelForValue(i);
                      
                      ctx.fillStyle = '#ffffff'; // Cor branca para os rótulos de valores
                      ctx.fillText(`${formatarDinheiro(valor)}`, xPos + 70, yPos - 10);
                      ctx.fillText(`(${quantidade} vendidos)`, xPos + 70, yPos + 10);
                    });
                    
                    ctx.restore();
                  }
                }
              ]}
            />
          </div>
        ) : (
          <div className="overflow-auto max-h-[350px]">
            <table className="w-full text-sm" role="grid" aria-label={`Lista de ${titulo.toLowerCase()}`}>
              <thead className="text-xs bg-muted/30 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">
                    {titulo.includes("Produtos") ? "Produto" : "Acessório"}
                  </th>
                  <th className="px-3 py-2 text-right">Qtde</th>
                  <th className="px-3 py-2 text-right">Faturamento</th>
                  <th className="px-3 py-2 text-right">Lucro</th>
                  <th className="px-3 py-2 text-right">Margem %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {produtos.map((produto, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-muted/20 cursor-pointer" 
                    onClick={() => abrirDetalhesProduto(produto)}
                  >
                    <td className="px-3 py-2 font-medium">{produto.nome}</td>
                    <td className="px-3 py-2 text-right">{produto.quantidade}</td>
                    <td className="px-3 py-2 text-right">{formatarDinheiro(produto.valor)}</td>
                    <td className="px-3 py-2 text-right">{formatarDinheiro(produto.margem || 0)}</td>
                    <td className="px-3 py-2 text-right">
                      {formatarMargem(produto.margemPercentual)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              Produtos e Acessórios Mais Vendidos
            </CardTitle>
            <CardDescription>Análise por categoria no período selecionado</CardDescription>
            {erro && (
              <div className="mt-2 text-xs p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                <p>{erro}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button
              onClick={mudarParaGrafico}
              className={`p-2 rounded-md text-sm ${
                visualizacao === "grafico" 
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
              aria-pressed={visualizacao === "grafico"}
              aria-label="Visualizar em formato de gráfico"
            >
              Gráfico
            </button>
            <button
              onClick={mudarParaTabela}
              className={`p-2 rounded-md text-sm ${
                visualizacao === "tabela" 
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
              aria-pressed={visualizacao === "tabela"}
              aria-label="Visualizar em formato de tabela"
            >
              Tabela
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Tabs defaultValue="quantidade" onValueChange={mudarOrdenacao} value={ordenacao}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="quantidade" className="flex items-center justify-center gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>Quantidade</span>
              </TabsTrigger>
              <TabsTrigger value="valor" className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Faturamento</span>
              </TabsTrigger>
              <TabsTrigger value="margem" className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Lucro</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Produtos mais vendidos (Equipamentos) */}
        {renderizarVisualizacao(
          equipamentosOrdenados, 
          "Equipamentos mais vendidos (Valor unitário ≥ R$1.000,00)", 
          <Package className="h-4 w-4 text-amber-500" />,
          "rgba(54, 162, 235, 0.8)" // Cor azul para equipamentos
        )}
        
        <Separator className="my-4" />
        
        {/* Acessórios mais vendidos */}
        {renderizarVisualizacao(
          acessoriosOrdenados, 
          "Acessórios mais vendidos (Valor unitário < R$1.000,00)", 
          <ShoppingBag className="h-4 w-4 text-red-500" />,
          "rgba(255, 99, 132, 0.8)" // Cor vermelha para acessórios
        )}
        
        {/* Mostrar acessórios especiais se existirem */}
        {acessoriosEspeciais.length > 0 && (
          <>
            <Separator className="my-4" />
            {renderizarVisualizacao(
              acessoriosEspeciais.sort((a, b) => b.quantidade - a.quantidade).slice(0, 10),
              "Acessórios especiais (Anilhas, Halteres, etc.)",
              <Dumbbell className="h-4 w-4 text-purple-500" />,
              "rgba(153, 102, 255, 0.8)" // Cor roxa para acessórios especiais
            )}
          </>
        )}
        
        {/* Mostrar acessórios sextavados se existirem */}
        {acessoriosSextavados.length > 0 && (
          <>
            <Separator className="my-4" />
            {renderizarVisualizacao(
              acessoriosSextavados.sort((a, b) => b.quantidade - a.quantidade).slice(0, 10),
              "Halteres Sextavados",
              <Dumbbell className="h-4 w-4 text-blue-500" />,
              "rgba(75, 192, 192, 0.8)" // Cor azul-esverdeada para halteres sextavados
            )}
          </>
        )}
        
        {/* Mostrar acessórios emborrachados se existirem */}
        {acessoriosEmborrachados.length > 0 && (
          <>
            <Separator className="my-4" />
            {renderizarVisualizacao(
              acessoriosEmborrachados.sort((a, b) => b.quantidade - a.quantidade).slice(0, 10),
              "Halteres Emborrachados",
              <Dumbbell className="h-4 w-4 text-green-500" />,
              "rgba(129, 199, 132, 0.8)" // Cor verde para halteres emborrachados
            )}
          </>
        )}
        
        {/* Modal de detalhes do produto */}
        {produtoSelecionado && (
          <ProdutoDetalhesModal
            produto={produtoSelecionado}
            open={modalAberto}
            onOpenChange={setModalAberto}
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        )}
        
        {/* Modal de detalhes da venda */}
        {vendaModalAberto && vendaSelecionada && (
          <VendaDetalheModal
            venda={vendaSelecionada}
            aberto={vendaModalAberto}
            onOpenChange={setVendaModalAberto}
            onClose={() => setVendaModalAberto(false)}
          />
        )}
      </CardContent>
    </Card>
  );
} 