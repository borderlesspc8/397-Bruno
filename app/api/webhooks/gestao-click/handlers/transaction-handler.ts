/**
 * Handler para processar eventos de transações do Gestão Click
 */

import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { createServerNotification } from "@/app/_lib/server-notifications";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { getGestaoClickSettings } from "../utils";

/**
 * Processa eventos de transação (criação/atualização)
 */
export async function processTransactionEvent(
  event: string,
  data: any,
  userId: string
) {
  try {
    // Obter configurações de integração
    const settings = await getGestaoClickSettings(userId);
    
    if (!settings) {
      throw new Error("Configurações do Gestão Click não encontradas");
    }
    
    // Criar serviço do Gestão Click
    const gestaoClickService = new GestaoClickService({
      apiKey: settings.apiKey,
      secretToken: settings.secretToken,
      apiUrl: settings.apiUrl,
      userId
    });
    
    // Buscar a carteira associada
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId,
        name: "GESTAO_CLICK_GLOBAL",
        type: "CHECKING"
      }
    });
    
    if (!wallet) {
      throw new Error("Carteira de integração não encontrada");
    }
    
    // Importar a transação usando o método apropriado
    const transactionId = data.transactionId || data.id;
    
    // Chamar método de importação existente com parâmetros específicos para uma única transação
    const result = await gestaoClickService.importTransactions(wallet.id, {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      apiFilters: {
        // Filtrar usando ids existentes ou campos específicos
        conta_bancaria_id: data.contaBancariaId || undefined,
        forma_pagamento_id: data.formaPagamentoId || undefined,
        valor_inicio: data.valor || undefined,
        valor_fim: data.valor || undefined
      }
    });
    
    console.log(`[WEBHOOK] Transação processada (${transactionId}): ${result.totalImported} importadas`);
    
    return result.totalImported > 0;
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar evento de transação:", error);
    throw error;
  }
} 
