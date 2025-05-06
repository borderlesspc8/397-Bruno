import { TransactionType, WalletType } from '@prisma/client';

/**
 * Gera uma transação fictícia para testes
 */
export function mockTransaction(overrides = {}) {
  return {
    id: `trans_${Math.random().toString(36).substring(2, 10)}`,
    name: 'Transação de teste',
    type: TransactionType.EXPENSE,
    amount: 100.50,
    date: new Date('2024-01-01'),
    description: 'Descrição da transação de teste',
    category: 'Alimentação',
    metadata: {},
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
    userId: 'user123',
    walletId: 'wallet123',
    categoryId: 'cat123',
    isRecurrent: false,
    status: 'COMPLETED',
    tags: ['teste', 'mock'],
    isReconciled: false,
    ...overrides
  };
}

/**
 * Gera uma carteira fictícia para testes
 */
export function mockWallet(overrides = {}) {
  return {
    id: `wallet_${Math.random().toString(36).substring(2, 10)}`,
    name: 'Carteira de Teste',
    balance: 1000,
    bankId: null,
    userId: 'user123',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    allowNegative: false,
    color: '#3366FF',
    icon: 'wallet',
    isActive: true,
    type: WalletType.CHECKING,
    ...overrides
  };
}

/**
 * Gera um conjunto de transações para teste com diferentes categorias e valores
 */
export function mockTransactionList(count = 10, userId = 'user123', walletId = 'wallet123') {
  const categories = [
    'Alimentação', 
    'Transporte', 
    'Educação', 
    'Lazer', 
    'Saúde', 
    'Moradia', 
    'Vestuário'
  ];
  
  const transactions = [];
  
  for (let i = 0; i < count; i++) {
    const type = i % 3 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
    const category = categories[i % categories.length];
    
    transactions.push(mockTransaction({
      id: `trans_${i}`,
      name: `Transação ${i + 1}`,
      type,
      amount: Math.floor(Math.random() * 1000) + 10,
      date: new Date(2024, 0, i + 1),
      category,
      userId,
      walletId
    }));
  }
  
  return transactions;
}

/**
 * Gera uma transação recorrente para testes
 */
export function mockRecurringTransaction(overrides = {}) {
  return {
    id: `recur_${Math.random().toString(36).substring(2, 10)}`,
    title: 'Assinatura mensal',
    amount: 59.90,
    type: TransactionType.EXPENSE,
    category: 'Assinaturas',
    frequency: 'MONTHLY',
    nextDate: new Date('2024-02-01'),
    userId: 'user123',
    walletId: 'wallet123',
    active: true,
    dayOfMonth: 1,
    description: 'Assinatura de serviço mensal',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
    ...overrides
  };
}

/**
 * Gera dados para um resumo de transações por categoria
 */
export function mockTransactionSummary() {
  return [
    { category: 'Alimentação', total: 450.75, percentage: 30 },
    { category: 'Transporte', total: 300.00, percentage: 20 },
    { category: 'Moradia', total: 600.00, percentage: 40 },
    { category: 'Lazer', total: 150.25, percentage: 10 }
  ];
} 