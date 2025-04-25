"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Wallet, PlusCircle, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { useWallets } from "./hooks/useWallets";
import { formatCurrency } from "./utils/formatters";
import { SubscriptionPlan } from "@/app/types";

interface WalletSelectorProps {
  userPlan: SubscriptionPlan;
}

export const WalletSelector = ({ userPlan }: WalletSelectorProps) => {
  const { 
    wallets, 
    selectedWallet, 
    isLoadingWallets,
    walletCount,
    totalBalance, 
    handleSelectWallet 
  } = useWallets();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-1.5"
        >
          {isLoadingWallets ? (
            <>
              <div className="animate-spin h-4 w-4 border-t-2 border-primary rounded-full mr-1"></div>
              <span>Carregando...</span>
            </>
          ) : selectedWallet.bank?.logo ? (
            <>
              <Image 
                src={selectedWallet.bank.logo} 
                alt={selectedWallet.bank.name} 
                width={16} 
                height={16} 
                className="h-4 w-4 rounded-full" 
              />
              <span className="hidden lg:inline-block max-w-[120px] truncate">
                {selectedWallet.name}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              <span className="hidden lg:inline-block max-w-[120px] truncate">
                {selectedWallet.name}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Suas Carteiras ({walletCount})</span>
          <span className="text-sm text-muted-foreground">
            Total: {formatCurrency(totalBalance)}
          </span>
        </DropdownMenuLabel>
        
        {isLoadingWallets ? (
          <div className="py-6 flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-t-2 border-primary rounded-full"></div>
          </div>
        ) : wallets.length === 0 ? (
          <div className="py-4 px-2 text-center text-sm text-muted-foreground">
            <p>Você ainda não tem carteiras.</p>
            <p>Crie uma para começar a gerenciar suas finanças!</p>
          </div>
        ) : (
          wallets?.slice(0, userPlan === SubscriptionPlan.FREE ? 1 : undefined).map(wallet => (
            <DropdownMenuItem 
              key={wallet?.id} 
              onClick={() => handleSelectWallet(wallet)}
              className="flex justify-between"
            >
              <div className="flex items-center">
                {wallet?.bank?.logo ? (
                  <Image 
                    src={wallet.bank.logo} 
                    alt={wallet.bank.name} 
                    width={16} 
                    height={16} 
                    className="mr-2 h-4 w-4 rounded-full" 
                  />
                ) : (
                  <Wallet className="mr-2 h-4 w-4" />
                )}
                <span>{wallet.name}</span>
                {selectedWallet.id === wallet.id && (
                  <Badge variant="outline" className="ml-2 text-xs">Ativa</Badge>
                )}
              </div>
              <span className="text-muted-foreground text-sm">
                {formatCurrency(wallet.balance)}
              </span>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/wallets/create" className="cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Nova Carteira
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/wallets" className="cursor-pointer">
            <ArrowRight className="mr-2 h-4 w-4" />
            Gerenciar Carteiras
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 