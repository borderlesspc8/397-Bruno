"use client";

import { useState } from "react";
import { Button, ButtonProps } from "./ui/button";
import { 
  ArrowDownUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PiggyBank, 
  RefreshCw 
} from "lucide-react";
import { TransactionDialog } from "./TransactionDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Log para debug
console.log("AddTransactionButton PascalCase carregado");

export interface AddTransactionButtonProps extends ButtonProps {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  tooltip?: string;
  fullWidth?: boolean;
  showIcon?: boolean;
  showText?: boolean;
  text?: string;
  icon?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddTransactionButton({
  variant = "default",
  size = "default",
  className = "",
  tooltip = "Adicionar nova transação",
  fullWidth = false,
  showIcon = true,
  showText = true,
  text = "Nova Transação",
  icon = <ArrowDownUp className="h-4 w-4" />,
  onSuccess,
  ...props
}: AddTransactionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'investment' | 'transfer'>('expense');

  console.log("Renderizando AddTransactionButton PascalCase");

  const handleSelectType = (type: 'expense' | 'income' | 'investment' | 'transfer') => {
    setTransactionType(type);
    setIsModalOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`${fullWidth ? "w-full" : ""} ${showIcon && showText ? "gap-2" : ""} rounded-full ${className}`}
            {...props}
          >
            {showIcon && icon}
            {showText && <span>{text}</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={() => handleSelectType('expense')} 
            className="cursor-pointer flex items-center py-3 hover:bg-red-50 dark:hover:bg-red-950/30 focus:bg-red-50 dark:focus:bg-red-950/30"
          >
            <ArrowUpRight className="mr-2 h-5 w-5 text-red-500" />
            <span>Nova despesa</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSelectType('income')} 
            className="cursor-pointer flex items-center py-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 focus:bg-emerald-50 dark:focus:bg-emerald-950/30"
          >
            <ArrowDownRight className="mr-2 h-5 w-5 text-emerald-500" />
            <span>Nova receita</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSelectType('investment')} 
            className="cursor-pointer flex items-center py-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 focus:bg-blue-50 dark:focus:bg-blue-950/30"
          >
            <PiggyBank className="mr-2 h-5 w-5 text-blue-500" />
            <span>Novo investimento</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleSelectType('transfer')} 
            className="cursor-pointer flex items-center py-3 hover:bg-purple-50 dark:hover:bg-purple-950/30 focus:bg-purple-50 dark:focus:bg-purple-950/30"
          >
            <RefreshCw className="mr-2 h-5 w-5 text-purple-500" />
            <span>Nova transferência</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TransactionDialog 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={onSuccess}
        initialData={{ type: transactionType }}
      />
    </>
  );
} 