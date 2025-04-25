"use client";

import React, { useEffect, useState } from "react";
import { Wallet } from "./types";
import { WalletsList } from "./WalletsList";

// Componente legado para compatibilidade
export function ConnectedWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Carregar as carteiras quando o componente montar
    async function loadWallets() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/wallets');
        if (!response.ok) {
          throw new Error('Erro ao carregar carteiras');
        }
        const data = await response.json();
        
        // Garantir que data.wallets é um array
        const responseWallets = Array.isArray(data.wallets) ? data.wallets : [];
        
        // Converter para o formato esperado pelo componente
        const convertedWallets = responseWallets.map((wallet: any) => ({
          id: wallet.id,
          name: wallet.name,
          type: wallet.type,
          balance: wallet.balance || 0,
          bank: wallet.bank,
          account: wallet.metadata?.conta,
          agency: wallet.metadata?.agencia,
          lastSync: wallet.metadata?.lastSync
        }));
        
        setWallets(convertedWallets);
      } catch (error) {
        console.error('Erro ao carregar carteiras:', error);
        setError('Falha ao carregar as carteiras. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadWallets();
  }, []);
  
  return (
    <WalletsList 
      wallets={wallets}
      isLoading={isLoading}
      error={error || undefined}
    />
  );
} 