/**
 * Webhook para receber atualizações em tempo real do Gestão Click
 * Este endpoint recebe notificações de mudanças de dados e atualiza o sistema automaticamente
 */

import { NextRequest, NextResponse } from "next/server";
import { WebhookEvent } from "./types";
import { createServerNotification } from "@/app/_lib/server-notifications";
import { NotificationType, NotificationPriority } from "@/app/_types/notification";
import { revalidatePath } from "next/cache";
import { 
  processTransactionEvent, 
  processSaleEvent, 
  installmentHandler,
  processCostCenterEvent, 
  processInventoryEvent 
} from "./handlers";
import { processTestSaleEvent, processTestInstallmentEvent } from "./utils/development";
import { criarCarteiraIntegracao } from "./utils/fix-webhook";
import { prisma } from "@/app/_lib/prisma";
import { getGestaoClickSettings, mapInstallmentStatus, mapGestaoClickCategoryToType } from "./utils";

// Definir chave de API para autenticação
const WEBHOOK_SECRET = process.env.GESTAO_CLICK_WEBHOOK_SECRET;

// Configurar como dinâmico para sempre receber dados atualizados
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/gestao-click
 * Recebe atualizações em tempo real do Gestão Click
 */
export async function POST(request: NextRequest) {
  console.log("[WEBHOOK] Recebendo dados do Gestão Click");
  
  try {
    // Extrair dados do corpo da requisição
    const body = await request.json();
    
    // Verificar se é uma requisição de teste
    if (body.event === "test") {
      console.log("[WEBHOOK] Teste de webhook recebido com sucesso");
      return NextResponse.json({ status: "ok", message: "Webhook funcionando corretamente" });
    }
    
    // Validar evento e dados
    if (!body.event || !body.data) {
      console.error("[WEBHOOK] Dados inválidos recebidos:", body);
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    
    // Verificar o userId do webhook
    const userId = body.userId || body.data.userId;
    if (!userId) {
      console.error("[WEBHOOK] UserId não fornecido");
      return NextResponse.json({ error: "UserId não fornecido" }, { status: 400 });
    }
    
    // Obter configurações do Gestão Click
    const settings = await getGestaoClickSettings(userId);
    if (!settings) {
      console.error("[WEBHOOK] Configurações do Gestão Click não encontradas para o usuário:", userId);
      return NextResponse.json({ error: "Configurações não encontradas" }, { status: 400 });
    }
    
    console.log(`[WEBHOOK] Evento recebido: ${body.event}`);
    
    // Processar eventos diferentes
    switch (body.event) {
      case "transaction.created":
      case "transaction.updated":
        await processTransaction(body.data, userId);
        break;
        
      case "installment.paid":
      case "installment.status_updated":
        await processInstallment(body.data, userId);
        break;
        
      case "financial_report.generated":
        await processFinancialReport(body.data, userId);
        break;
        
      default:
        console.log(`[WEBHOOK] Evento não processado: ${body.event}`);
    }
    
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar webhook:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * Processa uma transação recebida do Gestão Click
 */
async function processTransaction(data: any, userId: string) {
  try {
    console.log("[WEBHOOK] Processando transação:", JSON.stringify(data, null, 2));
    
    if (!data.id || !data.amount) {
      console.error("[WEBHOOK] Dados de transação inválidos");
      return;
    }
    
    // Converter valor para número
    const amount = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount);
    
    // Usar a nova função de mapeamento para determinar o tipo e categoria corretos
    const { type, category } = mapGestaoClickCategoryToType(
      data.category || data.description || '', 
      amount
    );
    
    // Verificar se a transação já existe
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
        metadata: {
          path: ["gestaoClick", "transactionId"],
          equals: data.id
        }
      }
    });
    
    if (existingTransaction) {
      // Atualizar transação existente
      console.log(`[WEBHOOK] Atualizando transação existente: ${existingTransaction.id}`);
      
      await prisma.transaction.update({
        where: { id: existingTransaction.id },
        data: {
          amount: amount,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description || '',
          category: category,
          type: type,
          metadata: {
            ...existingTransaction.metadata as any,
            gestaoClick: {
              transactionId: data.id,
              category: data.category || '',
              updatedAt: new Date().toISOString()
            }
          }
        }
      });
    } else {
      // Criar nova transação
      console.log(`[WEBHOOK] Criando nova transação do Gestão Click`);
      
      // Obter carteira padrão
      const defaultWallet = await prisma.wallet.findFirst({
        where: { 
          userId, 
          isDefault: true 
        }
      });
      
      if (!defaultWallet) {
        console.error("[WEBHOOK] Carteira padrão não encontrada para o usuário:", userId);
        return;
      }
      
      await prisma.transaction.create({
        data: {
          userId,
          walletId: defaultWallet.id,
          amount: amount,
          date: data.date ? new Date(data.date) : new Date(),
          description: data.description || '',
          category: category,
          type: type,
          metadata: {
            source: "GESTAO_CLICK",
            gestaoClick: {
              transactionId: data.id,
              category: data.category || '',
              createdAt: new Date().toISOString()
            }
          }
        }
      });
    }
    
    console.log(`[WEBHOOK] Transação processada com sucesso`);
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar transação:", error);
  }
}

/**
 * Processa um pagamento de parcela recebido do Gestão Click
 */
async function processInstallment(data: any, userId: string) {
  try {
    console.log("[WEBHOOK] Processando parcela:", JSON.stringify(data, null, 2));
    
    if (!data.id || !data.amount) {
      console.error("[WEBHOOK] Dados de parcela inválidos");
      return;
    }
    
    // Encontrar a parcela existente ou criar uma nova
    const existingInstallment = await prisma.installment.findFirst({
      where: {
        userId,
        metadata: {
          path: ["gestaoClick", "installmentId"],
          equals: data.id
        }
      }
    });
    
    // Converter valor para número
    const amount = typeof data.amount === 'number' ? data.amount : parseFloat(data.amount);
    
    // Mapear status da parcela
    const status = mapInstallmentStatus(data.status || '');
    
    if (existingInstallment) {
      // Atualizar parcela existente
      await prisma.installment.update({
        where: { id: existingInstallment.id },
        data: {
          amount: amount,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
          status: status,
          metadata: {
            ...existingInstallment.metadata as any,
            gestaoClick: {
              installmentId: data.id,
              updatedAt: new Date().toISOString()
            }
          }
        }
      });
    } else {
      // Obter a transação pai ou criar uma nova
      let transactionId;
      
      if (data.transactionId) {
        // Verificar se já existe transação para este ID do Gestão Click
        const existingTransaction = await prisma.transaction.findFirst({
          where: {
            userId,
            metadata: {
              path: ["gestaoClick", "transactionId"],
              equals: data.transactionId
            }
          }
        });
        
        if (existingTransaction) {
          transactionId = existingTransaction.id;
        } else {
          // Criar uma nova transação pai
          const defaultWallet = await prisma.wallet.findFirst({
            where: { 
              userId, 
              isDefault: true 
            }
          });
          
          if (!defaultWallet) {
            console.error("[WEBHOOK] Carteira padrão não encontrada para o usuário:", userId);
            return;
          }
          
          // Usar a nova função de mapeamento para determinar o tipo e categoria
          const { type, category } = mapGestaoClickCategoryToType(
            data.category || data.description || '', 
            amount
          );
          
          const newTransaction = await prisma.transaction.create({
            data: {
              userId,
              walletId: defaultWallet.id,
              amount: amount,
              date: data.date ? new Date(data.date) : new Date(),
              description: data.description || 'Transação com parcelas',
              category: category,
              type: type,
              isInstallment: true,
              metadata: {
                source: "GESTAO_CLICK",
                gestaoClick: {
                  transactionId: data.transactionId,
                  createdAt: new Date().toISOString()
                }
              }
            }
          });
          
          transactionId = newTransaction.id;
        }
      }
      
      // Criar nova parcela
      await prisma.installment.create({
        data: {
          userId,
          transactionId,
          title: data.description || 'Parcela',
          amount: amount,
          dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
          status: status,
          metadata: {
            source: "GESTAO_CLICK",
            gestaoClick: {
              installmentId: data.id,
              createdAt: new Date().toISOString()
            }
          }
        }
      });
    }
    
    console.log(`[WEBHOOK] Parcela processada com sucesso`);
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar parcela:", error);
  }
}

/**
 * Processa um relatório financeiro recebido do Gestão Click
 */
async function processFinancialReport(data: any, userId: string) {
  try {
    console.log("[WEBHOOK] Recebendo relatório financeiro:", JSON.stringify(data, null, 2));
    
    // Verificar se existem dados do relatório
    if (!data.id || !data.period || !data.items) {
      console.error("[WEBHOOK] Dados de relatório inválidos");
      return;
    }
    
    // Salvar metadados do relatório
    await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        metadata: {
          gestaoClick: {
            lastReport: {
              id: data.id,
              period: data.period,
              receivedAt: new Date().toISOString()
            }
          }
        }
      },
      update: {
        metadata: {
          gestaoClick: {
            lastReport: {
              id: data.id,
              period: data.period,
              receivedAt: new Date().toISOString()
            }
          }
        }
      }
    });
    
    // Processar itens do relatório como transações
    for (const item of data.items) {
      if (!item.category || item.amount === undefined) continue;
      
      // Converter valor para número
      const amount = typeof item.amount === 'number' ? item.amount : parseFloat(item.amount);
      
      // Usar a nova função de mapeamento
      const { type, category } = mapGestaoClickCategoryToType(item.category, amount);
      
      // Verificar se já existe transação para este item
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          userId,
          metadata: {
            path: ["gestaoClick", "reportItemId"],
            equals: item.id
          }
        }
      });
      
      if (existingTransaction) {
        // Atualizar transação existente
        await prisma.transaction.update({
          where: { id: existingTransaction.id },
          data: {
            amount: amount,
            description: item.description || item.category,
            category: category,
            type: type
          }
        });
      } else {
        // Obter carteira padrão
        const defaultWallet = await prisma.wallet.findFirst({
          where: { 
            userId, 
            isDefault: true 
          }
        });
        
        if (!defaultWallet) {
          console.error("[WEBHOOK] Carteira padrão não encontrada para o usuário:", userId);
          continue;
        }
        
        // Criar nova transação para o item
        await prisma.transaction.create({
          data: {
            userId,
            walletId: defaultWallet.id,
            amount: amount,
            date: item.date ? new Date(item.date) : new Date(),
            description: item.description || item.category,
            category: category,
            type: type,
            metadata: {
              source: "GESTAO_CLICK",
              gestaoClick: {
                reportId: data.id,
                reportItemId: item.id,
                period: data.period,
                createdAt: new Date().toISOString()
              }
            }
          }
        });
      }
    }
    
    console.log(`[WEBHOOK] Relatório financeiro processado com sucesso`);
  } catch (error) {
    console.error("[WEBHOOK] Erro ao processar relatório financeiro:", error);
  }
} 
