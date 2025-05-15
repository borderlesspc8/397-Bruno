import dynamic from 'next/dynamic';
import 'chart.js/auto';
import { ProdutoItem, OrdenacaoTipo } from './hooks/useProdutosMaisVendidos';
import { criarChartData, criarChartOptions } from './utils/chartUtils';

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
  // Cada item precisa de pelo menos 36px para boa visibilidade
  const alturaMinimaPorItem = 36;
  const alturaCalculada = Math.max(altura, produtos.length * alturaMinimaPorItem);

  // Preparar dados do gráfico
  const chartData = criarChartData(produtos, ordenacao, corGrafico);
  
  // Criar opções do gráfico
  const chartOptions = criarChartOptions(
    produtos,
    ordenacao,
    formatarDinheiro,
    onItemClick
  );

  return (
    <div style={{ height: `${alturaCalculada}px` }} className="mt-2">
      <Bar 
        data={chartData} 
        options={chartOptions} 
        plugins={[
          {
            id: 'customPlugin',
            afterDraw: (chart: any) => {
              const ctx = chart.ctx;
              const xAxis = chart.scales.x;
              const yAxis = chart.scales.y;
              
              ctx.save();
              ctx.font = '12px Arial, sans-serif';
              ctx.textAlign = 'right';
              ctx.textBaseline = 'middle';
              ctx.fontWeight = '500';
              
              produtos.forEach((produto, i) => {
                const valor = produto.valor;
                const quantidade = produto.quantidade;
                const xPos = xAxis.getPixelForValue(
                  ordenacao === "quantidade" ? quantidade : 
                  ordenacao === "valor" ? valor : 
                  produto.margem ?? 0
                ) + 5;
                const yPos = yAxis.getPixelForValue(i);
                
                // Adicionar destaque para melhor leitura dos valores
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.fillRect(xPos + 40, yPos - 20, 90, 40);

                ctx.fillStyle = '#ffffff';
                // Desenhar valores
                ctx.fillText(`${formatarDinheiro(valor)}`, xPos + 90, yPos - 8);
                ctx.fillText(`(${quantidade} ${quantidade === 1 ? 'vendido' : 'vendidos'})`, xPos + 90, yPos + 12);
              });
              
              ctx.restore();
            }
          }
        ]}
      />
    </div>
  );
} 