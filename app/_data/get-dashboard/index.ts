import { getAuthSession } from "@/app/_lib/auth";
import { cache } from 'react';

// Interface simplificada para o dashboard
export interface DashboardData {
  balance: number;
  depositsTotal: number;
  expensesTotal: number;
  investmentsTotal: number;
  totalExpensePerCategory: Array<{
    category: string;
    totalAmount: number;
    percentageOfTotal: number;
  }>;
  typesPercentage: Record<string, number>;
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

// Função para gerar dados de exemplo
const generateMockData = (): DashboardData => {
  return {
    balance: 1539.45,
    depositsTotal: 5800.25,
    expensesTotal: -3260.80,
    investmentsTotal: -1000.00,
    totalExpensePerCategory: [
      { category: "Alimentação", totalAmount: 850.30, percentageOfTotal: 26.1 },
      { category: "Moradia", totalAmount: 1200.00, percentageOfTotal: 36.8 },
      { category: "Transporte", totalAmount: 450.50, percentageOfTotal: 13.8 },
      { category: "Lazer", totalAmount: 350.00, percentageOfTotal: 10.7 },
      { category: "Saúde", totalAmount: 300.00, percentageOfTotal: 9.2 },
      { category: "Outros", totalAmount: 110.00, percentageOfTotal: 3.4 }
    ],
    typesPercentage: {
      DEPOSIT: 57.6,
      EXPENSE: 32.4,
      INVESTMENT: 10.0
    },
    lastTransactions: [
      {
        id: "1",
        title: "Salário",
        amount: 5000.00,
        date: new Date().toISOString(),
        category: "Salário",
        type: "DEPOSIT",
        bankId: "bank1"
      },
      {
        id: "2",
        title: "Supermercado",
        amount: -150.30,
        date: new Date().toISOString(),
        category: "Alimentação",
        type: "EXPENSE",
        bankId: "bank1"
      },
      {
        id: "3",
        title: "Aluguel",
        amount: -1200.00,
        date: new Date().toISOString(),
        category: "Moradia",
        type: "EXPENSE",
        bankId: "bank1"
      }
    ],
    wallets: [
      {
        id: "wallet1",
        name: "Conta Corrente",
        balance: 2500.00,
        type: "BANK_ACCOUNT"
      },
      {
        id: "wallet2",
        name: "Poupança",
        balance: 5000.00,
        type: "SAVINGS"
      }
    ],
    monthlyComparison: {
      currentMonth: 1539.45,
      previousMonth: 1400.00,
      percentageChange: 9.96
    },
    goals: [
      {
        id: "goal1",
        title: "Reserva de Emergência",
        targetAmount: 10000.00,
        currentAmount: 7500.00,
        deadline: "2024-12-31",
        progress: 75
      }
    ]
  };
};

export const getDashboard = cache(async (month: number, year: number): Promise<DashboardData> => {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return generateMockData();
    }
    
    // Por enquanto, retornar dados de exemplo
    return generateMockData();
    
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return generateMockData();
  }
});
