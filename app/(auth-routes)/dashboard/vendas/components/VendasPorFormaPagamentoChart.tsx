import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/_components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, DownloadCloud, PieChart, AlertTriangle, RefreshCcw, FileSpreadsheet, Image } from 'lucide-react';
import { Alert, AlertDescription } from '@/app/_components/ui/alert';
import { Button } from '@/app/_components/ui/button';
import { Skeleton } from '@/app/_components/ui/skeleton';
import { formatCurrency } from '@/app/_utils/format';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/app/_components/ui/dropdown-menu';
import html2canvas from 'html2canvas';
import ExcelJS from 'exceljs';

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
}

interface FormaPagamentoItem {
  formaPagamento: string;
  totalVendas: number;
  totalValor: number;
  percentual: number;
}

// Cores para categorias específicas de formas de pagamento para garantir consistência
const CORES_CATEGORIAS = {
  'Crédito': 'rgba(54, 162, 235, 0.7)',    // Azul
  'Débito': 'rgba(75, 192, 192, 0.7)',     // Verde-água
  'PIX': 'rgba(255, 206, 86, 0.7)',        // Amarelo
  'Dinheiro à Vista': 'rgba(255, 159, 64, 0.7)', // Laranja
  'Boleto': 'rgba(153, 102, 255, 0.7)',    // Roxo
  'Link de Pagamento': 'rgba(255, 99, 132, 0.7)', // Rosa
  'Transferência Bancária': 'rgba(50, 205, 50, 0.7)', // Verde
  'Outros': 'rgba(199, 199, 199, 0.7)',    // Cinza
};

// Cores de borda correspondentes
const CORES_BORDA_CATEGORIAS = {
  'Crédito': 'rgb(54, 162, 235)',
  'Débito': 'rgb(75, 192, 192)',
  'PIX': 'rgb(255, 206, 86)',
  'Dinheiro à Vista': 'rgb(255, 159, 64)',
  'Boleto': 'rgb(153, 102, 255)',
  'Link de Pagamento': 'rgb(255, 99, 132)',
  'Transferência Bancária': 'rgb(50, 205, 50)',
  'Outros': 'rgb(199, 199, 199)',
};

// Cores genéricas para formas de pagamento não mapeadas
const CORES_GRAFICO = [
  'rgba(83, 102, 255, 0.7)',    // Azul-violeta
  'rgba(255, 99, 71, 0.7)',     // Vermelho
  'rgba(0, 128, 128, 0.7)',     // Teal
  'rgba(210, 105, 30, 0.7)',    // Chocolate
  'rgba(128, 0, 128, 0.7)',     // Roxo escuro
  'rgba(46, 139, 87, 0.7)',     // Verde mar
  'rgba(220, 20, 60, 0.7)',     // Vermelho escuro
  'rgba(0, 139, 139, 0.7)',     // Ciano escuro
  'rgba(184, 134, 11, 0.7)',    // Dourado escuro
  'rgba(139, 0, 139, 0.7)',     // Magenta escuro
];

// Cores de borda genéricas
const CORES_BORDA = [
  'rgb(83, 102, 255)',
  'rgb(255, 99, 71)',
  'rgb(0, 128, 128)',
  'rgb(210, 105, 30)',
  'rgb(128, 0, 128)',
  'rgb(46, 139, 87)',
  'rgb(220, 20, 60)',
  'rgb(0, 139, 139)',
  'rgb(184, 134, 11)',
  'rgb(139, 0, 139)',
];

export function VendasPorFormaPagamentoChart({ dataInicio, dataFim }: VendasPorFormaPagamentoChartProps) {
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Buscar dados das vendas por forma de pagamento
  useEffect(() => {
    const buscarFormasPagamento = async () => {
      setLoading(true);
      setErro(null);

      try {
        const response = await fetch(`/api/dashboard/vendas/formas-pagamento?dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.erro) {
          setErro(data.erro);
          setFormasPagamento([]);
        } else {
          setFormasPagamento(data.formasPagamento || []);
        }
      } catch (error) {
        console.error('Erro ao buscar formas de pagamento:', error);
        setErro(error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados');
        setFormasPagamento([]);
      } finally {
        setLoading(false);
      }
    };

    buscarFormasPagamento();
  }, [dataInicio, dataFim]);

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

  // Opções do gráfico
  const opcoes = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
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
    cutout: '60%', // Efeito de rosca
  }), []);

  // Função para recarregar os dados
  const recarregarDados = () => {
    setLoading(true);
    setErro(null);
    
    fetch(`/api/dashboard/vendas/formas-pagamento?dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`)
      .then(response => {
        if (!response.ok) throw new Error(`Erro ao buscar dados: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data.erro) {
          setErro(data.erro);
          setFormasPagamento([]);
        } else {
          setFormasPagamento(data.formasPagamento || []);
        }
      })
      .catch(error => {
        console.error('Erro ao buscar formas de pagamento:', error);
        setErro(error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados');
        setFormasPagamento([]);
      })
      .finally(() => {
        setLoading(false);
      });
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-500" />
                Vendas por Forma de Pagamento
              </CardTitle>
              <CardDescription>Distribuição de vendas por método de pagamento</CardDescription>
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
            <CreditCard className="h-5 w-5 text-amber-500" />
            Vendas por Forma de Pagamento
          </CardTitle>
          <CardDescription>Distribuição de vendas por método de pagamento</CardDescription>
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

  if (formasPagamento.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-500" />
            Vendas por Forma de Pagamento
          </CardTitle>
          <CardDescription>Distribuição de vendas por método de pagamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px]">
            <PieChart className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Nenhuma forma de pagamento encontrada no período selecionado</p>
          </div>
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
              <CreditCard className="h-5 w-5 text-amber-500" />
              Vendas por Forma de Pagamento
            </CardTitle>
            <CardDescription>
              Distribuição de vendas por método de pagamento no período 
              ({format(dataInicio, 'dd/MM/yyyy', { locale: ptBR })} a {format(dataFim, 'dd/MM/yyyy', { locale: ptBR })})
            </CardDescription>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              disabled={formasPagamento.length === 0}
              className="flex items-center gap-1"
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
              className="flex items-center gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-full h-full max-w-[600px] mx-auto" id="grafico-formas-pagamento">
            <Doughnut 
              data={dadosGrafico} 
              options={opcoes} 
            />
          </div>
        </div>
        
        {formasPagamento.length > 0 && (
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total de Formas:</span>{' '}
              <span className="font-medium">{formasPagamento.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Valor Total:</span>{' '}
              <span className="font-medium">{formatCurrency(formasPagamento.reduce((sum, item) => sum + item.totalValor, 0))}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 