import { api } from '@/app/_lib/api';

export interface ItemVenda {
  id: number;
  produto_id: number;
  produto: string;
  categoria?: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
}

export interface Venda {
  id: number;
  cliente?: string;
  cliente_id?: number;
  valor_total: string;
  data_inclusao?: string;
  vendedor_id?: string;
  vendedor_nome?: string;
  itens?: ItemVenda[];
}

export interface VendasResponse {
  vendas: Venda[];
  totalVendas: number;
  totalValor: number;
  erro?: string;
  mensagem?: string;
}

export class VendasService {
  static async buscarVendasExternas(params: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<VendasResponse> {
    try {
      const { data } = await api.get<VendasResponse>('/api/dashboard/vendas/externos', {
        params: {
          dataInicio: params.dataInicio.toISOString(),
          dataFim: params.dataFim.toISOString(),
        },
      });

      return data;
    } catch (error) {
      console.error('Erro ao buscar vendas externas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar vendas externas';
      return {
        vendas: [],
        totalVendas: 0,
        totalValor: 0,
        erro: errorMessage
      };
    }
  }

  static async buscarVendasPorVendedor(params: {
    dataInicio: Date;
    dataFim: Date;
    vendedorId: string;
  }): Promise<VendasResponse> {
    try {
      const { data } = await api.get<VendasResponse>('/api/dashboard/vendas/vendedor', {
        params: {
          dataInicio: params.dataInicio.toISOString(),
          dataFim: params.dataFim.toISOString(),
          vendedorId: params.vendedorId,
        },
      });

      return data;
    } catch (error) {
      console.error('Erro ao buscar vendas do vendedor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar vendas do vendedor';
      return {
        vendas: [],
        totalVendas: 0,
        totalValor: 0,
        erro: errorMessage
      };
    }
  }

  static async buscarVendasPorProduto(params: {
    dataInicio: Date;
    dataFim: Date;
    produtoId: string;
  }): Promise<VendasResponse> {
    try {
      console.log('Chamando API para produto ID:', params.produtoId);
      
      const { data } = await api.get<VendasResponse>('/api/dashboard/vendas/produto', {
        params: {
          dataInicio: params.dataInicio.toISOString(),
          dataFim: params.dataFim.toISOString(),
          produtoId: params.produtoId
        },
      });
      
      console.log('Resposta da API:', data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar vendas por produto:', error);
      return { 
        vendas: [], 
        totalVendas: 0,
        totalValor: 0,
        erro: error instanceof Error ? error.message : 'Erro ao buscar vendas por produto' 
      };
    }
  }
}
