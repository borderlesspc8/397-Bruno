/**
 * CEO Drill-Down Service - ISOLADO
 * Sistema de navegação entre dashboards exclusivo para CEO
 * Não afeta outros dashboards ou funcionalidades existentes
 */

import { DrillDownOptions, TargetComparison } from '../types/ceo-dashboard.types';

export class CEODrillDownService {
  /**
   * Navega para dashboard específico com filtros aplicados
   * ISOLADO - navegação própria
   */
  static async navigateToDashboard(options: DrillDownOptions): Promise<string> {
    try {
      const baseUrl = this.getDashboardBaseUrl(options.targetDashboard);
      const queryParams = this.buildQueryParams(options);
      const url = `${baseUrl}?${queryParams}`;
      
      // Em produção, usar router do Next.js
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
      
      return url;
    } catch (error) {
      console.error('Erro ao navegar para dashboard:', error);
      throw new Error('Falha na navegação para dashboard');
    }
  }

  /**
   * Obtém URL base do dashboard de destino
   * ISOLADO - mapeamento próprio
   */
  private static getDashboardBaseUrl(dashboard: string): string {
    const baseUrls = {
      'vendas': '/dashboard/vendas',
      'vendedores': '/dashboard/vendedores',
      'atendimentos': '/dashboard/atendimentos',
      'consultores': '/dashboard/consultores'
    };
    
    return baseUrls[dashboard] || '/dashboard';
  }

  /**
   * Constrói parâmetros de query para filtros
   * ISOLADO - construção própria
   */
  private static buildQueryParams(options: DrillDownOptions): string {
    const params = new URLSearchParams();
    
    // Adicionar período
    params.append('startDate', options.period.startDate);
    params.append('endDate', options.period.endDate);
    
    // Adicionar métricas
    options.metrics.forEach(metric => {
      params.append('metrics', metric);
    });
    
    // Adicionar filtros
    Object.entries(options.filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });
    
    // Adicionar flag de drill-down
    params.append('drillDown', 'true');
    params.append('source', 'ceo-dashboard');
    
    return params.toString();
  }

  /**
   * Gera opções de drill-down baseadas em métrica
   * ISOLADO - geração própria
   */
  static generateDrillDownOptions(metric: string, value: number, period: any): DrillDownOptions[] {
    const options: DrillDownOptions[] = [];
    
    switch (metric) {
      case 'totalRevenue':
        options.push({
          targetDashboard: 'vendas',
          filters: { 
            status: 'completed',
            minValue: value * 0.8,
            maxValue: value * 1.2
          },
          period,
          metrics: ['revenue', 'orders', 'averageTicket']
        });
        break;
        
      case 'customerAcquisitionCost':
        options.push({
          targetDashboard: 'vendedores',
          filters: { 
            performance: 'high',
            minSales: value * 0.5
          },
          period,
          metrics: ['sales', 'conversion', 'leads']
        });
        break;
        
      case 'defaultRate':
        options.push({
          targetDashboard: 'atendimentos',
          filters: { 
            status: 'pending',
            priority: 'high'
          },
          period,
          metrics: ['tickets', 'resolution', 'satisfaction']
        });
        break;
        
      case 'growthRate':
        options.push({
          targetDashboard: 'consultores',
          filters: { 
            performance: 'excellent',
            minClients: 10
          },
          period,
          metrics: ['clients', 'revenue', 'satisfaction']
        });
        break;
    }
    
    return options;
  }

  /**
   * Obtém dados de comparação com metas
   * ISOLADO - comparação própria
   */
  static async getTargetComparison(metric: string, currentValue: number, period: any): Promise<TargetComparison> {
    try {
      // Simulação de dados de meta
      // Em produção, buscar do banco de dados
      const targets = this.getDefaultTargets();
      const target = targets[metric] || { value: 0, trend: 'stable' };
      
      const variance = currentValue - target.value;
      const achievement = target.value > 0 ? (currentValue / target.value) * 100 : 0;
      
      let status: 'achieved' | 'partial' | 'not_achieved';
      if (achievement >= 100) status = 'achieved';
      else if (achievement >= 80) status = 'partial';
      else status = 'not_achieved';
      
      return {
        metric,
        currentValue,
        targetValue: target.value,
        variance,
        achievement,
        status,
        trend: this.calculateTrend(currentValue, target.value)
      };
    } catch (error) {
      console.error('Erro ao obter comparação com metas:', error);
      throw new Error('Falha na comparação com metas');
    }
  }

  /**
   * Obtém metas padrão
   * ISOLADO - metas próprias
   */
  private static getDefaultTargets(): Record<string, { value: number; trend: string }> {
    return {
      'totalRevenue': { value: 1000000, trend: 'up' },
      'profitMargin': { value: 15, trend: 'up' },
      'customerAcquisitionCost': { value: 500, trend: 'down' },
      'defaultRate': { value: 0.05, trend: 'down' },
      'growthRate': { value: 0.1, trend: 'up' },
      'liquidityRatio': { value: 2.0, trend: 'stable' },
      'churnRate': { value: 0.05, trend: 'down' },
      'retentionRate': { value: 0.95, trend: 'up' }
    };
  }

  /**
   * Calcula tendência baseada em valores
   * ISOLADO - cálculo próprio
   */
  private static calculateTrend(current: number, target: number): 'up' | 'down' | 'stable' {
    const variance = ((current - target) / target) * 100;
    
    if (variance > 5) return 'up';
    if (variance < -5) return 'down';
    return 'stable';
  }

  /**
   * Obtém histórico de drill-downs
   * ISOLADO - histórico próprio
   */
  static getDrillDownHistory(): Array<{
    id: string;
    dashboard: string;
    metric: string;
    timestamp: string;
    filters: Record<string, any>;
  }> {
    try {
      const history = localStorage.getItem('ceo-drilldown-history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Erro ao obter histórico de drill-down:', error);
      return [];
    }
  }

  /**
   * Salva drill-down no histórico
   * ISOLADO - armazenamento próprio
   */
  static saveDrillDownToHistory(options: DrillDownOptions, metric: string): void {
    try {
      const history = this.getDrillDownHistory();
      const newEntry = {
        id: `drilldown-${Date.now()}`,
        dashboard: options.targetDashboard,
        metric,
        timestamp: new Date().toISOString(),
        filters: options.filters
      };
      
      history.unshift(newEntry);
      
      // Manter apenas os últimos 50 drill-downs
      if (history.length > 50) {
        history.splice(50);
      }
      
      localStorage.setItem('ceo-drilldown-history', JSON.stringify(history));
    } catch (error) {
      console.error('Erro ao salvar drill-down no histórico:', error);
    }
  }

  /**
   * Obtém estatísticas de drill-down
   * ISOLADO - métricas próprias
   */
  static getDrillDownStats(): {
    totalDrillDowns: number;
    mostAccessedDashboard: string;
    mostAccessedMetric: string;
    lastDrillDown: string | null;
  } {
    const history = this.getDrillDownHistory();
    
    if (history.length === 0) {
      return {
        totalDrillDowns: 0,
        mostAccessedDashboard: '',
        mostAccessedMetric: '',
        lastDrillDown: null
      };
    }
    
    // Contar dashboards mais acessados
    const dashboardCounts = history.reduce((acc, item) => {
      acc[item.dashboard] = (acc[item.dashboard] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Contar métricas mais acessadas
    const metricCounts = history.reduce((acc, item) => {
      acc[item.metric] = (acc[item.metric] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostAccessedDashboard = Object.entries(dashboardCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    const mostAccessedMetric = Object.entries(metricCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    return {
      totalDrillDowns: history.length,
      mostAccessedDashboard,
      mostAccessedMetric,
      lastDrillDown: history[0]?.timestamp || null
    };
  }

  /**
   * Valida opções de drill-down
   * ISOLADO - validação própria
   */
  static validateDrillDownOptions(options: DrillDownOptions): boolean {
    if (!options.targetDashboard) return false;
    if (!options.period) return false;
    if (!options.period.startDate || !options.period.endDate) return false;
    if (!Array.isArray(options.metrics)) return false;
    if (!options.filters || typeof options.filters !== 'object') return false;
    
    return true;
  }

  /**
   * Obtém sugestões de drill-down baseadas em contexto
   * ISOLADO - sugestões próprias
   */
  static getDrillDownSuggestions(context: {
    currentMetric: string;
    currentValue: number;
    trend: 'up' | 'down' | 'stable';
    period: any;
  }): Array<{
    title: string;
    description: string;
    options: DrillDownOptions;
    priority: 'high' | 'medium' | 'low';
  }> {
    const suggestions = [];
    
    // Sugestões baseadas na métrica atual
    if (context.currentMetric === 'totalRevenue' && context.trend === 'down') {
      suggestions.push({
        title: 'Analisar Vendas por Vendedor',
        description: 'Verificar performance individual dos vendedores',
        options: {
          targetDashboard: 'vendedores',
          filters: { performance: 'low' },
          period: context.period,
          metrics: ['sales', 'conversion', 'leads']
        },
        priority: 'high'
      });
    }
    
    if (context.currentMetric === 'defaultRate' && context.trend === 'up') {
      suggestions.push({
        title: 'Revisar Atendimentos Pendentes',
        description: 'Verificar tickets de alta prioridade',
        options: {
          targetDashboard: 'atendimentos',
          filters: { status: 'pending', priority: 'high' },
          period: context.period,
          metrics: ['tickets', 'resolution', 'satisfaction']
        },
        priority: 'high'
      });
    }
    
    return suggestions;
  }
}

