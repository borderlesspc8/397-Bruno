// FASE 4: Análise de Crescimento - Serviço ISOLADO para Dashboard CEO
// ISOLADO - não compartilha lógica com outros dashboards

import {
  CEODashboardParams,
  DetailedGrowthAnalysis,
  DetailedGrowthData,
  GrowthBySegment,
  GrowthByProduct,
  GrowthByRegion,
  GrowthDriver,
  GrowthBarrier,
  MarketAnalysis,
  MarketTrend,
  CompetitiveAnalysis,
  Competitor,
  CompetitivePosition,
  CompetitiveAdvantage,
  CompetitiveThreat,
  CapacityAnalysis,
  CapacityConstraint,
  ExpansionOption,
  GrowthProjection,
  GrowthData,
  TargetData,
  MarketShareData
} from '../types/ceo-dashboard.types';

export class CEOGrowthService {
  private static readonly CACHE_KEY_PREFIX = 'ceo_growth_';
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

  /**
   * Obtém análise completa de crescimento para o Dashboard CEO
   * ISOLADO - processamento próprio independente
   */
  static async getGrowthAnalysis(params: CEODashboardParams): Promise<DetailedGrowthAnalysis> {
    const cacheKey = `${this.CACHE_KEY_PREFIX}analysis_${params.startDate.toISOString()}_${params.endDate.toISOString()}`;
    
    try {
      // Verificar cache primeiro
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached as DetailedGrowthAnalysis;
      }

      // Processar métricas de crescimento
      const growthMetrics = await this.getDetailedGrowthMetrics(params);
      
      // Processar análise de mercado
      const marketAnalysis = await this.getMarketAnalysis(params);
      
      // Processar análise competitiva
      const competitiveAnalysis = await this.getCompetitiveAnalysis(params);
      
      // Processar análise de capacidade
      const capacityAnalysis = await this.getCapacityAnalysis(params);
      
      // Processar projeções de crescimento
      const growthProjections = await this.getGrowthProjections(params);

      // Métricas básicas de crescimento
      const basicGrowthData = await this.getBasicGrowthData(params);
      const targetComparison = await this.getTargetComparison(params);
      const marketShare = await this.getMarketShareData(params);

      const result: DetailedGrowthAnalysis = {
        growthMetrics: basicGrowthData,
        targetComparison,
        marketShare,
        growthMetrics,
        marketAnalysis,
        competitiveAnalysis,
        capacityAnalysis,
        growthProjections
      };

      // Salvar no cache
      this.saveToCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Erro na análise de crescimento CEO:', error);
      throw new Error('Falha ao obter análise de crescimento');
    }
  }

  /**
   * Métricas básicas de crescimento
   * ISOLADO - cálculos próprios de crescimento
   */
  private static async getBasicGrowthData(params: CEODashboardParams): Promise<GrowthData> {
    try {
      // Simular cálculos de crescimento - em produção viria do banco
      const currentRevenue = 1200000;
      const previousRevenue = 1050000;
      const previousMonthRevenue = 1150000;
      
      const monthOverMonth = ((currentRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
      const yearOverYear = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
      
      // Calcular crescimento composto (CAGR)
      const periods = this.calculatePeriods(params.startDate, params.endDate);
      const compoundGrowth = (Math.pow(currentRevenue / previousRevenue, 1 / periods) - 1) * 100;
      
      // Calcular crescimento médio
      const averageGrowth = (monthOverMonth + yearOverYear) / 2;

      return {
        monthOverMonth,
        yearOverYear,
        compoundGrowth,
        averageGrowth
      };
    } catch (error) {
      console.error('Erro nas métricas básicas de crescimento:', error);
      throw new Error('Falha ao obter métricas básicas de crescimento');
    }
  }

  /**
   * Métricas detalhadas de crescimento
   */
  private static async getDetailedGrowthMetrics(params: CEODashboardParams): Promise<DetailedGrowthData> {
    try {
      const growthBySegment = await this.getGrowthBySegment(params);
      const growthByProduct = await this.getGrowthByProduct(params);
      const growthByRegion = await this.getGrowthByRegion(params);
      const growthDrivers = await this.getGrowthDrivers(params);
      const growthBarriers = await this.getGrowthBarriers(params);

      const basicGrowth = await this.getBasicGrowthData(params);

      return {
        ...basicGrowth,
        growthBySegment,
        growthByProduct,
        growthByRegion,
        growthDrivers,
        growthBarriers
      };
    } catch (error) {
      console.error('Erro nas métricas detalhadas de crescimento:', error);
      throw new Error('Falha ao obter métricas detalhadas de crescimento');
    }
  }

  /**
   * Crescimento por segmento
   */
  private static async getGrowthBySegment(params: CEODashboardParams): Promise<GrowthBySegment[]> {
    return [
      {
        segment: 'E-commerce',
        currentGrowth: 25.3,
        previousGrowth: 18.7,
        marketSize: 5000000,
        penetration: 12.5
      },
      {
        segment: 'Varejo Físico',
        currentGrowth: 8.2,
        previousGrowth: 12.1,
        marketSize: 8000000,
        penetration: 8.8
      },
      {
        segment: 'Atacado',
        currentGrowth: 15.7,
        previousGrowth: 14.3,
        marketSize: 3000000,
        penetration: 15.2
      },
      {
        segment: 'B2B',
        currentGrowth: 32.1,
        previousGrowth: 28.5,
        marketSize: 2000000,
        penetration: 18.9
      }
    ];
  }

  /**
   * Crescimento por produto
   */
  private static async getGrowthByProduct(params: CEODashboardParams): Promise<GrowthByProduct[]> {
    return [
      {
        product: 'Produto Premium',
        currentGrowth: 45.2,
        previousGrowth: 38.7,
        lifecycle: 'growth' as const,
        marketShare: 22.3
      },
      {
        product: 'Produto Standard',
        currentGrowth: 12.8,
        previousGrowth: 15.2,
        lifecycle: 'maturity' as const,
        marketShare: 35.7
      },
      {
        product: 'Produto Básico',
        currentGrowth: -5.3,
        previousGrowth: -2.1,
        lifecycle: 'decline' as const,
        marketShare: 18.9
      },
      {
        product: 'Novo Produto',
        currentGrowth: 180.5,
        previousGrowth: 95.3,
        lifecycle: 'introduction' as const,
        marketShare: 3.2
      }
    ];
  }

  /**
   * Crescimento por região
   */
  private static async getGrowthByRegion(params: CEODashboardParams): Promise<GrowthByRegion[]> {
    return [
      {
        region: 'Sudeste',
        currentGrowth: 18.5,
        previousGrowth: 15.8,
        population: 85000000,
        gdp: 1200000000000
      },
      {
        region: 'Sul',
        currentGrowth: 22.1,
        previousGrowth: 19.3,
        population: 30000000,
        gdp: 450000000000
      },
      {
        region: 'Nordeste',
        currentGrowth: 28.7,
        previousGrowth: 25.2,
        population: 57000000,
        gdp: 380000000000
      },
      {
        region: 'Norte',
        currentGrowth: 35.2,
        previousGrowth: 31.8,
        population: 18000000,
        gdp: 120000000000
      },
      {
        region: 'Centro-Oeste',
        currentGrowth: 26.8,
        previousGrowth: 23.5,
        population: 16000000,
        gdp: 180000000000
      }
    ];
  }

  /**
   * Drivers de crescimento
   */
  private static async getGrowthDrivers(params: CEODashboardParams): Promise<GrowthDriver[]> {
    return [
      {
        driver: 'Expansão Digital',
        impact: 85,
        sustainability: 'high' as const,
        cost: 150000
      },
      {
        driver: 'Novos Produtos',
        impact: 72,
        sustainability: 'high' as const,
        cost: 280000
      },
      {
        driver: 'Expansão Geográfica',
        impact: 68,
        sustainability: 'medium' as const,
        cost: 420000
      },
      {
        driver: 'Parcerias Estratégicas',
        impact: 55,
        sustainability: 'high' as const,
        cost: 95000
      },
      {
        driver: 'Marketing Digital',
        impact: 48,
        sustainability: 'medium' as const,
        cost: 180000
      }
    ];
  }

  /**
   * Barreiras ao crescimento
   */
  private static async getGrowthBarriers(params: CEODashboardParams): Promise<GrowthBarrier[]> {
    return [
      {
        barrier: 'Capacidade de Produção',
        impact: 65,
        probability: 0.8,
        mitigation: [
          'Investimento em automação',
          'Terceirização de produção',
          'Expansão de instalações'
        ]
      },
      {
        barrier: 'Recursos Humanos',
        impact: 58,
        probability: 0.7,
        mitigation: [
          'Programa de treinamento',
          'Contratação de especialistas',
          'Retenção de talentos'
        ]
      },
      {
        barrier: 'Regulamentações',
        impact: 42,
        probability: 0.4,
        mitigation: [
          'Compliance proativo',
          'Consultoria jurídica',
          'Monitoramento regulatório'
        ]
      },
      {
        barrier: 'Concorrência',
        impact: 78,
        probability: 0.9,
        mitigation: [
          'Diferenciação de produtos',
          'Preços competitivos',
          'Excelência no atendimento'
        ]
      }
    ];
  }

  /**
   * Comparação com metas
   */
  private static async getTargetComparison(params: CEODashboardParams): Promise<TargetData> {
    const revenueTarget = 1250000;
    const actualRevenue = 1200000;
    const variance = actualRevenue - revenueTarget;
    const achievement = (actualRevenue / revenueTarget) * 100;

    return {
      revenueTarget,
      actualRevenue,
      variance,
      achievement
    };
  }

  /**
   * Dados de participação no mercado
   */
  private static async getMarketShareData(params: CEODashboardParams): Promise<MarketShareData> {
    const current = 15.8;
    const previous = 14.2;
    const change = current - previous;
    const trend = change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'stable' as const;

    return {
      current,
      previous,
      change,
      trend
    };
  }

  /**
   * Análise de mercado
   */
  private static async getMarketAnalysis(params: CEODashboardParams): Promise<MarketAnalysis> {
    const marketTrends: MarketTrend[] = [
      {
        trend: 'Crescimento do E-commerce',
        impact: 'positive' as const,
        timeframe: 'long' as const,
        probability: 0.95
      },
      {
        trend: 'Digitalização de Processos',
        impact: 'positive' as const,
        timeframe: 'medium' as const,
        probability: 0.88
      },
      {
        trend: 'Sustentabilidade',
        impact: 'positive' as const,
        timeframe: 'long' as const,
        probability: 0.92
      },
      {
        trend: 'Regulamentações ESG',
        impact: 'negative' as const,
        timeframe: 'medium' as const,
        probability: 0.65
      },
      {
        trend: 'Inflação',
        impact: 'negative' as const,
        timeframe: 'short' as const,
        probability: 0.75
      }
    ];

    return {
      marketSize: 15000000,
      marketGrowth: 8.5,
      marketShare: 15.8,
      marketPosition: 'challenger' as const,
      marketTrends
    };
  }

  /**
   * Análise competitiva
   */
  private static async getCompetitiveAnalysis(params: CEODashboardParams): Promise<CompetitiveAnalysis> {
    const competitors: Competitor[] = [
      {
        name: 'Concorrente A',
        marketShare: 25.3,
        growth: 12.5,
        strengths: ['Marca forte', 'Rede ampla', 'Preços competitivos'],
        weaknesses: ['Inovação limitada', 'Atendimento precário']
      },
      {
        name: 'Concorrente B',
        marketShare: 18.7,
        growth: 8.2,
        strengths: ['Tecnologia avançada', 'Qualidade superior'],
        weaknesses: ['Preços altos', 'Cobertura limitada']
      },
      {
        name: 'Concorrente C',
        marketShare: 12.1,
        growth: 15.8,
        strengths: ['Foco em nicho', 'Agilidade'],
        weaknesses: ['Recursos limitados', 'Escalabilidade']
      }
    ];

    const competitivePosition: CompetitivePosition = {
      position: 2,
      totalCompetitors: 8,
      relativePosition: 'strong' as const
    };

    const competitiveAdvantages: CompetitiveAdvantage[] = [
      {
        advantage: 'Excelência no Atendimento',
        sustainability: 'high' as const,
        value: 85
      },
      {
        advantage: 'Inovação Tecnológica',
        sustainability: 'high' as const,
        value: 78
      },
      {
        advantage: 'Cobertura Nacional',
        sustainability: 'medium' as const,
        value: 65
      },
      {
        advantage: 'Preços Competitivos',
        sustainability: 'medium' as const,
        value: 72
      }
    ];

    const threats: CompetitiveThreat[] = [
      {
        threat: 'Entrada de Grande Multinacional',
        probability: 0.6,
        impact: 85,
        timeframe: 'medium' as const
      },
      {
        threat: 'Disrupção Tecnológica',
        probability: 0.4,
        impact: 75,
        timeframe: 'long' as const
      },
      {
        threat: 'Guerra de Preços',
        probability: 0.7,
        impact: 60,
        timeframe: 'short' as const
      }
    ];

    return {
      competitors,
      competitivePosition,
      competitiveAdvantages,
      threats
    };
  }

  /**
   * Análise de capacidade
   */
  private static async getCapacityAnalysis(params: CEODashboardParams): Promise<CapacityAnalysis> {
    const capacityConstraints: CapacityConstraint[] = [
      {
        constraint: 'Capacidade de Produção',
        impact: 75,
        timeline: '6 meses',
        solution: 'Expansão da fábrica'
      },
      {
        constraint: 'Recursos Humanos Qualificados',
        impact: 65,
        timeline: '3 meses',
        solution: 'Programa de recrutamento'
      },
      {
        constraint: 'Infraestrutura de TI',
        impact: 45,
        timeline: '4 meses',
        solution: 'Upgrade de sistemas'
      }
    ];

    const expansionOptions: ExpansionOption[] = [
      {
        option: 'Nova Unidade Industrial',
        cost: 2500000,
        timeline: '12 meses',
        capacityIncrease: 150,
        roi: 18.5
      },
      {
        option: 'Automação de Processos',
        cost: 1800000,
        timeline: '8 meses',
        capacityIncrease: 80,
        roi: 22.3
      },
      {
        option: 'Terceirização',
        cost: 800000,
        timeline: '3 meses',
        capacityIncrease: 60,
        roi: 15.7
      }
    ];

    return {
      currentCapacity: 1000000,
      capacityUtilization: 87.5,
      capacityConstraints,
      expansionOptions
    };
  }

  /**
   * Projeções de crescimento
   */
  private static async getGrowthProjections(params: CEODashboardParams): Promise<GrowthProjection[]> {
    return [
      {
        year: 2025,
        projectedRevenue: 1450000,
        projectedGrowth: 20.8,
        confidence: 85,
        keyAssumptions: [
          'Manutenção da taxa de crescimento atual',
          'Expansão para 2 novas regiões',
          'Lançamento de 3 novos produtos'
        ]
      },
      {
        year: 2026,
        projectedRevenue: 1750000,
        projectedGrowth: 20.7,
        confidence: 78,
        keyAssumptions: [
          'Consolidação nas novas regiões',
          'Aumento da participação de mercado',
          'Eficiência operacional melhorada'
        ]
      },
      {
        year: 2027,
        projectedRevenue: 2100000,
        projectedGrowth: 20.0,
        confidence: 72,
        keyAssumptions: [
          'Maturidade do mercado',
          'Foco em produtos premium',
          'Expansão internacional'
        ]
      }
    ];
  }

  /**
   * Obtém métricas de crescimento específicas
   * ISOLADO - cálculos próprios de crescimento MoM e YoY
   */
  static async getGrowthMetrics(params: CEODashboardParams): Promise<{ monthOverMonth: number; yearOverYear: number }> {
    try {
      // Simular dados de receita - em produção viria do banco
      const currentMonth = 1200000;
      const previousMonth = 1150000;
      const sameMonthLastYear = 980000;

      const monthOverMonth = ((currentMonth - previousMonth) / previousMonth) * 100;
      const yearOverYear = ((currentMonth - sameMonthLastYear) / sameMonthLastYear) * 100;

      return {
        monthOverMonth: Number(monthOverMonth.toFixed(2)),
        yearOverYear: Number(yearOverYear.toFixed(2))
      };
    } catch (error) {
      console.error('Erro nas métricas de crescimento:', error);
      throw new Error('Falha ao obter métricas de crescimento');
    }
  }

  /**
   * Obtém comparação com metas
   * ISOLADO - cálculos próprios de comparação
   */
  static async getTargetComparison(params: CEODashboardParams): Promise<TargetData> {
    try {
      // Simular dados - em produção viria do banco
      const revenueTarget = 1250000;
      const actualRevenue = 1200000;
      const variance = actualRevenue - revenueTarget;
      const achievement = (actualRevenue / revenueTarget) * 100;

      return {
        revenueTarget,
        actualRevenue,
        variance,
        achievement
      };
    } catch (error) {
      console.error('Erro na comparação com metas:', error);
      throw new Error('Falha ao obter comparação com metas');
    }
  }

  // Métodos auxiliares

  private static calculatePeriods(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays / 365.25; // Converter para anos
  }

  private static getFromCache(key: string): any {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch {
      return null;
    }
  }

  private static saveToCache(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Erro ao salvar cache:', error);
    }
  }
}
