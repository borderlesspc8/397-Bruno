import { z } from "zod";

/**
 * Schema para validação de mapeamento de categorias
 */
export const CategoryMappingSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string(),
  externalCategory: z.string().min(1, "Categoria externa é obrigatória"),
  internalCategory: z.string().min(1, "Categoria interna é obrigatória"),
  source: z.string().default("GESTAO_CLICK"),
  priority: z.number().int().min(0).max(100).default(50),
  active: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

/**
 * Tipo para mapeamento de categorias
 */
export type CategoryMapping = z.infer<typeof CategoryMappingSchema>; 
