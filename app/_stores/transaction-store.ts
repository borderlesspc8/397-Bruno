import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Transaction, TransactionType, CashFlowPrediction } from '@/app/_types/transaction';
import { getEventsClient } from '@/app/_lib/socket';

// Interface para o estado da store de transações
interface TransactionState {
  // Dados
  transactions: Transaction[];
  recentTransactions: Transaction[];
  cashFlowPredictions: CashFlowPrediction[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Ações
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  removeTransaction: (id: string) => void;
  setRecentTransactions: (transactions: Transaction[]) => void;
  setCashFlowPredictions: (predictions: CashFlowPrediction[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Métodos de sincronização
  refreshTransactions: () => Promise<void>;
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
  emitTransactionUpdated: (transaction: Transaction) => void;
}

// Criação da store
export const useTransactionStore = create<TransactionState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        transactions: [],
        recentTransactions: [],
        cashFlowPredictions: [],
        isLoading: false,
        error: null,
        lastUpdated: null,

        // Ações para manipular o estado
        setTransactions: (transactions) => 
          set({ transactions, lastUpdated: new Date() }),
        
        addTransaction: (transaction) => 
          set((state) => ({ 
            transactions: [transaction, ...state.transactions],
            recentTransactions: [transaction, ...state.recentTransactions].slice(0, 10),
            lastUpdated: new Date()
          })),
        
        updateTransaction: (transaction) => 
          set((state) => ({ 
            transactions: state.transactions.map(t => 
              t.id === transaction.id ? transaction : t
            ),
            recentTransactions: state.recentTransactions.map(t => 
              t.id === transaction.id ? transaction : t
            ),
            lastUpdated: new Date()
          })),
        
        removeTransaction: (id) => 
          set((state) => ({ 
            transactions: state.transactions.filter(t => t.id !== id),
            recentTransactions: state.recentTransactions.filter(t => t.id !== id),
            lastUpdated: new Date()
          })),
        
        setRecentTransactions: (transactions) => 
          set({ recentTransactions: transactions }),
        
        setCashFlowPredictions: (predictions) => 
          set({ cashFlowPredictions: predictions }),
        
        setLoading: (isLoading) => 
          set({ isLoading }),
        
        setError: (error) => 
          set({ error }),
        
        // Métodos para sincronização
        refreshTransactions: async () => {
          const state = get();
          state.setLoading(true);
          
          try {
            // Fazer requisição para buscar transações atualizadas
            const response = await fetch('/api/transactions');
            
            if (!response.ok) {
              throw new Error(`Erro ao buscar transações: ${response.status}`);
            }
            
            const data = await response.json();
            state.setTransactions(data.transactions);
            state.setError(null);
          } catch (error) {
            console.error('Erro ao atualizar transações:', error);
            state.setError(error instanceof Error ? error.message : 'Erro desconhecido');
          } finally {
            state.setLoading(false);
          }
        },
        
        subscribeToUpdates: () => {
          const eventsClient = getEventsClient();
          
          if (!eventsClient) return;
          
          // Registrar callback para atualizações de transações
          const handleTransactionUpdate = (data: any) => {
            if (data.transaction) {
              // Se recebemos uma transação específica
              if (data.action === 'created') {
                get().addTransaction(data.transaction);
              } else if (data.action === 'updated') {
                get().updateTransaction(data.transaction);
              } else if (data.action === 'deleted') {
                get().removeTransaction(data.transaction.id);
              }
            } else {
              // Se apenas recebemos notificação que algo mudou, atualizamos tudo
              get().refreshTransactions();
            }
          };
          
          // Registrar nos eventos do socket
          eventsClient.on('transactions-changed', handleTransactionUpdate);
          
          // Registrar também nos eventos DOM para maior compatibilidade
          if (typeof window !== 'undefined') {
            window.addEventListener('transaction-updated', (event: any) => {
              handleTransactionUpdate(event.detail);
            });
          }
        },
        
        unsubscribeFromUpdates: () => {
          const eventsClient = getEventsClient();
          
          if (!eventsClient) return;
          
          // Desregistrar eventos - salvamos o handler em uma variável para reuso
          const handleTransactionUpdate = (data: any) => {};
          eventsClient.off('transactions-changed', handleTransactionUpdate);
          
          if (typeof window !== 'undefined') {
            window.removeEventListener('transaction-updated', (event: any) => {});
          }
        },
        
        emitTransactionUpdated: (transaction: Transaction) => {
          const eventsClient = getEventsClient();
          
          if (eventsClient) {
            eventsClient.emit('transactions-changed', { 
              transaction, 
              action: 'updated' 
            });
          }
          
          // Emitir evento DOM também como fallback
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('transaction-updated', { 
              detail: { transaction, action: 'updated' } 
            });
            window.dispatchEvent(event);
          }
        }
      }),
      {
        name: 'transaction-storage',
        partialize: (state) => ({
          recentTransactions: state.recentTransactions,
          lastUpdated: state.lastUpdated
        })
      }
    )
  )
); 