"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTransactionStore } from '@/app/_stores/transaction-store';
import { Transaction, CashFlowPrediction } from '@/app/_types/transaction';
import { useNotificationMiddleware } from '@/app/_hooks/notification';
import { useRealtimeUpdates } from '@/app/_hooks/use-realtime-updates';

// Interface do contexto
interface TransactionContextType {
  // Dados
  transactions: Transaction[];
  recentTransactions: Transaction[];
  cashFlowPredictions: CashFlowPrediction[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Ações
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  removeTransaction: (id: string) => void;
  setCashFlowPredictions: (predictions: CashFlowPrediction[]) => void;
}

// Valor padrão do contexto
const defaultContextValue: TransactionContextType = {
  transactions: [],
  recentTransactions: [],
  cashFlowPredictions: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  refreshTransactions: async () => {},
  addTransaction: () => {},
  updateTransaction: () => {},
  removeTransaction: () => {},
  setCashFlowPredictions: () => {},
};

// Criar o contexto
const TransactionContext = createContext<TransactionContextType>(defaultContextValue);

// Hook personalizado para uso do contexto
export function useTransactionContext() {
  const context = useContext(TransactionContext);
  
  if (!context) {
    throw new Error('useTransactionContext deve ser usado dentro de um TransactionProvider');
  }
  
  return context;
}

// Props do provider
interface TransactionProviderProps {
  children: ReactNode;
}

// Componente provider
export function TransactionProvider({ children }: TransactionProviderProps) {
  // Usando a store Zustand para gerenciar o estado
  const transactionStore = useTransactionStore();
  const { notifyEvent } = useNotificationMiddleware();
  const { emitTransactionUpdate } = useRealtimeUpdates();
  
  // Efeito para configurar listeners de eventos em tempo real
  useEffect(() => {
    // Iniciar assinatura para atualizações em tempo real
    transactionStore.subscribeToUpdates();
    
    // Carregar transações iniciais
    transactionStore.refreshTransactions();
    
    // Limpeza ao desmontar
    return () => {
      transactionStore.unsubscribeFromUpdates();
    };
  }, []);
  
  // Métodos melhorados que combinam atualizações de store e notificações
  const addTransaction = (transaction: Transaction) => {
    transactionStore.addTransaction(transaction);
    emitTransactionUpdate({ transaction, action: 'created' });
  };
  
  const updateTransaction = (transaction: Transaction) => {
    transactionStore.updateTransaction(transaction);
    emitTransactionUpdate({ transaction, action: 'updated' });
  };
  
  const removeTransaction = (id: string) => {
    // Encontrar transação antes de remover para notificação
    const transaction = transactionStore.transactions.find(t => t.id === id);
    
    if (transaction) {
      transactionStore.removeTransaction(id);
      emitTransactionUpdate({ transaction, action: 'deleted' });
    }
  };
  
  // Valor do contexto a ser fornecido
  const contextValue: TransactionContextType = {
    // Dados da store
    transactions: transactionStore.transactions,
    recentTransactions: transactionStore.recentTransactions,
    cashFlowPredictions: transactionStore.cashFlowPredictions,
    isLoading: transactionStore.isLoading,
    error: transactionStore.error,
    lastUpdated: transactionStore.lastUpdated,
    
    // Métodos
    refreshTransactions: transactionStore.refreshTransactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    setCashFlowPredictions: transactionStore.setCashFlowPredictions,
  };
  
  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
} 