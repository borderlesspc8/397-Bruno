/**
 * 📊 CEO DASHBOARD - DRE TYPES
 * 
 * Types específicos para Demonstração do Resultado do Exercício
 */

// ============================================================================
// DRE COMPLETA
// ============================================================================

export interface DRECompleta {
  periodo: string;
  tipo: 'mensal' | 'trimestral' | 'anual';
  
  // 1. Receita Bruta
  receitaBruta: number;
  
  // 2. Deduções da Receita
  impostos: DREImpostos;
  descontosAbatimentos: number;
  devolucoes: number;
  totalDeducoes: number;
  
  // 3. Receita Líquida
  receitaLiquida: number;
  
  // 4. Custos Diretos (CMV)
  cmv: DRECMV;
  
  // 5. Margem Bruta
  margemBruta: number;
  margemBrutaPercent: number;
  
  // 6. Despesas Operacionais
  despesasOperacionais: DREDespesasOperacionais;
  
  // 7. Lucro Operacional (EBITDA/EBIT)
  ebitda: number;
  ebitdaPercent: number;
  depreciacaoAmortizacao: number;
  ebit: number;
  ebitPercent: number;
  
  // 8. Resultado Financeiro
  resultadoFinanceiro: DREResultadoFinanceiro;
  
  // 9. Lucro Antes dos Impostos
  lucroAntesImpostos: number;
  lucroAntesImpostosPercent: number;
  
  // 10. Impostos sobre Lucro
  impostosLucro: number;
  
  // 11. Lucro Líquido
  lucroLiquido: number;
  lucroLiquidoPercent: number;
  
  // Metadata
  metadata: DREMetadata;
}

// ============================================================================
// COMPONENTES DA DRE
// ============================================================================

export interface DREImpostos {
  simplesNacional?: number;
  icms?: number;
  pis?: number;
  cofins?: number;
  iss?: number;
  outros?: number;
  total: number;
  aliquotaEfetiva: number;
}

export interface DRECMV {
  custoProdutos: number;
  custoServicos: number;
  fretes: number;
  embalagens: number;
  outros: number;
  total: number;
  percentualReceita: number;
}

export interface DREDespesasOperacionais {
  vendas: DREDespesasVendas;
  administrativas: DREDespesasAdministrativas;
  pessoal: DREDespesasPessoal;
  total: number;
  percentualReceita: number;
}

export interface DREDespesasVendas {
  comissoes: number;
  marketing: number;
  publicidade: number;
  promocoes: number;
  fretesEntrega: number;
  outros: number;
  total: number;
}

export interface DREDespesasAdministrativas {
  aluguel: number;
  contas: number; // água, luz, internet
  materiais: number;
  servicos: number;
  manutencao: number;
  seguros: number;
  taxas: number;
  outros: number;
  total: number;
}

export interface DREDespesasPessoal {
  salarios: number;
  encargos: number;
  beneficios: number;
  treinamento: number;
  outros: number;
  total: number;
}

export interface DREResultadoFinanceiro {
  receitasFinanceiras: {
    jurosRecebidos: number;
    descontosObtidos: number;
    rendimentosAplicacoes: number;
    outros: number;
    total: number;
  };
  despesasFinanceiras: {
    jurosPagos: number;
    tarifasBancarias: number;
    iof: number;
    multasJuros: number;
    descontosConcedidos: number;
    outros: number;
    total: number;
  };
  saldo: number;
  percentualReceita: number;
}

export interface DREMetadata {
  dataInicio: Date;
  dataFim: Date;
  diasPeriodo: number;
  moeda: string;
  metodoCalculo: 'competencia' | 'caixa';
  observacoes?: string[];
  alertas?: string[];
}

// ============================================================================
// DRE CASCATA (WATERFALL)
// ============================================================================

export interface DRECascata {
  items: DRECascataItem[];
  receitaBrutaInicial: number;
  lucroLiquidoFinal: number;
}

export interface DRECascataItem {
  id: string;
  nome: string;
  categoria: DRECascataCategoria;
  valor: number;
  tipo: 'positivo' | 'negativo' | 'subtotal' | 'total';
  percentualReceita: number;
  acumulado: number;
  ordem: number;
  detalhes?: DRECascataDetalhe[];
}

export type DRECascataCategoria =
  | 'receita'
  | 'deducao'
  | 'custo'
  | 'despesa_vendas'
  | 'despesa_admin'
  | 'despesa_pessoal'
  | 'resultado_financeiro'
  | 'imposto'
  | 'lucro';

export interface DRECascataDetalhe {
  nome: string;
  valor: number;
  percentual: number;
}

// ============================================================================
// DRE COMPARATIVA
// ============================================================================

export interface DREComparativa {
  periodos: string[];
  linhas: DRELinhaComparativa[];
}

export interface DRELinhaComparativa {
  id: string;
  nome: string;
  categoria: DRECascataCategoria;
  nivel: number; // 1 = principal, 2 = subcategoria, 3 = detalhe
  valores: number[];
  percentuais: number[];
  variacoes: DREVariacao[];
  tendencia: 'alta' | 'baixa' | 'estavel';
}

export interface DREVariacao {
  periodoAtual: string;
  periodoAnterior: string;
  variacaoAbsoluta: number;
  variacaoPercentual: number;
  significancia: 'alta' | 'media' | 'baixa';
}

// ============================================================================
// DRE ANUAL
// ============================================================================

export interface DREAnual {
  ano: number;
  trimestres: DRECompleta[];
  meses: DRECompleta[];
  consolidado: DRECompleta;
  analiseVertical: DREAnaliseVertical;
  analiseHorizontal: DREAnaliseHorizontal;
}

export interface DREAnaliseVertical {
  periodo: string;
  linhas: Array<{
    conta: string;
    valor: number;
    percentualReceita: number;
    status: 'dentro' | 'acima' | 'abaixo';
  }>;
}

export interface DREAnaliseHorizontal {
  conta: string;
  periodos: Array<{
    periodo: string;
    valor: number;
    variacaoPercentual?: number;
  }>;
  tendencia: 'crescente' | 'decrescente' | 'estavel';
  CAGR?: number;
}

// ============================================================================
// INDICADORES DERIVADOS DA DRE
// ============================================================================

export interface IndicadoresDRE {
  rentabilidade: IndicadoresRentabilidade;
  eficiencia: IndicadoresEficienciaDRE;
  composicao: IndicadoresComposicaoDRE;
}

export interface IndicadoresRentabilidade {
  margemBruta: number;
  margemOperacional: number;
  margemEBITDA: number;
  margemEBIT: number;
  margemLiquida: number;
  roe?: number; // Return on Equity
  roa?: number; // Return on Assets
}

export interface IndicadoresEficienciaDRE {
  custoVendaPercent: number;
  despesasOperacionaisPercent: number;
  despesasVendasPercent: number;
  despesasAdminPercent: number;
  despesasPessoalPercent: number;
  cargaTributaria: number;
}

export interface IndicadoresComposicaoDRE {
  participacaoCMV: number;
  participacaoDespesasOp: number;
  participacaoResultadoFinanc: number;
  alavancagemOperacional: number;
}

// ============================================================================
// CONFIGURAÇÕES E PARÂMETROS
// ============================================================================

export interface DREConfig {
  regimeTributario: 'simples' | 'lucro_presumido' | 'lucro_real';
  aliquotaSimplesNacional?: number;
  categoriasCustomizadas?: CategoriaDRECustomizada[];
  metodoCalculo: 'competencia' | 'caixa';
}

export interface CategoriaDRECustomizada {
  id: string;
  nome: string;
  tipo: 'receita' | 'custo' | 'despesa';
  categoria: string;
  subcategoria?: string;
  keywords?: string[];
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface DREResponse {
  success: boolean;
  data?: DRECompleta | DREComparativa | DREAnual;
  error?: string;
  timestamp: Date;
}

export interface DRECalculoParams {
  dataInicio: Date;
  dataFim: Date;
  userId: string;
  tipo: 'mensal' | 'trimestral' | 'anual';
  config?: DREConfig;
  // ✅ DADOS REAIS DAS APIS
  vendas?: any[];
  pagamentos?: any[];
  recebimentos?: any[];
  centrosCustos?: any[];
  contasBancarias?: any[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ContaDRE =
  | 'receita_bruta'
  | 'impostos'
  | 'receita_liquida'
  | 'cmv'
  | 'margem_bruta'
  | 'despesas_operacionais'
  | 'ebitda'
  | 'ebit'
  | 'resultado_financeiro'
  | 'lucro_liquido';

export interface MapeamentoContaDRE {
  contaDRE: ContaDRE;
  campoVenda: string;
  formula?: string;
  tipo: 'valor' | 'percentual' | 'calculado';
}

