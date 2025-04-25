/**
 * Aliases para modelos do Prisma
 * 
 * Este arquivo define tipos que mapeiam os nomes dos modelos usados no código
 * para os nomes reais das tabelas no banco de dados.
 */

import { PrismaClient } from '@prisma/client';

/**
 * Interface para o cliente Prisma estendido com aliases para os modelos do banco de dados.
 * Isso permite usar nomes mais intuitivos no código enquanto mantém os nomes técnicos no banco de dados.
 */
export interface ExtendedPrismaClient extends PrismaClient {
  // Aliases para os modelos do banco com nomes técnicos
  CashFlowPrediction: any; 
  Installment: any;
  SalesRecord: any;
}

/**
 * Mapeamento de nomes técnicos para nomes amigáveis
 * Usado para referência e documentação
 */
export const DB_MODEL_ALIASES = {
  // Nome técnico no banco → Nome amigável no código
  cash_flow_entries: 'CashFlowPrediction',
  installments: 'Installment',
  sales_records: 'SalesRecord',
};

/**
 * Função para criar um cliente Prisma estendido com os aliases definidos
 * @param prismaClient Cliente Prisma base
 * @returns Cliente Prisma estendido com aliases
 * 
 * @example
 * // Como usar o cliente estendido
 * const db = createExtendedPrismaClient(new PrismaClient());
 * 
 * // Agora você pode acessar os modelos usando os nomes amigáveis
 * const prediction = await db.CashFlowPrediction.findFirst();
 * const installment = await db.Installment.findMany();
 */
export function createExtendedPrismaClient(prismaClient: PrismaClient): ExtendedPrismaClient {
  const extendedClient = prismaClient as unknown as ExtendedPrismaClient;
  
  // Definir aliases para modelos
  extendedClient.CashFlowPrediction = (prismaClient as any).cash_flow_entries;
  extendedClient.Installment = (prismaClient as any).installments;
  extendedClient.SalesRecord = (prismaClient as any).sales_records;
  
  return extendedClient;
}

/**
 * Exemplo de uso:
 * 
 * import { prisma } from '@/app/_lib/prisma';
 * import { createExtendedPrismaClient } from '@/app/_types/db-model-aliases';
 * 
 * const extendedPrisma = createExtendedPrismaClient(prisma);
 * 
 * // Agora você pode usar:
 * // extendedPrisma.CashFlowPrediction.findMany()...
 * // em vez de:
 * // prisma.cash_flow_entries.findMany()...
 */ 