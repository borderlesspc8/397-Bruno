/**
 * Handler para processar eventos de parcelas do Gestão Click
 */

import { NextResponse } from "next/server";
import { 
  InstallmentEventData, 
  GestaoClickInstallment,
  GestaoClickSale,
  GestaoClickIntegrationSettings
} from "../types";
import { prisma } from "@/app/_lib/prisma";
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { createServerNotification } from "@/app/_lib/server-notifications";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";
import { mapInstallmentStatus, getGestaoClickSettings } from "../utils";

/**
 * Handler para processamento de parcelas
 */
class InstallmentHandler {
  /**
   * Processa uma parcela individual
   */
  async processInstallment(
    parcela: GestaoClickInstallment,
    salesRecord: any,
    userId: string
  ) {
    try {
      // Normalizar os dados da parcela (a API pode retornar diferentes formatos)
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
        id: parcela.id?.toString() || `${salesRecord.externalId}-${parcelaNumber}`,
        number: parcelaNumber,
        amount: parcelaAmount,
        dueDate: new Date(parcela.data_vencimento || parcela.vencimento || new Date()),
        paymentDate: parcela.data_pagamento ? new Date(parcela.data_pagamento) : null,
        status: mapInstallmentStatus(parcela.status || parcela.situacao || ""),
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
        userId
      );
      
      const existingInstallment = existingInstallments.length > 0 ? existingInstallments[0] : null;
      
      if (existingInstallment) {
        // Atualizar parcela existente se houver mudanças
        if (
          existingInstallment.status !== parcelaData.status ||
          existingInstallment.amount !== parcelaData.amount ||
          (parcelaData.paymentDate && !existingInstallment.paymentDate)
        ) {
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
            JSON.stringify(parcela),
            existingInstallment.id
          );
          console.log(`[WEBHOOK] Parcela ${parcelaData.number} atualizada`);
        } else {
          console.log(`[WEBHOOK] Parcela ${parcelaData.number} sem alterações`);
        }
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
          userId,
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
        console.log(`[WEBHOOK] Parcela ${parcelaData.number} criada`);
      }
      
      return true;
    } catch (error) {
      console.error(`[WEBHOOK] Erro ao processar parcela:`, error);
      return false;
    }
  }

  /**
   * Último recurso para tratar falha na API: gerar uma parcela mínima com base em dados disponíveis
   * Isso garante que pelo menos alguma informação seja registrada quando todas as tentativas de API falharem
   */
  private gerarParcelaEmergencia(
    saleId: string | number,
    vendaData?: any,
    parcelaId?: string | number,
    numero?: number
  ): GestaoClickInstallment[] {
    console.log(`[WEBHOOK] ⚠️ Gerando parcela de emergência para venda ${saleId}`);
    
    // Estimar valor total da venda (ou usar valor conhecido)
    const valorTotal = vendaData?.valor_total || vendaData?.total || 0;
    
    // Determinar quantidade de parcelas com base no ID da parcela ou assumir 1
    const numeroParcela = numero || 1;
    const quantidadeParcelas = numeroParcela <= 10 ? 10 : numeroParcela;
    
    // Calcular valor aproximado da parcela
    const valorParcela = valorTotal > 0 ? 
      valorTotal / quantidadeParcelas : 
      parcelaId ? 100 : 0; // valor mínimo arbitrário se não temos informações
    
    // Data base para vencimentos (hoje ou data da venda)
    const dataBase = vendaData?.data ? new Date(vendaData.data) : new Date();
    
    // Criar parcela com base nas informações disponíveis
    const parcela: GestaoClickInstallment = {
      id: parcelaId?.toString() || `${saleId}-${numeroParcela}`,
      numero: numeroParcela,
      valor: valorParcela,
      data_vencimento: new Date(dataBase.setMonth(dataBase.getMonth() + numeroParcela - 1)).toISOString().split('T')[0],
      status: "PENDENTE",
      _gerada_emergencia: true, // marcar que foi gerada como fallback
      _timestamp: new Date().toISOString()
    };
    
    console.log(`[WEBHOOK] ⚠️ Parcela de emergência gerada: #${parcela.numero}, valor ${parcela.valor}, vencimento ${parcela.data_vencimento}`);
    
    return [parcela];
  }

  /**
   * Busca parcelas de uma venda específica na API do Gestão Click
   * Método resiliente que tenta diferentes abordagens
   */
  async buscarParcelasDaVenda(
    saleId: string | number, 
    settings: GestaoClickIntegrationSettings,
    vendaData?: any, // Dados da venda, se disponíveis
    parcelaId?: string | number, // ID específico da parcela, se estiver buscando uma parcela específica
    numeroParcela?: number // Número da parcela, se conhecido
  ): Promise<GestaoClickInstallment[]> {
    console.log(`[WEBHOOK] Buscando parcelas da venda ${saleId}`);
    
    let parcelas: GestaoClickInstallment[] = [];
    let erros: string[] = [];
    let tentativasFalhadas = 0;
    
    // Método 1: Buscar parcelas diretamente pela API
    try {
      console.log(`[WEBHOOK] Tentativa 1: Buscando parcelas pelo endpoint direto`);
      const url = new URL(`${settings.apiUrl}/vendas/${saleId}/parcelas`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json'
        },
        // Adicionar timeout para evitar bloqueios
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Registrar formato da resposta para diagnóstico
        console.log(`[WEBHOOK] Formato da resposta:`, {
          isArray: Array.isArray(data),
          hasData: data && data.data !== undefined,
          dataIsArray: data && data.data && Array.isArray(data.data),
          length: Array.isArray(data) ? data.length : 
                 (data && data.data && Array.isArray(data.data)) ? data.data.length : 'N/A'
        });
        
        // A API pode retornar os dados diretamente ou dentro de um objeto data
        if (Array.isArray(data)) {
          parcelas = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          parcelas = data.data;
        } else if (data && typeof data === 'object') {
          // Em alguns casos raros, pode vir uma única parcela como objeto
          if (data.id) {
            parcelas = [data];
          } else if (data.parcelas && Array.isArray(data.parcelas)) {
            parcelas = data.parcelas;
          }
        }
        
        // Validar e filtrar resultados (segurança extra)
        parcelas = parcelas
          .filter((p: any) => p !== null && p !== undefined)
          .filter((p: GestaoClickInstallment) => typeof p === 'object' && p.id !== undefined && p.id !== null);
        
        console.log(`[WEBHOOK] Encontradas ${parcelas.length} parcelas pelo endpoint direto`);
      } else {
        const errorStatus = response.status;
        const errorText = await response.text();
        const errorMsg = `API retornou erro ${errorStatus} ao buscar parcelas diretamente: ${errorText.substring(0, 200)}`;
        console.warn(`[WEBHOOK] ${errorMsg}`);
        erros.push(errorMsg);
        tentativasFalhadas++;
        
        // Se for 404, pode ser que a API não suporte o endpoint específico de parcelas
        if (errorStatus === 404) {
          console.log(`[WEBHOOK] Endpoint de parcelas não encontrado (404), tentando outras abordagens`);
        }
      }
    } catch (error) {
      const errorMsg = `Erro ao buscar parcelas diretamente: ${error instanceof Error ? error.message : String(error)}`;
      console.warn(`[WEBHOOK] ${errorMsg}`);
      erros.push(errorMsg);
      tentativasFalhadas++;
    }
    
    // Método 2: Se não encontramos parcelas pelo método direto, buscar detalhes da venda
    if (parcelas.length === 0) {
      try {
        console.log(`[WEBHOOK] Tentativa 2: Buscando detalhes da venda para extrair parcelas`);
        const url = new URL(`${settings.apiUrl}/vendas/${saleId}`);
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${settings.apiKey}`,
            'Content-Type': 'application/json'
          },
          // Adicionar timeout para evitar bloqueios
          signal: AbortSignal.timeout(10000)
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Armazenar dados da venda para uso em fallback se necessário
          vendaData = data;
          
          // Verificar diferentes formatos possíveis
          let sale: any = null;
          
          if (data && data.id && data.id.toString() === saleId.toString()) {
            sale = data;
          } else if (data && data.data && data.data.id && data.data.id.toString() === saleId.toString()) {
            sale = data.data;
          }
          
          if (sale) {
            if (sale.parcelas && Array.isArray(sale.parcelas)) {
              parcelas = sale.parcelas.filter((p: any) => 
                p !== null && p !== undefined && typeof p === 'object' && p.id);
              console.log(`[WEBHOOK] Encontradas ${parcelas.length} parcelas nos detalhes da venda`);
            } else {
              console.log(`[WEBHOOK] Venda encontrada, mas sem parcelas no objeto`);
              tentativasFalhadas++;
            }
          } else {
            console.warn(`[WEBHOOK] Dados da venda não correspondem ao ID ${saleId}`);
            tentativasFalhadas++;
          }
        } else {
          const errorMsg = `API retornou erro ${response.status} ao buscar detalhes da venda`;
          console.warn(`[WEBHOOK] ${errorMsg}`);
          erros.push(errorMsg);
          tentativasFalhadas++;
          
          // Se for 404, talvez a venda não exista mais
          if (response.status === 404) {
            console.log(`[WEBHOOK] Venda ${saleId} não encontrada (404), tentando última abordagem`);
          }
        }
      } catch (error) {
        const errorMsg = `Erro ao buscar detalhes da venda: ${error instanceof Error ? error.message : String(error)}`;
        console.warn(`[WEBHOOK] ${errorMsg}`);
        erros.push(errorMsg);
        tentativasFalhadas++;
      }
    }
    
    // Método 3: Se ainda não encontramos, buscar na listagem de vendas
    if (parcelas.length === 0) {
      try {
        console.log(`[WEBHOOK] Tentativa 3: Buscando parcelas via listagem de vendas`);
        
        // Criar uma instância do serviço
        const gestaoClickService = new GestaoClickService({
          apiKey: settings.apiKey,
          secretToken: settings.secretToken,
          apiUrl: settings.apiUrl,
          userId: settings.userId || "system"
        });
        
        // Buscar vendas dos últimos 90 dias para aumentar chance de encontrar
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - 90);
        
        const sales = await gestaoClickService.getSales(
          startDate,
          today,
          { includeInstallments: true }
        );
        
        if (Array.isArray(sales)) {
          const targetSale = sales.find(sale => 
            sale && sale.id && sale.id.toString() === saleId.toString()
          );
          
          if (targetSale && targetSale.parcelas && Array.isArray(targetSale.parcelas)) {
            parcelas = targetSale.parcelas.filter((p: any) => 
              p !== null && p !== undefined && typeof p === 'object' && p.id);
            console.log(`[WEBHOOK] Encontradas ${parcelas.length} parcelas na listagem de vendas`);
            // Manter dados da venda para possível uso em fallback
            vendaData = targetSale;
          } else if (targetSale) {
            console.log(`[WEBHOOK] Venda encontrada na listagem, mas sem parcelas`);
            // Manter dados da venda para possível uso em fallback
            vendaData = targetSale;
            tentativasFalhadas++;
          } else {
            console.log(`[WEBHOOK] Venda ${saleId} não encontrada na listagem de ${sales.length} vendas`);
            tentativasFalhadas++;
          }
        } else {
          console.warn(`[WEBHOOK] getSales não retornou um array válido`);
          tentativasFalhadas++;
        }
      } catch (error) {
        const errorMsg = `Erro ao buscar parcelas via listagem de vendas: ${error instanceof Error ? error.message : String(error)}`;
        console.warn(`[WEBHOOK] ${errorMsg}`);
        erros.push(errorMsg);
        tentativasFalhadas++;
      }
    }
    
    // Recurso de emergência: Se todas as tentativas falharam, e temos um ID específico de parcela,
    // criar uma parcela mínima para permitir algum processamento
    if (parcelas.length === 0 && tentativasFalhadas >= 3 && (parcelaId || process.env.ENABLE_FALLBACK_PARCELAS === "true")) {
      console.log(`[WEBHOOK] ⚠️ Todas as tentativas de buscar parcelas falharam, gerando parcela de emergência`);
      parcelas = this.gerarParcelaEmergencia(saleId, vendaData, parcelaId, numeroParcela);
    }
    
    // Validar e sanitizar o resultado final
    const parcelasValidadas = parcelas
      .filter((p: any) => p !== null && p !== undefined)
      .filter((p: GestaoClickInstallment) => {
        // Verificar se a parcela tem os campos mínimos necessários
        const temId = p.id !== undefined && p.id !== null;
        const temValor = p.valor !== undefined && p.valor !== null;
        
        if (!temId || !temValor) {
          console.warn(`[WEBHOOK] Parcela inválida encontrada: ${JSON.stringify(p).substring(0, 100)}`);
          return false;
        }
        
        return true;
      })
      .map((p: GestaoClickInstallment) => {
        // Garantir que todos os campos necessários estão presentes ou definir valores padrão
        return {
          id: p.id,
          numero: p.numero || 1,
          valor: p.valor || 0,
          data_vencimento: p.data_vencimento || new Date().toISOString(),
          data_pagamento: p.data_pagamento || null,
          status: p.status || "PENDENTE",
          // Campos adicionados no modo de emergência, se aplicável
          _gerada_emergencia: p._gerada_emergencia,
          _timestamp: p._timestamp,
          // Outros campos podem ser copiados se presentes
          ...p
        };
      });
    
    console.log(`[WEBHOOK] Retornando ${parcelasValidadas.length} parcelas validadas após ${erros.length} erros e ${tentativasFalhadas} tentativas falhas`);
    return parcelasValidadas;
  }

  /**
   * Processa eventos de parcela (criação/atualização)
   */
  async processInstallmentEvent(
    event: string,
    data: InstallmentEventData,
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
      
      // Obter informações da parcela
      const installmentId = data.id || data.parcelaId;
      const saleId = data.vendaId || data.saleId;
      
      if (!saleId) {
        throw new Error("ID da venda não informado no evento de parcela");
      }
      
      console.log(`[WEBHOOK] Processando parcela ${installmentId} da venda ${saleId}`);
      
      // Buscar detalhes completos da venda para obter todas as parcelas
      const today = new Date();
      let saleData: GestaoClickSale | null = null;
      let apiErrors: string[] = [];
      
      // BLOCO PROTEGIDO: Busca de venda pela API
      try {
        // Primeiro tentamos buscar diretamente pelo endpoint específico da venda
        const specificUrl = new URL(`${settings.apiUrl}/vendas/${saleId}`);
        
        try {
          console.log(`[WEBHOOK] Buscando venda em: ${specificUrl.toString()}`);
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
            const parsedData = responseData.data || responseData;
            saleData = parsedData as GestaoClickSale;
            console.log(`[WEBHOOK] Venda ${saleId} encontrada diretamente via API`);
          } else {
            // Registrar detalhes do erro para diagnóstico
            const errorStatus = response.status;
            const errorText = await response.text();
            
            const errorMsg = `API retornou erro ${errorStatus} ao buscar venda diretamente: ${errorText.substring(0, 200)}`;
            console.warn(`[WEBHOOK] ${errorMsg}`);
            apiErrors.push(errorMsg);
            
            // Se não encontrarmos diretamente, usamos o método de busca por período
            console.log(`[WEBHOOK] Venda não encontrada diretamente (status ${response.status}), tentando busca por período`);
          }
        } catch (fetchError) {
          const errorMsg = `Erro ao buscar venda diretamente: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`;
          console.warn(`[WEBHOOK] ${errorMsg}`);
          apiErrors.push(errorMsg);
        }
        
        // Segundo método: busca por período (apenas se o primeiro falhou)
        if (!saleData) {
          try {
            console.log(`[WEBHOOK] Buscando venda na listagem de vendas`);
            const sales = await gestaoClickService.getSales(
              // Usar uma janela maior para garantir que encontremos a venda
              new Date(today.setDate(today.getDate() - 90)), // 90 dias atrás
              new Date(), // Hoje
              {
                includeInstallments: true
              }
            );
            
            if (Array.isArray(sales)) {
              const targetSale = sales.find(sale => 
                sale.id && sale.id.toString() === saleId.toString()
              );
              if (targetSale) {
                saleData = targetSale;
                console.log(`[WEBHOOK] Venda ${saleId} encontrada na listagem de vendas`);
              } else {
                const errorMsg = `Venda ${saleId} não encontrada na listagem de ${sales.length} vendas`;
                console.log(`[WEBHOOK] ${errorMsg}`);
                apiErrors.push(errorMsg);
              }
            } else {
              const errorMsg = `Resposta de getSales não é um array: ${typeof sales}`;
              console.warn(`[WEBHOOK] ${errorMsg}`);
              apiErrors.push(errorMsg);
            }
          } catch (getSalesError) {
            const errorMsg = `Erro ao buscar listagem de vendas: ${getSalesError instanceof Error ? getSalesError.message : String(getSalesError)}`;
            console.error(`[WEBHOOK] ${errorMsg}`);
            apiErrors.push(errorMsg);
          }
        }
      } catch (outermostError) {
        // Este bloco captura qualquer erro não tratado nas buscas da venda
        const errorMsg = `Erro geral ao buscar venda: ${outermostError instanceof Error ? outermostError.message : String(outermostError)}`;
        console.error(`[WEBHOOK] ${errorMsg}`);
        apiErrors.push(errorMsg);
      }
      
      // Se ainda não encontramos a venda ou as parcelas, buscar parcelas separadamente
      if (!saleData || !saleData.parcelas || !Array.isArray(saleData.parcelas) || saleData.parcelas.length === 0) {
        console.log(`[WEBHOOK] Venda sem parcelas encontradas, buscando parcelas separadamente`);
        
        // Buscar parcelas usando o método melhorado
        const parcelas = await this.buscarParcelasDaVenda(saleId, settings, saleData, installmentId, data.numero || data.number || 1);
        
        if (parcelas.length > 0) {
          if (!saleData) {
            // Se ainda não temos os dados da venda, criar um objeto mínimo
            saleData = {
              id: saleId,
              valor_total: 0,
              data: today.toISOString().slice(0, 10),
              status: "PROCESSADA",
              parcelas: parcelas
            };
            console.log(`[WEBHOOK] Criado objeto de venda mínimo com ${parcelas.length} parcelas`);
          } else {
            // Atribuir as parcelas encontradas
            saleData.parcelas = parcelas;
            console.log(`[WEBHOOK] Adicionadas ${parcelas.length} parcelas à venda existente`);
          }
        } else {
          console.warn(`[WEBHOOK] Não foi possível encontrar parcelas da venda ${saleId}`);
          
          // Se temos dados básicos da parcela no evento, criar um objeto mínimo
          if (installmentId && (data.valor || data.amount || data.value)) {
            console.log(`[WEBHOOK] Criando parcela mínima a partir dos dados do evento`);
            
            // Criar uma parcela mínima
            const parcelaMinima: GestaoClickInstallment = {
              id: installmentId,
              numero: data.numero || data.number || 1,
              valor: data.valor || data.amount || data.value || 0,
              data_vencimento: data.data_vencimento || data.vencimento || data.due_date || today.toISOString(),
              data_pagamento: data.data_pagamento || data.payment_date || null,
              status: data.status || "PENDENTE"
            };
            
            if (!saleData) {
              saleData = {
                id: saleId,
                valor_total: parseFloat(parcelaMinima.valor as string || "0") * 4, // estimativa
                data: today.toISOString().slice(0, 10),
                status: "PROCESSADA",
                parcelas: [parcelaMinima]
              };
            } else {
              saleData.parcelas = [parcelaMinima];
            }
            
            console.log(`[WEBHOOK] Criada parcela mínima com ID ${installmentId}`);
          }
        }
      }
      
      // Se encontramos a venda e as parcelas, vamos processar
      if (saleData) {
        try {
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
            console.log(`[WEBHOOK] Criando registro mínimo de venda ${saleId} para parcela`);
            
            // Usar $executeRawUnsafe para criar o registro
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
              new Date(saleData.data || saleData.data_venda || today),
              parseFloat(saleData.valor_total?.toString() || "0"),
              parseFloat(saleData.valor_liquido?.toString() || saleData.valor_total?.toString() || "0"),
              saleData.status || "PENDING",
              "GESTAO_CLICK",
              JSON.stringify({ 
                _createdFromInstallment: true,
                _createdAt: new Date().toISOString(),
                _apiErrors: apiErrors.length > 0 ? apiErrors : undefined
              }),
              new Date(),
              new Date()
            );
            
            // Recuperar o registro recém-criado
            const newSales = await prisma.$queryRawUnsafe<any[]>(
              `SELECT * FROM "sales_records" WHERE "id" = $1 LIMIT 1`,
              `sale-${saleId}-${userId}`
            );
            
            salesRecord = newSales[0];
          }
          
          // Processar cada parcela encontrada - com tratamento de erros melhorado
          let parcelasProcessadas = 0;
          let parcelasComErro = 0;
          let erros: string[] = [];
          
          if (saleData.parcelas && Array.isArray(saleData.parcelas)) {
            // Garantir que só processamos parcelas válidas
            const parcelasValidas = saleData.parcelas.filter(p => 
              p !== null && p !== undefined && typeof p === 'object');
              
            console.log(`[WEBHOOK] Processando ${parcelasValidas.length} parcelas válidas`);
            
            for (const parcela of parcelasValidas) {
              try {
                // Se temos um ID específico, processar apenas essa parcela
                if (installmentId && parcela.id && parcela.id.toString() === installmentId.toString()) {
                  const sucesso = await this.processInstallment(parcela, salesRecord, userId);
                  if (sucesso) parcelasProcessadas++;
                  else parcelasComErro++;
                  break;
                } else if (!installmentId) {
                  // Se não temos ID específico, processar todas as parcelas
                  const sucesso = await this.processInstallment(parcela, salesRecord, userId);
                  if (sucesso) parcelasProcessadas++;
                  else parcelasComErro++;
                }
              } catch (parcelaError) {
                parcelasComErro++;
                const mensagemErro = `Erro ao processar parcela ${parcela.id || parcela.numero}: ${parcelaError instanceof Error ? parcelaError.message : String(parcelaError)}`;
                console.error(`[WEBHOOK] ${mensagemErro}`);
                erros.push(mensagemErro);
              }
            }
            
            console.log(`[WEBHOOK] Processadas ${parcelasProcessadas} de ${parcelasValidas.length} parcelas (${parcelasComErro} com erro)`);
          }
          
          // Se tivemos erros mas conseguimos processar alguma parcela, registrar uma notificação
          if (erros.length > 0 && parcelasProcessadas > 0) {
            try {
              await createServerNotification({
                userId,
                title: "Parcelas processadas parcialmente",
                message: `${parcelasProcessadas} parcelas processadas com sucesso, ${parcelasComErro} com erros`,
                type: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                link: "/transactions",
                metadata: {
                  source: "GESTAO_CLICK",
                  event,
                  saleId,
                  erros: erros.slice(0, 5), // Limitar a 5 erros para não sobrecarregar
                  timestamp: new Date().toISOString()
                }
              });
            } catch (notificationError) {
              console.warn(`[WEBHOOK] Erro ao enviar notificação:`, notificationError);
            }
          }
          
          return {
            success: parcelasProcessadas > 0,
            salesRecordId: salesRecord.id,
            externalId: saleId.toString(),
            parcelasProcessadas,
            parcelasComErro,
            totalParcelas: saleData.parcelas?.length || 0,
            erros: erros.length > 0 ? erros : undefined
          };
        } catch (dbError) {
          const errorMsg = `Erro ao acessar banco de dados: ${dbError instanceof Error ? dbError.message : String(dbError)}`;
          console.error(`[WEBHOOK] ${errorMsg}`);
          
          // Notificar sobre o erro no banco de dados
          try {
            await createServerNotification({
              userId,
              title: "Erro ao processar parcela",
              message: `Erro de banco de dados ao processar parcela da venda ${saleId}`,
              type: NotificationType.SYSTEM,
              priority: NotificationPriority.HIGH,
              link: "/transactions",
              metadata: {
                source: "GESTAO_CLICK",
                event,
                saleId,
                installmentId,
                timestamp: new Date().toISOString(),
                error: errorMsg
              }
            });
          } catch (notificationError) {
            console.warn(`[WEBHOOK] Erro ao enviar notificação:`, notificationError);
          }
          
          throw new Error(`Erro ao processar parcela: ${errorMsg}`);
        }
      } else {
        console.warn(`[WEBHOOK] Não foi possível obter dados da venda ${saleId} ou suas parcelas`);
        
        // Notificar o usuário sobre o problema
        try {
          await createServerNotification({
            userId,
            title: "Problema ao processar parcela",
            message: `Não foi possível obter dados completos da parcela ${installmentId} da venda ${saleId}`,
            type: NotificationType.SYSTEM,
            priority: NotificationPriority.MEDIUM,
            link: "/transactions",
            metadata: {
              source: "GESTAO_CLICK",
              event,
              saleId,
              installmentId,
              timestamp: new Date().toISOString(),
              warning: "Dados incompletos ou indisponíveis",
              erros: apiErrors
            }
          });
        } catch (notificationError) {
          console.warn(`[WEBHOOK] Erro ao enviar notificação:`, notificationError);
        }
        
        // Tentar criar um registro de venda vazio pelo menos para registro futuro
        try {
          const existingSales = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM "sales_records" WHERE "userId" = $1 AND "externalId" = $2 LIMIT 1`,
            userId,
            saleId.toString()
          );
          
          if (existingSales.length === 0) {
            console.log(`[WEBHOOK] Criando registro de venda vazio para referência futura`);
            
            // Criar registro mínimo para sincronização futura
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
                _createdFromInstallmentEvent: true,
                _emptyRecord: true,
                _needsSync: true,
                _apiErrors: apiErrors,
                _createdAt: new Date().toISOString()
              }),
              new Date(),
              new Date()
            );
            
            console.log(`[WEBHOOK] Registro vazio criado para venda ${saleId}`);
          }
        } catch (fallbackError) {
          console.error(`[WEBHOOK] Erro ao criar registro vazio para referência:`, fallbackError);
        }
        
        return {
          success: false,
          message: "Não foi possível processar parcelas: dados indisponíveis",
          erros: apiErrors,
          saleId
        };
      }
    } catch (error) {
      console.error("[WEBHOOK] Erro ao processar evento de parcela:", 
        error instanceof Error ? error.message : String(error));
      
      // Em ambiente de desenvolvimento, registrar a pilha de chamadas
      if (process.env.NODE_ENV === "development") {
        console.error("[WEBHOOK] Stack trace:", 
          error instanceof Error ? error.stack : "Stack trace indisponível");
      }
      
      throw error;
    }
  }
}

// Exportar uma instância única do handler
export const installmentHandler = new InstallmentHandler(); 
