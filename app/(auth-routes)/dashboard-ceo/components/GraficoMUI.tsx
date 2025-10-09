import dynamic from 'next/dynamic';
import 'chart.js/auto';
import { ProdutoItem, OrdenacaoTipo } from './hooks/useProdutosMaisVendidos';
import { criarChartData, criarChartOptions } from './utils/chartUtils';
import { Chart as ChartJS, Scale, Tick, ScaleOptionsByType, CartesianScaleTypeRegistry } from 'chart.js';

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

interface GraficoMUIProps {
  produtos: ProdutoItem[];
  ordenacao: OrdenacaoTipo;
  formatarDinheiro: (valor: number) => string;
  onItemClick: (produto: ProdutoItem) => void;
  corGrafico: string;
  altura?: number;
}

// Função para truncar texto mantendo palavras completas
function truncarTexto(texto: string, limite: number): string {
  if (texto.length <= limite) return texto;
  const palavras = texto.split(' ');
  let resultado = '';
  let comprimentoAtual = 0;
  
  for (const palavra of palavras) {
    if ((comprimentoAtual + palavra.length + 1) <= limite) {
      resultado += (resultado ? ' ' : '') + palavra;
      comprimentoAtual += palavra.length + 1;
    } else {
      break;
    }
  }
  
  return resultado + '...';
}

export function GraficoMUI({
  produtos,
  ordenacao,
  formatarDinheiro,
  onItemClick,
  corGrafico,
  altura = 350
}: GraficoMUIProps) {
  if (produtos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px]" aria-label="Sem dados para exibir">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    );
  }

  // Calcular altura dinâmica baseada no número de itens
  const alturaMinimaPorItem = 45;
  const alturaCalculada = Math.max(altura, produtos.length * alturaMinimaPorItem);

  // Preparar dados do gráfico com nomes truncados
  const chartData = {
    ...criarChartData(produtos.map(p => ({
      ...p,
      nome: truncarTexto(p.nome, 30)
    })), ordenacao, corGrafico)
  };
  
  // Criar opções do gráfico com configurações atualizadas
  const chartOptions: any = {
    ...criarChartOptions(produtos, ordenacao, formatarDinheiro, onItemClick),
    indexAxis: 'y' as const,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 120
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        grid: {
          display: true,
          drawBorder: true,
          drawOnChartArea: true,
          drawTicks: true,
        },
        ticks: {
          callback: function(this: Scale<any>, tickValue: number | string, index: number, ticks: Tick[]) {
            if (ordenacao === 'valor' && typeof tickValue === 'number') {
              return formatarDinheiro(tickValue);
            }
            return tickValue;
          },
          maxRotation: 0,
          minRotation: 0
        }
      },
      y: {
        type: 'category' as const,
        grid: {
          display: false
        },
        ticks: {
          padding: 10,
          callback: function(this: Scale<any>, tickValue: number | string, index: number, ticks: Tick[]) {
            const produto = produtos[index];
            return produto ? truncarTexto(produto.nome, 25) : '';
          },
          color: '#ffffff' // Cor branca para os nomes dos produtos
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const produto = produtos[context.dataIndex];
            const linhas = [
              `Valor: ${formatarDinheiro(produto.valor)}`,
              `Quantidade: ${produto.quantidade} ${produto.quantidade === 1 ? 'vendido' : 'vendidos'}`
            ];
            return linhas;
          },
          title: (context: any) => {
            const produto = produtos[context.at(0).dataIndex];
            return produto.nome;
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  return (
    <div style={{ height: `${alturaCalculada}px` }} className="mt-2">
      <Bar 
        data={chartData} 
        options={chartOptions} 
        plugins={[
          {
            id: 'customPlugin',
            afterDraw: (chart: ChartJS) => {
              const ctx = chart.ctx;
              const xAxis = chart.scales.x;
              const yAxis = chart.scales.y;
              
              if (!ctx || !xAxis || !yAxis) return;
              
              ctx.save();
              ctx.font = '12px Inter, sans-serif';
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              
              produtos.forEach((produto, i) => {
                const valor = produto.valor;
                const xPos = xAxis.right + 10;
                const yPos = yAxis.getPixelForValue(i);
                
                // Fundo semi-transparente para melhor legibilidade
                const metrics = ctx.measureText(formatarDinheiro(valor));
                const padding = 4;
                
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(
                  xPos - padding,
                  yPos - 12,
                  metrics.width + (padding * 2),
                  24
                );

                // Texto dos valores em branco
                ctx.fillStyle = '#ffffff';
                ctx.fillText(formatarDinheiro(valor), xPos, yPos);
              });
              
              ctx.restore();
            }
          }
        ]}
      />
    </div>
  );
} 