import { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { ProdutoItem, OrdenacaoTipo } from '../hooks/useProdutosMaisVendidos';

/**
 * Cria a configuração de dados do gráfico para os produtos
 */
export function criarChartData(
  produtos: ProdutoItem[], 
  ordenacao: OrdenacaoTipo,
  cor: string
): ChartData<'bar'> {
  return {
    labels: produtos.map(p => p.nome),
    datasets: [
      {
        label: getDatasetLabel(ordenacao),
        data: produtos.map(p => getDataValue(p, ordenacao)),
        backgroundColor: cor,
        borderColor: cor.replace('0.8', '1'),
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Obtém o rótulo do dataset baseado no critério de ordenação
 */
function getDatasetLabel(ordenacao: OrdenacaoTipo): string {
  switch (ordenacao) {
    case "quantidade": return "Quantidade";
    case "valor": return "Faturamento (R$)";
    case "margem": return "Margem de Lucro (R$)";
    default: return "Quantidade";
  }
}

/**
 * Obtém o valor a ser exibido no gráfico baseado no critério de ordenação
 */
function getDataValue(produto: ProdutoItem, ordenacao: OrdenacaoTipo): number {
  switch (ordenacao) {
    case "quantidade": return produto.quantidade;
    case "valor": return produto.valor;
    case "margem": return produto.margem ?? 0;
    default: return produto.quantidade;
  }
}

/**
 * Cria as opções do gráfico
 */
export function criarChartOptions(
  produtos: ProdutoItem[],
  ordenacao: OrdenacaoTipo,
  formatarDinheiro: (valor: number) => string,
  onItemClick: (produto: ProdutoItem) => void
): ChartOptions<'bar'> {
  // Calcular a altura adequada do gráfico com base no número de produtos
  // Para garantir que cada item tenha pelo menos 36px de altura
  const alturaMinimaPorItem = 36;

  return {
    indexAxis: 'y', // Barras horizontais
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        if (index >= 0 && index < produtos.length) {
          onItemClick(produtos[index]);
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: getTitleText(ordenacao),
          color: '#ffffff',
          font: {
            size: 13,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      y: {
        ticks: {
          autoSkip: false,
          font: {
            size: 12, // Aumentado de 9 para 12
            weight: '500'
          },
          color: '#ffffff',
          padding: 8, // Adicionar padding para melhorar espaçamento
          callback: (value, index) => {
            const nome = produtos[index]?.nome || '';
            // Truncar nomes muito longos para melhorar a visualização
            return nome.length > 35 ? nome.substring(0, 35) + '...' : nome;
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        display: false,
        labels: {
          color: '#ffffff',
          font: {
            size: 13
          }
        }
      },
      tooltip: {
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 6,
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = context.raw as number;
            const produto = produtos[context.dataIndex];
            
            return getTooltipLabel(ordenacao, value, produto, formatarDinheiro);
          }
        }
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 130, // Aumentar espaço para os rótulos de valor
        top: 10,
        bottom: 10
      }
    }
  };
}

/**
 * Obtém o texto do título baseado no critério de ordenação
 */
function getTitleText(ordenacao: OrdenacaoTipo): string {
  switch (ordenacao) {
    case "quantidade": return "Quantidade Vendida";
    case "valor": return "Faturamento Total";
    case "margem": return "Lucro Total";
    default: return "Quantidade Vendida";
  }
}

/**
 * Obtém o rótulo do tooltip baseado no critério de ordenação
 */
function getTooltipLabel(
  ordenacao: OrdenacaoTipo, 
  value: number, 
  produto: ProdutoItem,
  formatarDinheiro: (valor: number) => string
): string {
  switch (ordenacao) {
    case "quantidade":
      return `Quantidade: ${value} unidades - Valor: ${formatarDinheiro(produto.valor)}`;
    case "valor":
      return `Faturamento: ${formatarDinheiro(value)} - Quantidade: ${produto.quantidade} unidades`;
    case "margem":
      return `Lucro: ${formatarDinheiro(value)} - Quantidade: ${produto.quantidade} unidades`;
    default:
      return `Quantidade: ${value} unidades`;
  }
} 
