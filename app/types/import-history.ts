import { z } from "zod";

/**
 * Enum para status de importação
 */
export enum ImportStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

/**
 * Schema para validação de histórico de importação
 */
export const ImportHistorySchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string(),
  source: z.string().default("GESTAO_CLICK"),
  status: z.nativeEnum(ImportStatus).default(ImportStatus.PENDING),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(), // em segundos
  walletId: z.string().optional(),
  walletName: z.string().optional(),
  totalTransactions: z.number().default(0),
  importedTransactions: z.number().default(0),
  skippedTransactions: z.number().default(0),
  errorTransactions: z.number().default(0),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Tipo para histórico de importação
 */
export type ImportHistory = z.infer<typeof ImportHistorySchema>; 