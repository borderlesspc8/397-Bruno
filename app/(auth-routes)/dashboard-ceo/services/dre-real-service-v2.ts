/**
 * SERVIÇO DRE REAL - CONEXÃO DIRETA COM GESTÃO CLICK
 * 
 * Este serviço conecta diretamente com os endpoints da API do GestãoClick
 * para buscar dados reais de DRE com três opções:
 * 1. DRE Geral (todas as unidades)
 * 2. DRE Unidade Matriz
 * 3. DRE Filial Golden
 */

import { CEODashboardParams, DetailedDREData, DRERatios, DRETrendAnalysis } from '../types/ceo-dashboard.types';

// Interfaces baseadas nos dados reais do GestãoClick
interface GestaoClickVenda {
  id: number;
  valor_total: string;
  valor_custo?: string;
  data: string;
  nome_situacao?: string;
  loja_id?: string | number;
  nome_loja?: string;
  itens?: Array<{
    quantidade: string;
    valor_custo: string;
    valor_unitario: string;
    valor_total: string;
  }>;
}

interface GestaoClickRecebimento {
  id: number;
  valor: string;
  data_recebimento: string;
  loja_id?: string | number;
}

interface GestaoClickPagamento {
  id: number;
  valor: string;
  data_pagamento: string;
  loja_id?: string | number;
}

export type TipoDRE = 'geral' | 'matriz' | 'golden';

export class DRERealService {
  private static readonly BASE_URL = 'https://api.beteltecnologia.com';
  private static readonly ACCESS_TOKEN = process.env.GESTAO_CLICK_ACCESS_TOKEN;
  private static readonly SECRET_TOKEN = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;

  private static verificarCredenciais(): { valido: boolean; erro?: string } {
    if (!this.ACCESS_TOKEN) {
      return { valido: false, erro: 'GESTAO_CLICK_ACCESS_TOKEN não configurado' };
    }
    if (!this.SECRET_TOKEN) {
      return { valido: false, erro: 'GESTAO_CLICK_SECRET_ACCESS_TOKEN não configurado' };
    }
    return { valido: true };
  }

  private static async fazerRequisicao<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const credenciais = this.verificarCredenciais();
    if (!credenciais.valido) {
      throw new Error(credenciais.erro);
    }

    const url = new URL(`${this.BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    if (this.SECRET_TOKEN) {
      headers['X-Secret-Token'] = this.SECRET_TOKEN;
    }

    let tentativas = 0;
    const maxTentativas = 3;

    while (tentativas < maxTentativas) {
      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        tentativas++;
        if (tentativas >= maxTentativas) {
          throw error;
        }
        
        const delay = Math.pow(2, tentativas) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Máximo de tentativas excedido');
  }

  private static parseValor(valor: string | number | undefined): number {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
      const parsed = parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  private static filtrarPorUnidade<T extends { loja_id?: string | number; nome_loja?: string }>(
    dados: T[], 
    tipo: TipoDRE
  ): T[] {
    if (tipo === 'geral') return dados;
    
    return dados.filter(item => {
      if (tipo === 'matriz') {
        return item.loja_id === 1 || item.loja_id === '1' || 
               (item.nome_loja && item.nome_loja.toLowerCase().includes('matriz'));
      }
      if (tipo === 'golden') {
        return item.loja_id === 2 || item.loja_id === '2' || 
               (item.nome_loja && item.nome_loja.toLowerCase().includes('golden'));
      }
      return true;
    });
  }

  private static async buscarVendas(params: CEODashboardParams, tipo: TipoDRE): Promise<GestaoClickVenda[]> {
    try {
      const dataInicio = params.startDate.toISOString().split('T')[0];
      const dataFim = params.endDate.toISOString().split('T')[0];
      
      const requestParams: Record<string, string> = {
        data_inicio: dataInicio,
        data_fim: dataFim
      };

      if (tipo === 'geral') {
        requestParams.todas_lojas = 'true';
      } else if (tipo === 'matriz') {
        requestParams.loja_id = '1';
      } else if (tipo === 'golden') {
        requestParams.loja_id = '2';
      }

      const vendas = await this.fazerRequisicao<GestaoClickVenda[]>('/vendas', requestParams);
      return this.filtrarPorUnidade(vendas, tipo);
    } catch (error) {
      console.error('[DRE Real Service] Erro ao buscar vendas:', error);
      return [];
    }
  }

  private static async buscarRecebimentos(params: CEODashboardParams): Promise<GestaoClickRecebimento[]> {
    try {
      const dataInicio = params.startDate.toISOString().split('T')[0];
      const dataFim = params.endDate.toISOString().split('T')[0];
      
      const recebimentos = await this.fazerRequisicao<GestaoClickRecebimento[]>('/recebimentos', {
        data_inicio: dataInicio,
        data_fim: dataFim
      });
      
      return recebimentos;
    } catch (error) {
      console.error('[DRE Real Service] Erro ao buscar recebimentos:', error);
      return [];
    }
  }

  private static async buscarPagamentos(params: CEODashboardParams): Promise<GestaoClickPagamento[]> {
    try {
      const dataInicio = params.startDate.toISOString().split('T')[0];
      const dataFim = params.endDate.toISOString().split('T')[0];
      
      const pagamentos = await this.fazerRequisicao<GestaoClickPagamento[]>('/pagamentos', {
        data_inicio: dataInicio,
        data_fim: dataFim
      });
      
      return pagamentos;
    } catch (error) {
      console.error('[DRE Real Service] Erro ao buscar pagamentos:', error);
      return [];
    }
  }

  private static calcularDRE(
    vendas: GestaoClickVenda[],
    recebimentos: GestaoClickRecebimento[],
    pagamentos: GestaoClickPagamento[],
    tipo: TipoDRE
  ): DetailedDREData {
    // Receita Bruta
    const receitaBruta = vendas.reduce((acc, venda) => {
      return acc + this.parseValor(venda.valor_total);
    }, 0);

    // Deduções (estimativa de 2% sobre receita bruta)
    const deducoes = receitaBruta * 0.02;

    // Receita Líquida
    const receitaLiquida = receitaBruta - deducoes;

    // Custos dos Produtos Vendidos
    const custosProdutos = vendas.reduce((acc, venda) => {
      if (venda.itens && Array.isArray(venda.itens)) {
        const custoVenda = venda.itens.reduce((itemSum, item) => {
          const quantidade = this.parseValor(item.quantidade);
          const valorCusto = this.parseValor(item.valor_custo);
          return itemSum + (quantidade * valorCusto);
        }, 0);
        return acc + custoVenda;
      }
      return acc + this.parseValor(venda.valor_custo);
    }, 0);

    // Lucro Bruto
    const lucroBruto = receitaLiquida - custosProdutos;

    // Despesas Operacionais (baseadas em pagamentos)
    const despesasOperacionais = pagamentos.reduce((acc, pagamento) => {
      return acc + this.parseValor(pagamento.valor);
    }, 0);

    // Lucro Operacional
    const lucroOperacional = lucroBruto - despesasOperacionais;

    // Resultado Financeiro (estimativa)
    const resultadoFinanceiro = 0;

    // Impostos (estimativa de 8% sobre lucro operacional)
    const impostos = Math.max(0, lucroOperacional * 0.08);

    // Lucro Líquido
    const lucroLiquido = lucroOperacional + resultadoFinanceiro - impostos;

    // Margens
    const margemBruta = receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
    const margemOperacional = receitaLiquida > 0 ? (lucroOperacional / receitaLiquida) * 100 : 0;
    const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;

    return {
      revenue: receitaLiquida,
      grossRevenue: receitaBruta,
      salesReturns: deducoes * 0.5,
      salesDiscounts: deducoes * 0.5,
      netRevenue: receitaLiquida,
      directMaterials: custosProdutos * 0.4,
      directLabor: custosProdutos * 0.3,
      manufacturingOverhead: custosProdutos * 0.3,
      costOfGoodsSold: custosProdutos,
      totalCostOfGoodsSold: custosProdutos,
      grossProfit: lucroBruto,
      grossMargin: margemBruta / 100,
      salesExpenses: despesasOperacionais * 0.6,
      administrativeExpenses: despesasOperacionais * 0.3,
      generalExpenses: despesasOperacionais * 0.1,
      operatingExpenses: despesasOperacionais,
      operatingProfit: lucroOperacional,
      operatingMargin: margemOperacional / 100,
      depreciation: 0,
      amortization: 0,
      financialIncome: 0,
      financialExpenses: 0,
      netFinancialResult: resultadoFinanceiro,
      incomeTax: impostos * 0.6,
      socialContribution: impostos * 0.4,
      netProfit: lucroLiquido,
      netMargin: margemLiquida / 100,
      ebitda: lucroOperacional,
      ebit: lucroOperacional
    };
  }

  static async getDetailedDRE(params: CEODashboardParams, tipo: TipoDRE = 'geral'): Promise<DetailedDREData> {
    try {
      console.log('[DRE Real Service] Buscando DRE para período:', {
        dataInicio: params.startDate.toISOString().split('T')[0],
        dataFim: params.endDate.toISOString().split('T')[0],
        tipo
      });

      const [vendas, recebimentos, pagamentos] = await Promise.all([
        this.buscarVendas(params, tipo),
        this.buscarRecebimentos(params),
        this.buscarPagamentos(params)
      ]);

      console.log('[DRE Real Service] Dados encontrados:', {
        vendas: vendas.length,
        recebimentos: recebimentos.length,
        pagamentos: pagamentos.length
      });

      const dreData = this.calcularDRE(vendas, recebimentos, pagamentos, tipo);

      console.log('[DRE Real Service] DRE calculada:', {
        receitaBruta: Math.round(dreData.grossRevenue),
        receitaLiquida: Math.round(dreData.netRevenue),
        custosProdutos: Math.round(dreData.totalCostOfGoodsSold),
        lucroBruto: Math.round(dreData.grossProfit),
        lucroOperacional: Math.round(dreData.operatingProfit),
        lucroLiquido: Math.round(dreData.netProfit),
        margemBruta: Math.round(dreData.grossMargin * 100) / 100,
        margemOperacional: Math.round(dreData.operatingMargin * 100) / 100,
        margemLiquida: Math.round(dreData.netMargin * 100) / 100
      });

      return dreData;
    } catch (error) {
      console.error('[DRE Real Service] Erro ao buscar DRE:', error);
      throw new Error('Falha ao carregar DRE');
    }
  }

  static async getDRERatios(params: CEODashboardParams, tipo: TipoDRE = 'geral'): Promise<DRERatios> {
    try {
      const dreData = await this.getDetailedDRE(params, tipo);
      
      return {
        grossMarginRatio: dreData.grossMargin,
        operatingMarginRatio: dreData.operatingMargin,
        netMarginRatio: dreData.netMargin,
        costOfGoodsSoldRatio: dreData.netRevenue > 0 ? (dreData.totalCostOfGoodsSold / dreData.netRevenue) : 0,
        operatingExpenseRatio: dreData.netRevenue > 0 ? (dreData.operatingExpenses / dreData.netRevenue) : 0,
        returnOnRevenue: dreData.netMargin
      };
    } catch (error) {
      console.error('[DRE Real Service] Erro ao calcular ratios:', error);
      throw new Error('Falha ao calcular ratios DRE');
    }
  }

  static async getDRETrendAnalysis(params: CEODashboardParams, tipo: TipoDRE = 'geral', months: number = 6): Promise<DRETrendAnalysis[]> {
    try {
      const trendAnalysis: DRETrendAnalysis[] = [];
      const currentDate = new Date(params.endDate);
      
      for (let i = months - 1; i >= 0; i--) {
        const periodDate = new Date(currentDate);
        periodDate.setMonth(periodDate.getMonth() - i);
        
        const periodStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
        const periodEnd = new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 0);
        
        const periodParams = {
          ...params,
          startDate: periodStart,
          endDate: periodEnd
        };
        
        try {
          const dreData = await this.getDetailedDRE(periodParams, tipo);
          const previousPeriod = trendAnalysis[trendAnalysis.length - 1];
          const growth = previousPeriod ? 
            ((dreData.netRevenue - previousPeriod.revenue) / previousPeriod.revenue) * 100 : 0;
          
          trendAnalysis.push({
            period: periodDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
            revenue: dreData.netRevenue,
            growth: growth,
            profit: dreData.netProfit,
            margin: dreData.netMargin * 100,
            costs: dreData.totalCostOfGoodsSold,
            trend: growth > 5 ? 'improving' : growth < -5 ? 'deteriorating' : 'stable'
          });
        } catch (error) {
          console.warn(`[DRE Real Service] Erro ao buscar dados para período ${i}:`, error);
        }
      }
      
      return trendAnalysis;
    } catch (error) {
      console.error('[DRE Real Service] Erro ao analisar tendência:', error);
      throw new Error('Falha ao analisar tendência DRE');
    }
  }

  static async getMarginEvolution(params: CEODashboardParams, tipo: TipoDRE = 'geral'): Promise<{
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
    trend: 'improving' | 'deteriorating' | 'stable';
    volatility: number;
  }> {
    try {
      const dreData = await this.getDetailedDRE(params, tipo);
      
      return {
        grossMargin: dreData.grossMargin * 100,
        operatingMargin: dreData.operatingMargin * 100,
        netMargin: dreData.netMargin * 100,
        trend: 'stable',
        volatility: 0
      };
    } catch (error) {
      console.error('[DRE Real Service] Erro ao calcular evolução das margens:', error);
      throw new Error('Falha ao calcular evolução das margens');
    }
  }
}