import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  Wallet, 
  CreditCard, 
  Building, 
  Coins, 
  MoreHorizontal, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  PencilLine, 
  CircleAlert,
  Check,
  RefreshCw
} from "lucide-react";
import { cn } from "@/app/_lib/utils";
import Link from "next/link";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// Tipos de carteira suportados
export type WalletType = "bank" | "cash" | "creditCard" | "investment";

// Interface para as propriedades da carteira
export interface WalletData {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  currency?: string;
  institution?: string;
  lastSync?: string;
  isConnected?: boolean;
  status?: "active" | "error" | "syncing";
  accountNumber?: string;
}

interface WalletCardProps {
  wallet: WalletData;
  onEdit?: (id: string) => void;
  onSync?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
  hideBalance?: boolean;
  toggleHideBalance?: () => void;
  isDefault?: boolean;
  className?: string;
}

/**
 * Componente WalletCard - Exibe informações de uma carteira
 */
export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  onEdit,
  onSync,
  onDelete,
  onSetDefault,
  hideBalance = false,
  toggleHideBalance,
  isDefault = false,
  className
}) => {
  // Formatar o valor do saldo para exibição
  const formatBalance = (value: number): string => {
    if (hideBalance) return "••••••";
    
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: wallet.currency || "BRL"
    }).format(value);
  };
  
  // Determinar o ícone com base no tipo de carteira
  const getWalletIcon = () => {
    switch (wallet.type) {
      case "bank":
        return <Building className="h-5 w-5" />;
      case "cash":
        return <Coins className="h-5 w-5" />;
      case "creditCard":
        return <CreditCard className="h-5 w-5" />;
      case "investment":
        return <Wallet className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };
  
  // Determinar a cor/classe com base no tipo de carteira
  const getWalletColor = (): string => {
    switch (wallet.type) {
      case "bank":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "cash":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      case "creditCard":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      case "investment":
        return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };
  
  // Determinar o estado/status da carteira
  const getStatusBadge = () => {
    if (!wallet.status || wallet.status === "active") {
      return null;
    }
    
    if (wallet.status === "syncing") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 animate-pulse dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Sincronizando
        </Badge>
      );
    }
    
    if (wallet.status === "error") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          <CircleAlert className="h-3 w-3 mr-1" />
          Erro
        </Badge>
      );
    }
    
    return null;
  };
  
  return (
    <Card className={cn(
      "overflow-hidden group hover:shadow-md transition-all duration-300 relative",
      wallet.status === "error" ? "border-red-200 dark:border-red-800" : "border-none",
      className
    )}>
      {/* Gradiente de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-card to-background opacity-60 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Badge de carteira padrão */}
      {isDefault && (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary text-primary-foreground text-[10px] py-1 px-6 shadow-sm">
            Padrão
          </div>
        </div>
      )}
      
      <CardHeader className="relative z-10 flex flex-row items-start justify-between pb-2 pt-4">
        <div className="flex items-start gap-3">
          {/* Ícone da carteira */}
          <div className={cn("p-2 rounded-md", getWalletColor())}>
            {getWalletIcon()}
          </div>
          
          <div>
            {/* Nome da carteira */}
            <h3 className="font-medium flex items-center">
              {wallet.name}
              {wallet.isConnected && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Check className="h-4 w-4 ml-1.5 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="text-xs">Conectado</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </h3>
            
            {/* Instituição ou detalhes da carteira */}
            {wallet.institution && (
              <p className="text-xs text-muted-foreground">
                {wallet.institution}
                {wallet.accountNumber && ` • ${wallet.accountNumber.replace(/(\d{4})(\d+)(\d{4})/, "$1 •••• $3")}`}
              </p>
            )}
          </div>
        </div>
        
        {/* Menu de opções */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted/80 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Opções</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {/* Opções de menu */}
            <DropdownMenuItem onClick={() => onEdit?.(wallet.id)} className="cursor-pointer">
              <PencilLine className="h-4 w-4 mr-2" />
              Editar carteira
            </DropdownMenuItem>
            
            {wallet.isConnected && (
              <DropdownMenuItem onClick={() => onSync?.(wallet.id)} className="cursor-pointer">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar agora
              </DropdownMenuItem>
            )}
            
            {!isDefault && onSetDefault && (
              <DropdownMenuItem onClick={() => onSetDefault?.(wallet.id)} className="cursor-pointer">
                <Check className="h-4 w-4 mr-2" />
                Definir como padrão
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => onDelete?.(wallet.id)} 
              className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
            >
              <CircleAlert className="h-4 w-4 mr-2" />
              Excluir carteira
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      
      <CardContent className="relative z-10 pt-0 pb-4">
        {/* Status da carteira */}
        {getStatusBadge()}
        
        {/* Saldo */}
        <div className="mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Saldo atual</span>
            {toggleHideBalance && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleHideBalance} 
                className="h-6 w-6 rounded-full"
              >
                {hideBalance ? (
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
          </div>
          <p className={cn(
            "text-2xl font-bold mt-1", 
            wallet.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {formatBalance(wallet.balance)}
          </p>
        </div>
        
        {/* Data da última sincronização */}
        {wallet.lastSync && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center">
            <RefreshCw className="h-3 w-3 mr-1 inline" />
            Última atualização: {wallet.lastSync}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 pb-4 relative z-10">
        <Link href={`/wallets/${wallet.id}`} className="w-full">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs justify-between hover:bg-background/80 transition-colors group"
          >
            <span>Ver detalhes</span>
            <ExternalLink className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default WalletCard; 