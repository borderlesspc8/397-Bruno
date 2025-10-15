/**
 * Tipos relacionados às notificações do sistema
 */

/**
 * Tipos de notificação disponíveis no sistema
 * Deve estar sincronizado com o enum NotificationType no schema do Prisma
 */
export enum NotificationType {
  SYSTEM = "SYSTEM",
  TRANSACTION = "TRANSACTION",
  BUDGET = "BUDGET",
  GOAL = "GOAL",
  SECURITY = "SECURITY",
  SUBSCRIPTION = "SUBSCRIPTION",
  IMPORT = "IMPORT",
  IMPORT_SUCCESS = "IMPORT_SUCCESS",
  IMPORT_ERROR = "IMPORT_ERROR",
  OTHER = "OTHER"
}

/**
 * Prioridades das notificações
 * Deve estar sincronizado com o enum NotificationPriority no schema do Prisma
 */
export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH"
}

/**
 * Interface para o modelo de Notificação, correspondente ao schema do Prisma
 */
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  isArchived: boolean;
  link?: string | null;
  metadata?: Record<string, any> | null;
  expiresAt?: Date | null;
  createdAt: Date;
}

/**
 * Interface para a resposta da API de notificações
 */
export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

// Interface para parametrização da busca de notificações
export interface FetchNotificationsParams {
  isRead?: boolean;
  isArchived?: boolean;
  type?: NotificationType;
  limit?: number;
  cursor?: string;
}

// Interface para o estado de notificações no store
export interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  hasMore: boolean;
  nextCursor?: string;
  unreadCount: number;
  error: string | null;
}

// Interface para as ações do store de notificações
export interface NotificationActions {
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
  setError: (error: string | null) => void;
} 
