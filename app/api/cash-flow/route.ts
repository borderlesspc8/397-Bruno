/**
 * API para gerenciamento de fluxo de caixa e previsões financeiras
 */

import { getAuthSession } from "@/app/_lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { parseISO, format, startOfDay, endOfDay, addDays, subDays, isBefore, isAfter } from "date-fns";
import { CashFlowPredictionSource, InstallmentStatus } from "@/app/_types/transaction";

/**
 * GET /api/cash-flow
 * Obtém o fluxo de caixa para um período, incluindo predições
 * 
 * Parâmetros:
 * - startDate: Data inicial (obrigatório)
 * - endDate: Data final (obrigatório)
 * - walletId: ID da carteira (opcional)
 * - costCenterId: ID do centro de custo (opcional)
 * - groupBy: Agrupamento (day, week, month) - padrão: day
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");
    const walletId = searchParams.get("walletId");
    const costCenterId = searchParams.get("costCenterId");
    const groupBy = searchParams.get("groupBy") || "day"; // day, week, month
    
    // Validar datas
    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ 
        error: "As datas de início e fim são obrigatórias" 
      }, { status: 400 });
    }
    
    const startDate = startOfDay(parseISO(startDateStr));
    const endDate = endOfDay(parseISO(endDateStr));
    
    // Buscar transações reais para o período
    const transactionsWhere: any = {
      userId: session.user.id,
      date: {
        gte: startDate,
        lte: endDate
      }
    };
    
    if (walletId) {
      transactionsWhere.walletId = walletId;
    }
    
    // Filtro por centro de custo (via metadata ou relacionamentos)
    if (costCenterId) {
      // Opção 1: Centro de custo está no metadata da transação
      transactionsWhere.OR = [
        {
          metadata: {
            path: ['costCenterId'],
            equals: costCenterId
          }
        },
        // Opção 2: Centro de custo está relacionado via tabela de vendas
        {
          sales: {
            some: {
              salesRecord: {
                costCenters: {
                  some: {
                    costCenterId
                  }
                }
              }
            }
          }
        }
      ];
    }
    
    const transactions = await prisma.transaction.findMany({
      where: transactionsWhere,
      include: {
        wallet: {
          select: { name: true, color: true }
        },
        categoryObj: {
          select: { name: true, color: true, icon: true }
        },
        sales: {
          include: {
            salesRecord: {
              select: {
                id: true,
                code: true,
                customerName: true,
                storeName: true,
                costCenters: {
                  include: {
                    costCenter: {
                      select: { id: true, name: true, code: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { date: 'asc' }
    });
    
    // Enriquecer transações com dados de centro de custo
    const enhancedTransactions = await enhanceTransactionsWithCostCenters(
      transactions,
      session.user.id
    );
    
    // Buscar previsões para o período (entradas no fluxo de caixa que não são transações)
    const predictionsWhere: any = {
      userId: session.user.id,
      date: {
        gte: startDate,
        lte: endDate
      },
      // Somente previsões, não transações reais
      transactionId: null
    };
    
    if (walletId) {
      predictionsWhere.walletId = walletId;
    }
    
    // Filtro por centro de custo para previsões
    if (costCenterId) {
      predictionsWhere.metadata = {
        path: ['costCenterId'],
        equals: costCenterId
      };
    }
    
    const predictions = await prisma.cash_flow_entries.findMany({
      where: predictionsWhere,
      include: {
        Wallet: {
          select: { id: true, name: true, color: true }
        }
      },
      orderBy: { date: 'asc' }
    });
    
    // Buscar resumo de parcelas (installments)
    let installmentSummary = {
      pending: 0,
      overdue: 0,
      paid: 0,
      canceled: 0,
      totalAmount: 0,
      overdueAmount: 0,
      pendingAmount: 0
    };
    
    try {
      // Construir filtro para parcelas
      let installmentsWhere: any = {
        userId: session.user.id
      };
      
      // Filtrar por carteira se especificado
      if (walletId) {
        installmentsWhere.salesRecordId = { 
          in: await getSalesRecordsForWallet(walletId) 
        };
      }
      
      // Filtrar por centro de custo se especificado
      if (costCenterId) {
        installmentsWhere.sales_records = {
          costCenters: {
            some: {
              costCenterId
            }
          }
        };
      }
      
      // Calcular resumo de parcelas
      const installments = await prisma.installments.findMany({
        where: installmentsWhere,
        include: {
          sales_records: {
            select: {
              code: true,
              storeName: true,
              customerName: true
            }
          }
        }
      });
      
      const today = new Date();
      
      for (const inst of installments) {
        const amount = parseFloat(inst.amount.toString());
        installmentSummary.totalAmount += amount;
        
        if (inst.status === 'PENDING') {
          installmentSummary.pending++;
          installmentSummary.pendingAmount += amount;
          
          // Verificar se está vencida
          if (inst.dueDate < today) {
            installmentSummary.overdue++;
            installmentSummary.overdueAmount += amount;
          }
        } else if (inst.status === 'PAID') {
          installmentSummary.paid++;
        } else if (inst.status === 'CANCELED') {
          installmentSummary.canceled++;
        }
      }
    } catch (error) {
      console.error("Erro ao calcular resumo de parcelas:", error);
      // Mantém o objeto vazio criado acima
    }
    
    // Processar dados por período (dia, semana ou mês)
    const cashFlowByPeriod = processCashFlowByPeriod(
      enhancedTransactions,
      predictions,
      groupBy
    );
    
    // Buscar centros de custo incluídos para resumo
    let costCentersSummary = [];
    if (costCenterId) {
      // Se um centro de custo específico foi solicitado
      costCentersSummary = await prisma.costCenter.findMany({
        where: {
          id: costCenterId,
          userId: session.user.id
        },
        select: {
          id: true,
          name: true,
          code: true
        }
      });
    } else {
      // Buscar todos os centros de custo presentes nos dados
      const costCenterIds = new Set<string>();
      
      // Adicionar IDs de centros de custo de transações
      enhancedTransactions.forEach(tx => {
        if (tx.costCenters?.length > 0) {
          tx.costCenters.forEach(cc => costCenterIds.add(cc.id));
        }
      });
      
      // Buscar detalhes dos centros de custo
      if (costCenterIds.size > 0) {
        costCentersSummary = await prisma.costCenter.findMany({
          where: {
            id: {
              in: Array.from(costCenterIds)
            },
            userId: session.user.id
          },
          select: {
            id: true,
            name: true,
            code: true
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      cashFlow: cashFlowByPeriod,
      summary: {
        totalTransactions: transactions.length,
        totalPredictions: predictions.length,
        installments: installmentSummary,
        costCenters: costCentersSummary,
        period: {
          start: format(startDate, 'yyyy-MM-dd'),
          end: format(endDate, 'yyyy-MM-dd'),
          groupBy
        }
      }
    });
  } catch (error: any) {
    console.error("Erro ao obter fluxo de caixa:", error);
    return NextResponse.json({ 
      error: `Erro ao obter fluxo de caixa: ${error.message}` 
    }, { status: 500 });
  }
}

/**
 * Enriquece transações com informações de centros de custo
 */
async function enhanceTransactionsWithCostCenters(transactions, userId) {
  // Coletar IDs de transações
  const transactionIds = transactions.map(tx => tx.id);
  
  // Buscar centros de custo para transações via metadata
  const transactionsWithCostCenter = await prisma.transaction.findMany({
    where: {
      id: { in: transactionIds },
      metadata: {
        path: ['costCenterId'],
        not: null
      }
    },
    select: {
      id: true,
      metadata: true
    }
  });
  
  // Criar mapeamento de transações para IDs de centros de custo
  const transactionToCostCenterMap = {};
  transactionsWithCostCenter.forEach(tx => {
    transactionToCostCenterMap[tx.id] = tx.metadata.costCenterId;
  });
  
  // Buscar detalhes dos centros de custo
  const costCenterIds = Object.values(transactionToCostCenterMap);
  const costCenters = await prisma.costCenter.findMany({
    where: {
      id: { in: costCenterIds as string[] },
      userId
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true
    }
  });
  
  // Criar mapeamento de ID para detalhes do centro de custo
  const costCenterMap = {};
  costCenters.forEach(cc => {
    costCenterMap[cc.id] = cc;
  });
  
  // Enriquecer transações com informações de centro de custo
  return transactions.map(tx => {
    // Inicializar array de centros de custo
    const costCentersArray = [];
    
    // Adicionar centro de custo do metadata, se existir
    const costCenterId = tx.metadata?.costCenterId || transactionToCostCenterMap[tx.id];
    if (costCenterId && costCenterMap[costCenterId]) {
      costCentersArray.push(costCenterMap[costCenterId]);
    }
    
    // Adicionar centros de custo de vendas relacionadas
    if (tx.sales && tx.sales.length > 0) {
      tx.sales.forEach(sale => {
        if (sale.salesRecord.costCenters && sale.salesRecord.costCenters.length > 0) {
          sale.salesRecord.costCenters.forEach(cc => {
            // Verificar se o centro de custo já não está no array
            if (!costCentersArray.some(existing => existing.id === cc.costCenter.id)) {
              costCentersArray.push(cc.costCenter);
            }
          });
        }
      });
    }
    
    return {
      ...tx,
      costCenters: costCentersArray,
      // Adicionar informações de vendas de forma mais direta
      sales: tx.sales ? tx.sales.map(s => ({
        id: s.salesRecord.id,
        code: s.salesRecord.code,
        customerName: s.salesRecord.customerName,
        storeName: s.salesRecord.storeName
      })) : []
    };
  });
}

/**
 * Função auxiliar para obter IDs de vendas associadas a uma carteira
 */
async function getSalesRecordsForWallet(walletId: string): Promise<string[]> {
  try {
    // Buscar vendas diretamente relacionadas à carteira via metadata
    const salesRecords = await prisma.sales_records.findMany({
      where: {
        // Filtrar por transações associadas a esta carteira
        OR: [
          // Vendas com storeId mapeado para esta carteira
          {
            metadata: {
              path: ['walletId'],
              equals: walletId
            }
          },
          // Vendas associadas a transações desta carteira
          {
            transactions: {
              some: {
                transaction: {
                  walletId
                }
              }
            }
          }
        ]
      },
      select: { id: true }
    });
    
    return salesRecords.map(record => record.id);
  } catch (error) {
    console.error("Erro ao buscar vendas para carteira:", error);
    return [];
  }
}

/**
 * Processa transações e previsões por período
 */
function processCashFlowByPeriod(
  transactions: any[],
  predictions: any[],
  groupBy: string
): any[] {
  // Mapear transações por período
  const periodMap = new Map();
  
  // Processar transações reais
  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const periodKey = getPeriodKey(date, groupBy);
    
    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: periodKey,
        date,
        totalIncome: 0,
        totalExpense: 0,
        netFlow: 0,
        predictedIncome: 0,
        predictedExpense: 0,
        predictedNetFlow: 0,
        transactions: [],
        predictions: [],
        costCenters: {}
      });
    }
    
    const periodData = periodMap.get(periodKey);
    const txWithPeriodDate = { ...transaction, periodDate: date };
    periodData.transactions.push(txWithPeriodDate);
    
    // Obter valor da transação
    const amount = parseFloat(transaction.amount);
    
    // Atualizar totais
    if (transaction.type === 'INCOME' || transaction.type === 'DEPOSIT') {
      periodData.totalIncome += amount;
      
      // Atualizar totais por centro de custo
      if (transaction.costCenters && transaction.costCenters.length > 0) {
        transaction.costCenters.forEach(cc => {
          if (!periodData.costCenters[cc.id]) {
            periodData.costCenters[cc.id] = {
              id: cc.id,
              name: cc.name,
              code: cc.code,
              income: 0,
              expense: 0,
              net: 0
            };
          }
          
          periodData.costCenters[cc.id].income += amount;
          periodData.costCenters[cc.id].net += amount;
        });
      }
    } else if (transaction.type === 'EXPENSE') {
      periodData.totalExpense += amount;
      
      // Atualizar totais por centro de custo
      if (transaction.costCenters && transaction.costCenters.length > 0) {
        transaction.costCenters.forEach(cc => {
          if (!periodData.costCenters[cc.id]) {
            periodData.costCenters[cc.id] = {
              id: cc.id,
              name: cc.name,
              code: cc.code,
              income: 0,
              expense: 0,
              net: 0
            };
          }
          
          periodData.costCenters[cc.id].expense += amount;
          periodData.costCenters[cc.id].net -= amount;
        });
      }
    }
    
    // Calcular fluxo líquido
    periodData.netFlow = periodData.totalIncome - periodData.totalExpense;
  });
  
  // Processar previsões
  predictions.forEach(prediction => {
    const date = new Date(prediction.date);
    const periodKey = getPeriodKey(date, groupBy);
    
    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: periodKey,
        date,
        totalIncome: 0,
        totalExpense: 0,
        netFlow: 0,
        predictedIncome: 0,
        predictedExpense: 0,
        predictedNetFlow: 0,
        transactions: [],
        predictions: [],
        costCenters: {}
      });
    }
    
    const periodData = periodMap.get(periodKey);
    const predWithPeriodDate = { ...prediction, periodDate: date };
    periodData.predictions.push(predWithPeriodDate);
    
    // Calcular probabilidade (se existir)
    const metadata = prediction.metadata || {};
    const probability = metadata.probability || 1.0;
    const adjustedAmount = parseFloat(prediction.amount) * probability;
    
    // Atualizar totais previstos
    if (prediction.type === 'INCOME') {
      periodData.predictedIncome += adjustedAmount;
      
      // Atualizar totais por centro de custo
      const costCenterId = prediction.metadata?.costCenterId;
      if (costCenterId) {
        if (!periodData.costCenters[costCenterId]) {
          periodData.costCenters[costCenterId] = {
            id: costCenterId,
            name: metadata.costCenterName || 'Centro de Custo',
            code: metadata.costCenterCode,
            income: 0,
            expense: 0,
            net: 0,
            predictedIncome: 0,
            predictedExpense: 0,
            predictedNet: 0
          };
        }
        
        periodData.costCenters[costCenterId].predictedIncome += adjustedAmount;
        periodData.costCenters[costCenterId].predictedNet += adjustedAmount;
      }
    } else if (prediction.type === 'EXPENSE') {
      periodData.predictedExpense += adjustedAmount;
      
      // Atualizar totais por centro de custo
      const costCenterId = prediction.metadata?.costCenterId;
      if (costCenterId) {
        if (!periodData.costCenters[costCenterId]) {
          periodData.costCenters[costCenterId] = {
            id: costCenterId,
            name: metadata.costCenterName || 'Centro de Custo',
            code: metadata.costCenterCode,
            income: 0,
            expense: 0,
            net: 0,
            predictedIncome: 0,
            predictedExpense: 0,
            predictedNet: 0
          };
        }
        
        periodData.costCenters[costCenterId].predictedExpense += adjustedAmount;
        periodData.costCenters[costCenterId].predictedNet -= adjustedAmount;
      }
    }
    
    // Calcular fluxo líquido previsto
    periodData.predictedNetFlow = periodData.predictedIncome - periodData.predictedExpense;
  });
  
  // Converter mapa em array, transformar objetos de centro de custo e ordenar por data
  return Array.from(periodMap.values())
    .map(periodData => {
      // Converter objeto de centros de custo em array
      const costCentersArray = Object.values(periodData.costCenters);
      
      return {
        ...periodData,
        costCenters: costCentersArray
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Obtém a chave de período baseada na data e agrupamento
 */
function getPeriodKey(date: Date, groupBy: string): string {
  switch (groupBy) {
    case 'week':
      // ISO week (segunda-feira é o início da semana)
      const firstDayOfWeek = new Date(date);
      while (firstDayOfWeek.getDay() !== 1) { // 1 = segunda-feira
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() - 1);
      }
      return `${format(firstDayOfWeek, 'yyyy')}-W${format(firstDayOfWeek, 'ww')}`;
    case 'month':
      return format(date, 'yyyy-MM');
    case 'day':
    default:
      return format(date, 'yyyy-MM-dd');
  }
}

/**
 * POST /api/cash-flow
 * Cria uma nova previsão de fluxo de caixa manual
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    // Extrair dados do corpo da requisição
    const body = await request.json();
    const { 
      amount, 
      type, 
      date, 
      description, 
      category, 
      walletId, 
      probability = 1.0
    } = body;
    
    // Validar dados obrigatórios
    if (!amount || !type || !date || !description) {
      return NextResponse.json({ 
        error: "Valor, tipo, data e descrição são obrigatórios" 
      }, { status: 400 });
    }
    
    // Criar nova previsão usando a tabela cash_flow_entries
    const prediction = await prisma.cash_flow_entries.create({
      data: {
        id: `manual-${Date.now()}`, // Gerar ID manualmente
        userId: session.user.id,
        walletId: walletId || null,
        amount: parseFloat(amount),
        type,
        date: new Date(date),
        description,
        category: category || 'OTHER',
        source: 'MANUAL',
        status: 'PENDING',
        metadata: {
          probability: parseFloat(probability) || 1.0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Previsão criada com sucesso",
      prediction
    });
  } catch (error: any) {
    console.error("Erro ao criar previsão de fluxo de caixa:", error);
    return NextResponse.json({ 
      error: `Erro ao criar previsão: ${error.message}` 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/cash-flow
 * Exclui uma previsão de fluxo de caixa
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    // Extrair parâmetros da URL
    const { searchParams } = new URL(request.url);
    const predictionId = searchParams.get("id");
    
    if (!predictionId) {
      return NextResponse.json({ 
        error: "ID da previsão é obrigatório" 
      }, { status: 400 });
    }
    
    // Verificar se a previsão existe e pertence ao usuário
    const prediction = await prisma.cash_flow_entries.findFirst({
      where: {
        id: predictionId,
        userId: session.user.id
      }
    });
    
    if (!prediction) {
      return NextResponse.json({ 
        error: "Previsão não encontrada ou não pertence ao usuário" 
      }, { status: 404 });
    }
    
    // Excluir previsão
    await prisma.cash_flow_entries.delete({
      where: { id: predictionId }
    });
    
    return NextResponse.json({
      success: true,
      message: "Previsão excluída com sucesso"
    });
  } catch (error: any) {
    console.error("Erro ao excluir previsão de fluxo de caixa:", error);
    return NextResponse.json({ 
      error: `Erro ao excluir previsão: ${error.message}` 
    }, { status: 500 });
  }
} 