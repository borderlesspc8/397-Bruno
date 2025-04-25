"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "../types";
import { toast } from "../../ui/use-toast";

/**
 * Hook para gerenciar as carteiras do usuário
 */
export const useWallets = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet>({ id: "1", name: "Carregando...", balance: 0 });
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const router = useRouter();
  
  // Calcular valores derivados
  const walletCount = wallets.length;
  const totalBalance = wallets.reduce((total, wallet) => total + wallet.balance, 0);
  
  // Buscar carteiras da API
  const fetchWallets = useCallback(async () => {
    try {
      setIsLoadingWallets(true);
      const response = await fetch("/api/wallets");
      if (!response.ok) {
        throw new Error("Falha ao carregar carteiras");
      }
      const data = await response.json();
      const loadedWallets = data.wallets;
      
      setWallets(loadedWallets);
      
      // Seleciona a primeira carteira como padrão se existir
      if (loadedWallets.length > 0) {
        const defaultWallet = loadedWallets.find((w: Wallet) => w.metadata?.isDefault) || loadedWallets[0];
        setSelectedWallet(defaultWallet);
      }
    } catch (error) {
      console.error("[NAVBAR_LOAD_WALLETS]", error);
      toast({
        title: "Erro ao carregar carteiras",
        description: "Não foi possível carregar suas carteiras. Tente novamente mais tarde.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoadingWallets(false);
    }
  }, [toast]);
  
  // Buscar carteiras quando o usuário estiver disponível
  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);
  
  // Handler para mudança de wallet selecionada
  const handleSelectWallet = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    router.push(`/dashboard?wallet=${wallet.id}`);
  };
  
  // Handler para atualização de wallet (usado por eventos)
  const handleWalletUpdate = useCallback((walletId: string, wallet: Wallet) => {
    // Atualizar a lista de carteiras
    setWallets(currentWallets => {
      const updatedWallets = currentWallets.map(w => 
        w.id === walletId ? wallet : w
      );
      return updatedWallets;
    });
    
    // Se a carteira atualizada for a selecionada, atualize-a também
    if (selectedWallet?.id === walletId) {
      setSelectedWallet(wallet);
    }
  }, [selectedWallet?.id]);
  
  return {
    wallets,
    selectedWallet,
    isLoadingWallets,
    walletCount,
    totalBalance,
    fetchWallets,
    handleSelectWallet,
    handleWalletUpdate
  };
}; 