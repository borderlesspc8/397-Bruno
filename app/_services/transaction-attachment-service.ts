import { db } from "@/app/_lib/db";
import { Attachment } from "@prisma/client";

export interface CreateAttachmentParams {
  userId: string;
  transactionId: string;
  name: string;
  fileKey: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  metadata?: Record<string, any>;
}

export interface AttachmentOperationResult {
  success: boolean;
  attachment?: Attachment;
  error?: string;
}

export class TransactionAttachmentService {
  /**
   * Adiciona um anexo a uma transação
   */
  static async addAttachment(params: CreateAttachmentParams): Promise<AttachmentOperationResult> {
    try {
      // Verificar se a transação existe e pertence ao usuário
      const transaction = await db.transaction.findUnique({
        where: {
          id: params.transactionId,
          userId: params.userId
        }
      });

      if (!transaction) {
        return { success: false, error: "Transação não encontrada ou não pertence ao usuário" };
      }

      // Criar o anexo
      const attachment = await db.attachment.create({
        data: {
          userId: params.userId,
          transactionId: params.transactionId,
          name: params.name,
          fileKey: params.fileKey,
          fileUrl: params.fileUrl,
          fileType: params.fileType,
          fileSize: params.fileSize,
          metadata: params.metadata || {}
        }
      });

      return {
        success: true,
        attachment
      };
    } catch (error) {
      console.error("Erro ao adicionar anexo:", error);
      return {
        success: false,
        error: "Erro ao adicionar anexo à transação"
      };
    }
  }

  /**
   * Remove um anexo de uma transação
   */
  static async removeAttachment(
    id: string,
    userId: string
  ): Promise<AttachmentOperationResult> {
    try {
      // Verificar se o anexo existe e pertence ao usuário
      const attachment = await db.attachment.findUnique({
        where: {
          id,
          userId
        }
      });

      if (!attachment) {
        return { success: false, error: "Anexo não encontrado ou não pertence ao usuário" };
      }

      // Remover o anexo
      await db.attachment.delete({
        where: { id }
      });

      return {
        success: true
      };
    } catch (error) {
      console.error("Erro ao remover anexo:", error);
      return {
        success: false,
        error: "Erro ao remover anexo da transação"
      };
    }
  }

  /**
   * Lista os anexos de uma transação
   */
  static async getTransactionAttachments(
    transactionId: string,
    userId: string
  ): Promise<Attachment[]> {
    try {
      // Verificar se a transação existe e pertence ao usuário
      const transaction = await db.transaction.findUnique({
        where: {
          id: transactionId,
          userId
        }
      });

      if (!transaction) {
        throw new Error("Transação não encontrada ou não pertence ao usuário");
      }

      // Buscar os anexos
      return await db.attachment.findMany({
        where: {
          transactionId,
          userId
        },
        orderBy: {
          createdAt: "desc"
        }
      });
    } catch (error) {
      console.error("Erro ao buscar anexos da transação:", error);
      throw error;
    }
  }

  /**
   * Obtém um anexo pelo ID
   */
  static async getAttachmentById(
    id: string,
    userId: string
  ): Promise<Attachment | null> {
    try {
      return await db.attachment.findUnique({
        where: {
          id,
          userId
        }
      });
    } catch (error) {
      console.error("Erro ao buscar anexo:", error);
      throw error;
    }
  }
} 
