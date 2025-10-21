/**
 * SERVIÇO DE GERAÇÃO DE PDF PARA RELATÓRIOS CEO
 * Sistema isolado para geração de relatórios PDF com gráficos
 * 
 * Usa jsPDF e html2canvas para geração de PDFs
 * 
 * @module CEOPDFGenerator
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  CEOReportData,
  CEOReportConfig,
  CEOExportOptions,
  CEOReportTemplate,
} from '../types/report-types';

/**
 * Classe responsável pela geração de PDFs para Dashboard CEO
 */
export class CEOPDFGeneratorService {
  private doc: jsPDF | null = null;
  private currentY = 0;
  private pageWidth = 0;
  private pageHeight = 0;
  private margins = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  };

  /**
   * Gera PDF completo do relatório
   */
  async generateReport(
    data: CEOReportData,
    options?: CEOExportOptions
  ): Promise<Blob> {
    try {
      // Inicializar documento
      this.initializeDocument(options);

      // Adicionar capa
      this.addCoverPage(data);

      // Adicionar índice se solicitado
      if (options?.pdf?.includeTableOfContents) {
        this.addTableOfContents(data);
      }

      // Adicionar sumário executivo
      if (data.summary) {
        this.addExecutiveSummary(data);
      }

      // Adicionar métricas financeiras
      if (data.financialMetrics && data.config.sections.financialMetrics) {
        await this.addFinancialMetrics(data);
      }

      // Adicionar métricas operacionais
      if (data.operationalMetrics && data.config.sections.operationalMetrics) {
        await this.addOperationalMetrics(data);
      }

      // Adicionar métricas comerciais
      if (data.commercialMetrics && data.config.sections.commercialMetrics) {
        await this.addCommercialMetrics(data);
      }

      // Adicionar gráficos
      if (data.charts && data.config.sections.charts && options?.pdf?.includeCharts) {
        await this.addCharts(data);
      }

      // Adicionar tabelas
      if (data.tables && data.config.sections.tables && options?.pdf?.includeTables) {
        this.addTables(data);
      }

      // Adicionar análise SWOT
      if (data.analysis && data.config.sections.analysis) {
        this.addSwotAnalysis(data);
      }

      // Adicionar recomendações
      if (data.recommendations && data.config.sections.recommendations) {
        this.addRecommendations(data);
      }

      // Adicionar rodapé em todas as páginas
      this.addFooters();

      // Gerar blob
      const blob = this.doc!.output('blob');
      return blob;
    } catch (error) {
      console.error('[CEOPDFGenerator] Erro ao gerar PDF:', error);
      throw new Error(`Falha na geração do PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Inicializa o documento PDF
   */
  private initializeDocument(options?: CEOExportOptions): void {
    const orientation = options?.pdf?.orientation || 'portrait';
    const pageSize = options?.pdf?.pageSize || 'A4';

    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize.toLowerCase() as any,
      compress: options?.pdf?.compression !== false,
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = this.margins.top;
  }

  /**
   * Adiciona página de capa
   */
  private addCoverPage(data: CEOReportData): void {
    if (!this.doc) return;

    const centerX = this.pageWidth / 2;

    // Logo (se fornecido)
    if (data.config.logo) {
      try {
        this.doc.addImage(
          data.config.logo,
          'PNG',
          centerX - 30,
          30,
          60,
          20,
          undefined,
          'FAST'
        );
        this.currentY = 60;
      } catch (error) {
        console.warn('[CEOPDFGenerator] Erro ao adicionar logo:', error);
        this.currentY = 40;
      }
    } else {
      this.currentY = 40;
    }

    // Título do relatório
    this.doc.setFontSize(28);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(data.config.colors?.primary || '#1e40af');
    this.doc.text(data.config.name, centerX, this.currentY, { align: 'center' });

    this.currentY += 15;

    // Subtítulo com período
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor('#6b7280');
    const periodText = `${format(data.period.start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(data.period.end, 'dd/MM/yyyy', { locale: ptBR })}`;
    this.doc.text(periodText, centerX, this.currentY, { align: 'center' });

    this.currentY += 10;

    // Descrição (se fornecida)
    if (data.config.description) {
      this.doc.setFontSize(12);
      this.doc.setTextColor('#9ca3af');
      const splitDescription = this.doc.splitTextToSize(
        data.config.description,
        this.pageWidth - 2 * this.margins.left
      );
      this.doc.text(splitDescription, centerX, this.currentY, { align: 'center' });
      this.currentY += splitDescription.length * 7;
    }

    // Informações adicionais no rodapé da capa
    this.currentY = this.pageHeight - 50;

    this.doc.setFontSize(10);
    this.doc.setTextColor('#6b7280');
    this.doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      centerX,
      this.currentY,
      { align: 'center' }
    );

    this.currentY += 7;
    this.doc.text(
      `Por: ${data.config.createdBy}`,
      centerX,
      this.currentY,
      { align: 'center' }
    );

    // Nova página
    this.addNewPage();
  }

  /**
   * Adiciona índice
   */
  private addTableOfContents(data: CEOReportData): void {
    if (!this.doc) return;

    this.addSectionTitle('Índice');
    this.currentY += 5;

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor('#374151');

    const items: { title: string; page: number }[] = [
      { title: '1. Sumário Executivo', page: 3 },
    ];

    let sectionNumber = 2;

    if (data.config.sections.financialMetrics) {
      items.push({ title: `${sectionNumber}. Métricas Financeiras`, page: 4 });
      sectionNumber++;
    }

    if (data.config.sections.operationalMetrics) {
      items.push({ title: `${sectionNumber}. Métricas Operacionais`, page: 5 });
      sectionNumber++;
    }

    if (data.config.sections.commercialMetrics) {
      items.push({ title: `${sectionNumber}. Métricas Comerciais`, page: 6 });
      sectionNumber++;
    }

    if (data.config.sections.charts) {
      items.push({ title: `${sectionNumber}. Gráficos e Visualizações`, page: 7 });
      sectionNumber++;
    }

    if (data.config.sections.analysis) {
      items.push({ title: `${sectionNumber}. Análise SWOT`, page: 8 });
      sectionNumber++;
    }

    if (data.config.sections.recommendations) {
      items.push({ title: `${sectionNumber}. Recomendações`, page: 9 });
    }

    items.forEach((item) => {
      this.doc!.text(item.title, this.margins.left, this.currentY);
      this.doc!.text(
        item.page.toString(),
        this.pageWidth - this.margins.right,
        this.currentY,
        { align: 'right' }
      );
      this.currentY += 7;
    });

    this.addNewPage();
  }

  /**
   * Adiciona sumário executivo
   */
  private addExecutiveSummary(data: CEOReportData): void {
    if (!this.doc || !data.summary) return;

    this.addSectionTitle('Sumário Executivo');
    this.currentY += 5;

    // Métricas principais em cards
    const metrics = [
      {
        label: 'Receita Total',
        value: this.formatCurrency(data.summary.totalRevenue),
        color: '#10b981',
      },
      {
        label: 'Total de Pedidos',
        value: data.summary.totalOrders.toLocaleString('pt-BR'),
        color: '#3b82f6',
      },
      {
        label: 'Ticket Médio',
        value: this.formatCurrency(data.summary.averageTicket),
        color: '#8b5cf6',
      },
      {
        label: 'Margem de Lucro',
        value: `${data.summary.profitMargin.toFixed(1)}%`,
        color: '#f59e0b',
      },
    ];

    const cardWidth = (this.pageWidth - 2 * this.margins.left - 15) / 4;
    const cardHeight = 25;
    let cardX = this.margins.left;

    metrics.forEach((metric, index) => {
      // Fundo do card
      this.doc!.setFillColor(metric.color);
      this.doc!.roundedRect(cardX, this.currentY, cardWidth, cardHeight, 2, 2, 'F');

      // Label
      this.doc!.setFontSize(9);
      this.doc!.setFont('helvetica', 'normal');
      this.doc!.setTextColor(255, 255, 255);
      this.doc!.text(metric.label, cardX + cardWidth / 2, this.currentY + 8, {
        align: 'center',
      });

      // Valor
      this.doc!.setFontSize(14);
      this.doc!.setFont('helvetica', 'bold');
      this.doc!.text(metric.value, cardX + cardWidth / 2, this.currentY + 18, {
        align: 'center',
      });

      cardX += cardWidth + 5;
    });

    this.currentY += cardHeight + 10;

    // Principais insights
    if (data.summary.topInsights && data.summary.topInsights.length > 0) {
      this.addSubsectionTitle('Principais Insights');
      this.currentY += 3;

      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor('#374151');

      data.summary.topInsights.forEach((insight, index) => {
        const bullet = '•';
        const text = `${bullet} ${insight}`;
        const splitText = this.doc!.splitTextToSize(
          text,
          this.pageWidth - 2 * this.margins.left - 5
        );

        this.checkPageBreak(splitText.length * 5 + 5);

        this.doc!.text(splitText, this.margins.left + 5, this.currentY);
        this.currentY += splitText.length * 5 + 3;
      });
    }

    this.currentY += 10;
  }

  /**
   * Adiciona métricas financeiras
   */
  private async addFinancialMetrics(data: CEOReportData): Promise<void> {
    if (!this.doc || !data.financialMetrics) return;

    this.checkPageBreak(60);
    this.addSectionTitle('Métricas Financeiras');
    this.currentY += 5;

    const metrics = data.financialMetrics;

    // Receita
    this.addSubsectionTitle('Receita');
    this.currentY += 3;

    const revenueData = [
      ['Receita Total', this.formatCurrency(metrics.revenue.total)],
      ['Crescimento', `${metrics.revenue.growth >= 0 ? '+' : ''}${metrics.revenue.growth.toFixed(1)}%`],
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Métrica', 'Valor']],
      body: revenueData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] },
      margin: { left: this.margins.left, right: this.margins.right },
      styles: { fontSize: 10 },
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

    // Receita por forma de pagamento
    if (metrics.revenue.byPaymentMethod && metrics.revenue.byPaymentMethod.length > 0) {
      this.checkPageBreak(40);
      this.addSubsectionTitle('Receita por Forma de Pagamento');
      this.currentY += 3;

      const paymentData = metrics.revenue.byPaymentMethod.map((item) => [
        item.method,
        this.formatCurrency(item.value),
        `${((item.value / metrics.revenue.total) * 100).toFixed(1)}%`,
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Forma de Pagamento', 'Valor', '% do Total']],
        body: paymentData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 9 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }

    // Custos
    if (metrics.costs) {
      this.checkPageBreak(30);
      this.addSubsectionTitle('Custos');
      this.currentY += 3;

      const costData = [
        ['Custo Total', this.formatCurrency(metrics.costs.total)],
      ];

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Métrica', 'Valor']],
        body: costData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 10 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }

    // Lucro
    if (metrics.profit) {
      this.checkPageBreak(30);
      this.addSubsectionTitle('Lucro');
      this.currentY += 3;

      const profitData = [
        ['Lucro Bruto', this.formatCurrency(metrics.profit.gross)],
        ['Lucro Líquido', this.formatCurrency(metrics.profit.net)],
        ['Margem de Lucro', `${metrics.profit.margin.toFixed(1)}%`],
      ];

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Métrica', 'Valor']],
        body: profitData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 10 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }

    // Fluxo de caixa
    if (metrics.cashFlow) {
      this.checkPageBreak(30);
      this.addSubsectionTitle('Fluxo de Caixa');
      this.currentY += 3;

      const cashFlowData = [
        ['Entradas', this.formatCurrency(metrics.cashFlow.inflow)],
        ['Saídas', this.formatCurrency(metrics.cashFlow.outflow)],
        ['Saldo', this.formatCurrency(metrics.cashFlow.balance)],
      ];

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Tipo', 'Valor']],
        body: cashFlowData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 10 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  /**
   * Adiciona métricas operacionais
   */
  private async addOperationalMetrics(data: CEOReportData): Promise<void> {
    if (!this.doc || !data.operationalMetrics) return;

    this.checkPageBreak(60);
    this.addSectionTitle('Métricas Operacionais');
    this.currentY += 5;

    const metrics = data.operationalMetrics;

    // Pedidos
    if (metrics.orders) {
      this.addSubsectionTitle('Pedidos');
      this.currentY += 3;

      const ordersData = [
        ['Total de Pedidos', metrics.orders.total.toString()],
        ['Concluídos', metrics.orders.completed.toString()],
        ['Cancelados', metrics.orders.cancelled.toString()],
        ['Pendentes', metrics.orders.pending.toString()],
        ['Taxa de Conclusão', `${((metrics.orders.completed / metrics.orders.total) * 100).toFixed(1)}%`],
      ];

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Métrica', 'Valor']],
        body: ordersData,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 10 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }

    // Top Produtos
    if (metrics.products?.topProducts && metrics.products.topProducts.length > 0) {
      this.checkPageBreak(50);
      this.addSubsectionTitle('Produtos Mais Vendidos');
      this.currentY += 3;

      const topProductsData = metrics.products.topProducts
        .slice(0, 10)
        .map((item, index) => [
          `${index + 1}`,
          item.name,
          item.quantity.toString(),
          this.formatCurrency(item.revenue),
        ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['#', 'Produto', 'Quantidade', 'Receita']],
        body: topProductsData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 9 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }

    // Eficiência
    if (metrics.efficiency) {
      this.checkPageBreak(30);
      this.addSubsectionTitle('Indicadores de Eficiência');
      this.currentY += 3;

      const efficiencyData = [
        ['Tempo Médio de Processamento', `${metrics.efficiency.orderProcessingTime.toFixed(1)} horas`],
        ['Taxa de Cumprimento', `${(metrics.efficiency.fulfillmentRate * 100).toFixed(1)}%`],
        ['Taxa de Devolução', `${(metrics.efficiency.returnRate * 100).toFixed(1)}%`],
      ];

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Indicador', 'Valor']],
        body: efficiencyData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 10 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  /**
   * Adiciona métricas comerciais
   */
  private async addCommercialMetrics(data: CEOReportData): Promise<void> {
    if (!this.doc || !data.commercialMetrics) return;

    this.checkPageBreak(60);
    this.addSectionTitle('Métricas Comerciais');
    this.currentY += 5;

    const metrics = data.commercialMetrics;

    // Vendas
    if (metrics.sales) {
      this.addSubsectionTitle('Desempenho de Vendas');
      this.currentY += 3;

      const salesData = [
        ['Total de Vendas', this.formatCurrency(metrics.sales.total)],
        ['Taxa de Conversão', `${(metrics.sales.conversion * 100).toFixed(1)}%`],
      ];

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Métrica', 'Valor']],
        body: salesData,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 10 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;

      // Vendas por vendedor
      if (metrics.sales.bySeller && metrics.sales.bySeller.length > 0) {
        this.checkPageBreak(50);
        this.addSubsectionTitle('Desempenho por Vendedor');
        this.currentY += 3;

        const sellerData = metrics.sales.bySeller
          .slice(0, 15)
          .map((item, index) => [
            `${index + 1}`,
            item.seller,
            this.formatCurrency(item.value),
            item.orders.toString(),
          ]);

        autoTable(this.doc, {
          startY: this.currentY,
          head: [['#', 'Vendedor', 'Vendas', 'Pedidos']],
          body: sellerData,
          theme: 'striped',
          headStyles: { fillColor: [30, 64, 175] },
          margin: { left: this.margins.left, right: this.margins.right },
          styles: { fontSize: 9 },
        });

        this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
      }
    }

    // Clientes
    if (metrics.customers) {
      this.checkPageBreak(40);
      this.addSubsectionTitle('Métricas de Clientes');
      this.currentY += 3;

      const customerData = [
        ['Total de Clientes', metrics.customers.total.toString()],
        ['Novos Clientes', metrics.customers.new.toString()],
        ['Clientes Recorrentes', metrics.customers.returning.toString()],
        ['Taxa de Churn', `${(metrics.customers.churn * 100).toFixed(1)}%`],
        ['Lifetime Value Médio', this.formatCurrency(metrics.customers.ltv)],
      ];

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Métrica', 'Valor']],
        body: customerData,
        theme: 'grid',
        headStyles: { fillColor: [139, 92, 246] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 10 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }

    // Marketing
    if (metrics.marketing) {
      this.checkPageBreak(30);
      this.addSubsectionTitle('Métricas de Marketing');
      this.currentY += 3;

      const marketingData = [
        ['CAC (Custo de Aquisição de Cliente)', this.formatCurrency(metrics.marketing.cac)],
        ['ROI de Marketing', `${(metrics.marketing.roi * 100).toFixed(1)}%`],
      ];

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Métrica', 'Valor']],
        body: marketingData,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 10 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  /**
   * Adiciona gráficos ao PDF
   */
  private async addCharts(data: CEOReportData): Promise<void> {
    if (!this.doc || !data.charts || data.charts.length === 0) return;

    this.checkPageBreak(60);
    this.addSectionTitle('Gráficos e Visualizações');
    this.currentY += 10;

    for (const chart of data.charts) {
      this.checkPageBreak(100);

      // Título do gráfico
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor('#1f2937');
      this.doc.text(chart.title, this.margins.left, this.currentY);
      this.currentY += 10;

      // Adicionar imagem do gráfico (se fornecida como data URL)
      if (chart.dataUrl) {
        try {
          const imgWidth = this.pageWidth - 2 * this.margins.left;
          const imgHeight = 80; // Altura fixa para gráficos

          this.doc.addImage(
            chart.dataUrl,
            'PNG',
            this.margins.left,
            this.currentY,
            imgWidth,
            imgHeight,
            undefined,
            'FAST'
          );

          this.currentY += imgHeight + 15;
        } catch (error) {
          console.warn('[CEOPDFGenerator] Erro ao adicionar gráfico:', error);
          this.doc.setFontSize(10);
          this.doc.setTextColor('#9ca3af');
          this.doc.text(
            '(Gráfico não disponível)',
            this.margins.left,
            this.currentY
          );
          this.currentY += 10;
        }
      }
    }
  }

  /**
   * Adiciona tabelas ao PDF
   */
  private addTables(data: CEOReportData): void {
    if (!this.doc || !data.tables || data.tables.length === 0) return;

    this.checkPageBreak(60);
    this.addSectionTitle('Tabelas Detalhadas');
    this.currentY += 10;

    data.tables.forEach((table) => {
      this.checkPageBreak(40);

      // Título da tabela
      this.doc!.setFontSize(12);
      this.doc!.setFont('helvetica', 'bold');
      this.doc!.setTextColor('#1f2937');
      this.doc!.text(table.title, this.margins.left, this.currentY);
      this.currentY += 7;

      // Tabela
      autoTable(this.doc!, {
        startY: this.currentY,
        head: [table.headers],
        body: table.rows,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175] },
        margin: { left: this.margins.left, right: this.margins.right },
        styles: { fontSize: 9 },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 15;
    });
  }

  /**
   * Adiciona análise SWOT
   */
  private addSwotAnalysis(data: CEOReportData): void {
    if (!this.doc || !data.analysis) return;

    this.checkPageBreak(80);
    this.addSectionTitle('Análise SWOT');
    this.currentY += 10;

    const swotSections = [
      {
        title: 'Forças (Strengths)',
        items: data.analysis.strengths,
        color: [16, 185, 129],
      },
      {
        title: 'Fraquezas (Weaknesses)',
        items: data.analysis.weaknesses,
        color: [239, 68, 68],
      },
      {
        title: 'Oportunidades (Opportunities)',
        items: data.analysis.opportunities,
        color: [59, 130, 246],
      },
      {
        title: 'Ameaças (Threats)',
        items: data.analysis.threats,
        color: [245, 158, 11],
      },
    ];

    swotSections.forEach((section) => {
      if (!section.items || section.items.length === 0) return;

      this.checkPageBreak(30);

      // Título da seção
      this.doc!.setFillColor(...section.color);
      this.doc!.rect(
        this.margins.left,
        this.currentY,
        this.pageWidth - 2 * this.margins.left,
        8,
        'F'
      );

      this.doc!.setFontSize(11);
      this.doc!.setFont('helvetica', 'bold');
      this.doc!.setTextColor(255, 255, 255);
      this.doc!.text(section.title, this.margins.left + 3, this.currentY + 5.5);

      this.currentY += 12;

      // Itens
      this.doc!.setFontSize(10);
      this.doc!.setFont('helvetica', 'normal');
      this.doc!.setTextColor('#374151');

      section.items.forEach((item) => {
        const bullet = '•';
        const text = `${bullet} ${item}`;
        const splitText = this.doc!.splitTextToSize(
          text,
          this.pageWidth - 2 * this.margins.left - 5
        );

        this.checkPageBreak(splitText.length * 5 + 5);

        this.doc!.text(splitText, this.margins.left + 5, this.currentY);
        this.currentY += splitText.length * 5 + 2;
      });

      this.currentY += 5;
    });
  }

  /**
   * Adiciona recomendações
   */
  private addRecommendations(data: CEOReportData): void {
    if (!this.doc || !data.recommendations || data.recommendations.length === 0) return;

    this.checkPageBreak(60);
    this.addSectionTitle('Recomendações');
    this.currentY += 10;

    // Agrupar por prioridade
    const highPriority = data.recommendations.filter((r) => r.priority === 'high');
    const mediumPriority = data.recommendations.filter((r) => r.priority === 'medium');
    const lowPriority = data.recommendations.filter((r) => r.priority === 'low');

    const groups = [
      { title: 'Alta Prioridade', items: highPriority, color: [239, 68, 68] },
      { title: 'Média Prioridade', items: mediumPriority, color: [245, 158, 11] },
      { title: 'Baixa Prioridade', items: lowPriority, color: [59, 130, 246] },
    ];

    groups.forEach((group) => {
      if (group.items.length === 0) return;

      this.checkPageBreak(30);

      // Título do grupo
      this.doc!.setFillColor(...group.color);
      this.doc!.rect(
        this.margins.left,
        this.currentY,
        this.pageWidth - 2 * this.margins.left,
        7,
        'F'
      );

      this.doc!.setFontSize(11);
      this.doc!.setFont('helvetica', 'bold');
      this.doc!.setTextColor(255, 255, 255);
      this.doc!.text(group.title, this.margins.left + 3, this.currentY + 5);

      this.currentY += 12;

      // Recomendações
      group.items.forEach((rec, index) => {
        this.checkPageBreak(25);

        // Número
        this.doc!.setFontSize(10);
        this.doc!.setFont('helvetica', 'bold');
        this.doc!.setTextColor('#1f2937');
        this.doc!.text(`${index + 1}.`, this.margins.left, this.currentY);

        // Título
        const titleText = this.doc!.splitTextToSize(
          rec.title,
          this.pageWidth - 2 * this.margins.left - 10
        );
        this.doc!.text(titleText, this.margins.left + 7, this.currentY);
        this.currentY += titleText.length * 5 + 2;

        // Descrição
        this.doc!.setFont('helvetica', 'normal');
        this.doc!.setTextColor('#6b7280');
        const descText = this.doc!.splitTextToSize(
          rec.description,
          this.pageWidth - 2 * this.margins.left - 10
        );
        this.doc!.text(descText, this.margins.left + 7, this.currentY);
        this.currentY += descText.length * 5 + 2;

        // Impacto esperado
        this.doc!.setFont('helvetica', 'italic');
        this.doc!.setTextColor('#9ca3af');
        const impactText = `Impacto esperado: ${rec.expectedImpact}`;
        const splitImpact = this.doc!.splitTextToSize(
          impactText,
          this.pageWidth - 2 * this.margins.left - 10
        );
        this.doc!.text(splitImpact, this.margins.left + 7, this.currentY);
        this.currentY += splitImpact.length * 5 + 8;
      });

      this.currentY += 5;
    });
  }

  /**
   * Adiciona rodapés em todas as páginas
   */
  private addFooters(): void {
    if (!this.doc) return;

    const pageCount = this.doc.internal.pages.length - 1;

    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);

      // Linha de separação
      this.doc.setDrawColor('#e5e7eb');
      this.doc.line(
        this.margins.left,
        this.pageHeight - 15,
        this.pageWidth - this.margins.right,
        this.pageHeight - 15
      );

      // Texto do rodapé
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor('#9ca3af');

      // Esquerda: Data de geração
      this.doc.text(
        `Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
        this.margins.left,
        this.pageHeight - 10
      );

      // Centro: Nome do relatório
      this.doc.text(
        'Dashboard CEO',
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );

      // Direita: Número da página
      this.doc.text(
        `Página ${i} de ${pageCount}`,
        this.pageWidth - this.margins.right,
        this.pageHeight - 10,
        { align: 'right' }
      );
    }
  }

  /**
   * Adiciona título de seção
   */
  private addSectionTitle(title: string): void {
    if (!this.doc) return;

    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor('#1e40af');
    this.doc.text(title, this.margins.left, this.currentY);

    // Linha decorativa
    this.currentY += 2;
    this.doc.setDrawColor('#1e40af');
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margins.left,
      this.currentY,
      this.margins.left + 40,
      this.currentY
    );

    this.currentY += 8;
  }

  /**
   * Adiciona título de subseção
   */
  private addSubsectionTitle(title: string): void {
    if (!this.doc) return;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor('#374151');
    this.doc.text(title, this.margins.left, this.currentY);

    this.currentY += 7;
  }

  /**
   * Adiciona nova página
   */
  private addNewPage(): void {
    if (!this.doc) return;

    this.doc.addPage();
    this.currentY = this.margins.top;
  }

  /**
   * Verifica se precisa adicionar nova página
   */
  private checkPageBreak(requiredSpace: number): void {
    if (!this.doc) return;

    if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom) {
      this.addNewPage();
    }
  }

  /**
   * Formata valor monetário
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Converte elemento HTML para canvas e retorna data URL
   */
  async htmlToDataUrl(element: HTMLElement): Promise<string> {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
    });

    return canvas.toDataURL('image/png');
  }
}

// Exportar instância singleton
export const ceoPDFGenerator = new CEOPDFGeneratorService();

