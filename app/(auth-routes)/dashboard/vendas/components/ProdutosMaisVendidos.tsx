import { useState, useEffect } from "react";
import { Package, ArrowUpDown, TrendingUp } from "lucide-react";
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

// Importações para Chart.js
import dynamic from 'next/dynamic';
import 'chart.js/auto';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Registrar componentes do Chart.js
if (typeof window !== 'undefined') {
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
}

// Carregar o componente Bar do Chart.js de forma dinâmica para evitar problemas de SSR
const Bar = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Bar),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[300px]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
  </div> }
);

interface ProdutoItem {
  nome: string;
  quantidade: number;
  valor: number;
  custo?: number;
  margem: number;
  margemPercentual: number | string;
}

interface ProdutosMaisVendidosProps {
  dataInicio: Date;
  dataFim: Date;
}

export function ProdutosMaisVendidos({ dataInicio, dataFim }: ProdutosMaisVendidosProps) {
  const { data: session } = useSession();
  const userEmail = session?.user?.email;

  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<"quantidade" | "valor" | "margem">("quantidade");
  const [visualizacao, setVisualizacao] = useState<"grafico" | "tabela">("grafico");

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

        // Formatar datas para a requisição
        const dataInicioFormatada = dataInicio.toISOString().split('T')[0];
        const dataFimFormatada = dataFim.toISOString().split('T')[0];

        const response = await axios.get(`/api/gestao-click/produtos-mais-vendidos`, {
          params: {
            userEmail,
            dataInicio: dataInicioFormatada,
            dataFim: dataFimFormatada
          }
        });
        
        if (response.data && Array.isArray(response.data.produtos)) {
          setProdutos(response.data.produtos);
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
  }, [dataInicio, dataFim, userEmail]);

  // Ordenar produtos de acordo com o critério selecionado
  const produtosOrdenados = [...produtos].sort((a, b) => {
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
  }).slice(0, 10); // Limitar aos 10 primeiros

  // Configuração do gráfico
  const chartData = {
    labels: produtosOrdenados.map(p => p.nome.length > 12 ? `${p.nome.substring(0, 12)}...` : p.nome),
    datasets: [
      {
        label: ordenacao === "quantidade" 
          ? "Quantidade" 
          : ordenacao === "valor" 
            ? "Faturamento (R$)" 
            : "Margem de Lucro (R$)",
        data: produtosOrdenados.map(p => 
          ordenacao === "quantidade" 
            ? p.quantidade 
            : ordenacao === "valor" 
              ? p.valor 
              : (p.margem ?? 0)
        ),
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(231, 233, 237, 0.6)",
          "rgba(129, 199, 132, 0.6)",
          "rgba(121, 134, 203, 0.6)",
          "rgba(171, 71, 188, 0.6)"
        ],
        borderColor: [
          "rgb(54, 162, 235)",
          "rgb(75, 192, 192)",
          "rgb(255, 159, 64)",
          "rgb(153, 102, 255)",
          "rgb(255, 99, 132)",
          "rgb(255, 206, 86)",
          "rgb(231, 233, 237)",
          "rgb(129, 199, 132)",
          "rgb(121, 134, 203)",
          "rgb(171, 71, 188)"
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => {
            if (ordenacao === "quantidade") return value;
            return new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            if (ordenacao === "quantidade") {
              return `Quantidade: ${value} unidades`;
            } else if (ordenacao === "valor") {
              return `Faturamento: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)}`;
            } else {
              return `Lucro: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)}`;
            }
          }
        }
      }
    }
  };

  // Formatação de valores monetários
  const formatarDinheiro = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // Formatação de margem percentual
  const formatarMargem = (valor: number | string) => {
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
  };

  // Renderização condicional para estados de loading e erro
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Produtos Mais Vendidos
          </CardTitle>
          <CardDescription>Analisando produtos mais lucrativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#faba33] mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando produtos mais vendidos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (erro && !produtos.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Produtos Mais Vendidos
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

  if (produtos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            Produtos Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground">Nenhum produto encontrado no período selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-500" />
              Produtos Mais Vendidos
            </CardTitle>
            <CardDescription>Top 10 produtos no período selecionado</CardDescription>
            {erro && (
              <div className="mt-2 text-xs p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                <p>{erro}</p>
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <button
              onClick={() => setVisualizacao("grafico")}
              className={`p-2 rounded-md text-sm ${
                visualizacao === "grafico" 
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              Gráfico
            </button>
            <button
              onClick={() => setVisualizacao("tabela")}
              className={`p-2 rounded-md text-sm ${
                visualizacao === "tabela" 
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              Tabela
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Tabs defaultValue="quantidade" onValueChange={(v) => setOrdenacao(v as any)} value={ordenacao}>
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

        {visualizacao === "grafico" ? (
          <div className="h-[300px]">
            <Bar data={chartData} options={chartOptions as any} />
          </div>
        ) : (
          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-sm">
              <thead className="text-xs bg-muted/30 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Produto</th>
                  <th className="px-3 py-2 text-right">Qtde</th>
                  <th className="px-3 py-2 text-right">Faturamento</th>
                  <th className="px-3 py-2 text-right">Lucro</th>
                  <th className="px-3 py-2 text-right">Margem %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {produtosOrdenados.map((produto, index) => (
                  <tr key={index} className="hover:bg-muted/20">
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
      </CardContent>
    </Card>
  );
} 