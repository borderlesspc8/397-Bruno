/**
 * TIPOS E INTERFACES PARA SISTEMA DE RELATÓRIOS CEO
 * Sistema completamente isolado para geração de relatórios PDF e Excel
 * 
 * @module CEOReportTypes
 */

export type CEOReportType = 'financial' | 'operational' | 'commercial' | 'executive' | 'custom';
export type CEOReportFormat = 'pdf' | 'excel' | 'both';
export type CEOReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
export type CEOReportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

/**
 * Configuração de relatório CEO
 */
export interface CEOReportConfig {
  id?: string;
  name: string;
  description?: string;
  type: CEOReportType;
  format: CEOReportFormat;
  
  // Período de dados
  startDate: Date;
  endDate: Date;
  
  // Filtros
  filters?: {
    vendedores?: string[];
    produtos?: string[];
    categorias?: string[];
    formasPagamento?: string[];
    centrosCusto?: string[];
  };
  
  // Seções incluídas
  sections: {
    summary?: boolean;
    financialMetrics?: boolean;
    operationalMetrics?: boolean;
    commercialMetrics?: boolean;
    charts?: boolean;
    tables?: boolean;
    analysis?: boolean;
    recommendations?: boolean;
  };
  
  // Personalização
  template?: string;
  logo?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  
  // Metadados
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Configuração de agendamento de relatório
 */
export interface CEOReportSchedule {
  id?: string;
  reportConfigId: string;
  name: string;
  frequency: CEOReportFrequency;
  
  // Configuração de frequência
  dayOfWeek?: number; // 0-6 (Domingo-Sábado) para weekly
  dayOfMonth?: number; // 1-31 para monthly
  monthOfYear?: number; // 1-12 para yearly
  time?: string; // HH:MM formato 24h
  
  // Destinatários
  recipients: {
    email: string;
    name?: string;
  }[];
  
  // Configurações de envio
  emailSubject?: string;
  emailBody?: string;
  attachFormat?: CEOReportFormat;
  
  // Estado
  active: boolean;
  lastRun?: Date;
  nextRun?: Date;
  
  // Metadados
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Resultado de geração de relatório
 */
export interface CEOReportResult {
  id: string;
  reportConfigId?: string;
  scheduleId?: string;
  status: CEOReportStatus;
  format: CEOReportFormat;
  
  // Arquivos gerados
  files: {
    pdf?: {
      path: string;
      size: number;
      url?: string;
    };
    excel?: {
      path: string;
      size: number;
      url?: string;
    };
  };
  
  // Estatísticas
  stats: {
    generationTime: number; // ms
    dataPoints: number;
    pages?: number;
    charts?: number;
    tables?: number;
  };
  
  // Erro (se houver)
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  // Metadados
  generatedBy: string;
  generatedAt: Date;
}

/**
 * Dados do relatório CEO
 */
export interface CEOReportData {
  config: CEOReportConfig;
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  
  // Sumário executivo
  summary?: {
    totalRevenue: number;
    totalOrders: number;
    averageTicket: number;
    profitMargin: number;
    topInsights: string[];
  };
  
  // Métricas financeiras
  financialMetrics?: {
    revenue: {
      total: number;
      growth: number;
      trend: number[];
      byPaymentMethod: { method: string; value: number }[];
    };
    costs: {
      total: number;
      byCostCenter: { center: string; value: number }[];
    };
    profit: {
      gross: number;
      net: number;
      margin: number;
    };
    cashFlow: {
      inflow: number;
      outflow: number;
      balance: number;
      trend: { date: string; value: number }[];
    };
  };
  
  // Métricas operacionais
  operationalMetrics?: {
    orders: {
      total: number;
      completed: number;
      cancelled: number;
      pending: number;
    };
    products: {
      totalSold: number;
      topProducts: { name: string; quantity: number; revenue: number }[];
      byCategory: { category: string; quantity: number }[];
    };
    efficiency: {
      orderProcessingTime: number;
      fulfillmentRate: number;
      returnRate: number;
    };
  };
  
  // Métricas comerciais
  commercialMetrics?: {
    sales: {
      total: number;
      bySeller: { seller: string; value: number; orders: number }[];
      conversion: number;
    };
    customers: {
      total: number;
      new: number;
      returning: number;
      churn: number;
      ltv: number;
    };
    marketing: {
      cac: number;
      roi: number;
      byChannel: { channel: string; investment: number; return: number }[];
    };
  };
  
  // Gráficos
  charts?: {
    id: string;
    type: 'line' | 'bar' | 'pie' | 'area';
    title: string;
    data: any;
    dataUrl?: string; // Base64 data URL para PDF
  }[];
  
  // Tabelas
  tables?: {
    id: string;
    title: string;
    headers: string[];
    rows: any[][];
  }[];
  
  // Análises e recomendações
  analysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  recommendations?: {
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    expectedImpact: string;
  }[];
}

/**
 * Template de relatório
 */
export interface CEOReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: CEOReportType;
  
  // Configuração padrão
  defaultSections: CEOReportConfig['sections'];
  
  // Customização visual
  layout: {
    pageSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    margins?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  
  styles: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    fontSize: {
      title: number;
      heading: number;
      body: number;
      small: number;
    };
  };
  
  // Seções customizadas
  customSections?: {
    id: string;
    title: string;
    content: string;
    order: number;
  }[];
  
  // Metadados
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Opções de exportação
 */
export interface CEOExportOptions {
  format: CEOReportFormat;
  filename?: string;
  
  // Opções PDF
  pdf?: {
    pageSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    includeCharts?: boolean;
    includeTables?: boolean;
    includeTableOfContents?: boolean;
    compression?: boolean;
  };
  
  // Opções Excel
  excel?: {
    includeCharts?: boolean;
    sheetNames?: {
      summary?: string;
      financial?: string;
      operational?: string;
      commercial?: string;
      raw?: string;
    };
    autoColumnWidth?: boolean;
    freezeHeader?: boolean;
  };
}

