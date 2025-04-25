"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority 
} from '@/app/_types/notification';
import useNotificationStore from './use-notification-store';
import { useErrorHandler } from '@/app/_hooks/error/use-error-handler';

// Tipos de dados para o middleware de notificações
interface UseNotificationMiddlewareProps {
  /**
   * Se verdadeiro, erros capturados automaticamente geram notificações
   */
  autoNotifyErrors?: boolean;
  
  /**
   * Se verdadeiro, agrupa erros similares que ocorram em um curto espaço de tempo
   */
  shouldGroupSimilarErrors?: boolean;
  
  /**
   * Tempo em milissegundos para considerar erros como similares
   */
  groupingTimeWindow?: number;
  
  /**
   * Se verdadeiro, notificações terão uma data de expiração automática
   */
  setExpirationOnNotifications?: boolean;
  
  /**
   * Tempo em milissegundos para a expiração de notificações (padrão: 7 dias)
   */
  notificationExpirationTime?: number;
}

interface UseNotificationMiddlewareReturn {
  /**
   * Converte um erro em uma notificação e a adiciona ao sistema
   */
  notifyError: (error: unknown, context?: NotificationErrorContext) => string;
  
  /**
   * Intercepta erros do error handler e opcionalmente cria notificações
   */
  interceptError: (shouldNotify?: boolean) => void;
  
  /**
   * Notifica o usuário sobre um evento significativo no sistema
   */
  notifyEvent: (event: SystemEvent) => string;
}

interface NotificationErrorContext {
  /**
   * Contexto ou área do aplicativo onde ocorreu o erro
   */
  source?: string;
  
  /**
   * Título personalizado para a notificação
   */
  title?: string;
  
  /**
   * Mensagem personalizada para a notificação
   */
  message?: string;
  
  /**
   * Prioridade da notificação
   */
  priority?: NotificationPriority;
  
  /**
   * Tipo da notificação
   */
  type?: NotificationType;
  
  /**
   * Link para mais informações ou ação relacionada ao erro
   */
  link?: string;
  
  /**
   * Dados adicionais relacionados ao erro
   */
  metadata?: Record<string, any>;
}

interface SystemEvent {
  /**
   * Título do evento para mostrar na notificação
   */
  title: string;
  
  /**
   * Mensagem detalhada do evento
   */
  message: string;
  
  /**
   * Tipo de notificação que este evento representa
   */
  type: NotificationType;
  
  /**
   * Prioridade da notificação
   */
  priority?: NotificationPriority;
  
  /**
   * Link opcional para uma página relacionada ao evento
   */
  link?: string;
  
  /**
   * Metadados adicionais sobre o evento
   */
  metadata?: Record<string, any>;
}

/**
 * Hook para integrar o sistema de notificações com o sistema de tratamento de erros
 */
export function useNotificationMiddleware({
  autoNotifyErrors = true,
  shouldGroupSimilarErrors = true,
  groupingTimeWindow = 30000, // 30 segundos
  setExpirationOnNotifications = true,
  notificationExpirationTime = 604800000, // 7 dias em ms
}: UseNotificationMiddlewareProps = {}): UseNotificationMiddlewareReturn {
  const store = useNotificationStore();
  const { error, addListener, clearError } = useErrorHandler();
  
  // Cache de erros recentes para evitar duplicação
  const recentErrorsRef = useRef<Map<string, number>>(new Map());
  
  /**
   * Converte um erro em uma notificação
   */
  const notifyError = useCallback((
    error: unknown, 
    context?: NotificationErrorContext
  ): string => {
    // Extrair informações do erro
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const errorCode = 'code' in errorObj ? String(errorObj['code']) : undefined;
    const errorMessage = errorObj.message || 'Ocorreu um erro inesperado';
    const errorStack = errorObj.stack;
    
    // Determinar tipo e prioridade com base no contexto ou padrões
    const type = context?.type || NotificationType.SYSTEM;
    const priority = context?.priority || NotificationPriority.MEDIUM;
    
    // Criar fingerprint do erro para agrupamento
    const errorFingerprint = `${type}:${errorCode || ''}:${errorMessage.substring(0, 100)}`;
    
    // Verificar se é um erro similar recente
    if (shouldGroupSimilarErrors) {
      const now = Date.now();
      const lastOccurrence = recentErrorsRef.current.get(errorFingerprint);
      
      if (lastOccurrence && (now - lastOccurrence) < groupingTimeWindow) {
        // Atualizar timestamp e pular criação de nova notificação
        recentErrorsRef.current.set(errorFingerprint, now);
        
        // Procurar notificação existente para este erro
        const existingNotification = store.notifications.find(n => 
          n.metadata?.errorFingerprint === errorFingerprint &&
          !n.isRead
        );
        
        if (existingNotification) {
          // Atualizar contador na notificação existente
          const updatedCount = (existingNotification.metadata?.occurrenceCount || 1) + 1;
          const updatedMessage = `${context?.message || errorMessage} (${updatedCount}x)`;
          
          // Criar notificação atualizada
          const updatedNotification: Notification = {
            ...existingNotification,
            message: updatedMessage,
            metadata: {
              ...existingNotification.metadata,
              occurrenceCount: updatedCount,
              lastUpdatedAt: new Date()
            }
          };
          
          // Remover a existente e adicionar a atualizada
          store.removeNotification(existingNotification.id);
          store.addNotification(updatedNotification);
          
          return existingNotification.id;
        }
      }
      
      // Registrar este erro como recente
      recentErrorsRef.current.set(errorFingerprint, Date.now());
    }
    
    // Criar nova notificação
    const notificationId = uuidv4();
    const createdAt = new Date();
    let expiresAt = undefined;
    
    if (setExpirationOnNotifications) {
      expiresAt = new Date(createdAt.getTime() + notificationExpirationTime);
    }
    
    const notification: Notification = {
      id: notificationId,
      title: context?.title || 'Erro no sistema',
      message: context?.message || errorMessage,
      type,
      priority,
      isRead: false,
      isArchived: false,
      link: context?.link,
      createdAt,
      expiresAt,
      metadata: {
        errorFingerprint,
        errorCode,
        errorStack,
        source: context?.source || 'app',
        occurrenceCount: 1,
        ...context?.metadata
      }
    };
    
    // Adicionar notificação ao store
    store.addNotification(notification);
    
    return notificationId;
  }, [
    store, 
    shouldGroupSimilarErrors, 
    groupingTimeWindow, 
    setExpirationOnNotifications,
    notificationExpirationTime
  ]);
  
  /**
   * Intercepta erros do error handler
   */
  const interceptError = useCallback((shouldNotify = autoNotifyErrors) => {
    if (!error) return;
    
    if (shouldNotify) {
      notifyError(error, {
        source: error.context || 'error-handler',
        title: 'Erro na aplicação',
        priority: 
          error.fatal ? NotificationPriority.HIGH :
          error.isUserActionable ? NotificationPriority.MEDIUM : 
          NotificationPriority.LOW
      });
    }
    
    // Limpar o erro no error handler após processar
    clearError();
  }, [error, autoNotifyErrors, notifyError, clearError]);
  
  /**
   * Notifica sobre um evento do sistema
   */
  const notifyEvent = useCallback((event: SystemEvent): string => {
    // Criar nova notificação para o evento
    const notificationId = uuidv4();
    
    const notification: Notification = {
      id: notificationId,
      title: event.title,
      message: event.message,
      type: event.type,
      priority: event.priority || NotificationPriority.MEDIUM,
      isRead: false,
      isArchived: false,
      link: event.link,
      createdAt: new Date(),
      expiresAt: setExpirationOnNotifications 
        ? new Date(Date.now() + notificationExpirationTime) 
        : undefined,
      metadata: event.metadata
    };
    
    // Adicionar notificação ao store
    store.addNotification(notification);
    
    return notificationId;
  }, [store, setExpirationOnNotifications, notificationExpirationTime]);
  
  // Escutar erros do error handler se autoNotifyErrors estiver ativado
  useEffect(() => {
    if (autoNotifyErrors && typeof addListener === 'function') {
      const unsubscribe = addListener((newError) => {
        if (newError && newError.message) {
          notifyError(newError, {
            source: newError.context || 'error-handler',
            title: 'Erro na aplicação',
            priority: 
              newError.fatal ? NotificationPriority.HIGH :
              newError.isUserActionable ? NotificationPriority.MEDIUM : 
              NotificationPriority.LOW
          });
        }
      });
      
      return unsubscribe;
    }
    
    return undefined;
  }, [autoNotifyErrors, addListener, notifyError]);
  
  // Limpar erros expirados do cache periodicamente
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      recentErrorsRef.current.forEach((timestamp, key) => {
        if (now - timestamp > groupingTimeWindow) {
          recentErrorsRef.current.delete(key);
        }
      });
    }, groupingTimeWindow);
    
    return () => clearInterval(cleanupInterval);
  }, [groupingTimeWindow]);
  
  return {
    notifyError,
    interceptError,
    notifyEvent
  };
} 