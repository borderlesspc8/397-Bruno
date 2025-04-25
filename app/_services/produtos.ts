import { api } from '@/app/_lib/api';

export interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  categoria?: string;
}

export interface ProdutosResponse {
  produtos: Produto[];
  totalProdutos: number;
  totalVendas: number;
  totalFaturamento: number;
  erro?: string;
  mensagem?: string;
}

export class ProdutosService {
  static async buscarProdutosVendidos(params: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<ProdutosResponse> {
    try {
      const { data } = await api.get<ProdutosResponse>('/api/dashboard/produtos', {
        params: {
          dataInicio: params.dataInicio.toISOString(),
          dataFim: params.dataFim.toISOString(),
        },
      });

      return data;
    } catch (error) {
      console.error('Erro ao buscar produtos vendidos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar produtos vendidos';
      return {
        produtos: [],
        totalProdutos: 0,
        totalVendas: 0,
        totalFaturamento: 0,
        erro: errorMessage
      };
    }
  }

  static async buscarProdutosExternos(params: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<ProdutosResponse> {
    try {
      const { data } = await api.get<ProdutosResponse>('/api/dashboard/produtos/externos', {
        params: {
          dataInicio: params.dataInicio.toISOString(),
          dataFim: params.dataFim.toISOString(),
        },
      });

      return data;
    } catch (error) {
      console.error('Erro ao buscar produtos externos:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar produtos externos';
      return {
        produtos: [],
        totalProdutos: 0,
        totalVendas: 0,
        totalFaturamento: 0,
        erro: errorMessage
      };
    }
  }

  /**
   * Busca os produtos mais vendidos no período especificado
   * @param params Parâmetros de busca (dataInicio, dataFim)
   * @returns Lista de produtos mais vendidos com dados de faturamento e margem
   */
  static async buscarProdutosMaisVendidos(params: { dataInicio: Date; dataFim: Date }) {
    try {
      const { dataInicio, dataFim } = params;
      
      // Formatar datas no formato YYYY-MM-DD
      const dataInicioFormatada = dataInicio.toISOString().split('T')[0];
      const dataFimFormatada = dataFim.toISOString().split('T')[0];
      
      // Usando o cliente API para requisições internas
      const { data } = await api.get('/api/dashboard/produtos/mais-vendidos', {
        params: {
          dataInicio: dataInicioFormatada,
          dataFim: dataFimFormatada
        }
      });
      
      return data;
    } catch (error) {
      console.error("Erro ao buscar produtos mais vendidos:", error);
      return {
        erro: error instanceof Error ? error.message : "Erro ao buscar produtos mais vendidos",
        produtos: []
      };
    }
  }
}