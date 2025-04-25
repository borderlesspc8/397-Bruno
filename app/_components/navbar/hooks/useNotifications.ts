"use client";

import { useState, useEffect, useCallback } from "react";
import { Notification } from "../types";

/**
 * Hook para gerenciar as notificações no sistema
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const STORAGE_KEY = 'finance_ai_notifications';
  
  // Carregar notificações do localStorage
  const loadNotifications = useCallback(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const storedNotifications = localStorage.getItem(STORAGE_KEY);
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        // Converter strings de data para objetos Date
        return parsed.map((n: any) => ({
          ...n,
          date: new Date(n.date)
        }));
      }
    } catch (e) {
      console.error('Erro ao carregar notificações:', e);
    }
    
    return [];
  }, []);
  
  // Salvar notificações no localStorage
  const saveNotifications = useCallback((notificationsToSave: Notification[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notificationsToSave));
    } catch (e) {
      console.error('Erro ao salvar notificações:', e);
    }
  }, []);
  
  // Carregar notificações ao inicializar
  useEffect(() => {
    const storedNotifications = loadNotifications();
    if (storedNotifications.length > 0) {
      setNotifications(storedNotifications);
    }
  }, [loadNotifications]);
  
  // Salvar notificações quando mudam
  useEffect(() => {
    if (notifications.length > 0) {
      saveNotifications(notifications);
    }
  }, [notifications, saveNotifications]);
  
  // Adicionar uma nova notificação
  const addNotification = (notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}`,
      date: new Date(),
      read: false
    };
    
    setNotifications(prev => {
      // Limitar a 20 notificações para não sobrecarregar o storage
      return [newNotification, ...prev].slice(0, 20);
    });
  };
  
  // Marcar uma notificação como lida
  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      );
      saveNotifications(updated);
      return updated;
    });
  };
  
  // Marcar todas as notificações como lidas
  const markAllAsRead = () => {
    setNotifications(prev => {
      const allRead = prev.map(notification => ({
        ...notification,
        read: true
      }));
      saveNotifications(allRead);
      return allRead;
    });
  };
  
  // Remover uma notificação
  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const filtered = prev.filter(notification => notification.id !== id);
      saveNotifications(filtered);
      return filtered;
    });
  };
  
  // Limpar todas as notificações
  const clearAllNotifications = () => {
    setNotifications([]);
    saveNotifications([]);
  };
  
  // Total de notificações não lidas
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  };
}; 