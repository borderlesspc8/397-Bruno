/**
 * 📈 CEO DASHBOARD - SAZONALIDADE TYPES
 * 
 * Types para análise de sazonalidade e previsibilidade
 */

// ============================================================================
// DADOS DE SAZONALIDADE
// ============================================================================

export interface SazonalidadeData {
  periodoAnalisado: {
    inicio: Date;
    fim: Date;
    meses: number;
  };
  dadosMensais: DadosMensaisSazonalidade[];
  estatisticas: EstatisticasSazonalidade;
  padroes: PadraoSazonalidade[];
  insights: InsightSazonalidade[];
  previsibilidade: PrevisibilidadeData;
}

// ============================================================================
// DADOS MENSAIS
// ============================================================================

export interface DadosMensaisSazonalidade {
  periodo: string; // YYYY-MM
  mes: number; // 1-12
  ano: number;
  nomeMes: string;
  trimestre: number;
  
  // Métricas principais
  vendas: number;
  receitas: number;
  custos: number;
  lucro: number;
  margem: number;
  
  // Comparações
  variacaoMesAnterior: number;
  variacaoMesAnteriorPercent: number;
  variacaoMesmoMesAnoAnterior: number;
  variacaoMesmoMesAnoAnteriorPercent: number;
  
  // Posição relativa
  posicaoRelativa: 'muito_acima' | 'acima' | 'media' | 'abaixo' | 'muito_abaixo';
  desviosPadrao: number; // Quantos desvios da média
  
  // Metadata
  diasUteis: number;
  eventosEspeciais?: string[];
  feriados?: number;
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

export interface EstatisticasSazonalidade {
  geral: EstatisticasGerais;
  porMes: EstatisticasPorMes;
  porTrimestre: EstatisticasPorTrimestre;
  volatilidade: AnaliseVolatilidade;
}

export interface EstatisticasGerais {
  mediaMensal: number;
  mediana: number;
  desvioPadrao: number;
  coeficienteVariacao: number;
  amplitude: number;
  quartis: {
    q1: number;
    q2: number;
    q3: number;
  };
  outliers: Array<{
    periodo: string;
    valor: number;
    tipo: 'superior' | 'inferior';
  }>;
}

export interface EstatisticasPorMes {
  meses: Array<{
    mes: number;
    nomeMes: string;
    media: number;
    mediana: number;
    min: number;
    max: number;
    ocorrencias: number;
    tendencia: 'alto' | 'medio' | 'baixo';
  }>;
  melhorMes: { mes: number; nome: string; media: number };
  piorMes: { mes: number; nome: string; media: number };
  amplitude: number;
}

export interface EstatisticasPorTrimestre {
  trimestres: Array<{
    trimestre: number;
    nome: string;
    media: number;
    total: number;
    participacao: number;
  }>;
  melhorTrimestre: number;
  piorTrimestre: number;
}

export interface AnaliseVolatilidade {
  nivel: 'muito_alta' | 'alta' | 'moderada' | 'baixa' | 'muito_baixa';
  coeficienteVariacao: number;
  beta?: number;
  risco: 'alto' | 'medio' | 'baixo';
  estabilidade: number; // 0-100
}

// ============================================================================
// PADRÕES IDENTIFICADOS
// ============================================================================

export interface PadraoSazonalidade {
  id: string;
  tipo: PadraoTipo;
  nome: string;
  descricao: string;
  confianca: number; // 0-100
  impacto: 'alto' | 'medio' | 'baixo';
  
  // Períodos afetados
  periodosIdentificados: string[];
  mesesAfetados: number[];
  
  // Magnitude
  variacaoMedia: number;
  variacaoMaxima: number;
  variacaoMinima: number;
  
  // Recorrência
  recorrente: boolean;
  frequencia?: 'anual' | 'semestral' | 'trimestral' | 'mensal';
  
  // Causas possíveis
  causasProvaveis: string[];
  
  // Recomendações
  recomendacoes: string[];
}

export type PadraoTipo =
  | 'peak'              // Pico de vendas
  | 'vale'              // Queda de vendas
  | 'tendencia_alta'    // Tendência crescente
  | 'tendencia_baixa'   // Tendência decrescente
  | 'ciclo'             // Padrão cíclico
  | 'sazonal'           // Sazonalidade clara
  | 'irregular'         // Comportamento irregular
  | 'estavel';          // Comportamento estável

// ============================================================================
// INSIGHTS AUTOMATIZADOS
// ============================================================================

export interface InsightSazonalidade {
  id: string;
  tipo: InsightTipo;
  categoria: InsightCategoria;
  titulo: string;
  descricao: string;
  
  // Dados de suporte
  periodoReferencia?: string[];
  valorImpacto?: number;
  variacaoPercentual?: number;
  
  // Prioridade e ação
  prioridade: 'alta' | 'media' | 'baixa';
  acaoRecomendada?: string;
  beneficioEstimado?: number;
  
  // Metadata
  confianca: number;
  geradoEm: Date;
}

export type InsightTipo = 
  | 'oportunidade'
  | 'risco'
  | 'tendencia'
  | 'anomalia'
  | 'informacao';

export type InsightCategoria =
  | 'receita'
  | 'custo'
  | 'margem'
  | 'sazonalidade'
  | 'crescimento'
  | 'eficiencia';

// ============================================================================
// PREVISIBILIDADE
// ============================================================================

export interface PrevisibilidadeData {
  indicePrevisibilidade: number; // 0-100
  classificacao: 'muito_previsivel' | 'previsivel' | 'moderado' | 'imprevisivel';
  
  receitaRecorrente: ReceitaRecorrente;
  estabilidade: EstabilidadeReceita;
  previsoes: PrevisaoReceita[];
  cenarios: CenariosPrevisao;
}

export interface ReceitaRecorrente {
  percentual: number;
  valor: number;
  receitaTotal: number;
  
  clientesRecorrentes: {
    quantidade: number;
    percentual: number;
    ticketMedio: number;
    frequenciaMedia: number;
  };
  
  clientesNovos: {
    quantidade: number;
    percentual: number;
    ticketMedio: number;
  };
  
  totalClientes: number;
  
  churn: {
    taxa: number;
    clientesPerdidos: number;
    impactoReceita: number;
  };
}

export interface EstabilidadeReceita {
  coeficienteVariacao: number;
  status: 'muito_estavel' | 'estavel' | 'moderado' | 'instavel' | 'muito_instavel';
  mediaMensal: number;
  desvioPadrao: number;
  
  fonteEstabilidade: {
    clientesRecorrentes: number;
    diversificacaoProdutos: number;
    diversificacaoCanais: number;
    score: number;
  };
}

export interface PrevisaoReceita {
  periodo: string;
  valorPrevisto: number;
  valorMinimo: number;
  valorMaximo: number;
  margemErro: number;
  confianca: number; // 0-100
  
  metodo: MetodoPrevisao;
  componentesSazonais: ComponenteSazonal[];
  
  premissas: string[];
  riscos: string[];
}

export type MetodoPrevisao =
  | 'media_movel'
  | 'media_movel_ponderada'
  | 'tendencia_linear'
  | 'regressao'
  | 'decomposicao_sazonal'
  | 'holt_winters'
  | 'ensemble';

export interface ComponenteSazonal {
  componente: 'tendencia' | 'sazonalidade' | 'ciclo' | 'irregular';
  valor: number;
  peso: number;
}

export interface CenariosPrevisao {
  otimista: CenarioPrevisao;
  realista: CenarioPrevisao;
  pessimista: CenarioPrevisao;
  
  probabilidades: {
    otimista: number;
    realista: number;
    pessimista: number;
  };
}

export interface CenarioPrevisao {
  nome: string;
  descricao: string;
  receita: number;
  lucro: number;
  margem: number;
  crescimento: number;
  premissas: string[];
}

// ============================================================================
// ANÁLISE DE TENDÊNCIAS
// ============================================================================

export interface AnaliseTendencia {
  direcao: 'crescente' | 'decrescente' | 'estavel' | 'volatil';
  intensidade: 'forte' | 'moderada' | 'fraca';
  confianca: number;
  
  taxaCrescimento: {
    mensal: number;
    trimestral: number;
    anual: number;
    cagr: number;
  };
  
  pontoInflexao?: {
    periodo: string;
    descricao: string;
    impacto: number;
  };
  
  projecao: {
    proximosMeses: Array<{
      periodo: string;
      valor: number;
    }>;
    anoCompleto: number;
  };
}

// ============================================================================
// COMPARAÇÕES TEMPORAIS
// ============================================================================

export interface ComparacaoTemporal {
  periodoAtual: PeriodoComparacao;
  periodoAnterior: PeriodoComparacao;
  
  variacoes: {
    absoluta: number;
    percentual: number;
    desvioPadrao: number;
  };
  
  significancia: 'muito_significativa' | 'significativa' | 'moderada' | 'baixa';
  interpretacao: string;
}

export interface PeriodoComparacao {
  inicio: Date;
  fim: Date;
  receita: number;
  custos: number;
  lucro: number;
  margem: number;
  vendas: number;
  ticketMedio: number;
}

// ============================================================================
// DECOMPOSIÇÃO SAZONAL
// ============================================================================

export interface DecomposicaoSazonal {
  metodo: 'aditivo' | 'multiplicativo';
  componentes: {
    tendencia: Array<{ periodo: string; valor: number }>;
    sazonalidade: Array<{ periodo: string; valor: number }>;
    ciclo: Array<{ periodo: string; valor: number }>;
    irregular: Array<{ periodo: string; valor: number }>;
  };
  indicesSazonais: {
    [mes: number]: number; // 1-12 -> índice
  };
  qualidadeDecomposicao: number; // 0-100
}

// ============================================================================
// ANÁLISE POR DIMENSÕES
// ============================================================================

export interface SazonalidadePorDimensao {
  porProduto: Map<string, SazonalidadeData>;
  porCategoria: Map<string, SazonalidadeData>;
  porVendedor: Map<string, SazonalidadeData>;
  porLoja: Map<string, SazonalidadeData>;
  porCanal: Map<string, SazonalidadeData>;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface SazonalidadeResponse {
  success: boolean;
  data?: SazonalidadeData;
  error?: string;
  timestamp: Date;
  cached: boolean;
}

export interface PrevisaoResponse {
  success: boolean;
  data?: PrevisaoReceita[];
  error?: string;
  timestamp: Date;
}

// ============================================================================
// PARÂMETROS
// ============================================================================

export interface SazonalidadeParams {
  dataInicio: Date;
  dataFim: Date;
  userId: string;
  granularidade?: 'mensal' | 'trimestral';
  dimensao?: 'geral' | 'produto' | 'vendedor' | 'loja' | 'canal';
  incluirPrevisao?: boolean;
  metodosPrevisao?: MetodoPrevisao[];
}



