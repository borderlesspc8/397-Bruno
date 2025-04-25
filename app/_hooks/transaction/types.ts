import { Transaction } from "@/app/_types/transaction";

// Interface para dados processados do dashboard
export interface DashboardData {
  // Totais
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  
  // Contadores
  incomeCount: number;
  expenseCount: number;
  transactionCount: number;
  
  // Categorias e tipos
  expensesByCategory: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  
  // Transações recentes
  recentTransactions: Transaction[];
  
  // Status e período
  loading: boolean;
  error: string | null;
  period: {
    month: number;
    year: number;
    formatted: string;
  };
}

// Interface para a função de formatação de moeda
export interface CurrencyFormatter {
  (value: number | undefined | null): string;
}

// Interface para os dados retornados pelo hook useDashboardTransactions
export interface DashboardTransactionsReturn extends DashboardData {
  formatCurrency: CurrencyFormatter;
  filteredTransactions: Transaction[];
}

// Cores por categoria para uso consistente em toda a aplicação
export const CATEGORY_COLORS: Record<string, string> = {
  "Alimentação": "#ef4444",     // Vermelho
  "Aluguel": "#f97316",         // Laranja
  "Transporte": "#eab308",      // Amarelo
  "Lazer": "#84cc16",           // Verde claro
  "Saúde": "#10b981",           // Verde
  "Educação": "#06b6d4",        // Ciano
  "Serviços": "#3b82f6",        // Azul
  "Compras": "#8b5cf6",         // Violeta
  "Outros": "#d946ef",          // Rosa
  "Investimentos": "#6366f1",   // Índigo
  "DEFAULT": "#94a3b8",         // Cinza como cor padrão
}; 