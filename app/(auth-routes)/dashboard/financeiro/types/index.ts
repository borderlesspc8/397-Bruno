export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  incomeGrowth: number;
  expensesGrowth: number;
  balanceGrowth: number;
  periodComparison: PeriodComparison;
}

export interface PeriodComparison {
  previousPeriod: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
  };
  growthRates: {
    income: number;
    expenses: number;
    balance: number;
  };
}

export interface CashFlowData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  trend?: number;
}

export interface FinancialMetrics {
  profitMargin: number;
  burnRate: number;
  averageTicket: number;
  conversionRate: number;
  customerAcquisitionCost: number;
  lifeTimeValue: number;
}

export interface FinancialTrend {
  period: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

export interface WalletBalance {
  walletId: string;
  walletName: string;
  balance: number;
  currency: string;
  lastUpdate: string;
  trend: FinancialTrend[];
  computedBalance?: number;
  autoBalance?: WalletAutoBalance;
  bank?: {
    id?: string;
    name?: string;
    logo?: string;
  };
  lastSync?: string | null;
  totalTransactions?: number;
}

export interface WalletAutoBalance {
  income: number;
  expenses: number;
  investments?: number;
  transfers?: number;
  net: number;
}

export interface FinancialDashboardData {
  summary: FinancialSummary;
  cashFlow: CashFlowData[];
  incomeCategories: CategoryData[];
  expenseCategories: CategoryData[];
  metrics: FinancialMetrics;
  wallets: WalletBalance[];
  lastUpdated: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface FinancialChartProps {
  data: CashFlowData[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  colors?: {
    income: string;
    expenses: string;
    balance: string;
  };
}

export interface WidgetProps {
  loading?: boolean;
  error?: string | null;
}