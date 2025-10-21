/**
 * 🎯 CEO DASHBOARD - METAS TYPES
 * 
 * Types para sistema de metas financeiras
 */

// ============================================================================
// META PRINCIPAL
// ============================================================================

export interface Meta {
  id: string;
  userId: string;
  tipo: MetaTipo;
  nome: string;
  descricao?: string;
  
  // Valores
  valorMeta: number;
  valorAtual: number;
  unidade: MetaUnidade;
  
  // Período
  periodo: string; // YYYY-MM
  dataInicio: Date;
  dataFim: Date;
  
  // Cálculos
  percentualAtingido: number;
  percentualEsperado: number;
  projecaoFinal: number;
  diasDecorridos: number;
  diasTotais: number;
  status: MetaStatus;
  
  // Dimensões (opcional)
  centroCustoId?: string;
  centroCustoNome?: string;
  vendedorId?: string;
  vendedorNome?: string;
  lojaId?: string;
  lojaNome?: string;
  produtoId?: string;
  produtoNome?: string;
  categoria?: string;
  
  // Metadata
  cor?: string;
  icone?: string;
  prioridade?: MetaPrioridade;
  visibilidade?: 'privada' | 'equipe' | 'empresa';
  
  // Alertas
  alertaEmitido?: boolean;
  ultimoAlerta?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// ENUMS E TIPOS
// ============================================================================

export type MetaTipo =
  | 'vendas'              // Quantidade de vendas
  | 'receita'             // Receita bruta
  | 'receita_liquida'     // Receita líquida
  | 'lucro'               // Lucro líquido
  | 'lucro_bruto'         // Lucro bruto
  | 'margem_lucro'        // Margem de lucro %
  | 'margem_bruta'        // Margem bruta %
  | 'novos_clientes'      // Novos clientes
  | 'clientes_recorrentes'// Clientes recorrentes
  | 'ticket_medio'        // Ticket médio
  | 'conversao'           // Taxa de conversão %
  | 'inadimplencia'       // Taxa de inadimplência % (menor é melhor)
  | 'despesas'            // Total de despesas (menor é melhor)
  | 'cac'                 // Custo de Aquisição de Cliente
  | 'ltv'                 // Lifetime Value
  | 'custom';             // Personalizada

export type MetaUnidade =
  | 'currency'            // R$
  | 'percentage'          // %
  | 'number'              // Unidades
  | 'days';               // Dias

export type MetaStatus =
  | 'no_prazo'            // Dentro do esperado
  | 'acelerado'           // Acima do esperado
  | 'atrasado'            // Abaixo do esperado
  | 'atingido'            // Meta completa
  | 'superado'            // Acima de 100%
  | 'nao_atingido'        // Não atingiu ao final do período
  | 'pausado';            // Meta pausada

export type MetaPrioridade =
  | 'critica'
  | 'alta'
  | 'media'
  | 'baixa';

// ============================================================================
// META COM CÁLCULOS AVANÇADOS
// ============================================================================

export interface MetaCalculada extends Meta {
  historico: MetaHistorico[];
  tendencia: MetaTendencia;
  velocidade: MetaVelocidade;
  previsao: MetaPrevisao;
  alertas: MetaAlerta[];
}

export interface MetaHistorico {
  data: Date;
  valorAtual: number;
  percentualAtingido: number;
  variacao: number;
  variacaoPercentual: number;
}

export interface MetaTendencia {
  direcao: 'crescente' | 'decrescente' | 'estavel';
  confianca: number; // 0-100
  taxaCrescimento: number;
  projecaoTendencia: number;
}

export interface MetaVelocidade {
  velocidadeAtual: number; // unidades por dia
  velocidadeNecessaria: number;
  diferenca: number;
  status: 'acima' | 'adequada' | 'abaixo';
}

export interface MetaPrevisao {
  valorPrevisto: number;
  percentualPrevisto: number;
  dataAtingimento?: Date;
  confianca: number;
  cenarios: {
    otimista: number;
    realista: number;
    pessimista: number;
  };
}

export interface MetaAlerta {
  id: string;
  tipo: 'sucesso' | 'atencao' | 'critico' | 'info';
  titulo: string;
  mensagem: string;
  acaoRecomendada?: string;
  timestamp: Date;
  lido: boolean;
}

// ============================================================================
// AGRUPAMENTOS E VISÕES
// ============================================================================

export interface MetasAgrupadas {
  porTipo: Map<MetaTipo, Meta[]>;
  porStatus: Map<MetaStatus, Meta[]>;
  porPrioridade: Map<MetaPrioridade, Meta[]>;
  porDimensao: {
    centroCusto: Map<string, Meta[]>;
    vendedor: Map<string, Meta[]>;
    loja: Map<string, Meta[]>;
    categoria: Map<string, Meta[]>;
  };
}

export interface MetasResumo {
  totalMetas: number;
  metasAtivas: number;
  metasAtingidas: number;
  metasEmAndamento: number;
  metasAtrasadas: number;
  metasPausadas: number;
  
  percentualGeralAtingido: number;
  valorTotalMetas: number;
  valorTotalAtual: number;
  
  porTipo: Record<MetaTipo, {
    quantidade: number;
    percentualMedio: number;
  }>;
  
  porStatus: Record<MetaStatus, number>;
}

// ============================================================================
// EVOLUÇÃO DE METAS
// ============================================================================

export interface MetaEvolucao {
  periodo: string;
  totalMetas: number;
  metasAtingidas: number;
  metasNaoAtingidas: number;
  percentualSucesso: number;
  valorTotalMetas: number;
  valorTotalAtingido: number;
  ticketMedioMeta: number;
}

export interface MetaEvolucaoTemporal {
  mes: string;
  metas: Meta[];
  resumo: MetasResumo;
  comparacaoMesAnterior: {
    variacaoQuantidade: number;
    variacaoPercentualAtingido: number;
  };
}

// ============================================================================
// HEATMAP DE METAS
// ============================================================================

export interface MetaHeatmap {
  dimensoes: MetaHeatmapDimensao[];
  periodos: string[];
}

export interface MetaHeatmapDimensao {
  tipo: 'vendedor' | 'loja' | 'produto' | 'categoria' | 'centro_custo';
  id: string;
  nome: string;
  dados: MetaHeatmapCelula[];
}

export interface MetaHeatmapCelula {
  periodo: string;
  percentualAtingido: number;
  valorMeta: number;
  valorAtual: number;
  status: MetaStatus;
  quantidadeMetas: number;
}

// ============================================================================
// COMPARAÇÃO DE METAS
// ============================================================================

export interface MetaComparacao {
  meta1: Meta;
  meta2: Meta;
  diferencas: {
    valorMeta: number;
    valorAtual: number;
    percentualAtingido: number;
    velocidade: number;
    projecao: number;
  };
  melhorPerformance: 'meta1' | 'meta2' | 'empate';
}

// ============================================================================
// FORMULÁRIOS E VALIDAÇÃO
// ============================================================================

export interface MetaFormData {
  tipo: MetaTipo;
  nome: string;
  descricao?: string;
  valorMeta: number;
  unidade: MetaUnidade;
  periodo: string;
  centroCustoId?: string;
  vendedorId?: string;
  lojaId?: string;
  produtoId?: string;
  categoria?: string;
  cor?: string;
  icone?: string;
  prioridade?: MetaPrioridade;
  visibilidade?: 'privada' | 'equipe' | 'empresa';
}

export interface MetaValidacao {
  valido: boolean;
  erros: string[];
  avisos: string[];
}

// ============================================================================
// TEMPLATES DE METAS
// ============================================================================

export interface MetaTemplate {
  id: string;
  nome: string;
  descricao: string;
  tipo: MetaTipo;
  unidade: MetaUnidade;
  valorSugerido?: number;
  categoria: string;
  popularidade: number;
  icone: string;
  cor: string;
}

export const METAS_TEMPLATES: MetaTemplate[] = [
  {
    id: 'receita-mensal',
    nome: 'Receita Mensal',
    descricao: 'Meta de faturamento para o mês',
    tipo: 'receita',
    unidade: 'currency',
    categoria: 'Financeiro',
    popularidade: 5,
    icone: 'DollarSign',
    cor: '#10b981',
  },
  {
    id: 'novos-clientes',
    nome: 'Novos Clientes',
    descricao: 'Quantidade de novos clientes no mês',
    tipo: 'novos_clientes',
    unidade: 'number',
    categoria: 'Vendas',
    popularidade: 5,
    icone: 'UserPlus',
    cor: '#3b82f6',
  },
  {
    id: 'ticket-medio',
    nome: 'Ticket Médio',
    descricao: 'Valor médio por venda',
    tipo: 'ticket_medio',
    unidade: 'currency',
    categoria: 'Vendas',
    popularidade: 4,
    icone: 'TrendingUp',
    cor: '#8b5cf6',
  },
  {
    id: 'margem-lucro',
    nome: 'Margem de Lucro',
    descricao: 'Percentual de margem de lucro',
    tipo: 'margem_lucro',
    unidade: 'percentage',
    categoria: 'Financeiro',
    popularidade: 4,
    icone: 'Percent',
    cor: '#f59e0b',
  },
];

// ============================================================================
// PARÂMETROS E FILTROS
// ============================================================================

export interface MetasFiltros {
  userId: string;
  tipos?: MetaTipo[];
  status?: MetaStatus[];
  periodos?: string[];
  centroCustoIds?: string[];
  vendedorIds?: string[];
  lojaIds?: string[];
  prioridades?: MetaPrioridade[];
  busca?: string;
}

export interface MetasOrdenacao {
  campo: keyof Meta;
  direcao: 'asc' | 'desc';
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface MetaResponse {
  success: boolean;
  data?: Meta;
  error?: string;
  timestamp: Date;
}

export interface MetasListResponse {
  success: boolean;
  data?: Meta[];
  total: number;
  pagina?: number;
  porPagina?: number;
  error?: string;
  timestamp: Date;
}

export interface MetaResumoResponse {
  success: boolean;
  data?: MetasResumo;
  error?: string;
  timestamp: Date;
}

export interface MetaCalculadaResponse {
  success: boolean;
  data?: MetaCalculada;
  error?: string;
  timestamp: Date;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

export interface MetaCRUDOperations {
  criar(data: MetaFormData): Promise<MetaResponse>;
  atualizar(id: string, data: Partial<MetaFormData>): Promise<MetaResponse>;
  deletar(id: string): Promise<{ success: boolean; error?: string }>;
  buscar(id: string): Promise<MetaResponse>;
  listar(filtros: MetasFiltros, ordenacao?: MetasOrdenacao): Promise<MetasListResponse>;
  recalcular(id: string): Promise<MetaCalculadaResponse>;
  pausar(id: string): Promise<MetaResponse>;
  reativar(id: string): Promise<MetaResponse>;
}


