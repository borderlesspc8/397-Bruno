import { db } from "@/app/_lib/db";
import { NotificationPriority, NotificationType } from "@prisma/client";
import { isUserConnected, sendNotificationToUser, updateUnreadCount } from "./socket-service";

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface GetNotificationsParams {
  userId: string;
  isRead?: boolean;
  isArchived?: boolean;
  type?: NotificationType;
  limit?: number;
  cursor?: string;
}

export class NotificationService {
  /**
   * Cria uma nova notificação para um usuário
   */
  static async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await db.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          priority: params.priority || NotificationPriority.MEDIUM,
          link: params.link,
          metadata: params.metadata ? params.metadata : undefined,
          expiresAt: params.expiresAt,
        },
      });

      // Enviar notificação em tempo real se o usuário estiver conectado
      if (isUserConnected(params.userId)) {
        sendNotificationToUser(params.userId, notification);
      }

      // Atualizar contador de notificações não lidas
      this.updateUserUnreadCount(params.userId);

      return { success: true, notification };
    } catch (error) {
      console.error("Erro ao criar notificação:", error);
      return { success: false, error };
    }
  }

  /**
   * Busca notificações de um usuário com paginação
   */
  static async getNotifications(params: GetNotificationsParams) {
    const { userId, isRead, isArchived, type, limit = 20, cursor } = params;

    try {
      const notifications = await db.notification.findMany({
        where: {
          userId,
          ...(isRead !== undefined && { isRead }),
          ...(isArchived !== undefined && { isArchived }),
          ...(type && { type }),
          ...(cursor && {
            createdAt: {
              lt: new Date(cursor),
            },
          }),
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      const nextCursor = notifications.length === limit
        ? notifications[notifications.length - 1].createdAt.toISOString()
        : null;

      return { 
        success: true, 
        notifications, 
        nextCursor,
        hasMore: nextCursor !== null 
      };
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      return { success: false, error };
    }
  }

  /**
   * Marca uma notificação como lida
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await db.notification.update({
        where: {
          id: notificationId,
          userId, // Garante que apenas o próprio usuário possa marcar como lido
        },
        data: {
          isRead: true,
        },
      });

      // Atualizar contador de notificações não lidas
      this.updateUserUnreadCount(userId);

      return { success: true, notification };
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      return { success: false, error };
    }
  }

  /**
   * Marca todas as notificações de um usuário como lidas
   */
  static async markAllAsRead(userId: string, type?: NotificationType) {
    try {
      const result = await db.notification.updateMany({
        where: {
          userId,
          isRead: false,
          ...(type && { type }),
        },
        data: {
          isRead: true,
        },
      });

      // Atualizar contador de notificações não lidas (será zero)
      if (isUserConnected(userId)) {
        updateUnreadCount(userId, 0);
      }

      return { success: true, count: result.count };
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
      return { success: false, error };
    }
  }

  /**
   * Arquiva uma notificação
   */
  static async archiveNotification(notificationId: string, userId: string) {
    try {
      const notification = await db.notification.update({
        where: {
          id: notificationId,
          userId, // Garante que apenas o próprio usuário possa arquivar
        },
        data: {
          isArchived: true,
        },
      });

      // Se a notificação não estava lida, atualizar o contador
      if (!notification.isRead) {
        this.updateUserUnreadCount(userId);
      }

      return { success: true, notification };
    } catch (error) {
      console.error("Erro ao arquivar notificação:", error);
      return { success: false, error };
    }
  }

  /**
   * Exclui uma notificação
   */
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      // Verificar se a notificação estava não lida antes de excluir
      const notification = await db.notification.findUnique({
        where: { id: notificationId, userId }
      });

      const wasUnread = notification && !notification.isRead;

      // Excluir a notificação
      await db.notification.delete({
        where: {
          id: notificationId,
          userId, // Garante que apenas o próprio usuário possa excluir
        },
      });

      // Se a notificação não estava lida, atualizar o contador
      if (wasUnread) {
        this.updateUserUnreadCount(userId);
      }

      return { success: true };
    } catch (error) {
      console.error("Erro ao excluir notificação:", error);
      return { success: false, error };
    }
  }

  /**
   * Remove notificações expiradas
   */
  static async removeExpiredNotifications() {
    const now = new Date();
    try {
      const result = await db.notification.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      return { success: true, count: result.count };
    } catch (error) {
      console.error("Erro ao remover notificações expiradas:", error);
      return { success: false, error };
    }
  }

  /**
   * Atualiza o contador de notificações não lidas para um usuário
   */
  private static async updateUserUnreadCount(userId: string) {
    try {
      // Contar notificações não lidas
      const count = await db.notification.count({
        where: {
          userId,
          isRead: false,
          isArchived: false,
        },
      });

      // Enviar atualização em tempo real se o usuário estiver conectado
      if (isUserConnected(userId)) {
        updateUnreadCount(userId, count);
      }

      return { success: true, count };
    } catch (error) {
      console.error("Erro ao atualizar contador de notificações:", error);
      return { success: false, error };
    }
  }
} 
