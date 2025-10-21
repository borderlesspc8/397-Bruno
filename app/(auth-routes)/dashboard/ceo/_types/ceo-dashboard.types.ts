/**
 * 📊 CEO DASHBOARD - TYPES PRINCIPAIS
 * 
 * Types centrais para o Dashboard CEO
 * Completamente isolado dos outros dashboards
 */

// ============================================================================
// FILTROS E PARÂMETROS
// ============================================================================

export interface CEODashboardFilters {
  dataInicio: Date;
  dataFim: Date;
  userId: string;
  lojaId?: string;
  centrosCustoIds?: string[];
  vendedoresIds?: string[];
  forceUpdate?: boolean;
  // ✅ DADOS REAIS DAS APIS (opcionais)
  vendas?: any[];
  pagamentos?: any[];
  recebimentos?: any[];
  centrosCustos?: any[];
  contasBancarias?: any[];
}

export interface PeriodoComparativo {
  atual: {
    inicio: Date;
    fim: Date;
  };
  anterior: {
    inicio: Date;
    fim: Date;
  };
}

// ============================================================================
// DADOS PRINCIPAIS
// ============================================================================

export interface CEODashboardData {
  visaoGeral: VisaoGeralData;
  indicadoresFinanceiros: IndicadoresFinanceirosData;
  indicadoresCrescimento: IndicadoresCrescimentoData;
  sazonalidade: SazonalidadeData;
  metas: MetasData;
  timestamp: Date;
  filtrosAplicados: CEODashboardFilters;
  // 🆕 DADOS BRUTOS DAS 25 APIs + INDICADORES CALCULADOS
  dadosBrutos?: {
    betel: any;
    indicadores: any;
  };
}

// ============================================================================
// VISÃO GERAL
// ============================================================================

export interface VisaoGeralData {
  kpisPrincipais: KPIsPrincipais;
  dre: DREResumido;
  tendenciaGeral: TendenciaGeral[];
  alertasFinanceiros: AlertaFinanceiro[];
}

export interface KPIsPrincipais {
  receitaBruta: KPIMetrica;
  receitaLiquida: KPIMetrica;
  lucroLiquido: KPIMetrica;
  margemLiquida: KPIMetrica;
  ticketMedio: KPIMetrica;
  totalVendas: KPIMetrica;
  novosClientes: KPIMetrica;
  taxaRecorrencia: KPIMetrica;
}

export interface KPIMetrica {
  valor: number;
  variacaoMoM: number; // Month over Month
  variacaoYoY: number; // Year over Year
  tendencia: 'alta' | 'baixa' | 'estavel';
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  meta?: number;
  percentualMeta?: number;
}

export interface DREResumido {
  receitaBruta: number;
  impostos: number;
  receitaLiquida: number;
  cmv: number;
  margemBruta: number;
  margemBrutaPercent: number;
  despesasOperacionais: number;
  lucroOperacional: number;
  lucroOperacionalPercent: number;
  resultadoFinanceiro: number;
  lucroLiquido: number;
  lucroLiquidoPercent: number;
}

export interface TendenciaGeral {
  periodo: string; // YYYY-MM
  receita: number;
  custos: number;
  lucro: number;
  margem: number;
}

export interface AlertaFinanceiro {
  id: string;
  tipo: 'critico' | 'atencao' | 'info';
  categoria: 'liquidez' | 'inadimplencia' | 'margem' | 'crescimento' | 'meta' | 'despesa';
  titulo: string;
  descricao: string;
  valor?: number;
  acaoRecomendada?: string;
  timestamp: Date;
}

// ============================================================================
// INDICADORES FINANCEIROS
// ============================================================================

export interface IndicadoresFinanceirosData {
  liquidez?: IndicadoresLiquidez;
  inadimplencia?: IndicadoresInadimplencia;
  sustentabilidade?: IndicadoresSustentabilidade;
  eficiencia?: IndicadoresEficiencia;
  // 🆕 NOVOS INDICADORES DAS APIs REAIS
  data?: {
    eficienciaOperacional?: any;
    liquidez?: any;
    inadimplencia?: any;
    sustentabilidade?: any;
    previsibilidade?: any;
    rentabilidadePorDimensao?: {
      porCentroCusto?: any[];
      porVendedor?: any[];
      porProduto?: any[];
      porCliente?: any[];
    };
  };
}

export interface IndicadoresLiquidez {
  liquidezCorrente: {
    valor: number;
    status: 'excelente' | 'bom' | 'atencao' | 'critico';
    ativosCirculantes: number;
    passivosCirculantes: number;
  };
  cicloConversao: {
    dias: number;
    pmr: number; // Prazo Médio de Recebimento
    pmp: number; // Prazo Médio de Pagamento
    status: 'excelente' | 'bom' | 'atencao' | 'critico';
  };
  coberturaDespesas: {
    meses: number;
    reservasAtuais: number;
    despesasFixasMensais: number;
    status: 'excelente' | 'bom' | 'atencao' | 'critico';
  };
}

export interface IndicadoresInadimplencia {
  taxaInadimplencia: {
    percentual: number;
    valorTotal: number;
    valorVencido: number;
    quantidadeVencidas: number;
    status: 'excelente' | 'bom' | 'atencao' | 'critico';
  };
  aging: AgingRecebiveis[];
  topInadimplentes: ClienteInadimplente[];
}

export interface AgingRecebiveis {
  faixa: string;
  quantidade: number;
  valor: number;
  percentual: number;
}

export interface ClienteInadimplente {
  clienteId: string;
  clienteNome: string;
  valorDevedor: number;
  diasAtraso: number;
  quantidadeVendas: number;
  ultimaCompra: Date;
}

export interface IndicadoresSustentabilidade {
  coberturaDespesas: {
    meses: number;
    historico: Array<{ periodo: string; meses: number }>;
    tendencia: 'melhorando' | 'estavel' | 'piorando';
  };
  endividamento: {
    percentual: number;
    disponivel: number;
    aPagar: number;
    status: 'saudavel' | 'atencao' | 'critico';
  };
}

export interface IndicadoresEficiencia {
  relacaoCustosReceita: {
    percentual: number;
    custoTotal: number;
    receitaTotal: number;
    status: 'excelente' | 'bom' | 'atencao' | 'critico';
  };
  cac: {
    valor: number;
    ltv: number;
    ratio: number; // LTV/CAC
    status: 'excelente' | 'bom' | 'atencao' | 'critico';
  };
  rentabilidadePorCC: RentabilidadeCentroCusto[];
}

export interface RentabilidadeCentroCusto {
  centroCustoId: string;
  centroCustoNome: string;
  receita: number;
  custos: number;
  lucro: number;
  margem: number;
  participacao: number; // % do total
}

// ============================================================================
// INDICADORES DE CRESCIMENTO
// ============================================================================

export interface IndicadoresCrescimentoData {
  crescimento?: CrescimentoIndicadores;
  breakdown?: CrescimentoBreakdown;
  tendencia?: string;
  projecoes?: {
    proximoMes?: number;
    proximoTrimestre?: number;
  };
}

export interface CrescimentoIndicadores {
  mom: {
    percentual: number;
    valorAtual: number;
    valorAnterior: number;
    status: 'acelerado' | 'moderado' | 'lento' | 'negativo';
  };
  yoy: {
    percentual: number;
    valorAtual: number;
    valorAnterior: number;
    status: 'acelerado' | 'moderado' | 'lento' | 'negativo';
  };
  cagr: {
    percentual: number;
    valorInicial: number;
    valorFinal: number;
    meses: number;
    status: 'acelerado' | 'moderado' | 'lento' | 'negativo';
  };
}

export interface CrescimentoBreakdown {
  porProduto: Array<{
    produtoId: string;
    produtoNome: string;
    crescimento: number;
    receitaAtual: number;
    receitaAnterior: number;
  }>;
  porVendedor: Array<{
    vendedorId: string;
    vendedorNome: string;
    crescimento: number;
    receitaAtual: number;
    receitaAnterior: number;
  }>;
  porLoja: Array<{
    lojaId: string;
    lojaNome: string;
    crescimento: number;
    receitaAtual: number;
    receitaAnterior: number;
  }>;
  porCanal: Array<{
    canal: string;
    crescimento: number;
    receitaAtual: number;
    receitaAnterior: number;
  }>;
}

// ============================================================================
// SAZONALIDADE
// ============================================================================

export interface SazonalidadeData {
  dadosMensais?: DadosMensaisSazonalidade[];
  estatisticas?: EstatisticasSazonalidade;
  padroes?: PadraoSazonalidade[];
  insights?: InsightSazonalidade[];
  // 🆕 DADOS DAS APIs REAIS
  meses?: any[];
  mediaReceita?: number;
  mediaDespesa?: number;
  mesComMaiorReceita?: string;
  mesComMenorReceita?: string;
  variabilidade?: number;
}

export interface DadosMensaisSazonalidade {
  periodo: string; // YYYY-MM
  mes: number;
  ano: number;
  vendas: number;
  receitas: number;
  custos: number;
  lucro: number;
  margem: number;
}

export interface EstatisticasSazonalidade {
  mediaMensal: number;
  desvioPadrao: number;
  coeficienteVariacao: number;
  mesComMaiorReceita: { mes: string; valor: number };
  mesComMenorReceita: { mes: string; valor: number };
  mesesAcimaDaMedia: string[];
  mesesAbaixoDaMedia: string[];
}

export interface PadraoSazonalidade {
  tipo: 'peak' | 'vale' | 'tendencia' | 'ciclo';
  descricao: string;
  periodos: string[];
  impacto: 'alto' | 'medio' | 'baixo';
}

export interface InsightSazonalidade {
  id: string;
  tipo: 'oportunidade' | 'risco' | 'informacao';
  titulo: string;
  descricao: string;
  periodoReferencia?: string[];
  valorImpacto?: number;
}

// ============================================================================
// PREVISIBILIDADE
// ============================================================================

export interface PrevisibilidadeData {
  receitaRecorrente: {
    percentual: number;
    valor: number;
    receitaTotal: number;
    clientesRecorrentes: number;
    totalClientes: number;
  };
  estabilidade: {
    coeficienteVariacao: number;
    status: 'muito_estavel' | 'estavel' | 'moderado' | 'instavel';
    mediaMensal: number;
    desvioPadrao: number;
  };
  previsao: PrevisaoReceita[];
}

export interface PrevisaoReceita {
  periodo: string;
  valorPrevisto: number;
  margemErro: number;
  confianca: number; // 0-100
  metodo: 'media_movel' | 'tendencia_linear' | 'sazonalidade';
}

// ============================================================================
// METAS
// ============================================================================

export interface MetasData {
  resumo: MetasResumo;
  metas: Meta[];
  evolucao: MetaEvolucao[];
  heatmap: MetaHeatmap;
}

export interface MetasResumo {
  totalMetas: number;
  metasAtingidas: number;
  metasEmAndamento: number;
  metasAtrasadas: number;
  percentualGeralAtingido: number;
}

export interface Meta {
  id: string;
  userId: string;
  tipo: MetaTipo;
  nome: string;
  valorMeta: number;
  valorAtual: number;
  percentualAtingido: number;
  periodo: string; // YYYY-MM
  unidade: 'currency' | 'percentage' | 'number';
  status: MetaStatus;
  percentualEsperado: number;
  projecaoFinal: number;
  diasDecorridos: number;
  diasTotais: number;
  centroCustoId?: string;
  vendedorId?: string;
  lojaId?: string;
  categoria?: string;
  descricao?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type MetaTipo = 
  | 'vendas'
  | 'receita'
  | 'lucro'
  | 'novos_clientes'
  | 'ticket_medio'
  | 'margem_lucro'
  | 'custom';

export type MetaStatus = 
  | 'no_prazo'
  | 'atrasado'
  | 'atingido'
  | 'superado'
  | 'nao_atingido';

export interface MetaEvolucao {
  periodo: string;
  metas: number;
  atingidas: number;
  percentual: number;
}

export interface MetaHeatmap {
  dimensoes: Array<{
    tipo: string;
    nome: string;
    metas: Array<{
      periodo: string;
      percentualAtingido: number;
    }>;
  }>;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface CEODashboardResponse {
  success: boolean;
  data?: CEODashboardData;
  error?: string;
  timestamp: Date;
  cached: boolean;
  cacheKey?: string;
}

export interface MetaCRUDResponse {
  success: boolean;
  data?: Meta;
  error?: string;
}

export interface MetasListResponse {
  success: boolean;
  data?: Meta[];
  error?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type StatusFinanceiro = 'excelente' | 'bom' | 'atencao' | 'critico';

export type TendenciaIndicador = 'alta' | 'baixa' | 'estavel';

export type PeriodoAnalise = 'mensal' | 'trimestral' | 'anual';

export interface RangeValor {
  min: number;
  max: number;
  atual: number;
}

export interface ComparacaoPeriodo {
  atual: number;
  anterior: number;
  variacao: number;
  variacaoPercentual: number;
}

