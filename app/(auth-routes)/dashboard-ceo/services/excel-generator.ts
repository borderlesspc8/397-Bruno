/**
 * SERVIÇO DE GERAÇÃO DE EXCEL PARA RELATÓRIOS CEO
 * Sistema isolado para geração de relatórios Excel com dados formatados
 * 
 * Usa ExcelJS para geração de planilhas Excel
 * 
 * @module CEOExcelGenerator
 */

import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type {
  CEOReportData,
  CEOReportConfig,
  CEOExportOptions,
} from '../types/report-types';

/**
 * Classe responsável pela geração de Excel para Dashboard CEO
 */
export class CEOExcelGeneratorService {
  private workbook: ExcelJS.Workbook | null = null;

  /**
   * Gera Excel completo do relatório
   */
  async generateReport(
    data: CEOReportData,
    options?: CEOExportOptions
  ): Promise<Blob> {
    try {
      // Inicializar workbook
      this.initializeWorkbook(data);

      // Adicionar planilhas conforme configuração
      await this.addSummarySheet(data, options);

      if (data.financialMetrics && data.config.sections.financialMetrics) {
        await this.addFinancialSheet(data, options);
      }

      if (data.operationalMetrics && data.config.sections.operationalMetrics) {
        await this.addOperationalSheet(data, options);
      }

      if (data.commercialMetrics && data.config.sections.commercialMetrics) {
        await this.addCommercialSheet(data, options);
      }

      if (data.config.sections.tables) {
        await this.addRawDataSheet(data, options);
      }

      // Gerar buffer
      const buffer = await this.workbook!.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      return blob;
    } catch (error) {
      console.error('[CEOExcelGenerator] Erro ao gerar Excel:', error);
      throw new Error(
        `Falha na geração do Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      );
    }
  }

  /**
   * Inicializa o workbook
   */
  private initializeWorkbook(data: CEOReportData): void {
    this.workbook = new ExcelJS.Workbook();

    // Metadados
    this.workbook.creator = data.config.createdBy;
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.lastModifiedBy = data.config.createdBy;
    this.workbook.title = data.config.name;
    this.workbook.description = data.config.description || '';
    this.workbook.subject = 'Relatório Dashboard CEO';
    this.workbook.keywords = 'dashboard ceo relatório financeiro';
  }

  /**
   * Adiciona planilha de sumário
   */
  private async addSummarySheet(
    data: CEOReportData,
    options?: CEOExportOptions
  ): Promise<void> {
    if (!this.workbook) return;

    const sheetName = options?.excel?.sheetNames?.summary || 'Sumário';
    const sheet = this.workbook.addWorksheet(sheetName);

    // Configurar larguras das colunas
    sheet.columns = [
      { key: 'label', width: 40 },
      { key: 'value', width: 25 },
    ];

    // Título do relatório
    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = data.config.name;
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };
    sheet.getRow(1).height = 30;

    // Período
    sheet.mergeCells('A2:B2');
    const periodCell = sheet.getCell('A2');
    periodCell.value = `Período: ${format(data.period.start, 'dd/MM/yyyy', { locale: ptBR })} - ${format(data.period.end, 'dd/MM/yyyy', { locale: ptBR })}`;
    periodCell.font = { size: 12, italic: true, color: { argb: 'FF6B7280' } };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    let currentRow = 4;

    // Métricas principais
    if (data.summary) {
      sheet.getCell(`A${currentRow}`).value = 'MÉTRICAS PRINCIPAIS';
      sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
      sheet.mergeCells(`A${currentRow}:B${currentRow}`);
      currentRow++;

      const metrics = [
        { label: 'Receita Total', value: this.formatCurrency(data.summary.totalRevenue) },
        { label: 'Total de Pedidos', value: data.summary.totalOrders.toLocaleString('pt-BR') },
        { label: 'Ticket Médio', value: this.formatCurrency(data.summary.averageTicket) },
        { label: 'Margem de Lucro', value: `${data.summary.profitMargin.toFixed(2)}%` },
      ];

      metrics.forEach((metric) => {
        sheet.getCell(`A${currentRow}`).value = metric.label;
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = metric.value;
        sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'right' };
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;

      // Principais Insights
      if (data.summary.topInsights && data.summary.topInsights.length > 0) {
        sheet.getCell(`A${currentRow}`).value = 'PRINCIPAIS INSIGHTS';
        sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        currentRow++;

        data.summary.topInsights.forEach((insight, index) => {
          sheet.getCell(`A${currentRow}`).value = `${index + 1}. ${insight}`;
          sheet.mergeCells(`A${currentRow}:B${currentRow}`);
          sheet.getCell(`A${currentRow}`).alignment = { wrapText: true };
          sheet.getRow(currentRow).height = 25;
          currentRow++;
        });
      }
    }

    // Análise SWOT
    if (data.analysis) {
      currentRow += 2;
      sheet.getCell(`A${currentRow}`).value = 'ANÁLISE SWOT';
      sheet.getCell(`A${currentRow}`).font = { size: 14, bold: true, color: { argb: 'FF1F2937' } };
      sheet.mergeCells(`A${currentRow}:B${currentRow}`);
      currentRow++;

      const swotSections = [
        { title: 'Forças', items: data.analysis.strengths, color: 'FF10B981' },
        { title: 'Fraquezas', items: data.analysis.weaknesses, color: 'FFEF4444' },
        { title: 'Oportunidades', items: data.analysis.opportunities, color: 'FF3B82F6' },
        { title: 'Ameaças', items: data.analysis.threats, color: 'FFF59E0B' },
      ];

      swotSections.forEach((section) => {
        if (!section.items || section.items.length === 0) return;

        sheet.getCell(`A${currentRow}`).value = section.title;
        sheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        sheet.getCell(`A${currentRow}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: section.color },
        };
        sheet.mergeCells(`A${currentRow}:B${currentRow}`);
        currentRow++;

        section.items.forEach((item) => {
          sheet.getCell(`A${currentRow}`).value = `• ${item}`;
          sheet.mergeCells(`A${currentRow}:B${currentRow}`);
          sheet.getCell(`A${currentRow}`).alignment = { wrapText: true };
          currentRow++;
        });

        currentRow++;
      });
    }

    // Congelar painéis
    if (options?.excel?.freezeHeader) {
      sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }];
    }

    // Auto-ajustar largura das colunas
    if (options?.excel?.autoColumnWidth) {
      this.autoFitColumns(sheet);
    }
  }

  /**
   * Adiciona planilha de métricas financeiras
   */
  private async addFinancialSheet(
    data: CEOReportData,
    options?: CEOExportOptions
  ): Promise<void> {
    if (!this.workbook || !data.financialMetrics) return;

    const sheetName = options?.excel?.sheetNames?.financial || 'Financeiro';
    const sheet = this.workbook.addWorksheet(sheetName);

    const metrics = data.financialMetrics;
    let currentRow = 1;

    // Título
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = 'MÉTRICAS FINANCEIRAS';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };
    sheet.getRow(currentRow).height = 25;
    currentRow += 2;

    // Receita
    sheet.getCell(`A${currentRow}`).value = 'RECEITA';
    sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    currentRow++;

    const revenueData = [
      ['Métrica', 'Valor', '', ''],
      ['Receita Total', this.formatCurrency(metrics.revenue.total), '', ''],
      ['Crescimento', `${metrics.revenue.growth >= 0 ? '+' : ''}${metrics.revenue.growth.toFixed(2)}%`, '', ''],
    ];

    revenueData.forEach((row) => {
      sheet.addRow(row);
      this.applyBorder(sheet, currentRow);
      currentRow++;
    });

    currentRow += 2;

    // Receita por Forma de Pagamento
    if (metrics.revenue.byPaymentMethod && metrics.revenue.byPaymentMethod.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'RECEITA POR FORMA DE PAGAMENTO';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      sheet.addRow(['Forma de Pagamento', 'Valor', '% do Total', '']);
      this.applyHeaderStyle(sheet, currentRow);
      currentRow++;

      metrics.revenue.byPaymentMethod.forEach((item) => {
        const percentage = ((item.value / metrics.revenue.total) * 100).toFixed(2);
        sheet.addRow([
          item.method,
          this.formatCurrency(item.value),
          `${percentage}%`,
          '',
        ]);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;
    }

    // Custos
    if (metrics.costs) {
      sheet.getCell(`A${currentRow}`).value = 'CUSTOS';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      sheet.addRow(['Custo Total', this.formatCurrency(metrics.costs.total), '', '']);
      this.applyBorder(sheet, currentRow);
      currentRow += 2;

      // Custos por Centro de Custo
      if (metrics.costs.byCostCenter && metrics.costs.byCostCenter.length > 0) {
        sheet.getCell(`A${currentRow}`).value = 'CUSTOS POR CENTRO DE CUSTO';
        sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        currentRow++;

        sheet.addRow(['Centro de Custo', 'Valor', '% do Total', '']);
        this.applyHeaderStyle(sheet, currentRow);
        currentRow++;

        metrics.costs.byCostCenter.forEach((item) => {
          const percentage = ((item.value / metrics.costs.total) * 100).toFixed(2);
          sheet.addRow([item.center, this.formatCurrency(item.value), `${percentage}%`, '']);
          this.applyBorder(sheet, currentRow);
          currentRow++;
        });

        currentRow += 2;
      }
    }

    // Lucro
    if (metrics.profit) {
      sheet.getCell(`A${currentRow}`).value = 'LUCRO';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      const profitData = [
        ['Métrica', 'Valor', '', ''],
        ['Lucro Bruto', this.formatCurrency(metrics.profit.gross), '', ''],
        ['Lucro Líquido', this.formatCurrency(metrics.profit.net), '', ''],
        ['Margem de Lucro', `${metrics.profit.margin.toFixed(2)}%`, '', ''],
      ];

      profitData.forEach((row) => {
        sheet.addRow(row);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;
    }

    // Fluxo de Caixa
    if (metrics.cashFlow) {
      sheet.getCell(`A${currentRow}`).value = 'FLUXO DE CAIXA';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      const cashFlowData = [
        ['Tipo', 'Valor', '', ''],
        ['Entradas', this.formatCurrency(metrics.cashFlow.inflow), '', ''],
        ['Saídas', this.formatCurrency(metrics.cashFlow.outflow), '', ''],
        ['Saldo', this.formatCurrency(metrics.cashFlow.balance), '', ''],
      ];

      cashFlowData.forEach((row) => {
        sheet.addRow(row);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;

      // Tendência do Fluxo de Caixa
      if (metrics.cashFlow.trend && metrics.cashFlow.trend.length > 0) {
        sheet.getCell(`A${currentRow}`).value = 'TENDÊNCIA DO FLUXO DE CAIXA';
        sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        currentRow++;

        sheet.addRow(['Data', 'Valor', '', '']);
        this.applyHeaderStyle(sheet, currentRow);
        currentRow++;

        metrics.cashFlow.trend.forEach((item) => {
          sheet.addRow([item.date, this.formatCurrency(item.value), '', '']);
          this.applyBorder(sheet, currentRow);
          currentRow++;
        });
      }
    }

    // Configurar larguras
    sheet.columns = [
      { key: 'col1', width: 35 },
      { key: 'col2', width: 20 },
      { key: 'col3', width: 15 },
      { key: 'col4', width: 15 },
    ];

    // Congelar painéis
    if (options?.excel?.freezeHeader) {
      sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    }
  }

  /**
   * Adiciona planilha de métricas operacionais
   */
  private async addOperationalSheet(
    data: CEOReportData,
    options?: CEOExportOptions
  ): Promise<void> {
    if (!this.workbook || !data.operationalMetrics) return;

    const sheetName = options?.excel?.sheetNames?.operational || 'Operacional';
    const sheet = this.workbook.addWorksheet(sheetName);

    const metrics = data.operationalMetrics;
    let currentRow = 1;

    // Título
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = 'MÉTRICAS OPERACIONAIS';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };
    sheet.getRow(currentRow).height = 25;
    currentRow += 2;

    // Pedidos
    if (metrics.orders) {
      sheet.getCell(`A${currentRow}`).value = 'PEDIDOS';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      const ordersData = [
        ['Métrica', 'Valor', '', ''],
        ['Total de Pedidos', metrics.orders.total.toLocaleString('pt-BR'), '', ''],
        ['Concluídos', metrics.orders.completed.toLocaleString('pt-BR'), '', ''],
        ['Cancelados', metrics.orders.cancelled.toLocaleString('pt-BR'), '', ''],
        ['Pendentes', metrics.orders.pending.toLocaleString('pt-BR'), '', ''],
        [
          'Taxa de Conclusão',
          `${((metrics.orders.completed / metrics.orders.total) * 100).toFixed(2)}%`,
          '',
          '',
        ],
      ];

      ordersData.forEach((row) => {
        sheet.addRow(row);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;
    }

    // Produtos Mais Vendidos
    if (metrics.products?.topProducts && metrics.products.topProducts.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'PRODUTOS MAIS VENDIDOS';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      sheet.addRow(['#', 'Produto', 'Quantidade', 'Receita']);
      this.applyHeaderStyle(sheet, currentRow);
      currentRow++;

      metrics.products.topProducts.slice(0, 20).forEach((item, index) => {
        sheet.addRow([
          index + 1,
          item.name,
          item.quantity.toLocaleString('pt-BR'),
          this.formatCurrency(item.revenue),
        ]);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;
    }

    // Vendas por Categoria
    if (metrics.products?.byCategory && metrics.products.byCategory.length > 0) {
      sheet.getCell(`A${currentRow}`).value = 'VENDAS POR CATEGORIA';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      sheet.addRow(['Categoria', 'Quantidade', '', '']);
      this.applyHeaderStyle(sheet, currentRow);
      currentRow++;

      metrics.products.byCategory.forEach((item) => {
        sheet.addRow([item.category, item.quantity.toLocaleString('pt-BR'), '', '']);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;
    }

    // Eficiência
    if (metrics.efficiency) {
      sheet.getCell(`A${currentRow}`).value = 'INDICADORES DE EFICIÊNCIA';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      const efficiencyData = [
        ['Indicador', 'Valor', '', ''],
        [
          'Tempo Médio de Processamento',
          `${metrics.efficiency.orderProcessingTime.toFixed(2)} horas`,
          '',
          '',
        ],
        [
          'Taxa de Cumprimento',
          `${(metrics.efficiency.fulfillmentRate * 100).toFixed(2)}%`,
          '',
          '',
        ],
        ['Taxa de Devolução', `${(metrics.efficiency.returnRate * 100).toFixed(2)}%`, '', ''],
      ];

      efficiencyData.forEach((row) => {
        sheet.addRow(row);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });
    }

    // Configurar larguras
    sheet.columns = [
      { key: 'col1', width: 10 },
      { key: 'col2', width: 40 },
      { key: 'col3', width: 20 },
      { key: 'col4', width: 20 },
    ];

    // Congelar painéis
    if (options?.excel?.freezeHeader) {
      sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    }
  }

  /**
   * Adiciona planilha de métricas comerciais
   */
  private async addCommercialSheet(
    data: CEOReportData,
    options?: CEOExportOptions
  ): Promise<void> {
    if (!this.workbook || !data.commercialMetrics) return;

    const sheetName = options?.excel?.sheetNames?.commercial || 'Comercial';
    const sheet = this.workbook.addWorksheet(sheetName);

    const metrics = data.commercialMetrics;
    let currentRow = 1;

    // Título
    sheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const titleCell = sheet.getCell(`A${currentRow}`);
    titleCell.value = 'MÉTRICAS COMERCIAIS';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };
    sheet.getRow(currentRow).height = 25;
    currentRow += 2;

    // Vendas
    if (metrics.sales) {
      sheet.getCell(`A${currentRow}`).value = 'DESEMPENHO DE VENDAS';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      const salesData = [
        ['Métrica', 'Valor', '', ''],
        ['Total de Vendas', this.formatCurrency(metrics.sales.total), '', ''],
        ['Taxa de Conversão', `${(metrics.sales.conversion * 100).toFixed(2)}%`, '', ''],
      ];

      salesData.forEach((row) => {
        sheet.addRow(row);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;

      // Vendas por Vendedor
      if (metrics.sales.bySeller && metrics.sales.bySeller.length > 0) {
        sheet.getCell(`A${currentRow}`).value = 'DESEMPENHO POR VENDEDOR';
        sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        currentRow++;

        sheet.addRow(['#', 'Vendedor', 'Vendas', 'Pedidos']);
        this.applyHeaderStyle(sheet, currentRow);
        currentRow++;

        metrics.sales.bySeller.forEach((item, index) => {
          sheet.addRow([
            index + 1,
            item.seller,
            this.formatCurrency(item.value),
            item.orders.toLocaleString('pt-BR'),
          ]);
          this.applyBorder(sheet, currentRow);
          currentRow++;
        });

        currentRow += 2;
      }
    }

    // Clientes
    if (metrics.customers) {
      sheet.getCell(`A${currentRow}`).value = 'MÉTRICAS DE CLIENTES';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      const customerData = [
        ['Métrica', 'Valor', '', ''],
        ['Total de Clientes', metrics.customers.total.toLocaleString('pt-BR'), '', ''],
        ['Novos Clientes', metrics.customers.new.toLocaleString('pt-BR'), '', ''],
        ['Clientes Recorrentes', metrics.customers.returning.toLocaleString('pt-BR'), '', ''],
        ['Taxa de Churn', `${(metrics.customers.churn * 100).toFixed(2)}%`, '', ''],
        ['Lifetime Value Médio', this.formatCurrency(metrics.customers.ltv), '', ''],
      ];

      customerData.forEach((row) => {
        sheet.addRow(row);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;
    }

    // Marketing
    if (metrics.marketing) {
      sheet.getCell(`A${currentRow}`).value = 'MÉTRICAS DE MARKETING';
      sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
      sheet.mergeCells(`A${currentRow}:D${currentRow}`);
      currentRow++;

      const marketingData = [
        ['Métrica', 'Valor', '', ''],
        ['CAC (Custo de Aquisição de Cliente)', this.formatCurrency(metrics.marketing.cac), '', ''],
        ['ROI de Marketing', `${(metrics.marketing.roi * 100).toFixed(2)}%`, '', ''],
      ];

      marketingData.forEach((row) => {
        sheet.addRow(row);
        this.applyBorder(sheet, currentRow);
        currentRow++;
      });

      currentRow += 2;

      // ROI por Canal
      if (metrics.marketing.byChannel && metrics.marketing.byChannel.length > 0) {
        sheet.getCell(`A${currentRow}`).value = 'ROI POR CANAL';
        sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
        currentRow++;

        sheet.addRow(['Canal', 'Investimento', 'Retorno', 'ROI']);
        this.applyHeaderStyle(sheet, currentRow);
        currentRow++;

        metrics.marketing.byChannel.forEach((item) => {
          const roi = item.investment > 0 ? ((item.return - item.investment) / item.investment) * 100 : 0;
          sheet.addRow([
            item.channel,
            this.formatCurrency(item.investment),
            this.formatCurrency(item.return),
            `${roi.toFixed(2)}%`,
          ]);
          this.applyBorder(sheet, currentRow);
          currentRow++;
        });
      }
    }

    // Configurar larguras
    sheet.columns = [
      { key: 'col1', width: 10 },
      { key: 'col2', width: 35 },
      { key: 'col3', width: 20 },
      { key: 'col4', width: 15 },
    ];

    // Congelar painéis
    if (options?.excel?.freezeHeader) {
      sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    }
  }

  /**
   * Adiciona planilha de dados brutos
   */
  private async addRawDataSheet(
    data: CEOReportData,
    options?: CEOExportOptions
  ): Promise<void> {
    if (!this.workbook) return;

    const sheetName = options?.excel?.sheetNames?.raw || 'Dados Brutos';
    const sheet = this.workbook.addWorksheet(sheetName);

    let currentRow = 1;

    // Título
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'DADOS BRUTOS';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF1E40AF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    };
    sheet.getRow(1).height = 25;
    currentRow += 2;

    // Adicionar tabelas customizadas
    if (data.tables && data.tables.length > 0) {
      data.tables.forEach((table) => {
        sheet.getCell(`A${currentRow}`).value = table.title;
        sheet.getCell(`A${currentRow}`).font = { size: 12, bold: true };
        sheet.mergeCells(`A${currentRow}:F${currentRow}`);
        currentRow++;

        // Cabeçalhos
        sheet.addRow(table.headers);
        this.applyHeaderStyle(sheet, currentRow);
        currentRow++;

        // Dados
        table.rows.forEach((row) => {
          sheet.addRow(row);
          this.applyBorder(sheet, currentRow);
          currentRow++;
        });

        currentRow += 2;
      });
    }

    // Auto-ajustar largura
    if (options?.excel?.autoColumnWidth) {
      this.autoFitColumns(sheet);
    }
  }

  /**
   * Aplica estilo de cabeçalho
   */
  private applyHeaderStyle(sheet: ExcelJS.Worksheet, rowNumber: number): void {
    const row = sheet.getRow(rowNumber);
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' },
    };
    row.alignment = { horizontal: 'center', vertical: 'middle' };
    row.height = 20;

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  }

  /**
   * Aplica bordas nas células
   */
  private applyBorder(sheet: ExcelJS.Worksheet, rowNumber: number): void {
    const row = sheet.getRow(rowNumber);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  }

  /**
   * Auto-ajusta largura das colunas
   */
  private autoFitColumns(sheet: ExcelJS.Worksheet): void {
    sheet.columns.forEach((column) => {
      let maxLength = 0;
      if (column && column.eachCell) {
        column.eachCell({ includeEmpty: false }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50); // Max 50 caracteres
      }
    });
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
}

// Exportar instância singleton
export const ceoExcelGenerator = new CEOExcelGeneratorService();

