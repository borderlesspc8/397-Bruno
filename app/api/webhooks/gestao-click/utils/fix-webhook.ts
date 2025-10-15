/**
 * Utilitário para correção de problemas do webhook do Gestão Click
 * Este script cria a estrutura necessária para o funcionamento adequado do webhook
 */

import { prisma } from "@/app/_lib/prisma";
import { WalletType } from "@prisma/client";

/**
 * Cria a carteira de integração necessária para o webhook
 * @param userId ID do usuário para o qual criar a carteira
 * @returns A carteira criada ou a existente
 */
export async function criarCarteiraIntegracao(userId: string) {
  try {
    // Verificar se a carteira já existe
    const carteiraExistente = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "CHECKING"
      }
    });

    if (carteiraExistente) {
      console.log(`[GESTAO_CLICK] Carteira de integração já existe para o usuário ${userId}`);
      return carteiraExistente;
    }

    // Obter as configurações do Gestão Click se existirem
    const configWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "SETTINGS" as WalletType
      },
      select: {
        metadata: true
      }
    });

    // Se não existir configuração, criar uma padrão para desenvolvimento
    let gestaoClickConfig = {
      apiKey: process.env.GESTAO_CLICK_ACCESS_TOKEN || "api_key_test",
      secretToken: process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
      apiUrl: process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com",
      testMode: process.env.NODE_ENV === "development"
    };

    // Se existir configuração, usar
    if (configWallet && configWallet.metadata) {
      // @ts-ignore - metadata é tratado como any pelo Prisma
      const existingConfig = configWallet.metadata.gestaoClick;
      if (existingConfig) {
        gestaoClickConfig = existingConfig;
      }
    }

    // Criar a carteira de integração
    console.log(`[GESTAO_CLICK] Criando carteira de integração para o usuário ${userId}`);
    const novaCateira = await prisma.wallet.create({
      data: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "CHECKING",
        balance: 0,
        metadata: {
          gestaoClick: gestaoClickConfig,
          createdByWebhook: true,
          createdAt: new Date().toISOString(),
          info: "Carteira para integração com Gestão Click"
        }
      }
    });

    console.log(`[GESTAO_CLICK] Carteira de integração criada com sucesso: ${novaCateira.id}`);
    return novaCateira;
  } catch (error) {
    console.error("[GESTAO_CLICK] Erro ao criar carteira de integração:", error);
    throw error;
  }
}

/**
 * Verifica se uma venda está corretamente armazenada e corrige se necessário
 * @param userId ID do usuário proprietário da venda
 * @param saleId ID externo da venda no Gestão Click
 * @returns O registro de venda corrigido ou existente
 */
export async function corrigirVendaEParcelas(userId: string, saleId: string) {
  try {
    console.log(`[GESTAO_CLICK] Verificando venda ${saleId} para o usuário ${userId}`);
    
    // Verificar se a venda existe
    const existingSales = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "sales_records" WHERE "userId" = $1 AND "externalId" = $2 LIMIT 1`,
      userId,
      saleId.toString()
    );
    
    const saleRecord = existingSales.length > 0 ? existingSales[0] : null;
    
    if (!saleRecord) {
      console.log(`[GESTAO_CLICK] Venda ${saleId} não encontrada, criando registro mínimo`);
      
      // Criar venda mínima
      await prisma.$executeRawUnsafe(
        `INSERT INTO "sales_records" (
          "id", "userId", "externalId", "code", "date", "totalAmount", "netAmount", 
          "status", "source", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12
        )`,
        `sale-${saleId}-${userId}`,
        userId,
        saleId.toString(),
        `VENDA-${saleId}`,
        new Date(),
        0,
        0,
        "PENDING",
        "GESTAO_CLICK",
        JSON.stringify({ 
          _createdByFixScript: true,
          _createdAt: new Date().toISOString(),
          _needsSync: true
        }),
        new Date(),
        new Date()
      );
      
      const newSales = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "sales_records" WHERE "id" = $1 LIMIT 1`,
        `sale-${saleId}-${userId}`
      );
      
      return newSales[0];
    }
    
    // Se existe, verificar se tem parcelas
    const installments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT COUNT(*) as total FROM "installments" WHERE "salesRecordId" = $1`,
      saleRecord.id
    );
    
    const totalParcelas = parseInt(installments[0]?.total || "0");
    
    if (totalParcelas === 0) {
      console.log(`[GESTAO_CLICK] Venda ${saleId} não possui parcelas. Marcando para sincronização.`);
      
      // Marcar para sincronização futura
      await prisma.$executeRawUnsafe(
        `UPDATE "sales_records" SET 
         "metadata" = jsonb_set(
           COALESCE("metadata", '{}'::jsonb), 
           '{_needsSync}', 
           'true'::jsonb,
           true
         ),
         "updatedAt" = $1
         WHERE "id" = $2`,
        new Date(),
        saleRecord.id
      );
    } else {
      console.log(`[GESTAO_CLICK] Venda ${saleId} possui ${totalParcelas} parcelas`);
    }
    
    return saleRecord;
  } catch (error) {
    console.error("[GESTAO_CLICK] Erro ao corrigir venda e parcelas:", error);
    throw error;
  }
}

/**
 * Verifica e corrige a configuração do webhook
 * @param userId ID do usuário para verificar
 */
export async function verificarECorrigirConfiguracao(userId: string) {
  try {
    // 1. Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.log(`[GESTAO_CLICK] Criando usuário de teste ${userId}`);
      await prisma.user.create({
        data: {
          id: userId,
          name: "Usuário de Teste",
          email: `${userId}@example.com`,
          emailVerified: new Date()
        }
      });
    }

    // 2. Verificar se existe a carteira de configurações
    const configExists = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "SETTINGS" as WalletType
      }
    });

    if (!configExists) {
      console.log(`[GESTAO_CLICK] Criando configurações para o usuário ${userId}`);
      await prisma.wallet.create({
        data: {
          userId,
          name: "GESTAO_CLICK_GLOBAL",
          type: "SETTINGS" as WalletType,
          balance: 0,
          metadata: {
            gestaoClick: {
              apiKey: process.env.GESTAO_CLICK_ACCESS_TOKEN || "api_key_test",
              secretToken: process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
              apiUrl: process.env.GESTAO_CLICK_API_URL || "https://api.beteltecnologia.com",
              testMode: process.env.NODE_ENV === "development"
            },
            info: "Configurações do Gestão Click"
          }
        }
      });
    }

    // 3. Criar a carteira de integração se necessário
    await criarCarteiraIntegracao(userId);

    return {
      success: true,
      message: "Configuração verificada e corrigida com sucesso"
    };
  } catch (error) {
    console.error("[GESTAO_CLICK] Erro ao verificar/corrigir configuração:", error);
    throw error;
  }
} 
