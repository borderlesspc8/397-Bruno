/**
 * Sistema de Alertas Inteligentes - Dashboard CEO
 * 
 * Sistema completo de alertas com:
 * - Thresholds dinâmicos
 * - Alertas de tendência
 * - Detecção de anomalias estatísticas
 * - Alertas de metas não atingidas
 * - Sistema de priorização
 * - Histórico com resolução
 * 
 * @module CEOSmartAlerts
 * @isolated Não utiliza serviços externos
 */

// ==================== TIPOS E INTERFACES ====================

export enum CEOAlertType {
  THRESHOLD = 'threshold',
  TREND = 'trend',
  ANOMALY = 'anomaly',
  GOAL = 'goal',
  PREDICTION = 'prediction',
  CRITICAL = 'critical'
}

export enum CEOAlertSeverity {
  CRITICAL = 'critical',    // Requer ação imediata
  HIGH = 'high',           // Requer atenção urgente
  MEDIUM = 'medium',       // Requer atenção
  LOW = 'low',            // Informativo
  INFO = 'info'           // Apenas informação
}

export enum CEOAlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  EXPIRED = 'expired'
}

export enum CEOAlertCategory {
  REVENUE = 'revenue',
  COSTS = 'costs',
  PROFIT = 'profit',
  CASH_FLOW = 'cash_flow',
  CUSTOMERS = 'customers',
  OPERATIONS = 'operations',
  MARKETING = 'marketing',
  INVENTORY = 'inventory',
  FINANCIAL = 'financial'
}

export interface CEOAlert {
  id: string;
  type: CEOAlertType;
  severity: CEOAlertSeverity;
  status: CEOAlertStatus;
  category: CEOAlertCategory;
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  expectedValue?: number;
  threshold?: number;
  deviation?: number;
  trend?: 'up' | 'down' | 'stable';
  impact: string;
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  acknowledgedBy?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface CEOAlertRule {
  id: string;
  name: string;
  category: CEOAlertCategory;
  metric: string;
  enabled: boolean;
  thresholds: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  trendConfig?: {
    enabled: boolean;
    period: number; // dias
    minChange: number; // porcentagem mínima
  };
  anomalyConfig?: {
    enabled: boolean;
    sensitivity: number; // 1-10
    lookbackPeriod: number; // dias
  };
  goalConfig?: {
    enabled: boolean;
    target: number;
    period: 'daily' | 'weekly' | 'monthly';
  };
}

export interface CEOAlertStatistics {
  total: number;
  bySeverity: Record<CEOAlertSeverity, number>;
  byCategory: Record<CEOAlertCategory, number>;
  byStatus: Record<CEOAlertStatus, number>;
  active: number;
  resolved: number;
  averageResolutionTime: number; // em horas
  mostFrequentCategory: CEOAlertCategory;
  criticalUnresolved: number;
}

export interface CEOTrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  changePercentage: number;
  significance: 'high' | 'medium' | 'low';
  dataPoints: number;
  slope: number;
  confidence: number;
}

export interface CEOAnomalyDetection {
  isAnomaly: boolean;
  score: number; // 0-100
  expectedValue: number;
  actualValue: number;
  deviation: number;
  deviationPercentage: number;
  confidence: number;
}

// ==================== CLASSE PRINCIPAL ====================

export class CEOSmartAlertsService {
  private static instance: CEOSmartAlertsService;
  private alerts: Map<string, CEOAlert> = new Map();
  private rules: Map<string, CEOAlertRule> = new Map();
  private alertHistory: CEOAlert[] = [];
  private maxHistorySize = 1000;

  private constructor() {
    this.initializeDefaultRules();
    this.loadAlertsFromStorage();
  }

  public static getInstance(): CEOSmartAlertsService {
    if (!CEOSmartAlertsService.instance) {
      CEOSmartAlertsService.instance = new CEOSmartAlertsService();
    }
    return CEOSmartAlertsService.instance;
  }

  // ==================== INICIALIZAÇÃO ====================

  private initializeDefaultRules(): void {
    const defaultRules: CEOAlertRule[] = [
      {
        id: 'revenue-critical',
        name: 'Receita Crítica',
        category: CEOAlertCategory.REVENUE,
        metric: 'receita_total',
        enabled: true,
        thresholds: {
          critical: -30, // -30% da meta
          high: -20,
          medium: -10,
          low: -5
        },
        trendConfig: {
          enabled: true,
          period: 7,
          minChange: -15
        },
        anomalyConfig: {
          enabled: true,
          sensitivity: 7,
          lookbackPeriod: 30
        },
        goalConfig: {
          enabled: true,
          target: 100000,
          period: 'monthly'
        }
      },
      {
        id: 'profit-margin',
        name: 'Margem de Lucro',
        category: CEOAlertCategory.PROFIT,
        metric: 'margem_lucro',
        enabled: true,
        thresholds: {
          critical: 10, // abaixo de 10%
          high: 15,
          medium: 20,
          low: 25
        },
        trendConfig: {
          enabled: true,
          period: 14,
          minChange: -10
        },
        anomalyConfig: {
          enabled: true,
          sensitivity: 6,
          lookbackPeriod: 60
        }
      },
      {
        id: 'cash-flow-negative',
        name: 'Fluxo de Caixa Negativo',
        category: CEOAlertCategory.CASH_FLOW,
        metric: 'saldo_caixa',
        enabled: true,
        thresholds: {
          critical: 0, // saldo negativo
          high: 5000,
          medium: 10000,
          low: 20000
        },
        trendConfig: {
          enabled: true,
          period: 7,
          minChange: -20
        }
      },
      {
        id: 'cac-high',
        name: 'CAC Elevado',
        category: CEOAlertCategory.MARKETING,
        metric: 'cac',
        enabled: true,
        thresholds: {
          critical: 500, // R$ 500 por cliente
          high: 400,
          medium: 300,
          low: 200
        },
        trendConfig: {
          enabled: true,
          period: 30,
          minChange: 25
        }
      },
      {
        id: 'churn-rate',
        name: 'Taxa de Churn',
        category: CEOAlertCategory.CUSTOMERS,
        metric: 'churn_rate',
        enabled: true,
        thresholds: {
          critical: 10, // 10% ao mês
          high: 7,
          medium: 5,
          low: 3
        },
        trendConfig: {
          enabled: true,
          period: 30,
          minChange: 20
        }
      },
      {
        id: 'operational-efficiency',
        name: 'Eficiência Operacional',
        category: CEOAlertCategory.OPERATIONS,
        metric: 'eficiencia_operacional',
        enabled: true,
        thresholds: {
          critical: 50, // abaixo de 50%
          high: 60,
          medium: 70,
          low: 80
        },
        anomalyConfig: {
          enabled: true,
          sensitivity: 5,
          lookbackPeriod: 30
        }
      }
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  private loadAlertsFromStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const stored = localStorage.getItem('ceo_alerts');
      if (stored) {
        const data = JSON.parse(stored);
        data.alerts?.forEach((alert: any) => {
          this.alerts.set(alert.id, {
            ...alert,
            createdAt: new Date(alert.createdAt),
            updatedAt: new Date(alert.updatedAt),
            acknowledgedAt: alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : undefined,
            resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined,
            expiresAt: alert.expiresAt ? new Date(alert.expiresAt) : undefined
          });
        });
        this.alertHistory = data.history || [];
      }
    } catch (error) {
      console.error('Erro ao carregar alertas do storage:', error);
    }
  }

  private saveAlertsToStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      
      const data = {
        alerts: Array.from(this.alerts.values()),
        history: this.alertHistory.slice(-this.maxHistorySize)
      };
      localStorage.setItem('ceo_alerts', JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar alertas no storage:', error);
    }
  }

  // ==================== ANÁLISE E GERAÇÃO DE ALERTAS ====================

  /**
   * Analisa métricas e gera alertas automaticamente
   */
  public analyzeMetricsAndGenerateAlerts(
    metrics: Record<string, number>,
    historicalData?: Record<string, number[]>
  ): CEOAlert[] {
    const newAlerts: CEOAlert[] = [];

    this.rules.forEach(rule => {
      if (!rule.enabled) return;

      const currentValue = metrics[rule.metric];
      if (currentValue === undefined || currentValue === null) return;

      // Análise de thresholds
      const thresholdAlert = this.checkThreshold(rule, currentValue);
      if (thresholdAlert) {
        newAlerts.push(thresholdAlert);
      }

      // Análise de tendência
      if (rule.trendConfig?.enabled && historicalData?.[rule.metric]) {
        const trendAlert = this.checkTrend(rule, historicalData[rule.metric]);
        if (trendAlert) {
          newAlerts.push(trendAlert);
        }
      }

      // Análise de anomalias
      if (rule.anomalyConfig?.enabled && historicalData?.[rule.metric]) {
        const anomalyAlert = this.checkAnomaly(rule, currentValue, historicalData[rule.metric]);
        if (anomalyAlert) {
          newAlerts.push(anomalyAlert);
        }
      }

      // Análise de metas
      if (rule.goalConfig?.enabled) {
        const goalAlert = this.checkGoal(rule, currentValue);
        if (goalAlert) {
          newAlerts.push(goalAlert);
        }
      }
    });

    // Adicionar novos alertas ao sistema
    newAlerts.forEach(alert => {
      this.addAlert(alert);
    });

    return newAlerts;
  }

  /**
   * Verifica se valor está fora dos thresholds definidos
   */
  private checkThreshold(rule: CEOAlertRule, currentValue: number): CEOAlert | null {
    const { thresholds } = rule;
    let severity: CEOAlertSeverity | null = null;
    let thresholdValue: number | null = null;

    // Verificar thresholds em ordem de severidade
    if (thresholds.critical !== undefined && this.isThresholdBreached(currentValue, thresholds.critical, rule.category)) {
      severity = CEOAlertSeverity.CRITICAL;
      thresholdValue = thresholds.critical;
    } else if (thresholds.high !== undefined && this.isThresholdBreached(currentValue, thresholds.high, rule.category)) {
      severity = CEOAlertSeverity.HIGH;
      thresholdValue = thresholds.high;
    } else if (thresholds.medium !== undefined && this.isThresholdBreached(currentValue, thresholds.medium, rule.category)) {
      severity = CEOAlertSeverity.MEDIUM;
      thresholdValue = thresholds.medium;
    } else if (thresholds.low !== undefined && this.isThresholdBreached(currentValue, thresholds.low, rule.category)) {
      severity = CEOAlertSeverity.LOW;
      thresholdValue = thresholds.low;
    }

    if (!severity || thresholdValue === null) return null;

    // Verificar se já existe alerta similar ativo
    const existingAlert = this.findSimilarActiveAlert(rule.metric, CEOAlertType.THRESHOLD);
    if (existingAlert) return null;

    const deviation = this.calculateDeviation(currentValue, thresholdValue);
    const impact = this.calculateImpact(rule.category, deviation);
    const recommendations = this.generateRecommendations(rule.category, CEOAlertType.THRESHOLD, deviation);

    return {
      id: this.generateAlertId(),
      type: CEOAlertType.THRESHOLD,
      severity,
      status: CEOAlertStatus.ACTIVE,
      category: rule.category,
      title: `${rule.name} - Threshold Atingido`,
      description: `A métrica ${rule.metric} está em ${this.formatValue(currentValue, rule.category)}, ${deviation > 0 ? 'acima' : 'abaixo'} do limite de ${this.formatValue(thresholdValue, rule.category)}.`,
      metric: rule.metric,
      currentValue,
      threshold: thresholdValue,
      deviation,
      impact,
      recommendations,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    };
  }

  /**
   * Verifica se há tendência preocupante
   */
  private checkTrend(rule: CEOAlertRule, historicalData: number[]): CEOAlert | null {
    if (!rule.trendConfig) return null;

    const trendAnalysis = this.analyzeTrend(historicalData);
    const { direction, changePercentage, significance } = trendAnalysis;

    // Verificar se a mudança é significativa o suficiente
    if (Math.abs(changePercentage) < rule.trendConfig.minChange) return null;
    if (significance === 'low') return null;

    // Determinar se a tendência é negativa para esta métrica
    const isNegativeTrend = this.isNegativeTrendForMetric(rule.category, direction);
    if (!isNegativeTrend) return null;

    // Verificar alerta similar existente
    const existingAlert = this.findSimilarActiveAlert(rule.metric, CEOAlertType.TREND);
    if (existingAlert) return null;

    const severity = this.determineTrendSeverity(changePercentage, significance);
    const impact = this.calculateImpact(rule.category, changePercentage);
    const recommendations = this.generateRecommendations(rule.category, CEOAlertType.TREND, changePercentage);

    return {
      id: this.generateAlertId(),
      type: CEOAlertType.TREND,
      severity,
      status: CEOAlertStatus.ACTIVE,
      category: rule.category,
      title: `Tendência ${direction === 'down' ? 'Decrescente' : 'Crescente'} Detectada`,
      description: `A métrica ${rule.metric} apresenta tendência ${direction === 'down' ? 'de queda' : 'de crescimento'} de ${Math.abs(changePercentage).toFixed(1)}% nos últimos ${rule.trendConfig.period} dias.`,
      metric: rule.metric,
      currentValue: historicalData[historicalData.length - 1],
      expectedValue: historicalData[0],
      deviation: changePercentage,
      trend: direction,
      impact,
      recommendations,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        trendAnalysis,
        period: rule.trendConfig.period
      }
    };
  }

  /**
   * Detecta anomalias estatísticas
   */
  private checkAnomaly(rule: CEOAlertRule, currentValue: number, historicalData: number[]): CEOAlert | null {
    if (!rule.anomalyConfig) return null;

    const anomalyDetection = this.detectAnomaly(currentValue, historicalData, rule.anomalyConfig.sensitivity);
    
    if (!anomalyDetection.isAnomaly) return null;
    if (anomalyDetection.confidence < 0.7) return null; // Mínimo 70% de confiança

    // Verificar alerta similar existente
    const existingAlert = this.findSimilarActiveAlert(rule.metric, CEOAlertType.ANOMALY);
    if (existingAlert) return null;

    const severity = this.determineAnomalySeverity(anomalyDetection.score, anomalyDetection.confidence);
    const impact = this.calculateImpact(rule.category, anomalyDetection.deviationPercentage);
    const recommendations = this.generateRecommendations(rule.category, CEOAlertType.ANOMALY, anomalyDetection.deviationPercentage);

    return {
      id: this.generateAlertId(),
      type: CEOAlertType.ANOMALY,
      severity,
      status: CEOAlertStatus.ACTIVE,
      category: rule.category,
      title: `Anomalia Detectada em ${rule.name}`,
      description: `Valor anormal detectado para ${rule.metric}: ${this.formatValue(currentValue, rule.category)} (esperado: ${this.formatValue(anomalyDetection.expectedValue, rule.category)}). Desvio de ${anomalyDetection.deviationPercentage.toFixed(1)}%.`,
      metric: rule.metric,
      currentValue,
      expectedValue: anomalyDetection.expectedValue,
      deviation: anomalyDetection.deviationPercentage,
      impact,
      recommendations,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        anomalyDetection,
        confidence: anomalyDetection.confidence
      }
    };
  }

  /**
   * Verifica se meta não foi atingida
   */
  private checkGoal(rule: CEOAlertRule, currentValue: number): CEOAlert | null {
    if (!rule.goalConfig) return null;

    const target = rule.goalConfig.target;
    const achievement = (currentValue / target) * 100;

    // Só alertar se não atingiu pelo menos 70% da meta
    if (achievement >= 70) return null;

    // Verificar alerta similar existente
    const existingAlert = this.findSimilarActiveAlert(rule.metric, CEOAlertType.GOAL);
    if (existingAlert) return null;

    const severity = this.determineGoalSeverity(achievement);
    const gap = target - currentValue;
    const gapPercentage = ((gap / target) * 100);
    const impact = this.calculateImpact(rule.category, gapPercentage);
    const recommendations = this.generateRecommendations(rule.category, CEOAlertType.GOAL, gapPercentage);

    return {
      id: this.generateAlertId(),
      type: CEOAlertType.GOAL,
      severity,
      status: CEOAlertStatus.ACTIVE,
      category: rule.category,
      title: `Meta Não Atingida - ${rule.name}`,
      description: `A meta ${rule.goalConfig.period} de ${this.formatValue(target, rule.category)} não foi atingida. Realizado: ${this.formatValue(currentValue, rule.category)} (${achievement.toFixed(1)}% da meta).`,
      metric: rule.metric,
      currentValue,
      expectedValue: target,
      deviation: gapPercentage,
      impact,
      recommendations,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        target,
        achievement: achievement.toFixed(1),
        gap: this.formatValue(gap, rule.category),
        period: rule.goalConfig.period
      }
    };
  }

  // ==================== ANÁLISES ESTATÍSTICAS ====================

  /**
   * Analisa tendência de uma série temporal
   */
  public analyzeTrend(data: number[]): CEOTrendAnalysis {
    if (data.length < 2) {
      return {
        direction: 'stable',
        changePercentage: 0,
        significance: 'low',
        dataPoints: data.length,
        slope: 0,
        confidence: 0
      };
    }

    // Calcular regressão linear simples
    const n = data.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * data[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calcular R²
    const yMean = sumY / n;
    const ssTotal = data.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = data.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    
    // Calcular mudança percentual
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const changePercentage = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
    
    // Determinar direção
    let direction: 'up' | 'down' | 'stable';
    if (Math.abs(changePercentage) < 5) {
      direction = 'stable';
    } else {
      direction = changePercentage > 0 ? 'up' : 'down';
    }
    
    // Determinar significância baseada em R² e mudança percentual
    let significance: 'high' | 'medium' | 'low';
    if (rSquared > 0.7 && Math.abs(changePercentage) > 20) {
      significance = 'high';
    } else if (rSquared > 0.5 && Math.abs(changePercentage) > 10) {
      significance = 'medium';
    } else {
      significance = 'low';
    }
    
    return {
      direction,
      changePercentage,
      significance,
      dataPoints: n,
      slope,
      confidence: rSquared
    };
  }

  /**
   * Detecta anomalias usando método Z-Score modificado
   */
  public detectAnomaly(
    currentValue: number,
    historicalData: number[],
    sensitivity: number = 5
  ): CEOAnomalyDetection {
    if (historicalData.length < 5) {
      return {
        isAnomaly: false,
        score: 0,
        expectedValue: currentValue,
        actualValue: currentValue,
        deviation: 0,
        deviationPercentage: 0,
        confidence: 0
      };
    }

    // Calcular média e desvio padrão
    const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
    const stdDev = Math.sqrt(variance);
    
    // Calcular Z-Score
    const zScore = stdDev === 0 ? 0 : Math.abs((currentValue - mean) / stdDev);
    
    // Ajustar threshold baseado na sensibilidade (1-10)
    const threshold = 3 - (sensitivity - 5) * 0.2; // 2.2 a 3.8
    
    // Calcular desvio
    const deviation = currentValue - mean;
    const deviationPercentage = (deviation / Math.abs(mean)) * 100;
    
    // Calcular score de anomalia (0-100)
    const score = Math.min(100, (zScore / threshold) * 100);
    
    // Calcular confiança baseada no tamanho da amostra e consistência
    const sampleSizeConfidence = Math.min(1, historicalData.length / 30);
    const zScoreConfidence = Math.min(1, zScore / 5);
    const confidence = (sampleSizeConfidence + zScoreConfidence) / 2;
    
    return {
      isAnomaly: zScore > threshold,
      score,
      expectedValue: mean,
      actualValue: currentValue,
      deviation,
      deviationPercentage,
      confidence
    };
  }

  // ==================== GERENCIAMENTO DE ALERTAS ====================

  /**
   * Adiciona um novo alerta
   */
  public addAlert(alert: CEOAlert): void {
    this.alerts.set(alert.id, alert);
    this.saveAlertsToStorage();
  }

  /**
   * Reconhece um alerta
   */
  public acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = CEOAlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    alert.updatedAt = new Date();

    this.alerts.set(alertId, alert);
    this.saveAlertsToStorage();
    return true;
  }

  /**
   * Resolve um alerta
   */
  public resolveAlert(alertId: string, userId: string, notes?: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = CEOAlertStatus.RESOLVED;
    alert.resolvedAt = new Date();
    alert.resolvedBy = userId;
    alert.resolutionNotes = notes;
    alert.updatedAt = new Date();

    // Mover para histórico
    this.alertHistory.push({ ...alert });
    this.alerts.delete(alertId);
    
    this.saveAlertsToStorage();
    return true;
  }

  /**
   * Descarta um alerta
   */
  public dismissAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = CEOAlertStatus.DISMISSED;
    alert.updatedAt = new Date();

    this.alertHistory.push({ ...alert });
    this.alerts.delete(alertId);
    
    this.saveAlertsToStorage();
    return true;
  }

  /**
   * Obtém todos os alertas ativos
   */
  public getActiveAlerts(): CEOAlert[] {
    const now = new Date();
    const activeAlerts = Array.from(this.alerts.values()).filter(alert => {
      // Remover alertas expirados
      if (alert.expiresAt && alert.expiresAt < now) {
        alert.status = CEOAlertStatus.EXPIRED;
        this.alertHistory.push({ ...alert });
        this.alerts.delete(alert.id);
        return false;
      }
      return alert.status === CEOAlertStatus.ACTIVE || alert.status === CEOAlertStatus.ACKNOWLEDGED;
    });

    // Ordenar por prioridade (severidade) e data
    return activeAlerts.sort((a, b) => {
      const severityOrder = {
        [CEOAlertSeverity.CRITICAL]: 0,
        [CEOAlertSeverity.HIGH]: 1,
        [CEOAlertSeverity.MEDIUM]: 2,
        [CEOAlertSeverity.LOW]: 3,
        [CEOAlertSeverity.INFO]: 4
      };
      
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Obtém alertas por categoria
   */
  public getAlertsByCategory(category: CEOAlertCategory): CEOAlert[] {
    return this.getActiveAlerts().filter(alert => alert.category === category);
  }

  /**
   * Obtém alertas por severidade
   */
  public getAlertsBySeverity(severity: CEOAlertSeverity): CEOAlert[] {
    return this.getActiveAlerts().filter(alert => alert.severity === severity);
  }

  /**
   * Obtém histórico de alertas
   */
  public getAlertHistory(limit: number = 100): CEOAlert[] {
    return this.alertHistory.slice(-limit).reverse();
  }

  /**
   * Obtém estatísticas de alertas
   */
  public getAlertStatistics(): CEOAlertStatistics {
    const allAlerts = [...Array.from(this.alerts.values()), ...this.alertHistory];
    
    const stats: CEOAlertStatistics = {
      total: allAlerts.length,
      bySeverity: {
        [CEOAlertSeverity.CRITICAL]: 0,
        [CEOAlertSeverity.HIGH]: 0,
        [CEOAlertSeverity.MEDIUM]: 0,
        [CEOAlertSeverity.LOW]: 0,
        [CEOAlertSeverity.INFO]: 0
      },
      byCategory: {
        [CEOAlertCategory.REVENUE]: 0,
        [CEOAlertCategory.COSTS]: 0,
        [CEOAlertCategory.PROFIT]: 0,
        [CEOAlertCategory.CASH_FLOW]: 0,
        [CEOAlertCategory.CUSTOMERS]: 0,
        [CEOAlertCategory.OPERATIONS]: 0,
        [CEOAlertCategory.MARKETING]: 0,
        [CEOAlertCategory.INVENTORY]: 0,
        [CEOAlertCategory.FINANCIAL]: 0
      },
      byStatus: {
        [CEOAlertStatus.ACTIVE]: 0,
        [CEOAlertStatus.ACKNOWLEDGED]: 0,
        [CEOAlertStatus.RESOLVED]: 0,
        [CEOAlertStatus.DISMISSED]: 0,
        [CEOAlertStatus.EXPIRED]: 0
      },
      active: 0,
      resolved: 0,
      averageResolutionTime: 0,
      mostFrequentCategory: CEOAlertCategory.REVENUE,
      criticalUnresolved: 0
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    allAlerts.forEach(alert => {
      stats.bySeverity[alert.severity]++;
      stats.byCategory[alert.category]++;
      stats.byStatus[alert.status]++;

      if (alert.status === CEOAlertStatus.ACTIVE || alert.status === CEOAlertStatus.ACKNOWLEDGED) {
        stats.active++;
        if (alert.severity === CEOAlertSeverity.CRITICAL) {
          stats.criticalUnresolved++;
        }
      }

      if (alert.status === CEOAlertStatus.RESOLVED && alert.resolvedAt) {
        stats.resolved++;
        const resolutionTime = alert.resolvedAt.getTime() - alert.createdAt.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    if (resolvedCount > 0) {
      stats.averageResolutionTime = (totalResolutionTime / resolvedCount) / (1000 * 60 * 60); // em horas
    }

    // Encontrar categoria mais frequente
    let maxCount = 0;
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      if (count > maxCount) {
        maxCount = count;
        stats.mostFrequentCategory = category as CEOAlertCategory;
      }
    });

    return stats;
  }

  // ==================== UTILITÁRIOS PRIVADOS ====================

  private generateAlertId(): string {
    const timestamp = Date.now().toString(36);
    const counter = (CEOSmartAlertsService.alertIdCounter++).toString(36).padStart(4, '0');
    return `alert_${timestamp}_${counter}`;
  }

  private static alertIdCounter = 0;

  private findSimilarActiveAlert(metric: string, type: CEOAlertType): CEOAlert | undefined {
    return Array.from(this.alerts.values()).find(
      alert => alert.metric === metric && alert.type === type && alert.status === CEOAlertStatus.ACTIVE
    );
  }

  private isThresholdBreached(value: number, threshold: number, category: CEOAlertCategory): boolean {
    // Para algumas categorias, valores maiores são ruins (custos, CAC, churn)
    const higherIsBad = [
      CEOAlertCategory.COSTS,
      CEOAlertCategory.MARKETING,
      CEOAlertCategory.CUSTOMERS
    ].includes(category);

    return higherIsBad ? value >= threshold : value <= threshold;
  }

  private calculateDeviation(current: number, expected: number): number {
    if (expected === 0) return current === 0 ? 0 : 100;
    return ((current - expected) / Math.abs(expected)) * 100;
  }

  private isNegativeTrendForMetric(category: CEOAlertCategory, direction: 'up' | 'down' | 'stable'): boolean {
    const downIsBad = [
      CEOAlertCategory.REVENUE,
      CEOAlertCategory.PROFIT,
      CEOAlertCategory.CASH_FLOW,
      CEOAlertCategory.FINANCIAL
    ];

    const upIsBad = [
      CEOAlertCategory.COSTS,
      CEOAlertCategory.MARKETING // CAC subindo
    ];

    if (direction === 'stable') return false;
    if (direction === 'down') return downIsBad.includes(category);
    if (direction === 'up') return upIsBad.includes(category);
    
    return false;
  }

  private determineTrendSeverity(changePercentage: number, significance: 'high' | 'medium' | 'low'): CEOAlertSeverity {
    const absChange = Math.abs(changePercentage);
    
    if (significance === 'high' && absChange > 30) return CEOAlertSeverity.CRITICAL;
    if (significance === 'high' && absChange > 20) return CEOAlertSeverity.HIGH;
    if (significance === 'medium' && absChange > 25) return CEOAlertSeverity.HIGH;
    if (significance === 'medium' || absChange > 15) return CEOAlertSeverity.MEDIUM;
    
    return CEOAlertSeverity.LOW;
  }

  private determineAnomalySeverity(score: number, confidence: number): CEOAlertSeverity {
    if (confidence > 0.9 && score > 80) return CEOAlertSeverity.CRITICAL;
    if (confidence > 0.8 && score > 70) return CEOAlertSeverity.HIGH;
    if (confidence > 0.7 && score > 60) return CEOAlertSeverity.MEDIUM;
    
    return CEOAlertSeverity.LOW;
  }

  private determineGoalSeverity(achievement: number): CEOAlertSeverity {
    if (achievement < 50) return CEOAlertSeverity.CRITICAL;
    if (achievement < 60) return CEOAlertSeverity.HIGH;
    if (achievement < 70) return CEOAlertSeverity.MEDIUM;
    
    return CEOAlertSeverity.LOW;
  }

  private calculateImpact(category: CEOAlertCategory, deviationPercentage: number): string {
    const absDeviation = Math.abs(deviationPercentage);
    
    const impacts: Record<CEOAlertCategory, { critical: string; high: string; medium: string; low: string }> = {
      [CEOAlertCategory.REVENUE]: {
        critical: 'Impacto crítico na receita e sustentabilidade do negócio',
        high: 'Alto impacto na receita e metas financeiras',
        medium: 'Impacto moderado nas metas de receita',
        low: 'Impacto baixo, requer monitoramento'
      },
      [CEOAlertCategory.COSTS]: {
        critical: 'Custos críticos ameaçando margem de lucro',
        high: 'Custos elevados comprometendo rentabilidade',
        medium: 'Aumento de custos requer atenção',
        low: 'Variação normal de custos'
      },
      [CEOAlertCategory.PROFIT]: {
        critical: 'Margem de lucro crítica, ação imediata necessária',
        high: 'Lucratividade comprometida',
        medium: 'Pressão sobre margem de lucro',
        low: 'Leve redução de margem'
      },
      [CEOAlertCategory.CASH_FLOW]: {
        critical: 'Caixa crítico, risco de insolvência',
        high: 'Problemas sérios de liquidez',
        medium: 'Atenção ao fluxo de caixa necessária',
        low: 'Monitoramento de caixa recomendado'
      },
      [CEOAlertCategory.CUSTOMERS]: {
        critical: 'Perda crítica de clientes',
        high: 'Taxa de churn preocupante',
        medium: 'Retenção de clientes requer atenção',
        low: 'Variação normal de base de clientes'
      },
      [CEOAlertCategory.OPERATIONS]: {
        critical: 'Eficiência operacional crítica',
        high: 'Problemas operacionais significativos',
        medium: 'Oportunidades de melhoria operacional',
        low: 'Pequenos ajustes operacionais necessários'
      },
      [CEOAlertCategory.MARKETING]: {
        critical: 'CAC insustentável',
        high: 'Eficiência de marketing comprometida',
        medium: 'ROI de marketing abaixo do esperado',
        low: 'Otimização de marketing recomendada'
      },
      [CEOAlertCategory.INVENTORY]: {
        critical: 'Ruptura ou excesso crítico de estoque',
        high: 'Problemas significativos de inventário',
        medium: 'Ajustes de estoque necessários',
        low: 'Monitoramento de estoque recomendado'
      },
      [CEOAlertCategory.FINANCIAL]: {
        critical: 'Saúde financeira crítica',
        high: 'Indicadores financeiros preocupantes',
        medium: 'Atenção a métricas financeiras',
        low: 'Monitoramento financeiro de rotina'
      }
    };

    if (absDeviation > 30) return impacts[category].critical;
    if (absDeviation > 20) return impacts[category].high;
    if (absDeviation > 10) return impacts[category].medium;
    return impacts[category].low;
  }

  private generateRecommendations(
    category: CEOAlertCategory,
    type: CEOAlertType,
    deviation: number
  ): string[] {
    const recommendations: Record<CEOAlertCategory, string[]> = {
      [CEOAlertCategory.REVENUE]: [
        'Revisar estratégia de precificação',
        'Intensificar ações de marketing e vendas',
        'Analisar perdas de clientes e oportunidades',
        'Diversificar fontes de receita',
        'Implementar promoções estratégicas'
      ],
      [CEOAlertCategory.COSTS]: [
        'Renegociar contratos com fornecedores',
        'Otimizar processos operacionais',
        'Reduzir desperdícios e ineficiências',
        'Revisar estrutura de custos fixos',
        'Implementar controles de gastos mais rígidos'
      ],
      [CEOAlertCategory.PROFIT]: [
        'Aumentar margem de contribuição dos produtos',
        'Reduzir custos variáveis',
        'Focar em produtos mais rentáveis',
        'Revisar política de descontos',
        'Otimizar mix de produtos'
      ],
      [CEOAlertCategory.CASH_FLOW]: [
        'Acelerar recebimentos (reduzir prazo)',
        'Negociar prazos maiores com fornecedores',
        'Reduzir estoque parado',
        'Buscar linhas de crédito emergenciais',
        'Postergar investimentos não essenciais'
      ],
      [CEOAlertCategory.CUSTOMERS]: [
        'Implementar programa de retenção',
        'Melhorar atendimento e experiência do cliente',
        'Oferecer benefícios de fidelidade',
        'Entender motivos de cancelamento',
        'Reativar clientes inativos'
      ],
      [CEOAlertCategory.OPERATIONS]: [
        'Automatizar processos manuais',
        'Treinar equipe em melhores práticas',
        'Implementar KPIs operacionais',
        'Revisar fluxos de trabalho',
        'Investir em tecnologia'
      ],
      [CEOAlertCategory.MARKETING]: [
        'Otimizar canais de aquisição',
        'Melhorar taxa de conversão',
        'Reduzir investimento em canais ineficientes',
        'Implementar marketing de conteúdo',
        'Focar em campanhas de alto ROI'
      ],
      [CEOAlertCategory.INVENTORY]: [
        'Ajustar política de reposição',
        'Implementar just-in-time',
        'Liquidar itens parados',
        'Melhorar previsão de demanda',
        'Reduzir lote mínimo de compra'
      ],
      [CEOAlertCategory.FINANCIAL]: [
        'Revisar estrutura de capital',
        'Melhorar gestão de riscos',
        'Diversificar fontes de financiamento',
        'Implementar planejamento financeiro',
        'Monitorar indicadores-chave diariamente'
      ]
    };

    const baseRecommendations = recommendations[category] || [];
    
    // Adicionar recomendações específicas por tipo de alerta
    if (type === CEOAlertType.TREND && Math.abs(deviation) > 20) {
      baseRecommendations.unshift('Ação urgente necessária para reverter tendência');
    }
    
    if (type === CEOAlertType.ANOMALY) {
      baseRecommendations.unshift('Investigar causa raiz da anomalia imediatamente');
    }
    
    return baseRecommendations.slice(0, 5);
  }

  private formatValue(value: number, category: CEOAlertCategory): string {
    const isPercentage = [
      CEOAlertCategory.PROFIT,
      CEOAlertCategory.CUSTOMERS
    ].includes(category);

    const isCurrency = [
      CEOAlertCategory.REVENUE,
      CEOAlertCategory.COSTS,
      CEOAlertCategory.CASH_FLOW,
      CEOAlertCategory.FINANCIAL,
      CEOAlertCategory.MARKETING
    ].includes(category);

    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }

    if (isCurrency) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }

    return value.toFixed(2);
  }

  // ==================== GERENCIAMENTO DE REGRAS ====================

  /**
   * Adiciona ou atualiza uma regra de alerta
   */
  public upsertRule(rule: CEOAlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove uma regra de alerta
   */
  public removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /**
   * Obtém todas as regras
   */
  public getRules(): CEOAlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Habilita ou desabilita uma regra
   */
  public toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = enabled;
    this.rules.set(ruleId, rule);
    return true;
  }

  // ==================== LIMPEZA ====================

  /**
   * Limpa alertas expirados e antigos do histórico
   */
  public cleanup(): void {
    const now = new Date();
    const maxHistoryAge = 90 * 24 * 60 * 60 * 1000; // 90 dias

    // Remover alertas expirados
    this.alerts.forEach((alert, id) => {
      if (alert.expiresAt && alert.expiresAt < now) {
        alert.status = CEOAlertStatus.EXPIRED;
        this.alertHistory.push({ ...alert });
        this.alerts.delete(id);
      }
    });

    // Limpar histórico antigo
    this.alertHistory = this.alertHistory.filter(alert => {
      const age = now.getTime() - alert.createdAt.getTime();
      return age < maxHistoryAge;
    });

    this.saveAlertsToStorage();
  }

  /**
   * Reseta todos os alertas (usar com cautela)
   */
  public resetAllAlerts(): void {
    this.alerts.clear();
    this.alertHistory = [];
    this.saveAlertsToStorage();
  }
}

// ==================== EXPORTAÇÕES ====================

export default CEOSmartAlertsService.getInstance();

