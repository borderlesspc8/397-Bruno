export interface DateRange {
  from: Date;
  to?: Date;
}

export interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
}

export interface VendedorPerformance {
  id: string;
  nome: string;
  totalVendas: number;
  valorTotal: number;
  ticketMedio: number;
}

export interface DashboardData {
  totalReceita: number;
  totalVendas: number;
  ticketMedio: number;
  vendedores: VendedorPerformance[];
  vendasDetalhadas: {
    id: string;
    dataVenda: string;
    valor: number;
    vendedor: {
      id: string;
      nome: string;
    };
    produtos: Produto[];
  }[];
} 