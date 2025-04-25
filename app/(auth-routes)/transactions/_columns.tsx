"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransactionDetails } from "@/app/_components/transaction-details";
import { shouldHideTransaction } from "@/app/_services/bank-transaction-service";
import { useState } from "react";
import { toast } from "@/app/_components/ui/use-toast";
import { ArrowDownIcon, ArrowUpIcon, RepeatIcon, CreditCardIcon, BanknoteIcon, SmartphoneIcon, LinkIcon } from "lucide-react";
import { Badge } from "@/app/_components/ui/badge";
import { useNotificationMiddleware } from "@/app/_hooks/notification";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";
import { cn } from "@/app/_lib/utils";
import { formatCurrency } from "@/app/_utils/format";
import { useTransactionNotifications } from "@/app/_hooks/transaction/use-transaction-notifications";

// Definição do tipo de transação
export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: Date;
  type: string; // Alterado para aceitar qualquer tipo de string
  category: string;
  categoryId?: string | null;
  paymentMethod: string;
  metadata?: any;
  wallet?: {
    name: string;
    id: string;
  } | null;
  categoryObj?: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  } | null;
  isReconciled?: boolean; // Status de conciliação
  linkedSales?: any[]; // Vendas vinculadas a esta transação
}

// Mapeamento de ícones para métodos de pagamento
const paymentMethodIcons = {
  CREDIT_CARD: <CreditCardIcon className="h-3 w-3 mr-1" />,
  DEBIT_CARD: <CreditCardIcon className="h-3 w-3 mr-1" />,
  BANK_TRANSFER: <ArrowDownIcon className="h-3 w-3 mr-1 rotate-45" />,
  BANK_SLIP: <BanknoteIcon className="h-3 w-3 mr-1" />,
  CASH: <BanknoteIcon className="h-3 w-3 mr-1" />,
  PIX: <SmartphoneIcon className="h-3 w-3 mr-1" />,
  OTHER: null
};

export const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row }) => {
      const date = row.getValue("date") as Date;
      return (
        <div className="text-foreground font-medium">
          {format(new Date(date), "dd/MM/yyyy", { locale: ptBR })}
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Descrição",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const transaction = row.original;
      const isRecurrent = transaction.metadata?.isRecurrent || false;
      
      return (
        <div className="flex items-center gap-1 text-foreground">
          {isRecurrent && <RepeatIcon className="h-3 w-3 text-blue-500" />}
          <span className="truncate max-w-xs" title={name}>{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const transaction = row.original;
      const type = transaction.type;
      const metadata = transaction.metadata || {};
      
      // Ícone e cor com base no tipo de transação
      let icon = null;
      let label = "";
      let bgColor = "";
      let textColor = "";
      
      // Determinar tipo, ícone e cores com base na transação
      if (type === "EXPENSE" || metadata.indicadorSinalLancamento === "D") {
        icon = <ArrowUpIcon className="h-3 w-3" />;
        label = "Despesa";
        bgColor = "bg-red-100 dark:bg-red-900/20";
        textColor = "text-red-600 dark:text-red-400";
      } else if (type === "DEPOSIT" || type === "INCOME" || metadata.indicadorSinalLancamento === "C") {
        icon = <ArrowDownIcon className="h-3 w-3" />;
        label = "Receita";
        bgColor = "bg-emerald-100 dark:bg-emerald-900/20";
        textColor = "text-emerald-600 dark:text-emerald-400";
      } else if (type === "INVESTMENT") {
        icon = <ArrowUpIcon className="h-3 w-3" />;
        label = "Investimento";
        bgColor = "bg-purple-100 dark:bg-purple-900/20";
        textColor = "text-purple-600 dark:text-purple-400";
      } else if (type === "TRANSFER") {
        icon = <ArrowDownIcon className="h-3 w-3 rotate-90" />;
        label = "Transferência";
        bgColor = "bg-blue-100 dark:bg-blue-900/20";
        textColor = "text-blue-600 dark:text-blue-400";
      }
      
      return (
        <Badge variant="outline" className={`${bgColor} ${textColor} border-transparent flex items-center gap-1 whitespace-nowrap`}>
          {icon}
          <span>{label}</span>
        </Badge>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row }) => {
      const transaction = row.original;
      const { notifyEvent } = useNotificationMiddleware();
      const { notifyTransactionUpdated } = useTransactionNotifications();
      const metadata = transaction.metadata || {};
      const [selectedCategory, setSelectedCategory] = useState(transaction.category || "");
      const [isUpdating, setIsUpdating] = useState(false);
      
      // Se tiver categoryObj, usar para exibição mais rica
      const categoryObj = transaction.categoryObj;
      const hasCustomCategory = !!categoryObj;
      
      // Função para atualizar a categoria da transação
      const updateCategory = async (category: string) => {
        if (category === selectedCategory) return;
        
        setIsUpdating(true);
        try {
          const response = await fetch('/api/transactions/categorize', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transactionId: transaction.id,
              category,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Falha ao atualizar categoria');
          }
          
          setSelectedCategory(category);
          toast({
            title: "Categoria atualizada",
            description: "A categoria da transação foi atualizada com sucesso.",
          });
          
          // Notificar atualização da transação
          notifyTransactionUpdated(transaction, {
            categoryUpdated: true,
            previousCategory: selectedCategory,
            newCategory: category,
            message: `A categoria da transação foi atualizada de "${selectedCategory || 'Sem categoria'}" para "${category}"`
          });
          
          // Criar notificação sobre a atualização da categoria
          notifyEvent({
            title: "Categoria atualizada",
            message: `A categoria da transação "${transaction.name}" foi atualizada para "${category}"`,
            type: NotificationType.TRANSACTION,
            priority: NotificationPriority.LOW,
            metadata: {
              transactionId: transaction.id,
              newCategory: category,
              previousCategory: selectedCategory
            }
          });
        } catch (error) {
          console.error('Erro ao atualizar categoria:', error);
          toast({
            title: "Erro",
            description: "Não foi possível atualizar a categoria. Tente novamente.",
            variant: "destructive",
          });
        } finally {
          setIsUpdating(false);
        }
      };
      
      // Para transações importadas, exibir um componente de seleção de categoria
      if (metadata.source === "bank_import" || metadata.source === "gestao_click") {
        return (
          <div className="max-w-xs">
            <select 
              className="w-full p-1 text-sm bg-background border border-input rounded-md"
              value={selectedCategory}
              disabled={isUpdating}
              onChange={(e) => updateCategory(e.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Moradia">Moradia</option>
              <option value="Transporte">Transporte</option>
              <option value="Saúde">Saúde</option>
              <option value="Educação">Educação</option>
              <option value="Lazer">Lazer</option>
              <option value="Vestuário">Vestuário</option>
              <option value="Viagem">Viagem</option>
              <option value="Serviços">Serviços</option>
              <option value="Impostos">Impostos</option>
              <option value="Transferência">Transferência</option>
              <option value="Salário">Salário</option>
              <option value="Investimento">Investimento</option>
              <option value="Outros">Outros</option>
            </select>
            {isUpdating && <div className="text-xs text-muted-foreground mt-1">Atualizando...</div>}
          </div>
        );
      }
      
      // Se tiver objeto de categoria, exibir com estilo
      if (hasCustomCategory && categoryObj) {
        return (
          <div 
            className="flex items-center gap-1 p-1 rounded-md bg-muted/60"
            style={{ color: categoryObj.color }}
          >
            {categoryObj.icon && <span className="text-xs">{categoryObj.icon}</span>}
            <span className="font-medium text-sm">{categoryObj.name}</span>
          </div>
        );
      }
      
      // Exibição padrão da categoria
      return (
        <div className="text-foreground">
          {transaction.category || "Sem categoria"}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentMethod",
    header: "Pagamento",
    cell: ({ row }) => {
      const transaction = row.original;
      const method = transaction.paymentMethod;
      
      // Mapear o método de pagamento para um nome amigável
      const methodNames: Record<string, string> = {
        CREDIT_CARD: "Crédito",
        DEBIT_CARD: "Débito",
        BANK_TRANSFER: "Transferência",
        BANK_SLIP: "Boleto",
        CASH: "Dinheiro",
        PIX: "PIX",
        OTHER: "Outro"
      };
      
      const icon = paymentMethodIcons[method as keyof typeof paymentMethodIcons] || null;
      const label = methodNames[method] || method;
      
      return (
        <div className="flex items-center text-sm text-muted-foreground">
          {icon}
          {label}
        </div>
      );
    },
  },
  {
    accessorKey: "wallet",
    header: "Carteira",
    cell: ({ row }) => {
      const transaction = row.original;
      const wallet = transaction.wallet;
      
      if (!wallet) {
        return <div className="text-muted-foreground italic">Sem carteira</div>;
      }
      
      return (
        <div className="flex items-center gap-1">
          <span className="font-medium text-blue-600">{wallet.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number;
      const transaction = row.original;
      const type = transaction.type;
      const metadata = transaction.metadata || {};
      
      // Usar o novo utilitário de formatação de moeda
      const formatted = formatCurrency(Math.abs(amount));

      // Determinar a cor com base no tipo de transação
      let colorClass = "";
      let icon = null;
      
      // Verificar se é uma transação importada do banco ou do Gestão Click
      if (metadata.source === "bank_import" || metadata.source === "gestao_click") {
        if (metadata.indicadorSinalLancamento === "D" || type === "EXPENSE") {
          colorClass = "text-red-600 dark:text-red-400";
          icon = <ArrowUpIcon className="h-3 w-3 mr-1" />;
        } else if (metadata.indicadorSinalLancamento === "C" || type === "DEPOSIT" || type === "INCOME") {
          colorClass = "text-emerald-600 dark:text-emerald-400";
          icon = <ArrowDownIcon className="h-3 w-3 mr-1" />;
        }
      } else {
        // Transações manuais
        if (type === "EXPENSE") {
          colorClass = "text-red-600 dark:text-red-400";
          icon = <ArrowUpIcon className="h-3 w-3 mr-1" />;
        } else if (type === "DEPOSIT" || type === "INCOME") {
          colorClass = "text-emerald-600 dark:text-emerald-400";
          icon = <ArrowDownIcon className="h-3 w-3 mr-1" />;
        } else if (type === "INVESTMENT") {
          colorClass = "text-purple-600 dark:text-purple-400";
        } else if (type === "TRANSFER") {
          colorClass = "text-blue-600 dark:text-blue-400";
        }
      }
      
      return (
        <div className={`text-right font-medium flex justify-end items-center ${colorClass}`}>
          {icon}
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: "isReconciled",
    header: "Conciliação",
    cell: ({ row }) => {
      const transaction = row.original;
      const isReconciled = transaction.isReconciled;
      const hasLinkedSales = transaction.linkedSales && transaction.linkedSales.length > 0;
      
      if (isReconciled || hasLinkedSales) {
        return (
          <div className="flex justify-center">
            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-500 border-green-200 dark:border-green-800 flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              <span className="text-xs">Conciliada</span>
            </Badge>
          </div>
        );
      }
      
      return (
        <div className="flex justify-center">
          <Badge variant="outline" className="bg-gray-100 text-gray-500 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800">
            <span className="text-xs">Não conciliada</span>
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original;
      
      return (
        <div className="flex justify-end">
          <TransactionDetails transaction={transaction} />
        </div>
      );
    },
  },
]; 