/**
 * 💰 CEO DASHBOARD - INDICADORES FINANCEIROS TYPES
 * 
 * Types para indicadores financeiros e análises
 */

// ============================================================================
// LIQUIDEZ
// ============================================================================

export interface IndicadoresLiquidez {
  liquidezCorrente: LiquidezCorrente;
  liquidezSeca: LiquidezSeca;
  liquidezImediata: LiquidezImediata;
  cicloConversao: CicloConversaoCaixa;
  coberturaDespesas: CoberturaDespesas;
}

export interface LiquidezCorrente {
  indice: number;
  ativosCirculantes: number;
  passivosCirculantes: number;
  status: StatusLiquidez;
  tendencia: 'melhorando' | 'estavel' | 'piorando';
  historico: Array<{ periodo: string; indice: number }>;
  interpretacao: string;
}

export interface LiquidezSeca {
  indice: number;
  ativosCirculantesSemEstoque: number;
  passivosCirculantes: number;
  status: StatusLiquidez;
}

export interface LiquidezImediata {
  indice: number;
  disponibilidadeImediata: number;
  passivosCirculantes: number;
  status: StatusLiquidez;
}

export type StatusLiquidez = 
  | 'excelente'   // > 2.0
  | 'bom'         // 1.5 - 2.0
  | 'adequado'    // 1.0 - 1.5
  | 'atencao'     // 0.5 - 1.0
  | 'critico';    // < 0.5

// ============================================================================
// CICLO DE CONVERSÃO DE CAIXA
// ============================================================================

export interface CicloConversaoCaixa {
  diasCiclo: number;
  pmr: PrazoMedioRecebimento;
  pmp: PrazoMedioPagamento;
  pme: PrazoMedioEstoque;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  tendencia: 'melhorando' | 'estavel' | 'piorando';
  historico: Array<{ periodo: string; dias: number }>;
}

export interface PrazoMedioRecebimento {
  dias: number;
  contasReceber: number;
  vendasMediaDiaria: number;
  detalhamento: {
    ate30dias: { valor: number; percentual: number };
    de31a60dias: { valor: number; percentual: number };
    de61a90dias: { valor: number; percentual: number };
    acima90dias: { valor: number; percentual: number };
  };
}

export interface PrazoMedioPagamento {
  dias: number;
  contasPagar: number;
  comprasMediaDiaria: number;
  detalhamento: {
    vencidoAtraso: { valor: number; percentual: number };
    venceHoje: { valor: number; percentual: number };
    ate30dias: { valor: number; percentual: number };
    acima30dias: { valor: number; percentual: number };
  };
}

export interface PrazoMedioEstoque {
  dias: number;
  estoqueAtual: number;
  custoVendasMedioDiario: number;
  giro: number;
}

// ============================================================================
// COBERTURA DE DESPESAS
// ============================================================================

export interface CoberturaDespesas {
  mesesCobertura: number;
  reservasDisponiveis: number;
  despesasFixasMensais: number;
  despesasVariaveisMedias: number;
  totalDespesasMensais: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  projecao: Array<{ mes: string; saldoProjetado: number }>;
  detalhamentoDespesas: DetalhamentoDespesas;
}

export interface DetalhamentoDespesas {
  fixas: DespesaCategoria[];
  variaveis: DespesaCategoria[];
  totalFixas: number;
  totalVariaveis: number;
  proporcaoFixasVariaveis: {
    fixasPercent: number;
    variaveisPercent: number;
  };
}

export interface DespesaCategoria {
  categoria: string;
  valor: number;
  percentual: number;
  tipo: 'fixa' | 'variavel';
  subcategorias?: Array<{
    nome: string;
    valor: number;
  }>;
}

// ============================================================================
// INADIMPLÊNCIA
// ============================================================================

export interface IndicadoresInadimplencia {
  taxaInadimplencia: TaxaInadimplencia;
  aging: AgingRecebiveis;
  provisaoDevedoresDuvidosos: ProvisaoDevedores;
  recuperacao: IndicadoresRecuperacao;
  topInadimplentes: ClienteInadimplente[];
}

export interface TaxaInadimplencia {
  percentual: number;
  valorTotal: number;
  valorVencido: number;
  valorAVencer: number;
  quantidadeVendasVencidas: number;
  quantidadeVendasTotais: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  tendencia: 'melhorando' | 'estavel' | 'piorando';
  historico: Array<{ periodo: string; percentual: number }>;
  metaInadimplencia?: number;
}

export interface AgingRecebiveis {
  total: number;
  faixas: AgingFaixa[];
  distribuicao: {
    ate30dias: number;
    de31a60dias: number;
    de61a90dias: number;
    acima90dias: number;
  };
  percentualPorFaixa: {
    ate30dias: number;
    de31a60dias: number;
    de61a90dias: number;
    acima90dias: number;
  };
}

export interface AgingFaixa {
  faixa: string;
  dias: { min: number; max: number | null };
  quantidade: number;
  valor: number;
  percentual: number;
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
}

export interface ProvisaoDevedores {
  valorProvisionado: number;
  percentualSobreRecebiveis: number;
  metodologia: string;
  impactoNoLucro: number;
}

export interface IndicadoresRecuperacao {
  taxaRecuperacao: number;
  valorRecuperado: number;
  valorIrrecuperavel: number;
  tempoMedioRecuperacao: number;
  esforcoCobranca: {
    tentativas: number;
    custoEstimado: number;
    efetividade: number;
  };
}

export interface ClienteInadimplente {
  clienteId: string;
  clienteNome: string;
  cpfCnpj?: string;
  valorDevedor: number;
  quantidadeVendas: number;
  diasAtrasoMedio: number;
  diasAtrasoMaximo: number;
  ultimaCompra: Date;
  primeiraCompra: Date;
  vendas: VendaInadimplente[];
  historicoPagamentos: 'bom' | 'regular' | 'ruim';
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
  acoes: AcaoCobranca[];
}

export interface VendaInadimplente {
  vendaId: string;
  dataVenda: Date;
  dataVencimento: Date;
  valor: number;
  diasAtraso: number;
  status: string;
  tentativasCobranca: number;
}

export interface AcaoCobranca {
  tipo: 'email' | 'telefone' | 'whatsapp' | 'carta' | 'judicial';
  data: Date;
  status: 'pendente' | 'realizada' | 'sem_sucesso';
  observacao?: string;
}

// ============================================================================
// EFICIÊNCIA OPERACIONAL
// ============================================================================

export interface IndicadoresEficiencia {
  relacaoCustosReceita: RelacaoCustosReceita;
  cac: CustoAquisicaoCliente;
  ltv: LifetimeValue;
  rentabilidadePorDimensao: RentabilidadePorDimensao;
  produtividade: IndicadoresProdutividade;
}

export interface RelacaoCustosReceita {
  percentual: number;
  custoTotal: number;
  receitaTotal: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  tendencia: 'melhorando' | 'estavel' | 'piorando';
  breakdown: {
    custosDiretos: number;
    custosIndiretos: number;
    custosFixos: number;
    custosVariaveis: number;
  };
  historico: Array<{ periodo: string; percentual: number }>;
}

export interface CustoAquisicaoCliente {
  valor: number;
  custosMarketing: number;
  custosVendas: number;
  clientesNovos: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
  porCanal: Array<{
    canal: string;
    cac: number;
    clientesAdquiridos: number;
  }>;
}

export interface LifetimeValue {
  valor: number;
  ticketMedio: number;
  frequenciaCompra: number;
  tempoVidaMedio: number;
  margemContribuicao: number;
  ratioLTVCAC: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
}

export interface RentabilidadePorDimensao {
  porCentroCusto: RentabilidadeItem[];
  porVendedor: RentabilidadeItem[];
  porLoja: RentabilidadeItem[];
  porProduto: RentabilidadeItem[];
  porCanal: RentabilidadeItem[];
}

export interface RentabilidadeItem {
  id: string;
  nome: string;
  receita: number;
  custos: number;
  despesas: number;
  lucro: number;
  margem: number;
  participacao: number;
  roi: number;
  status: 'lucrativo' | 'equilibrio' | 'prejuizo';
  tendencia: 'melhorando' | 'estavel' | 'piorando';
}

export interface IndicadoresProdutividade {
  receitaPorFuncionario: number;
  lucroPorFuncionario: number;
  vendasPorVendedor: number;
  ticketMedioPorVendedor: number;
  eficienciaOperacional: number;
}

// ============================================================================
// SUSTENTABILIDADE FINANCEIRA
// ============================================================================

export interface IndicadoresSustentabilidade {
  solvencia: IndicadoresSolvencia;
  endividamento: IndicadoresEndividamento;
  capacidadePagamento: CapacidadePagamento;
  sustentabilidadeOperacional: SustentabilidadeOperacional;
}

export interface IndicadoresSolvencia {
  patrimonioLiquido: number;
  ativoTotal: number;
  passivoTotal: number;
  indiceSolvencia: number;
  status: 'saudavel' | 'atencao' | 'critico';
}

export interface IndicadoresEndividamento {
  endividamentoGeral: number;
  endividamentoCP: number; // Curto Prazo
  endividamentoLP: number; // Longo Prazo
  composicaoEndividamento: number;
  garantiaCapitalTerceiros: number;
  status: 'saudavel' | 'atencao' | 'critico';
}

export interface CapacidadePagamento {
  coberturaDividas: number;
  coberturaJuros: number;
  fluxoCaixaOperacional: number;
  servicoDivida: number;
  status: 'excelente' | 'bom' | 'atencao' | 'critico';
}

export interface SustentabilidadeOperacional {
  pontoEquilibrio: number;
  margemSeguranca: number;
  alavancagemOperacional: number;
  capacidadeAutofinanciamento: number;
  status: 'sustentavel' | 'atencao' | 'insustentavel';
}

// ============================================================================
// ANÁLISE DE CAPITAL DE GIRO
// ============================================================================

export interface AnaliseCapitalGiro {
  capitalGiroLiquido: number;
  necessidadeCapitalGiro: number;
  saldoTesouraria: number;
  cicloFinanceiro: number;
  status: 'saudavel' | 'atencao' | 'critico';
  recomendacoes: string[];
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface IndicadoresFinanceirosResponse {
  success: boolean;
  data?: {
    liquidez: IndicadoresLiquidez;
    inadimplencia: IndicadoresInadimplencia;
    eficiencia: IndicadoresEficiencia;
    sustentabilidade: IndicadoresSustentabilidade;
    capitalGiro: AnaliseCapitalGiro;
  };
  error?: string;
  timestamp: Date;
  cached: boolean;
}



