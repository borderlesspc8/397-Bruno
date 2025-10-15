import { api } from '@/app/_lib/api';
import { Vendedor } from './betelTecnologia';

export interface VendedoresResponse {
  vendedores: Vendedor[];
  totalVendedores: number;
  totalVendas: number;
  totalFaturamento: number;
  erro?: string;
}

export class VendedoresService {
  static async buscarVendedores(params: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<VendedoresResponse> {
    try {
      const { data } = await api.get<VendedoresResponse>('/api/dashboard/vendedores', {
        params: {
          dataInicio: params.dataInicio.toISOString(),
          dataFim: params.dataFim.toISOString(),
        },
      });

      return data;
    } catch (error) {
      console.error('Erro ao buscar vendedores:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar vendedores';
      return {
        vendedores: [],
        totalVendedores: 0,
        totalVendas: 0,
        totalFaturamento: 0,
        erro: errorMessage
      };
    }
  }
} 
