/**
 * 🔌 CEO DASHBOARD - GESTÃO CLICK API SERVICE
 * 
 * Busca dados de TODAS as APIs do Gestão Click
 * ⚠️ NÃO MODIFICA NADA - apenas busca dados adicionais
 * 
 * APIs disponíveis:
 * - /pagamentos: Despesas reais da empresa
 * - /recebimentos: Contas a receber
 * - /centros_custos: Lista de centros de custo
 * - /contas_bancarias: Saldos disponíveis
 * - /planos_contas: Plano de contas
 * - /formas_pagamentos: Formas de pagamento
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface APIParams {
  dataInicio: Date;
  dataFim: Date;
  userId: string;
}

export interface DadosComplementares {
  pagamentos: Pagamento[];
  recebimentos: Recebimento[];
  centrosCustos: CentroCusto[];
  planosContas: PlanoConta[];
  contasBancarias: ContaBancaria[];
  formasPagamento: FormaPagamento[];
}

export interface Pagamento {
  id: number;
  descricao: string;
  valor: string;
  data_pagamento?: string | null;
  data_liquidacao?: string | null;
  data_vencimento: string;
  liquidado: string; // "1"=pago, "0"=não pago (ou "pg"/"ab"/"at" em outros sistemas)
  centro_custo_id: number;
  centro_custo_nome: string;
  plano_conta_id?: number;
  plano_conta_nome?: string;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  conta_bancaria_id?: number;
  tipo: string;
}

export interface Recebimento {
  id: number;
  descricao: string;
  valor: string;
  data_recebimento?: string | null;
  data_liquidacao?: string | null;
  data_vencimento: string;
  liquidado: string; // "1"=pago, "0"=não pago
  venda_id?: number;
  cliente_id?: number;
  cliente_nome?: string;
  forma_pagamento_id?: number;
  forma_pagamento_nome?: string;
  conta_bancaria_id?: number;
  centro_custo_id?: number;
}

export interface CentroCusto {
  id: number;
  nome: string;
  tipo: string;
  ativo: boolean;
}

export interface PlanoConta {
  id: number;
  nome: string;
  tipo: string;
  grupo?: string;
  centro_custo_id?: number;
}

export interface ContaBancaria {
  id: string;
  nome: string;
  saldo: string;
  ativo: boolean;
}

export interface FormaPagamento {
  id: string;
  nome: string;
  conta_bancaria_id?: string;
  nome_conta_bancaria?: string;
  maximo_parcelas?: string;
  intervalo_parcelas?: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class GestaoClickAPIService {
  // ✅ USAR ROTAS API INTERNAS (que funcionam como proxy)
  // ✅ Em vez de chamar API externa direto (que dá "fetch failed" no servidor)
  // ✅ 100% ISOLADO - Não afeta outros dashboards
  private static BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  /**
   * Obtém headers para rotas internas (não precisa de tokens)
   */
  private static getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  /**
   * Busca TODOS os dados complementares das APIs
   */
  static async buscarDadosComplementares(params: APIParams): Promise<DadosComplementares> {
    console.log('[GestaoClickAPI] 🔄 Buscando dados de TODAS as APIs');
    console.log('[GestaoClickAPI] 📅 Período:', {
      inicio: params.dataInicio.toISOString().split('T')[0],
      fim: params.dataFim.toISOString().split('T')[0],
    });
    
    const dataInicio = params.dataInicio.toISOString().split('T')[0];
    const dataFim = params.dataFim.toISOString().split('T')[0];
    
    try {
      // Buscar TUDO em paralelo
      const [
        pagamentosRes,
        recebimentosRes,
        centrosCustosRes,
        contasBancariasRes,
        formasPagamentoRes,
      ] = await Promise.all([
        this.fetchPagamentos(dataInicio, dataFim),
        this.fetchRecebimentos(dataInicio, dataFim),
        this.fetchCentrosCustos(),
        this.fetchContasBancarias(),
        this.fetchFormasPagamento(),
      ]);
      
      console.log('[GestaoClickAPI] ✅ Dados recebidos:', {
        pagamentos: pagamentosRes.length,
        recebimentos: recebimentosRes.length,
        centrosCustos: centrosCustosRes.length,
        contasBancarias: contasBancariasRes.length,
        formasPagamento: formasPagamentoRes.length,
      });
      
      // Log dos primeiros pagamentos para debug
      if (pagamentosRes.length > 0) {
        console.log('[GestaoClickAPI] 📝 Exemplo de pagamento:', {
          descricao: pagamentosRes[0].descricao,
          valor: pagamentosRes[0].valor,
          centro_custo: pagamentosRes[0].centro_custo_nome,
          liquidado: pagamentosRes[0].liquidado,
        });
      }
      
      return {
        pagamentos: pagamentosRes,
        recebimentos: recebimentosRes,
        centrosCustos: centrosCustosRes,
        planosContas: [], // Opcional
        contasBancarias: contasBancariasRes,
        formasPagamento: formasPagamentoRes,
      };
    } catch (error) {
      console.error('[GestaoClickAPI] ❌ Erro ao buscar dados:', error);
      
      // Retornar dados vazios em vez de falhar
      return {
        pagamentos: [],
        recebimentos: [],
        centrosCustos: [],
        planosContas: [],
        contasBancarias: [],
        formasPagamento: [],
      };
    }
  }
  
  /**
   * Busca pagamentos (despesas)
   */
  private static async fetchPagamentos(dataInicio: string, dataFim: string): Promise<Pagamento[]> {
    try {
      console.log('[GestaoClickAPI] 📡 Buscando pagamentos via rota interna...');
      
      // ✅ Chamar rota API interna (proxy)
      const url = `${this.BASE_URL}/api/ceo/data/pagamentos?data_inicio=${dataInicio}&data_fim=${dataFim}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error(`[GestaoClickAPI] ❌ Erro ${response.status} ao buscar pagamentos`);
        console.error('[GestaoClickAPI] ❌ URL tentada:', url);
        console.error('[GestaoClickAPI] ❌ Headers:', JSON.stringify({
          'Content-Type': 'application/json',
          'access-token': process.env.GESTAO_CLICK_ACCESS_TOKEN ? 'PRESENTE' : 'AUSENTE',
          'secret-access-token': process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN ? 'PRESENTE' : 'AUSENTE',
        }));
        const text = await response.text();
        console.error('[GestaoClickAPI] ❌ Resposta da API:', text.substring(0, 500));
        return [];
      }
      
      const json = await response.json();
      const data = json.data || [];
      
      console.log(`[GestaoClickAPI] ✅ Pagamentos: ${data.length} registros`);
      
      return data as Pagamento[];
    } catch (error) {
      console.error('[GestaoClickAPI] ❌ Erro ao buscar pagamentos:', error);
      return [];
    }
  }
  
  /**
   * Busca recebimentos (contas a receber)
   */
  private static async fetchRecebimentos(dataInicio: string, dataFim: string): Promise<Recebimento[]> {
    try {
      console.log('[GestaoClickAPI] 📡 Buscando recebimentos via rota interna...');
      
      // ✅ Chamar rota API interna (proxy)
      const url = `${this.BASE_URL}/api/ceo/data/recebimentos?data_inicio=${dataInicio}&data_fim=${dataFim}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error(`[GestaoClickAPI] ❌ Erro ${response.status} ao buscar recebimentos`);
        console.error('[GestaoClickAPI] ❌ URL tentada:', url);
        const text = await response.text();
        console.error('[GestaoClickAPI] ❌ Resposta:', text.substring(0, 200));
        return [];
      }
      
      const json = await response.json();
      const data = json.data || [];
      
      console.log(`[GestaoClickAPI] ✅ Recebimentos: ${data.length} registros`);
      
      return data as Recebimento[];
    } catch (error) {
      console.error('[GestaoClickAPI] ❌ Erro ao buscar recebimentos:', error);
      return [];
    }
  }
  
  /**
   * Busca centros de custo
   */
  private static async fetchCentrosCustos(): Promise<CentroCusto[]> {
    try {
      console.log('[GestaoClickAPI] 📡 Buscando centros de custo via rota interna...');
      
      // ✅ Chamar rota API interna (proxy)
      const url = `${this.BASE_URL}/api/ceo/data/centros-custos`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error(`[GestaoClickAPI] ❌ Erro ${response.status} ao buscar centros de custo`);
        console.error('[GestaoClickAPI] ❌ URL tentada:', url);
        const text = await response.text();
        console.error('[GestaoClickAPI] ❌ Resposta:', text.substring(0, 200));
        return [];
      }
      
      const json = await response.json();
      const data = json.data || [];
      
      console.log(`[GestaoClickAPI] ✅ Centros de custo: ${data.length} registros`);
      
      return data as CentroCusto[];
    } catch (error) {
      console.error('[GestaoClickAPI] ❌ Erro ao buscar centros de custo:', error);
      return [];
    }
  }
  
  /**
   * Busca contas bancárias
   */
  private static async fetchContasBancarias(): Promise<ContaBancaria[]> {
    try {
      console.log('[GestaoClickAPI] 📡 Buscando contas bancárias via rota interna...');
      
      // ✅ Chamar rota API interna (proxy)
      const url = `${this.BASE_URL}/api/ceo/data/contas-bancarias`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error(`[GestaoClickAPI] ❌ Erro ${response.status} ao buscar contas bancárias`);
        console.error('[GestaoClickAPI] ❌ URL tentada:', url);
        const text = await response.text();
        console.error('[GestaoClickAPI] ❌ Resposta:', text.substring(0, 200));
        return [];
      }
      
      const json = await response.json();
      const data = json.data || [];
      
      console.log(`[GestaoClickAPI] ✅ Contas bancárias: ${data.length} registros`);
      
      return data as ContaBancaria[];
    } catch (error) {
      console.error('[GestaoClickAPI] ❌ Erro ao buscar contas bancárias:', error);
      return [];
    }
  }
  
  /**
   * Busca formas de pagamento
   */
  private static async fetchFormasPagamento(): Promise<FormaPagamento[]> {
    try {
      console.log('[GestaoClickAPI] 📡 Buscando formas de pagamento via rota interna...');
      
      // ✅ Chamar rota API interna (proxy)
      const url = `${this.BASE_URL}/api/ceo/data/formas-pagamento`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error(`[GestaoClickAPI] ❌ Erro ${response.status} ao buscar formas de pagamento`);
        console.error('[GestaoClickAPI] ❌ URL tentada:', url);
        const text = await response.text();
        console.error('[GestaoClickAPI] ❌ Resposta:', text.substring(0, 200));
        return [];
      }
      
      const json = await response.json();
      const data = json.data || [];
      
      console.log(`[GestaoClickAPI] ✅ Formas de pagamento: ${data.length} registros`);
      
      return data as FormaPagamento[];
    } catch (error) {
      console.error('[GestaoClickAPI] ❌ Erro ao buscar formas de pagamento:', error);
      return [];
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default GestaoClickAPIService;

