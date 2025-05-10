import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_components/ui/card';
import { format, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, DownloadCloud, Calendar, AlertTriangle, RefreshCcw } from 'lucide-react';
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
  LineElement,
  ChartData
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

// Tipos específicos para os datasets do gráfico
type VendasDataset = {
  type: 'bar';
  label: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  data: number[];
  yAxisID: string;
}

type QuantidadeDataset = {
  type: 'line';
  label: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  pointBackgroundColor: string;
  pointBorderColor: string;
  pointRadius: number;
  fill: boolean;
  tension: number;
  data: number[];
  yAxisID: string;
}

// Tipo composto para os dados do gráfico
type DadosGrafico = {
  labels: string[];
  datasets: [VendasDataset, QuantidadeDataset]; // Fixando para exatamente 2 datasets
}

interface VendasPorDiaChartProps {
  dataInicio: Date;
  dataFim: Date;
}

interface VendaPorDia {
  data: string;
  totalVendas: number;
  totalValor: number;
}

export function VendasPorDiaChart({ dataInicio, dataFim }: VendasPorDiaChartProps) {
  const [vendasPorDia, setVendasPorDia] = useState<VendaPorDia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [diagnostico, setDiagnostico] = useState<any>(null);

  // Buscar dados das vendas por dia
  useEffect(() => {
    const buscarVendasPorDia = async () => {
      setLoading(true);
      setErro(null);

      try {
        // Adicionando parâmetro debug para diagnóstico
        const response = await fetch(`/api/dashboard/vendas/diario?dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}&debug=true`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.erro) {
          setErro(data.erro);
          setVendasPorDia([]);
          setDiagnostico(null);
        } else {
          setVendasPorDia(data.vendasPorDia || []);
          // Salvar informações de diagnóstico
          if (data.diagnostico) {
            setDiagnostico(data.diagnostico);
            console.log('Diagnóstico de vendas por dia:', data.diagnostico);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar vendas por dia:', error);
        setErro(error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados');
        setVendasPorDia([]);
        setDiagnostico(null);
      } finally {
        setLoading(false);
      }
    };

    buscarVendasPorDia();
  }, [dataInicio, dataFim]);

  // Preparar dados para o gráfico
  const dadosGrafico = useMemo(() => {
    if (vendasPorDia.length === 0) {
      // Se não há dados, criar uma estrutura com todos os dias do intervalo sem vendas
      const diasIntervalo = eachDayOfInterval({ start: dataInicio, end: dataFim });
      
      return {
        labels: diasIntervalo.map(data => format(data, 'dd/MM', { locale: ptBR })),
        datasets: [
          {
            type: 'bar' as const,
            label: 'Faturamento (R$)',
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgb(255, 159, 64)',
            borderWidth: 1,
            data: diasIntervalo.map(() => 0),
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
            data: diasIntervalo.map(() => 0),
            yAxisID: 'y1',
          },
        ],
      };
    }

    // Criar array com todos os dias do intervalo
    const diasIntervalo = eachDayOfInterval({ start: dataInicio, end: dataFim });
    
    // Mapear os valores de vendas para cada dia do intervalo
    const dadosPorDia = diasIntervalo.map(dia => {
      // Buscar os dados deste dia nos dados recebidos da API
      const dadosDia = vendasPorDia.find(venda => {
        const dataVenda = new Date(venda.data);
        return isSameDay(dataVenda, dia);
      });
      
      // Retornar dados do dia ou zeros se não houver
      return {
        data: format(dia, 'dd/MM', { locale: ptBR }),
        totalVendas: dadosDia?.totalVendas || 0,
        totalValor: dadosDia?.totalValor || 0
      };
    });
    
    return {
      labels: dadosPorDia.map(d => d.data),
      datasets: [
        {
          type: 'bar' as const,
          label: 'Faturamento (R$)',
          backgroundColor: 'rgba(255, 159, 64, 0.6)',
          borderColor: 'rgb(255, 159, 64)',
          borderWidth: 1,
          data: dadosPorDia.map(d => d.totalValor),
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
          data: dadosPorDia.map(d => d.totalVendas),
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
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
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
          text: 'Faturamento (R$)',
          color: 'rgb(255, 159, 64)',
        },
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Quantidade de Vendas',
          color: 'rgb(54, 162, 235)',
        },
        grid: {
          drawOnChartArea: false,
        }
      },
      x: {
        title: {
          display: true,
          text: 'Dia do Mês',
        },
      }
    }
  }), []);

  // Função para recarregar os dados
  const recarregarDados = () => {
    setLoading(true);
    setErro(null);
    
    fetch(`/api/dashboard/vendas/diario?dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}&debug=true`)
      .then(response => {
        if (!response.ok) throw new Error(`Erro ao buscar dados: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data.erro) {
          setErro(data.erro);
          setVendasPorDia([]);
          setDiagnostico(null);
        } else {
          setVendasPorDia(data.vendasPorDia || []);
          // Salvar informações de diagnóstico
          if (data.diagnostico) {
            setDiagnostico(data.diagnostico);
            console.log('Diagnóstico de vendas por dia:', data.diagnostico);
          }
        }
      })
      .catch(error => {
        console.error('Erro ao buscar vendas por dia:', error);
        setErro(error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados');
        setVendasPorDia([]);
        setDiagnostico(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Função para exportar dados
  const exportarDados = () => {
    // Preparar dados para exportação
    const dados = vendasPorDia.map(venda => ({
      Data: new Date(venda.data).toLocaleDateString('pt-BR'),
      'Total de Vendas': venda.totalVendas,
      'Valor Total (R$)': venda.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }));
    
    // Converter para CSV
    const headers = Object.keys(dados[0]);
    const csvContent = [
      headers.join(','),
      ...dados.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n');
    
    // Criar blob e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas_por_dia_${format(dataInicio, 'dd-MM-yyyy')}_a_${format(dataFim, 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Renderização condicional com base no estado
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-amber-500" />
                Vendas por Dia
              </CardTitle>
              <CardDescription>Análise diária de vendas e faturamento</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-9 w-[100px]" />
              <Skeleton className="h-9 w-[100px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-amber-500" />
            Vendas por Dia
          </CardTitle>
          <CardDescription>Análise diária de vendas e faturamento</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex justify-between items-center">
              <div>
                {erro}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={recarregarDados}
                className="ml-2"
              >
                <RefreshCcw className="h-4 w-4 mr-1" /> Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-amber-500" />
              Vendas por Dia
            </CardTitle>
            <CardDescription>
              Análise diária de vendas e faturamento no período 
              ({format(dataInicio, 'dd/MM/yyyy', { locale: ptBR })} a {format(dataFim, 'dd/MM/yyyy', { locale: ptBR })})
            </CardDescription>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportarDados}
              disabled={vendasPorDia.length === 0}
              className="flex items-center gap-1"
            >
              <DownloadCloud className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={recarregarDados}
              className="flex items-center gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <Chart 
            type="bar"
            data={dadosGrafico} 
            options={opcoes} 
          />
        </div>
        
        {vendasPorDia.length === 0 && !loading && !erro && (
          <div className="text-center p-4 text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-2" />
            <p>Nenhuma venda encontrada no período selecionado</p>
          </div>
        )}
        
        {vendasPorDia.length > 0 && (
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total de Vendas:</span>{' '}
              <span className="font-medium">{vendasPorDia.reduce((sum, dia) => sum + dia.totalVendas, 0)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Faturamento Total:</span>{' '}
              <span className="font-medium">{formatCurrency(vendasPorDia.reduce((sum, dia) => sum + dia.totalValor, 0))}</span>
            </div>
          </div>
        )}
        
        {/* Exibir informações de diagnóstico quando disponível (apenas em modo de debug) */}
        {diagnostico && diagnostico.totalRecebidas > 0 && (
          <div className="text-xs text-muted-foreground mt-3 border-t pt-2">
            <span title="Informações de diagnóstico">
              Recebidas: {diagnostico.totalRecebidas} | 
              Processadas: {diagnostico.totalProcessadas} | 
              Sem data: {diagnostico.totalSemData} | 
              Datas únicas: {diagnostico.datasUnicas}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 