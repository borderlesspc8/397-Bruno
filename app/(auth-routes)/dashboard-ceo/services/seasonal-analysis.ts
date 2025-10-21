// Serviço de Análise Sazonal - ISOLADO para Dashboard CEO
// FASE 3: Análise Financeira

import { 
  SeasonalData, 
  SeasonalPattern, 
  TrendData, 
  CEODashboardParams 
} from '../types/ceo-dashboard.types';

export interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  costs: number;
  profit: number;
  growth: number;
  customers: number;
}

export interface SeasonalPattern {
  pattern: string;
  strength: number;
  peakMonth: string;
  lowMonth: string;
  seasonality: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  strength: number;
  forecast: MonthlyData[];
  confidence: number;
  volatility: number;
}

export class CEOSeasonalService {
  private static cache = new Map<string, any>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Análise de comparação mensal isolada
   * Não usa dados de outros dashboards
   */
  static async getMonthlyComparison(params: CEODashboardParams): Promise<MonthlyData[]> {
    const cacheKey = `monthly_comparison_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    // Verificar cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Simulação de dados isolados - em produção viria de API própria
      const monthlyData: MonthlyData[] = await this.fetchMonthlyData(params);
      
      // Salvar no cache
      this.setCache(cacheKey, monthlyData);
      
      return monthlyData;
    } catch (error) {
      console.error('Erro ao obter comparação mensal:', error);
      throw new Error('Falha ao processar análise mensal');
    }
  }

  /**
   * Identificação de padrões sazonais isolados
   */
  static async getSeasonalPatterns(params: CEODashboardParams): Promise<SeasonalPattern[]> {
    const cacheKey = `seasonal_patterns_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const monthlyData = await this.getMonthlyComparison(params);
      const patterns = this.analyzeSeasonalPatterns(monthlyData);
      
      this.setCache(cacheKey, patterns);
      return patterns;
    } catch (error) {
      console.error('Erro ao analisar padrões sazonais:', error);
      throw new Error('Falha ao processar padrões sazonais');
    }
  }

  /**
   * Análise de tendências isoladas
   */
  static async getTrendAnalysis(params: CEODashboardParams): Promise<TrendData> {
    const cacheKey = `trend_analysis_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const monthlyData = await this.getMonthlyComparison(params);
      const trend = this.calculateTrend(monthlyData);
      
      this.setCache(cacheKey, trend);
      return trend;
    } catch (error) {
      console.error('Erro ao analisar tendências:', error);
      throw new Error('Falha ao processar análise de tendências');
    }
  }

  /**
   * Análise de sazonalidade isolada
   */
  static async getSeasonalityIndex(params: CEODashboardParams): Promise<number> {
    const patterns = await this.getSeasonalPatterns(params);
    return patterns.reduce((acc, pattern) => acc + pattern.seasonality, 0) / patterns.length;
  }

  /**
   * Previsão baseada em sazonalidade
   */
  static async getSeasonalForecast(params: CEODashboardParams, months: number = 6): Promise<MonthlyData[]> {
    const trend = await this.getTrendAnalysis(params);
    const patterns = await this.getSeasonalPatterns(params);
    
    return this.generateForecast(trend, patterns, months);
  }

  // Métodos privados para processamento isolado

  private static async fetchMonthlyData(params: CEODashboardParams): Promise<MonthlyData[]> {
    try {
      // Buscar dados reais da API de análise financeira
      const response = await fetch(`/api/ceo/financial-analysis?startDate=${params.startDate.toISOString()}&endDate=${params.endDate.toISOString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.monthlyTrend && data.monthlyTrend.length > 0) {
          // Converter dados reais para formato esperado
          return data.monthlyTrend.map((trend: any, index: number) => ({
            month: trend.month,
            year: trend.year || new Date().getFullYear(),
            revenue: trend.revenue || 0,
            costs: trend.costs || 0,
            profit: trend.profit || (trend.revenue - trend.costs) || 0,
            growth: trend.growth || 0,
            customers: trend.customers || 0 // Usar dados reais da API
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados reais de análise sazonal:', error);
    }

    // Sem dados reais disponíveis - retornar array vazio
    // TODO: Garantir que a API /api/ceo/financial-analysis sempre retorne dados válidos
    return [];
  }

  private static analyzeSeasonalPatterns(data: MonthlyData[]): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = [];
    
    // Análise de receita
    const revenuePattern = this.calculatePattern(data.map(d => d.revenue), 'Receita');
    patterns.push(revenuePattern);
    
    // Análise de custos
    const costPattern = this.calculatePattern(data.map(d => d.costs), 'Custos');
    patterns.push(costPattern);
    
    // Análise de lucro
    const profitPattern = this.calculatePattern(data.map(d => d.profit), 'Lucro');
    patterns.push(profitPattern);
    
    return patterns;
  }

  private static calculatePattern(values: number[], type: string): SeasonalPattern {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const seasonality = stdDev / avg;
    
    const peakIndex = values.indexOf(Math.max(...values));
    const lowIndex = values.indexOf(Math.min(...values));
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                   'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    return {
      pattern: type,
      strength: Math.min(seasonality * 100, 100),
      peakMonth: months[peakIndex % 12],
      lowMonth: months[lowIndex % 12],
      seasonality: seasonality,
      trend: this.determineTrend(values)
    };
  }

  private static calculateTrend(data: MonthlyData[]): TrendData {
    const revenueValues = data.map(d => d.revenue);
    const n = revenueValues.length;
    
    if (n < 2) {
      return {
        direction: 'stable',
        strength: 0,
        forecast: [],
        confidence: 0,
        volatility: 0
      };
    }
    
    // Regressão linear simples
    const sumX = n * (n - 1) / 2;
    const sumY = revenueValues.reduce((a, b) => a + b, 0);
    const sumXY = revenueValues.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = n * (n - 1) * (2 * n - 1) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const strength = Math.abs(slope) / (sumY / n) * 100;
    
    const direction = slope > 0 ? 'up' : slope < 0 ? 'down' : 'stable';
    
    // Calcular volatilidade
    const avg = sumY / n;
    const variance = revenueValues.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / n;
    const volatility = Math.sqrt(variance) / avg;
    
    // Gerar previsão
    const forecast = this.generateForecastData(data, slope, avg, 6);
    
    return {
      direction,
      strength: Math.min(strength, 100),
      forecast,
      confidence: Math.max(0, 100 - volatility * 100),
      volatility: volatility * 100
    };
  }

  private static generateForecastData(data: MonthlyData[], slope: number, avg: number, months: number): MonthlyData[] {
    const forecast: MonthlyData[] = [];
    const lastData = data[data.length - 1];
    const lastDate = new Date(lastData.year, data.length - 1);
    
    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(lastDate.getFullYear(), lastDate.getMonth() + i);
      const trendValue = slope * i;
      const seasonalFactor = Math.sin((i / 12) * Math.PI * 2) * 0.2;
      
      const revenue = Math.max(0, lastData.revenue + trendValue + (avg * seasonalFactor));
      const costs = revenue * 0.65; // Proporção fixa sem randomização
      
      forecast.push({
        month: forecastDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        year: forecastDate.getFullYear(),
        revenue: Math.round(revenue),
        costs: Math.round(costs),
        profit: Math.round(revenue - costs),
        growth: Math.round((trendValue / lastData.revenue) * 100),
        customers: Math.round(lastData.customers + (i * 20))
      });
    }
    
    return forecast;
  }

  private static generateForecast(trend: TrendData, patterns: SeasonalPattern[], months: number): MonthlyData[] {
    return trend.forecast.slice(0, months);
  }

  private static determineTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = (last - first) / first;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private static getMonthsBetween(start: Date, end: Date): Date[] {
    const months: Date[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    
    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
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
