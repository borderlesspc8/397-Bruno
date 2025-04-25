/**
 * Definições de tipos para a integração com o Gestão Click
 */

/**
 * Resposta genérica da API do Gestão Click com paginação
 */
export interface GestaoClickResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  metadata?: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
  };
}

/**
 * Interface para cliente do Gestão Click
 */
export interface GestaoClickCliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpfCnpj?: string;
  dataCadastro: string;
  observacoes?: string;
  cidade?: string;
  estado?: string;
  bairro?: string;
  endereco?: string;
  complemento?: string;
  cep?: string;
  tipo: 'PF' | 'PJ';
  situacao: 'ATIVO' | 'INATIVO';
  metadata?: Record<string, any>;
}

/**
 * Interface para situação de venda do Gestão Click
 */
export interface GestaoClickSituacaoVenda {
  id: number;
  descricao: string;
  cor?: string;
  ativo: boolean;
}

/**
 * Interface para venda do Gestão Click
 */
export interface GestaoClickVenda {
  id: number;
  numero: string;
  clienteId: number;
  clienteNome: string;
  data: string;
  valorTotal: number;
  valorDesconto?: number;
  valorLiquido: number;
  situacaoId: number;
  situacaoDescricao: string;
  observacoes?: string;
  formaPagamento?: string;
  parcelas?: number;
  itens?: GestaoClickVendaItem[];
  pagamentos?: GestaoClickVendaPagamento[];
  metadata?: Record<string, any>;
}

/**
 * Interface para item de venda do Gestão Click
 */
export interface GestaoClickVendaItem {
  id: number;
  vendaId: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  desconto?: number;
  valorLiquido: number;
}

/**
 * Interface para pagamento de venda do Gestão Click
 */
export interface GestaoClickVendaPagamento {
  id: number;
  vendaId: number;
  formaPagamento: string;
  valor: number;
  data: string;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  dataVencimento?: string;
  dataPagamento?: string;
}

/**
 * Interface para parâmetros de filtro de vendas
 */
export interface GestaoClickVendaFiltros {
  dataInicio?: string;
  dataFim?: string;
  clienteId?: number;
  situacaoId?: number;
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Interface para resultado de importação
 */
export interface GestaoClickImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
  errorDetails?: string[];
}

/**
 * Interface para dados de relatório cruzado
 */
export interface GestaoClickRelatorioCruzamento {
  periodo: {
    inicio: string;
    fim: string;
  };
  dadosCliente?: {
    cliente?: GestaoClickCliente;
    totalCompras: number;
    ticketMedio: number;
    ultimaCompra?: string;
    situacao: string;
  };
  dadosVendas: {
    totalVendas: number;
    valorTotalVendas: number;
    vendasPorSituacao: Record<string, number>;
    vendasPorMes: Record<string, number>;
    produtosMaisVendidos: Array<{
      produtoNome: string;
      quantidade: number;
      valorTotal: number;
    }>;
  };
  dadosFinanceiros: {
    totalRecebido: number;
    totalPendente: number;
    recebimentosPorMes: Record<string, number>;
    recebimentosPorFormaPagamento: Record<string, number>;
  };
} 