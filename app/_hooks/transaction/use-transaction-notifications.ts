"use client";

import { useNotificationMiddleware } from "@/app/_hooks/notification";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";
import { formatCurrency } from "@/app/_utils/format";
import { TransactionType } from '@/app/_types/transaction';
import { SystemEventType } from '@/app/_utils/system-notifications';

/**
 * Interface para definir opções das notificações de transações
 */
interface TransactionNotifyOptions {
  /**
   * Se deve exibir notificações
   */
  showNotifications?: boolean;
  
  /**
   * Prioridade padrão das notificações
   */
  defaultPriority?: NotificationPriority;
}

/**
 * Hook personalizado para gerenciar notificações relacionadas a transações
 */
export function useTransactionNotifications(options: TransactionNotifyOptions = {}) {
  const { 
    showNotifications = true, 
    defaultPriority = NotificationPriority.MEDIUM 
  } = options;
  
  const { notifyEvent } = useNotificationMiddleware();
  
  /**
   * Notifica sobre a criação de uma nova transação
   */
  const notifyTransactionCreated = (transaction: any, options?: { message?: string }) => {
    if (!showNotifications) return;
    
    // Determinar o título e ícone com base no tipo de transação
    let title = "Nova transação adicionada";
    let icon = "💵";
    
    if (transaction.type === "EXPENSE") {
      title = "Nova despesa adicionada";
      icon = "📤";
    } else if (transaction.type === "INCOME" || transaction.type === "DEPOSIT") {
      title = "Nova receita adicionada";
      icon = "📥";
    } else if (transaction.type === "INVESTMENT") {
      title = "Novo investimento adicionado";
      icon = "📈";
    } else if (transaction.type === "TRANSFER") {
      title = "Nova transferência adicionada";
      icon = "↔️";
    }
    
    const message = options?.message || 
      `${transaction.name} - ${formatCurrency(transaction.amount)}`;
    
    notifyEvent({
      title: `${icon} ${title}`,
      message,
      type: NotificationType.TRANSACTION,
      priority: defaultPriority,
      metadata: {
        transactionId: transaction.id,
        action: "created"
      }
    });
  };
  
  /**
   * Notifica sobre a atualização de uma transação
   */
  const notifyTransactionUpdated = (transaction: any, details: {
    amountUpdated?: boolean;
    categoryUpdated?: boolean;
    dateUpdated?: boolean;
    previousCategory?: string;
    newCategory?: string;
    previousAmount?: number;
    newAmount?: number;
    message?: string;
  }) => {
    if (!showNotifications) return;
    
    const message = details.message || "Os detalhes da transação foram atualizados";
    
    notifyEvent({
      title: "✏️ Transação atualizada",
      message,
      type: NotificationType.TRANSACTION,
      priority: details.categoryUpdated || details.amountUpdated 
        ? NotificationPriority.MEDIUM 
        : NotificationPriority.LOW,
      metadata: {
        transactionId: transaction.id,
        action: "updated",
        ...details
      }
    });
  };
  
  /**
   * Notifica sobre a exclusão de uma transação
   */
  const notifyTransactionDeleted = (transaction: any) => {
    if (!showNotifications) return;
    
    notifyEvent({
      title: "🗑️ Transação excluída",
      message: `A transação "${transaction.name}" de ${formatCurrency(transaction.amount)} foi excluída`,
      type: NotificationType.TRANSACTION,
      priority: NotificationPriority.MEDIUM,
      metadata: {
        transactionId: transaction.id,
        action: "deleted"
      }
    });
  };
  
  /**
   * Notifica sobre transações importadas
   */
  const notifyTransactionsImported = (
    count: number, 
    source: string, 
    options?: { walletName?: string }
  ) => {
    if (!showNotifications || count === 0) return;
    
    let sourceLabel = "banco";
    if (source === "gestao_click") {
      sourceLabel = "Gestão Click";
    } else if (source === "import_file") {
      sourceLabel = "arquivo";
    }
    
    const walletInfo = options?.walletName ? ` para ${options.walletName}` : "";
    
    notifyEvent({
      title: "📋 Transações importadas",
      message: `${count} transações foram importadas do ${sourceLabel}${walletInfo}`,
      type: NotificationType.TRANSACTION,
      priority: count > 10 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      metadata: {
        action: "imported",
        count,
        source
      }
    });
  };
  
  /**
   * Notifica sobre erros em operações de transações
   */
  const notifyTransactionError = (
    error: Error, 
    context: { 
      operation: "create" | "update" | "delete" | "import" | "categorize"; 
      transaction?: any;
      details?: string;
    }
  ) => {
    if (!showNotifications) return;
    
    let title = "Erro na operação";
    
    switch (context.operation) {
      case "create":
        title = "Erro ao criar transação";
        break;
      case "update":
        title = "Erro ao atualizar transação";
        break;
      case "delete":
        title = "Erro ao excluir transação";
        break;
      case "import":
        title = "Erro na importação";
        break;
      case "categorize":
        title = "Erro ao categorizar";
        break;
    }
    
    const transactionInfo = context.transaction 
      ? ` "${context.transaction.name}"` 
      : "";
    
    notifyEvent({
      title: `❌ ${title}`,
      message: `${error.message}${transactionInfo}. ${context.details || ""}`,
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.HIGH,
      metadata: {
        error: error.message,
        operation: context.operation,
        transactionId: context.transaction?.id
      }
    });
  };
  
  return {
    notifyTransactionCreated,
    notifyTransactionUpdated,
    notifyTransactionDeleted,
    notifyTransactionsImported,
    notifyTransactionError
  };
} 