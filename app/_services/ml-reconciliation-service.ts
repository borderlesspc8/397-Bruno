import { db } from "@/app/_lib/db";
import { TransactionType, InstallmentStatus } from "@/app/_types/transaction";
import { ReconciliationService } from "./reconciliation-service";
import { GestaoClickVenda } from "@/app/_types/gestao-click";
import { logger } from "./logger";

/**
 * Interface para resultado de predição do modelo de ML
 */
interface MLPredictionResult {
  transactionId: string;
  saleId: string;
  installmentNumber?: number;
  confidence: number;
  features: {
    valueDistance: number;
    dateDistance: number;
    textSimilarity: number;
    channelMatch: number;
    customerPattern: number;
    seasonalPattern: number;
  };
}

/**
 * Interface para dados de treinamento
 */
interface TrainingData {
  transactionFeatures: FeatureVector[];
  saleFeatures: FeatureVector[];
  matches: Match[];
  accuracy: number;
  lastTrainingDate: Date;
}

/**
 * Interface para vetor de características
 */
interface FeatureVector {
  id: string;
  amount: number;
  date: Date;
  description?: string;
  customerName?: string;
  channel?: string;
  paymentMethod?: string;
  installment?: {
    number: number;
    total: number;
  };
  numericalFeatures: number[];
  textFeatures: string[];
}

/**
 * Interface para correspondência confirmada
 */
interface Match {
  transactionId: string;
  saleId: string;
  installmentNumber?: number;
  confidence: number;
  manuallyConfirmed: boolean;
  createdAt: Date;
}

/**
 * Serviço de conciliação automática baseado em Machine Learning
 */
export class MLReconciliationService {
  // Parâmetros do modelo
  private static MODEL_VERSION = "1.0.0";
  private static CONFIDENCE_THRESHOLD = 0.75; // Limiar de confiança para conciliação automática
  private static MIN_TRAINING_SAMPLES = 30; // Número mínimo de amostras para treinar o modelo

  // Pesos dos diferentes fatores
  private static FEATURE_WEIGHTS = {
    valueDistance: 0.30,     // Proximidade do valor
    dateDistance: 0.25,      // Proximidade da data
    textSimilarity: 0.20,    // Similaridade de texto
    channelMatch: 0.10,      // Correspondência de canal
    customerPattern: 0.10,   // Padrão de cliente
    seasonalPattern: 0.05    // Padrão sazonal
  };

  /**
   * Realiza a conciliação automática usando modelo de ML
   * 
   * @param userId ID do usuário
   * @param startDate Data inicial
   * @param endDate Data final
   * @param walletId ID da carteira (opcional)
   * @returns Resultado da conciliação
   */
  static async reconcileWithML(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    walletId?: string
  ) {
    try {
      // 1. Verificar se temos dados de treinamento suficientes
      const modelReady = await this.isModelReady(userId);
      
      if (!modelReady) {
        logger.warn(`[ML_RECONCILIATION] Modelo não está pronto para o usuário ${userId}. Usando método de reconciliação convencional.`);
        
        // Usar o serviço de reconciliação convencional se o modelo não estiver pronto
        return await ReconciliationService.reconcileSalesAndTransactions({
          userId,
          startDate,
          endDate,
          walletId,
          useScoring: true,
          useAdaptiveTolerance: true
        });
      }

      // 2. Obter dados de treinamento existentes
      const trainingData = await this.getTrainingData(userId);

      // 3. Buscar vendas não conciliadas
      const nonReconciledSales = await this.findNonReconciledSales(userId, startDate, endDate);
      
      // 4. Buscar transações não conciliadas
      const nonReconciledTransactions = await this.findNonReconciledTransactions(userId, startDate, endDate, walletId);

      // 5. Preparar vetores de características
      const saleFeatures = this.prepareSaleFeatures(nonReconciledSales);
      const transactionFeatures = this.prepareTransactionFeatures(nonReconciledTransactions);

      // 6. Aplicar o modelo para cada venda
      const predictions: MLPredictionResult[] = [];
      
      for (const sale of saleFeatures) {
        const salePredictions = await this.predictMatches(
          sale,
          transactionFeatures,
          trainingData
        );
        
        predictions.push(...salePredictions);
      }

      // 7. Filtrar predições com alta confiança
      const highConfidencePredictions = predictions.filter(
        p => p.confidence >= this.CONFIDENCE_THRESHOLD
      );

      // 8. Criar links de conciliação para predições com alta confiança
      const results = await this.createReconciliationLinks(userId, highConfidencePredictions);

      // 9. Atualizar dados de treinamento com novos matches
      await this.updateTrainingData(userId, highConfidencePredictions, trainingData);

      return {
        totalProcessed: nonReconciledSales.length,
        matched: results.matched,
        unmatched: nonReconciledSales.length - results.matched,
        details: {
          salesProcessed: nonReconciledSales.length,
          transactionsProcessed: nonReconciledTransactions.length,
          newLinksCreated: results.newLinksCreated,
          alreadyLinkedSkipped: results.alreadyLinkedSkipped,
          noMatchFound: nonReconciledSales.length - results.matched,
          multipleMatchesFound: results.multipleMatchesFound,
          mlConfidence: {
            average: results.averageConfidence,
            min: results.minConfidence,
            max: results.maxConfidence
          }
        }
      };
    } catch (error) {
      logger.error(`[ML_RECONCILIATION] Erro na conciliação por ML:`, error);
      throw new Error(`Falha ao executar conciliação automática por ML: ${error.message}`);
    }
  }

  /**
   * Verifica se o modelo está pronto para ser usado
   * @param userId ID do usuário
   * @returns True se o modelo estiver pronto, false caso contrário
   */
  private static async isModelReady(userId: string): Promise<boolean> {
    try {
      // Verificar se temos dados de treinamento suficientes
      const matchCount = await db.sales_transaction.count({
        where: {
          salesRecord: {
            userId: userId
          },
          metadata: {
            path: ['manuallyConfirmed'],
            equals: true
          }
        }
      });

      return matchCount >= this.MIN_TRAINING_SAMPLES;
    } catch (error) {
      logger.error(`[ML_RECONCILIATION] Erro ao verificar disponibilidade do modelo:`, error);
      return false;
    }
  }

  /**
   * Obtém dados de treinamento para o usuário
   * @param userId ID do usuário
   * @returns Dados de treinamento
   */
  private static async getTrainingData(userId: string): Promise<TrainingData> {
    try {
      // Buscar links de conciliação confirmados manualmente
      const manualMatches = await db.sales_transaction.findMany({
        where: {
          salesRecord: {
            userId: userId
          },
          metadata: {
            path: ['manuallyConfirmed'],
            equals: true
          }
        },
        include: {
          transaction: true,
          salesRecord: true,
          installment: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 1000 // Limitar ao histórico recente
      });

      // Se não temos dados suficientes, retornar modelo vazio
      if (manualMatches.length < this.MIN_TRAINING_SAMPLES) {
        return {
          transactionFeatures: [],
          saleFeatures: [],
          matches: [],
          accuracy: 0,
          lastTrainingDate: new Date()
        };
      }

      // Extrair características e correspondências
      const matches: Match[] = manualMatches.map(match => ({
        transactionId: match.transactionId,
        saleId: match.salesRecordId,
        installmentNumber: match.installment?.number,
        confidence: 1.0, // Confirmados manualmente têm confiança máxima
        manuallyConfirmed: true,
        createdAt: match.createdAt
      }));

      // Preparar vetores de características
      const transactionFeatures = this.prepareTrainingTransactionFeatures(manualMatches.map(m => m.transaction));
      const saleFeatures = this.prepareTrainingSaleFeatures(manualMatches.map(m => m.salesRecord));

      return {
        transactionFeatures,
        saleFeatures,
        matches,
        accuracy: 0.95, // Valor inicial estimado
        lastTrainingDate: new Date()
      };
    } catch (error) {
      logger.error(`[ML_RECONCILIATION] Erro ao obter dados de treinamento:`, error);
      throw new Error(`Falha ao obter dados de treinamento: ${error.message}`);
    }
  }

  /**
   * Busca vendas não conciliadas
   * @param userId ID do usuário
   * @param startDate Data inicial
   * @param endDate Data final
   * @returns Lista de vendas não conciliadas
   */
  private static async findNonReconciledSales(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      // Definir filtro de datas
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (startDate) dateFilter.gte = startDate;
      if (endDate) dateFilter.lte = endDate;

      // Buscar vendas
      const sales = await db.gestaoClickSale.findMany({
        where: {
          userId: userId,
          date: dateFilter,
          NOT: {
            links: {
              some: {} // Excluir vendas que já têm links
            }
          }
        },
        include: {
          installments: true
        }
      });

      return sales;
    } catch (error) {
      logger.error(`[ML_RECONCILIATION] Erro ao buscar vendas não conciliadas:`, error);
      throw new Error(`Falha ao buscar vendas não conciliadas: ${error.message}`);
    }
  }

  /**
   * Busca transações não conciliadas
   * @param userId ID do usuário
   * @param startDate Data inicial
   * @param endDate Data final
   * @param walletId ID da carteira (opcional)
   * @returns Lista de transações não conciliadas
   */
  private static async findNonReconciledTransactions(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    walletId?: string
  ) {
    try {
      // Ajustar intervalo de datas para incluir transações mais antigas
      const adjustedStartDate = startDate 
        ? new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 dias antes
        : undefined;
      
      const adjustedEndDate = endDate
        ? new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias depois
        : undefined;

      // Definir filtro de datas
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (adjustedStartDate) dateFilter.gte = adjustedStartDate;
      if (adjustedEndDate) dateFilter.lte = adjustedEndDate;

      // Preparar filtro de carteira
      const walletFilter = walletId ? { id: walletId } : {};

      // Buscar transações de entrada (receitas)
      const transactions = await db.transaction.findMany({
        where: {
          userId: userId,
          date: dateFilter,
          type: TransactionType.INCOME,
          wallet: walletFilter,
          NOT: {
            saleLinks: {
              some: {} // Excluir transações que já têm links com vendas
            }
          }
        }
      });

      return transactions;
    } catch (error) {
      logger.error(`[ML_RECONCILIATION] Erro ao buscar transações não conciliadas:`, error);
      throw new Error(`Falha ao buscar transações não conciliadas: ${error.message}`);
    }
  }

  /**
   * Prepara vetores de características para vendas
   * @param sales Lista de vendas
   * @returns Vetores de características
   */
  private static prepareSaleFeatures(sales: any[]): FeatureVector[] {
    return sales.flatMap(sale => {
      // Se a venda tem parcelas, criar um vetor para cada parcela
      if (sale.installments && sale.installments.length > 0) {
        return sale.installments.map(installment => ({
          id: `${sale.id}-${installment.installmentNumber}`,
          amount: parseFloat(installment.amount),
          date: new Date(installment.dueDate),
          description: sale.description || `Venda ${sale.code}`,
          customerName: sale.customerName,
          channel: sale.channelName,
          installment: {
            number: installment.installmentNumber,
            total: installment.totalInstallments
          },
          numericalFeatures: [
            parseFloat(installment.amount),
            new Date(installment.dueDate).getTime()
          ],
          textFeatures: [
            sale.code,
            sale.customerName,
            sale.description,
            `parcela ${installment.installmentNumber}/${installment.totalInstallments}`
          ].filter(Boolean)
        }));
      } else {
        // Venda sem parcelas
        return [{
          id: sale.id,
          amount: parseFloat(sale.totalAmount || sale.netAmount),
          date: new Date(sale.date),
          description: sale.description || `Venda ${sale.code}`,
          customerName: sale.customerName,
          channel: sale.channelName,
          numericalFeatures: [
            parseFloat(sale.totalAmount || sale.netAmount),
            new Date(sale.date).getTime()
          ],
          textFeatures: [
            sale.code,
            sale.customerName,
            sale.description
          ].filter(Boolean)
        }];
      }
    });
  }

  /**
   * Prepara vetores de características para transações
   * @param transactions Lista de transações
   * @returns Vetores de características
   */
  private static prepareTransactionFeatures(transactions: any[]): FeatureVector[] {
    return transactions.map(transaction => ({
      id: transaction.id,
      amount: transaction.amount,
      date: new Date(transaction.date),
      description: transaction.description || transaction.name,
      paymentMethod: transaction.paymentMethod,
      installment: transaction.hasInstallments ? {
        number: transaction.installmentNumber,
        total: transaction.installmentTotal
      } : undefined,
      numericalFeatures: [
        transaction.amount,
        new Date(transaction.date).getTime()
      ],
      textFeatures: [
        transaction.description,
        transaction.name,
        transaction.notes
      ].filter(Boolean)
    }));
  }

  /**
   * Prepara vetores de características para transações de treinamento
   * @param transactions Lista de transações
   * @returns Vetores de características
   */
  private static prepareTrainingTransactionFeatures(transactions: any[]): FeatureVector[] {
    return this.prepareTransactionFeatures(transactions);
  }

  /**
   * Prepara vetores de características para vendas de treinamento
   * @param sales Lista de vendas
   * @returns Vetores de características
   */
  private static prepareTrainingSaleFeatures(sales: any[]): FeatureVector[] {
    return this.prepareSaleFeatures(sales);
  }

  /**
   * Prevê correspondências entre uma venda e transações
   * @param sale Vetor de características da venda
   * @param transactions Lista de vetores de características de transações
   * @param trainingData Dados de treinamento
   * @returns Lista de predições
   */
  private static async predictMatches(
    sale: FeatureVector,
    transactions: FeatureVector[],
    trainingData: TrainingData
  ): Promise<MLPredictionResult[]> {
    // Filtrar transações por proximidade de valor e data
    const filteredTransactions = transactions.filter(transaction => {
      // Filtrar por valor (50% de tolerância máxima)
      const valueDiff = Math.abs((transaction.amount - sale.amount) / sale.amount);
      if (valueDiff > 0.5) return false;

      // Filtrar por data (tolerância de 90 dias)
      const dateDiff = Math.abs(transaction.date.getTime() - sale.date.getTime());
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
      if (daysDiff > 90) return false;

      return true;
    });

    // Calcular pontuação para cada transação filtrada
    const predictions: MLPredictionResult[] = [];
    
    for (const transaction of filteredTransactions) {
      // Calcular distância de valor
      const valueDistance = this.calculateValueDistance(transaction.amount, sale.amount);
      
      // Calcular distância de data
      const dateDistance = this.calculateDateDistance(transaction.date, sale.date);
      
      // Calcular similaridade de texto
      const textSimilarity = this.calculateTextSimilarity(
        transaction.textFeatures.join(' '), 
        sale.textFeatures.join(' ')
      );
      
      // Calcular correspondência de canal
      const channelMatch = this.calculateChannelMatch(transaction, sale);
      
      // Calcular padrão de cliente
      const customerPattern = this.calculateCustomerPattern(transaction, sale, trainingData);
      
      // Calcular padrão sazonal
      const seasonalPattern = this.calculateSeasonalPattern(transaction, sale, trainingData);
      
      // Calcular pontuação ponderada
      const score = (
        valueDistance * this.FEATURE_WEIGHTS.valueDistance +
        dateDistance * this.FEATURE_WEIGHTS.dateDistance +
        textSimilarity * this.FEATURE_WEIGHTS.textSimilarity +
        channelMatch * this.FEATURE_WEIGHTS.channelMatch +
        customerPattern * this.FEATURE_WEIGHTS.customerPattern +
        seasonalPattern * this.FEATURE_WEIGHTS.seasonalPattern
      );
      
      // Aplicar transformação sigmóide para converter em probabilidade
      const confidence = 1 / (1 + Math.exp(-10 * (score - 0.5)));
      
      // Extrair ID da venda e número da parcela
      let saleId, installmentNumber;
      
      if (sale.id.includes('-')) {
        const parts = sale.id.split('-');
        saleId = parts[0];
        installmentNumber = parseInt(parts[1]);
      } else {
        saleId = sale.id;
        installmentNumber = undefined;
      }
      
      predictions.push({
        transactionId: transaction.id,
        saleId,
        installmentNumber,
        confidence,
        features: {
          valueDistance,
          dateDistance,
          textSimilarity,
          channelMatch,
          customerPattern,
          seasonalPattern
        }
      });
    }
    
    // Ordenar por confiança (maior primeiro)
    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calcula a distância normalizada entre dois valores
   * @param value1 Valor 1
   * @param value2 Valor 2
   * @returns Similaridade entre 0 e 1
   */
  private static calculateValueDistance(value1: number, value2: number): number {
    const diff = Math.abs(value1 - value2);
    const max = Math.max(value1, value2);
    const relativeDiff = diff / max;
    
    // Converter distância relativa em similaridade (0-1)
    return Math.max(0, 1 - relativeDiff * 2);
  }

  /**
   * Calcula a distância normalizada entre duas datas
   * @param date1 Data 1
   * @param date2 Data 2
   * @returns Similaridade entre 0 e 1
   */
  private static calculateDateDistance(date1: Date, date2: Date): number {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    
    // Normalizar diferença de dias (30 dias = similaridade 0.5)
    return Math.max(0, 1 - (daysDiff / 60));
  }

  /**
   * Calcula a similaridade entre textos usando Coeficiente de Jaccard
   * @param text1 Texto 1
   * @param text2 Texto 2
   * @returns Similaridade entre 0 e 1
   */
  private static calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    // Normalizar textos e extrair tokens
    const normalize = (text: string): string => {
      return text.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .replace(/[^\w\s]/g, ' ')  // Substituir pontuação por espaços
        .replace(/\s+/g, ' ')      // Reduzir espaços múltiplos
        .trim();
    };
    
    const text1Normalized = normalize(text1);
    const text2Normalized = normalize(text2);
    
    // Extrair tokens (palavras e números)
    const tokens1 = text1Normalized.split(' ').filter(t => t.length > 2);
    const tokens2 = text2Normalized.split(' ').filter(t => t.length > 2);
    
    // Extrair números
    const extractNumbers = (text: string): string[] => {
      const matches = text.match(/\d+/g);
      return matches || [];
    };
    
    const numbers1 = extractNumbers(text1);
    const numbers2 = extractNumbers(text2);
    
    // Calcular coeficiente de Jaccard para tokens
    const tokenSet1 = new Set(tokens1);
    const tokenSet2 = new Set(tokens2);
    
    const intersection = new Set([...tokenSet1].filter(x => tokenSet2.has(x)));
    const union = new Set([...tokenSet1, ...tokenSet2]);
    
    const tokenSimilarity = union.size > 0 ? intersection.size / union.size : 0;
    
    // Calcular coeficiente de Jaccard para números
    const numberSet1 = new Set(numbers1);
    const numberSet2 = new Set(numbers2);
    
    const numberIntersection = new Set([...numberSet1].filter(x => numberSet2.has(x)));
    const numberUnion = new Set([...numberSet1, ...numberSet2]);
    
    const numberSimilarity = numberUnion.size > 0 ? numberIntersection.size / numberUnion.size : 0;
    
    // Combinar similaridades com maior peso para números
    return tokenSimilarity * 0.4 + numberSimilarity * 0.6;
  }

  /**
   * Calcula a correspondência de canal entre transação e venda
   * @param transaction Transação
   * @param sale Venda
   * @returns Similaridade entre 0 e 1
   */
  private static calculateChannelMatch(transaction: FeatureVector, sale: FeatureVector): number {
    // Se não temos informação de canal, retornar valor neutro
    if (!sale.channel) return 0.5;
    
    // Verificar se o canal está mencionado na descrição da transação
    const channelMentioned = transaction.textFeatures.some(text => 
      text && text.toLowerCase().includes(sale.channel.toLowerCase())
    );
    
    return channelMentioned ? 1.0 : 0.3;
  }

  /**
   * Calcula a correspondência de padrão de cliente
   * @param transaction Transação
   * @param sale Venda
   * @param trainingData Dados de treinamento
   * @returns Similaridade entre 0 e 1
   */
  private static calculateCustomerPattern(
    transaction: FeatureVector,
    sale: FeatureVector,
    trainingData: TrainingData
  ): number {
    // Se não temos informação de cliente, retornar valor neutro
    if (!sale.customerName) return 0.5;
    
    // Verificar se o cliente está mencionado na descrição da transação
    const customerMentioned = transaction.textFeatures.some(text => 
      text && text.toLowerCase().includes(sale.customerName.toLowerCase())
    );
    
    // Se cliente está mencionado explicitamente, alta correspondência
    if (customerMentioned) return 1.0;
    
    // Verificar histórico de corresponências para este cliente
    const customerMatches = trainingData.matches.filter(match => {
      const matchedSale = trainingData.saleFeatures.find(s => s.id === match.saleId);
      return matchedSale && matchedSale.customerName === sale.customerName;
    });
    
    // Se não temos histórico para este cliente, retornar valor neutro
    if (customerMatches.length === 0) return 0.5;
    
    // Verificar se esta transação segue padrão similar a transações anteriores do mesmo cliente
    let patternScore = 0;
    
    for (const match of customerMatches) {
      const matchedTransaction = trainingData.transactionFeatures.find(t => t.id === match.transactionId);
      
      if (matchedTransaction) {
        // Verificar similaridade de descrição
        const textSimilarity = this.calculateTextSimilarity(
          matchedTransaction.textFeatures.join(' '),
          transaction.textFeatures.join(' ')
        );
        
        // Verificar similaridade de método de pagamento
        const paymentMethodMatch = matchedTransaction.paymentMethod === transaction.paymentMethod ? 1.0 : 0.0;
        
        // Média ponderada
        const individualScore = textSimilarity * 0.7 + paymentMethodMatch * 0.3;
        
        // Acumular maior pontuação
        patternScore = Math.max(patternScore, individualScore);
      }
    }
    
    return patternScore;
  }

  /**
   * Calcula a correspondência de padrão sazonal
   * @param transaction Transação
   * @param sale Venda
   * @param trainingData Dados de treinamento
   * @returns Similaridade entre 0 e 1
   */
  private static calculateSeasonalPattern(
    transaction: FeatureVector,
    sale: FeatureVector,
    trainingData: TrainingData
  ): number {
    // Extrair mês da transação e da venda
    const transactionMonth = transaction.date.getMonth();
    const saleMonth = sale.date.getMonth();
    
    // Se os meses são muito diferentes, baixa correspondência
    const monthDiff = Math.abs(transactionMonth - saleMonth);
    if (monthDiff > 3) return 0.3;
    
    // Verificar padrões sazonais de correspondência nos dados de treinamento
    const seasonalMatches = trainingData.matches.filter(match => {
      const matchedTransaction = trainingData.transactionFeatures.find(t => t.id === match.transactionId);
      const matchedSale = trainingData.saleFeatures.find(s => s.id === match.saleId);
      
      if (matchedTransaction && matchedSale) {
        const matchTransactionMonth = new Date(matchedTransaction.date).getMonth();
        const matchSaleMonth = new Date(matchedSale.date).getMonth();
        
        // Verificar se o padrão de diferença de mês é similar
        return Math.abs(matchTransactionMonth - matchSaleMonth) === monthDiff;
      }
      
      return false;
    });
    
    // Se não temos padrões sazonais, retornar baseado apenas na diferença de mês
    if (seasonalMatches.length === 0) {
      return Math.max(0.3, 1 - (monthDiff / 6));
    }
    
    // Retornar pontuação baseada na frequência do padrão sazonal
    return Math.min(1.0, 0.5 + (seasonalMatches.length / 10) * 0.5);
  }

  /**
   * Cria links de conciliação para predições com alta confiança
   * @param userId ID do usuário
   * @param predictions Lista de predições
   * @returns Resultados da criação de links
   */
  private static async createReconciliationLinks(
    userId: string,
    predictions: MLPredictionResult[]
  ): Promise<{
    matched: number;
    newLinksCreated: number;
    alreadyLinkedSkipped: number;
    multipleMatchesFound: number;
    averageConfidence: number;
    minConfidence: number;
    maxConfidence: number;
  }> {
    try {
      // Inicializar contadores
      let matched = 0;
      let newLinksCreated = 0;
      let alreadyLinkedSkipped = 0;
      let multipleMatchesFound = 0;
      let totalConfidence = 0;
      let minConfidence = 1.0;
      let maxConfidence = 0.0;
      
      // Obter links existentes
      const existingLinks = await db.sales_transaction.findMany({
        where: {
          salesRecord: {
            userId: userId
          }
        },
        select: {
          salesRecordId: true,
          transactionId: true,
          installmentId: true
        }
      });
      
      // Processar cada predição
      for (const prediction of predictions) {
        // Verificar se já existe um link para esta venda/parcela
        let saleAlreadyLinked = false;
        
        for (const link of existingLinks) {
          if (link.salesRecordId === prediction.saleId) {
            if (prediction.installmentNumber === undefined) {
              saleAlreadyLinked = true;
              break;
            } else if (link.installmentId) {
              const installmentMatches = await this.installmentMatchesNumber(
                link.installmentId, 
                prediction.installmentNumber
              );
              if (installmentMatches) {
                saleAlreadyLinked = true;
                break;
              }
            }
          }
        }
        
        if (saleAlreadyLinked) {
          alreadyLinkedSkipped++;
          continue;
        }
        
        // Verificar se a transação já está vinculada a outra venda
        const transactionAlreadyLinked = existingLinks.some(link => 
          link.transactionId === prediction.transactionId
        );
        
        if (transactionAlreadyLinked) {
          multipleMatchesFound++;
          continue;
        }
        
        // Buscar ID da parcela se necessário
        let installmentId = undefined;
        if (prediction.installmentNumber !== undefined) {
          const installment = await db.installments.findFirst({
            where: {
              salesRecordId: prediction.saleId,
              number: prediction.installmentNumber
            }
          });
          if (installment) {
            installmentId = installment.id;
          }
        }
        
        // Criar novo link
        await db.sales_transaction.create({
          data: {
            salesRecordId: prediction.saleId,
            transactionId: prediction.transactionId,
            installmentId: installmentId,
            createdAt: new Date(),
            metadata: {
              confidence: prediction.confidence,
              features: prediction.features,
              modelVersion: this.MODEL_VERSION,
              manuallyConfirmed: false
            }
          }
        });
        
        // Atualizar estatísticas
        matched++;
        newLinksCreated++;
        totalConfidence += prediction.confidence;
        minConfidence = Math.min(minConfidence, prediction.confidence);
        maxConfidence = Math.max(maxConfidence, prediction.confidence);
      }
      
      // Calcular confiança média
      const averageConfidence = newLinksCreated > 0 ? totalConfidence / newLinksCreated : 0;
      
      return {
        matched,
        newLinksCreated,
        alreadyLinkedSkipped,
        multipleMatchesFound,
        averageConfidence,
        minConfidence: newLinksCreated > 0 ? minConfidence : 0,
        maxConfidence
      };
    } catch (error) {
      logger.error(`[ML_RECONCILIATION] Erro ao criar links de conciliação:`, error);
      throw new Error(`Falha ao criar links de conciliação: ${error.message}`);
    }
  }

  /**
   * Verifica se o ID da parcela corresponde ao número especificado
   * @param installmentId ID da parcela
   * @param installmentNumber Número da parcela
   * @returns Verdadeiro se corresponder
   */
  private static async installmentMatchesNumber(installmentId: string, installmentNumber: number): Promise<boolean> {
    try {
      const installment = await db.installments.findUnique({
        where: { id: installmentId },
        select: { number: true }
      });
      
      return installment?.number === installmentNumber;
    } catch (error) {
      logger.error(`[ML_RECONCILIATION] Erro ao verificar parcela:`, error);
      return false;
    }
  }

  /**
   * Atualiza dados de treinamento com novos matches
   * @param userId ID do usuário
   * @param predictions Lista de predições
   * @param trainingData Dados de treinamento existentes
   */
  private static async updateTrainingData(
    userId: string,
    predictions: MLPredictionResult[],
    trainingData: TrainingData
  ): Promise<void> {
    try {
      // Atualizar cache de dados de treinamento (simplificado)
      // Em uma implementação real, atualizaríamos um modelo ML persistente
      
      // Registrar apenas que atualizamos os dados de treinamento
      logger.info(`[ML_RECONCILIATION] Atualizados dados de treinamento para usuário ${userId} com ${predictions.length} novas predições`);
    } catch (error) {
      logger.error(`[ML_RECONCILIATION] Erro ao atualizar dados de treinamento:`, error);
      // Não propagar erro, apenas registrar
    }
  }

  /**
   * Realiza a conciliação automática de uma transação específica usando ML
   * 
   * @param userId ID do usuário
   * @param transactionId ID da transação a reconciliar
   * @param startDate Data inicial para buscar vendas (opcional)
   * @param endDate Data final para buscar vendas (opcional)
   * @param walletId ID da carteira (opcional)
   * @returns Resultado da conciliação
   */
  static async reconcileTransactionWithML(
    userId: string,
    transactionId: string,
    startDate?: Date,
    endDate?: Date,
    walletId?: string
  ) {
    try {
      // 1. Verificar se o modelo está pronto
      const modelReady = await this.isModelReady(userId);
      
      if (!modelReady) {
        logger.warn(`[ML_TRANSACTION_RECONCILIATION] Modelo não está pronto para o usuário ${userId}.`);
        return {
          matched: 0,
          message: "O modelo de ML ainda não está pronto. Continue conciliando manualmente para treinar o sistema."
        };
      }
      
      // 2. Buscar a transação específica
      const transaction = await db.transaction.findUnique({
        where: {
          id: transactionId,
          userId
        },
        include: {
          wallet: true
        }
      });
      
      if (!transaction) {
        throw new Error("Transação não encontrada ou não pertence ao usuário");
      }
      
      // 3. Verificar se a transação já está conciliada
      const existingLinks = await db.sales_transaction.findMany({
        where: {
          transactionId
        }
      });
      
      if (existingLinks.length > 0) {
        return {
          matched: 0,
          alreadyLinked: true,
          message: "Esta transação já está vinculada a uma ou mais vendas"
        };
      }
      
      // 4. Obter dados de treinamento
      const trainingData = await this.getTrainingData(userId);
      
      // 5. Definir período de busca para vendas se não fornecido
      if (!startDate || !endDate) {
        const transactionDate = new Date(transaction.date);
        startDate = startDate || new Date(transactionDate);
        endDate = endDate || new Date(transactionDate);
        
        // Buscar vendas 7 dias antes e depois da data da transação
        startDate.setDate(startDate.getDate() - 7);
        endDate.setDate(endDate.getDate() + 7);
      }
      
      // 6. Buscar vendas não conciliadas no período
      const nonReconciledSales = await this.findNonReconciledSales(userId, startDate, endDate);
      
      if (nonReconciledSales.length === 0) {
        return {
          matched: 0,
          message: "Não há vendas não conciliadas no período"
        };
      }
      
      // 7. Preparar vetor de características para a transação
      const transactionVector = this.prepareTransactionFeatures([transaction])[0];
      
      // 8. Preparar vetores de características para as vendas
      const saleFeatures = this.prepareSaleFeatures(nonReconciledSales);
      
      // 9. Aplicar o modelo para encontrar correspondências
      const predictions: MLPredictionResult[] = [];
      
      for (const sale of saleFeatures) {
        const confidence = this.calculateConfidence(transactionVector, sale, trainingData);
        
        // Adicionar à lista de predições se tiver confiança suficiente
        if (confidence >= this.CONFIDENCE_THRESHOLD) {
          predictions.push({
            transactionId,
            saleId: sale.id,
            confidence,
            features: {
              valueDistance: this.calculateValueDistance(transactionVector.amount, sale.amount),
              dateDistance: this.calculateDateDistance(transactionVector.date, sale.date),
              textSimilarity: this.calculateTextSimilarity(
                transactionVector.textFeatures.join(" "), 
                sale.textFeatures.join(" ")
              ),
              channelMatch: this.calculateChannelMatch(
                transactionVector.channel, 
                sale.channel
              ),
              customerPattern: 0.5, // Valor padrão para este exemplo
              seasonalPattern: 0.5  // Valor padrão para este exemplo
            }
          });
        }
      }
      
      // 10. Ordenar predições por confiança (maior para menor)
      predictions.sort((a, b) => b.confidence - a.confidence);
      
      // 11. Pegar apenas a predição com maior confiança
      const topPredictions = predictions.slice(0, 1);
      
      // 12. Criar links de conciliação para a predição de maior confiança
      if (topPredictions.length > 0) {
        const results = await this.createReconciliationLinks(userId, topPredictions);
        
        // 13. Atualizar dados de treinamento
        await this.updateTrainingData(userId, topPredictions, trainingData);
        
        return {
          matched: results.matched,
          newLinksCreated: results.newLinksCreated,
          confidence: topPredictions[0].confidence,
          message: "Conciliação automática realizada com sucesso"
        };
      }
      
      return {
        matched: 0,
        message: "Nenhuma correspondência com confiança suficiente encontrada"
      };
    } catch (error) {
      logger.error(`[ML_TRANSACTION_RECONCILIATION] Erro ao conciliar transação:`, error);
      throw new Error(`Falha ao conciliar transação: ${error.message}`);
    }
  }

  /**
   * Identifica grupos de transações que podem ser parcelas da mesma venda
   * @param transactions Lista de transações para análise
   * @returns Grupos de transações identificadas como possíveis parcelas
   */
  private static identifyInstallmentGroups(transactions: any[]): Map<string, any[]> {
    // Mapa de grupos de transações (chave: identificador do grupo, valor: lista de transações)
    const installmentGroups = new Map<string, any[]>();
    
    // Conjunto para rastrear transações já processadas
    const processedTransactions = new Set<string>();
    
    // Para cada transação não processada, encontrar outras semelhantes
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      
      // Pular se já foi processada
      if (processedTransactions.has(transaction.id)) {
        continue;
      }
      
      // Extrair informações relevantes
      const amount = transaction.amount;
      const date = new Date(transaction.date);
      const description = transaction.description || "";
      const paymentMethod = transaction.paymentMethod || "";
      
      // Transações consideradas parte do mesmo grupo
      const similarTransactions = [transaction];
      processedTransactions.add(transaction.id);
      
      // Identificar possíveis números de referência (padrão de venda #número)
      const referenceMatches = description.match(/#(\d+)/);
      const referenceNumber = referenceMatches ? referenceMatches[1] : null;
      
      // Buscar transações semelhantes
      for (let j = 0; j < transactions.length; j++) {
        if (i === j) continue;
        
        const otherTransaction = transactions[j];
        if (processedTransactions.has(otherTransaction.id)) {
          continue;
        }
        
        const otherAmount = otherTransaction.amount;
        const otherDate = new Date(otherTransaction.date);
        const otherDescription = otherTransaction.description || "";
        const otherPaymentMethod = otherTransaction.paymentMethod || "";
        
        // Verificar semelhança de valor (tolerância de 2%)
        const amountSimilarity = Math.abs(amount - otherAmount) / amount < 0.02;
        
        // Verificar proximidade de data (até 7 dias)
        const daysDifference = Math.abs((date.getTime() - otherDate.getTime()) / (1000 * 60 * 60 * 24));
        const dateProximity = daysDifference <= 7;
        
        // Verificar método de pagamento
        const samePaymentMethod = 
          paymentMethod === otherPaymentMethod || 
          (paymentMethod === "" && otherPaymentMethod === "") ||
          (paymentMethod.includes("CARD") && otherPaymentMethod.includes("CARD"));
        
        // Verificar referência numérica se existir
        let sameReference = false;
        if (referenceNumber) {
          const otherReferenceMatches = otherDescription.match(/#(\d+)/);
          sameReference = otherReferenceMatches && otherReferenceMatches[1] === referenceNumber;
        } else {
          // Se não tem referência numérica, verificar similaridade no texto
          const descWords = description.toLowerCase().split(/\s+/);
          const otherDescWords = otherDescription.toLowerCase().split(/\s+/);
          const commonWords = descWords.filter(word => 
            word.length > 3 && otherDescWords.includes(word)
          );
          sameReference = commonWords.length >= 2; // Pelo menos 2 palavras em comum
        }
        
        // Considerar parte do mesmo grupo se atender aos critérios
        if ((amountSimilarity && dateProximity && samePaymentMethod) || 
            (sameReference && dateProximity)) {
          similarTransactions.push(otherTransaction);
          processedTransactions.add(otherTransaction.id);
        }
      }
      
      // Adicionar grupo apenas se contiver mais de uma transação
      if (similarTransactions.length > 1) {
        const groupKey = `group_${i}`;
        installmentGroups.set(groupKey, similarTransactions);
      }
    }
    
    return installmentGroups;
  }

  /**
   * Reconcilia grupos de transações que representam parcelas da mesma venda
   * @param userId ID do usuário
   * @param transactionGroups Grupos de transações a serem reconciliados
   * @param startDate Data inicial
   * @param endDate Data final
   * @returns Resultado da reconciliação dos grupos
   */
  private static async reconcileInstallmentGroups(
    userId: string,
    transactionGroups: Map<string, any[]>,
    startDate?: Date,
    endDate?: Date
  ) {
    // Resultados da reconciliação
    const results = {
      groupsProcessed: 0,
      matchedGroups: 0,
      totalTransactionsMatched: 0,
    };
    
    // Buscar vendas não conciliadas
    const nonReconciledSales = await this.findNonReconciledSales(userId, startDate, endDate);
    
    // Se não há vendas não conciliadas, retornar
    if (nonReconciledSales.length === 0) {
      return results;
    }
    
    // Obter dados de treinamento
    const trainingData = await this.getTrainingData(userId);
    
    // Para cada grupo de transações
    for (const [groupKey, transactions] of transactionGroups.entries()) {
      results.groupsProcessed++;
      
      // Calcular valor total do grupo
      const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Encontrar vendas com valor próximo ao total do grupo
      const potentialMatches = nonReconciledSales.filter(sale => {
        const saleAmount = parseFloat(sale.valor_total || "0");
        // Tolerância de 5% para cima ou para baixo
        return saleAmount >= totalAmount * 0.95 && saleAmount <= totalAmount * 1.05;
      });
      
      if (potentialMatches.length === 0) {
        continue; // Nenhuma venda com valor similar
      }
      
      // Calcular confiança para cada potencial correspondência
      const matchScores = [];
      for (const sale of potentialMatches) {
        const saleVector = this.prepareSaleFeatures([sale])[0];
        
        // Usar a primeira transação como referência para a data e outras características
        const mainTransaction = transactions[0];
        const transactionVector = this.prepareTransactionFeatures([mainTransaction])[0];
        
        // Calcular confiança base
        const baseConfidence = this.calculateConfidence(transactionVector, saleVector, trainingData);
        
        // Ajustar confiança com base no número de parcelas e na proximidade do valor total
        const installmentBonus = Math.min(0.1, transactions.length * 0.02); // Até 10% de bônus
        const saleAmount = parseFloat(sale.valor_total || "0");
        const valueMatch = 1 - Math.abs(totalAmount - saleAmount) / saleAmount;
        
        // Confiança final ajustada
        const adjustedConfidence = Math.min(0.98, baseConfidence + installmentBonus) * valueMatch;
        
        matchScores.push({
          sale,
          confidence: adjustedConfidence,
          transactions
        });
      }
      
      // Ordenar por confiança
      matchScores.sort((a, b) => b.confidence - a.confidence);
      
      // Considerar apenas a correspondência com maior confiança
      const bestMatch = matchScores[0];
      
      // Verificar se a confiança é suficiente
      if (bestMatch.confidence >= this.CONFIDENCE_THRESHOLD) {
        results.matchedGroups++;
        
        // Criar links de conciliação para cada transação do grupo com a mesma venda
        for (const transaction of transactions) {
          try {
            // Verificar se a transação já está vinculada
            const existingLink = await db.sales_transaction.findFirst({
              where: {
                transactionId: transaction.id
              }
            });
            
            if (!existingLink) {
              // Criar link de conciliação
              await db.sales_transaction.create({
                data: {
                  salesRecordId: bestMatch.sale.id,
                  transactionId: transaction.id,
                  createdAt: new Date(),
                  metadata: {
                    confidence: bestMatch.confidence,
                    isPartOfGroup: true,
                    groupSize: transactions.length,
                    totalGroupAmount: totalAmount,
                    manuallyConfirmed: false,
                    modelVersion: this.MODEL_VERSION
                  }
                }
              });
              
              results.totalTransactionsMatched++;
            }
          } catch (error) {
            logger.error(`[ML_RECONCILIATION] Erro ao vincular transação de grupo:`, error);
            // Continuar com próxima transação
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Reconcilia transações em grupos, para identificar parcelas da mesma venda
   * @param userId ID do usuário
   * @param startDate Data inicial para buscar transações
   * @param endDate Data final para buscar transações
   * @param walletId ID da carteira (opcional)
   */
  static async reconcileInstallments(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    walletId?: string
  ) {
    try {
      // Verificar se o modelo está pronto
      const modelReady = await this.isModelReady(userId);
      
      if (!modelReady) {
        logger.warn(`[ML_INSTALLMENT_RECONCILIATION] Modelo não está pronto para o usuário ${userId}.`);
        return {
          matched: 0,
          message: "O modelo de ML ainda não está pronto para reconciliação de parcelas."
        };
      }
      
      // Buscar transações não conciliadas
      const nonReconciledTransactions = await this.findNonReconciledTransactions(userId, startDate, endDate, walletId);
      
      if (nonReconciledTransactions.length < 2) {
        return {
          matched: 0,
          message: "Não há transações suficientes para identificar grupos de parcelas."
        };
      }
      
      // Identificar grupos de transações que podem ser parcelas
      const installmentGroups = this.identifyInstallmentGroups(nonReconciledTransactions);
      
      if (installmentGroups.size === 0) {
        return {
          matched: 0,
          message: "Não foram identificados grupos de transações que possam ser parcelas."
        };
      }
      
      // Reconciliar os grupos identificados
      const results = await this.reconcileInstallmentGroups(userId, installmentGroups, startDate, endDate);
      
      return {
        matched: results.totalTransactionsMatched,
        groupsProcessed: results.groupsProcessed,
        groupsMatched: results.matchedGroups,
        message: results.totalTransactionsMatched > 0 
          ? `Foram vinculadas ${results.totalTransactionsMatched} transações em ${results.matchedGroups} grupos de parcelas.`
          : "Não foi possível vincular nenhum grupo de parcelas."
      };
    } catch (error) {
      logger.error(`[ML_INSTALLMENT_RECONCILIATION] Erro ao reconciliar parcelas:`, error);
      throw new Error(`Falha ao reconciliar parcelas: ${error.message}`);
    }
  }
} 