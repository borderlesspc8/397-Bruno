// Tipos EXCLUSIVOS para Dashboard CEO
// ISOLADO - não compartilha tipos com outros dashboards

export interface CEODashboardParams {
  startDate: Date;
  endDate: Date;
}

// Interface removida - usando a versão expandida da Fase 5 abaixo

export interface CEOOperationalMetrics {
  costRevenueRatio: number;
  customerAcquisitionCost: number;
  costCenterProfitability: CostCenterData[];
}

export interface CostCenterData {
  id: string;
  name: string;
  revenue: number;
  costs: number;
  profitability: number;
  margin: number;
}

export interface CEOFinancialAnalysis {
  seasonalAnalysis: SeasonalData[];
  liquidityIndicators: LiquidityData;
  simplifiedDRE: DREData;
  cashFlow: CashFlowData;
  seasonalPatterns: SeasonalPattern[];
  trendAnalysis: TrendData;
  workingCapitalAnalysis: WorkingCapitalAnalysis;
  detailedDRE: DetailedDREData;
  detailedCashFlow: DetailedCashFlowData;
}

export interface SeasonalData {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
  growth: number;
}

export interface LiquidityData {
  currentRatio: number;
  quickRatio: number;
  cashConversionCycle: number;
  workingCapital: number;
}

export interface DREData {
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingProfit: number;
  netProfit: number;
}

export interface CashFlowData {
  operating: number;
  investing: number;
  financing: number;
  netCashFlow: number;
}

export interface CEORiskAnalysis {
  defaultAnalysis: DefaultData;
  sustainability: SustainabilityData;
  predictability: PredictabilityData;
}

export interface DefaultData {
  defaultRate: number;
  agingAnalysis: AgingData[];
  riskIndicators: RiskIndicators;
}

export interface AgingData {
  period: string;
  amount: number;
  percentage: number;
}

export interface RiskIndicators {
  creditRisk: number;
  marketRisk: number;
  operationalRisk: number;
  liquidityRisk: number;
}

export interface SustainabilityData {
  debtToEquity: number;
  interestCoverage: number;
  returnOnEquity: number;
  returnOnAssets: number;
}

export interface PredictabilityData {
  revenuePredictability: number;
  costPredictability: number;
  profitPredictability: number;
  confidence: number;
}

export interface CEOGrowthAnalysis {
  growthMetrics: GrowthData;
  targetComparison: TargetData;
  marketShare: MarketShareData;
}

export interface GrowthData {
  monthOverMonth: number;
  yearOverYear: number;
  compoundGrowth: number;
  averageGrowth: number;
}

export interface TargetData {
  revenueTarget: number;
  actualRevenue: number;
  variance: number;
  achievement: number;
}

export interface MarketShareData {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface CEOAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface CEOExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeDetails: boolean;
  period: CEODashboardParams;
}

export interface CEOReportData {
  data: CEODashboardData;
  generatedAt: Date;
  period: CEODashboardParams;
  metadata: {
    version: string;
    generatedBy: string;
    totalRecords: number;
  };
}

// FASE 3: Interfaces para Análise Financeira

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

export interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  costs: number;
  profit: number;
  growth: number;
  customers: number;
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

export interface DetailedDREData extends DREData {
  // Receitas detalhadas
  grossRevenue: number;
  salesReturns: number;
  salesDiscounts: number;
  netRevenue: number;
  
  // Custos detalhados
  directMaterials: number;
  directLabor: number;
  manufacturingOverhead: number;
  totalCostOfGoodsSold: number;
  
  // Despesas operacionais detalhadas
  salesExpenses: number;
  administrativeExpenses: number;
  generalExpenses: number;
  depreciation: number;
  amortization: number;
  
  // Resultado financeiro
  financialIncome: number;
  financialExpenses: number;
  netFinancialResult: number;
  
  // Impostos
  incomeTax: number;
  socialContribution: number;
  
  // Métricas derivadas
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  ebitda: number;
  ebit: number;
}

export interface DRERatios {
  grossMarginRatio: number;
  operatingMarginRatio: number;
  netMarginRatio: number;
  costOfGoodsSoldRatio: number;
  operatingExpenseRatio: number;
  returnOnRevenue: number;
}

export interface DRETrendAnalysis {
  period: string;
  revenue: number;
  costs: number;
  profit: number;
  growth: number;
  margin: number;
  trend: 'improving' | 'deteriorating' | 'stable';
}

export interface DetailedCashFlowData extends CashFlowData {
  // Fluxo Operacional Detalhado
  netIncome: number;
  depreciation: number;
  amortization: number;
  changesInWorkingCapital: number;
  accountsReceivable: number;
  inventory: number;
  accountsPayable: number;
  otherOperatingActivities: number;
  
  // Fluxo de Investimentos Detalhado
  capitalExpenditures: number;
  acquisitions: number;
  assetSales: number;
  investments: number;
  otherInvestingActivities: number;
  
  // Fluxo de Financiamento Detalhado
  debtIssuance: number;
  debtRepayment: number;
  dividendPayments: number;
  equityIssuance: number;
  otherFinancingActivities: number;
  
  // Métricas Derivadas
  freeCashFlow: number;
  operatingCashFlowMargin: number;
  cashConversionRatio: number;
  cashFromOperations: number;
  cashToInvestments: number;
  cashFromFinancing: number;
}

export interface CashFlowTrend {
  period: string;
  operating: number;
  investing: number;
  financing: number;
  net: number;
  trend: 'improving' | 'deteriorating' | 'stable';
}

export interface CashFlowProjection {
  period: string;
  projectedOperating: number;
  projectedInvesting: number;
  projectedFinancing: number;
  projectedNet: number;
  confidence: number;
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
}

export interface CashFlowQuality {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
  operatingConsistency: number;
  freeCashFlowGrowth: number;
  cashConversion: number;
  recommendations: string[];
}

// FASE 4: Interfaces para Análise de Risco e Crescimento

export interface CEORiskGrowthAnalysis {
  riskAnalysis: CEORiskAnalysis;
  growthAnalysis: CEOGrowthAnalysis;
  alerts: CEOAlert[];
}

export interface DetailedRiskAnalysis extends CEORiskAnalysis {
  // Análise de inadimplência detalhada
  defaultAnalysis: DetailedDefaultData;
  
  // Análise de sustentabilidade detalhada
  sustainability: DetailedSustainabilityData;
  
  // Análise de previsibilidade detalhada
  predictability: DetailedPredictabilityData;
  
  // Análise de cenários
  scenarioAnalysis: ScenarioAnalysis;
}

export interface DetailedDefaultData extends DefaultData {
  // Taxa de inadimplência por período
  defaultRateHistory: DefaultRateHistory[];
  
  // Análise por segmento de cliente
  defaultBySegment: DefaultBySegment[];
  
  // Análise por produto/serviço
  defaultByProduct: DefaultByProduct[];
  
  // Projeções de inadimplência
  defaultProjections: DefaultProjection[];
  
  // Métricas de recuperação
  recoveryMetrics: RecoveryMetrics;
}

export interface DefaultRateHistory {
  period: string;
  defaultRate: number;
  totalExposure: number;
  defaultedAmount: number;
  trend: 'up' | 'down' | 'stable';
}

export interface DefaultBySegment {
  segment: string;
  defaultRate: number;
  exposure: number;
  risk: 'low' | 'medium' | 'high';
}

export interface DefaultByProduct {
  product: string;
  defaultRate: number;
  exposure: number;
  averageTicket: number;
}

export interface DefaultProjection {
  month: string;
  projectedDefaultRate: number;
  confidence: number;
  bestCase: number;
  worstCase: number;
}

export interface RecoveryMetrics {
  recoveryRate: number;
  averageRecoveryTime: number;
  recoveryCost: number;
  legalRecoveryRate: number;
}

export interface DetailedSustainabilityData extends SustainabilityData {
  // Análise de endividamento detalhada
  debtStructure: DebtStructure;
  
  // Análise de cobertura de juros
  interestCoverage: InterestCoverageAnalysis;
  
  // Análise de rentabilidade detalhada
  profitability: DetailedProfitability;
  
  // Análise de eficiência
  efficiency: EfficiencyMetrics;
  
  // Projeções de sustentabilidade
  sustainabilityProjections: SustainabilityProjection[];
}

export interface DebtStructure {
  shortTermDebt: number;
  longTermDebt: number;
  totalDebt: number;
  debtToEquity: number;
  debtToAssets: number;
  debtMaturity: DebtMaturity[];
}

export interface DebtMaturity {
  year: number;
  amount: number;
  percentage: number;
}

export interface InterestCoverageAnalysis {
  currentRatio: number;
  historicalRatio: InterestCoverageHistory[];
  trend: 'improving' | 'deteriorating' | 'stable';
  breakevenEBIT: number;
}

export interface InterestCoverageHistory {
  period: string;
  ratio: number;
  ebit: number;
  interestExpense: number;
}

export interface DetailedProfitability {
  returnOnEquity: number;
  returnOnAssets: number;
  returnOnInvestedCapital: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  profitabilityHistory: ProfitabilityHistory[];
}

export interface ProfitabilityHistory {
  period: string;
  roe: number;
  roa: number;
  roic: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
}

export interface EfficiencyMetrics {
  assetTurnover: number;
  inventoryTurnover: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  workingCapitalTurnover: number;
}

export interface SustainabilityProjection {
  year: number;
  projectedROE: number;
  projectedROA: number;
  projectedDebtToEquity: number;
  confidence: number;
}

export interface DetailedPredictabilityData extends PredictabilityData {
  // Análise de volatilidade
  volatility: VolatilityAnalysis;
  
  // Análise de correlações
  correlations: CorrelationAnalysis;
  
  // Análise de sazonalidade
  seasonality: SeasonalityAnalysis;
  
  // Modelos preditivos
  predictiveModels: PredictiveModel[];
  
  // Análise de cenários
  scenarioAnalysis: ScenarioAnalysis;
}

export interface VolatilityAnalysis {
  revenueVolatility: number;
  costVolatility: number;
  profitVolatility: number;
  historicalVolatility: VolatilityHistory[];
  volatilityTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface VolatilityHistory {
  period: string;
  revenueVol: number;
  costVol: number;
  profitVol: number;
}

export interface CorrelationAnalysis {
  revenueCostCorrelation: number;
  marketCorrelation: number;
  seasonalCorrelation: number;
  correlationMatrix: CorrelationMatrix[];
}

export interface CorrelationMatrix {
  variable1: string;
  variable2: string;
  correlation: number;
  significance: number;
}

export interface SeasonalityAnalysis {
  seasonalityIndex: number;
  seasonalFactors: SeasonalFactor[];
  deseasonalizedTrend: DeseasonalizedData[];
}

export interface SeasonalFactor {
  month: number;
  factor: number;
  confidence: number;
}

export interface DeseasonalizedData {
  period: string;
  actual: number;
  deseasonalized: number;
  seasonalEffect: number;
}

export interface PredictiveModel {
  modelType: 'linear' | 'exponential' | 'seasonal' | 'arima';
  accuracy: number;
  forecast: ForecastData[];
  residuals: ResidualAnalysis;
}

export interface ForecastData {
  period: string;
  forecast: number;
  confidence: number;
  lowerBound: number;
  upperBound: number;
}

export interface ResidualAnalysis {
  meanResidual: number;
  standardDeviation: number;
  normality: number;
  autocorrelation: number;
}

export interface ScenarioAnalysis {
  baseCase: Scenario;
  optimisticCase: Scenario;
  pessimisticCase: Scenario;
  stressTest: StressTest;
}

export interface Scenario {
  name: string;
  probability: number;
  revenue: number;
  costs: number;
  profit: number;
  keyAssumptions: KeyAssumption[];
}

export interface KeyAssumption {
  variable: string;
  value: number;
  impact: 'high' | 'medium' | 'low';
}

export interface StressTest {
  scenario: string;
  impact: number;
  probability: number;
  mitigation: string[];
}

export interface DetailedGrowthAnalysis extends CEOGrowthAnalysis {
  // Análise de crescimento detalhada
  growthMetrics: DetailedGrowthData;
  
  // Análise de mercado
  marketAnalysis: MarketAnalysis;
  
  // Análise competitiva
  competitiveAnalysis: CompetitiveAnalysis;
  
  // Análise de capacidade
  capacityAnalysis: CapacityAnalysis;
  
  // Projeções de crescimento
  growthProjections: GrowthProjection[];
}

export interface DetailedGrowthData extends GrowthData {
  // Crescimento por segmento
  growthBySegment: GrowthBySegment[];
  
  // Crescimento por produto
  growthByProduct: GrowthByProduct[];
  
  // Crescimento por região
  growthByRegion: GrowthByRegion[];
  
  // Análise de drivers de crescimento
  growthDrivers: GrowthDriver[];
  
  // Análise de barreiras
  growthBarriers: GrowthBarrier[];
}

export interface GrowthBySegment {
  segment: string;
  currentGrowth: number;
  previousGrowth: number;
  marketSize: number;
  penetration: number;
}

export interface GrowthByProduct {
  product: string;
  currentGrowth: number;
  previousGrowth: number;
  lifecycle: 'introduction' | 'growth' | 'maturity' | 'decline';
  marketShare: number;
}

export interface GrowthByRegion {
  region: string;
  currentGrowth: number;
  previousGrowth: number;
  population: number;
  gdp: number;
}

export interface GrowthDriver {
  driver: string;
  impact: number;
  sustainability: 'high' | 'medium' | 'low';
  cost: number;
}

export interface GrowthBarrier {
  barrier: string;
  impact: number;
  probability: number;
  mitigation: string[];
}

export interface MarketAnalysis {
  marketSize: number;
  marketGrowth: number;
  marketShare: number;
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  marketTrends: MarketTrend[];
}

export interface MarketTrend {
  trend: string;
  impact: 'positive' | 'negative' | 'neutral';
  timeframe: 'short' | 'medium' | 'long';
  probability: number;
}

export interface CompetitiveAnalysis {
  competitors: Competitor[];
  competitivePosition: CompetitivePosition;
  competitiveAdvantages: CompetitiveAdvantage[];
  threats: CompetitiveThreat[];
}

export interface Competitor {
  name: string;
  marketShare: number;
  growth: number;
  strengths: string[];
  weaknesses: string[];
}

export interface CompetitivePosition {
  position: number;
  totalCompetitors: number;
  relativePosition: 'strong' | 'moderate' | 'weak';
}

export interface CompetitiveAdvantage {
  advantage: string;
  sustainability: 'high' | 'medium' | 'low';
  value: number;
}

export interface CompetitiveThreat {
  threat: string;
  probability: number;
  impact: number;
  timeframe: 'short' | 'medium' | 'long';
}

export interface CapacityAnalysis {
  currentCapacity: number;
  capacityUtilization: number;
  capacityConstraints: CapacityConstraint[];
  expansionOptions: ExpansionOption[];
}

export interface CapacityConstraint {
  constraint: string;
  impact: number;
  timeline: string;
  solution: string;
}

export interface ExpansionOption {
  option: string;
  cost: number;
  timeline: string;
  capacityIncrease: number;
  roi: number;
}

export interface GrowthProjection {
  year: number;
  projectedRevenue: number;
  projectedGrowth: number;
  confidence: number;
  keyAssumptions: string[];
}

// FASE 5: Interfaces para Funcionalidades Avançadas

export interface ExportFormat {
  type: 'pdf' | 'excel' | 'csv' | 'json';
  name: string;
  mimeType: string;
}

export interface ReportData {
  id: string;
  title: string;
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
  format: ExportFormat;
  sections: ReportSection[];
  metadata: {
    totalPages: number;
    chartsIncluded: boolean;
    alertsIncluded: boolean;
    generatedBy: string;
  };
}

export interface ReportSection {
  title: string;
  content: string;
  order: number;
  data?: any;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  severity: AlertSeverity;
  timestamp: string;
  data?: any;
  resolved?: boolean;
  resolvedAt?: string;
}

export type AlertType = 'financial' | 'operational' | 'risk' | 'growth' | 'system';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface DrillDownOptions {
  targetDashboard: 'vendas' | 'vendedores' | 'atendimentos' | 'consultores';
  filters: Record<string, any>;
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: string[];
}

export interface TargetComparison {
  metric: string;
  currentValue: number;
  targetValue: number;
  variance: number;
  achievement: number;
  status: 'achieved' | 'partial' | 'not_achieved';
  trend: 'up' | 'down' | 'stable';
}

export interface CustomReportConfig {
  id: string;
  name: string;
  description: string;
  sections: CustomReportSection[];
  filters: CustomReportFilter[];
  schedule?: ReportSchedule;
  recipients: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomReportSection {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'alert';
  config: any;
  order: number;
}

export interface CustomReportFilter {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'contains';
  value: any;
  label: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
}

export interface ExportHistory {
  id: string;
  reportName: string;
  format: ExportFormat;
  generatedAt: string;
  fileSize: number;
  downloadUrl?: string;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
}

export interface AlertPreferences {
  userId: string;
  alertTypes: AlertType[];
  severityThreshold: AlertSeverity;
  channels: ('email' | 'dashboard' | 'push')[];
  frequency: 'immediate' | 'daily' | 'weekly';
  isActive: boolean;
}

export interface DashboardSettings {
  userId: string;
  layout: DashboardLayout;
  widgets: WidgetConfig[];
  refreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  grid: GridItem[];
}

export interface GridItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  widget: string;
}

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  config: any;
  isVisible: boolean;
  order: number;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  dashboard: boolean;
  sound: boolean;
  frequency: 'immediate' | 'batched';
}

// Interfaces para métricas expandidas da Fase 5
export interface CEOFinancialMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  profitMargin: number;
  cashFlow: number;
  ebitda: number;
  netIncome: number;
  operatingExpenses: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingProfit: number;
}

// Interface CEOOperationalMetrics expandida (substitui a versão anterior)
export interface CEOOperationalMetricsExpanded {
  totalCosts: number;
  costRevenueRatio: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
  churnRate: number;
  retentionRate: number;
  averageOrderValue: number;
  conversionRate: number;
}

export interface CEORiskMetrics {
  defaultRate: number;
  liquidityRatio: number;
  debtToEquity: number;
  interestCoverage: number;
  currentRatio: number;
  quickRatio: number;
  workingCapital: number;
  cashConversionCycle: number;
}

export interface CEOGrowthMetrics {
  monthOverMonthGrowth: number;
  yearOverYearGrowth: number;
  compoundGrowthRate: number;
  marketShare: number;
  customerGrowth: number;
  revenuePerCustomer: number;
  averageGrowthRate: number;
  growthTrend: 'accelerating' | 'decelerating' | 'stable';
}

// Interface principal expandida para Fase 5
export interface CEODashboardData {
  period: {
    startDate: string;
    endDate: string;
  };
  financialMetrics: CEOFinancialMetrics;
  operationalMetrics: CEOOperationalMetrics;
  riskMetrics: CEORiskMetrics;
  growthMetrics: CEOGrowthMetrics;
  alerts: Alert[];
  lastUpdated: string;
  metadata: {
    version: string;
    generatedBy: string;
    dataQuality: number;
    completeness: number;
  };
}

