import { format } from 'date-fns';
import { DashboardData, DateRange, Produto } from '@/types/dashboard';

export class DashboardService {
  private static instance: DashboardService;
  private abortController: AbortController | null = null;

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  private cancelPreviousRequest() {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
  }

  public async fetchDashboardData(dateRange: DateRange): Promise<DashboardData> {
    try {
      this.cancelPreviousRequest();

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : fromDate;
      
      console.log(`Preparando requisição para o período: ${fromDate}_${toDate}`);
      
      const queryParams = new URLSearchParams({
        from: fromDate,
        to: toDate
      });

      const response = await fetch(`/api/dashboard?${queryParams}`, {
        signal: this.abortController?.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Criar uma estrutura segura que segue a interface DashboardData
      const dashboardData: DashboardData = {
        totalReceita: data.totalReceita || 0,
        totalVendas: data.totalVendas || 0,
        ticketMedio: data.ticketMedio || 0,
        vendedores: Array.isArray(data.vendedores) ? data.vendedores.map((vendedor: any) => ({
          id: vendedor.id || '',
          nome: vendedor.nome || '',
          totalVendas: vendedor.totalVendas || 0,
          valorTotal: vendedor.valorTotal || 0,
          ticketMedio: vendedor.ticketMedio || 0
        })) : [],
        vendasDetalhadas: Array.isArray(data.vendasDetalhadas) ? data.vendasDetalhadas.map((venda: any) => {
          // Certificar que produtos é sempre um array, mesmo que vazio
          const produtos: Produto[] = Array.isArray(venda.produtos) 
            ? venda.produtos.map((produto: any) => ({
                id: produto.id || `produto-${Math.random().toString(36).substring(2, 9)}`,
                nome: produto.nome || 'Produto sem nome',
                quantidade: produto.quantidade || 1,
                precoUnitario: produto.precoUnitario || 0,
                total: produto.total || 0
              }))
            : [];
            
          return {
            id: venda.id || '',
            dataVenda: venda.dataVenda || '',
            valor: venda.valor || 0,
            vendedor: {
              id: venda?.vendedor?.id || '',
              nome: venda?.vendedor?.nome || ''
            },
            // Garantir que produtos é sempre um array válido
            produtos: produtos
          };
        }) : []
      };
      
      return dashboardData;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Requisição foi cancelada, podemos ignorar
        throw new Error('Request was cancelled');
      }
      console.error('Erro ao buscar dados:', error);
      throw error;
    }
  }
} 