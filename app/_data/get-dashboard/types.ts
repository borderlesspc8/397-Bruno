export interface TotalExpensePerCategory {
  category: string;
  totalAmount: number;
  percentageOfTotal: number;
}

export interface TransactionPercentagePerType {
  [key: string]: number;
}

export interface DashboardData {
  balance: number;
  depositsTotal: number;
  investmentsTotal: number;
  expensesTotal: number;
  typesPercentage: TransactionPercentagePerType;
  totalExpensePerCategory: TotalExpensePerCategory[];
  lastTransactions: Array<{
    id: string;
    title: string;
    amount: number;
    date: string;
    category: string;
    type: string;
    bankId?: string;
  }>;
  wallets: Array<{
    id: string;
    name: string;
    balance: number;
    type: string;
  }>;
  monthlyComparison: {
    currentMonth: number;
    previousMonth: number;
    percentageChange: number;
  };
  goals: Array<{
    id: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline: string;
    progress: number;
  }>;
}
