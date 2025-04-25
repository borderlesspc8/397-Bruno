import { prisma } from '@/app/_lib/prisma';
import { format } from 'date-fns';
import { TransactionCategory, TransactionPaymentMethod } from '@prisma/client';

interface TransactionMetadata {
  source: string;
  originalId?: string;
  bankCode?: string;
  description?: string;
  complementaryInfo?: string;
  documentNumber?: string;
  counterpartyInfo?: {
    document?: string;
    bank?: string;
    branch?: string;
    account?: string;
  };
  [key: string]: any;
}

interface ProcessedTransaction {
  id?: string;
  date: Date;
  name: string;
  amount: number;
  type: 'DEPOSIT' | 'EXPENSE' | 'INVESTMENT';
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  walletId?: string;
  userId: string;
  metadata?: TransactionMetadata;
}

export class TransactionProcessor {
  private static readonly SALDO_KEYWORDS = [
    'SALDO DO DIA',
    'SALDO ANTERIOR',
    'S A L D O',
    'SALDO FINAL',
    'SALDO INICIAL'
  ];

  private static readonly CATEGORY_MAPPING: Record<string, TransactionCategory> = {
    'PIX': 'PIX' as TransactionCategory,
    'TED': 'BANK_TRANSFER' as TransactionCategory,
    'DOC': 'BANK_TRANSFER' as TransactionCategory,
    'TARIFA': 'UTILITY' as TransactionCategory,
    'DEPOSITO': 'DEPOSIT' as TransactionCategory,
    'SAQUE': 'WITHDRAWAL' as TransactionCategory,
    'PAGAMENTO': 'OTHER' as TransactionCategory,
    'COMPRA': 'OTHER' as TransactionCategory,
    'INVESTIMENTO': 'INVESTMENT' as TransactionCategory
  };

  /**
   * Processa uma lista de transações bancárias
   */
  static async processTransactions(
    rawTransactions: any[],
    userId: string,
    walletId?: string
  ): Promise<{ processed: number; skipped: number; errors: number }> {
    console.log(`Iniciando processamento de ${rawTransactions.length} transações`);
    
    const stats = { processed: 0, skipped: 0, errors: 0 };
    const processedTransactions: ProcessedTransaction[] = [];

    // Processar cada transação
    for (const raw of rawTransactions) {
      try {
        // Pular transações de saldo
        if (this.isSaldoTransaction(raw.textoDescricaoHistorico)) {
          stats.skipped++;
          continue;
        }

        const transaction = this.parseTransaction(raw, userId, walletId);
        if (transaction) {
          processedTransactions.push(transaction);
        }
      } catch (error) {
        console.error('Erro ao processar transação:', error);
        stats.errors++;
      }
    }

    // Salvar transações em lote
    try {
      await this.saveTransactions(processedTransactions);
      stats.processed = processedTransactions.length;
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
      stats.errors += processedTransactions.length;
    }

    return stats;
  }

  /**
   * Verifica se é uma transação de saldo
   */
  private static isSaldoTransaction(description?: string): boolean {
    if (!description) return false;
    const upperDesc = description.toUpperCase();
    return this.SALDO_KEYWORDS.some(keyword => upperDesc.includes(keyword));
  }

  /**
   * Converte uma transação bruta em uma transação processada
   */
  private static parseTransaction(
    raw: any,
    userId: string,
    walletId?: string
  ): ProcessedTransaction | null {
    try {
      // Extrair informações básicas
      const isDebit = raw.indicadorSinalLancamento === 'D';
      const amount = isDebit ? -Math.abs(raw.valorLancamento) : raw.valorLancamento;
      
      // Determinar tipo da transação
      const type = this.determineTransactionType(raw.textoDescricaoHistorico, isDebit);
      
      // Criar metadados
      const metadata: TransactionMetadata = {
        source: 'bank_import',
        originalId: raw.numeroDocumento?.toString(),
        description: raw.textoDescricaoHistorico,
        complementaryInfo: raw.textoInformacaoComplementar,
        documentNumber: raw.numeroDocumento?.toString(),
      };

      // Adicionar informações de contraparte se disponíveis
      if (raw.numeroCpfCnpjContrapartida) {
        metadata.counterpartyInfo = {
          document: this.maskDocument(raw.numeroCpfCnpjContrapartida),
          bank: raw.codigoBancoContrapartida?.toString(),
          branch: raw.codigoAgenciaContrapartida?.toString(),
          account: raw.numeroContaContrapartida
        };
      }

      return {
        date: this.parseDate(raw.dataLancamento),
        name: this.generateTransactionName(raw),
        amount,
        type,
        category: this.determineCategory(raw.textoDescricaoHistorico),
        paymentMethod: 'BANK_TRANSFER' as TransactionPaymentMethod,
        userId,
        walletId,
        metadata
      };
    } catch (error) {
      console.error('Erro ao converter transação:', error);
      return null;
    }
  }

  /**
   * Determina o tipo da transação
   */
  private static determineTransactionType(
    description: string,
    isDebit: boolean
  ): 'DEPOSIT' | 'EXPENSE' | 'INVESTMENT' {
    const upperDesc = description.toUpperCase();
    
    if (upperDesc.includes('INVEST') || upperDesc.includes('APLIC')) {
      return 'INVESTMENT';
    }
    
    return isDebit ? 'EXPENSE' : 'DEPOSIT';
  }

  /**
   * Determina a categoria da transação
   */
  private static determineCategory(description: string): TransactionCategory {
    const upperDesc = description.toUpperCase();
    
    for (const [keyword, category] of Object.entries(this.CATEGORY_MAPPING)) {
      if (upperDesc.includes(keyword)) {
        return category;
      }
    }
    
    return 'OTHER' as TransactionCategory;
  }

  /**
   * Gera um nome amigável para a transação
   */
  private static generateTransactionName(raw: any): string {
    const desc = raw.textoDescricaoHistorico || '';
    const complement = raw.textoInformacaoComplementar || '';
    
    if (!complement) return desc;
    
    // Para PIX e TED, incluir informação complementar
    if (desc.toUpperCase().includes('PIX') || desc.toUpperCase().includes('TED')) {
      return `${desc} - ${complement}`;
    }
    
    return desc;
  }

  /**
   * Converte a data do formato do banco para Date
   */
  private static parseDate(dateNumber: number): Date {
    const dateStr = dateNumber.toString().padStart(8, '0');
    const day = parseInt(dateStr.slice(0, 2));
    const month = parseInt(dateStr.slice(2, 4)) - 1;
    const year = parseInt(dateStr.slice(4, 8));
    
    return new Date(year, month, day);
  }

  /**
   * Mascara documentos (CPF/CNPJ)
   */
  private static maskDocument(doc: string | number): string {
    const str = doc.toString();
    return str.length <= 11
      ? str.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.$3-$4')
      : str.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '**.$2.$3/$4-**');
  }

  /**
   * Salva as transações no banco de dados
   */
  private static async saveTransactions(transactions: ProcessedTransaction[]): Promise<void> {
    // Criar transações em lote
    await prisma.transaction.createMany({
      data: transactions.map(t => ({
        id: t.id,
        date: t.date,
        name: t.name,
        amount: t.amount,
        type: t.type,
        category: t.category,
        paymentMethod: t.paymentMethod,
        userId: t.userId,
        walletId: t.walletId,
        metadata: t.metadata
      })),
      skipDuplicates: true // Pular se já existir (baseado em campos únicos)
    });
  }
} 