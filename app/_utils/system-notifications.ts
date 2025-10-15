"use client";

import { 
  NotificationType, 
  NotificationPriority,
  Notification
} from '@/app/_types/notification';
import { v4 as uuidv4 } from 'uuid';
import useNotificationStore from '@/app/_hooks/notification/use-notification-store';

/**
 * Tipos dos eventos de sistema para notificações
 */
export enum SystemEventType {
  // Eventos de transação
  TRANSACTION_CREATED = 'transaction_created',
  TRANSACTION_UPDATED = 'transaction_updated',
  TRANSACTION_DELETED = 'transaction_deleted',
  TRANSACTIONS_IMPORTED = 'transactions_imported',
  
  // Eventos de carteira
  WALLET_CREATED = 'wallet_created', 
  WALLET_UPDATED = 'wallet_updated',
  WALLET_DELETED = 'wallet_deleted',
  WALLETS_IMPORTED = 'wallets_imported',
  
  // Eventos de categorias
  CATEGORY_CREATED = 'category_created',
  CATEGORY_UPDATED = 'category_updated',
  CATEGORY_DELETED = 'category_deleted',
  
  // Eventos de orçamento
  BUDGET_CREATED = 'budget_created',
  BUDGET_UPDATED = 'budget_updated',
  BUDGET_LIMIT_REACHED = 'budget_limit_reached',
  
  // Eventos de importação
  IMPORT_STARTED = 'import_started',
  IMPORT_COMPLETED = 'import_completed',
  IMPORT_FAILED = 'import_failed',
  
  // Eventos do sistema
  SYSTEM_UPDATED = 'system_updated',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_ERROR = 'system_error'
}

/**
 * Interface para os detalhes de um evento de sistema
 */
export interface SystemEventDetails {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
}

/**
 * Mapeamento de eventos de sistema para detalhes de notificação
 */
const systemEventMap: Record<SystemEventType, (data?: any) => SystemEventDetails> = {
  // Eventos de transação
  [SystemEventType.TRANSACTION_CREATED]: (data) => ({
    title: 'Nova transação',
    message: data?.description 
      ? `Transação "${data.description}" criada com sucesso` 
      : 'Nova transação criada com sucesso',
    type: NotificationType.TRANSACTION,
    priority: NotificationPriority.LOW,
    link: data?.id ? `/transactions/${data.id}` : '/transactions',
    metadata: data
  }),
  
  [SystemEventType.TRANSACTION_UPDATED]: (data) => ({
    title: 'Transação atualizada',
    message: data?.description 
      ? `Transação "${data.description}" atualizada com sucesso` 
      : 'Transação atualizada com sucesso',
    type: NotificationType.TRANSACTION,
    priority: NotificationPriority.LOW,
    link: data?.id ? `/transactions/${data.id}` : '/transactions',
    metadata: data
  }),
  
  [SystemEventType.TRANSACTION_DELETED]: (data) => ({
    title: 'Transação excluída',
    message: data?.description 
      ? `Transação "${data.description}" excluída com sucesso` 
      : 'Transação excluída com sucesso',
    type: NotificationType.TRANSACTION,
    priority: NotificationPriority.LOW,
    metadata: data
  }),
  
  [SystemEventType.TRANSACTIONS_IMPORTED]: (data) => ({
    title: 'Transações importadas',
    message: data?.count 
      ? `${data.count} transações importadas com sucesso` 
      : 'Transações importadas com sucesso',
    type: NotificationType.TRANSACTION,
    priority: NotificationPriority.MEDIUM,
    link: '/transactions',
    metadata: data
  }),
  
  // Eventos de carteira
  [SystemEventType.WALLET_CREATED]: (data) => ({
    title: 'Nova carteira',
    message: data?.name 
      ? `Carteira "${data.name}" criada com sucesso` 
      : 'Nova carteira criada com sucesso',
    type: NotificationType.BALANCE,
    priority: NotificationPriority.LOW,
    link: data?.id ? `/wallets/${data.id}` : '/wallets',
    metadata: data
  }),
  
  [SystemEventType.WALLET_UPDATED]: (data) => ({
    title: 'Carteira atualizada',
    message: data?.name 
      ? `Carteira "${data.name}" atualizada com sucesso` 
      : 'Carteira atualizada com sucesso',
    type: NotificationType.BALANCE,
    priority: NotificationPriority.LOW,
    link: data?.id ? `/wallets/${data.id}` : '/wallets',
    metadata: data
  }),
  
  [SystemEventType.WALLET_DELETED]: (data) => ({
    title: 'Carteira excluída',
    message: data?.name 
      ? `Carteira "${data.name}" excluída com sucesso` 
      : 'Carteira excluída com sucesso',
    type: NotificationType.BALANCE,
    priority: NotificationPriority.LOW,
    metadata: data
  }),
  
  [SystemEventType.WALLETS_IMPORTED]: (data) => ({
    title: 'Carteiras importadas',
    message: data?.count 
      ? `${data.count} carteiras importadas com sucesso` 
      : 'Carteiras importadas com sucesso',
    type: NotificationType.BALANCE,
    priority: NotificationPriority.MEDIUM,
    link: '/wallets',
    metadata: data
  }),
  
  // Eventos de categorias
  [SystemEventType.CATEGORY_CREATED]: (data) => ({
    title: 'Nova categoria',
    message: data?.name 
      ? `Categoria "${data.name}" criada com sucesso` 
      : 'Nova categoria criada com sucesso',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.LOW,
    metadata: data
  }),
  
  [SystemEventType.CATEGORY_UPDATED]: (data) => ({
    title: 'Categoria atualizada',
    message: data?.name 
      ? `Categoria "${data.name}" atualizada com sucesso` 
      : 'Categoria atualizada com sucesso',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.LOW,
    metadata: data
  }),
  
  [SystemEventType.CATEGORY_DELETED]: (data) => ({
    title: 'Categoria excluída',
    message: data?.name 
      ? `Categoria "${data.name}" excluída com sucesso` 
      : 'Categoria excluída com sucesso',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.LOW,
    metadata: data
  }),
  
  // Eventos de orçamento
  [SystemEventType.BUDGET_CREATED]: (data) => ({
    title: 'Novo orçamento',
    message: data?.name 
      ? `Orçamento "${data.name}" criado com sucesso` 
      : 'Novo orçamento criado com sucesso',
    type: NotificationType.GOAL,
    priority: NotificationPriority.LOW,
    link: data?.id ? `/budgets/${data.id}` : '/budgets',
    metadata: data
  }),
  
  [SystemEventType.BUDGET_UPDATED]: (data) => ({
    title: 'Orçamento atualizado',
    message: data?.name 
      ? `Orçamento "${data.name}" atualizado com sucesso` 
      : 'Orçamento atualizado com sucesso',
    type: NotificationType.GOAL,
    priority: NotificationPriority.LOW,
    link: data?.id ? `/budgets/${data.id}` : '/budgets',
    metadata: data
  }),
  
  [SystemEventType.BUDGET_LIMIT_REACHED]: (data) => ({
    title: 'Limite de orçamento atingido',
    message: data?.name 
      ? `O orçamento "${data.name}" atingiu o limite` 
      : 'Um orçamento atingiu o limite',
    type: NotificationType.GOAL,
    priority: NotificationPriority.HIGH,
    link: data?.id ? `/budgets/${data.id}` : '/budgets',
    metadata: data
  }),
  
  // Eventos de importação
  [SystemEventType.IMPORT_STARTED]: (data) => ({
    title: 'Importação iniciada',
    message: data?.source 
      ? `Importação de dados do ${data.source} iniciada` 
      : 'Importação de dados iniciada',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.LOW,
    link: data?.redirectUrl || '/import-dashboard',
    metadata: data
  }),
  
  [SystemEventType.IMPORT_COMPLETED]: (data) => ({
    title: 'Importação concluída',
    message: data?.summary 
      ? `Importação concluída: ${data.summary}` 
      : 'Importação de dados concluída com sucesso',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    link: data?.redirectUrl || '/import-dashboard',
    metadata: data
  }),
  
  [SystemEventType.IMPORT_FAILED]: (data) => ({
    title: 'Falha na importação',
    message: data?.error 
      ? `Erro na importação: ${data.error}` 
      : 'A importação de dados falhou',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.HIGH,
    link: data?.redirectUrl || '/import-dashboard',
    metadata: data
  }),
  
  // Eventos do sistema
  [SystemEventType.SYSTEM_UPDATED]: (data) => ({
    title: 'Sistema atualizado',
    message: data?.details 
      ? `O sistema foi atualizado: ${data.details}` 
      : 'O sistema foi atualizado com novos recursos',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.MEDIUM,
    metadata: data
  }),
  
  [SystemEventType.SYSTEM_MAINTENANCE]: (data) => ({
    title: 'Manutenção programada',
    message: data?.details 
      ? `Manutenção programada: ${data.details}` 
      : 'O sistema entrará em manutenção em breve',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.HIGH,
    metadata: data
  }),
  
  [SystemEventType.SYSTEM_ERROR]: (data) => ({
    title: 'Erro no sistema',
    message: data?.message 
      ? `Erro: ${data.message}` 
      : 'Ocorreu um erro no sistema',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.HIGH,
    metadata: data
  })
};

/**
 * Cria uma notificação de sistema no cliente
 * @param eventType Tipo do evento
 * @param data Dados adicionais para a notificação
 * @returns ID da notificação criada
 */
export function createSystemNotification(
  eventType: SystemEventType,
  data?: any
): string | null {
  try {
    // Se não estiver no cliente, retorna null
    if (typeof window === 'undefined') return null;
    
    // Obter o store de notificações
    const store = useNotificationStore.getState();
    
    // Obter os detalhes do evento
    const eventDetailsFunc = systemEventMap[eventType];
    if (!eventDetailsFunc) return null;
    
    const eventDetails = eventDetailsFunc(data);
    
    // Criar a notificação
    const notificationId = uuidv4();
    const notification: Notification = {
      id: notificationId,
      title: eventDetails.title,
      message: eventDetails.message,
      type: eventDetails.type,
      priority: eventDetails.priority,
      isRead: false,
      isArchived: false,
      link: eventDetails.link,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      metadata: {
        eventType,
        ...eventDetails.metadata
      }
    };
    
    // Adicionar a notificação ao store
    store.addNotification(notification);
    
    return notificationId;
  } catch (error) {
    console.error('Erro ao criar notificação de sistema:', error);
    return null;
  }
}

/**
 * Versão do servidor para criar notificações de sistema via API
 * @param eventType Tipo do evento
 * @param data Dados adicionais para a notificação
 * @param userId ID do usuário (opcional)
 * @returns Promise que resolve para o ID da notificação ou null
 */
export async function createSystemNotificationServer(
  eventType: SystemEventType,
  data?: any,
  userId?: string
): Promise<string | null> {
  try {
    // Obter os detalhes do evento
    const eventDetailsFunc = systemEventMap[eventType];
    if (!eventDetailsFunc) return null;
    
    const eventDetails = eventDetailsFunc(data);
    
    // Fazer uma requisição para a API de notificações
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: eventDetails.title,
        message: eventDetails.message,
        type: eventDetails.type,
        priority: eventDetails.priority,
        link: eventDetails.link,
        metadata: {
          eventType,
          ...eventDetails.metadata
        },
        userId: userId // Se fornecido, envia para um usuário específico
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Falha ao criar notificação');
    }
    
    const responseData = await response.json();
    return responseData.notification?.id || null;
  } catch (error) {
    console.error('Erro ao criar notificação de sistema no servidor:', error);
    return null;
  }
} 
