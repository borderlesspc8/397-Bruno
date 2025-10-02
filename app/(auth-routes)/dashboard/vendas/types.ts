// Tipos centralizados para a página de vendas

export interface VendaItem {
  id: string | number;
  valor_custo?: string | number;
  desconto_valor?: string | number;
  valor_frete?: string | number;
  valor_total?: string | number;
  nome_situacao?: string;
  data_venda?: string;
  cliente_id?: string;
  cliente_nome?: string;
  vendedor_id?: string;
  vendedor_nome?: string;
  produtos?: Array<{
    id: string;
    nome?: string;
    descricao?: string;
    quantidade: number;
    preco_unitario?: number;
    valor_unitario?: number;
    total: number;
  }>;
  [key: string]: unknown;
}

export interface Meta {
  id: string;
  mesReferencia: Date;
  metaMensal: number;
  metaSalvio: number;
  metaCoordenador: number;
  metasVendedores: Array<{
    vendedorId: string;
    meta: number;
  }>;
}

export interface RespostaAPI {
  id: string;
  nome: string;
  vendas: number;
  valor: number;
}


