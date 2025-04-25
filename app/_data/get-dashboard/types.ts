import { TransactionType } from "@prisma/client";

export interface TotalExpensePerCategory {
  category: string;
  totalAmount: number;
  percentageOfTotal: number;
}

export interface TransactionPercentagePerType {
  [key: string]: number;
}

export interface WalletsData {
  total: number;
  balance: number;
  bankWallets: number;
  manualWallets: number;
  cashWallets: number;
  positiveWallets: number;
  negativeWallets: number;
  topWallets: Array<{
    id: string;
    name: string;
    balance: number;
    type: string;
    bankId?: string | null;
    bank?: {
      name: string;
      logo: string;
    } | null;
  }>;
}

export interface MonthOverMonthData {
  depositsChange: number;
  expensesChange: number;
  balanceChange: number;
}

export interface BudgetProgress {
  total: number;
  used: number;
  percentage: number;
}

export interface DashboardData {
  balance: number;
  depositsTotal: number;
  investmentsTotal: number;
  expensesTotal: number;
  typesPercentage: TransactionPercentagePerType;
  totalExpensePerCategory: TotalExpensePerCategory[];
  lastTransactions: any[]; // Transações mais recentes
  walletsData: WalletsData;
  monthOverMonthData: MonthOverMonthData;
  budgetProgress: BudgetProgress;
}
