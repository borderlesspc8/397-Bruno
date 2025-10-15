/**
 * Handler para processar eventos de vendas do Gestão Click
 */

import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { createServerNotification } from "@/app/_lib/server-notifications";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { GestaoClickSale } from "../types";
import { getGestaoClickSettings } from "../utils";

/**
 * Processa eventos de venda (criação/atualização)
 */
export async function processSaleEvent(
  event: string,
  data: any,
  userId: string
) {
  try {
    console.log(`[WEBHOOK] Iniciando processamento de venda para evento ${event}`);
    
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
    
    // Obter o ID da venda com verificação de segurança
    const saleId = data.saleId || data.id;
    
    if (!saleId) {
      throw new Error("ID da venda não informado no evento");
    }
    
    console.log(`[WEBHOOK] Processando venda ${saleId}`);
    
    // Buscar detalhes da venda diretamente da API
    const today = new Date();
    let saleData = null;
    let apiError: Error | null = null;
    
    try {
      // MÉTODO 1: Tentar buscar diretamente pelo ID da venda
      console.log(`[WEBHOOK] Buscando venda ${saleId} pelo endpoint específico`);
      
      const specificUrl = new URL(`${settings.apiUrl}/vendas/${saleId}`);
      const response = await fetch(specificUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        },
        // Adicionar timeout para evitar bloqueios
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.ok) {
        const responseData = await response.json();
        // A API pode retornar os dados diretamente ou dentro de um objeto data
        saleData = responseData.data || responseData;
        console.log(`[WEBHOOK] Venda ${saleId} encontrada diretamente via API`);
      } else {
        // Registrar detalhes do erro para diagnóstico
        const errorStatus = response.status;
        const errorText = await response.text();
        
        console.warn(`[WEBHOOK] Erro ao buscar venda diretamente: HTTP ${errorStatus}`);
        console.warn(`[WEBHOOK] Detalhes: ${errorText}`);
        
        // Armazenar o erro para tentar o próximo método
        apiError = new Error(`Falha ao buscar venda: HTTP ${errorStatus} - ${errorText.substring(0, 100)}`);
      }
    } catch (directFetchError) {
      console.warn(`[WEBHOOK] Exceção ao buscar venda diretamente:`, directFetchError);
      apiError = directFetchError instanceof Error ? directFetchError : new Error(String(directFetchError));
    }
    
    // MÉTODO 2: Se não conseguiu obter direto, tentar pela listagem de vendas
    if (!saleData) {
      try {
        console.log(`[WEBHOOK] Venda não encontrada diretamente, tentando buscar na listagem...`);
        
        // Buscar todas as vendas de um período amplo (últimos 90 dias)
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        
        console.log(`[WEBHOOK] Buscando vendas de ${startDate.toISOString()} até ${new Date().toISOString()}`);
        
        try {
          const sales = await gestaoClickService.getSales(
            startDate,
            new Date(),
            {
              includeInstallments: true,
            }
          );
          
          if (Array.isArray(sales)) {
            console.log(`[WEBHOOK] Encontradas ${sales.length} vendas na listagem`);
            
            // Filtrar apenas a venda com o ID específico
            const targetSale = sales.find(sale => 
              sale.id && sale.id.toString() === saleId.toString()
            );
            
            if (targetSale) {
              saleData = targetSale;
              console.log(`[WEBHOOK] Venda ${saleId} encontrada na listagem de vendas`);
            } else {
              console.log(`[WEBHOOK] Venda ${saleId} não encontrada na listagem (${sales.length} vendas verificadas)`);
            }
          } else {
            console.warn(`[WEBHOOK] Resposta de getSales não é um array:`, typeof sales);
            
            // Verificar se temos um objeto único e se ele corresponde à venda que procuramos
            if (sales && typeof sales === 'object' && sales.id && sales.id.toString() === saleId.toString()) {
              saleData = sales;
              console.log(`[WEBHOOK] Venda ${saleId} encontrada como objeto único`);
            }
          }
        } catch (salesError) {
          console.error(`[WEBHOOK] Erro ao buscar lista de vendas:`, salesError);
          
          // Se ainda não temos erro registrado, usar este
          if (!apiError) {
            apiError = salesError instanceof Error ? salesError : new Error(String(salesError));
          }
        }
      } catch (listingError) {
        console.error(`[WEBHOOK] Erro ao processar listagem de vendas:`, listingError);
        
        // Se ainda não temos erro registrado, usar este
        if (!apiError) {
          apiError = listingError instanceof Error ? listingError : new Error(String(listingError));
        }
      }
    }
    
    // MÉTODO 3: Criar uma venda mínima se todas as tentativas falharem
    // Isso permite que o sistema continue funcionando com dados básicos
    if (!saleData) {
      console.warn(`[WEBHOOK] Não foi possível obter dados completos da venda ${saleId}. Criando registro mínimo.`);
      
      // Criar um objeto mínimo com os dados disponíveis no evento
      saleData = {
        id: saleId,
        valor_total: parseFloat(data.valor_total || data.total || "0"),
        valor_liquido: parseFloat(data.valor_liquido || data.valor_total || "0"),
        data: data.data || data.data_venda || data.created_at || new Date().toISOString(),
        status: data.status || "PENDING",
        codigo: data.codigo || data.referencia || `VENDA-${saleId}`,
        cliente: data.cliente || { nome: data.nome_cliente || "Cliente não especificado" },
        loja: data.loja || { nome: data.nome_loja || "Loja não especificada" },
        forma_pagamento: data.forma_pagamento || { nome: "Não especificado" },
        parcelas: data.parcelas || [],
        _criado_de_dados_minimos: true
      };
      
      console.log(`[WEBHOOK] Registro mínimo criado para a venda ${saleId}`);
      
      // Registrar aviso sobre dados mínimos
      try {
        await createServerNotification({
          userId,
          title: "Dados parciais de venda",
          message: `A venda ${saleId} foi registrada com dados mínimos devido a problemas na API`,
          type: NotificationType.SYSTEM,
          priority: NotificationPriority.MEDIUM,
          link: "/transactions",
          metadata: {
            source: "GESTAO_CLICK",
            event,
            saleId,
            timestamp: new Date().toISOString(),
            warning: "Dados parciais obtidos da API"
          }
        });
      } catch (notificationError) {
        console.warn(`[WEBHOOK] Erro ao enviar notificação sobre dados parciais:`, notificationError);
      }
    }
    
    // Processar a venda
    if (saleData) {
      try {
        // Criar ou atualizar o registro de venda
        const existingSales = await prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM "sales_records" WHERE "userId" = $1 AND "externalId" = $2 LIMIT 1`,
          userId,
          saleId.toString()
        );
        
        let salesRecord = existingSales.length > 0 ? existingSales[0] : null;
        
        if (!salesRecord) {
          // Se a venda ainda não existe, criá-la
          console.log(`[WEBHOOK] Criando registro de venda ${saleId}`);
          
          // Formatar dados da venda
          const saleDate = new Date(saleData.data || saleData.data_venda || saleData.created_at || new Date());
          
          try {
            // Usar $executeRawUnsafe para criar o registro com tratamento de erros
            await prisma.$executeRawUnsafe(
              `INSERT INTO "sales_records" (
                "id", "userId", "externalId", "code", "date", "totalAmount", "netAmount", 
                "status", "customerId", "customerName", "storeId", "storeName", 
                "paymentMethod", "source", "metadata", "createdAt", "updatedAt"
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17
              )`,
              `sale-${saleId}-${userId}`,
              userId,
              saleId.toString(),
              saleData.codigo || saleData.referencia || saleId.toString(),
              saleDate,
              parseFloat(saleData.valor_total || saleData.total || "0"),
              parseFloat(saleData.valor_liquido || saleData.valor_total || "0"),
              saleData.status || "PENDING",
              saleData.cliente?.id?.toString() || null,
              saleData.cliente?.nome || saleData.nome_cliente || null,
              saleData.loja?.id?.toString() || saleData.loja_id?.toString() || null,
              saleData.loja?.nome || saleData.nome_loja || null,
              saleData.forma_pagamento?.nome || saleData.forma_pagamento || null,
              "GESTAO_CLICK",
              JSON.stringify({
                ...saleData,
                _processado_em: new Date().toISOString(),
                _dados_minimos: saleData._criado_de_dados_minimos || false
              }),
              new Date(),
              new Date()
            );
            
            console.log(`[WEBHOOK] Registro de venda criado com sucesso: sale-${saleId}-${userId}`);
            
            // Recuperar o registro recém-criado
            const newSales = await prisma.$queryRawUnsafe<any[]>(
              `SELECT * FROM "sales_records" WHERE "id" = $1 LIMIT 1`,
              `sale-${saleId}-${userId}`
            );
            
            salesRecord = newSales[0];
          } catch (insertError) {
            console.error(`[WEBHOOK] Erro ao inserir registro de venda:`, insertError);
            throw new Error(`Falha ao criar registro de venda: ${insertError instanceof Error ? insertError.message : String(insertError)}`);
          }
        } else {
          // Atualizar venda existente se necessário
          console.log(`[WEBHOOK] Atualizando registro de venda ${saleId}`);
          
          try {
            await prisma.$executeRawUnsafe(
              `UPDATE "sales_records" SET 
               "status" = $1,
               "totalAmount" = $2,
               "netAmount" = $3,
               "metadata" = $4,
               "updatedAt" = $5
               WHERE "id" = $6`,
              saleData.status || "PENDING",
              parseFloat(saleData.valor_total || saleData.total || "0"),
              parseFloat(saleData.valor_liquido || saleData.valor_total || "0"),
              JSON.stringify({
                ...saleData,
                _atualizado_em: new Date().toISOString()
              }),
              new Date(),
              salesRecord.id
            );
            
            console.log(`[WEBHOOK] Registro de venda atualizado com sucesso: ${salesRecord.id}`);
          } catch (updateError) {
            console.error(`[WEBHOOK] Erro ao atualizar registro de venda:`, updateError);
            throw new Error(`Falha ao atualizar registro de venda: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
          }
        }
        
        // Se a venda possui parcelas, processá-las
        if (saleData.parcelas && Array.isArray(saleData.parcelas) && saleData.parcelas.length > 0) {
          console.log(`[WEBHOOK] Processando ${saleData.parcelas.length} parcelas da venda ${saleId}`);
          
          // Importar de forma segura após a criação para evitar referências circulares
          let installmentHandlerModule;
          try {
            installmentHandlerModule = await import('./installment-handler');
          } catch (importError) {
            console.error(`[WEBHOOK] Erro ao importar manipulador de parcelas:`, importError);
            throw new Error(`Falha ao importar manipulador de parcelas: ${importError instanceof Error ? importError.message : String(importError)}`);
          }
          
          // Verificar se temos o manipulador correto
          if (!installmentHandlerModule || !installmentHandlerModule.installmentHandler) {
            throw new Error('Manipulador de parcelas não disponível');
          }
          
          const { installmentHandler } = installmentHandlerModule;
          
          // Para cada parcela, criar/atualizar o registro
          let sucessosParcelas = 0;
          let falhasParcelas = 0;
          
          for (const parcela of saleData.parcelas) {
            try {
              await installmentHandler.processInstallment(parcela, salesRecord, userId);
              sucessosParcelas++;
            } catch (parcelaError) {
              console.error(`[WEBHOOK] Erro ao processar parcela da venda ${saleId}:`, parcelaError);
              falhasParcelas++;
            }
          }
          
          console.log(`[WEBHOOK] Resultado do processamento de parcelas: ${sucessosParcelas} sucessos, ${falhasParcelas} falhas`);
        } else {
          console.log(`[WEBHOOK] Venda ${saleId} não possui parcelas ou formato inválido`);
        }
        
        console.log(`[WEBHOOK] Venda ${saleId} processada com sucesso`);
        
        return {
          success: true,
          salesRecordId: salesRecord.id,
          externalId: saleId.toString(),
          parcelasProcessadas: (saleData.parcelas && Array.isArray(saleData.parcelas)) ? saleData.parcelas.length : 0
        };
      } catch (processError) {
        console.error(`[WEBHOOK] Erro ao processar venda ${saleId}:`, processError);
        throw processError;
      }
    } else {
      // Se não conseguimos obter dados da venda mesmo após todas as tentativas
      const errorMessage = apiError ? apiError.message : "Não foi possível obter dados da venda";
      console.error(`[WEBHOOK] ${errorMessage}`);
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar evento de venda:", error);
    throw error;
  }
} 
