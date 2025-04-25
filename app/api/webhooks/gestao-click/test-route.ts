/**
 * Webhook de teste simples para processar eventos do Gestão Click
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";

// Definir chave de API para autenticação (não usada em testes)
const WEBHOOK_SECRET = process.env.GESTAO_CLICK_WEBHOOK_SECRET;

// Configurar como dinâmico para sempre receber dados atualizados
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/gestao-click/test
 * Recebe atualizações em tempo real do Gestão Click - versão simplificada para testes
 */
export async function POST(request: NextRequest) {
  console.log("[TEST-WEBHOOK] Recebido evento de teste do Gestão Click");
  
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
    const targetUserId = userId || data.userId;
    
    if (!targetUserId) {
      console.error("[TEST-WEBHOOK] userId não informado no evento");
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }
    
    console.log(`[TEST-WEBHOOK] Processando evento '${event}' para usuário ${targetUserId}`);
    
    // Verificar se o usuário existe e criar um usuário de teste se necessário
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });
    
    if (!user) {
      console.log(`[TEST-WEBHOOK] Criando usuário de teste: ${targetUserId}`);
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
        return NextResponse.json(
          { message: `Evento ${event} não implementado no webhook de teste` },
          { status: 200 }
        );
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
  // Log das informações recebidas para debugging
  console.log("[TEST-WEBHOOK] Dados da venda recebidos:", JSON.stringify(data, null, 2));
  
  try {
    // Extrair IDs e informações básicas
    const saleId = data.id || data.saleId;
    
    if (!saleId) {
      throw new Error("ID da venda não informado no evento");
    }
    
    // Verificar se a venda já existe
    const existingSales = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "sales_records" WHERE "userId" = $1 AND "externalId" = $2 LIMIT 1`,
      userId,
      saleId.toString()
    );
    
    let salesRecord = existingSales.length > 0 ? existingSales[0] : null;
    
    if (!salesRecord) {
      // Se a venda ainda não existe, criá-la
      console.log(`[TEST-WEBHOOK] Criando registro de venda ${saleId}`);
      
      // Formatar dados da venda
      const saleDate = new Date(data.data || data.data_venda || data.created_at || new Date());
      
      // Criar registro de venda
      await prisma.$executeRawUnsafe(
        `INSERT INTO "sales_records" (
          "id", "userId", "externalId", "code", "date", "totalAmount", "netAmount", 
          "status", "customerId", "customerName", "storeId", "storeName", 
          "paymentMethod", "source", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17
        )`,
        `sale-test-${saleId}-${userId}`,
        userId,
        saleId.toString(),
        data.codigo || data.referencia || saleId.toString(),
        saleDate,
        parseFloat(data.valor_total || data.total || "0"),
        parseFloat(data.valor_liquido || data.valor_total || "0"),
        data.status || "PENDING",
        data.cliente?.id?.toString() || null,
        data.cliente?.nome || data.nome_cliente || null,
        data.loja?.id?.toString() || data.loja_id?.toString() || null,
        data.loja?.nome || data.nome_loja || null,
        data.forma_pagamento?.nome || data.forma_pagamento || null,
        "GESTAO_CLICK_TEST",
        JSON.stringify(data),
        new Date(),
        new Date()
      );
      
      // Recuperar o registro recém-criado
      const newSales = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "sales_records" WHERE "id" = $1 LIMIT 1`,
        `sale-test-${saleId}-${userId}`
      );
      
      salesRecord = newSales[0];
      
      // Se a venda possui parcelas, processá-las
      if (data.parcelas && Array.isArray(data.parcelas) && data.parcelas.length > 0) {
        for (const parcela of data.parcelas) {
          await processInstallment(parcela, salesRecord, userId);
        }
      }
      
      return {
        saleId: salesRecord.id,
        externalId: saleId,
        status: "created"
      };
    } else {
      // Se a venda já existe, apenas atualizar
      console.log(`[TEST-WEBHOOK] Venda ${saleId} já existe, atualizando status`);
      
      // Atualizar o registro
      await prisma.$executeRawUnsafe(
        `UPDATE "sales_records" SET 
          "status" = $1, 
          "updatedAt" = $2
        WHERE "id" = $3`,
        data.status || salesRecord.status,
        new Date(),
        salesRecord.id
      );
      
      return {
        saleId: salesRecord.id,
        externalId: saleId,
        status: "updated"
      };
    }
  } catch (error: any) {
    console.error(`[TEST-WEBHOOK] Erro ao processar venda:`, error);
    throw error;
  }
}

/**
 * Processa eventos de parcela
 */
async function processInstallmentEvent(data: any, userId: string) {
  console.log("[TEST-WEBHOOK] Dados da parcela recebidos:", JSON.stringify(data, null, 2));
  
  try {
    // Processar o evento de parcela diretamente
    const installmentId = data.id || data.parcelaId;
    const saleId = data.vendaId || data.saleId;
    
    if (!saleId) {
      throw new Error("ID da venda não informado no evento de parcela");
    }
    
    // Verificar se a venda já existe
    const existingSales = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "sales_records" WHERE "userId" = $1 AND "externalId" = $2 LIMIT 1`,
      userId,
      saleId.toString()
    );
    
    let salesRecord = existingSales.length > 0 ? existingSales[0] : null;
    
    // Se a venda não existe, criar uma venda mínima
    if (!salesRecord) {
      // Criar o registro da venda com dados mínimos
      console.log(`[TEST-WEBHOOK] Criando registro mínimo de venda ${saleId} para parcela`);
      
      // Usar $executeRawUnsafe para criar o registro
      await prisma.$executeRawUnsafe(
        `INSERT INTO "sales_records" (
          "id", "userId", "externalId", "code", "date", "totalAmount", "netAmount", 
          "status", "source", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12
        )`,
        `sale-test-${saleId}-${userId}`,
        userId,
        saleId.toString(),
        `VENDA-${saleId}`,
        new Date(),
        parseFloat(data.valor || "0") * 4, // Estimativa do valor total
        parseFloat(data.valor || "0") * 4, // Estimativa do valor líquido
        "PENDING",
        "GESTAO_CLICK_TEST",
        JSON.stringify({ _createdFromInstallment: true }),
        new Date(),
        new Date()
      );
      
      // Recuperar o registro recém-criado
      const newSales = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "sales_records" WHERE "id" = $1 LIMIT 1`,
        `sale-test-${saleId}-${userId}`
      );
      
      salesRecord = newSales[0];
    }
    
    // Processar a parcela
    await processInstallment(data, salesRecord, userId);
    
    return {
      saleId: salesRecord.id,
      installmentId: installmentId,
      status: "processed"
    };
  } catch (error: any) {
    console.error(`[TEST-WEBHOOK] Erro ao processar parcela:`, error);
    throw error;
  }
}

/**
 * Processa uma parcela específica
 */
async function processInstallment(parcelaData: any, salesRecord: any, userId: string) {
  try {
    // Normalizar dados da parcela
    const parcela = {
      id: parcelaData.id || parcelaData.parcelaId || `parc-${salesRecord.id}-${parcelaData.numero || 1}`,
      numero: parseInt(parcelaData.numero || parcelaData.parcela || "1"),
      valor: parseFloat(parcelaData.valor || "0"),
      data_vencimento: parcelaData.data_vencimento || parcelaData.vencimento || new Date(),
      data_pagamento: parcelaData.data_pagamento || null,
      status: parcelaData.status || parcelaData.situacao || "PENDENTE"
    };
    
    // Verificar se a parcela já existe
    const existingInstallments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "installments" 
       WHERE "userId" = $1 AND "salesRecordId" = $2 AND "installmentNumber" = $3 
       LIMIT 1`,
      userId,
      salesRecord.id,
      parcela.numero
    );
    
    // Função para mapear status
    const mapStatus = (status: string) => {
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
    };
    
    if (existingInstallments.length > 0) {
      // Atualizar parcela existente
      console.log(`[TEST-WEBHOOK] Atualizando parcela ${parcela.numero} da venda ${salesRecord.externalId}`);
      
      await prisma.$executeRawUnsafe(
        `UPDATE "installments" SET 
          "value" = $1,
          "dueDate" = $2,
          "paymentDate" = $3,
          "status" = $4,
          "updatedAt" = $5,
          "metadata" = $6::jsonb
        WHERE "id" = $7`,
        parcela.valor,
        new Date(parcela.data_vencimento),
        parcela.data_pagamento ? new Date(parcela.data_pagamento) : null,
        mapStatus(parcela.status),
        new Date(),
        JSON.stringify(parcelaData),
        existingInstallments[0].id
      );
      
      return existingInstallments[0].id;
    } else {
      // Criar nova parcela
      console.log(`[TEST-WEBHOOK] Criando parcela ${parcela.numero} da venda ${salesRecord.externalId}`);
      
      await prisma.$executeRawUnsafe(
        `INSERT INTO "installments" (
          "id", "userId", "salesRecordId", "externalId", "installmentNumber", 
          "value", "dueDate", "paymentDate", "status", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12
        )`,
        `inst-test-${salesRecord.id}-${parcela.numero}`,
        userId,
        salesRecord.id,
        parcela.id.toString(),
        parcela.numero,
        parcela.valor,
        new Date(parcela.data_vencimento),
        parcela.data_pagamento ? new Date(parcela.data_pagamento) : null,
        mapStatus(parcela.status),
        JSON.stringify(parcelaData),
        new Date(),
        new Date()
      );
      
      return `inst-test-${salesRecord.id}-${parcela.numero}`;
    }
  } catch (error: any) {
    console.error(`[TEST-WEBHOOK] Erro ao processar parcela:`, error);
    throw error;
  }
} 