/**
 * Serviço para gerenciamento de parcelas e previsões de recebimentos
 * Processa vendas parceladas provenientes do Gestão Click
 */

import { prisma } from "@/app/_lib/prisma";
import { Installment, InstallmentStatus, GestaoClickSale, InstallmentImportResult, CashFlowPrediction, CashFlowPredictionSource } from "@/app/_types/transaction";
import { addDays, isBefore, isAfter, parseISO, format } from "date-fns";
import { TransactionPaymentMethod } from "@prisma/client";

interface CreateInstallmentParams {
  orderId: string;
  description: string;
  amount: number;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: Date;
  paymentMethod: TransactionPaymentMethod;
  status: InstallmentStatus;
  externalId?: string;
  userId: string;
  walletId: string;
}

export class InstallmentService {
  /**
   * Cria uma nova parcela
   */
  static async createInstallment(params: CreateInstallmentParams): Promise<Installment> {
    try {
      const installment = await prisma.installment.create({
        data: {
          orderId: params.orderId,
          description: params.description,
          amount: params.amount,
          installmentNumber: params.installmentNumber,
          totalInstallments: params.totalInstallments,
          dueDate: params.dueDate,
          paymentMethod: params.paymentMethod,
          status: params.status,
          externalId: params.externalId,
          userId: params.userId,
          walletId: params.walletId,
        }
      });

      // Gerar previsão de fluxo de caixa para esta parcela
      await this.createCashFlowPredictionFromInstallment(installment.id);

      return installment;
    } catch (error) {
      console.error("Erro ao criar parcela:", error);
      throw new Error(`Falha ao criar parcela: ${error}`);
    }
  }

  /**
   * Atualiza o status de uma parcela existente
   */
  static async updateInstallmentStatus(
    installmentId: string, 
    status: InstallmentStatus,
    transactionId?: string
  ): Promise<Installment> {
    try {
      const installment = await prisma.installment.update({
        where: { id: installmentId },
        data: { 
          status,
          transactionId
        }
      });

      // Atualizar previsão de fluxo de caixa correspondente
      if (status === InstallmentStatus.PAID || status === InstallmentStatus.CANCELED) {
        await this.updateCashFlowPredictionForInstallment(installmentId, status);
      }

      return installment;
    } catch (error) {
      console.error("Erro ao atualizar status da parcela:", error);
      throw new Error(`Falha ao atualizar status da parcela: ${error}`);
    }
  }

  /**
   * Cria uma previsão de fluxo de caixa baseada em uma parcela
   */
  static async createCashFlowPredictionFromInstallment(installmentId: string): Promise<CashFlowPrediction> {
    try {
      const installment = await prisma.installment.findUnique({
        where: { id: installmentId }
      });

      if (!installment) {
        throw new Error(`Parcela não encontrada: ${installmentId}`);
      }

      // Verificar se já existe uma previsão para esta parcela
      const existingPrediction = await prisma.cashFlowPrediction.findFirst({
        where: { installmentId }
      });

      if (existingPrediction) {
        return existingPrediction;
      }

      // Determinar probabilidade com base no status da parcela
      let probability = 1.0;
      if (installment.status === InstallmentStatus.OVERDUE) {
        // Parcelas atrasadas têm probabilidade reduzida
        const today = new Date();
        const dueDate = new Date(installment.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        probability = Math.max(0.1, 1 - (daysOverdue * 0.05)); // Reduz 5% por dia de atraso, min 10%
      } else if (installment.status === InstallmentStatus.PAID || installment.status === InstallmentStatus.CANCELED) {
        // Parcelas pagas ou canceladas não geram previsão
        return null;
      }

      const prediction = await prisma.cashFlowPrediction.create({
        data: {
          userId: installment.userId,
          walletId: installment.walletId,
          amount: installment.amount,
          type: "INCOME", // Parcelas são sempre receitas
          date: installment.dueDate,
          description: `Parcela ${installment.installmentNumber}/${installment.totalInstallments}: ${installment.description}`,
          category: "INSTALLMENT_INCOME",
          source: CashFlowPredictionSource.INSTALLMENT,
          probability,
          installmentId: installment.id,
          metadata: {
            orderId: installment.orderId,
            externalId: installment.externalId
          }
        }
      });

      return prediction;
    } catch (error) {
      console.error("Erro ao criar previsão de fluxo de caixa:", error);
      throw new Error(`Falha ao criar previsão de fluxo de caixa: ${error}`);
    }
  }

  /**
   * Atualiza a previsão de fluxo de caixa para uma parcela
   */
  static async updateCashFlowPredictionForInstallment(
    installmentId: string, 
    status: InstallmentStatus
  ): Promise<void> {
    try {
      // Se a parcela foi paga ou cancelada, remover previsão
      if (status === InstallmentStatus.PAID || status === InstallmentStatus.CANCELED) {
        await prisma.cashFlowPrediction.deleteMany({
          where: { installmentId }
        });
        return;
      }

      // Se está pendente ou atrasada, atualizar probabilidade
      const installment = await prisma.installment.findUnique({
        where: { id: installmentId }
      });

      if (!installment) return;

      let probability = 1.0;
      if (status === InstallmentStatus.OVERDUE) {
        const today = new Date();
        const dueDate = new Date(installment.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));
        probability = Math.max(0.1, 1 - (daysOverdue * 0.05));
      }

      await prisma.cashFlowPrediction.updateMany({
        where: { installmentId },
        data: {
          probability,
          date: installment.dueDate
        }
      });
    } catch (error) {
      console.error("Erro ao atualizar previsão de fluxo de caixa:", error);
      throw new Error(`Falha ao atualizar previsão de fluxo de caixa: ${error}`);
    }
  }

  /**
   * Importa vendas parceladas do Gestão Click
   */
  static async importInstallmentsFromGestaoClick(
    sales: GestaoClickSale[],
    userId: string,
    walletId: string
  ): Promise<InstallmentImportResult> {
    const result: InstallmentImportResult = {
      totalProcessed: sales.length,
      imported: 0,
      skipped: 0,
      errors: [],
      walletId
    };

    // Para cada venda parcelada
    for (const sale of sales) {
      try {
        if (!sale.parcelas || sale.parcelas.length === 0) {
          result.skipped++;
          continue;
        }

        // Verificar se já existem parcelas para esta venda
        const existingInstallments = await prisma.installment.findMany({
          where: {
            orderId: sale.id.toString(),
            userId
          }
        });

        if (existingInstallments.length > 0) {
          // Atualizar parcelas existentes
          for (const parcela of sale.parcelas) {
            const existingInstallment = existingInstallments.find(
              i => i.installmentNumber === parcela.numero
            );

            if (existingInstallment) {
              // Mapear status do Gestão Click para nosso sistema
              const mappedStatus = this.mapGestaoClickStatus(parcela.status);
              
              // Se o status mudou, atualizar
              if (existingInstallment.status !== mappedStatus) {
                await this.updateInstallmentStatus(existingInstallment.id, mappedStatus);
              }
            } else {
              // Criar parcela que não existe
              await this.createInstallment({
                orderId: sale.id.toString(),
                description: `Venda ${sale.codigo || sale.id} - Cliente: ${sale.cliente?.nome || 'Não identificado'}`,
                amount: parcela.valor,
                installmentNumber: parcela.numero,
                totalInstallments: sale.parcelas.length,
                dueDate: parseISO(parcela.data_vencimento),
                paymentMethod: this.mapGestaoClickPaymentMethod(sale.forma_pagamento?.nome),
                status: this.mapGestaoClickStatus(parcela.status),
                externalId: `${sale.id}-${parcela.numero}`,
                userId,
                walletId
              });
              result.imported++;
            }
          }
        } else {
          // Criar todas as parcelas
          for (const parcela of sale.parcelas) {
            await this.createInstallment({
              orderId: sale.id.toString(),
              description: `Venda ${sale.codigo || sale.id} - Cliente: ${sale.cliente?.nome || 'Não identificado'}`,
              amount: parcela.valor,
              installmentNumber: parcela.numero,
              totalInstallments: sale.parcelas.length,
              dueDate: parseISO(parcela.data_vencimento),
              paymentMethod: this.mapGestaoClickPaymentMethod(sale.forma_pagamento?.nome),
              status: this.mapGestaoClickStatus(parcela.status),
              externalId: `${sale.id}-${parcela.numero}`,
              userId,
              walletId
            });
            result.imported++;
          }
        }
      } catch (error) {
        console.error(`Erro ao importar parcelas da venda ${sale.id}:`, error);
        result.errors.push({
          orderId: sale.id.toString(),
          message: error.message
        });
      }
    }

    return result;
  }

  /**
   * Mapeia o status da parcela do Gestão Click para nosso sistema
   */
  private static mapGestaoClickStatus(status: string): InstallmentStatus {
    // Normalizar string removendo acentos e convertendo para minúsculas
    const normalizedStatus = status.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (normalizedStatus.includes("pag") || normalizedStatus.includes("liquidado")) {
      return InstallmentStatus.PAID;
    } else if (normalizedStatus.includes("atraso") || normalizedStatus.includes("vencido")) {
      return InstallmentStatus.OVERDUE;
    } else if (normalizedStatus.includes("cancel")) {
      return InstallmentStatus.CANCELED;
    } else {
      return InstallmentStatus.PENDING;
    }
  }

  /**
   * Mapeia o método de pagamento do Gestão Click para nosso sistema
   */
  private static mapGestaoClickPaymentMethod(method: string): TransactionPaymentMethod {
    if (!method) return "OTHER";

    // Normalizar string removendo acentos e convertendo para minúsculas
    const normalizedMethod = method.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    if (normalizedMethod.includes("cartao") && normalizedMethod.includes("credito")) {
      return "CREDIT_CARD";
    } else if (normalizedMethod.includes("cartao") && normalizedMethod.includes("debito")) {
      return "DEBIT_CARD";
    } else if (normalizedMethod.includes("dinheiro")) {
      return "CASH";
    } else if (normalizedMethod.includes("pix")) {
      return "PIX";
    } else if (normalizedMethod.includes("boleto")) {
      return "BANK_SLIP";
    } else if (normalizedMethod.includes("transferencia")) {
      return "BANK_TRANSFER";
    } else {
      return "OTHER";
    }
  }

  /**
   * Obtém o resumo de parcelas para um usuário
   */
  static async getInstallmentSummary(userId: string, walletId?: string): Promise<{
    pending: number;
    overdue: number;
    paid: number;
    canceled: number;
    totalAmount: number;
    overdueAmount: number;
    pendingAmount: number;
  }> {
    try {
      // Construir condição de consulta
      const where = { userId };
      if (walletId) {
        where['walletId'] = walletId;
      }

      // Buscar todas as parcelas do usuário
      const installments = await prisma.installment.findMany({
        where
      });

      // Calcular resumo
      const summary = {
        pending: 0,
        overdue: 0,
        paid: 0,
        canceled: 0,
        totalAmount: 0,
        overdueAmount: 0,
        pendingAmount: 0
      };

      installments.forEach(installment => {
        summary.totalAmount += installment.amount;

        switch (installment.status) {
          case InstallmentStatus.PENDING:
            summary.pending++;
            summary.pendingAmount += installment.amount;
            break;
          case InstallmentStatus.OVERDUE:
            summary.overdue++;
            summary.overdueAmount += installment.amount;
            break;
          case InstallmentStatus.PAID:
            summary.paid++;
            break;
          case InstallmentStatus.CANCELED:
            summary.canceled++;
            break;
        }
      });

      return summary;
    } catch (error) {
      console.error("Erro ao obter resumo de parcelas:", error);
      throw new Error(`Falha ao obter resumo de parcelas: ${error}`);
    }
  }

  /**
   * Atualiza o status de parcelas vencidas
   */
  static async updateOverdueInstallments(): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Encontrar parcelas pendentes com data de vencimento anterior a hoje
      const overdueInstallments = await prisma.installment.findMany({
        where: {
          status: InstallmentStatus.PENDING,
          dueDate: { lt: today }
        }
      });

      // Atualizar status de cada parcela vencida
      let updatedCount = 0;
      for (const installment of overdueInstallments) {
        await this.updateInstallmentStatus(installment.id, InstallmentStatus.OVERDUE);
        updatedCount++;
      }

      return updatedCount;
    } catch (error) {
      console.error("Erro ao atualizar parcelas vencidas:", error);
      throw new Error(`Falha ao atualizar parcelas vencidas: ${error}`);
    }
  }

  /**
   * Gera previsão de fluxo de caixa para um período
   */
  static async generateCashFlowPredictions(
    userId: string,
    startDate: Date,
    endDate: Date,
    walletId?: string
  ): Promise<CashFlowPrediction[]> {
    try {
      // Já existem previsões de parcelas geradas pelo sistema
      // Vamos buscar as previsões existentes para o período
      const whereClause = {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      };

      if (walletId) {
        whereClause['walletId'] = walletId;
      }

      const predictions = await prisma.cashFlowPrediction.findMany({
        where: whereClause,
        orderBy: { date: 'asc' }
      });

      return predictions;
    } catch (error) {
      console.error("Erro ao gerar previsões de fluxo de caixa:", error);
      throw new Error(`Falha ao gerar previsões de fluxo de caixa: ${error}`);
    }
  }
} 