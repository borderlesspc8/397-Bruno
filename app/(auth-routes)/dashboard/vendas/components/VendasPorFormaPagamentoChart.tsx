import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, DownloadCloud, PieChart, AlertTriangle, RefreshCcw, FileSpreadsheet, Image, TrendingUp, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/_components/ui/alert';
import { Button } from '@/app/_components/ui/button';
import { Skeleton } from '@/app/_components/ui/skeleton';
import { formatCurrency } from '@/app/_utils/format';
import { cn } from '@/app/_lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/app/_components/ui/dropdown-menu';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';
import { Vendedor } from '@/app/_services/betelTecnologia';

// Importações para Chart.js
import dynamic from 'next/dynamic';
import 'chart.js/auto';
import { 
  Chart as ChartJS, 
  ArcElement,
  Tooltip, 
  Legend,
  ChartData
} from 'chart.js';

// Registrar componentes do Chart.js
if (typeof window !== 'undefined') {
  ChartJS.register(
    ArcElement,
    Tooltip, 
    Legend
  );
}

// Carregar o componente Chart do Chart.js de forma dinâmica para evitar problemas de SSR
const Doughnut = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Doughnut),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex items-center justify-center h-[300px]" aria-label="Carregando gráfico">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#faba33]"></div>
      </div>
    )
  }
);

interface VendasPorFormaPagamentoChartProps {
  dataInicio: Date;
  dataFim: Date;
  vendedores: Vendedor[];
  vendas?: any[]; // Receber vendas diretamente do componente pai
}

interface FormaPagamentoItem {
  formaPagamento: string;
  totalVendas: number;
  totalValor: number;
  percentual: number;
}

// Cores iOS26 para categorias específicas de formas de pagamento (apenas formas ativas)
const CORES_CATEGORIAS = {
  'PIX - C6': 'hsl(25 95% 53% / 0.8)',             // Laranja primário iOS26
  'PIX - BB': 'hsl(25 95% 60% / 0.8)',             // Laranja claro iOS26
  'PIX - STONE': 'hsl(25 95% 45% / 0.8)',          // Laranja médio iOS26
  'PIX': 'hsl(25 95% 70% / 0.8)',                  // Laranja claro iOS26 para PIX genérico
  'CRÉDITO - STONE': 'hsl(45 100% 50% / 0.8)',     // Amarelo primário iOS26
  'DÉBITO - STONE': 'hsl(142 69% 45% / 0.8)',      // Verde sucesso iOS26
  'ESPÉCIE - BB': 'hsl(25 95% 35% / 0.8)',         // Laranja escuro iOS26
  'BOLETO - BB': 'hsl(25 95% 60% / 0.8)',          // Laranja claro iOS26
  'A COMBINAR': 'hsl(0 0% 65% / 0.8)',             // Cinza claro iOS26
};

// Cores de borda correspondentes iOS26 (apenas formas ativas)
const CORES_BORDA_CATEGORIAS = {
  'PIX - C6': 'hsl(25 95% 53%)',
  'PIX - BB': 'hsl(25 95% 60%)',
  'PIX - STONE': 'hsl(25 95% 45%)',
  'PIX': 'hsl(25 95% 70%)',
  'CRÉDITO - STONE': 'hsl(45 100% 50%)',
  'DÉBITO - STONE': 'hsl(142 69% 45%)',
  'ESPÉCIE - BB': 'hsl(25 95% 35%)',
  'BOLETO - BB': 'hsl(25 95% 60%)',
  'A COMBINAR': 'hsl(0 0% 65%)',
};

// Cores genéricas iOS26 para formas de pagamento não mapeadas
const CORES_GRAFICO = [
  'hsl(25 95% 60% / 0.8)',      // Laranja claro iOS26
  'hsl(45 100% 60% / 0.8)',     // Amarelo claro iOS26
  'hsl(142 69% 38% / 0.8)',     // Verde sucesso escuro iOS26
  'hsl(0 84% 50% / 0.8)',       // Vermelho destrutivo escuro iOS26
  'hsl(25 95% 35% / 0.8)',      // Laranja escuro iOS26
  'hsl(45 100% 35% / 0.8)',     // Amarelo escuro iOS26
  'hsl(0 0% 20% / 0.8)',        // Preto claro iOS26
  'hsl(0 0% 80% / 0.8)',        // Cinza claro iOS26
  'hsl(25 95% 90% / 0.8)',      // Laranja muito claro iOS26
  'hsl(45 100% 90% / 0.8)',     // Amarelo muito claro iOS26
];

// Cores de borda genéricas iOS26
const CORES_BORDA = [
  'hsl(25 95% 60%)',
  'hsl(45 100% 60%)',
  'hsl(142 69% 38%)',
  'hsl(0 84% 50%)',
  'hsl(25 95% 35%)',
  'hsl(45 100% 35%)',
  'hsl(0 0% 20%)',
  'hsl(0 0% 80%)',
  'hsl(25 95% 90%)',
  'hsl(45 100% 90%)',
];

export function VendasPorFormaPagamentoChart({ dataInicio, dataFim, vendedores, vendas }: VendasPorFormaPagamentoChartProps) {
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Processar dados das vendas para formas de pagamento - usando mesma fonte que DashboardSummary
  useEffect(() => {
        const processarFormasPagamento = () => {
      setLoading(true);
      setErro(null);

      try {
            if (!vendas || !Array.isArray(vendas)) {
              console.log('Vendas não recebidas ou não é array:', vendas);
              setFormasPagamento([]);
              setLoading(false);
              return;
            }
            
            console.log('Vendas recebidas:', vendas.length, 'vendas');

        // Mapeamento para categorias específicas de forma de pagamento (mesmo da API)
        const CATEGORIAS_PAGAMENTO: Record<string, string> = {
          'PIX - C6': 'PIX - C6',
          'PIX C6': 'PIX - C6',
          'PIX - BB': 'PIX - BB',
          'PIX - STONE': 'PIX - STONE',
          'PIX': 'PIX',
          'ELO CRÉDITO STONE': 'CRÉDITO - STONE',
          'MASTERCARD CRÉDITO STONE': 'CRÉDITO - STONE',
          'MASTER CRÉDITO': 'CRÉDITO - STONE',
          'VISA CRÉDITO STONE': 'CRÉDITO - STONE',
          'Cartão de Crédito Stone': 'CRÉDITO - STONE',
          'CRÉDITO - Stone': 'CRÉDITO - STONE',
          'CRÉDITO - STONE': 'CRÉDITO - STONE',
          'CRÉDITO - Itaú': 'CRÉDITO - STONE',
          'CRÉDITO - ITAÚ': 'CRÉDITO - STONE',
          'CRÉDITO - Slipay': 'CRÉDITO - STONE',
          'CRÉDITO - SLIPAY': 'CRÉDITO - STONE',
          'Cartão de Crédito': 'CRÉDITO - STONE',
          'Crédito': 'CRÉDITO - STONE',
          'DÉBITO - Slipay': 'DÉBITO - STONE',
          'DÉBITO - SLIPAY': 'DÉBITO - STONE',
          'DEBITO - Slipay': 'DÉBITO - STONE',
          'DEBITO - SLIPAY': 'DÉBITO - STONE',
          'DÉBITO - Stone': 'DÉBITO - STONE',
          'DÉBITO - STONE': 'DÉBITO - STONE',
          'DÉBITO - Itaú': 'DÉBITO - STONE',
          'DÉBITO - ITAÚ': 'DÉBITO - STONE',
          'DÉBITO - C6': 'DÉBITO - STONE',
          'Cartão de Débito': 'DÉBITO - STONE',
          'Débito': 'DÉBITO - STONE',
          'Dinheiro à Vista': 'ESPÉCIE - BB',
          'Dinheiro': 'ESPÉCIE - BB',
          'Especie': 'ESPÉCIE - BB',
          'ESPÉCIE - BB': 'ESPÉCIE - BB',
          'Moeda': 'ESPÉCIE - BB',
          'BOLETO': 'BOLETO - BB',
          'Boleto Bancário': 'BOLETO - BB',
          'Boleto': 'BOLETO - BB',
          'BOLETO - BB': 'BOLETO - BB',
          'A COMBINAR': 'A COMBINAR',
          'A Combinar': 'A COMBINAR',
          'A combinar': 'A COMBINAR'
        };

        // Função para normalizar a forma de pagamento
        const normalizarFormaPagamento = (forma: string): string => {
          if (!forma) {
            console.log('Forma de pagamento vazia, retornando A COMBINAR');
            return 'A COMBINAR';
          }
          
          console.log(`Normalizando forma de pagamento: "${forma}"`);
          
          if (CATEGORIAS_PAGAMENTO[forma]) {
            console.log(`Encontrado no mapeamento direto: "${forma}" -> "${CATEGORIAS_PAGAMENTO[forma]}"`);
            return CATEGORIAS_PAGAMENTO[forma];
          }
          
          const formaNormalizada = forma.trim();
          console.log(`Forma normalizada: "${formaNormalizada}"`);
          
          if (formaNormalizada.includes('PIX')) {
            if (formaNormalizada.includes('C6')) {
              console.log('Detectado PIX - C6');
              return 'PIX - C6';
            } else if (formaNormalizada.includes('BB')) {
              console.log('Detectado PIX - BB');
              return 'PIX - BB';
            } else if (formaNormalizada.includes('STONE')) {
              console.log('Detectado PIX - STONE');
              return 'PIX - STONE';
            } else {
              console.log('Detectado PIX genérico');
              return 'PIX';
            }
          }
          if (formaNormalizada.includes('BOLETO') || formaNormalizada.includes('Boleto')) return 'BOLETO - BB';
          if (formaNormalizada.toLowerCase().includes('dinheiro') || formaNormalizada.toLowerCase().includes('à vista') || 
              formaNormalizada.toLowerCase().includes('especie') || formaNormalizada.toLowerCase().includes('moeda')) return 'ESPÉCIE - BB';
          
          if (formaNormalizada.includes('CRÉDIT') || formaNormalizada.includes('Crédit') || 
              formaNormalizada.includes('CREDIT') || formaNormalizada.includes('Credit')) {
            console.log('Detectado CRÉDITO');
            return 'CRÉDITO - STONE';
          }
          
          if (formaNormalizada.includes('DÉBIT') || formaNormalizada.includes('Débit') ||
              formaNormalizada.includes('DEBIT') || formaNormalizada.includes('Debit')) {
            console.log('Detectado DÉBITO');
            return 'DÉBITO - STONE';
          }
          
          console.log(`Forma não reconhecida: "${formaNormalizada}", retornando A COMBINAR`);
          return 'A COMBINAR';
        };

        // Agrupar vendas por forma de pagamento
        const formasPagamentoMap = new Map<string, { totalVendas: number; totalValor: number }>();
        let valorTotal = 0;
        
        vendas.forEach((venda: any, index: number) => {
          const valorVenda = typeof venda.valor_total === 'string' 
            ? parseFloat(venda.valor_total) 
            : Number(venda.valor_total) || 0;
          
          valorTotal += valorVenda;
          
          // Determinar a forma de pagamento da venda
          let formaPagamento = 'A COMBINAR';
          
          // Debug: log da venda para entender a estrutura
          if (index < 3) { // Log apenas das primeiras 3 vendas para debug
            console.log(`Venda ${index + 1} (ID: ${venda.id}):`, {
              forma_pagamento: venda.forma_pagamento,
              metodo_pagamento: venda.metodo_pagamento,
              pagamentos: venda.pagamentos?.map(p => ({
                nome_forma_pagamento: p.pagamento?.nome_forma_pagamento
              }))
            });
          }
          
          // Primeiro, tentar usar a forma de pagamento principal da venda
          if (venda.forma_pagamento || venda.metodo_pagamento) {
            const formaOriginal = venda.forma_pagamento || venda.metodo_pagamento || 'A COMBINAR';
            formaPagamento = normalizarFormaPagamento(formaOriginal);
          } else if (venda.pagamentos && Array.isArray(venda.pagamentos) && venda.pagamentos.length > 0) {
            // Se não há forma principal, usar a do primeiro pagamento
            const primeiroPagamento = venda.pagamentos[0]?.pagamento;
            if (primeiroPagamento?.nome_forma_pagamento) {
              const formaOriginal = primeiroPagamento.nome_forma_pagamento;
              formaPagamento = normalizarFormaPagamento(formaOriginal);
              if (index < 3) {
                console.log(`Venda ${index + 1}: forma original = "${formaOriginal}", normalizada = "${formaPagamento}"`);
              }
            }
          }
          
          // Adicionar à contagem
          if (formasPagamentoMap.has(formaPagamento)) {
            const dadosExistentes = formasPagamentoMap.get(formaPagamento)!;
            formasPagamentoMap.set(formaPagamento, {
              totalVendas: dadosExistentes.totalVendas + 1,
              totalValor: dadosExistentes.totalValor + valorVenda
            });
          } else {
            formasPagamentoMap.set(formaPagamento, {
              totalVendas: 1,
              totalValor: valorVenda
            });
          }
        });
        
        // Converter o Map para um array e calcular percentuais
        const formasPagamentoProcessadas = Array.from(formasPagamentoMap.entries()).map(([formaPagamento, dados]) => ({
          formaPagamento,
          totalVendas: dados.totalVendas,
          totalValor: dados.totalValor,
          percentual: valorTotal > 0 ? (dados.totalValor / valorTotal) * 100 : 0
        }));
        
        // Ordenar por valor total (decrescente)
        formasPagamentoProcessadas.sort((a, b) => b.totalValor - a.totalValor);
        
        console.log('Dados processados localmente para formas de pagamento:', {
          totalVendas: vendas.length,
          formasPagamento: formasPagamentoProcessadas.length,
            valorTotal: valorTotal,
          formas: formasPagamentoProcessadas.map(f => ({ forma: f.formaPagamento, valor: f.totalValor, vendas: f.totalVendas }))
        });
        
        // Log detalhado para debug
        console.log('Formas de pagamento encontradas:', formasPagamentoProcessadas.map(f => f.formaPagamento));
        
        // Log das primeiras vendas para debug
        console.log('Primeiras 3 vendas recebidas:', vendas.slice(0, 3).map(v => ({
          id: v.id,
          forma_pagamento: v.forma_pagamento,
          metodo_pagamento: v.metodo_pagamento,
          pagamentos: v.pagamentos?.map(p => p.pagamento?.nome_forma_pagamento)
        })));
        
        setFormasPagamento(formasPagamentoProcessadas);
      } catch (error) {
        console.error('Erro ao processar formas de pagamento:', error);
        setErro(error instanceof Error ? error.message : 'Erro desconhecido ao processar dados');
        setFormasPagamento([]);
      } finally {
        setLoading(false);
      }
    };

    processarFormasPagamento();
  }, [vendas]);

  // Preparar dados para o gráfico
  const dadosGrafico = useMemo(() => {
    // Usar apenas as 9 maiores formas de pagamento e agrupar o restante como "Outros"
    let dadosAgrupados = [...formasPagamento];
    
    if (dadosAgrupados.length > 9) {
      // Ordenar por valor total
      dadosAgrupados.sort((a, b) => b.totalValor - a.totalValor);
      
      // Pegar as 8 principais
      const principais = dadosAgrupados.slice(0, 8);
      
      // Agrupar as restantes como "Outros"
      const outros = dadosAgrupados.slice(8);
      const outrosTotal = {
        formaPagamento: 'Outros',
        totalVendas: outros.reduce((sum, item) => sum + item.totalVendas, 0),
        totalValor: outros.reduce((sum, item) => sum + item.totalValor, 0),
        percentual: outros.reduce((sum, item) => sum + item.percentual, 0)
      };
      
      // Adicionar "Outros" ao final
      dadosAgrupados = [...principais, outrosTotal];
    }
    
    // Atribuir cores consistentes às categorias principais e cores genéricas às demais
    const cores = dadosAgrupados.map(item => 
      CORES_CATEGORIAS[item.formaPagamento as keyof typeof CORES_CATEGORIAS] || 
      CORES_GRAFICO[dadosAgrupados.indexOf(item) % CORES_GRAFICO.length]
    );
    
    const coresBorda = dadosAgrupados.map(item => 
      CORES_BORDA_CATEGORIAS[item.formaPagamento as keyof typeof CORES_BORDA_CATEGORIAS] || 
      CORES_BORDA[dadosAgrupados.indexOf(item) % CORES_BORDA.length]
    );
    
    return {
      labels: dadosAgrupados.map(item => `${item.formaPagamento} (${item.percentual.toFixed(1)}%)`),
      datasets: [
        {
          data: dadosAgrupados.map(item => item.totalValor),
          backgroundColor: cores,
          borderColor: coresBorda,
          borderWidth: 1,
        },
      ],
    };
  }, [formasPagamento]);

  // Opções do gráfico iOS26
  const opcoes = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 16,
          font: {
            size: 12,
            weight: '500' as const,
            family: 'system-ui, -apple-system, sans-serif'
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        titleFont: {
          size: 13,
          weight: '600' as const
        },
        bodyFont: {
          size: 12,
          weight: '500' as const
        },
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label.split(' (')[0]}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '65%', // Efeito de rosca mais pronunciado
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
    elements: {
      arc: {
        borderWidth: 2,
        borderAlign: 'center' as const
      }
    }
  }), []);

  // Função para recarregar os dados (agora apenas reprocessa os dados locais)
  const recarregarDados = () => {
    if (vendas && Array.isArray(vendas)) {
      // Força reprocessamento dos dados locais
    setLoading(true);
    setErro(null);
    
      // Simular um pequeno delay para mostrar o loading
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  // Função para exportar dados para Excel (XLSX)
  const exportarExcel = async () => {
    try {
      // Criar um novo workbook
      const workbook = new ExcelJS.Workbook();
      
      // Adicionar uma planilha
      const worksheet = workbook.addWorksheet('Formas de Pagamento');
      
      // Definir colunas com largura adequada
      worksheet.columns = [
        { header: 'Forma de Pagamento', key: 'formaPagamento', width: 25 },
        { header: 'Total de Vendas', key: 'totalVendas', width: 15 },
        { header: 'Valor Total (R$)', key: 'totalValor', width: 18 },
        { header: 'Percentual (%)', key: 'percentual', width: 15 }
      ];
      
      // Adicionar os dados
      formasPagamento.forEach(item => {
        worksheet.addRow({
          formaPagamento: item.formaPagamento,
          totalVendas: item.totalVendas,
          totalValor: item.totalValor,
          percentual: item.percentual
        });
      });
      
      // Adicionar linha com total
      const totalRow = worksheet.addRow({
        formaPagamento: 'TOTAL',
        totalVendas: formasPagamento.reduce((sum, item) => sum + item.totalVendas, 0),
        totalValor: formasPagamento.reduce((sum, item) => sum + item.totalValor, 0),
        percentual: 100
      });
      
      // Formatar cabeçalho
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
      // Formatar linha de total
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' }
      };
      
      // Formatar colunas numéricas
      for (let i = 2; i <= worksheet.rowCount; i++) {
        // Formatar números com casas decimais
        const valorCell = worksheet.getCell(`C${i}`);
        valorCell.numFmt = '#,##0.00 R$';
        
        // Formatar percentuais
        const percentCell = worksheet.getCell(`D${i}`);
        percentCell.numFmt = '0.00%';
        percentCell.value = (percentCell.value as number) / 100; // Converter para decimal para formatação percentual
        
        // Alinhar números à direita
        worksheet.getRow(i).getCell(2).alignment = { horizontal: 'right' };
        worksheet.getRow(i).getCell(3).alignment = { horizontal: 'right' };
        worksheet.getRow(i).getCell(4).alignment = { horizontal: 'right' };
      }
      
      // Adicionar bordas a todas as células
      for (let i = 1; i <= worksheet.rowCount; i++) {
        for (let j = 1; j <= worksheet.columnCount; j++) {
          worksheet.getRow(i).getCell(j).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }
      }
      
      // Adicionar título do relatório acima da tabela
      worksheet.spliceRows(1, 0, 
        ['Relatório de Vendas por Forma de Pagamento'],
        [`Período: ${format(dataInicio, 'dd/MM/yyyy', { locale: ptBR })} a ${format(dataFim, 'dd/MM/yyyy', { locale: ptBR })}`],
        [''] // Linha em branco
      );
      
      // Formatar título
      worksheet.getCell('A1').font = { bold: true, size: 14 };
      worksheet.getCell('A2').font = { italic: true };
      worksheet.mergeCells('A1:D1');
      worksheet.mergeCells('A2:D2');
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };
      
      // Gerar o arquivo
      const buffer = await workbook.xlsx.writeBuffer();
    
      // Criar blob e link para download
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `vendas_por_forma_pagamento_${format(dataInicio, 'dd-MM-yyyy')}_a_${format(dataFim, 'dd-MM-yyyy')}.xlsx`;
      link.click();
      
      // Limpar recursos
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      alert('Não foi possível exportar os dados para Excel. Tente novamente mais tarde.');
    }
  };

  // Função para exportar como imagem
  const exportarImagem = () => {
    // Obter o elemento do gráfico
    const graficoElement = document.getElementById('grafico-formas-pagamento');
    
    if (!graficoElement) {
      console.error('Elemento do gráfico não encontrado');
      return;
    }
    
    // Usar html2canvas para converter o gráfico em uma imagem
    try {
      html2canvas(graficoElement, {
        backgroundColor: null,
        scale: 2, // Melhor qualidade
        logging: false,
      }).then((canvas: HTMLCanvasElement) => {
        // Converter para imagem PNG
        const dataUrl = canvas.toDataURL('image/png');
        
        // Criar link para download
    const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `vendas_por_forma_pagamento_${format(dataInicio, 'dd-MM-yyyy')}_a_${format(dataFim, 'dd-MM-yyyy')}.png`;
    link.click();
      }).catch(err => {
        console.error('Erro ao gerar imagem:', err);
        alert('Não foi possível exportar a imagem. Tente novamente mais tarde.');
      });
    } catch (error) {
      console.error('Erro ao exportar imagem:', error);
      alert('Não foi possível exportar a imagem. Tente novamente mais tarde.');
    }
  };

  // Renderização condicional com base no estado
  if (loading) {
    return (
      <div className="ios26-card p-6 ios26-animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
                <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              Vendas por Forma de Pagamento
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Distribuição de vendas por método de pagamento
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="ios26-skeleton h-[400px] w-full" />
          <div className="flex justify-between">
            <div className="ios26-skeleton h-9 w-[100px]" />
            <div className="ios26-skeleton h-9 w-[100px]" />
          </div>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="ios26-card p-6 ios26-animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
                <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              Vendas por Forma de Pagamento
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Distribuição de vendas por método de pagamento
            </p>
          </div>
        </div>
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
              className="ml-2 ios26-button"
            >
              <RefreshCcw className="h-4 w-4 mr-1" /> Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (formasPagamento.length === 0) {
    return (
      <div className="ios26-card p-6 ios26-animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
                <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              Vendas por Forma de Pagamento
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Distribuição de vendas por método de pagamento
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-[400px]">
          <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl mb-4">
            <PieChart className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-center">Nenhuma forma de pagamento encontrada no período selecionado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ios26-card p-6 ios26-animate-fade-in">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
              <CreditCard className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            Vendas por Forma de Pagamento
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Distribuição de vendas por método de pagamento no período 
            ({format(dataInicio, 'dd/MM/yyyy', { locale: ptBR })} a {format(dataFim, 'dd/MM/yyyy', { locale: ptBR })})
          </p>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={formasPagamento.length === 0}
                className="flex items-center gap-1 ios26-button"
              >
                <DownloadCloud className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportarExcel} className="cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exportar como Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportarImagem} className="cursor-pointer">
                <Image className="h-4 w-4 mr-2" />
                Exportar como Imagem
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            variant="outline" 
            size="sm"
            onClick={recarregarDados}
            className="flex items-center gap-1 ios26-button"
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>
      
      <div className="ios26-chart-container">
        <div className="h-[400px] flex items-center justify-center">
          <div className="w-full h-full max-w-[600px] mx-auto" id="grafico-formas-pagamento">
            <Doughnut 
              data={dadosGrafico} 
              options={opcoes} 
            />
          </div>
        </div>
      </div>
      
      {formasPagamento.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-muted/30 to-muted/20 rounded-2xl">
          <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl">
                <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <span className="text-muted-foreground">Total de Formas:</span>{' '}
                <span className="font-semibold text-foreground">{formasPagamento.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl">
                <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <span className="text-muted-foreground">Valor Total:</span>{' '}
                <span className="font-semibold text-foreground ios26-currency-medium">
                  {formatCurrency(formasPagamento.reduce((sum, item) => sum + item.totalValor, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 