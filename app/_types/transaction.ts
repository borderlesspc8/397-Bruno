/**
 * Tipos e interfaces relacionados a transações financeiras
 */

// Enums para os tipos de transação
export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
  INVESTMENT = "INVESTMENT"
}

// Enums para categorias de transação
export enum TransactionCategory {
  GROCERIES = "GROCERIES",
  UTILITIES = "UTILITIES",
  RENT = "RENT",
  MORTGAGE = "MORTGAGE",
  TRANSPORTATION = "TRANSPORTATION",
  DINING = "DINING",
  ENTERTAINMENT = "ENTERTAINMENT",
  HEALTHCARE = "HEALTHCARE",
  EDUCATION = "EDUCATION",
  SHOPPING = "SHOPPING",
  TRAVEL = "TRAVEL",
  INVESTMENTS = "INVESTMENTS",
  INCOME = "INCOME",
  BUSINESS = "BUSINESS",
  SUBSCRIPTION = "SUBSCRIPTION",
  PERSONAL = "PERSONAL",
  OTHER = "OTHER",
  TAXES = "TAXES",
  FEES = "FEES",
  INSURANCE = "INSURANCE",
  DEBT = "DEBT",
  SAVINGS = "SAVINGS"
}

// Enums para métodos de pagamento
export enum TransactionPaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  PIX = "PIX",
  BOLETO = "BOLETO",
  DIGITAL_WALLET = "DIGITAL_WALLET",
  CRYPTO = "CRYPTO",
  CHECK = "CHECK",
  OTHER = "OTHER"
}

// Interfaces para as entidades
export interface Wallet {
  id: string;
  name: string;
  type: string;
  balance: number;
  icon?: string;
  color?: string;
  accountNumber?: string;
  bankCode?: string;
  isDefault?: boolean;
  isHidden?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  subcategories?: Category[];
  custom?: boolean;
}

// Tipo básico de transação
export interface Transaction {
  id: string;
  name: string;
  description?: string;
  amount: number;
  date: Date;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod?: TransactionPaymentMethod;
  walletId: string;
  userId: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para formulário de criação/edição de transação
export interface TransactionFormValues {
  description: string;
  amount: number;
  date: Date | string;
  type: TransactionType;
  category: TransactionCategory | string;
  walletId: string;
  paymentMethod: TransactionPaymentMethod;
  notes?: string;
  isRecurring?: boolean;
  tags?: string[];
}

// Interface para filtros de transação
export interface TransactionFilters {
  userId: string;
  walletId?: string | null;
  limit?: number;
  page?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  type?: TransactionType;
  category?: TransactionCategory | string;
  cursor?: string;
  tags?: string[];
  search?: string;
  sortField?: string; 
  sortOrder?: string;
  includeDetails?: boolean;
  paymentMethod?: TransactionPaymentMethod;
  minAmount?: number;
  maxAmount?: number;
  isRecurring?: boolean;
}

// Status de parcela
export enum InstallmentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  CANCELED = "CANCELED",
  OVERDUE = "OVERDUE"
}

// Parcela
export interface Installment {
  id: string;
  number: number;
  total: number;
  amount: number;
  dueDate: Date;
  status: InstallmentStatus;
  salesRecordId: string;
  transactionId?: string;
}

// Tipo de origem para previsão de fluxo de caixa
export enum CashFlowPredictionSource {
  INSTALLMENT = "INSTALLMENT",
  RECURRING = "RECURRING",
  MANUAL = "MANUAL",
  GESTAO_CLICK = "GESTAO_CLICK",
  SALES_INSTALLMENT = "SALES_INSTALLMENT",
  RECURRENT = "RECURRENT",
  IMPORTED = "IMPORTED"
}

// Previsão de fluxo de caixa
export interface CashFlowPrediction {
  id: string;
  userId: string;
  walletId?: string;
  amount: number;
  type: string;
  date: Date;
  description: string;
  category: string;
  source: CashFlowPredictionSource;
  probability: number;
  installmentId?: string;
  recurringTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: any;
  sourceId?: string;
  installmentInfo?: {
    saleId?: string;
    installmentNumber?: number;
    totalInstallments?: number;
    status: InstallmentStatus;
    originalDueDate?: Date;
  };
}

// Interface para resumo de fluxo de caixa
export interface CashFlowSummary {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  totalPredictions: number;
  predictedIncome: number;
  predictedExpense: number;
  predictedNetFlow: number;
  installments: {
    pending: number;
    overdue: number;
    paid: number;
    canceled: number;
    totalAmount: number;
    overdueAmount: number;
    pendingAmount: number;
  };
}

// Interface para dados de venda parcelada do Gestão Click
export interface GestaoClickSale {
  id: string;
  codigo?: string;
  data: string;
  cliente: {
    id: string;
    nome: string;
  };
  valor_total: number;
  forma_pagamento: {
    id: string;
    nome: string;
  };
  parcelas?: Array<{
    numero: number;
    valor: number;
    data_vencimento: string;
    status: string;
  }>;
  situacao?: {
    id: string;
    nome: string;
  };
  metadata?: any;
}

// Interface para resposta de importação de vendas parceladas
export interface InstallmentImportResult {
  totalProcessed: number;
  imported: number;
  skipped: number;
  errors: Array<{
    orderId: string;
    message: string;
  }>;
  walletId: string;
}

export interface CashFlowPeriodData {
  period: string;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  predictedIncome: number;
  predictedExpense: number;
  predictedNetFlow: number;
  transactions: number;
  predictions: number;
}

export interface SaleInstallment {
  id: string;
  saleId: string;
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  dueDate: Date;
  paymentDate?: Date;
  status: InstallmentStatus;
}

export interface SaleData {
  id: string;
  date: Date;
  customerName: string;
  customerDocument?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  storeId: string;
  storeName: string;
  installments?: SaleInstallment[];
}

export interface TransactionWithMetadata extends Transaction {
  metadata: {
    source?: {
      name: string;
      externalId?: string;
      data?: any;
    };
    isReconciled?: boolean;
    reconciliationData?: {
      salesId?: string;
      installmentId?: string;
      confidence?: number;
      date?: string;
      modelVersion?: string;
      isManual?: boolean;
      isPartOfGroup?: boolean;
      groupSize?: number;
    };
    tags?: string[];
  };
} 
