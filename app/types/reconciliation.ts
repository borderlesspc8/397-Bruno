import { z } from "zod";

/**
 * Tipos de conflitos que podem ser detectados
 */
export enum ConflictType {
  AMOUNT = "AMOUNT",
  DATE = "DATE",
  STATUS = "STATUS",
  CATEGORY = "CATEGORY",
  DESCRIPTION = "DESCRIPTION",
  DELETED = "DELETED",
}

/**
 * Tipo de resolução de conflito
 */
export enum ConflictResolution {
  KEEP_CONTA_RAPIDA = "KEEP_CONTA_RAPIDA",
  APPLY_GESTAO_CLICK = "APPLY_GESTAO_CLICK",
  MANUAL = "MANUAL",
}

/**
 * Schema para conflito detectado
 */
export const TransactionConflictSchema = z.object({
  id: z.string().uuid().optional(),
  transactionId: z.string(),
  externalId: z.string(),
  field: z.nativeEnum(ConflictType),
  contaRapidaValue: z.string(),
  gestaoClickValue: z.string(),
  detectedAt: z.date(),
  resolved: z.boolean().default(false),
  resolution: z.nativeEnum(ConflictResolution).optional(),
  resolvedAt: z.date().optional(),
  userId: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Tipo para conflito de transação
 */
export type TransactionConflict = z.infer<typeof TransactionConflictSchema>;

/**
 * Schema para resultado de reconciliação
 */
export const ReconciliationResultSchema = z.object({
  walletId: z.string(),
  walletName: z.string(),
  totalTransactions: z.number(),
  conflicts: z.array(TransactionConflictSchema),
  missingInGestaoClick: z.number(),
  missingInContaRapida: z.number(),
  syncedTransactions: z.number(),
});

/**
 * Tipo para resultado de reconciliação
 */
export type ReconciliationResult = z.infer<typeof ReconciliationResultSchema>; 