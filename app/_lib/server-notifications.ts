/**
 * Utilitários para gerenciar notificações do servidor
 * Este módulo fornece funções para criar e gerenciar notificações do sistema
 */
import { prisma } from "./prisma";
import { NotificationType, NotificationPriority } from "../_types/notification";

/**
 * Interface para criação de notificações do servidor
 */
export interface ServerNotificationProps {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  link?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

/**
 * Cria uma nova notificação do servidor para um usuário
 */
export async function createServerNotification(props: ServerNotificationProps) {
  try {
    const {
      userId,
      title,
      message,
      type,
      priority,
      link,
      metadata,
      expiresAt
    } = props;
    
    // Validação básica
    if (!userId || !title || !message) {
      throw new Error("Usuário, título e mensagem são obrigatórios para criar uma notificação");
    }
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!user) {
      throw new Error(`Usuário com ID ${userId} não encontrado`);
    }
    
    // Criar notificação no banco de dados
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type as any, // Type casting para resolver incompatibilidade de enums
        priority: priority as any, // Type casting para resolver incompatibilidade de enums
        link,
        metadata,
        expiresAt,
        isRead: false
      }
    });
    
    console.log(`[NOTIFICATION] Notificação criada: ${notification.id} para usuário ${userId}`);
    
    return notification;
  } catch (error: any) {
    console.error("[NOTIFICATION] Erro ao criar notificação:", error);
    throw error;
  }
}

/**
 * Marca uma notificação como lida
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    // Verificar se a notificação pertence ao usuário
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });
    
    if (!notification) {
      throw new Error(`Notificação não encontrada ou não pertence ao usuário ${userId}`);
    }
    
    // Atualizar notificação
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true
      }
    });
    
    return updatedNotification;
  } catch (error: any) {
    console.error("[NOTIFICATION] Erro ao marcar notificação como lida:", error);
    throw error;
  }
}

/**
 * Marca todas as notificações do usuário como lidas
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    // Atualizar todas as notificações não lidas do usuário
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
    
    return { count: result.count };
  } catch (error: any) {
    console.error("[NOTIFICATION] Erro ao marcar todas notificações como lidas:", error);
    throw error;
  }
}

/**
 * Remove notificações expiradas de todos os usuários
 */
export async function cleanupExpiredNotifications() {
  try {
    const now = new Date();
    
    // Remover notificações expiradas
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });
    
    console.log(`[NOTIFICATION] ${result.count} notificações expiradas foram removidas`);
    
    return { count: result.count };
  } catch (error: any) {
    console.error("[NOTIFICATION] Erro ao limpar notificações expiradas:", error);
    throw error;
  }
} 
