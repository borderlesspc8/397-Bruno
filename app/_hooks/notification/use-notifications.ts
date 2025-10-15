"use client";

import { useMemo, useState, useEffect } from 'react';
import { useNotificationApi } from './use-notification-api';
import { useSocketNotifications } from './use-socket-notifications';
import useNotificationStore from './use-notification-store';
import { Notification, NotificationType } from '@/app/_types/notification';
import { useToast } from '@/app/_components/ui/use-toast';

interface UseNotificationsReturn {
  // Estado
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Ações síncronas
  clearError: () => void;
  
  // Ações assíncronas
  fetchNotifications: (options?: { 
    isRead?: boolean, 
    type?: NotificationType, 
    limit?: number 
  }) => Promise<void>;
  fetchMoreNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (type?: NotificationType) => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  reconnectSocket: () => boolean;
}

/**
 * Hook principal para gerenciar notificações na aplicação.
 * Combina o store, a API e o socket.
 */
export function useNotifications(): UseNotificationsReturn {
  const store = useNotificationStore();
  const api = useNotificationApi();
  const socket = useSocketNotifications();
  const { toast } = useToast();
  
  const [lastFetchParams, setLastFetchParams] = useState({
    isRead: undefined,
    type: undefined,
    limit: 10
  });
  
  // Carregar notificações ao montar o componente
  useEffect(() => {
    api.fetchNotifications({ limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Mostrar toast quando chegar nova notificação não lida
  useEffect(() => {
    const unsubscribe = useNotificationStore.subscribe(
      (state, prevState) => {
        // Verificar se foi adicionada uma nova notificação não lida
        if (state.notifications.length > prevState.notifications.length) {
          const newNotification = state.notifications.find(n => 
            !prevState.notifications.some(pn => pn.id === n.id) && !n.isRead
          );
          
          if (newNotification) {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.priority === 'HIGH' ? 'destructive' : 'default',
            });
          }
        }
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [toast]);
  
  // Mostrar toast de erro de conexão
  useEffect(() => {
    if (socket.connectionError) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor de notificações. Algumas atualizações podem não aparecer em tempo real.",
        variant: "destructive",
      });
    }
  }, [socket.connectionError, toast]);
  
  // Buscar notificações com parâmetros específicos
  const fetchNotifications = async (options = {}) => {
    const params = {
      ...lastFetchParams,
      ...options,
    };
    
    setLastFetchParams(params);
    await api.fetchNotifications(params);
  };
  
  // Buscar mais notificações (paginação)
  const fetchMoreNotifications = async () => {
    if (!store.hasMore || store.loading) return;
    
    await api.fetchNotifications({
      ...lastFetchParams,
      cursor: store.nextCursor,
    });
  };
  
  // Limpar o erro
  const clearError = () => {
    store.setError(null);
  };
  
  // Retorno unificado
  return {
    // Estado
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    loading: store.loading || api.loading,
    hasMore: store.hasMore,
    isConnected: socket.isConnected,
    error: store.error || api.error || socket.connectionError,
    
    // Ações síncronas
    clearError,
    
    // Ações assíncronas
    fetchNotifications,
    fetchMoreNotifications,
    markAsRead: api.markAsRead,
    markAllAsRead: api.markAllAsRead,
    archiveNotification: api.archiveNotification,
    deleteNotification: api.deleteNotification,
    reconnectSocket: socket.reconnect,
  };
} 
