import { db } from "@/app/_lib/db";
import { Prisma } from "@prisma/client";
import { prisma } from "@/app/_lib/prisma";
import { Transaction, TransactionType } from "@prisma/client";

interface ReconciliationParams {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  walletId?: string;
  tolerancePercentage?: number;
  toleranceDays?: number;
  useAdaptiveTolerance?: boolean;
  useScoring?: boolean;
}

interface ReconciliationResult {
  totalProcessed: number;
  matched: number;
  unmatched: number;
  details: {
    salesProcessed: number;
    transactionsProcessed: number;
    newLinksCreated: number;
    alreadyLinkedSkipped: number;
    noMatchFound: number;
    multipleMatchesFound: number;
  };
}

// Interface para o sistema de pontuação
interface TransactionScore {
  transactionId: string;
  score: number;
  factors: {
    valueProximity: number;
    dateProximity: number;
    channelMatch: number;
    customerRecurrence: number;
    historicalPatterns: number;
    textSimilarity: number;  // Adicionado: similaridade textual
    gestaoClickPattern: number; // Adicionado: reconhecimento de padrões do Gestão Click
    seasonalPattern: number;   // Adicionado: padrão sazonal
  };
}

// Categorias de tolerância adaptativa baseada no valor
enum ValueCategory {
  SMALL = 'small',  // até R$100
  MEDIUM = 'medium', // R$100-1000
  LARGE = 'large'   // acima de R$1000
}

interface ReconciliationGroup {
  transactions: Transaction[];
  totalAmount: number;
  installmentCount: number;
}

export class ReconciliationService {
  // Constantes para tolerância adaptativa
  private static SMALL_VALUE_THRESHOLD = 100;
  private static MEDIUM_VALUE_THRESHOLD = 1000;
  private static SMALL_VALUE_TOLERANCE = 15; // 15%
  private static MEDIUM_VALUE_TOLERANCE = 7;  // 7%
  private static LARGE_VALUE_TOLERANCE = 3;   // 3%
  
  // Pesos para o sistema de pontuação
  private static SCORE_WEIGHTS = {
    valueProximity: 0.25,      // Reduzido para 25% do peso - proximidade do valor
    dateProximity: 0.20,       // Reduzido para 20% do peso - proximidade da data
    channelMatch: 0.10,        // Reduzido para 10% do peso - correspondência de canal
    customerRecurrence: 0.10,  // Mantido em 10% do peso - recorrência do cliente
    historicalPatterns: 0.10,  // Mantido em 10% do peso - padrões históricos
    textSimilarity: 0.15,      // Adicionado: 15% do peso - similaridade de texto
    gestaoClickPattern: 0.05,  // Adicionado: 5% do peso - reconhecimento de padrões do Gestão Click
    seasonalPattern: 0.05      // Adicionado: 5% do peso - padrão sazonal
  };

  // Padrões conhecidos do Gestão Click
  private static GESTAO_CLICK_PATTERNS = [
    { regex: /venda\s+(?:n[º°]?|numero|número|cod)?\s*[:# ]?\s*(\d+)/i, importance: 1.0 },
    { regex: /pedido\s+(?:n[º°]?|numero|número|cod)?\s*[:# ]?\s*(\d+)/i, importance: 0.9 },
    { regex: /fatura\s+(?:n[º°]?|numero|número|cod)?\s*[:# ]?\s*(\d+)/i, importance: 0.8 },
    { regex: /cliente\s*[:# ]?\s*([^,\.]+)/i, importance: 0.7 },
    { regex: /parcela\s*(?:n[º°]?|numero|número)?\s*[:# ]?\s*(\d+)(?:\s*\/\s*(\d+))?/i, importance: 0.8 },
    { regex: /antecipa[çc][ãa]o/i, importance: 0.9 } // Novo padrão para antecipações
  ];

  /**
   * Realiza a conciliação automática entre vendas e transações de recebimento
   * 
   * @param params Parâmetros para a conciliação
   * @returns Resultado da conciliação
   */
  static async reconcileSalesAndTransactions(
    params: ReconciliationParams
  ): Promise<ReconciliationResult> {
    const { 
      userId, 
      startDate, 
      endDate, 
      walletId,
      tolerancePercentage = 5, // tolerância padrão de 5%
      toleranceDays = 5, // tolerância padrão de 5 dias
      useAdaptiveTolerance = true, // usar tolerância adaptativa por padrão
      useScoring = true // usar sistema de pontuação por padrão
    } = params;

    // Inicializar resultado
    const result: ReconciliationResult = {
      totalProcessed: 0,
      matched: 0,
      unmatched: 0,
      details: {
        salesProcessed: 0,
        transactionsProcessed: 0,
        newLinksCreated: 0,
        alreadyLinkedSkipped: 0,
        noMatchFound: 0,
        multipleMatchesFound: 0
      }
    };

    try {
      // 1. Buscar vendas não conciliadas
      const nonReconciledSales = await this.findNonReconciledSales(
        userId,
        startDate,
        endDate
      );

      result.details.salesProcessed = nonReconciledSales.length;

      // 2. Para cada venda, buscar e processar suas parcelas
      for (const sale of nonReconciledSales) {
        if (sale.installments && sale.installments.length > 0) {
          // Processar cada parcela individualmente
          for (const installment of sale.installments) {
            // Obter tolerância adaptativa baseada no valor da parcela
            const adaptiveTolerance = useAdaptiveTolerance 
              ? this.getAdaptiveTolerancePercentage(installment.amount)
              : tolerancePercentage;
            
            const matchResult = await this.reconcileInstallment(
              userId,
              sale.id,
              installment,
              walletId,
              adaptiveTolerance,
              toleranceDays,
              useScoring,
              sale // Passamos a venda completa para análise de canal e cliente
            );

            // Atualizar resultados
            if (matchResult.matched) {
              result.matched++;
              result.details.newLinksCreated++;
            } else {
              result.unmatched++;
              if (matchResult.alreadyLinked) {
                result.details.alreadyLinkedSkipped++;
              } else if (matchResult.multipleMatches) {
                result.details.multipleMatchesFound++;
              } else {
                result.details.noMatchFound++;
              }
            }
          }
        } else {
          // Venda sem parcelas - conciliar com o valor total
          // Obter tolerância adaptativa baseada no valor da venda
          const adaptiveTolerance = useAdaptiveTolerance 
            ? this.getAdaptiveTolerancePercentage(sale.totalAmount || sale.netAmount)
            : tolerancePercentage;
            
          const matchResult = await this.reconcileSingleSale(
            userId,
            sale,
            walletId,
            adaptiveTolerance, 
            toleranceDays,
            useScoring
          );

          // Atualizar resultados
          if (matchResult.matched) {
            result.matched++;
            result.details.newLinksCreated++;
          } else {
            result.unmatched++;
            if (matchResult.alreadyLinked) {
              result.details.alreadyLinkedSkipped++;
            } else if (matchResult.multipleMatches) {
              result.details.multipleMatchesFound++;
            } else {
              result.details.noMatchFound++;
            }
          }
        }
      }

      result.totalProcessed = result.matched + result.unmatched;
      result.details.transactionsProcessed = result.details.newLinksCreated + 
                                            result.details.alreadyLinkedSkipped +
                                            result.details.multipleMatchesFound;

      return result;

    } catch (error) {
      console.error("Erro ao executar conciliação automática:", error);
      throw new Error("Falha ao executar conciliação automática de vendas e transações");
    }
  }

  /**
   * Obtém a tolerância percentual adaptativa com base no valor da transação
   */
  private static getAdaptiveTolerancePercentage(amount: number): number {
    if (amount <= this.SMALL_VALUE_THRESHOLD) {
      return this.SMALL_VALUE_TOLERANCE;
    } else if (amount <= this.MEDIUM_VALUE_THRESHOLD) {
      return this.MEDIUM_VALUE_TOLERANCE;
    } else {
      return this.LARGE_VALUE_TOLERANCE;
    }
  }

  /**
   * Calcula a categoria de valor para uma transação
   */
  private static getValueCategory(amount: number): ValueCategory {
    if (amount <= this.SMALL_VALUE_THRESHOLD) {
      return ValueCategory.SMALL;
    } else if (amount <= this.MEDIUM_VALUE_THRESHOLD) {
      return ValueCategory.MEDIUM;
    } else {
      return ValueCategory.LARGE;
    }
  }

  /**
   * Busca vendas que ainda não foram conciliadas com transações
   */
  private static async findNonReconciledSales(
    userId: string,
    startDate?: Date, 
    endDate?: Date
  ) {
    // Definir intervalo de datas
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = startDate;
    }
    if (endDate) {
      dateFilter.lte = endDate;
    }

    // Consultar vendas e verificar quais ainda não têm transações associadas
    const sales = await db.sales_records.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
      },
      include: {
        installments: true,
        transactions: {
          select: {
            id: true,
            transactionId: true,
            installmentId: true
          }
        }
      }
    });

    // Filtrar as vendas que ainda não estão totalmente conciliadas
    return sales.filter(sale => {
      // Se a venda tem parcelas, verificar se todas estão conciliadas
      if (sale.installments && sale.installments.length > 0) {
        const installmentIds = new Set(sale.installments.map(i => i.id));
        const reconciledInstallmentIds = new Set(
          sale.transactions
            .filter(t => t.installmentId)
            .map(t => t.installmentId)
        );

        // Venda não conciliada se nem todas as parcelas estão associadas
        return installmentIds.size > reconciledInstallmentIds.size;
      } else {
        // Venda sem parcelas - verificar se tem pelo menos uma transação associada
        return sale.transactions.length === 0;
      }
    });
  }

  /**
   * Verifica se uma transação parece ser uma antecipação de recebível
   * @param transaction Transação a ser analisada
   * @returns true se a transação parece ser uma antecipação
   */
  private static isLikelyAnticipation(transaction: any): boolean {
    // Verificar texto na descrição ou nome que indique antecipação
    const textContent = (transaction.description || '') + ' ' + (transaction.name || '');
    const anticipationTerms = [
      'antecipação', 'antecipacao', 'adiantamento', 
      'recebível', 'recebivel', 'recebiveis', 'recebíveis',
      'antec.', 'adiant.', 'adto', 'ant.',
      'liquidação', 'liquidacao', 'liq.'
    ];
    
    const normalizedText = textContent.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    
    // Verificar se o texto contém termos de antecipação
    const hasAnticipationTerm = anticipationTerms.some(term => 
      normalizedText.includes(term.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    );
    
    // Verificar metadados que possam indicar antecipação
    const hasAnticipationMetadata = 
      transaction.metadata?.isAnticipation === true || 
      transaction.metadata?.type === 'ANTICIPATION' ||
      transaction.metadata?.source === 'ANTICIPATION';
    
    // Verificar se o valor é um pouco menor que o original (taxa de antecipação)
    // Isto é apenas um indício, não uma prova definitiva
    const hasDiscountedValue = 
      transaction.metadata?.originalAmount && 
      transaction.amount < transaction.metadata.originalAmount * 0.96; // 4% ou mais de desconto
    
    return hasAnticipationTerm || hasAnticipationMetadata || hasDiscountedValue;
  }

  /**
   * Analisa padrões específicos de antecipação com base em dados históricos
   * @param historicalMatches Conciliações históricas
   * @returns Dados de padrões de antecipação 
   */
  private static analyzeAnticipationPatterns(historicalMatches: any[]): any {
    // Analisar padrões de antecipação nos dados históricos
    const anticipationData = {
      sameMonthRate: 0, // Taxa de antecipações no mesmo mês
      averageDiscount: 0, // Desconto médio nas antecipações
      totalAnticipations: 0,
      totalDiscounts: 0
    };
    
    // Filtrar apenas correspondências que parecem ser antecipações
    const anticipationMatches = historicalMatches.filter(match => {
      if (!match.transaction || !match.salesRecord) return false;
      return this.isLikelyAnticipation(match.transaction);
    });
    
    if (anticipationMatches.length === 0) return anticipationData;
    
    // Calcular métricas
    anticipationData.totalAnticipations = anticipationMatches.length;
    
    // Calcular quantas antecipações ocorreram no mesmo mês da venda
    const sameMonthAnticipations = anticipationMatches.filter(match => {
      const transactionDate = new Date(match.transaction.date);
      const saleDate = new Date(match.salesRecord.date);
      
      return transactionDate.getMonth() === saleDate.getMonth() && 
             transactionDate.getFullYear() === saleDate.getFullYear();
    });
    
    anticipationData.sameMonthRate = 
      sameMonthAnticipations.length / anticipationData.totalAnticipations;
    
    // Calcular desconto médio nas antecipações (se houver dados disponíveis)
    const matchesWithDiscounts = anticipationMatches.filter(match => 
      match.salesRecord.netAmount && match.transaction.amount
    );
    
    if (matchesWithDiscounts.length > 0) {
      matchesWithDiscounts.forEach(match => {
        const saleAmount = Number(match.salesRecord.netAmount);
        const transactionAmount = Number(match.transaction.amount);
        
        if (transactionAmount < saleAmount) {
          const discountPercent = (saleAmount - transactionAmount) / saleAmount * 100;
          anticipationData.totalDiscounts += discountPercent;
        }
      });
      
      anticipationData.averageDiscount = 
        anticipationData.totalDiscounts / matchesWithDiscounts.length;
    }
    
    return anticipationData;
  }

  /**
   * Sistema de pontuação avançado para transações candidatas
   */
  private static async scoreTransactions(
    transactions: any[],
    target: {
      amount: number;
      date: Date;
      channel?: string;
      customerName?: string;
      code?: string;
      description?: string;
      source?: string;
    }
  ): Promise<TransactionScore[]> {
    // Obter dados históricos de conciliações anteriores para aprendizado
    const historicalMatches = await db.sales_transaction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // últimos 180 dias para uma análise sazonal melhor
        }
      },
      include: {
        transaction: true,
        salesRecord: true
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 200 // Aumentado para mais dados históricos
    });

    // Análise sazonal - organizar dados por mês do ano
    const seasonalPatterns = this.analyzeSeasonalPatterns(historicalMatches);
    
    // Analisar padrões de antecipação
    const anticipationPatterns = this.analyzeAnticipationPatterns(historicalMatches);

    // Identificar transações que são prováveis antecipações
    const anticipationTransactions = transactions.filter(t => this.isLikelyAnticipation(t));
    const hasAnticipationTransactions = anticipationTransactions.length > 0;

    // Pontuação para cada transação
    return Promise.all(transactions.map(async (transaction) => {
      const score: TransactionScore = {
        transactionId: transaction.id,
        score: 0,
        factors: {
          valueProximity: 0,
          dateProximity: 0,
          channelMatch: 0,
          customerRecurrence: 0,
          historicalPatterns: 0,
          textSimilarity: 0,
          gestaoClickPattern: 0,
          seasonalPattern: 0
        }
      };

      // Verificar se esta transação parece ser uma antecipação
      const isAnticipation = this.isLikelyAnticipation(transaction);
      
      // 1. Proximidade de valor (0-100)
      // Para antecipações, considerar que pode haver uma taxa de desconto
      if (isAnticipation) {
        // Usar uma tolerância maior para antecipações pois pode haver taxa
        const anticipationDiscount = anticipationPatterns.averageDiscount > 0 
          ? anticipationPatterns.averageDiscount 
          : 5; // 5% padrão se não tivermos dados
          
        // Se o valor da transação é menor que o valor alvo (como esperado em antecipações)
        // e está dentro da faixa de desconto típica, dar uma pontuação alta
        if (transaction.amount < target.amount) {
          const discountPercent = (target.amount - transaction.amount) / target.amount * 100;
          const discountProximity = Math.abs(discountPercent - anticipationDiscount);
          
          // Se o desconto está próximo da média histórica ou dentro de uma faixa razoável (1-15%)
          if (discountProximity < 5 || (discountPercent >= 1 && discountPercent <= 15)) {
            score.factors.valueProximity = 95; // Alta pontuação para antecipações com desconto típico
          } else {
            // Desconto atípico, mas ainda pode ser uma antecipação
            score.factors.valueProximity = Math.max(0, 100 - discountProximity * 2);
          }
        } else {
          // Antecipações normalmente têm valor menor, não maior
          const valueDifference = Math.abs(transaction.amount - target.amount);
          const valuePercentageDiff = (valueDifference / target.amount) * 100;
          score.factors.valueProximity = Math.max(0, 100 - valuePercentageDiff * 10);
        }
      } else {
        // Cálculo normal para transações regulares
        const valueDifference = Math.abs(transaction.amount - target.amount);
        const valuePercentageDiff = (valueDifference / target.amount) * 100;
        score.factors.valueProximity = Math.max(0, 100 - valuePercentageDiff * 10);
      }

      // 2. Proximidade de data (0-100)
      const dateDifferenceMs = Math.abs(transaction.date.getTime() - target.date.getTime());
      const dateDifferenceDays = dateDifferenceMs / (1000 * 60 * 60 * 24);
      
      // Para antecipações no mesmo mês, ser mais tolerante com a diferença de data
      if (isAnticipation && 
          transaction.date.getMonth() === target.date.getMonth() && 
          transaction.date.getFullYear() === target.date.getFullYear()) {
          
        // Antecipações no mesmo mês têm alta pontuação mesmo com diferença de alguns dias
        const sameMonthBonus = anticipationPatterns.sameMonthRate > 0.5 ? 50 : 30;
        score.factors.dateProximity = Math.max(0, 100 - dateDifferenceDays * 10) + sameMonthBonus;
        score.factors.dateProximity = Math.min(100, score.factors.dateProximity); // Limitar a 100
      } else {
        // Cálculo normal para outros casos
        score.factors.dateProximity = Math.max(0, 100 - dateDifferenceDays * 20);
      }

      // 3. Correspondência de canal (0/100)
      if (target.channel && transaction.metadata?.source) {
        // Map common channels between sales and transactions
        const channelMap: Record<string, string[]> = {
          'GESTAO_CLICK': ['GESTAO_CLICK', 'API'],
          'Whatsapp': ['MOBILE', 'PIX', 'TRANSFER', 'APP'],
          'Presencial': ['CARD', 'CREDIT_CARD', 'DEBIT_CARD', 'POS', 'CASH'],
          'Instagram': ['MOBILE', 'PIX', 'TRANSFER', 'APP', 'SOCIAL'],
          'Facebook': ['MOBILE', 'PIX', 'TRANSFER', 'APP', 'SOCIAL'],
          'Google': ['MOBILE', 'PIX', 'TRANSFER', 'ONLINE', 'WEB'],
          'Tráfego': ['MOBILE', 'PIX', 'TRANSFER', 'ONLINE', 'WEB', 'AD'],
          'Site': ['ONLINE', 'WEB', 'PIX', 'CREDIT_CARD']
        };

        // Check if transaction source matches typical sources for sale channel
        const matchingSourcesForChannel = channelMap[target.channel] || [];
        if (matchingSourcesForChannel.includes(transaction.metadata.source)) {
          score.factors.channelMatch = 100;
        } else {
          score.factors.channelMatch = 0;
        }
      } else {
        score.factors.channelMatch = 50; // Neutro quando não temos informação
      }

      // 4. Recorrência do cliente (0-100)
      if (target.customerName) {
        // Buscar transações anteriores com metadados que mencionem este cliente
        const previousCustomerTransactions = await db.transaction.findMany({
          where: {
            OR: [
              {
                description: {
                  contains: target.customerName,
                  mode: "insensitive"
                }
              },
              {
                name: {
                  contains: target.customerName,
                  mode: "insensitive"
                }
              },
              {
                metadata: {
                  path: ['customerName'],
                  string_contains: target.customerName
                }
              }
            ]
          },
          take: 5
        });

        score.factors.customerRecurrence = Math.min(100, previousCustomerTransactions.length * 20);
      } else {
        score.factors.customerRecurrence = 0;
      }

      // 5. Padrões históricos (0-100)
      // Analisar associações anteriores para encontrar padrões semelhantes
      if (historicalMatches.length > 0) {
        // Contar correspondências com valores similares
        const similarValueMatches = historicalMatches.filter(match => {
          if (!match.transaction?.amount || !match.salesRecord?.netAmount) {
            return false;
          }
          const matchValueDiff = Math.abs(
            (Number(match.transaction.amount) - Number(match.salesRecord.netAmount)) / 
            Number(match.salesRecord.netAmount)
          );
          const currentValueDiff = Math.abs(
            (Number(transaction.amount) - Number(target.amount)) / Number(target.amount)
          );
          return Math.abs(matchValueDiff - currentValueDiff) < 0.02; // diferença de 2% na diferença
        });

        // Contar correspondências com atrasos de data similares
        const similarDateMatches = historicalMatches.filter(match => {
          if (!match.transaction?.date || !match.salesRecord?.date) {
            return false;
          }
          const matchDateDiff = Math.abs(
            (new Date(match.transaction.date).getTime() - new Date(match.salesRecord.date).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          const currentDateDiff = Math.abs(
            (transaction.date.getTime() - target.date.getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          return Math.abs(matchDateDiff - currentDateDiff) < 1; // diferença de 1 dia no atraso
        });

        // Peso para padrões históricos com base em similaridades
        score.factors.historicalPatterns = Math.min(
          100, 
          (similarValueMatches.length * 10) + (similarDateMatches.length * 10)
        );
      } else {
        score.factors.historicalPatterns = 0;
      }

      // 6. Similaridade de texto (0-100) - NOVA FUNCIONALIDADE
      if (target.description && (transaction.description || transaction.name)) {
        // Calcular similaridade entre descrições de texto
        score.factors.textSimilarity = this.calculateTextSimilarity(
          target.description,
          transaction.description || transaction.name
        );
      } else if (target.customerName && (transaction.description || transaction.name)) {
        // Se não temos descrição, usar nome do cliente como fallback
        score.factors.textSimilarity = this.calculateTextSimilarity(
          target.customerName,
          transaction.description || transaction.name
        );
      } else {
        score.factors.textSimilarity = 0;
      }

      // 7. Reconhecimento de padrões do Gestão Click (0-100) - NOVA FUNCIONALIDADE
      if (target.source === 'GESTAO_CLICK' && (transaction.description || transaction.name) && target.code) {
        // Verificar se a descrição da transação contém referências a códigos do Gestão Click
        score.factors.gestaoClickPattern = this.detectGestaoClickPatterns(
          transaction.description || transaction.name,
          target.code,
          target.customerName
        );
      } else {
        score.factors.gestaoClickPattern = 0;
      }

      // 8. Análise de padrões sazonais (0-100) - NOVA FUNCIONALIDADE
      if (seasonalPatterns && seasonalPatterns.length > 0) {
        // Obtém o mês da data da transação
        const transactionMonth = transaction.date.getMonth();
        // Obtém o mês da data da venda
        const targetMonth = target.date.getMonth();
        
        // Verifica padrões sazonais para estes meses
        score.factors.seasonalPattern = this.evaluateSeasonalMatch(
          transactionMonth,
          targetMonth,
          seasonalPatterns,
          target.amount
        );
      } else {
        score.factors.seasonalPattern = 50; // Valor neutro sem dados sazonais
      }

      // Calcular pontuação final ponderada pelos pesos
      score.score = 
        (score.factors.valueProximity * this.SCORE_WEIGHTS.valueProximity) +
        (score.factors.dateProximity * this.SCORE_WEIGHTS.dateProximity) +
        (score.factors.channelMatch * this.SCORE_WEIGHTS.channelMatch) +
        (score.factors.customerRecurrence * this.SCORE_WEIGHTS.customerRecurrence) +
        (score.factors.historicalPatterns * this.SCORE_WEIGHTS.historicalPatterns) +
        (score.factors.textSimilarity * this.SCORE_WEIGHTS.textSimilarity) +
        (score.factors.gestaoClickPattern * this.SCORE_WEIGHTS.gestaoClickPattern) +
        (score.factors.seasonalPattern * this.SCORE_WEIGHTS.seasonalPattern);
      
      // Bônus para antecipações quando temos transações de antecipação e esta é uma delas
      if (hasAnticipationTransactions && isAnticipation) {
        score.score += 15; // Bônus significativo para priorizar antecipações entre si
      }
      
      // Adicionar metadados sobre a antecipação para uso posterior
      if (isAnticipation) {
        (score as any).isAnticipation = true;
        (score as any).anticipationDetails = {
          discountPercent: transaction.amount < target.amount
            ? ((target.amount - transaction.amount) / target.amount * 100).toFixed(2) + '%'
            : '0%',
          sameMonth: transaction.date.getMonth() === target.date.getMonth()
        };
      }

      return score;
    }));
  }

  /**
   * Calcula a similaridade textual entre duas strings
   * @param text1 Primeiro texto
   * @param text2 Segundo texto
   * @returns Pontuação de similaridade de 0 a 100
   */
  private static calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    // Normalizar textos (remover acentos, converter para minúsculas, remover caracteres especiais)
    const normalize = (text: string): string => {
      return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, "")
        .trim();
    };

    const normalizedText1 = normalize(text1);
    const normalizedText2 = normalize(text2);

    // 1. Verificar se um texto contém o outro completamente
    if (normalizedText1.includes(normalizedText2) || normalizedText2.includes(normalizedText1)) {
      return 100;
    }

    // 2. Extrair e comparar palavras-chave importantes
    const extractKeywords = (text: string): string[] => {
      // Remove palavras comuns
      const stopWords = ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'ao', 'ele', 'das', 'seu', 'sua', 'ou', 'quando', 'muito', 'nos', 'já', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'você', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'numa', 'pelos', 'elas', 'qual', 'nós', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas', 'esta', 'estes', 'estas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'aquilo', 'estou', 'está', 'estamos', 'estão', 'estive', 'esteve', 'estivemos', 'estiveram', 'estava', 'estávamos', 'estavam', 'estivera', 'estivéramos', 'esteja', 'estejamos', 'estejam', 'estivesse', 'estivéssemos', 'estivessem', 'estiver', 'estivermos', 'estiverem'];
      
      return text
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.includes(word));
    };

    const keywords1 = extractKeywords(normalizedText1);
    const keywords2 = extractKeywords(normalizedText2);

    // Contar palavras-chave em comum
    let matchingKeywords = 0;
    for (const keyword of keywords1) {
      if (keywords2.includes(keyword)) {
        matchingKeywords++;
      }
    }

    // Calcular pontuação de palavras-chave
    const totalUniqueKeywords = new Set([...keywords1, ...keywords2]).size;
    const keywordScore = totalUniqueKeywords === 0 ? 0 : (matchingKeywords / totalUniqueKeywords) * 100;

    // 3. Verificar números em comum (códigos, referências, etc.)
    const extractNumbers = (text: string): string[] => {
      const matches = text.match(/\d+/g);
      return matches ? matches : [];
    };

    const numbers1 = extractNumbers(text1);
    const numbers2 = extractNumbers(text2);

    let matchingNumbers = 0;
    for (const num of numbers1) {
      if (numbers2.includes(num)) {
        matchingNumbers++;
      }
    }

    // Calcular pontuação de números
    const totalUniqueNumbers = new Set([...numbers1, ...numbers2]).size;
    const numberScore = totalUniqueNumbers === 0 ? 0 : (matchingNumbers / totalUniqueNumbers) * 100;

    // Calcular pontuação final composta (prioriza a correspondência de números)
    return Math.min(100, numberScore * 0.7 + keywordScore * 0.3);
  }

  /**
   * Detecta padrões de nomenclatura do Gestão Click em uma string
   * @param text Texto a ser analisado
   * @param saleCode Código da venda para comparação
   * @param customerName Nome do cliente para comparação
   * @returns Pontuação de 0 a 100
   */
  private static detectGestaoClickPatterns(text: string, saleCode: string, customerName?: string): number {
    if (!text) return 0;

    let totalScore = 0;
    let maxPossibleScore = 0;

    // Verificar padrões específicos do Gestão Click
    for (const pattern of this.GESTAO_CLICK_PATTERNS) {
      const match = text.match(pattern.regex);
      if (match) {
        // Se o padrão for para código/número e tivermos um código de venda para comparar
        if (match[1] && saleCode && (pattern.regex.toString().includes('venda') || 
                                     pattern.regex.toString().includes('pedido') || 
                                     pattern.regex.toString().includes('fatura'))) {
          // Verifica se o código extraído corresponde ao código da venda
          if (match[1] === saleCode || saleCode.includes(match[1]) || match[1].includes(saleCode)) {
            totalScore += 100 * pattern.importance;
          } else {
            totalScore += 30 * pattern.importance; // Pontuação menor para ter o padrão mas não o valor correto
          }
        } 
        // Se o padrão for para cliente e tivermos um nome de cliente para comparar
        else if (match[1] && customerName && pattern.regex.toString().includes('cliente')) {
          const normalizedExtracted = match[1].toLowerCase().trim();
          const normalizedCustomer = customerName.toLowerCase().trim();
          
          if (normalizedExtracted === normalizedCustomer || 
              normalizedCustomer.includes(normalizedExtracted) || 
              normalizedExtracted.includes(normalizedCustomer)) {
            totalScore += 100 * pattern.importance;
          } else {
            totalScore += 30 * pattern.importance;
          }
        }
        // Pontuação para outros padrões reconhecidos
        else {
          totalScore += 50 * pattern.importance;
        }
        
        maxPossibleScore += 100 * pattern.importance;
      } else {
        maxPossibleScore += 100 * pattern.importance;
      }
    }

    // Normalizar pontuação para a escala 0-100
    return maxPossibleScore === 0 ? 0 : Math.min(100, (totalScore / maxPossibleScore) * 100);
  }

  /**
   * Analisa padrões sazonais com base em dados históricos
   * @param historicalMatches Conciliações históricas
   * @returns Dados de padrões sazonais
   */
  private static analyzeSeasonalPatterns(historicalMatches: any[]): any[] {
    // Organizar dados por mês
    const monthlyData: any[] = Array(12).fill(0).map(() => ({
      transactionCount: 0,
      salesCount: 0,
      averageDelay: 0, // Atraso médio entre venda e transação
      totalDelays: 0,
      valueRanges: {
        small: { count: 0, matchRate: 0 },
        medium: { count: 0, matchRate: 0 },
        large: { count: 0, matchRate: 0 }
      }
    }));

    // Processar histórico
    for (const match of historicalMatches) {
      if (!match.transaction?.date || !match.salesRecord?.date) continue;
      
      const transactionDate = new Date(match.transaction.date);
      const saleDate = new Date(match.salesRecord.date);
      const month = saleDate.getMonth();
      
      // Calcular atraso entre venda e transação em dias
      const delayDays = Math.round((transactionDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Atualizar dados mensais
      monthlyData[month].salesCount++;
      monthlyData[month].transactionCount++;
      monthlyData[month].totalDelays += delayDays;
      
      // Categorizar por valor
      const amount = Number(match.salesRecord.netAmount || match.salesRecord.totalAmount);
      let category;
      if (amount <= this.SMALL_VALUE_THRESHOLD) {
        category = 'small';
      } else if (amount <= this.MEDIUM_VALUE_THRESHOLD) {
        category = 'medium';
      } else {
        category = 'large';
      }
      
      monthlyData[month].valueRanges[category].count++;
    }
    
    // Calcular médias e taxas para cada mês
    for (let i = 0; i < 12; i++) {
      const data = monthlyData[i];
      
      // Calcular atraso médio
      if (data.salesCount > 0) {
        data.averageDelay = data.totalDelays / data.salesCount;
      }
      
      // Calcular taxas de correspondência por categoria de valor
      const totalSales = data.salesCount || 1; // Evitar divisão por zero
      Object.keys(data.valueRanges).forEach(category => {
        data.valueRanges[category].matchRate = data.valueRanges[category].count / totalSales;
      });
    }
    
    return monthlyData;
  }

  /**
   * Avalia a correspondência sazonal entre transação e venda
   * @param transactionMonth Mês da transação
   * @param targetMonth Mês da venda
   * @param seasonalPatterns Dados de padrões sazonais
   * @param amount Valor da transação
   * @returns Pontuação de 0 a 100
   */
  private static evaluateSeasonalMatch(
    transactionMonth: number,
    targetMonth: number,
    seasonalPatterns: any[],
    amount: number
  ): number {
    // Se os meses são iguais, há uma forte correlação sazonal
    if (transactionMonth === targetMonth) {
      return 100;
    }
    
    // Obter categoria de valor
    let category;
    if (amount <= this.SMALL_VALUE_THRESHOLD) {
      category = 'small';
    } else if (amount <= this.MEDIUM_VALUE_THRESHOLD) {
      category = 'medium';
    } else {
      category = 'large';
    }
    
    // Verificar se há um padrão de atraso entre a venda e a transação
    const targetMonthData = seasonalPatterns[targetMonth];
    if (!targetMonthData || targetMonthData.salesCount === 0) {
      return 50; // Sem dados suficientes, valor neutro
    }
    
    // Calcular a diferença de meses (considerando a transição de ano)
    let monthDiff = transactionMonth - targetMonth;
    if (monthDiff < 0) monthDiff += 12;
    
    // Verificar se este atraso é consistente com o padrão histórico
    const historicalDelay = Math.round(targetMonthData.averageDelay / 30); // Converter dias para meses aproximados
    const delayMatch = Math.max(0, 100 - Math.abs(monthDiff - historicalDelay) * 25);
    
    // Verificar se esta categoria de valor tem alta taxa de correspondência neste mês
    const categoryMatchRate = targetMonthData.valueRanges[category].matchRate * 100;
    
    // Combinar os fatores para pontuação final
    return Math.min(100, (delayMatch * 0.7) + (categoryMatchRate * 0.3));
  }

  /**
   * Detecta potenciais duplicatas para evitar conciliações incorretas
   * @param transactions Lista de transações candidatas
   * @param existingLinks Links existentes no sistema
   * @returns Transações filtradas sem duplicatas potenciais
   */
  private static filterPotentialDuplicates(transactions: any[], existingLinks: any[]): any[] {
    if (!transactions.length || !existingLinks.length) return transactions;
    
    // Filtrar transações que parecem ser duplicatas de outras já conciliadas
    return transactions.filter(transaction => {
      // Verificar cada link existente
      for (const link of existingLinks) {
        if (!link.transaction) continue;
        
        // Verificar se as propriedades principais são muito similares
        const sameDay = transaction.date.toDateString() === new Date(link.transaction.date).toDateString();
        const similarAmount = Math.abs(transaction.amount - link.transaction.amount) / link.transaction.amount < 0.01; // 1% de diferença
        const sameWallet = transaction.walletId === link.transaction.walletId;
        
        // Verificar similaridade nas descrições
        const textSimilarity = this.calculateTextSimilarity(
          transaction.description || transaction.name || '',
          link.transaction.description || link.transaction.name || ''
        );
        
        // Se muitos fatores coincidem, provavelmente é uma duplicata
        if (sameDay && similarAmount && sameWallet && textSimilarity > 70) {
          return false; // Filtrar esta transação como provável duplicata
        }
      }
      
      return true; // Manter a transação se não parece ser duplicata
    });
  }

  /**
   * Buscar links de vendas existentes para checagem de duplicatas
   */
  private static async getExistingTransactionLinks(userId: string) {
    // Consultar links existentes
    return await db.sales_transaction.findMany({
      where: {}, // Não filtrar por userId no where já que não existe no tipo
      include: {
        transaction: {
          select: {
            id: true,
            date: true,
            amount: true,
            walletId: true,
            description: true,
            name: true,
            userId: true // Incluir userId para filtrar depois
          }
        },
        salesRecord: {
          select: {
            id: true,
            userId: true // Incluir userId da venda para filtrar depois
          }
        }
      }
    }).then(links => {
      // Filtrar manualmente por userId já que não está no schema do where
      return links.filter(link => 
        (link.transaction && link.transaction.userId === userId) ||
        (link.salesRecord && link.salesRecord.userId === userId)
      );
    });
  }

  /**
   * Reconcilia uma parcela específica com uma transação
   */
  private static async reconcileInstallment(
    userId: string,
    salesRecordId: string,
    installment: any,
    walletId?: string,
    tolerancePercentage: number = 5,
    toleranceDays: number = 5,
    useScoring: boolean = false,
    sale?: any
  ) {
    // Verificar se a parcela já está associada a alguma transação
    const existingLink = await db.sales_transaction.findFirst({
      where: {
        salesRecordId,
        installmentId: installment.id
      }
    });

    if (existingLink) {
      return {
        matched: false,
        alreadyLinked: true,
        multipleMatches: false
      };
    }

    // Calcular limites de tolerância para o valor
    const minAmount = installment.amount * (1 - tolerancePercentage / 100);
    const maxAmount = installment.amount * (1 + tolerancePercentage / 100);

    // Calcular limites de data com tolerância adicional para antecipações
    const dueDate = new Date(installment.dueDate);
    const minDate = new Date(dueDate);
    minDate.setDate(minDate.getDate() - toleranceDays);
    
    const maxDate = new Date(dueDate);
    maxDate.setDate(maxDate.getDate() + toleranceDays);

    // Tolerância ampliada para antecipações no mesmo mês
    const sameMonthStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
    const sameMonthEnd = new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 0);

    // Buscar transações que correspondam aos critérios padrão
    const standardTransactions = await db.transaction.findMany({
      where: {
        userId,
        type: "INCOME",
        amount: {
          gte: minAmount,
          lte: maxAmount
        },
        date: {
          gte: minDate,
          lte: maxDate
        },
        ...(walletId ? { walletId } : {})
      },
      include: {
        wallet: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        date: "asc" // Prioriza transações mais próximas da data de vencimento
      }
    });
    
    // Buscar possíveis antecipações com uma tolerância maior no valor
    // Antecipações geralmente têm valor um pouco menor devido às taxas (até 15% a menos)
    const anticipationMinAmount = installment.amount * 0.85; // 15% a menos no mínimo
    
    const anticipationTransactions = await db.transaction.findMany({
      where: {
        userId,
        type: "INCOME",
        amount: {
          gte: anticipationMinAmount,
          lt: minAmount // Menor que o limite mínimo padrão
        },
        date: {
          gte: sameMonthStart,
          lte: sameMonthEnd
        },
        OR: [
          {
            description: {
              contains: "antecipação",
              mode: "insensitive"
            }
          },
          {
            description: {
              contains: "antecipacao",
              mode: "insensitive"
            }
          },
          {
            name: {
              contains: "antecipação",
              mode: "insensitive"
            }
          },
          {
            name: {
              contains: "antecipacao",
              mode: "insensitive"
            }
          }
        ],
        ...(walletId ? { walletId } : {})
      },
      include: {
        wallet: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });
    
    // Combinar as listas de transações
    const matchingTransactions = [...standardTransactions, ...anticipationTransactions];

    // Verificar se encontramos pelo menos uma transação correspondente
    if (matchingTransactions.length === 0) {
      return {
        matched: false,
        alreadyLinked: false,
        multipleMatches: false
      };
    }
    
    // Buscar links de vendas existentes para checagem de duplicatas
    const existingLinks = await this.getExistingTransactionLinks(userId);
    
    // Filtrar potenciais duplicatas
    const filteredTransactions = this.filterPotentialDuplicates(
      matchingTransactions,
      existingLinks
    );
    
    // Se não sobrou nenhuma transação após a filtragem de duplicatas
    if (filteredTransactions.length === 0) {
      return {
        matched: false,
        alreadyLinked: false,
        multipleMatches: false,
        possibleDuplicates: true
      };
    }

    // Se temos múltiplas correspondências e o scoring está ativado
    if (filteredTransactions.length > 1 && useScoring) {
      // Calcular pontuações para cada transação candidata
      const scoredTransactions = await this.scoreTransactions(
        filteredTransactions,
        {
          amount: installment.amount,
          date: dueDate,
          channel: sale?.channel || sale?.source,
          customerName: sale?.customerName,
          code: sale?.code || sale?.externalId,
          description: sale?.description || sale?.observacoes
        }
      );

      // Ordenar por pontuação (maior primeiro)
      scoredTransactions.sort((a, b) => b.score - a.score);
      
      // Usar a transação com maior pontuação
      const transaction = await db.transaction.findUnique({
        where: { id: scoredTransactions[0].transactionId }
      });

      if (!transaction) {
        return {
          matched: false,
          alreadyLinked: false,
          multipleMatches: true
      };
    }

    // Verificar se a transação já está associada a outra venda
    const existingTransactionLink = await db.sales_transaction.findFirst({
      where: {
        transactionId: transaction.id
      }
    });

    if (existingTransactionLink) {
      return {
        matched: false,
        alreadyLinked: true,
          multipleMatches: true
        };
      }

      // Criar a associação
      await db.sales_transaction.create({
        data: {
          salesRecordId,
          transactionId: transaction.id,
          installmentId: installment.id,
          createdAt: new Date(),
          metadata: {
            matchScore: scoredTransactions[0].score,
            reconciliationDate: new Date().toISOString(),
            matchFactors: JSON.stringify(scoredTransactions[0].factors)
          }
        } as any
      });

      // Atualizar a transação para marcar como conciliada nos metadados
      await db.transaction.update({
        where: { id: transaction.id },
        data: {
          metadata: {
            ...(transaction.metadata as any || {}),
            isReconciled: true,
            reconciliationDate: new Date().toISOString(),
            saleCode: sale?.code || sale?.externalId,
            installmentNumber: installment.number,
            matchDetails: JSON.stringify(scoredTransactions[0].factors)
          }
        }
      });

      return {
        matched: true,
        alreadyLinked: false,
        multipleMatches: true,
        score: scoredTransactions[0].score
      };
    } else {
      // Sem scoring ou apenas uma correspondência: usar o primeiro resultado
      const transaction = filteredTransactions[0];

      // Verificar se a transação já está associada a outra venda
      const existingTransactionLink = await db.sales_transaction.findFirst({
        where: {
          transactionId: transaction.id
        }
      });

      if (existingTransactionLink) {
        return {
          matched: false,
          alreadyLinked: true,
          multipleMatches: filteredTransactions.length > 1
        };
    }

    // Criar a associação
    await db.sales_transaction.create({
      data: {
        salesRecordId,
        transactionId: transaction.id,
        installmentId: installment.id,
          createdAt: new Date(),
          metadata: {
            reconciliationDate: new Date().toISOString()
          }
        } as any
      });

      // Atualizar a transação para marcar como conciliada nos metadados
      await db.transaction.update({
        where: { id: transaction.id },
        data: {
          metadata: {
            ...(transaction.metadata as any || {}),
            isReconciled: true,
            reconciliationDate: new Date().toISOString(),
            saleCode: sale?.code || sale?.externalId
          }
      }
    });

    return {
      matched: true,
      alreadyLinked: false,
        multipleMatches: filteredTransactions.length > 1
    };
    }
  }

  /**
   * Reconcilia uma venda sem parcelas com uma transação
   */
  private static async reconcileSingleSale(
    userId: string,
    sale: any,
    walletId?: string,
    tolerancePercentage: number = 5,
    toleranceDays: number = 5,
    useScoring: boolean = false
  ) {
    // Verificar se a venda já está associada a alguma transação
    const existingLink = await db.sales_transaction.findFirst({
      where: {
        salesRecordId: sale.id
      }
    });

    if (existingLink) {
      return {
        matched: false,
        alreadyLinked: true,
        multipleMatches: false
      };
    }

    // Calcular limites de tolerância para o valor
    const saleAmount = sale.netAmount || sale.totalAmount;
    const minAmount = saleAmount * (1 - tolerancePercentage / 100);
    const maxAmount = saleAmount * (1 + tolerancePercentage / 100);

    // Calcular limites de data
    const saleDate = new Date(sale.date);
    const minDate = new Date(saleDate);
    minDate.setDate(minDate.getDate() - toleranceDays);
    
    const maxDate = new Date(saleDate);
    maxDate.setDate(maxDate.getDate() + toleranceDays);

    // Buscar transações que correspondam aos critérios
    const matchingTransactions = await db.transaction.findMany({
      where: {
        userId,
        type: "INCOME",
        amount: {
          gte: minAmount,
          lte: maxAmount
        },
        date: {
          gte: minDate,
          lte: maxDate
        },
        ...(walletId ? { walletId } : {})
      },
      include: {
        wallet: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        date: "asc" // Prioriza transações mais próximas da data da venda
      }
    });

    // Verificar se encontramos pelo menos uma transação correspondente
    if (matchingTransactions.length === 0) {
      return {
        matched: false,
        alreadyLinked: false,
        multipleMatches: false
      };
    }
    
    // Buscar links de vendas existentes para checagem de duplicatas
    const existingLinks = await this.getExistingTransactionLinks(userId);
    
    // Filtrar potenciais duplicatas
    const filteredTransactions = this.filterPotentialDuplicates(
      matchingTransactions,
      existingLinks
    );
    
    // Se não sobrou nenhuma transação após a filtragem de duplicatas
    if (filteredTransactions.length === 0) {
      return {
        matched: false,
        alreadyLinked: false,
        multipleMatches: false,
        possibleDuplicates: true
      };
    }

    // Se temos múltiplas correspondências e o scoring está ativado
    if (filteredTransactions.length > 1 && useScoring) {
      // Calcular pontuações para cada transação candidata
      const scoredTransactions = await this.scoreTransactions(
        filteredTransactions,
        {
          amount: saleAmount,
          date: saleDate,
          channel: sale.channel || sale.source,
          customerName: sale.customerName,
          code: sale.code || sale.externalId,
          description: sale.description || sale.observacoes,
          source: sale.source
        }
      );

      // Ordenar por pontuação (maior primeiro)
      scoredTransactions.sort((a, b) => b.score - a.score);
      
      // Usar a transação com maior pontuação
      const transaction = await db.transaction.findUnique({
        where: { id: scoredTransactions[0].transactionId }
      });

      if (!transaction) {
        return {
          matched: false,
          alreadyLinked: false,
          multipleMatches: true
      };
    }

    // Verificar se a transação já está associada a outra venda
    const existingTransactionLink = await db.sales_transaction.findFirst({
      where: {
        transactionId: transaction.id
      }
    });

    if (existingTransactionLink) {
      return {
        matched: false,
        alreadyLinked: true,
          multipleMatches: true
        };
      }

    // Criar a associação
    await db.sales_transaction.create({
      data: {
        salesRecordId: sale.id,
        transactionId: transaction.id,
          createdAt: new Date(),
          metadata: {
            matchScore: scoredTransactions[0].score,
            reconciliationDate: new Date().toISOString(),
            matchFactors: JSON.stringify(scoredTransactions[0].factors)
          }
        } as any
      });

      // Atualizar a transação para marcar como conciliada nos metadados
      await db.transaction.update({
        where: { id: transaction.id },
        data: {
          metadata: {
            ...(transaction.metadata as any || {}),
            isReconciled: true,
            reconciliationDate: new Date().toISOString(),
            saleCode: sale.code || sale.externalId,
            matchDetails: JSON.stringify(scoredTransactions[0].factors)
          }
      }
    });

    return {
      matched: true,
      alreadyLinked: false,
        multipleMatches: true,
        score: scoredTransactions[0].score
      };
    } else {
      // Sem scoring ou apenas uma correspondência: usar o primeiro resultado
      const transaction = filteredTransactions[0];

      // Verificar se a transação já está associada a outra venda
      const existingTransactionLink = await db.sales_transaction.findFirst({
        where: {
          transactionId: transaction.id
        }
      });

      if (existingTransactionLink) {
        return {
          matched: false,
          alreadyLinked: true,
          multipleMatches: filteredTransactions.length > 1
        };
      }

      // Criar a associação
      await db.sales_transaction.create({
        data: {
          salesRecordId: sale.id,
          transactionId: transaction.id,
          createdAt: new Date(),
          metadata: {
            reconciliationDate: new Date().toISOString()
          }
        } as any
      });

      // Atualizar a transação para marcar como conciliada nos metadados
      await db.transaction.update({
        where: { id: transaction.id },
        data: {
          metadata: {
            ...(transaction.metadata as any || {}),
            isReconciled: true,
            reconciliationDate: new Date().toISOString(),
            saleCode: sale.code || sale.externalId
          }
        }
      });

      return {
        matched: true,
        alreadyLinked: false,
        multipleMatches: filteredTransactions.length > 1
      };
    }
  }

  /**
   * Encontra grupos de transações que podem ser parcelas da mesma venda
   */
  static async findInstallmentGroups(
    userId: string,
    walletId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ReconciliationGroup[]> {
    try {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          walletId,
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          sales: {
            none: {}
          }
        }
      });

      const groups = new Map<string, Transaction[]>();

      for (const tx of transactions) {
        let matched = false;
        const txAmount = Number(tx.amount);

        // Verificar grupos existentes
        for (const [key, group] of groups.entries()) {
          const baseAmount = parseFloat(key);
          const amountDiff = Math.abs(txAmount - baseAmount);
          const percentDiff = amountDiff / baseAmount;
          
          // Verificar se o valor é similar (diferença de até 0.5%)
          if (percentDiff <= 0.005) {
            group.push(tx);
            matched = true;
            break;
          }
        }

        // Se não encontrou grupo similar, criar novo
        if (!matched) {
          groups.set(txAmount.toString(), [tx]);
        }
      }

      // Converter grupos em array e calcular totais
      const result: ReconciliationGroup[] = [];
      
      for (const [_, groupTransactions] of groups) {
        // Considerar apenas grupos com mais de uma transação
        if (groupTransactions.length > 1) {
          const totalAmount = groupTransactions.reduce((sum, tx) => {
            return sum + Number(tx.amount);
          }, 0);
          
          result.push({
            transactions: groupTransactions,
            totalAmount,
            installmentCount: groupTransactions.length
          });
        }
      }

      return result;

    } catch (error) {
      console.error("Erro ao buscar grupos de parcelas:", error);
      return []; // Retorna array vazio em caso de erro
    }
  }

  /**
   * Verifica se um grupo de transações corresponde a uma venda parcelada
   */
  static async matchSaleToTransactionGroup(
    group: ReconciliationGroup,
    userId: string
  ): Promise<boolean> {
    try {
      // Buscar vendas não conciliadas com valor total próximo
      const sales = await prisma.sales_records.findMany({
        where: {
          userId,
          totalAmount: {
            gte: group.totalAmount * 0.95, // 5% de tolerância para menos
            lte: group.totalAmount * 1.05  // 5% de tolerância para mais
          },
          transactions: {
            none: {} // Apenas vendas não vinculadas
          }
        },
        include: {
          installments: true
        }
      });

      for (const sale of sales) {
        // Verificar se o número de parcelas corresponde
        if (sale.installments.length === group.installmentCount) {
          // Vincular transações à venda
          await Promise.all(group.transactions.map(async (tx, index) => {
            await prisma.transaction.update({
              where: { id: tx.id },
              data: {
                sales: {
                  create: {
                    salesRecordId: sale.id,
                    installmentId: sale.installments[index].id
                  }
                }
              }
            });
          }));

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Erro ao vincular venda a grupo de transações:", error);
      throw new Error("Falha ao vincular venda");
    }
  }

  /**
   * Executa a conciliação automática para um período
   */
  static async autoReconcile(
    userId: string,
    walletId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    groupsFound: number;
    groupsReconciled: number;
    transactionsReconciled: number;
  }> {
    try {
      const groups = await this.findInstallmentGroups(userId, walletId, startDate, endDate);
      let groupsReconciled = 0;
      let transactionsReconciled = 0;

      for (const group of groups) {
        const matched = await this.matchSaleToTransactionGroup(group, userId);
        if (matched) {
          groupsReconciled++;
          transactionsReconciled += group.transactions.length;
        }
      }

      return {
        groupsFound: groups.length,
        groupsReconciled,
        transactionsReconciled
      };
    } catch (error) {
      console.error("Erro na conciliação automática:", error);
      throw new Error("Falha na conciliação automática");
    }
  }

  /**
   * Busca transações pelo código da venda
   */
  static async findTransactionsByCode(
    userId: string,
    code: string
  ): Promise<Transaction[]> {
    try {
      // Buscar transações que contenham o código da venda na descrição ou nome
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          OR: [
            {
              description: {
                contains: code,
                mode: "insensitive"
              }
            },
            {
              name: {
                contains: code,
                mode: "insensitive"
              }
            },
            {
              metadata: {
                path: ['saleCode'],
                equals: code
              }
            }
          ]
        },
        orderBy: {
          date: 'asc'
        },
        include: {
          wallet: true
        }
      });

      return transactions;
    } catch (error) {
      console.error("Erro ao buscar transações por código:", error);
      return [];
    }
  }

  /**
   * Realiza a conciliação manual entre uma venda e uma transação
   */
  static async manualReconciliation(
    userId: string,
    salesRecordId: string,
    transactionId: string,
    installmentId?: string
  ): Promise<boolean> {
    try {
      // 1. Verificar se a venda existe e pertence ao usuário
      const sale = await prisma.sales_records.findFirst({
        where: {
          id: salesRecordId,
          userId
        }
      });

      if (!sale) {
        throw new Error("Venda não encontrada");
      }

      // 2. Verificar se a transação existe e pertence ao usuário
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId
        }
      });

      if (!transaction) {
        throw new Error("Transação não encontrada");
      }

      // 3. Verificar se já existe uma conciliação para esta transação
      const existingTransactionLink = await prisma.sales_transaction.findFirst({
        where: {
          transactionId
        }
      });

      if (existingTransactionLink) {
        throw new Error("Transação já está conciliada com outra venda");
      }

      // 4. Criar a conciliação
      await prisma.sales_transaction.create({
        data: {
          salesRecordId,
          transactionId,
          installmentId,
          createdAt: new Date(),
          metadata: {
            reconciliationDate: new Date().toISOString(),
            reconciliationType: "MANUAL"
          }
        } as any
      });

      // 5. Atualizar metadados da transação
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          metadata: {
            ...(transaction.metadata as any || {}),
            isReconciled: true,
            reconciliationDate: new Date().toISOString(),
            reconciliationType: "MANUAL",
            saleCode: sale.code || sale.externalId
          }
        }
      });

      return true;
    } catch (error) {
      console.error("Erro na conciliação manual:", error);
      throw error;
    }
  }

  /**
   * Remove a conciliação entre uma venda e uma transação
   */
  static async removeReconciliation(
    userId: string,
    salesRecordId: string,
    transactionId: string
  ): Promise<boolean> {
    try {
      // 1. Verificar se a conciliação existe
      const reconciliation = await prisma.sales_transaction.findFirst({
        where: {
          salesRecordId,
          transactionId
        }
      });

      if (!reconciliation) {
        throw new Error("Conciliação não encontrada");
      }

      // 2. Verificar se a venda pertence ao usuário
      const sale = await prisma.sales_records.findFirst({
        where: {
          id: salesRecordId,
          userId
        }
      });

      if (!sale) {
        throw new Error("Venda não encontrada");
      }

      // 3. Verificar se a transação pertence ao usuário
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId
        }
      });

      if (!transaction) {
        throw new Error("Transação não encontrada");
      }

      // 4. Remover a conciliação
      await prisma.sales_transaction.delete({
        where: {
          id: reconciliation.id
        }
      });

      // 5. Atualizar metadados da transação
      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          metadata: {
            ...(transaction.metadata as any || {}),
            isReconciled: false,
            reconciliationDate: null,
            reconciliationType: null,
            saleCode: null
          }
        }
      });

      return true;
    } catch (error) {
      console.error("Erro ao remover conciliação:", error);
      throw error;
    }
  }

  /**
   * Busca transações não conciliadas que podem corresponder a uma venda
   */
  static async findMatchingTransactions(
    userId: string,
    salesRecordId: string,
    options: {
      walletId?: string;
      startDate?: Date;
      endDate?: Date;
      useValueTolerance?: boolean;
      valueTolerance?: number;
    } = {}
  ): Promise<Transaction[]> {
    try {
      // 1. Buscar a venda
      const sale = await prisma.sales_records.findFirst({
        where: {
          id: salesRecordId,
          userId
        },
        include: {
          installments: true
        }
      });

      if (!sale) {
        throw new Error("Venda não encontrada");
      }

      // 2. Definir os critérios de busca
      const {
        walletId,
        startDate = new Date(sale.date),
        endDate = new Date(new Date(sale.date).setMonth(new Date(sale.date).getMonth() + 3)), // 3 meses após a venda
        useValueTolerance = true,
        valueTolerance = 5 // 5% de tolerância por padrão
      } = options;

      // 3. Calcular limites de valor se a tolerância estiver ativada
      const amount = sale.netAmount || sale.totalAmount;
      const valueFilter = useValueTolerance ? {
        amount: {
          gte: amount * (1 - valueTolerance / 100),
          lte: amount * (1 + valueTolerance / 100)
        }
      } : {};

      // 4. Buscar transações não conciliadas que correspondam aos critérios
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          type: "INCOME",
          date: {
            gte: startDate,
            lte: endDate
          },
          ...valueFilter,
          ...(walletId ? { walletId } : {}),
          sales: {
            none: {} // Apenas transações não conciliadas
          }
        },
        include: {
          wallet: true
        },
        orderBy: [
          { date: "asc" },
          { amount: "asc" }
        ]
      });

      return transactions;
    } catch (error) {
      console.error("Erro ao buscar transações correspondentes:", error);
      throw error;
    }
  }
} 