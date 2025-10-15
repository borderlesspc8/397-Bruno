"use client";

import { useState } from 'react';
import useNotificationStore, { Notification } from './use-notification-store';

interface UseNotificationsApi {
  loading: boolean;
  error: string | null;
  fetchNotifications: (params?: FetchNotificationsParams) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (type?: string) => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

interface FetchNotificationsParams {
  isRead?: boolean;
  isArchived?: boolean;
  type?: string;
  limit?: number;
  cursor?: string;
}

/**
 * Hook para gerenciar requisições para a API de notificações
 */
export function useNotificationsApi(): UseNotificationsApi {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const store = useNotificationStore();

  /**
   * Busca as notificações do usuário na API
   */
  const fetchNotifications = async (params: FetchNotificationsParams = {}) => {
    setLoading(true);
    store.setLoading(true);
    setError(null);
    
    try {
      // Construir URL com parâmetros
      const searchParams = new URLSearchParams();
      if (params.isRead !== undefined) searchParams.set('isRead', String(params.isRead));
      if (params.isArchived !== undefined) searchParams.set('isArchived', String(params.isArchived));
      if (params.type) searchParams.set('type', params.type);
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.cursor) searchParams.set('cursor', params.cursor);
      
      // Fazer requisição
      const url = `/api/notifications?${searchParams.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao buscar notificações');
      }
      
      const data = await response.json();
      
      // Se for a primeira página ou não houver cursor, limpar notificações antigas
      if (!params.cursor) {
        store.setNotifications(data.notifications);
      } else {
        // Concatenar novas notificações
        store.setNotifications([
          ...store.notifications,
          ...data.notifications
        ]);
      }
      
      // Atualizar estado de paginação
      store.setPagination(data.hasMore, data.nextCursor);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
      store.setLoading(false);
    }
  };

  /**
   * Marca uma notificação como lida
   */
  const markAsRead = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'markAsRead' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao marcar notificação como lida');
      }
      
      // Atualizar a store
      store.markAsRead(id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao marcar notificação como lida:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marca todas as notificações como lidas
   */
  const markAllAsRead = async (type?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('action', 'markAllRead');
      if (type) searchParams.set('type', type);
      
      const response = await fetch(`/api/notifications?${searchParams.toString()}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao marcar todas notificações como lidas');
      }
      
      // Atualizar a store
      store.markAllAsRead();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao marcar todas notificações como lidas:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Arquiva uma notificação
   */
  const archiveNotification = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'archive' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao arquivar notificação');
      }
      
      // Atualizar a store
      store.archiveNotification(id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao arquivar notificação:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exclui uma notificação
   */
  const deleteNotification = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao excluir notificação');
      }
      
      // Atualizar a store
      store.removeNotification(id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao excluir notificação:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
  };
} 
