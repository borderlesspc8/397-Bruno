/**
 * Interfaces para integração com o Gestão Click
 * Arquivo centralizado para definição de tipos relacionados ao Gestão Click
 */

// Interfaces existentes que foram migradas para este arquivo para centralização

export interface GestaoClickConfig {
  apiUrl: string;
  accessToken: string;
  secretAccessToken: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface GestaoClickImportOptions {
  startDate: string;   // Data de início no formato YYYY-MM-DD
  endDate: string;     // Data de fim no formato YYYY-MM-DD
  userId: string;      // ID do usuário
  walletId?: string;   // ID da carteira
  includeCategories?: boolean; // Importar categorias também?
}

// Novas interfaces para Clientes

/**
 * Interface para cliente importado do Gestão Click
 */
export interface GestaoClickCliente {
  id: string;
  codigo: string;
  nome: string;
  tipo_pessoa: string; // PF ou PJ
  cpf: string;
  cnpj: string;
  email: string;
  telefone: string;
  celular?: string;
  ativo: string; // "0" ou "1"
  rg?: string;
  data_nascimento?: string;
  razao_social?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  fax?: string;
  endereco?: {
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Interface para resposta genérica da API Gestão Click
 */
export interface GestaoClickResponse<T> {
  data: T[];
  meta: {
    total: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    // Campos legados para compatibilidade
    total_registros?: number;
    pagina_atual?: number;
    total_paginas?: number;
    registros_por_pagina?: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  code?: number;
  status?: string;
}

// Interfaces para Situações de Vendas

/**
 * Interface para situação de venda do Gestão Click
 */
export interface GestaoClickSituacaoVenda {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  padrao: string; // "0" ou "1"
  metadata?: Record<string, any>;
}

// Interfaces para Vendas

/**
 * Interface para pagamento de uma venda do Gestão Click
 */
export interface GestaoClickPagamento {
  data_vencimento: string;
  valor: string;
  forma_pagamento_id: string;
  nome_forma_pagamento: string;
  plano_contas_id: string;
  nome_plano_conta: string;
  observacao: string;
}

/**
 * Interface para produto de uma venda do Gestão Click
 */
export interface GestaoClickProduto {
  produto_id: number;
  variacao_id: number;
  nome_produto: string | null;
  detalhes: string;
  movimenta_estoque: string;
  possui_variacao: string;
  sigla_unidade: string | null;
  quantidade: string;
  tipo_valor_id: string | null;
  nome_tipo_valor: string | null;
  valor_custo: string;
  valor_venda: string;
  tipo_desconto: string;
  desconto_valor: string | null;
  desconto_porcentagem: string | null;
  valor_total: string;
}

/**
 * Interface para serviço de uma venda do Gestão Click
 */
export interface GestaoClickServico {
  id: string;
  servico_id: string;
  nome_servico: string;
  detalhes: string;
  sigla_unidade: string | null;
  quantidade: string;
  tipo_valor_id: string | null;
  nome_tipo_valor: string | null;
  valor_custo: string;
  valor_venda: string;
  tipo_desconto: string;
  desconto_valor: string | null;
  desconto_porcentagem: string;
  valor_total: string;
}

/**
 * Interface para equipamento de uma venda do Gestão Click
 */
export interface GestaoClickEquipamento {
  // Definir campos quando necessário
}

/**
 * Interface para venda completa do Gestão Click
 */
export interface GestaoClickVenda {
  id: string;
  codigo: string;
  data: string;
  cliente_id: string;
  valor_total: string; // API retorna como string
  situacao_id: string;
  nome_situacao: string;
  vendedor_id: string;
  nome_vendedor: string;
  tecnico_id?: string;
  nome_tecnico?: string;
  transportadora_id?: string;
  nome_transportadora?: string;
  centro_custo_id?: string;
  nome_centro_custo?: string;
  nome_cliente: string;
  aos_cuidados_de?: string;
  validade?: string;
  introducao?: string;
  observacoes?: string;
  observacoes_interna?: string;
  valor_frete?: string;
  nome_canal_venda?: string;
  nome_loja?: string;
  valor_custo?: string;
  condicao_pagamento?: string;
  situacao_financeiro?: string;
  situacao_estoque?: string;
  forma_pagamento_id?: string;
  data_primeira_parcela?: string;
  numero_parcelas?: string;
  intervalo_dias?: string;
  hash?: string;
  previsao_entrega?: string;
  formaPagamento?: string;
  parcelas?: number;
  
  // Arrays de produtos, serviços e pagamentos
  produtos?: Array<GestaoClickProduto | any>;
  servicos?: Array<GestaoClickServico | any>;
  pagamentos?: Array<GestaoClickPagamento | any>;
  
  itens: Array<{
    id: string;
    produto_id: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Interface para filtros de vendas do Gestão Click
 */
export interface GestaoClickVendaFiltros {
  data_inicio?: string;
  data_fim?: string;
  cliente_id?: string;
  situacao_id?: string;
  centro_custo_id?: string;
  loja_id?: string;
  codigo?: string;
  nome?: string;
}

/**
 * Interface para resultados de importação
 */
export interface GestaoClickImportResult {
  totalProcessed: number;
  imported: number;
  skipped: number;
  errors: number;
  startDate: string;
  endDate: string;
  details?: Array<{
    id: string;
    nome?: string;
    codigo?: string;
    cliente?: string;
    tipo?: string;
    valor?: number | string;
    padrao?: string;
    status: 'imported' | 'error' | 'skipped';
    error?: string;
  }>;
} 