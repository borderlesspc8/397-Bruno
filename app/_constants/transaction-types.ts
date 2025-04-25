/**
 * Enum para tipos de transação na aplicação
 * Este enum substitui o TransactionType que foi removido do Prisma client
 */
export const TransactionTypes = {
  DEPOSIT: "DEPOSIT",
  EXPENSE: "EXPENSE",
  INVESTMENT: "INVESTMENT",
  INCOME: "INCOME"
} as const;

export type TransactionType = keyof typeof TransactionTypes;

// Mapeamento de tipos de transação para rótulos legíveis
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  DEPOSIT: "Depósito",
  EXPENSE: "Despesa",
  INVESTMENT: "Investimento",
  INCOME: "Receita"
};

// Mapeamento de tipos de transação para ícones
export const TRANSACTION_TYPE_ICONS: Record<TransactionType, string> = {
  DEPOSIT: "arrow-down.svg",
  EXPENSE: "arrow-up.svg",
  INVESTMENT: "investment.svg",
  INCOME: "money-in.svg"
}; 