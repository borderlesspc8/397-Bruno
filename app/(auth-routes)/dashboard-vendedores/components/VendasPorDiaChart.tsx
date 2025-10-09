import { useState, useEffect, useMemo } from 'react';
import { format, eachDayOfInterval, isSameDay, isFuture, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/_components/ui/alert';
import { Button } from '@/app/_components/ui/button';
import { Skeleton } from '@/app/_components/ui/skeleton';
import { formatCurrency } from '@/app/_utils/format';

// Importações para Chart.js
import dynamic from 'next/dynamic';
import 'chart.js/auto';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement,
  LineElement
} from 'chart.js';

// Registrar componentes do Chart.js
if (typeof window !== 'undefined') {
  ChartJS.register(
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend,
    PointElement,
    LineElement
  );
}

// Carregar o componente Chart do Chart.js de forma dinâmica para evitar problemas de SSR
const Chart = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Chart),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-[300px]" aria-label="Carregando gráfico">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
      </div>
    )
  }
);

// Interface para os dados de vendas por dia
interface VendaPorDia {
  data: string;
  totalVendas: number;
  totalValor: number;
}

interface VendasPorDiaChartProps {
  dataInicio: Date;
  dataFim: Date;
}

// Definir tipos para o contexto do tooltip e Chart.js
interface TooltipContext {
  dataset: {
    label: string;
  };
  raw: number;
}

export function VendasPorDiaChart({ dataInicio, dataFim }: VendasPorDiaChartProps) {
  const [vendasPorDia, setVendasPorDia] = useState<VendaPorDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Garantir que o componente só renderize no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Buscar dados das vendas por dia - REATIVADO COM PROTEÇÃO CONTRA LOOPS
  useEffect(() => {
    if (!isMounted) return;
    
    const buscarVendasPorDia = async () => {
      setLoading(true);
      setErro(null);

      try {
        const response = await fetch(`/api/dashboard/vendas/diario?dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.erro) {
          setErro(data.erro);
          setVendasPorDia([]);
        } else {
          setVendasPorDia(data.vendasPorDia || []);
        }
      } catch (error) {
        console.error('Erro ao buscar vendas por dia:', error);
        setErro(error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados');
        setVendasPorDia([]);
      } finally {
        setLoading(false);
      }
    };

    buscarVendasPorDia();
  }, [dataInicio, dataFim, isMounted]);

  // Preparar dados para o gráfico usando exatamente a mesma lógica de processamento do VendasPorDia
  const dadosGrafico = useMemo(() => {
    // Criar array com todos os dias do intervalo
    const diasIntervalo = eachDayOfInterval({ start: dataInicio, end: dataFim })
      .filter(dia => !isFuture(dia)); // Filtrar datas futuras
    
    // Mapear os valores de vendas para cada dia do intervalo
    const dadosProcessados = diasIntervalo.map(dia => {
      // Buscar os dados deste dia nos dados recebidos da API
      const dadosDia = vendasPorDia.find(venda => {
        const dataVenda = parseISO(venda.data);
        return isSameDay(dataVenda, dia);
      });
      
      // Retornar dados do dia ou zeros se não houver
      return {
        data: format(dia, 'dd/MM', { locale: ptBR }),
        dataCompleta: format(dia, 'yyyy-MM-dd'),
        totalVendas: dadosDia?.totalVendas || 0,
        totalValor: dadosDia?.totalValor || 0
      };
    });
    
    // Ordenar cronologicamente para o gráfico
    const dadosOrdenados = [...dadosProcessados].sort((a, b) => {
      // Ordenar crescente por data
      return new Date(a.dataCompleta).getTime() - new Date(b.dataCompleta).getTime();
    });
    
    return {
      labels: dadosOrdenados.map(d => d.data),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Faturamento (R$)',
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgb(255, 159, 64)',
          borderWidth: 1,
          data: dadosOrdenados.map(d => d.totalValor),
          yAxisID: 'y',
        },
        {
          type: 'line' as const,
          label: 'Quantidade de Vendas',
          backgroundColor: 'rgba(54, 162, 235, 0.4)', 
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          fill: false,
          tension: 0.1,
          data: dadosOrdenados.map(d => d.totalVendas),
          yAxisID: 'y1',
        },
      ],
    };
  }, [vendasPorDia, dataInicio, dataFim]);

  // Opções do gráfico
  const opcoes = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#CCC'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipContext) {
            let label = context.dataset.label || '';
            let value = context.raw;
            
            if (label.includes('Faturamento')) {
              return `${label}: ${formatCurrency(value)}`;
            } else {
              return `${label}: ${value}`;
            }
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Valor (R$)',
          color: '#faba33',
        },
        ticks: {
          color: '#AAA',
          callback: function(value: number) {
            return formatCurrency(value);
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Vendas',
          color: 'rgb(54, 162, 235)',
        },
        ticks: {
          color: '#AAA',
          stepSize: 1, // Incremento mínimo de 1 (vendas são números inteiros)
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(255, 255, 255, 0.1)'
        },
      },
      x: {
        ticks: {
          color: '#AAA'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        title: {
          display: true,
          text: 'Data',
          color: '#AAA'
        }
      }
    },
  }), []);

  // Função para recarregar dados
  const recarregarDados = () => {
    setLoading(true);
    window.location.reload();
  };

  if (!isMounted) {
    return null;
  }

  // Se houver erro, mostrar mensagem de erro
  if (erro) {
    return (
      <div className="mt-4">
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="ml-2">
                {erro}
              <Button 
              onClick={recarregarDados} 
              size="sm" 
                variant="outline" 
                className="ml-2"
              >
              <RefreshCcw className="h-3 w-3 mr-1" />
              Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
      </div>
    );
  }

  // Se estiver carregando, mostrar indicador de carregamento
  if (loading) {
    return (
      <div className="h-[350px] flex flex-col items-center justify-center">
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  // Se não houver dados, mostrar mensagem
  if (vendasPorDia.length === 0) {
    return (
      <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
        <BarChart className="h-10 w-10 mb-3 opacity-20" />
        <p>Nenhuma venda registrada no período selecionado</p>
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full">
          <Chart 
            type="bar"
        data={dadosGrafico}
            options={opcoes} 
        aria-label="Gráfico de vendas por dia"
          />
        </div>
  );
} 