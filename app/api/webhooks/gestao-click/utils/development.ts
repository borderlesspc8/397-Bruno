/**
 * Utilidades para processamento de eventos em modo de desenvolvimento
 */

import { prisma } from "@/app/_lib/prisma";
import { mapInstallmentStatus } from ".";
import { GestaoClickInstallment } from "../types";

/**
 * Processa uma venda em modo de desenvolvimento/teste
 */
export async function processTestSaleEvent(
  event: string,
  data: any,
  targetUserId: string
) {
  try {
    // Verificar se o usuário existe e criar um usuário de teste se necessário
    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });
    
    if (!user) {
      console.log(`Criando usuário de teste: ${targetUserId}`);
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
      console.log(`Usuário de teste criado: ${targetUserId}`);
    }
    
    // Processar a venda diretamente, sem consultar a API
    const saleId = data.id || data.saleId;
    
    // Criar ou atualizar o registro de venda
    const existingSales = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "sales_records" WHERE "userId" = $1 AND "externalId" = $2 LIMIT 1`,
      targetUserId,
      saleId.toString()
    );
    
    let salesRecord = existingSales.length > 0 ? existingSales[0] : null;
    
    if (!salesRecord) {
      // Se a venda ainda não existe, criá-la
      console.log(`[WEBHOOK] Criando registro de venda de teste ${saleId}`);
      
      // Formatar dados da venda
      const saleDate = new Date(data.data || data.data_venda || data.created_at || new Date());
      
      // Usar $executeRawUnsafe para criar o registro
      await prisma.$executeRawUnsafe(
        `INSERT INTO "sales_records" (
          "id", "userId", "externalId", "code", "date", "totalAmount", "netAmount", 
          "status", "customerId", "customerName", "storeId", "storeName", 
          "paymentMethod", "source", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17
        )`,
        `sale-${saleId}-${targetUserId}`,
        targetUserId,
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
        "GESTAO_CLICK",
        JSON.stringify(data),
        new Date(),
        new Date()
      );
      
      // Recuperar o registro recém-criado
      const newSales = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "sales_records" WHERE "id" = $1 LIMIT 1`,
        `sale-${saleId}-${targetUserId}`
      );
      
      salesRecord = newSales[0];
      
      // Se a venda possui parcelas, processá-las
      if (data.parcelas && Array.isArray(data.parcelas) && data.parcelas.length > 0) {
        console.log(`[WEBHOOK] Processando ${data.parcelas.length} parcelas de teste da venda ${saleId}`);
        
        // Para cada parcela, criar registro
        for (const parcela of data.parcelas) {
          // Normalizar os dados da parcela
          const parcelaNumber = parseInt(
            typeof parcela.numero === 'number' 
              ? parcela.numero.toString() 
              : (typeof parcela.parcela === 'number' 
                ? parcela.parcela.toString() 
                : (parcela.numero || parcela.parcela || "1").toString())
          );
          
          const parcelaAmount = parseFloat(
            typeof parcela.valor === 'number' 
              ? parcela.valor.toString() 
              : (parcela.valor || "0").toString()
          );
          
          const parcelaData = {
            id: parcela.id?.toString() || `${saleId}-${parcelaNumber}`,
            number: parcelaNumber,
            amount: parcelaAmount,
            dueDate: new Date(parcela.data_vencimento || parcela.vencimento || new Date()),
            paymentDate: parcela.data_pagamento ? new Date(parcela.data_pagamento) : null,
            status: mapInstallmentStatus(parcela.status || parcela.situacao || ""),
          };
          
          // Criar nova parcela
          const installmentId = `inst-${salesRecord.id}-${parcelaData.number}`;
          await prisma.$executeRawUnsafe(
            `INSERT INTO "installments" (
              "id", "salesRecordId", "userId", "externalId", "number", 
              "amount", "dueDate", "paymentDate", "status", "metadata", 
              "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12
            )`,
            installmentId,
            salesRecord.id,
            targetUserId,
            parcelaData.id,
            parcelaData.number,
            parcelaData.amount,
            parcelaData.dueDate,
            parcelaData.paymentDate,
            parcelaData.status,
            JSON.stringify(parcela),
            new Date(),
            new Date()
          );
          console.log(`[WEBHOOK] Parcela ${parcelaData.number} criada com ID ${installmentId}`);
        }
      }
    }
    
    return {
      success: true,
      message: `Evento ${event} processado com dados reais`,
      timestamp: new Date().toISOString(),
      testProcessed: true,
      salesId: salesRecord.id,
      installmentsProcessed: data.parcelas?.length || 0
    };
  } catch (error: any) {
    console.error(`[WEBHOOK] Erro no processamento real de teste:`, error);
    throw error;
  }
}

/**
 * Processa uma parcela em modo de desenvolvimento/teste
 */
export async function processTestInstallmentEvent(
  event: string,
  data: any,
  targetUserId: string
) {
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
      targetUserId,
      saleId.toString()
    );
    
    let salesRecord = existingSales.length > 0 ? existingSales[0] : null;
    
    // Se a venda não existe, criar uma venda mínima
    if (!salesRecord) {
      // Criar o registro da venda com dados mínimos
      console.log(`[WEBHOOK] Criando registro mínimo de venda ${saleId} para parcela`);
      
      // Usar $executeRawUnsafe para criar o registro
      await prisma.$executeRawUnsafe(
        `INSERT INTO "sales_records" (
          "id", "userId", "externalId", "code", "date", "totalAmount", "netAmount", 
          "status", "source", "metadata", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12
        )`,
        `sale-${saleId}-${targetUserId}`,
        targetUserId,
        saleId.toString(),
        `VENDA-${saleId}`,
        new Date(),
        parseFloat(data.valor || "0") * 4, // Estimativa do valor total
        parseFloat(data.valor || "0") * 4, // Estimativa do valor líquido
        "PENDING",
        "GESTAO_CLICK",
        JSON.stringify({ _createdFromInstallment: true }),
        new Date(),
        new Date()
      );
      
      // Recuperar o registro recém-criado
      const newSales = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "sales_records" WHERE "id" = $1 LIMIT 1`,
        `sale-${saleId}-${targetUserId}`
      );
      
      salesRecord = newSales[0];
    }
    
    // Normalizar os dados da parcela
    const parcelaNumber = parseInt(
      typeof data.numero === 'number' 
        ? data.numero.toString() 
        : (typeof data.parcela === 'number' 
          ? data.parcela.toString() 
          : (data.numero || data.parcela || "1").toString())
    );
    
    const parcelaAmount = parseFloat(
      typeof data.valor === 'number' 
        ? data.valor.toString() 
        : (data.valor || "0").toString()
    );
    
    const parcelaData = {
      id: data.id?.toString() || `${saleId}-${parcelaNumber}`,
      number: parcelaNumber,
      amount: parcelaAmount,
      dueDate: new Date(data.data_vencimento || data.vencimento || new Date()),
      paymentDate: data.data_pagamento ? new Date(data.data_pagamento) : null,
      status: mapInstallmentStatus(data.status || data.situacao || ""),
    };
    
    // Verificar se a parcela já existe
    const existingInstallments = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "installments" 
       WHERE "salesRecordId" = $1 
       AND ("externalId" = $2 OR "number" = $3)
       AND "userId" = $4 
       LIMIT 1`,
      salesRecord.id,
      parcelaData.id,
      parcelaData.number,
      targetUserId
    );
    
    const existingInstallment = existingInstallments.length > 0 ? existingInstallments[0] : null;
    
    if (existingInstallment) {
      // Atualizar parcela existente
      await prisma.$executeRawUnsafe(
        `UPDATE "installments" SET 
         "amount" = $1, 
         "status" = $2, 
         "paymentDate" = $3,
         "updatedAt" = $4,
         "metadata" = $5::jsonb
         WHERE "id" = $6`,
        parcelaData.amount,
        parcelaData.status,
        parcelaData.paymentDate,
        new Date(),
        JSON.stringify(data),
        existingInstallment.id
      );
      console.log(`[WEBHOOK] Parcela ${parcelaData.number} atualizada com ID ${existingInstallment.id}`);
      
      return {
        success: true,
        message: `Evento ${event} processado com dados reais`,
        timestamp: new Date().toISOString(),
        testProcessed: true,
        salesId: salesRecord.id,
        installmentId: existingInstallment.id
      };
    } else {
      // Criar nova parcela
      const installmentId = `inst-${salesRecord.id}-${parcelaData.number}`;
      await prisma.$executeRawUnsafe(
        `INSERT INTO "installments" (
          "id", "salesRecordId", "userId", "externalId", "number", 
          "amount", "dueDate", "paymentDate", "status", "metadata", 
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12
        )`,
        installmentId,
        salesRecord.id,
        targetUserId,
        parcelaData.id,
        parcelaData.number,
        parcelaData.amount,
        parcelaData.dueDate,
        parcelaData.paymentDate,
        parcelaData.status,
        JSON.stringify(data),
        new Date(),
        new Date()
      );
      console.log(`[WEBHOOK] Parcela ${parcelaData.number} criada com ID ${installmentId}`);
      
      return {
        success: true,
        message: `Evento ${event} processado com dados reais`,
        timestamp: new Date().toISOString(),
        testProcessed: true,
        salesId: salesRecord.id,
        installmentId
      };
    }
  } catch (error: any) {
    console.error(`[WEBHOOK] Erro no processamento real de parcela de teste:`, error);
    throw error;
  }
} 
