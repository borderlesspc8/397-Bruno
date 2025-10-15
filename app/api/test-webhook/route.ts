/**
 * Webhook para testar o processamento de eventos
 * Este é um webhook simples para testes
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";

// Configurar como dinâmico para sempre receber dados atualizados
export const dynamic = "force-dynamic";

/**
 * POST /api/test-webhook
 * Webhook simplificado para testes
 */
export async function POST(request: NextRequest) {
  console.log("[TEST-WEBHOOK] Recebido evento de teste");
  
  try {
    // Obter corpo da requisição
    const body = await request.json();
    
    // Verificar se é um evento válido
    if (!body.event || !body.data) {
      return NextResponse.json(
        { error: "Formato de evento inválido" },
        { status: 400 }
      );
    }
    
    // Extrair informações do evento
    const { event, data, userId } = body;
    
    // Se o userId não foi informado, tentar usar o userId do evento
    const targetUserId = userId || data.userId || "test123";
    
    console.log(`[TEST-WEBHOOK] Processando evento '${event}' para usuário ${targetUserId}`);
    console.log(`[TEST-WEBHOOK] Dados recebidos:`, JSON.stringify(data, null, 2));
    
    // Verificar se o usuário existe e criar um usuário de teste se necessário
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });
    
    if (!user) {
      console.log(`[TEST-WEBHOOK] Criando usuário de teste: ${targetUserId}`);
      try {
        await prisma.user.create({
          data: {
            id: targetUserId,
            name: "Usuário de Teste",
            email: `test-${Date.now()}@example.com`,
            emailVerified: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`[TEST-WEBHOOK] Usuário de teste criado: ${targetUserId}`);
      } catch (error) {
        console.error(`[TEST-WEBHOOK] Erro ao criar usuário:`, error);
      }
    }
    
    // Processar diferentes tipos de eventos
    let result;
    
    switch (event) {
      case "sale.created":
      case "sale.updated":
        result = await processSaleEvent(data, targetUserId);
        break;
        
      case "installment.created":
      case "installment.updated":
        result = await processInstallmentEvent(data, targetUserId);
        break;
        
      default:
        result = {
          eventProcessed: event,
          timestamp: new Date().toISOString(),
          userId: targetUserId,
          message: "Evento recebido mas não processado completamente"
        };
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: `Evento ${event} processado com sucesso`,
        result
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("[TEST-WEBHOOK] Erro ao processar evento:", error);
    
    return NextResponse.json(
      { 
        error: "Erro ao processar evento", 
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Processa eventos de venda
 */
async function processSaleEvent(data: any, userId: string) {
  try {
    // Obter IDs
    const saleId = data.id || data.saleId;
    
    if (!saleId) {
      throw new Error("ID da venda não informado");
    }
    
    // Verificar se a venda já existe usando raw SQL para evitar problemas com mapeamento
    const existingSales = await prisma.$queryRaw<any[]>`
      SELECT * FROM "sales_records" 
      WHERE "userId" = ${userId} AND "externalId" = ${saleId.toString()}
      LIMIT 1
    `;
    
    const existingSale = existingSales.length > 0 ? existingSales[0] : null;
    
    if (existingSale) {
      // Atualizar venda existente
      console.log(`[TEST-WEBHOOK] Atualizando venda existente: ${existingSale.id}`);
      
      await prisma.$executeRaw`
        UPDATE "sales_records" 
        SET "status" = ${data.status || existingSale.status}, 
            "updatedAt" = ${new Date()}
        WHERE "id" = ${existingSale.id}
      `;
      
      return {
        saleId: existingSale.id,
        externalId: saleId,
        operation: "updated"
      };
    } else {
      // Criar nova venda
      console.log(`[TEST-WEBHOOK] Criando nova venda: ${saleId}`);
      
      const saleDate = new Date(data.data || data.data_venda || data.created_at || new Date());
      const newSaleId = `test-sale-${saleId}-${userId.substring(0, 8)}`;
      
      // Usar raw SQL para inserir
      await prisma.$executeRaw`
        INSERT INTO "sales_records" (
          "id", "userId", "externalId", "code", "date", "totalAmount", "netAmount", 
          "status", "customerId", "customerName", "storeId", "storeName", 
          "paymentMethod", "source", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          ${newSaleId},
          ${userId},
          ${saleId.toString()},
          ${data.codigo || data.referencia || saleId.toString()},
          ${saleDate},
          ${parseFloat(data.valor_total || data.total || "0")},
          ${parseFloat(data.valor_liquido || data.valor_total || "0")},
          ${data.status || "PENDING"},
          ${data.cliente?.id ? data.cliente.id.toString() : null},
          ${data.cliente?.nome || data.nome_cliente || null},
          ${data.loja?.id ? data.loja.id.toString() : (data.loja_id ? data.loja_id.toString() : null)},
          ${data.loja?.nome || data.nome_loja || null},
          ${typeof data.forma_pagamento === 'object' ? data.forma_pagamento?.nome : data.forma_pagamento},
          ${"TEST_WEBHOOK"},
          ${JSON.stringify(data)}::jsonb,
          ${new Date()},
          ${new Date()}
        )
      `;
      
      // Processar parcelas se houver
      if (data.parcelas && Array.isArray(data.parcelas) && data.parcelas.length > 0) {
        console.log(`[TEST-WEBHOOK] Processando ${data.parcelas.length} parcelas da venda`);
        
        for (const parcela of data.parcelas) {
          await processInstallment(parcela, newSaleId, userId);
        }
      }
      
      return {
        saleId: newSaleId,
        externalId: saleId,
        operation: "created",
        installmentsProcessed: data.parcelas?.length || 0
      };
    }
  } catch (error) {
    console.error(`[TEST-WEBHOOK] Erro ao processar venda:`, error);
    throw error;
  }
}

/**
 * Processa eventos de parcela
 */
async function processInstallmentEvent(data: any, userId: string) {
  try {
    // Obter IDs
    const installmentId = data.id || data.parcelaId;
    const saleId = data.vendaId || data.saleId;
    
    if (!saleId) {
      throw new Error("ID da venda não informado no evento de parcela");
    }
    
    // Verificar se a venda existe
    const existingSales = await prisma.$queryRaw<any[]>`
      SELECT * FROM "sales_records" 
      WHERE "userId" = ${userId} AND "externalId" = ${saleId.toString()}
      LIMIT 1
    `;
    
    const salesRecord = existingSales.length > 0 ? existingSales[0] : null;
    
    // Se a venda não existe, criar uma venda mínima
    let salesRecordId;
    
    if (!salesRecord) {
      console.log(`[TEST-WEBHOOK] Criando venda mínima para parcela: ${saleId}`);
      
      salesRecordId = `test-sale-${saleId}-${userId.substring(0, 8)}`;
      
      await prisma.$executeRaw`
        INSERT INTO "sales_records" (
          "id", "userId", "externalId", "code", "date", "totalAmount", "netAmount", 
          "status", "source", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          ${salesRecordId},
          ${userId},
          ${saleId.toString()},
          ${"VENDA-" + saleId},
          ${new Date()},
          ${parseFloat(data.valor || "0") * 4},
          ${parseFloat(data.valor || "0") * 4},
          ${"PENDING"},
          ${"TEST_WEBHOOK"},
          ${{createdFromInstallment: true}}::jsonb,
          ${new Date()},
          ${new Date()}
        )
      `;
    } else {
      salesRecordId = salesRecord.id;
    }
    
    // Processar a parcela
    const installmentRecord = await processInstallment(data, salesRecordId, userId);
    
    return {
      installmentId: installmentRecord.id,
      saleId: salesRecordId,
      externalId: installmentId,
      operation: installmentRecord.operation
    };
  } catch (error) {
    console.error(`[TEST-WEBHOOK] Erro ao processar parcela:`, error);
    throw error;
  }
}

/**
 * Processa uma parcela específica
 */
async function processInstallment(parcelaData: any, salesRecordId: string, userId: string) {
  try {
    // Normalizar dados da parcela
    const parcelaId = parcelaData.id || parcelaData.parcelaId || `parc-${salesRecordId}-${parcelaData.numero || 1}`;
    const numero = parseInt(parcelaData.numero || parcelaData.parcela || "1");
    const valor = parseFloat(parcelaData.valor || "0");
    
    // Mapear status
    const status = mapInstallmentStatus(parcelaData.status || parcelaData.situacao || "PENDENTE");
    
    // Verificar se a parcela já existe
    const existingInstallments = await prisma.$queryRaw<any[]>`
      SELECT * FROM "installments" 
      WHERE "userId" = ${userId} AND "salesRecordId" = ${salesRecordId} AND "installmentNumber" = ${numero}
      LIMIT 1
    `;
    
    const existingInstallment = existingInstallments.length > 0 ? existingInstallments[0] : null;
    
    if (existingInstallment) {
      // Atualizar parcela
      console.log(`[TEST-WEBHOOK] Atualizando parcela: ${existingInstallment.id}`);
      
      await prisma.$executeRaw`
        UPDATE "installments" 
        SET "value" = ${valor},
            "dueDate" = ${new Date(parcelaData.data_vencimento || parcelaData.vencimento || new Date())},
            "paymentDate" = ${parcelaData.data_pagamento ? new Date(parcelaData.data_pagamento) : null},
            "status" = ${status},
            "updatedAt" = ${new Date()},
            "metadata" = ${JSON.stringify(parcelaData)}::jsonb
        WHERE "id" = ${existingInstallment.id}
      `;
      
      return {
        id: existingInstallment.id,
        externalId: parcelaId.toString(),
        operation: "updated"
      };
    } else {
      // Criar nova parcela
      console.log(`[TEST-WEBHOOK] Criando nova parcela: ${parcelaId}, número ${numero}`);
      
      const newInstallmentId = `test-inst-${salesRecordId}-${numero}`;
      
      await prisma.$executeRaw`
        INSERT INTO "installments" (
          "id", "userId", "salesRecordId", "externalId", "installmentNumber", 
          "value", "dueDate", "paymentDate", "status", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          ${newInstallmentId},
          ${userId},
          ${salesRecordId},
          ${parcelaId.toString()},
          ${numero},
          ${valor},
          ${new Date(parcelaData.data_vencimento || parcelaData.vencimento || new Date())},
          ${parcelaData.data_pagamento ? new Date(parcelaData.data_pagamento) : null},
          ${status},
          ${JSON.stringify(parcelaData)}::jsonb,
          ${new Date()},
          ${new Date()}
        )
      `;
      
      return {
        id: newInstallmentId,
        externalId: parcelaId.toString(),
        operation: "created"
      };
    }
  } catch (error) {
    console.error(`[TEST-WEBHOOK] Erro ao processar parcela:`, error);
    throw error;
  }
}

/**
 * Mapeia o status da parcela
 */
function mapInstallmentStatus(status: string): string {
  const normalizedStatus = status.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalizedStatus.includes("pag") || normalizedStatus.includes("liquidado")) {
    return "PAID";
  } else if (normalizedStatus.includes("atraso") || normalizedStatus.includes("vencido")) {
    return "OVERDUE";
  } else if (normalizedStatus.includes("cancel")) {
    return "CANCELED";
  } else {
    return "PENDING";
  }
} 
