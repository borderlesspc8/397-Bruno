/* eslint-disable no-unused-vars */
import { PrismaClient } from "@prisma/client";

// Usar uma única instância do Prisma Client em toda a aplicação
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

declare global {
  var prisma: PrismaClient | undefined;
}

// Exportar o cliente Prisma (criar uma nova instância ou reutilizar a existente)
export const prisma = global.prisma || new PrismaClient();

// Salvar no escopo global se estiver em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export const db = prisma;
