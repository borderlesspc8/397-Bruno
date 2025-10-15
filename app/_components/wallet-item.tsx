"use client";

import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { formatCurrency } from "@/app/_lib/utils";
import { RefreshCw, Clock } from "lucide-react";
import BankConnectionEditButton from "./bank-connection-edit-button";
import TestConnectionButton from "./test-connection-button";
import SyncWalletButton from "./sync-wallet-button";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "./ui/checkbox";

interface Bank {
  id: string;
  name: string;
  logo: string;
}

interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  bankId: string | null;
  bank?: Bank;
  metadata?: {
    accountId?: string;
    lastSync?: string;
    integration?: string;
    connectionId?: string;
    applicationKey?: string;
    clientBasic?: string;
    clientId?: string;
    clientSecret?: string;
    apiUrl?: string;
    agencia?: string;
    conta?: string;
  };
}

interface WalletItemProps {
  wallet: Wallet;
  onClick: (walletId: string) => void;
  isSyncing?: boolean;
  isSelected?: boolean;
  onSelect?: (walletId: string, selected: boolean) => void;
}

export default function WalletItem({ 
  wallet, 
  onClick, 
  isSyncing = false,
  isSelected = false,
  onSelect
}: WalletItemProps) {
  // Formatação da data da última sincronização
  const formatLastSync = (lastSyncStr?: string) => {
    if (!lastSyncStr) return null;
    
    try {
      const lastSync = new Date(lastSyncStr);
      return {
        // Formato completo: "12 de maio de 2023, 14:30"
        full: format(lastSync, "PPP, HH:mm", { locale: ptBR }),
        // Formato relativo: "há 5 minutos", "há 2 horas", etc.
        relative: formatDistanceToNow(lastSync, { locale: ptBR, addSuffix: true })
      };
    } catch (e) {
      return null;
    }
  };

  const lastSyncFormatted = formatLastSync(wallet.metadata?.lastSync);

  return (
    <Card 
      key={wallet.id} 
      className="p-6 hover:shadow-md transition-shadow cursor-pointer relative" 
      onClick={() => onClick(wallet.id)}
    >
      {onSelect && (
        <div 
          className="absolute top-4 left-4 z-10" 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(wallet.id, !isSelected);
          }}
        >
          <Checkbox 
            checked={isSelected}
            className="h-5 w-5"
          />
        </div>
      )}
      
      <div className="flex items-start justify-between">
        {wallet.bank && (
          <img
            src={wallet.bank.logo}
            alt={wallet.bank.name}
            className="h-12 w-12 object-contain mb-4 ml-8"
          />
        )}
        
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {wallet.type === "BANK_INTEGRATION" && (
            <>
              <SyncWalletButton walletId={wallet.id} walletName={wallet.name} />
              
              {wallet.metadata?.connectionId && (
                <TestConnectionButton 
                  connectionId={wallet.metadata.connectionId}
                  walletId={wallet.id}
                  variant="icon"
                />
              )}
              
              <div onClick={(e) => e.stopPropagation()}>
                <BankConnectionEditButton 
                  connectionId={wallet.metadata?.connectionId || wallet.id}
                  walletId={wallet.id}
                  initialData={{
                    applicationKey: wallet.metadata?.applicationKey || "",
                    clientBasic: wallet.metadata?.clientBasic || "",
                    clientId: wallet.metadata?.clientId || "",
                    clientSecret: wallet.metadata?.clientSecret || "",
                    apiUrl: wallet.metadata?.apiUrl || "",
                    agencia: wallet.metadata?.agencia || "",
                    conta: wallet.metadata?.conta || ""
                  }}
                  variant="icon"
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      <h3 className="font-medium text-lg">{wallet.name}</h3>
      <p className="text-2xl font-bold">{formatCurrency(wallet.balance)}</p>
      
      {lastSyncFormatted && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Clock className="h-3 w-3" />
          <span>Atualizado {lastSyncFormatted.relative}</span>
        </div>
      )}
    </Card>
  );
} 
