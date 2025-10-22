/**
 * 🎯 CEO DASHBOARD - KPIs E METAS
 * 
 * Definições de KPIs, benchmarks e metas padrão
 */

import type { MetaTipo, MetaUnidade } from '../_types/metas.types';

// ============================================================================
// DEFINIÇÕES DE KPIs
// ============================================================================

export interface KPIDefinicao {
  id: string;
  nome: string;
  descricao: string;
  categoria: 'financeiro' | 'operacional' | 'crescimento' | 'eficiencia' | 'cliente';
  unidade: MetaUnidade;
  formula: string;
  interpretacao: {
    excelente: string;
    bom: string;
    atencao: string;
    critico: string;
  };
  benchmarks: {
    excelente: number;
    bom: number;
    adequado: number;
    atencao: number;
  };
  icone: string;
  cor: string;
}

export const KPIS: Record<string, KPIDefinicao> = {
  // ========== FINANCEIROS ==========
  receita_bruta: {
    id: 'receita_bruta',
    nome: 'Receita Bruta',
    descricao: 'Faturamento total antes de deduções',
    categoria: 'financeiro',
    unidade: 'currency',
    formula: 'Σ valor_total de todas as vendas',
    interpretacao: {
      excelente: 'Receita acima da meta',
      bom: 'Receita próxima à meta',
      atencao: 'Receita abaixo do esperado',
      critico: 'Receita muito abaixo da meta',
    },
    benchmarks: {
      excelente: 100,
      bom: 90,
      adequado: 80,
      atencao: 70,
    },
    icone: 'DollarSign',
    cor: '#10b981',
  },
  
  receita_liquida: {
    id: 'receita_liquida',
    nome: 'Receita Líquida',
    descricao: 'Faturamento após impostos e deduções',
    categoria: 'financeiro',
    unidade: 'currency',
    formula: 'Receita Bruta - Impostos - Descontos - Devoluções',
    interpretacao: {
      excelente: 'Receita líquida saudável',
      bom: 'Receita líquida adequada',
      atencao: 'Receita líquida pressionada',
      critico: 'Receita líquida preocupante',
    },
    benchmarks: {
      excelente: 100,
      bom: 90,
      adequado: 80,
      atencao: 70,
    },
    icone: 'TrendingUp',
    cor: '#059669',
  },
  
  lucro_bruto: {
    id: 'lucro_bruto',
    nome: 'Lucro Bruto',
    descricao: 'Receita líquida menos custos diretos',
    categoria: 'financeiro',
    unidade: 'currency',
    formula: 'Receita Líquida - CMV',
    interpretacao: {
      excelente: 'Lucro bruto muito positivo',
      bom: 'Lucro bruto saudável',
      atencao: 'Lucro bruto baixo',
      critico: 'Lucro bruto negativo',
    },
    benchmarks: {
      excelente: 50,
      bom: 40,
      adequado: 30,
      atencao: 20,
    },
    icone: 'Target',
    cor: '#14b8a6',
  },
  
  lucro_liquido: {
    id: 'lucro_liquido',
    nome: 'Lucro Líquido',
    descricao: 'Resultado final após todas as deduções',
    categoria: 'financeiro',
    unidade: 'currency',
    formula: 'Lucro Operacional + Resultado Financeiro - Impostos sobre Lucro',
    interpretacao: {
      excelente: 'Negócio altamente lucrativo',
      bom: 'Negócio lucrativo',
      atencao: 'Lucratividade baixa',
      critico: 'Prejuízo',
    },
    benchmarks: {
      excelente: 20,
      bom: 15,
      adequado: 10,
      atencao: 5,
    },
    icone: 'Award',
    cor: '#8b5cf6',
  },
  
  margem_bruta: {
    id: 'margem_bruta',
    nome: 'Margem Bruta',
    descricao: 'Percentual de lucro bruto sobre receita',
    categoria: 'financeiro',
    unidade: 'percentage',
    formula: '(Lucro Bruto / Receita Líquida) × 100',
    interpretacao: {
      excelente: 'Margem muito saudável',
      bom: 'Margem adequada',
      atencao: 'Margem pressionada',
      critico: 'Margem insustentável',
    },
    benchmarks: {
      excelente: 50,
      bom: 40,
      adequado: 30,
      atencao: 20,
    },
    icone: 'Percent',
    cor: '#14b8a6',
  },
  
  margem_liquida: {
    id: 'margem_liquida',
    nome: 'Margem Líquida',
    descricao: 'Percentual de lucro líquido sobre receita',
    categoria: 'financeiro',
    unidade: 'percentage',
    formula: '(Lucro Líquido / Receita Líquida) × 100',
    interpretacao: {
      excelente: 'Margem líquida excelente',
      bom: 'Margem líquida saudável',
      atencao: 'Margem líquida baixa',
      critico: 'Margem líquida negativa',
    },
    benchmarks: {
      excelente: 20,
      bom: 15,
      adequado: 10,
      atencao: 5,
    },
    icone: 'Percent',
    cor: '#8b5cf6',
  },
  
  // ========== OPERACIONAIS ==========
  ticket_medio: {
    id: 'ticket_medio',
    nome: 'Ticket Médio',
    descricao: 'Valor médio por venda',
    categoria: 'operacional',
    unidade: 'currency',
    formula: 'Receita Total / Quantidade de Vendas',
    interpretacao: {
      excelente: 'Ticket médio alto',
      bom: 'Ticket médio adequado',
      atencao: 'Ticket médio baixo',
      critico: 'Ticket médio muito baixo',
    },
    benchmarks: {
      excelente: 100,
      bom: 90,
      adequado: 80,
      atencao: 70,
    },
    icone: 'ShoppingCart',
    cor: '#3b82f6',
  },
  
  total_vendas: {
    id: 'total_vendas',
    nome: 'Total de Vendas',
    descricao: 'Quantidade total de vendas realizadas',
    categoria: 'operacional',
    unidade: 'number',
    formula: 'Contagem de vendas no período',
    interpretacao: {
      excelente: 'Volume de vendas alto',
      bom: 'Volume de vendas adequado',
      atencao: 'Volume de vendas baixo',
      critico: 'Volume de vendas crítico',
    },
    benchmarks: {
      excelente: 100,
      bom: 90,
      adequado: 80,
      atencao: 70,
    },
    icone: 'ShoppingBag',
    cor: '#6366f1',
  },
  
  // ========== CRESCIMENTO ==========
  crescimento_mom: {
    id: 'crescimento_mom',
    nome: 'Crescimento MoM',
    descricao: 'Crescimento mês sobre mês',
    categoria: 'crescimento',
    unidade: 'percentage',
    formula: '((Mês Atual - Mês Anterior) / Mês Anterior) × 100',
    interpretacao: {
      excelente: 'Crescimento acelerado',
      bom: 'Crescimento saudável',
      atencao: 'Crescimento lento',
      critico: 'Decrescimento',
    },
    benchmarks: {
      excelente: 15,
      bom: 10,
      adequado: 5,
      atencao: 0,
    },
    icone: 'TrendingUp',
    cor: '#10b981',
  },
  
  crescimento_yoy: {
    id: 'crescimento_yoy',
    nome: 'Crescimento YoY',
    descricao: 'Crescimento ano sobre ano',
    categoria: 'crescimento',
    unidade: 'percentage',
    formula: '((Ano Atual - Ano Anterior) / Ano Anterior) × 100',
    interpretacao: {
      excelente: 'Crescimento anual forte',
      bom: 'Crescimento anual adequado',
      atencao: 'Crescimento anual fraco',
      critico: 'Decrescimento anual',
    },
    benchmarks: {
      excelente: 30,
      bom: 20,
      adequado: 10,
      atencao: 0,
    },
    icone: 'BarChart',
    cor: '#059669',
  },
  
  // ========== EFICIÊNCIA ==========
  cac: {
    id: 'cac',
    nome: 'CAC',
    descricao: 'Custo de Aquisição de Cliente',
    categoria: 'eficiencia',
    unidade: 'currency',
    formula: 'Custos de Marketing e Vendas / Novos Clientes',
    interpretacao: {
      excelente: 'CAC muito eficiente',
      bom: 'CAC adequado',
      atencao: 'CAC alto',
      critico: 'CAC insustentável',
    },
    benchmarks: {
      excelente: 50,
      bom: 100,
      adequado: 200,
      atencao: 300,
    },
    icone: 'UserPlus',
    cor: '#3b82f6',
  },
  
  ltv_cac_ratio: {
    id: 'ltv_cac_ratio',
    nome: 'LTV/CAC Ratio',
    descricao: 'Relação entre Lifetime Value e CAC',
    categoria: 'eficiencia',
    unidade: 'number',
    formula: 'LTV / CAC',
    interpretacao: {
      excelente: 'Ratio muito saudável (≥3)',
      bom: 'Ratio adequado (≥2)',
      atencao: 'Ratio baixo (<2)',
      critico: 'Ratio insustentável (<1)',
    },
    benchmarks: {
      excelente: 3,
      bom: 2,
      adequado: 1.5,
      atencao: 1,
    },
    icone: 'Activity',
    cor: '#8b5cf6',
  },
  
  // ========== CLIENTES ==========
  novos_clientes: {
    id: 'novos_clientes',
    nome: 'Novos Clientes',
    descricao: 'Quantidade de clientes novos no período',
    categoria: 'cliente',
    unidade: 'number',
    formula: 'Contagem de clientes com primeira compra',
    interpretacao: {
      excelente: 'Aquisição acelerada',
      bom: 'Aquisição saudável',
      atencao: 'Aquisição lenta',
      critico: 'Aquisição crítica',
    },
    benchmarks: {
      excelente: 100,
      bom: 90,
      adequado: 80,
      atencao: 70,
    },
    icone: 'UserPlus',
    cor: '#3b82f6',
  },
  
  taxa_recorrencia: {
    id: 'taxa_recorrencia',
    nome: 'Taxa de Recorrência',
    descricao: 'Percentual de clientes que compraram mais de uma vez',
    categoria: 'cliente',
    unidade: 'percentage',
    formula: '(Clientes Recorrentes / Total Clientes) × 100',
    interpretacao: {
      excelente: 'Recorrência muito alta',
      bom: 'Recorrência saudável',
      atencao: 'Recorrência baixa',
      critico: 'Recorrência crítica',
    },
    benchmarks: {
      excelente: 50,
      bom: 40,
      adequado: 30,
      atencao: 20,
    },
    icone: 'Repeat',
    cor: '#14b8a6',
  },
  
  churn_rate: {
    id: 'churn_rate',
    nome: 'Churn Rate',
    descricao: 'Taxa de cancelamento de clientes',
    categoria: 'cliente',
    unidade: 'percentage',
    formula: '(Clientes Perdidos / Total Clientes Início) × 100',
    interpretacao: {
      excelente: 'Churn muito baixo (<5%)',
      bom: 'Churn baixo (<10%)',
      atencao: 'Churn alto (>10%)',
      critico: 'Churn crítico (>20%)',
    },
    benchmarks: {
      excelente: 5,
      bom: 10,
      adequado: 15,
      atencao: 20,
    },
    icone: 'UserMinus',
    cor: '#ef4444',
  },
};

// ============================================================================
// METAS SUGERIDAS
// ============================================================================

export interface MetaSugerida {
  tipo: MetaTipo;
  nome: string;
  descricao: string;
  unidade: MetaUnidade;
  categoria: string;
  sugestaoValor?: {
    formula: string;
    multiplicador: number;
  };
  icone: string;
  cor: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

export const METAS_SUGERIDAS: MetaSugerida[] = [
  {
    tipo: 'receita',
    nome: 'Meta de Receita Mensal',
    descricao: 'Faturamento esperado para o mês',
    unidade: 'currency',
    categoria: 'Financeiro',
    sugestaoValor: {
      formula: 'média dos últimos 3 meses',
      multiplicador: 1.1, // 10% de crescimento
    },
    icone: 'DollarSign',
    cor: '#10b981',
    prioridade: 'alta',
  },
  {
    tipo: 'lucro',
    nome: 'Meta de Lucro Líquido',
    descricao: 'Lucro líquido esperado',
    unidade: 'currency',
    categoria: 'Financeiro',
    sugestaoValor: {
      formula: 'média dos últimos 3 meses',
      multiplicador: 1.15, // 15% de crescimento
    },
    icone: 'Award',
    cor: '#8b5cf6',
    prioridade: 'alta',
  },
  {
    tipo: 'novos_clientes',
    nome: 'Meta de Novos Clientes',
    descricao: 'Quantidade de novos clientes a adquirir',
    unidade: 'number',
    categoria: 'Crescimento',
    sugestaoValor: {
      formula: 'média dos últimos 3 meses',
      multiplicador: 1.2, // 20% de crescimento
    },
    icone: 'UserPlus',
    cor: '#3b82f6',
    prioridade: 'alta',
  },
  {
    tipo: 'ticket_medio',
    nome: 'Meta de Ticket Médio',
    descricao: 'Valor médio por venda desejado',
    unidade: 'currency',
    categoria: 'Vendas',
    sugestaoValor: {
      formula: 'média dos últimos 3 meses',
      multiplicador: 1.05, // 5% de crescimento
    },
    icone: 'ShoppingCart',
    cor: '#f59e0b',
    prioridade: 'media',
  },
  {
    tipo: 'margem_lucro',
    nome: 'Meta de Margem de Lucro',
    descricao: 'Margem de lucro líquido desejada',
    unidade: 'percentage',
    categoria: 'Financeiro',
    icone: 'Percent',
    cor: '#14b8a6',
    prioridade: 'media',
  },
  {
    tipo: 'vendas',
    nome: 'Meta de Quantidade de Vendas',
    descricao: 'Número de vendas a realizar',
    unidade: 'number',
    categoria: 'Vendas',
    sugestaoValor: {
      formula: 'média dos últimos 3 meses',
      multiplicador: 1.1, // 10% de crescimento
    },
    icone: 'ShoppingBag',
    cor: '#6366f1',
    prioridade: 'media',
  },
];

// ============================================================================
// BENCHMARKS DE MERCADO
// ============================================================================

export const BENCHMARKS_MERCADO = {
  varejo: {
    margem_bruta: { min: 30, ideal: 40, excelente: 50 },
    margem_liquida: { min: 5, ideal: 10, excelente: 15 },
    ticket_medio: { min: 50, ideal: 100, excelente: 200 },
    crescimento_mensal: { min: 3, ideal: 5, excelente: 10 },
  },
  servicos: {
    margem_bruta: { min: 50, ideal: 60, excelente: 70 },
    margem_liquida: { min: 10, ideal: 20, excelente: 30 },
    ticket_medio: { min: 200, ideal: 500, excelente: 1000 },
    crescimento_mensal: { min: 5, ideal: 10, excelente: 15 },
  },
  industria: {
    margem_bruta: { min: 20, ideal: 30, excelente: 40 },
    margem_liquida: { min: 3, ideal: 8, excelente: 15 },
    ticket_medio: { min: 500, ideal: 2000, excelente: 5000 },
    crescimento_mensal: { min: 2, ideal: 5, excelente: 8 },
  },
} as const;

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém KPI por ID
 */
export function obterKPI(id: string): KPIDefinicao | undefined {
  return KPIS[id];
}

/**
 * Obtém KPIs por categoria
 */
export function obterKPIsPorCategoria(
  categoria: 'financeiro' | 'operacional' | 'crescimento' | 'eficiencia' | 'cliente'
): KPIDefinicao[] {
  return Object.values(KPIS).filter(kpi => kpi.categoria === categoria);
}

/**
 * Classifica valor de KPI baseado nos benchmarks
 */
export function classificarKPI(
  kpiId: string,
  valor: number
): 'excelente' | 'bom' | 'adequado' | 'atencao' | 'critico' {
  const kpi = KPIS[kpiId];
  if (!kpi) return 'adequado';
  
  const { benchmarks } = kpi;
  
  if (valor >= benchmarks.excelente) return 'excelente';
  if (valor >= benchmarks.bom) return 'bom';
  if (valor >= benchmarks.adequado) return 'adequado';
  if (valor >= benchmarks.atencao) return 'atencao';
  return 'critico';
}

/**
 * Obtém meta sugerida por tipo
 */
export function obterMetaSugerida(tipo: MetaTipo): MetaSugerida | undefined {
  return METAS_SUGERIDAS.find(meta => meta.tipo === tipo);
}

/**
 * Lista todas as metas sugeridas de alta prioridade
 */
export function obterMetasAltaPrioridade(): MetaSugerida[] {
  return METAS_SUGERIDAS.filter(meta => meta.prioridade === 'alta');
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export const KPIsEMetas = {
  kpis: KPIS,
  metasSugeridas: METAS_SUGERIDAS,
  benchmarksMercado: BENCHMARKS_MERCADO,
  
  // Funções
  obterKPI,
  obterKPIsPorCategoria,
  classificarKPI,
  obterMetaSugerida,
  obterMetasAltaPrioridade,
};



