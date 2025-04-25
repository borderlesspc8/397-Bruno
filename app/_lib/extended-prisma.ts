/**
 * Cliente Prisma estendido para fornecer aliases para tabelas com nomes técnicos
 * Isso ajuda a manter a compatibilidade com o código existente enquanto usa os
 * nomes corretos das tabelas no banco de dados
 */

import { PrismaClient } from '@prisma/client';

// Instância base do Prisma Client
const basePrisma = new PrismaClient();

// Interface para o cliente Prisma estendido
interface ExtendedPrismaClient extends PrismaClient {
  CashFlowPrediction: any;
  Installment: any;
  SalesRecord: any;
}

// Criar o cliente estendido
const extendedPrisma = basePrisma as unknown as ExtendedPrismaClient;

// Adicionar os aliases durante o runtime
// O prisma já gerou os tipos para estas tabelas com os nomes corretos,
// estamos apenas adicionando aliases para facilitar o uso
extendedPrisma.CashFlowPrediction = (basePrisma as any).cash_flow_entries;
extendedPrisma.Installment = (basePrisma as any).installments;
extendedPrisma.SalesRecord = (basePrisma as any).sales_records;

// Exportar o cliente estendido
export const prisma = extendedPrisma; 