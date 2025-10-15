// Tipos de enumeração
export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  EXPENSE = "EXPENSE",
  INVESTMENT = "INVESTMENT",
  INCOME = "INCOME"
}

// Categorias de transação como strings em vez de enum
export type TransactionCategory = string;

// Valores de categorias do Gestão Click para referência
export const TRANSACTION_CATEGORIES = {
  VENDAS_BALCAO: "VENDAS_BALCAO",
  VENDAS_PRODUTOS: "VENDAS_PRODUTOS",
  DELIVERY: "DELIVERY",
  REMUNERACAO_FUNCIONARIOS: "REMUNERACAO_FUNCIONARIOS",
  ENCARGOS_FGTS: "ENCARGOS_FGTS",
  ENCARGOS_INSS: "ENCARGOS_INSS",
  ENCARGOS_ALIMENTACAO: "ENCARGOS_ALIMENTACAO",
  ENCARGOS_VALE_TRANSPORTE: "ENCARGOS_VALE_TRANSPORTE",
  ENCARGOS_13_SALARIO: "ENCARGOS_13_SALARIO",
  ENCARGOS_14_SALARIO: "ENCARGOS_14_SALARIO",
  ENCARGOS_RESCISOES: "ENCARGOS_RESCISOES",
  ENCARGOS_EXAMES: "ENCARGOS_EXAMES",
  REPOSICAO_ESTOQUE: "REPOSICAO_ESTOQUE",
  MANUTENCAO_EQUIPAMENTOS: "MANUTENCAO_EQUIPAMENTOS",
  MATERIAL_REFORMA: "MATERIAL_REFORMA",
  MATERIAL_ESCRITORIO: "MATERIAL_ESCRITORIO",
  AQUISICAO_EQUIPAMENTOS: "AQUISICAO_EQUIPAMENTOS",
  MARKETING_PUBLICIDADE: "MARKETING_PUBLICIDADE",
  TELEFONIA_INTERNET: "TELEFONIA_INTERNET",
  ENERGIA_AGUA: "ENERGIA_AGUA",
  TRANSPORTADORA: "TRANSPORTADORA",
  CONTABILIDADE: "CONTABILIDADE",
  TROCO: "TROCO",
  COMPRAS: "COMPRAS",
  FERIAS: "FERIAS",
  OTHER: "OTHER"
} as const;

export enum TransactionPaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  PIX = "PIX",
  BOLETO = "BOLETO",
  OTHER = "OTHER"
}

export enum RecurringPeriod {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM"
}

// Interface principal de Transaction
export interface Transaction {
  id: string;
  name: string;
  title?: string; // Alias para name, para compatibilidade
  description?: string;
  amount: number;
  date: Date;
  type: TransactionType | string;
  category: TransactionCategory | string;
  categoryId?: string;
  categoryObj?: {
    id: string;
    name: string;
    color: string;
  } | null;
  paymentMethod: TransactionPaymentMethod | string;
  metadata?: {
    reconciliationData?: TransactionReconciliationData;
    [key: string]: any;
  };
  wallet?: {
    id: string;
    name: string;
  } | null;
  walletId?: string;
  userId?: string;
  budgetId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isReconciled?: boolean;
}

// Interface para Budget
export interface Budget {
  id: string;
  title: string;
  description?: string;
  amount: number;
  period: RecurringPeriod | string;
  startDate?: Date;
  endDate?: Date;
  isRecurring: boolean;
  categoryId?: string;
  walletId?: string;
  spent?: number;
  remaining?: number;
  progress?: number;
  colorAccent: string;
  iconName: string;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
  wallet?: {
    id: string;
    name: string;
  } | null;
  categories?: BudgetCategory[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BudgetCategory {
  id: string;
  budgetId: string;
  categoryName: string;
  plannedAmount: number;
}

// Interface para dados de conciliação
export interface TransactionReconciliationData {
  salesId?: string;
  installmentId?: string;
  confidence?: number;
  date?: string;
  modelVersion?: string;
  isManual?: boolean;
  isPartOfGroup?: boolean;
  groupSize?: number;
  groupCode?: string;
  groupTransactions?: string[];
}

// Adaptadores para converter entre formatos
export const transactionAdapter = {
  // Converter do modelo Prisma para a interface padronizada
  fromPrisma: (data: any): Transaction => {
    return {
      ...data,
      title: data.name, // Adiciona title como alias para name
      categoryObj: data.categoryObj ? {
        id: data.categoryObj.id,
        name: data.categoryObj.name,
        color: data.categoryObj.color || "#64748b"
      } : null
    };
  },
  
  // Converter da interface padronizada para o modelo Prisma
  toPrisma: (data: Transaction): any => {
    const prismaData: any = {
      name: data.name || data.title,
      amount: data.amount,
      date: data.date,
      type: data.type,
      category: data.category,
      paymentMethod: data.paymentMethod
    };
    
    if (data.description) prismaData.description = data.description;
    if (data.walletId) prismaData.walletId = data.walletId;
    if (data.categoryId) prismaData.categoryId = data.categoryId;
    if (data.metadata) prismaData.metadata = data.metadata;
    
    return prismaData;
  }
};

export const budgetAdapter = {
  fromPrisma: (data: any, transactions?: Transaction[]): Budget => {
    let spent = 0;
    let remaining = 0;
    let progress = 0;
    
    if (transactions) {
      spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      remaining = data.amount - spent;
      progress = (spent / data.amount) * 100;
    } else if (data.spent !== undefined) {
      spent = data.spent;
      remaining = data.remaining || data.amount - spent;
      progress = data.progress || (spent / data.amount) * 100;
    }
    
    return {
      ...data,
      spent,
      remaining,
      progress,
      category: data.category ? {
        id: data.category.id,
        name: data.category.name,
        color: data.category.color || "#64748b"
      } : null,
      wallet: data.wallet ? {
        id: data.wallet.id,
        name: data.wallet.name
      } : null
    };
  }
}; 
