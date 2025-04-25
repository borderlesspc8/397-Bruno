// Tipos para indicadores de consultores Personal Prime

// Interface principal para um consultor
export interface Consultor {
  id: string;
  nome: string;
}

// Indicadores básicos
export interface IndicadoresBasicos {
  atendimentosRealizados: number;
  vendasRealizadas: number;
  taxaConversao: number; // em decimal (0.25 = 25%)
  faturamento: number;
  ticketMedio: number;
}

// Indicadores de tempo e eficiência
export interface IndicadoresTempo {
  tempoMedioFechamento: number; // em dias
  followUpsRealizados: number;
  tempoMedioResposta: number; // em minutos
}

// Indicadores de produtos
export interface ProdutoMargem {
  id: string;
  nome: string;
  quantidade: number;
  margem: number;
}

export interface CategoriaVendida {
  categoria: string;
  quantidade: number;
  percentual: number;
}

export interface IndicadoresProdutos {
  quantidadeProdutosVendidos: number;
  produtosMaiorMargem: ProdutoMargem[];
  categoriasMaisVendidas: CategoriaVendida[];
  giroProdutos: number; // em %
}

// Indicadores de metas e performance
export interface IndicadoresMetas {
  metaMensal: number;
  metaRealizado: number; // em %
  bonificacaoEstimada: number;
  posicaoRanking: number;
}

// Indicadores de clientes
export interface IndicadoresClientes {
  clientesRecompra: number;
  taxaAbandono: number; // em decimal
}

// Indicadores financeiros
export interface FormaPagamento {
  forma: string;
  quantidade: number;
  valor: number;
  percentual: number;
}

export interface IndicadoresFinanceiros {
  inadimplencia: number;
  formasPagamento: FormaPagamento[];
  descontosAplicados: number;
}

// Indicadores de origem
export interface OrigemLead {
  origem: string;
  quantidade: number;
  conversao: number;
  percentual: number;
}

export interface IndicadoresOrigens {
  origensLeadsMaisEficientes: OrigemLead[];
}

// Indicadores de variação
export interface IndicadoresVariacao {
  variacaoMesAnterior: number; // em decimal
  variacaoAnoAnterior: number; // em decimal
}

// Interface completa de indicadores de um consultor
export interface ConsultorIndicadores extends 
  Consultor, 
  IndicadoresBasicos, 
  IndicadoresTempo, 
  IndicadoresProdutos, 
  IndicadoresMetas, 
  IndicadoresClientes, 
  IndicadoresFinanceiros, 
  IndicadoresOrigens,
  IndicadoresVariacao {}

// Interfaces para respostas da API
export interface ConsultoresResponse {
  consultores: ConsultorIndicadores[];
  periodoInicio: string;
  periodoFim: string;
  totalConsultores: number;
  metaMediaRealizada: number;
  taxaMediaConversao: number;
}

// Histórico de vendas
export interface HistoricoVendas {
  periodo: string;
  data: string; // ISO format
  consultores: Array<{
    id: string;
    nome: string;
    vendas: number;
    faturamento: number;
    atendimentos: number;
    conversao: number;
  }>;
}

export interface ComparativoPeriodos {
  atual: {
    inicio: string;
    fim: string;
    faturamentoTotal: number;
    vendasTotal: number;
  };
  anterior: {
    inicio: string;
    fim: string;
    faturamentoTotal: number;
    vendasTotal: number;
  };
  variacao: {
    faturamento: number; // percentual em decimal
    vendas: number; // percentual em decimal
  };
  porConsultor: Array<{
    id: string;
    nome: string;
    atual: {
      faturamento: number;
      vendas: number;
    };
    anterior: {
      faturamento: number;
      vendas: number;
    };
    variacao: {
      faturamento: number; // percentual em decimal
      vendas: number; // percentual em decimal
    };
  }>;
}

export interface HistoricoResponse {
  historico: HistoricoVendas[];
  comparativo: ComparativoPeriodos;
  totalVendas: number;
  faturamentoTotal: number;
  ticketMedio: number;
}

// Produtos
export interface ProdutoVendido {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  custo: number;
  margem: number;
  margemPercentual: number;
  quantidade: number;
  totalVendido: number;
}

export interface ConsultorProdutos {
  id: string;
  nome: string;
  totalProdutosVendidos: number;
  faturamentoTotal: number;
  custoTotal: number;
  margemTotal: number;
  margemMediaPercentual: number;
  produtos: ProdutoVendido[];
}

export interface CategoriaAnalise {
  categoria: string;
  quantidade: number;
  percentual: number;
  faturamento: number;
  margem: number;
  giro: number;
}

export interface ProdutosResponse {
  consultores: ConsultorProdutos[];
  categorias: CategoriaAnalise[];
  periodoInicio: string;
  periodoFim: string;
  totalProdutos: number;
  produtoMaisVendido: string;
  mediaProdutosPorVenda: number;
}

// Clientes
export interface ClienteDetalhes {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  dataUltimaCompra: string; // ISO format
  dataUltimoContato: string; // ISO format
  statusAtual: 'Ativo' | 'Inativo' | 'Lead' | 'Fechado' | 'Inadimplente';
  valorCompras: number;
  comprasRealizadas: number;
  ticketMedio: number;
  inadimplencia: number;
  formasPagamentoUtilizadas: string[];
  produtos: Array<{
    id: string;
    nome: string;
    categoria: string;
    dataCompra: string;
    valor: number;
    desconto: number;
    statusPagamento: 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado';
  }>;
}

export interface ConsultorClientes {
  id: string;
  nome: string;
  totalClientes: number;
  clientesAtivos: number;
  taxaRetencao: number;
  clientesInadimplentes: number;
  taxaInadimplencia: number;
  valorInadimplencia: number;
  clientesRecompra: number;
  taxaRecompra: number;
  clientes: ClienteDetalhes[];
}

export interface SegmentacaoClientes {
  segmento: string;
  quantidade: number;
  percentual: number;
  valorTotal: number;
  descricao: string;
}

export interface ClientesResponse {
  consultores: ConsultorClientes[];
  segmentacao: SegmentacaoClientes[];
  periodoInicio: string;
  periodoFim: string;
  totalClientes: number;
  novosClientes: number;
  taxaRetencao: number;
} 