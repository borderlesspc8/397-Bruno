import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification-service';
import { Transaction } from '@prisma/client';

// Inicializa o cliente Prisma para uso no serviço
const db = new PrismaClient();

interface AnomalyDetectionParams {
  userId: string;
  transaction: Transaction;
  threshold?: number; // Percentual que determina uma anomalia (padrão: 50%)
  lookbackPeriod?: number; // Período em dias para analisar (padrão: 90 dias)
}

interface TransactionAnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number; // 0-100, quanto maior, mais anômala é a transação
  reason: string;
  basedOn: {
    averageAmount: number;
    count: number;
    stdDeviation: number;
    min: number;
    max: number;
  };
}

export class TransactionAnomalyService {
  /**
   * Detecta se uma transação é anômala com base no histórico do usuário
   */
  static async detectAnomaly({
    userId,
    transaction,
    threshold = 50,
    lookbackPeriod = 90,
  }: AnomalyDetectionParams): Promise<TransactionAnomalyResult> {
    try {
      // Calcular a data de início para análise
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookbackPeriod);

      // Buscar transações similares (mesma categoria) no período de análise
      const similarTransactions = await db.transaction.findMany({
        where: {
          userId,
          category: transaction.category,
          type: transaction.type,
          date: {
            gte: startDate,
            lt: transaction.date, // Apenas transações anteriores à atual
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      // Se não há transações similares, não podemos determinar se é anômala
      if (similarTransactions.length === 0) {
        return {
          isAnomaly: false,
          anomalyScore: 0,
          reason: 'Sem transações similares para comparação',
          basedOn: {
            averageAmount: 0,
            count: 0,
            stdDeviation: 0,
            min: 0,
            max: 0,
          },
        };
      }

      // Calcular estatísticas das transações similares
      const amounts = similarTransactions.map((t: Transaction) => Math.abs(t.amount));
      const averageAmount = this.calculateAverage(amounts);
      const stdDeviation = this.calculateStdDeviation(amounts, averageAmount);
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);

      // Calcular o quanto a transação atual se desvia da média
      const currentAmount = Math.abs(transaction.amount);
      const deviation = Math.abs(currentAmount - averageAmount);
      
      // Calcular um score de anomalia (0-100)
      let anomalyScore = 0;
      
      if (stdDeviation > 0) {
        // Número de desvios padrão da média
        const zScore = deviation / stdDeviation;
        
        // Converter para uma pontuação de 0-100
        // Usando uma função que escalona o z-score para um valor entre 0 e 100
        anomalyScore = Math.min(100, Math.round(zScore * 25));
      } else if (deviation > 0) {
        // Se não há variação nas transações passadas (desvio padrão = 0),
        // mas a transação atual é diferente, é uma anomalia significativa
        anomalyScore = 100;
      }

      // Determinar se é uma anomalia baseada no threshold
      const isAnomaly = anomalyScore >= threshold;

      // Gerar explicação
      let reason = '';
      if (isAnomaly) {
        if (currentAmount > averageAmount) {
          const percentHigher = Math.round((currentAmount / averageAmount - 1) * 100);
          reason = `Valor ${percentHigher}% maior que a média histórica para esta categoria`;
        } else {
          const percentLower = Math.round((1 - currentAmount / averageAmount) * 100);
          reason = `Valor ${percentLower}% menor que a média histórica para esta categoria`;
        }
      } else {
        reason = 'Transação dentro dos padrões normais';
      }

      return {
        isAnomaly,
        anomalyScore,
        reason,
        basedOn: {
          averageAmount,
          count: similarTransactions.length,
          stdDeviation,
          min,
          max,
        },
      };
    } catch (error) {
      console.error('Erro ao detectar anomalia:', error);
      return {
        isAnomaly: false,
        anomalyScore: 0,
        reason: `Erro ao avaliar anomalia: ${error}`,
        basedOn: {
          averageAmount: 0,
          count: 0,
          stdDeviation: 0,
          min: 0,
          max: 0,
        },
      };
    }
  }

  /**
   * Analisa uma transação e envia notificação se for anômala
   */
  static async analyzeAndNotify(transaction: Transaction): Promise<boolean> {
    try {
      const result = await this.detectAnomaly({
        userId: transaction.userId,
        transaction,
      });

      if (result.isAnomaly) {
        // Enviar notificação sobre a transação anômala
        await NotificationService.createNotification({
          userId: transaction.userId,
          title: 'Transação incomum detectada',
          message: `A transação "${transaction.name}" de ${this.formatCurrency(Math.abs(transaction.amount))} parece anômala. ${result.reason}.`,
          type: 'TRANSACTION',
          priority: result.anomalyScore >= 80 ? 'HIGH' : 'MEDIUM',
          link: `/transactions?highlight=${transaction.id}`,
          metadata: {
            transactionId: transaction.id,
            anomalyScore: result.anomalyScore,
            reason: result.reason,
            analysis: result.basedOn,
          },
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao analisar e notificar sobre transação:', error);
      return false;
    }
  }

  /**
   * Detecta anomalias em todas as transações recentes de um usuário
   */
  static async analyzeRecentTransactions(userId: string, days = 7): Promise<number> {
    try {
      // Data de início para análise
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar transações recentes
      const recentTransactions = await db.transaction.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      // Contador de anomalias detectadas
      let anomaliesDetected = 0;

      // Verificar cada transação
      for (const transaction of recentTransactions) {
        const result = await this.detectAnomaly({
          userId,
          transaction,
        });

        if (result.isAnomaly) {
          anomaliesDetected++;

          // Enviar notificação sobre a transação anômala
          await NotificationService.createNotification({
            userId,
            title: 'Transação incomum detectada',
            message: `A transação "${transaction.name}" de ${this.formatCurrency(Math.abs(transaction.amount))} parece anômala. ${result.reason}.`,
            type: 'TRANSACTION',
            priority: result.anomalyScore >= 80 ? 'HIGH' : 'MEDIUM',
            link: `/transactions?highlight=${transaction.id}`,
            metadata: {
              transactionId: transaction.id,
              anomalyScore: result.anomalyScore,
              reason: result.reason,
              analysis: result.basedOn,
            },
          });
        }
      }

      return anomaliesDetected;
    } catch (error) {
      console.error('Erro ao analisar transações recentes:', error);
      return 0;
    }
  }

  /**
   * Calcula a média de um array de números
   */
  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calcula o desvio padrão de um array de números
   */
  private static calculateStdDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = this.calculateAverage(squareDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Formata um valor como moeda (R$)
   */
  private static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
} 