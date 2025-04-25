"use client";

import { create } from 'zustand';

// Definições de enumerações (substituindo as importações do Prisma para evitar erros)
export enum NotificationType {
  SYSTEM = "SYSTEM",
  TRANSACTION = "TRANSACTION",
  BALANCE = "BALANCE",
  GOAL = "GOAL",
  BILL = "BILL"
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

// Definição do tipo de notificação
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  isArchived: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

// Definição da store
interface NotificationStore {
  // Estado
  notifications: Notification[];
  loading: boolean;
  hasMore: boolean;
  nextCursor?: string;
  unreadCount: number;

  // Ações
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  archiveNotification: (id: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setLoading: (loading: boolean) => void;
  setPagination: (hasMore: boolean, nextCursor?: string) => void;
  updateUnreadCount: (count?: number) => void;
}

const useNotificationStore = create<NotificationStore>((set) => ({
  // Estado inicial
  notifications: [],
  loading: false,
  hasMore: false,
  nextCursor: undefined,
  unreadCount: 0,

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
      const notifications = state.notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isArchived: true }
          : notification
      );

      // Se estava não lida, diminuir contador
      const wasUnread = state.notifications.find(n => n.id === id)?.isRead === false;
      
      return {
        notifications,
        unreadCount: wasUnread 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };
    });
  },

  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      const wasUnread = notification?.isRead === false;
      
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
}));

export default useNotificationStore; 