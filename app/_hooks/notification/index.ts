// Exportar hooks de notificação
export { useNotifications } from './use-notifications';
export { default as useNotificationStore } from './use-notification-store';
export { useNotificationApi } from './use-notification-api';
export { useSocketNotifications } from './use-socket-notifications';
export { useNotificationMiddleware } from './use-notification-middleware';

// Re-exportar interfaces das notificações da pasta de tipos
export type {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationState,
  NotificationActions,
} from '@/app/_types/notification'; 
