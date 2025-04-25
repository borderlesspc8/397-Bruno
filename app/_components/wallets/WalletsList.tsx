"use client";

import React, { useEffect } from "react";
import { Wallet } from "./types";
import { Button } from "../ui/button";
import { AlertCircle, PlusCircle } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { WalletCard } from "./WalletCard";
import { EmptyWalletsList } from "./EmptyWalletsList";

interface WalletsListProps {
  wallets: Wallet[];
  isLoading?: boolean;
  filterType?: string;
  error?: string;
  onSelect?: (walletIds: string[]) => void;
  selectedWallets?: string[];
  onDelete?: (walletIds: string | string[]) => void;
  syncStatus?: Record<string, boolean>;
}

export const WalletsList: React.FC<WalletsListProps> = ({ 
  wallets = [],
  isLoading, 
  filterType = "ALL",
  error,
  onSelect,
  selectedWallets = [],
  onDelete,
  syncStatus
}) => {
  const safeWallets = Array.isArray(wallets) ? wallets : [];
  
  const filteredWallets = filterType === "ALL" 
    ? safeWallets 
    : safeWallets.filter(wallet => wallet?.type === filterType);

  // Ouvinte de eventos para ações de carteira
  useEffect(() => {
    const handleWalletAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { type, walletId, callbackId } = customEvent.detail;
      
      if (type === 'select' && onSelect) {
        const newSelection = selectedWallets.includes(walletId)
          ? selectedWallets.filter(wId => wId !== walletId)
          : [...selectedWallets, walletId];
        
        onSelect(newSelection);
      } else if (type === 'delete' && onDelete) {
        onDelete(walletId);
      }
    };
    
    window.addEventListener('wallet-action', handleWalletAction);
    
    return () => {
      window.removeEventListener('wallet-action', handleWalletAction);
    };
  }, [onSelect, onDelete, selectedWallets]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        {[1, 2, 3].map((_, i) => (
          <Skeleton key={i} className="h-[180px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-destructive font-medium">Erro ao carregar carteiras</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (filteredWallets.length === 0) {
    return <EmptyWalletsList filterType={filterType} />;
  }

  return (
    <div>
      {onSelect && selectedWallets.length > 0 && (
        <div className="flex items-center justify-between mb-3 p-2 bg-muted rounded-md">
          <p className="text-sm">
            {selectedWallets.length} carteiras selecionadas
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onSelect([])}>
                Cancelar
              </Button>
            {onDelete && (
              <Button variant="destructive" size="sm" onClick={() => onDelete(selectedWallets)}>
                Excluir selecionadas
              </Button>
          )}
        </div>
      </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        {filteredWallets.map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isSelected={selectedWallets.includes(wallet.id)}
            syncStatus={syncStatus?.[wallet.id]}
            actionType={onSelect ? 'select' : onDelete ? 'delete' : 'view'}
            data={{
              path: !onSelect ? `/wallets/${wallet.id}` : undefined,
              onSelectCallback: onSelect ? wallet.id : undefined,
              onDeleteCallback: onDelete && !onSelect ? wallet.id : undefined
            }}
          />
        ))}
      </div>
    </div>
  );
}; 