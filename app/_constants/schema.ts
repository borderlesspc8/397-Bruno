/**
 * Constantes relacionadas aos schemas do Prisma
 * Centraliza os enums e constantes do schema para facilitar o uso e evitar erros de digitação
 */

export const WalletType = {
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  CREDIT_CARD: 'CREDIT_CARD',
  INVESTMENT: 'INVESTMENT',
  CASH: 'CASH',
  DIGITAL: 'DIGITAL',
  OTHER: 'OTHER',
  GESTAO_CLICK: 'GESTAO_CLICK',
  SETTINGS: 'SETTINGS'
} as const;

export const TransactionType = {
  DEPOSIT: 'DEPOSIT',
  EXPENSE: 'EXPENSE',
  INVESTMENT: 'INVESTMENT',
  INCOME: 'INCOME'
} as const;

export const PaymentMethod = {
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  BANK_SLIP: 'BANK_SLIP',
  CASH: 'CASH',
  PIX: 'PIX',
  OTHER: 'OTHER'
} as const;

export const NotificationType = {
  TRANSACTION: 'TRANSACTION',
  GOAL: 'GOAL',
  BUDGET: 'BUDGET',
  SYSTEM: 'SYSTEM',
  SUBSCRIPTION: 'SUBSCRIPTION'
} as const;

export const NotificationPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
} as const; 
