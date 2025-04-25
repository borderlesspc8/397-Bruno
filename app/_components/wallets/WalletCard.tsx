"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/app/_lib/utils";
import { cn } from "@/app/_lib/utils";
import { useRouter } from "next/navigation";
import { MdAccountBalance } from "react-icons/md";
import { BsCashCoin, BsCreditCard } from "react-icons/bs";
import { SiNubank } from "react-icons/si";
import { TbBrandCashapp } from "react-icons/tb";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import { Wallet } from "./types";

interface WalletCardProps {
  wallet: Wallet;
  isSelected?: boolean;
  syncStatus?: boolean;
  actionType?: 'view' | 'select' | 'delete' | 'none';
  data?: {
    path?: string;
    onSelectCallback?: string;
    onDeleteCallback?: string;
  };
}

export function WalletCard({ 
  wallet, 
  isSelected, 
  syncStatus,
  actionType,
  data
}: WalletCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  
  // Funções locais para lidar com eventos
  const handleClick = () => {
    if (actionType === 'view' && data?.path) {
      router.push(data.path);
    } else if (actionType === 'select' && data?.onSelectCallback) {
      // Disparar evento personalizado que será capturado no nível superior
      window.dispatchEvent(new CustomEvent('wallet-action', {
        detail: {
          type: 'select',
          walletId: wallet.id,
          callbackId: data.onSelectCallback
        }
      }));
    }
  };
  
  const handleSelectCheckbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionType === 'select' && data?.onSelectCallback) {
      window.dispatchEvent(new CustomEvent('wallet-action', {
        detail: {
          type: 'select',
          walletId: wallet.id,
          callbackId: data.onSelectCallback
        }
      }));
    }
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionType === 'delete' && data?.onDeleteCallback) {
      window.dispatchEvent(new CustomEvent('wallet-action', {
        detail: {
          type: 'delete',
          walletId: wallet.id,
          callbackId: data.onDeleteCallback
        }
      }));
    }
  };
  
  // Componente para o ícone da carteira
  const WalletIcon = () => {
    const getBankIconComponent = (bank: string) => {
      let Icon = MdAccountBalance;
      if (/nubank|nu/i.test(bank)) Icon = SiNubank;
      else if (/itau/i.test(bank)) Icon = MdAccountBalance;
      else if (/bradesco|santander|caixa|bb|brasil/i.test(bank)) Icon = TbBrandCashapp;
      return Icon;
    };

    const Icon = wallet.type === 'BANK' 
      ? getBankIconComponent(wallet.name.toLowerCase())
      : wallet.type === 'CASH' 
        ? BsCashCoin 
        : wallet.type === 'CREDIT_CARD' 
          ? BsCreditCard 
          : MdAccountBalance;
    
    return <Icon size={20} />;
  };
  
  const formattedBalance = formatCurrency(wallet.balance || 0);
  
  // Determinar se é clicável
  const isClickable = actionType === 'view' || actionType === 'select';
  
  return (
    <div 
      className={cn(
        "border rounded-lg p-3 transition-all duration-200 shadow-sm relative",
        "hover:shadow-md",
        isSelected ? "border-primary bg-primary/5" : "bg-card",
        syncStatus ? "border-yellow-500 animate-pulse" : "",
        isClickable ? "cursor-pointer" : ""
      )}
      onClick={isClickable ? handleClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex space-x-2">
          <div className="p-1.5 bg-primary/10 rounded-full text-primary">
            <WalletIcon />
          </div>
          <div>
            <h3 className="font-medium text-base">{wallet.name}</h3>
            <p className="text-xs text-muted-foreground">
              {wallet.account && wallet.agency 
                ? `Ag: ${wallet.agency} | Conta: ${wallet.account}`
                : `Tipo: ${wallet.type.toLowerCase()}`
              }
            </p>
          </div>
        </div>
        
        {/* Controles (Checkbox ou Botão de Excluir) */}
        <div>
          {actionType === 'select' && (
            <div onClick={handleSelectCheckbox}>
              <Checkbox 
                checked={isSelected}
                className="h-4 w-4"
              />
            </div>
          )}
          
          {actionType === 'delete' && (
            <div onClick={handleDelete}>
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "p-0 h-6 w-6 rounded-full", 
                  isHovered ? "opacity-100" : "opacity-0"
                )}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Saldo atual:</span>
          <span className={cn(
            "font-medium text-sm",
            (wallet.balance || 0) >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {formattedBalance}
          </span>
        </div>
        
        {wallet.lastSync && (
          <div className="flex justify-between items-center mt-0.5">
            <span className="text-xs text-muted-foreground">Última sincronização:</span>
            <span className="text-xs text-muted-foreground">
              {new Date(wallet.lastSync).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 