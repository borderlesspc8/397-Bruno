// Serviço de Indicadores de Liquidez - ISOLADO para Dashboard CEO
// FASE 3: Análise Financeira

import { 
  LiquidityData, 
  CEODashboardParams 
} from '../types/ceo-dashboard.types';

export interface LiquidityMetrics {
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  workingCapital: number;
  cashConversionCycle: number;
  daysSalesOutstanding: number;
  daysInventoryOutstanding: number;
  daysPayableOutstanding: number;
}

export interface CashFlowMetrics {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  freeCashFlow: number;
  cashFromOperations: number;
  cashToInvestments: number;
  cashFromFinancing: number;
}

export interface WorkingCapitalAnalysis {
  currentAssets: number;
  currentLiabilities: number;
  inventory: number;
  receivables: number;
  payables: number;
  cash: number;
  shortTermInvestments: number;
  workingCapitalTrend: 'improving' | 'deteriorating' | 'stable';
}

export class CEOLiquidityService {
  private static cache = new Map<string, any>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Calcular índice de liquidez corrente isolado
   */
  static async getCurrentLiquidityRatio(params: CEODashboardParams): Promise<number> {
    const cacheKey = `current_liquidity_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const workingCapital = await this.getWorkingCapitalAnalysis(params);
      const ratio = workingCapital.currentAssets / workingCapital.currentLiabilities;
      
      this.setCache(cacheKey, ratio);
      return Math.round(ratio * 100) / 100;
    } catch (error) {
      console.error('Erro ao calcular liquidez corrente:', error);
      throw new Error('Falha ao calcular liquidez corrente');
    }
  }

  /**
   * Calcular índice de liquidez seca isolado
   */
  static async getQuickLiquidityRatio(params: CEODashboardParams): Promise<number> {
    const cacheKey = `quick_liquidity_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const workingCapital = await this.getWorkingCapitalAnalysis(params);
      const quickAssets = workingCapital.cash + workingCapital.shortTermInvestments + workingCapital.receivables;
      const ratio = quickAssets / workingCapital.currentLiabilities;
      
      this.setCache(cacheKey, ratio);
      return Math.round(ratio * 100) / 100;
    } catch (error) {
      console.error('Erro ao calcular liquidez seca:', error);
      throw new Error('Falha ao calcular liquidez seca');
    }
  }

  /**
   * Calcular índice de liquidez imediata isolado
   */
  static async getCashRatio(params: CEODashboardParams): Promise<number> {
    const cacheKey = `cash_ratio_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const workingCapital = await this.getWorkingCapitalAnalysis(params);
      const cashAssets = workingCapital.cash + workingCapital.shortTermInvestments;
      const ratio = cashAssets / workingCapital.currentLiabilities;
      
      this.setCache(cacheKey, ratio);
      return Math.round(ratio * 100) / 100;
    } catch (error) {
      console.error('Erro ao calcular índice de caixa:', error);
      throw new Error('Falha ao calcular índice de caixa');
    }
  }

  /**
   * Calcular capital de giro isolado
   */
  static async getWorkingCapital(params: CEODashboardParams): Promise<number> {
    const cacheKey = `working_capital_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const workingCapital = await this.getWorkingCapitalAnalysis(params);
      const capital = workingCapital.currentAssets - workingCapital.currentLiabilities;
      
      this.setCache(cacheKey, capital);
      return Math.round(capital);
    } catch (error) {
      console.error('Erro ao calcular capital de giro:', error);
      throw new Error('Falha ao calcular capital de giro');
    }
  }

  /**
   * Calcular ciclo de conversão de caixa isolado
   */
  static async getCashConversionCycle(params: CEODashboardParams): Promise<number> {
    const cacheKey = `cash_conversion_cycle_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const metrics = await this.getCashFlowMetrics(params);
      const cycle = metrics.daysSalesOutstanding + metrics.daysInventoryOutstanding - metrics.daysPayableOutstanding;
      
      this.setCache(cacheKey, cycle);
      return Math.round(cycle);
    } catch (error) {
      console.error('Erro ao calcular ciclo de conversão:', error);
      throw new Error('Falha ao calcular ciclo de conversão');
    }
  }

  /**
   * Obter análise completa de liquidez isolada
   */
  static async getLiquidityAnalysis(params: CEODashboardParams): Promise<LiquidityMetrics> {
    const cacheKey = `liquidity_analysis_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log('[CEOLiquidityService] Buscando análise de liquidez');
      
      // Buscar dados do cash-flow endpoint
      const cashFlowResponse = await fetch(`/api/ceo/cash-flow?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}`);
      if (!cashFlowResponse.ok) {
        throw new Error('Erro ao buscar dados de cash-flow');
      }
      
      const cashFlowData = await cashFlowResponse.json();
      console.log('[CEOLiquidityService] Dados de cash-flow:', cashFlowData);
      
      // Calcular métricas de liquidez baseadas nos dados disponíveis
      const totalRecebimentos = cashFlowData.totalRecebimentos || 0;
      const totalPagamentos = cashFlowData.totalPagamentos || 0;
      const saldoLiquido = cashFlowData.saldoLiquido || 0;
      
      // Estimar ativos e passivos circulantes
      const currentAssets = totalRecebimentos; // Estimativa: recebimentos como ativos circulantes
      const currentLiabilities = totalPagamentos; // Estimativa: pagamentos como passivos circulantes
      
      // Calcular indicadores de liquidez
      const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
      const quickRatio = currentLiabilities > 0 ? (currentAssets * 0.8) / currentLiabilities : 0; // 80% dos ativos (excluindo inventário estimado)
      const cashRatio = currentLiabilities > 0 ? (saldoLiquido) / currentLiabilities : 0;
      const workingCapital = saldoLiquido;
      
      // Ciclo de conversão de caixa (estimado)
      const daysSalesOutstanding = 30; // Estimativa: 30 dias
      const daysInventoryOutstanding = 15; // Estimativa: 15 dias
      const daysPayableOutstanding = 20; // Estimativa: 20 dias
      const cashConversionCycle = daysSalesOutstanding + daysInventoryOutstanding - daysPayableOutstanding;

      const analysis: LiquidityMetrics = {
        currentRatio: Math.round(currentRatio * 100) / 100,
        quickRatio: Math.round(quickRatio * 100) / 100,
        cashRatio: Math.round(cashRatio * 100) / 100,
        workingCapital: Math.round(workingCapital),
        cashConversionCycle: Math.round(cashConversionCycle),
        daysSalesOutstanding,
        daysInventoryOutstanding,
        daysPayableOutstanding
      };
      
      console.log('[CEOLiquidityService] Análise de liquidez calculada:', analysis);
      this.setCache(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Erro ao obter análise de liquidez:', error);
      throw new Error('Falha ao processar análise de liquidez');
    }
  }

  /**
   * Análise de capital de giro isolada
   */
  static async getWorkingCapitalAnalysis(params: CEODashboardParams): Promise<WorkingCapitalAnalysis> {
    const cacheKey = `working_capital_analysis_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log('[CEOLiquidityService] Buscando análise de capital de giro');
      
      // Buscar dados do cash-flow endpoint
      const cashFlowResponse = await fetch(`/api/ceo/cash-flow?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}`);
      if (!cashFlowResponse.ok) {
        throw new Error('Erro ao buscar dados de cash-flow');
      }
      
      const cashFlowData = await cashFlowResponse.json();
      
      // Estimar componentes do capital de giro
      const totalRecebimentos = cashFlowData.totalRecebimentos || 0;
      const totalPagamentos = cashFlowData.totalPagamentos || 0;
      const saldoLiquido = cashFlowData.saldoLiquido || 0;
      
      // Estimativas baseadas nos dados disponíveis
      const cash = saldoLiquido; // Caixa disponível
      const receivables = totalRecebimentos * 0.3; // 30% dos recebimentos como contas a receber
      const inventory = totalRecebimentos * 0.2; // 20% como estoque estimado
      const shortTermInvestments = saldoLiquido * 0.1; // 10% do saldo em investimentos
      const payables = totalPagamentos * 0.4; // 40% dos pagamentos como contas a pagar
      
      const currentAssets = cash + receivables + inventory + shortTermInvestments;
      const currentLiabilities = payables;
      
      const workingCapitalTrend = this.determineWorkingCapitalTrend(currentAssets, currentLiabilities);
      
      const analysis: WorkingCapitalAnalysis = {
        currentAssets: Math.round(currentAssets),
        currentLiabilities: Math.round(currentLiabilities),
        inventory: Math.round(inventory),
        receivables: Math.round(receivables),
        payables: Math.round(payables),
        cash: Math.round(cash),
        shortTermInvestments: Math.round(shortTermInvestments),
        workingCapitalTrend
      };
      
      console.log('[CEOLiquidityService] Análise de capital de giro:', analysis);
      this.setCache(cacheKey, analysis);
      return analysis;
    } catch (error) {
      console.error('Erro ao analisar capital de giro:', error);
      throw new Error('Falha ao analisar capital de giro');
    }
  }

  /**
   * Métricas de fluxo de caixa isoladas
   */
  static async getCashFlowMetrics(params: CEODashboardParams): Promise<CashFlowMetrics & { daysSalesOutstanding: number; daysInventoryOutstanding: number; daysPayableOutstanding: number }> {
    const cacheKey = `cash_flow_metrics_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      console.log('[CEOLiquidityService] Buscando métricas de fluxo de caixa');
      
      // Buscar dados do cash-flow endpoint
      const cashFlowResponse = await fetch(`/api/ceo/cash-flow?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}`);
      if (!cashFlowResponse.ok) {
        throw new Error('Erro ao buscar dados de cash-flow');
      }
      
      const cashFlowData = await cashFlowResponse.json();
      
      const totalRecebimentos = cashFlowData.totalRecebimentos || 0;
      const totalPagamentos = cashFlowData.totalPagamentos || 0;
      const saldoLiquido = cashFlowData.saldoLiquido || 0;
      
      // Calcular métricas de fluxo de caixa
      const operatingCashFlow = totalRecebimentos - totalPagamentos; // Fluxo operacional
      const investingCashFlow = -Math.round(totalRecebimentos * 0.05); // Investimentos (5% dos recebimentos)
      const financingCashFlow = -Math.round(totalPagamentos * 0.1); // Financiamento (10% dos pagamentos)
      const freeCashFlow = operatingCashFlow + investingCashFlow; // Fluxo livre de caixa
      const cashFromOperations = operatingCashFlow;
      const cashToInvestments = investingCashFlow;
      const cashFromFinancing = financingCashFlow;
      
      // Estimativas de ciclo
      const daysSalesOutstanding = 30;
      const daysInventoryOutstanding = 15;
      const daysPayableOutstanding = 20;
      
      const metrics = {
        operatingCashFlow: Math.round(operatingCashFlow),
        investingCashFlow: Math.round(investingCashFlow),
        financingCashFlow: Math.round(financingCashFlow),
        freeCashFlow: Math.round(freeCashFlow),
        cashFromOperations: Math.round(cashFromOperations),
        cashToInvestments: Math.round(cashToInvestments),
        cashFromFinancing: Math.round(cashFromFinancing),
        daysSalesOutstanding,
        daysInventoryOutstanding,
        daysPayableOutstanding
      };
      
      console.log('[CEOLiquidityService] Métricas de fluxo de caixa:', metrics);
      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Erro ao obter métricas de fluxo de caixa:', error);
      throw new Error('Falha ao obter métricas de fluxo de caixa');
    }
  }

  /**
   * Análise de tendência de liquidez
   */
  static async getLiquidityTrend(params: CEODashboardParams, periods: number = 6): Promise<{
    trend: 'improving' | 'deteriorating' | 'stable';
    values: number[];
    average: number;
    volatility: number;
  }> {
    try {
      const currentAnalysis = await this.getLiquidityAnalysis(params);
      const historicalData = await this.getHistoricalLiquidityData(params, periods);
      
      const values = [currentAnalysis.currentRatio, ...historicalData.map(d => d.currentRatio)];
      const trend = this.calculateTrend(values);
      const average = values.reduce((a, b) => a + b, 0) / values.length;
      const volatility = this.calculateVolatility(values);
      
      return {
        trend,
        values,
        average: Math.round(average * 100) / 100,
        volatility: Math.round(volatility * 100) / 100
      };
    } catch (error) {
      console.error('Erro ao analisar tendência de liquidez:', error);
      throw new Error('Falha ao analisar tendência de liquidez');
    }
  }

  // Métodos privados para processamento isolado


  private static async getHistoricalLiquidityData(params: CEODashboardParams, periods: number): Promise<LiquidityMetrics[]> {
    const historicalData: LiquidityMetrics[] = [];
    
    for (let i = 1; i <= periods; i++) {
      const historicalStart = new Date(params.startDate);
      historicalStart.setMonth(historicalStart.getMonth() - i);
      
      const historicalEnd = new Date(params.endDate);
      historicalEnd.setMonth(historicalEnd.getMonth() - i);
      
      const historicalParams: CEODashboardParams = {
        startDate: historicalStart,
        endDate: historicalEnd
      };
      
      try {
        const data = await this.getLiquidityAnalysis(historicalParams);
        historicalData.push(data);
      } catch (error) {
        console.warn(`Erro ao obter dados históricos para período ${i}:`, error);
      }
    }
    
    return historicalData;
  }

  private static determineWorkingCapitalTrend(currentAssets: number, currentLiabilities: number): 'improving' | 'deteriorating' | 'stable' {
    const ratio = currentAssets / currentLiabilities;
    
    if (ratio > 2.0) return 'improving';
    if (ratio < 1.2) return 'deteriorating';
    return 'stable';
  }

  private static calculateTrend(values: number[]): 'improving' | 'deteriorating' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'deteriorating';
    return 'stable';
  }

  private static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance) / avg;
  }

  // Sistema de cache isolado
  private static getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Limpar cache isolado
   */
  static clearCache(): void {
    this.cache.clear();
  }
}
