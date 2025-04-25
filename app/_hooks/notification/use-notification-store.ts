"use client";

import { create } from 'zustand';
import { 
  Notification, 
  NotificationState, 
  NotificationActions 
} from '@/app/_types/notification';

// Tipo do store completo
type NotificationStore = NotificationState & NotificationActions;

/**
 * Store Zustand para gerenciar o estado de notificações na aplicação.
 */
const useNotificationStore = create<NotificationStore>((set) => ({
  // Estado inicial
  notifications: [],
  loading: false,
  hasMore: false,
  nextCursor: undefined,
  unreadCount: 0,
  error: null,

  // Ações
  setNotifications: (notifications) => {
    set((state) => ({
      notifications,
      unreadCount: notifications.filter(n => !n.isRead).length,
    }));
  },
  
  addNotification: (notification) => {
    set((state) => {
      const exists = state.notifications.some(n => n.id === notification.id);
      if (exists) return state;
      
      const newNotifications = [notification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: !notification.isRead 
          ? state.unreadCount + 1 
          : state.unreadCount,
      };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updatedNotifications = state.notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      );
      
      return {
        notifications: updatedNotifications,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updatedNotifications = state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      }));

      return {
        notifications: updatedNotifications,
        unreadCount: 0,
      };
    });
  },

  archiveNotification: (id) => {
    set((state) => {
      const notificationToArchive = state.notifications.find(n => n.id === id);
      if (!notificationToArchive) return state;

      const wasUnread = !notificationToArchive.isRead;
      
      const updatedNotifications = state.notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isArchived: true }
          : notification
      );
      
      return {
        notifications: updatedNotifications,
        unreadCount: wasUnread 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };
    });
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      if (!notification) return state;
      
      const wasUnread = !notification.isRead;
      
      return {
        notifications: state.notifications.filter(
          (notification) => notification.id !== id
        ),
        unreadCount: wasUnread 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };
    });
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setPagination: (hasMore, nextCursor) => {
    set({ hasMore, nextCursor });
  },

  updateUnreadCount: (count) => {
    set((state) => ({
      unreadCount: count !== undefined 
        ? count 
        : state.notifications.filter(n => !n.isRead).length,
    }));
  },
  
  setError: (error) => {
    set({ error });
  },
}));

export default useNotificationStore; 