import { EventEmitter } from "events";

/**
 * Opções para o processador de lotes
 */
export interface BatchProcessorOptions<T, R> {
  batchSize?: number;
  concurrency?: number;
  onBatchComplete?: (results: R[], batchIndex: number) => void;
  onProgress?: (processed: number, total: number) => void;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Processador de lotes para operações assíncronas
 * Permite processar grandes volumes de dados em lotes com controle de concorrência
 */
export class BatchProcessor<T, R> extends EventEmitter {
  private items: T[];
  private batchSize: number;
  private concurrency: number;
  private retryCount: number;
  private retryDelay: number;
  private processor: (item: T) => Promise<R>;
  private onBatchComplete?: (results: R[], batchIndex: number) => void;
  private onProgress?: (processed: number, total: number) => void;
  
  private totalProcessed: number = 0;
  private isRunning: boolean = false;
  private isCancelled: boolean = false;
  private errors: Error[] = [];
  private results: R[] = [];

  /**
   * Construtor para o processador de lotes
   * @param processor Função que processa um item individual
   * @param options Opções de configuração
   */
  constructor(
    processor: (item: T) => Promise<R>,
    options: BatchProcessorOptions<T, R> = {}
  ) {
    super();
    this.items = [];
    this.processor = processor;
    this.batchSize = options.batchSize || 50;
    this.concurrency = options.concurrency || 5;
    this.onBatchComplete = options.onBatchComplete;
    this.onProgress = options.onProgress;
    this.retryCount = options.retryCount || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Adiciona itens para processamento
   */
  addItems(items: T[]): this {
    this.items = [...this.items, ...items];
    return this;
  }

  /**
   * Define os itens para processamento (substitui itens existentes)
   */
  setItems(items: T[]): this {
    this.items = [...items];
    return this;
  }

  /**
   * Limpa todos os itens
   */
  clearItems(): this {
    this.items = [];
    return this;
  }

  /**
   * Retorna a quantidade de itens a serem processados
   */
  getItemCount(): number {
    return this.items.length;
  }

  /**
   * Divide os itens em lotes
   */
  private getBatches(): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < this.items.length; i += this.batchSize) {
      batches.push(this.items.slice(i, i + this.batchSize));
    }
    return batches;
  }

  /**
   * Processa um item com retry em caso de falha
   */
  private async processWithRetry(item: T, retryCount = 0): Promise<R> {
    try {
      return await this.processor(item);
    } catch (error) {
      if (retryCount < this.retryCount) {
        // Esperar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.processWithRetry(item, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Processa um lote de itens em paralelo
   */
  private async processBatch(batch: T[], batchIndex: number): Promise<R[]> {
    const results: R[] = [];
    const errors: Error[] = [];
    
    // Processar com limite de concorrência
    const chunks: T[][] = [];
    for (let i = 0; i < batch.length; i += this.concurrency) {
      chunks.push(batch.slice(i, i + this.concurrency));
    }
    
    for (const chunk of chunks) {
      if (this.isCancelled) break;
      
      // Processar cada item do chunk em paralelo
      const promises = chunk.map(async (item) => {
        try {
          const result = await this.processWithRetry(item);
          results.push(result);
          this.totalProcessed++;
          
          // Atualizar progresso
          if (this.onProgress) {
            this.onProgress(this.totalProcessed, this.items.length);
          }
          
          this.emit('itemProcessed', { item, result });
          return result;
        } catch (error) {
          errors.push(error as Error);
          this.errors.push(error as Error);
          this.emit('itemError', { item, error });
          return null;
        }
      });
      
      await Promise.all(promises);
    }
    
    // Chamar callback de completar lote
    if (this.onBatchComplete && results.length > 0) {
      this.onBatchComplete(results, batchIndex);
    }
    
    if (errors.length > 0) {
      this.emit('batchError', { batchIndex, errors });
    }
    
    return results.filter(r => r !== null) as R[];
  }
  
  /**
   * Inicia o processamento de todos os lotes
   */
  async process(): Promise<R[]> {
    if (this.isRunning) {
      throw new Error('Processamento já está em andamento');
    }
    
    if (this.items.length === 0) {
      return [];
    }
    
    this.isRunning = true;
    this.isCancelled = false;
    this.totalProcessed = 0;
    this.errors = [];
    this.results = [];
    
    try {
      const batches = this.getBatches();
      this.emit('start', { totalItems: this.items.length, totalBatches: batches.length });
      
      for (let i = 0; i < batches.length; i++) {
        if (this.isCancelled) break;
        
        const batch = batches[i];
        this.emit('batchStart', { batchIndex: i, batchSize: batch.length });
        
        const batchResults = await this.processBatch(batch, i);
        this.results = [...this.results, ...batchResults];
        
        this.emit('batchComplete', { 
          batchIndex: i, 
          processed: batchResults.length,
          total: batch.length,
          results: batchResults
        });
      }
      
      this.emit('complete', { 
        totalProcessed: this.totalProcessed,
        totalItems: this.items.length,
        errors: this.errors,
        results: this.results
      });
      
      return this.results;
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Cancela o processamento em andamento
   */
  cancel(): void {
    if (this.isRunning) {
      this.isCancelled = true;
      this.emit('cancelled', { 
        totalProcessed: this.totalProcessed,
        totalItems: this.items.length
      });
    }
  }
  
  /**
   * Reseta o processador para um novo processamento
   */
  reset(): void {
    this.items = [];
    this.totalProcessed = 0;
    this.errors = [];
    this.results = [];
    this.isCancelled = false;
    this.isRunning = false;
  }

  /**
   * Retorna os erros ocorridos durante o processamento
   */
  getErrors(): Error[] {
    return this.errors;
  }

  /**
   * Verifica se o processamento está em andamento
   */
  isProcessing(): boolean {
    return this.isRunning;
  }
} 
