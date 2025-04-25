"use client";

import { create } from "zustand";

// Definição do tipo para carteira
export type Wallet = {
  id: string;
  name: string;
  balance: number;
  type: string;
  bankId: string | null;
  bank?: {
    name: string;
    logo: string;
  };
  metadata?: any;
  createdAt: string;
};

// Interface para o estado da store
interface WalletState {
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  isLoading: boolean;
  setWallets: (wallets: Wallet[]) => void;
  selectWallet: (wallet: Wallet | null) => void;
  setLoading: (isLoading: boolean) => void;
}

// Criação da store com zustand
export const useWalletStore = create<WalletState>((set) => ({
  wallets: [],
  selectedWallet: null,
  isLoading: false,
  setWallets: (wallets) => set({ wallets }),
  selectWallet: (wallet) => set({ selectedWallet: wallet }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Hook para uso em componentes
export function useWallet() {
  const { 
    wallets, 
    selectedWallet, 
    isLoading, 
    setWallets, 
    selectWallet, 
    setLoading 
  } = useWalletStore();

  return {
    wallets,
    selectedWallet,
    isLoading,
    setWallets,
    selectWallet,
    setLoading,
  };
} 