import { create } from 'zustand';

interface TransactionModalState {
  isOpen: boolean;
}

interface TransactionModalActions {
  openTransactionModal: () => void;
  closeTransactionModal: () => void;
}

type TransactionModalStore = TransactionModalState & TransactionModalActions;

export const useTransactionModal = create<TransactionModalStore>((set) => ({
  isOpen: false,
  openTransactionModal: () => set({ isOpen: true }),
  closeTransactionModal: () => set({ isOpen: false }),
})); 