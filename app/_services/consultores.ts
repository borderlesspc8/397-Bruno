import { format } from 'date-fns';
import { 
  ConsultoresResponse, 
  HistoricoResponse, 
  ProdutosResponse, 
  ClientesResponse 
} from '@/app/types/consultores';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class ConsultoresService {
  static async getConsultores(params: { 
    dataInicio: Date; 
    dataFim: Date; 
    consultorId?: string | null;
  }): Promise<ConsultoresResponse> {
    try {
      const dataInicio = format(params.dataInicio, 'yyyy-MM-dd');
      const dataFim = format(params.dataFim, 'yyyy-MM-dd');
      
      let url = `${API_BASE_URL}/api/gestao-click/consultores?dataInicio=${dataInicio}&dataFim=${dataFim}`;
      
      if (params.consultorId) {
        url += `&consultorId=${params.consultorId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar dados dos consultores');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar consultores:', error);
      // Fallback para dados mockados em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const fallbackResponse = await fetch('/api/dashboard/consultores?' + new URLSearchParams({
          dataInicio: format(params.dataInicio, 'yyyy-MM-dd'),
          dataFim: format(params.dataFim, 'yyyy-MM-dd'),
          ...(params.consultorId ? { consultorId: params.consultorId } : {})
        }));
        return await fallbackResponse.json();
      }
      throw error;
    }
  }

  static async getHistorico(params: {
    dataInicio: Date;
    dataFim: Date;
    consultorId?: string | null;
    tipoPeriodo?: 'diario' | 'semanal' | 'mensal';
  }): Promise<HistoricoResponse> {
    try {
      const dataInicio = format(params.dataInicio, 'yyyy-MM-dd');
      const dataFim = format(params.dataFim, 'yyyy-MM-dd');
      
      let url = `${API_BASE_URL}/api/gestao-click/consultores/historico?dataInicio=${dataInicio}&dataFim=${dataFim}`;
      
      if (params.consultorId) {
        url += `&consultorId=${params.consultorId}`;
      }
      if (params.tipoPeriodo) {
        url += `&tipoPeriodo=${params.tipoPeriodo}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar histórico');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      // Fallback para dados mockados em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const fallbackResponse = await fetch('/api/dashboard/consultores/historico?' + new URLSearchParams({
          dataInicio: format(params.dataInicio, 'yyyy-MM-dd'),
          dataFim: format(params.dataFim, 'yyyy-MM-dd'),
          ...(params.consultorId ? { consultorId: params.consultorId } : {}),
          ...(params.tipoPeriodo ? { tipoPeriodo: params.tipoPeriodo } : {})
        }));
        return await fallbackResponse.json();
      }
      throw error;
    }
  }

  static async getProdutos(params: {
    dataInicio: Date;
    dataFim: Date;
    consultorId?: string | null;
  }): Promise<ProdutosResponse> {
    try {
      const dataInicio = format(params.dataInicio, 'yyyy-MM-dd');
      const dataFim = format(params.dataFim, 'yyyy-MM-dd');
      
      let url = `${API_BASE_URL}/api/gestao-click/consultores/produtos?dataInicio=${dataInicio}&dataFim=${dataFim}`;
      
      if (params.consultorId) {
        url += `&consultorId=${params.consultorId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar produtos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      // Fallback para dados mockados em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const fallbackResponse = await fetch('/api/dashboard/consultores/produtos?' + new URLSearchParams({
          dataInicio: format(params.dataInicio, 'yyyy-MM-dd'),
          dataFim: format(params.dataFim, 'yyyy-MM-dd'),
          ...(params.consultorId ? { consultorId: params.consultorId } : {})
        }));
        return await fallbackResponse.json();
      }
      throw error;
    }
  }

  static async getClientes(params: {
    dataInicio: Date;
    dataFim: Date;
    consultorId?: string | null;
  }): Promise<ClientesResponse> {
    try {
      const dataInicio = format(params.dataInicio, 'yyyy-MM-dd');
      const dataFim = format(params.dataFim, 'yyyy-MM-dd');
      
      let url = `${API_BASE_URL}/api/gestao-click/consultores/clientes?dataInicio=${dataInicio}&dataFim=${dataFim}`;
      
      if (params.consultorId) {
        url += `&consultorId=${params.consultorId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      // Fallback para dados mockados em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        const fallbackResponse = await fetch('/api/dashboard/consultores/clientes?' + new URLSearchParams({
          dataInicio: format(params.dataInicio, 'yyyy-MM-dd'),
          dataFim: format(params.dataFim, 'yyyy-MM-dd'),
          ...(params.consultorId ? { consultorId: params.consultorId } : {})
        }));
        return await fallbackResponse.json();
      }
      throw error;
    }
  }
} 