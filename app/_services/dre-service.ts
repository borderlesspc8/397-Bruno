import { prisma } from "../_lib/prisma";
import { formatISO, startOfMonth, endOfMonth, subMonths, addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Interface para resultado financeiro por categoria
 */
interface CategoryResult {
  id: string;
  name: string;
  amount: number;
}

/**
 * Interface para resultado do DRE mensal
 */
export interface MonthlyDREResult {
  month: string;
  monthLabel: string;
  revenue: {
    total: number;
    byCategory: CategoryResult[];
    byWallet: CategoryResult[];
    byCostCenter: CategoryResult[];
  };
  expenses: {
    total: number;
    byCategory: CategoryResult[];
    byWallet: CategoryResult[];
    byCostCenter: CategoryResult[];
  };
  grossProfit: number;
  netProfit: number;
  margin: number;
}

/**
 * Interface para comparação do DRE mensal
 */
export interface DREComparison {
  currentMonth: MonthlyDREResult;
  previousMonth: MonthlyDREResult;
  changeRevenue: number;
  changeExpenses: number;
  changeProfit: number;
  changeMargin: number;
}

/**
 * Serviço para geração de relatórios de DRE
 */
export class DREService {
  /**
   * Gera um DRE para o mês especificado
   * @param userId ID do usuário
   * @param date Data de referência para o mês
   * @param includePredictions Se deve incluir previsões
   */
  static async generateMonthlyDRE(
    userId: string,
    date: Date = new Date(),
    includePredictions: boolean = false
  ): Promise<MonthlyDREResult> {
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    // Formatação para exibição
    const monthLabel = format(date, 'MMMM yyyy', { locale: ptBR });
    const monthKey = format(date, 'yyyy-MM');

    // Buscar transações do período
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        wallet: true,
        category: true
      }
    });

    // Buscar centros de custo
    const transactionIds = transactions.map(t => t.id);
    
    // Obter mapeamento de transações para centros de custo
    const costCenterMap = await this.getTransactionsCostCenters(userId, transactionIds);

    // Separar receitas e despesas
    const revenues = transactions.filter(t => t.type === "INCOME");
    const expenses = transactions.filter(t => t.type === "EXPENSE");

    // Calcular totais
    const totalRevenue = revenues.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const grossProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Agrupar por categoria
    const revenueByCategory = this.groupByProperty(revenues, 'categoryId', 'category');
    const expensesByCategory = this.groupByProperty(expenses, 'categoryId', 'category');

    // Agrupar por carteira
    const revenueByWallet = this.groupByProperty(revenues, 'walletId', 'wallet');
    const expensesByWallet = this.groupByProperty(expenses, 'walletId', 'wallet');

    // Agrupar por centro de custo
    const revenueByCostCenter = this.groupByCostCenter(revenues, costCenterMap);
    const expensesByCostCenter = this.groupByCostCenter(expenses, costCenterMap);

    // Incluir previsões se solicitado
    if (includePredictions) {
      await this.addPredictionsToResult(
        userId,
        startDate,
        endDate,
        {
          revenue: totalRevenue,
          expense: totalExpenses
        }
      );
    }

    return {
      month: monthKey,
      monthLabel,
      revenue: {
        total: totalRevenue,
        byCategory: revenueByCategory,
        byWallet: revenueByWallet,
        byCostCenter: revenueByCostCenter
      },
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory,
        byWallet: expensesByWallet,
        byCostCenter: expensesByCostCenter
      },
      grossProfit,
      netProfit: grossProfit, // Considerando que não há outros ajustes
      margin
    };
  }

  /**
   * Gera uma comparação entre o DRE do mês atual e do mês anterior
   * @param userId ID do usuário
   * @param date Data de referência (mês atual)
   */
  static async generateDREComparison(
    userId: string,
    date: Date = new Date()
  ): Promise<DREComparison> {
    const previousMonthDate = subMonths(date, 1);
    
    // Gerar DRE para o mês atual e anterior
    const currentMonth = await this.generateMonthlyDRE(userId, date);
    const previousMonth = await this.generateMonthlyDRE(userId, previousMonthDate);

    // Calcular variações
    const changeRevenue = this.calculatePercentChange(
      previousMonth.revenue.total,
      currentMonth.revenue.total
    );
    
    const changeExpenses = this.calculatePercentChange(
      previousMonth.expenses.total,
      currentMonth.expenses.total
    );
    
    const changeProfit = this.calculatePercentChange(
      previousMonth.netProfit,
      currentMonth.netProfit
    );
    
    const changeMargin = currentMonth.margin - previousMonth.margin;

    return {
      currentMonth,
      previousMonth,
      changeRevenue,
      changeExpenses,
      changeProfit,
      changeMargin
    };
  }

  /**
   * Gera previsão de DRE para o próximo mês com base em tendências
   * @param userId ID do usuário
   */
  static async generateNextMonthDREForecast(userId: string): Promise<MonthlyDREResult> {
    const currentDate = new Date();
    const nextMonthDate = addMonths(currentDate, 1);
    
    // Obter DRE dos últimos 3 meses para análise de tendência
    const threeMonthsAgo = subMonths(currentDate, 3);
    const twoMonthsAgo = subMonths(currentDate, 2);
    const oneMonthAgo = subMonths(currentDate, 1);
    
    const month3 = await this.generateMonthlyDRE(userId, threeMonthsAgo);
    const month2 = await this.generateMonthlyDRE(userId, twoMonthsAgo);
    const month1 = await this.generateMonthlyDRE(userId, oneMonthAgo);
    const currentMonth = await this.generateMonthlyDRE(userId, currentDate);
    
    // Calcular tendências com pesos maiores para meses mais recentes
    const weightedRevenue = (
      month3.revenue.total * 0.1 +
      month2.revenue.total * 0.2 +
      month1.revenue.total * 0.3 +
      currentMonth.revenue.total * 0.4
    );
    
    const weightedExpenses = (
      month3.expenses.total * 0.1 +
      month2.expenses.total * 0.2 +
      month1.expenses.total * 0.3 +
      currentMonth.expenses.total * 0.4
    );
    
    // Incluir previsões do fluxo de caixa
    const startDate = startOfMonth(nextMonthDate);
    const endDate = endOfMonth(nextMonthDate);
    
    // Obter previsões de fluxo de caixa para o próximo mês
    const predictions = await prisma.cash_flow_entries.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Separar receitas e despesas previstas
    const predictedRevenue = predictions
      .filter(p => p.type === "INCOME")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const predictedExpenses = predictions
      .filter(p => p.type === "EXPENSE")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    // Criar preview mesclando tendências históricas e previsões específicas
    const totalRevenue = (weightedRevenue * 0.6) + (predictedRevenue * 0.4);
    const totalExpenses = (weightedExpenses * 0.6) + (predictedExpenses * 0.4);
    const grossProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    
    // Formatação para exibição
    const monthLabel = format(nextMonthDate, 'MMMM yyyy', { locale: ptBR }) + ' (Previsão)';
    const monthKey = format(nextMonthDate, 'yyyy-MM');
    
    return {
      month: monthKey,
      monthLabel,
      revenue: {
        total: totalRevenue,
        byCategory: [], // Previsão simplificada sem detalhamento por categoria
        byWallet: [],
        byCostCenter: []
      },
      expenses: {
        total: totalExpenses,
        byCategory: [],
        byWallet: [],
        byCostCenter: []
      },
      grossProfit,
      netProfit: grossProfit,
      margin
    };
  }

  /**
   * Gera um relatório de DRE anual com dados mensais
   * @param userId ID do usuário
   * @param year Ano de referência
   */
  static async generateAnnualDRE(
    userId: string,
    year: number = new Date().getFullYear()
  ): Promise<MonthlyDREResult[]> {
    const results: MonthlyDREResult[] = [];
    
    // Gerar DRE para cada mês do ano
    for (let month = 0; month < 12; month++) {
      const date = new Date(year, month, 1);
      const monthlyDRE = await this.generateMonthlyDRE(userId, date);
      results.push(monthlyDRE);
    }
    
    return results;
  }

  /**
   * Adiciona dados de previsões ao resultado do DRE
   * @private
   */
  private static async addPredictionsToResult(
    userId: string,
    startDate: Date,
    endDate: Date,
    current: { revenue: number; expense: number }
  ): Promise<void> {
    // Obter previsões de fluxo de caixa para o período
    const predictions = await prisma.cash_flow_entries.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Adicionar previsões aos totais atuais (não implementado completamente)
    // Esta é uma abordagem simplificada que precisaria ser refinada conforme os requisitos
  }

  /**
   * Obtém mapeamento de transações para centros de custo
   * @private
   */
  private static async getTransactionsCostCenters(
    userId: string,
    transactionIds: string[]
  ): Promise<Map<string, { id: string; name: string }[]>> {
    // Recuperar mapeamento para centros de custo das transações
    const costCenterMap = new Map<string, { id: string; name: string }[]>();
    
    // Buscar no banco de dados as relações entre transações e centros de custo
    // Aqui poderia haver uma tabela de junção ou metadados nas transações
    
    // Buscar centros de custo via metadata nas transações
    const transactionsWithCostCenter = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId
      },
      select: {
        id: true,
        metadata: true
      }
    });
    
    // Extrair IDs de centros de custo
    const costCenterIds = new Set<string>();
    transactionsWithCostCenter.forEach(tx => {
      if (tx.metadata && typeof tx.metadata === 'object' && 'costCenterId' in tx.metadata) {
        const costCenterId = (tx.metadata as any).costCenterId;
        if (costCenterId) {
          costCenterIds.add(costCenterId);
        }
      }
    });
    
    // Buscar detalhes dos centros de custo
    const costCenters = await prisma.costCenter.findMany({
      where: {
        id: { in: Array.from(costCenterIds) },
        userId
      },
      select: {
        id: true,
        name: true
      }
    });
    
    // Criar mapa para lookup rápido
    const costCenterLookup = new Map<string, { id: string; name: string }>();
    costCenters.forEach(cc => {
      costCenterLookup.set(cc.id, { id: cc.id, name: cc.name });
    });
    
    // Associar transações aos seus centros de custo
    transactionsWithCostCenter.forEach(tx => {
      if (tx.metadata && typeof tx.metadata === 'object' && 'costCenterId' in tx.metadata) {
        const costCenterId = (tx.metadata as any).costCenterId;
        if (costCenterId && costCenterLookup.has(costCenterId)) {
          costCenterMap.set(tx.id, [costCenterLookup.get(costCenterId)!]);
        }
      }
    });
    
    return costCenterMap;
  }

  /**
   * Agrupa transações por uma propriedade e calcula o total
   * @private
   */
  private static groupByProperty(
    transactions: any[],
    propertyId: string,
    propertyObject: string
  ): CategoryResult[] {
    const grouped = new Map<string, { id: string; name: string; amount: number }>();
    
    transactions.forEach(tx => {
      const id = tx[propertyId] || 'unknown';
      const name = tx[propertyObject]?.name || 'Não categorizado';
      const amount = Number(tx.amount);
      
      if (grouped.has(id)) {
        grouped.get(id)!.amount += amount;
      } else {
        grouped.set(id, { id, name, amount });
      }
    });
    
    return Array.from(grouped.values());
  }

  /**
   * Agrupa transações por centro de custo e calcula o total
   * @private
   */
  private static groupByCostCenter(
    transactions: any[],
    costCenterMap: Map<string, { id: string; name: string }[]>
  ): CategoryResult[] {
    const grouped = new Map<string, { id: string; name: string; amount: number }>();
    
    transactions.forEach(tx => {
      const amount = Number(tx.amount);
      const costCenters = costCenterMap.get(tx.id) || [];
      
      if (costCenters.length > 0) {
        // Distribuir o valor igualmente entre os centros de custo
        const amountPerCostCenter = amount / costCenters.length;
        
        costCenters.forEach(costCenter => {
          if (grouped.has(costCenter.id)) {
            grouped.get(costCenter.id)!.amount += amountPerCostCenter;
          } else {
            grouped.set(costCenter.id, { 
              id: costCenter.id, 
              name: costCenter.name, 
              amount: amountPerCostCenter 
            });
          }
        });
      } else {
        // Se não tiver centro de custo, adicionar como não categorizado
        const id = 'unknown';
        const name = 'Não categorizado';
        
        if (grouped.has(id)) {
          grouped.get(id)!.amount += amount;
        } else {
          grouped.set(id, { id, name, amount });
        }
      }
    });
    
    return Array.from(grouped.values());
  }

  /**
   * Calcula a variação percentual entre dois valores
   * @private
   */
  private static calculatePercentChange(
    oldValue: number,
    newValue: number
  ): number {
    if (oldValue === 0) {
      return newValue === 0 ? 0 : 100;
    }
    
    return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  }
} 