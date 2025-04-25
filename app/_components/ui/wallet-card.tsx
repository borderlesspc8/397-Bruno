"use client";

import React from "react";
import { Check, CreditCard, ArrowUpDown, MoreHorizontal, Wallet } from "lucide-react";
import { cn } from "../../_lib/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./dropdown-menu";
import { Progress } from "./progress";

// Componente Skeleton - criando diretamente para evitar dependência
interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);

// Formato da carteira
export interface WalletData {
  id: string;
  name: string;
  balance: number;
  type: "default" | "bank" | "cash" | "investment" | "credit";
  lastUpdate?: string;
  icon?: React.ReactNode;
  isDefault?: boolean;
  currencyCode?: string;
  institution?: string;
  syncStatus?: "synced" | "syncing" | "error" | "manual";
  metadata?: Record<string, any>;
  description?: string;
  limit?: number;
  color?: string;
}

// Props para o componente
export interface WalletCardProps {
  wallet: WalletData;
  onSelect?: (wallet: WalletData) => void;
  onEdit?: (wallet: WalletData) => void;
  onDelete?: (wallet: WalletData) => void;
  onSync?: (wallet: WalletData) => void;
  isSyncing?: boolean;
  isSelected?: boolean;
  showActions?: boolean;
  className?: string;
  variant?: "default" | "outline" | "compact" | "highlight";
  showBalance?: boolean;
  showInstitution?: boolean;
  formatCurrency?: (value: number, currency?: string) => string;
}

/**
 * Componente WalletCard - Exibe informações da carteira em um cartão estilizado
 */
export function WalletCard({
  wallet,
  onSelect,
  onEdit,
  onDelete,
  onSync,
  isSyncing = false,
  isSelected = false,
  showActions = true,
  className,
  variant = "default",
  showBalance = true,
  showInstitution = true,
  formatCurrency = (value, currency = "BRL") => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value)
}: WalletCardProps) {
  // Determinar o ícone da carteira
  const renderWalletIcon = () => {
    if (wallet.icon) return wallet.icon;
    
    switch (wallet.type) {
      case "bank":
        return <CreditCard className="h-5 w-5" />;
      case "investment":
        return <ArrowUpDown className="h-5 w-5" />;
      case "credit":
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };
  
  // Calcular status da carteira
  const getWalletStatus = () => {
    if (wallet.syncStatus === "syncing" || isSyncing) {
      return {
        text: "Sincronizando...",
        variant: "outline" as const,
        indicator: <Progress value={80} className="h-1 w-10 bg-muted" />,
      };
    }
    
    if (wallet.syncStatus === "error") {
      return {
        text: "Erro ao sincronizar",
        variant: "destructive" as const,
      };
    }
    
    if (wallet.syncStatus === "synced") {
      const lastUpdate = wallet.lastUpdate 
        ? new Date(wallet.lastUpdate)
        : undefined;
        
      const updateText = lastUpdate 
        ? `Atualizado ${formatRelativeTime(lastUpdate)}`
        : "Sincronizado";
      
      return {
        text: updateText,
        variant: "outline" as const,
      };
    }
    
    return {
      text: "Manual",
      variant: "secondary" as const,
    };
  };
  
  // Formatador de tempo relativo
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `há ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "há 1 dia";
    if (diffDays < 30) return `há ${diffDays} dias`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return "há 1 mês";
    
    return `há ${diffMonths} meses`;
  };
  
  // Renderização baseada na variante
  if (variant === "compact") {
    return (
      <Card 
        className={cn(
          "relative overflow-hidden transition-all duration-200",
          isSelected ? "ring-2 ring-primary ring-offset-1" : "",
          wallet.color ? `border-l-4 border-l-[${wallet.color}]` : "",
          className
        )}
        onClick={() => onSelect?.(wallet)}
      >
        <CardContent className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              wallet.color ? `bg-[${wallet.color}]/10 text-[${wallet.color}]` : "bg-muted"
            )}>
              {renderWalletIcon()}
            </div>
            <div>
              <p className="font-medium text-sm">{wallet.name}</p>
              {showInstitution && wallet.institution && (
                <p className="text-xs text-muted-foreground">{wallet.institution}</p>
              )}
            </div>
          </div>
          
          {showBalance && (
            <div className="text-right">
              <p className="font-semibold">
                {formatCurrency(wallet.balance, wallet.currencyCode)}
              </p>
            </div>
          )}
          
          {isSelected && (
            <div className="absolute top-1 right-1">
              <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Renderização default e outras variantes
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-md",
        isSelected ? "ring-2 ring-primary ring-offset-1" : "",
        variant === "highlight" ? "bg-gradient-to-br from-primary-50 to-background dark:from-primary-950/20 dark:to-background border-primary/20" : "",
        wallet.color ? `border-t-4 border-t-[${wallet.color}]` : "",
        onSelect ? "cursor-pointer" : "",
        className
      )}
      onClick={onSelect ? () => onSelect(wallet) : undefined}
    >
      <CardHeader className="px-4 pb-0 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-full", 
              wallet.color ? `bg-[${wallet.color}]/10 text-[${wallet.color}]` : "bg-muted"
            )}>
              {renderWalletIcon()}
            </div>
            <div>
              <CardTitle className="text-base">{wallet.name}</CardTitle>
              {wallet.isDefault && (
                <Badge variant="outline" className="mt-1 h-5 text-xs bg-muted/50">
                  Principal
                </Badge>
              )}
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Opções da carteira</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {wallet.syncStatus !== "manual" && (
                  <DropdownMenuItem 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      onSync?.(wallet); 
                    }}
                    disabled={isSyncing}
                  >
                    {isSyncing ? "Sincronizando..." : "Sincronizar agora"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onEdit?.(wallet); 
                  }}
                >
                  Editar carteira
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onDelete?.(wallet); 
                  }}
                  className="text-red-500 focus:text-red-500"
                >
                  Excluir carteira
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {showInstitution && wallet.institution && (
          <CardDescription className="mt-1">
            {wallet.institution}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="px-4 pt-3">
        {showBalance && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Saldo atual</p>
            <p className={cn(
              "text-2xl font-bold",
              wallet.balance < 0 ? "text-red-500" : ""
            )}>
              {formatCurrency(wallet.balance, wallet.currencyCode)}
            </p>
            
            {wallet.limit && wallet.type === "credit" && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Limite utilizado</span>
                  <span className="font-medium">
                    {Math.abs(wallet.balance) / wallet.limit * 100}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(100, Math.abs(wallet.balance) / wallet.limit * 100)} 
                  className="h-1.5" 
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t bg-muted/20">
        <div className="w-full flex items-center justify-between text-xs">
          <Badge variant={getWalletStatus().variant} className="h-5 gap-1 text-xs px-2">
            {getWalletStatus().indicator}
            {getWalletStatus().text}
          </Badge>
          
          {wallet.description && (
            <span className="text-muted-foreground truncate max-w-[50%]">
              {wallet.description}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Esqueleto de carregamento para o WalletCard
 */
export function WalletCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>
          <Skeleton className="h-5 w-20" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="px-4 pb-0 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16 mt-1" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pt-3">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-36" />
          
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-1.5 w-full" />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-3 border-t bg-muted/20">
        <div className="w-full flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardFooter>
    </Card>
  );
} 