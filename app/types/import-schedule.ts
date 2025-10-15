import { z } from "zod";

/**
 * Schema para validação de agendamento de importação
 */
export const ImportScheduleSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string(),
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  wallets: z.array(z.string()).or(z.literal("all")),
  enabled: z.boolean().default(true),
  lastRun: z.date().optional(),
  nextRun: z.date(),
  lastError: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Tipo para agendamento de importação
 */
export type ImportSchedule = z.infer<typeof ImportScheduleSchema>; 
