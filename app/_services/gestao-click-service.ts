/**
 * Serviço de integração com o Gestão Click
 * Responsável por importar as transações financeiras do Gestão Click
 */

import { prisma } from "@/app/_lib/prisma";
import { TransactionProcessor } from "./transaction-processor";
import { TransactionPaymentMethod, Transaction } from '@prisma/client';

// Tipos para o serviço de integração com o Gestão Click
export interface GestaoClickConfig {
  apiKey: string;
  secretToken?: string;
  apiUrl?: string;
  userId: string;
  empresa?: string;
}

export interface GestaoClickImportOptions {
  startDate: string;   // Data de início no formato YYYY-MM-DD
  endDate: string;     // Data de fim no formato YYYY-MM-DD
  userId: string;      // ID do usuário
  walletId: string;    // ID da carteira
  includeCategories?: boolean; // Importar categorias também?
}

/**
 * Interface para transações importadas do Gestão Click
 */
export interface GestaoClickTransaction {
  id: string;
  codigo?: string;
  descricao: string;
  valor: number;
  data: string | Date;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string;
  contaBancaria: string | { id: string; nome: string };
  centroCusto?: string;
  formaPagamento: string;
  status?: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  
  // Campos adicionais
  clienteId?: string;
  clienteNome?: string;
  fornecedorId?: string;
  fornecedorNome?: string;
  lojaId?: string;
  lojaNome?: string;
  
  metadata: any;
}

export interface GestaoClickImportResult {
  totalProcessed: number;
  skipped: number;
  errors: number;
  startDate: string;
  endDate: string;
}

export interface GestaoClickAccount {
  id: string;
  nome: string;
  descricao?: string;
  saldo: number;
  banco?: string;
  agencia?: string;
  conta?: string;
  tipo: string;
  ativo: boolean;
  metadata?: any;
}

export interface GestaoClickCostCenter {
  id: string;
  nome: string;
  descricao?: string;
  codigo?: string;
  ativo: boolean;
  metadata?: any;
}

export interface GestaoClickWalletCreationResult {
  totalCreated: number;
  skipped: number;
  wallets: {
    id: string;
    name: string;
    type: string;
    balance: number;
    isNew: boolean;
  }[];
}

// Interface para resultado da importação automática
interface AutoImportResult {
  wallets: {
    created: number;
    existing: number;
    total: number;
    details: Array<{
      id: string;
      name: string;
      type: string;
      balance: number;
      isNew: boolean;
    }>;
  };
  transactions: {
    imported: number;
    skipped: number;
    total: number;
    details: Array<{
      walletId: string;
      walletName: string;
      newTransactions: number;
      skippedTransactions: number;
    }>;
  };
  progress: {
    currentStep: string;
    totalSteps: number;
    currentWallet: number;
    totalWallets: number;
    percentage: number;
  };
}

// Interface para transação com source
interface TransactionWithSource {
  source: any;
}

/**
 * Resultado da importação completa de dados do Gestão Click
 */
export interface CompleteImportResult {
  wallets: {
    fromAccounts: GestaoClickWalletCreationResult;
    fromCostCenters: GestaoClickWalletCreationResult;
  };
  transactions: {
    totalImported: number;
    skipped: number;
    failed: number;
    details: Array<{
      walletId: string;
      walletName: string;
      newTransactions: number;
      skippedTransactions: number;
      errorMessage?: string;
    }>;
  };
}

/**
 * Interface para resumo financeiro por período
 */
export interface GestaoClickFinancialSummary {
  period: string; // YYYY-MM
  revenues: {
    total: number;
    byCategory: { id: string; name: string; amount: number }[];
    byStore: { id: string; name: string; amount: number }[];
    byCostCenter: { id: string; name: string; amount: number }[];
    byPaymentMethod: { id: string; name: string; amount: number }[];
  };
  expenses: {
    total: number;
    byCategory: { id: string; name: string; amount: number }[];
    byStore: { id: string; name: string; amount: number }[];
    byCostCenter: { id: string; name: string; amount: number }[];
    byPaymentMethod: { id: string; name: string; amount: number }[];
  };
}

// Classe para o serviço de integração com o Gestão Click
export class GestaoClickService {
  private apiKey: string;
  private secretToken: string | undefined;
  private apiUrl: string;
  private userId: string;
  private empresa?: string;
  private _lastSettingsError: boolean;
  private _developmentSettings: any;
  
  /**
   * Construtor da classe
   * @param config Configuração para o serviço
   */
  constructor(config: GestaoClickConfig) {
    this.apiKey = config.apiKey;
    this.secretToken = config.secretToken;
    this.apiUrl = config.apiUrl || 'https://api.beteltecnologia.com';
    this.userId = config.userId;
    this.empresa = config.empresa;
    this._lastSettingsError = false;
    this._developmentSettings = null;
  }

  /**
   * Configura uma nova instância do serviço com as configurações fornecidas
   * @param config Configuração para o serviço
   */
  static configure(config: GestaoClickConfig): GestaoClickService {
    return new GestaoClickService(config);
  }

  /**
   * Obtém os cabeçalhos de autenticação para as requisições
   * @returns Headers para autenticação
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'access-token': this.apiKey
    };

    if (this.secretToken) {
      headers['secret-access-token'] = this.secretToken;
    }

    return headers;
  }

  /**
   * Testa a conexão com a API do Gestão Click
   * @returns true se a conexão for bem-sucedida
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('[GESTAO_CLICK] Testando conexão com a API...');
      
      // Buscar contas bancárias como teste de conectividade
      const url = new URL(`${this.apiUrl}/contas_bancarias`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        console.error(`[GESTAO_CLICK] Erro na resposta da API: ${response.status} - ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      console.log('[GESTAO_CLICK] Conexão com API bem-sucedida');
      
      return true;
    } catch (error) {
      console.error('[GESTAO_CLICK] Erro ao testar conexão:', error);
      return false;
    }
  }

  /**
   * Obtém transações do Gestão Click com suporte a paginação
   * @param startDate Data inicial (opcional)
   * @param endDate Data final (opcional)
   * @param filters Filtros adicionais
   * @returns Lista de transações (pagamentos e recebimentos)
   */
  async getTransactions(
    startDate?: Date, 
    endDate?: Date,
    filters: {
      loja_id?: number;
      cliente_id?: number;
      fornecedor_id?: number;
      liquidado?: 'ab' | 'at' | 'pg';
      plano_contas_id?: number;
      centro_custo_id?: number;
      conta_bancaria_id?: number;
      forma_pagamento_id?: number;
      valor_inicio?: number;
      valor_fim?: number;
      limit?: number;
      pagePagamentos?: number;
      pageRecebimentos?: number;
    } = {}
  ): Promise<GestaoClickTransaction[]> {
    try {
      console.log('[GESTAO_CLICK] Obtendo transações...');
      
      if (process.env.NODE_ENV === 'development' && this._developmentSettings?.simulate) {
        return this.generateSimulatedTransactions();
      }
      
      // Converter datas para formato esperado pela API
      const sDate = startDate ? startDate.toISOString().split('T')[0] : undefined;
      const eDate = endDate ? endDate.toISOString().split('T')[0] : undefined;
      
      if (sDate && eDate) {
        console.log(`[GESTAO_CLICK] Período: ${sDate} até ${eDate}`);
      }
      
      // Buscar pagamentos (despesas)
      console.log('[GESTAO_CLICK] Buscando PAGAMENTOS (despesas)...');
      const pagamentos = await this.fetchPayments(sDate, eDate, filters, filters.pagePagamentos || 1);
      console.log(`[GESTAO_CLICK] ${pagamentos.length} pagamentos encontrados`);
      
      // Buscar recebimentos (receitas)
      console.log('[GESTAO_CLICK] Buscando RECEBIMENTOS (receitas)...');
      const recebimentos = await this.fetchReceipts(sDate, eDate, filters, filters.pageRecebimentos || 1);
      console.log(`[GESTAO_CLICK] ${recebimentos.length} recebimentos encontrados`);
      
      // Combinar resultados
      const allTransactions = [...pagamentos, ...recebimentos];
      
      // Log de contagem por tipo
      const receitasCount = allTransactions.filter(tx => tx.tipo === 'RECEITA').length;
      const despesasCount = allTransactions.filter(tx => tx.tipo === 'DESPESA').length;
      
      console.log(`[GESTAO_CLICK] Total de transações: ${allTransactions.length} (${receitasCount} receitas, ${despesasCount} despesas)`);
      
      // Log detalhado para debug
      if (receitasCount === 0 && recebimentos.length > 0) {
        console.warn('[GESTAO_CLICK] ATENÇÃO: Recebimentos foram buscados mas nenhum foi classificado como RECEITA');
        const primeirosRecebimentos = recebimentos.slice(0, 3);
        for (const rec of primeirosRecebimentos) {
          console.log(`[GESTAO_CLICK] Exemplo de recebimento:`, {
            id: rec.id,
            descricao: rec.descricao,
            valor: rec.valor,
            tipo: rec.tipo,
            data: rec.data
          });
        }
      }
      
      return allTransactions;
    } catch (error) {
      console.error('[GESTAO_CLICK] Erro ao obter transações:', error);
      throw error;
    }
  }
  
  /**
   * Busca pagamentos (despesas) do Gestão Click com suporte a paginação
   * @param startDate Data inicial no formato YYYY-MM-DD (opcional)
   * @param endDate Data final no formato YYYY-MM-DD (opcional)
   * @param filters Filtros adicionais para a consulta
   * @param currentPage Página atual para paginação recursiva (opcional)
   * @param allPayments Acumulador de pagamentos (opcional, usado na recursão)
   * @returns Lista de transações de despesa
   */
  private async fetchPayments(
    startDate?: string, 
    endDate?: string, 
    filters: {
      loja_id?: number;
      cliente_id?: number;
      fornecedor_id?: number;
      liquidado?: 'ab' | 'at' | 'pg'; // ab = Em aberto, at = Em atraso, pg = Confirmado
      plano_contas_id?: number;
      centro_custo_id?: number;
      conta_bancaria_id?: number;
      forma_pagamento_id?: number;
      valor_inicio?: number;
      valor_fim?: number;
      limit?: number;
    } = {},
    currentPage: number = 1,
    allPayments: GestaoClickTransaction[] = []
  ): Promise<GestaoClickTransaction[]> {
    try {
      // Construir a URL da API com a página atual
      const url = new URL(`${this.apiUrl}/pagamentos`);
      
      // Adicionar parâmetro de página
      url.searchParams.append('page', currentPage.toString());
      
      // Adicionar limite de registros por página (maior que o padrão)
      const resultsLimit = filters.limit || 2000;
      url.searchParams.append('limit', resultsLimit.toString());
      
      // Adicionar parâmetros de data se fornecidos
      if (startDate) {
        url.searchParams.append('data_inicio', startDate);
      }
      
      if (endDate) {
        url.searchParams.append('data_fim', endDate);
      }
      
      // Adicionar filtros adicionais
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
      
      // Realizar a chamada para a API
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar pagamentos: ${response.status}`);
      }
      
      const result = await response.json();
      // Log melhorado com verificações para evitar undefined
      const totalDaPagina = result?.meta?.total_da_pagina || 'N/A';
      const totalRegistros = result?.meta?.total_registros || 'N/A';
      console.log(`[GESTAO_CLICK] Resposta da API de pagamentos (página ${currentPage}): ${totalDaPagina} de ${totalRegistros} registros`);
      
      // Verificar a estrutura da resposta
      if (!result) {
        throw new Error('Resposta da API inválida');
      }
      
      // Nova estrutura de resposta com "data" dentro de um objeto
      let paymentItems = [];
      let nextPage = null;
      let totalPages = 1;
      
      if (Array.isArray(result)) {
        // Formato antigo: array direto
        paymentItems = result;
        // Sem informações de paginação no formato antigo
      } else if (result.data && Array.isArray(result.data)) {
        // Novo formato: objeto com array data
        paymentItems = result.data;
        
        // Extrair informações de paginação, se disponíveis
        if (result.meta) {
          nextPage = result.meta.proxima_pagina;
          totalPages = Math.ceil(result.meta.total_registros / result.meta.limite_por_pagina);
          
          console.log(`[GESTAO_CLICK] Paginação de pagamentos: página ${result.meta.pagina_atual} de ${totalPages} (${result.meta.total_registros} registros totais)`);
        }
      } else {
        throw new Error('Resposta da API não contém um array de pagamentos');
      }
      
      // Transformar os dados para o formato esperado
      const transformedPayments = paymentItems.map((item: any) => this.transformPaymentToTransaction(item));
      
      // Adicionar os pagamentos desta página ao acumulador
      const currentPayments = [...allPayments, ...transformedPayments];
      
      // Se houver próxima página e não estamos no limite de paginação (evitar loops infinitos)
      if (nextPage && currentPage < Math.min(totalPages, 200)) { // Aumentar o limite de 100 para 200 páginas
        console.log(`[GESTAO_CLICK] Buscando próxima página de pagamentos: ${nextPage}`);
        
        // Pausa para evitar sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Buscar próxima página recursivamente
        return this.fetchPayments(startDate, endDate, filters, nextPage, currentPayments);
      }
      
      // Retornar todos os pagamentos acumulados
      return currentPayments;
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro ao buscar pagamentos:', error);
      throw error;
    }
  }
  
  /**
   * Busca recebimentos (receitas) do Gestão Click com suporte a paginação
   * @param startDate Data inicial no formato YYYY-MM-DD (opcional)
   * @param endDate Data final no formato YYYY-MM-DD (opcional)
   * @param filters Filtros adicionais para a consulta
   * @param currentPage Página atual para paginação recursiva (opcional)
   * @param allReceipts Acumulador de recebimentos (opcional, usado na recursão)
   * @returns Lista de transações de receita
   */
  private async fetchReceipts(
    startDate?: string, 
    endDate?: string,
    filters: {
      loja_id?: number;
      cliente_id?: number;
      fornecedor_id?: number;
      liquidado?: 'ab' | 'at' | 'pg'; // ab = Em aberto, at = Em atraso, pg = Confirmado
      plano_contas_id?: number;
      centro_custo_id?: number;
      conta_bancaria_id?: number;
      forma_pagamento_id?: number;
      valor_inicio?: number;
      valor_fim?: number;
      limit?: number;
    } = {},
    currentPage: number = 1,
    allReceipts: GestaoClickTransaction[] = []
  ): Promise<GestaoClickTransaction[]> {
    try {
      // Construir a URL da API com a página atual
      const url = new URL(`${this.apiUrl}/recebimentos`);
      
      // Adicionar parâmetro de página
      url.searchParams.append('page', currentPage.toString());
      
      // Adicionar limite de registros por página (maior que o padrão)
      const resultsLimit = filters.limit || 2000;
      url.searchParams.append('limit', resultsLimit.toString());
      
      // Adicionar parâmetros de data se fornecidos
      if (startDate) {
        url.searchParams.append('data_inicio', startDate);
      }
      
      if (endDate) {
        url.searchParams.append('data_fim', endDate);
      }
      
      // Adicionar filtros adicionais
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
      
      // Realizar a chamada para a API
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar recebimentos: ${response.status}`);
      }
      
      const result = await response.json();
      // Log melhorado com verificações para evitar undefined
      const totalDaPagina = result?.meta?.total_da_pagina || 'N/A';
      const totalRegistros = result?.meta?.total_registros || 'N/A';
      console.log(`[GESTAO_CLICK] Resposta da API de recebimentos (página ${currentPage}): ${totalDaPagina} de ${totalRegistros} registros`);
      
      // Verificar a estrutura da resposta
      if (!result) {
        throw new Error('Resposta da API inválida');
      }
      
      // Nova estrutura de resposta com "data" dentro de um objeto
      let receiptItems = [];
      let nextPage = null;
      let totalPages = 1;
      
      if (Array.isArray(result)) {
        // Formato antigo: array direto
        receiptItems = result;
        // Sem informações de paginação no formato antigo
      } else if (result.data && Array.isArray(result.data)) {
        // Novo formato: objeto com array data
        receiptItems = result.data;
        
        // Extrair informações de paginação, se disponíveis
        if (result.meta) {
          nextPage = result.meta.proxima_pagina;
          totalPages = Math.ceil(result.meta.total_registros / result.meta.limite_por_pagina);
          
          console.log(`[GESTAO_CLICK] Paginação de recebimentos: página ${result.meta.pagina_atual} de ${totalPages} (${result.meta.total_registros} registros totais)`);
        }
      } else {
        throw new Error('Resposta da API não contém um array de recebimentos');
      }
      
      // Transformar os dados para o formato esperado
      const transformedReceipts = receiptItems.map((item: any) => this.transformReceiptToTransaction(item));
      
      // Adicionar os recebimentos desta página ao acumulador
      const currentReceipts = [...allReceipts, ...transformedReceipts];
      
      // Se houver próxima página e não estamos no limite de paginação (evitar loops infinitos)
      if (nextPage && currentPage < Math.min(totalPages, 200)) { // Aumentar o limite de 100 para 200 páginas
        console.log(`[GESTAO_CLICK] Buscando próxima página de recebimentos: ${nextPage}`);
        
        // Pausa para evitar sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Buscar próxima página recursivamente
        return this.fetchReceipts(startDate, endDate, filters, nextPage, currentReceipts);
      }
      
      // Retornar todos os recebimentos acumulados
      return currentReceipts;
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro ao buscar recebimentos:', error);
      throw error;
    }
  }
  
  /**
   * Transforma um pagamento em uma transação no formato da aplicação
   * @param payment Pagamento do Gestão Click
   * @returns Transação no formato da aplicação
   */
  private transformPaymentToTransaction(payment: any): GestaoClickTransaction {
    if (!payment || !payment.id) {
      throw new Error('Pagamento inválido ou sem ID');
    }
    
    // Extração segura de valores com verificação de undefined/null
    const safeGet = (obj: any, prop: string, defaultValue: any = null) => {
      return obj && obj[prop] !== undefined && obj[prop] !== null ? obj[prop] : defaultValue;
    };
    
    // Tratar valor numérico com segurança
    let valor = 0;
    try {
      const valorStr = (safeGet(payment, 'valor', '0')).toString().replace(',', '.');
      valor = parseFloat(valorStr);
      if (isNaN(valor)) valor = 0;
    } catch (e) {
      console.warn(`[GESTAO_CLICK] Erro ao converter valor do pagamento ${payment.id}:`, e);
      valor = 0;
    }
    
    // Extrair categoria do plano de contas com segurança
    const categoriaNome = safeGet(payment, 'nome_plano_conta') || 
                          safeGet(payment, 'plano_conta', {}).nome || 
                          safeGet(payment, 'categoria', {}).nome || 
                          'Despesas Gerais';
    
    // Extrair dados da conta bancária com segurança
    const contaBancaria = {
      id: (safeGet(payment, 'conta_bancaria_id', '') || '').toString(),
      nome: safeGet(payment, 'nome_conta_bancaria') || 
            safeGet(payment, 'conta_bancaria', {}).nome || 
            'Conta não especificada'
    };
    
    // Extrair centro de custo com segurança
    const centroCusto = safeGet(payment, 'nome_centro_custo') || 
                         safeGet(payment, 'centro_custo', {}).nome || 
                         '';
    
    // Extrair forma de pagamento com segurança
    const formaPagamento = safeGet(payment, 'nome_forma_pagamento') || 
                            safeGet(payment, 'forma_pagamento', {}).nome || 
                            safeGet(payment, 'forma_pagamento') || 
                            'Outros';
    
    // Mapear status de liquidação com segurança
    let status: 'PENDENTE' | 'PAGO' | 'CANCELADO' = 'PENDENTE';
    const liquidado = safeGet(payment, 'liquidado');
    if (liquidado === 'pg' || liquidado === '1' || liquidado === 1) {
      status = 'PAGO';
    } else if (safeGet(payment, 'status') && this.mapPaymentStatus(safeGet(payment, 'status')) === 'CANCELADO') {
      status = 'CANCELADO';
    }
    
    // Data com verificação de valores undefined
    const data = safeGet(payment, 'data_competencia') || 
                 safeGet(payment, 'data_vencimento') || 
                 safeGet(payment, 'data_liquidacao') || 
                 safeGet(payment, 'data_pagamento') || 
                 new Date().toISOString();
    
    // Extrair campos adicionais com segurança
    const codigo = safeGet(payment, 'codigo');
    const cliente_id = safeGet(payment, 'cliente_id');
    const nome_cliente = safeGet(payment, 'nome_cliente');
    const fornecedor_id = safeGet(payment, 'fornecedor_id');
    const nome_fornecedor = safeGet(payment, 'nome_fornecedor');
    const loja_id = safeGet(payment, 'loja_id');
    const nome_loja = safeGet(payment, 'nome_loja');
    
    // Criar objeto de retorno com dados tratados
    return {
      id: payment.id.toString(),
      codigo: codigo ? codigo.toString() : undefined,
      descricao: safeGet(payment, 'descricao') || safeGet(payment, 'nome') || 'Pagamento sem descrição',
      valor: Math.abs(valor),
      data,
      tipo: 'DESPESA',
      categoria: categoriaNome,
      contaBancaria,
      centroCusto,
      formaPagamento,
      status,
      
      // Campos adicionais com segurança
      clienteId: cliente_id ? cliente_id.toString() : undefined,
      clienteNome: nome_cliente,
      fornecedorId: fornecedor_id ? fornecedor_id.toString() : undefined,
      fornecedorNome: nome_fornecedor,
      lojaId: loja_id ? loja_id.toString() : undefined,
      lojaNome: nome_loja,
      
      // Metadata tratada para garantir que não há referências circulares
      metadata: {
        codigo,
        plano_contas_id: safeGet(payment, 'plano_contas_id'),
        data_competencia: safeGet(payment, 'data_competencia'),
        data_vencimento: safeGet(payment, 'data_vencimento'),
        data_liquidacao: safeGet(payment, 'data_liquidacao'),
        data_pagamento: safeGet(payment, 'data_pagamento'),
        juros: safeGet(payment, 'juros'),
        desconto: safeGet(payment, 'desconto'),
        valor_total: safeGet(payment, 'valor_total'),
        liquidado: safeGet(payment, 'liquidado'),
        cliente_id,
        nome_cliente,
        fornecedor_id,
        nome_fornecedor,
        loja_id,
        nome_loja,
        // Incluir outros campos relevantes do payment de forma segura
        id: safeGet(payment, 'id'),
        observacao: safeGet(payment, 'observacao'),
        valor: safeGet(payment, 'valor')
      }
    };
  }
  
  /**
   * Transforma um recebimento em uma transação no formato da aplicação
   * @param receipt Recebimento do Gestão Click
   * @returns Transação no formato da aplicação
   */
  private transformReceiptToTransaction(receipt: any): GestaoClickTransaction {
    if (!receipt || !receipt.id) {
      throw new Error('Recebimento inválido ou sem ID');
    }
    
    // Log detalhado para diagnóstico
    console.log(`[GESTAO_CLICK] Processando recebimento ID ${receipt.id}`);
    
    // Reutilizar a função safeGet definida no método anterior
    const safeGet = (obj: any, prop: string, defaultValue: any = null) => {
      return obj && obj[prop] !== undefined && obj[prop] !== null ? obj[prop] : defaultValue;
    };
    
    // Tratar valor numérico com segurança
    let valor = 0;
    try {
      const valorStr = (safeGet(receipt, 'valor', '0')).toString().replace(',', '.');
      valor = parseFloat(valorStr);
      if (isNaN(valor)) valor = 0;
    } catch (e) {
      console.warn(`[GESTAO_CLICK] Erro ao converter valor do recebimento ${receipt.id}:`, e);
      valor = 0;
    }
    
    // Extrair categoria do plano de contas com segurança
    const categoriaNome = safeGet(receipt, 'nome_plano_conta') || 
                          safeGet(receipt, 'plano_conta', {}).nome || 
                          safeGet(receipt, 'categoria', {}).nome || 
                          'Receitas Gerais';
    
    // Extrair dados da conta bancária com segurança
    const contaBancaria = {
      id: (safeGet(receipt, 'conta_bancaria_id', '') || '').toString(),
      nome: safeGet(receipt, 'nome_conta_bancaria') || 
            safeGet(receipt, 'conta_bancaria', {}).nome || 
            'Conta não especificada'
    };
    
    // Extrair centro de custo com segurança
    const centroCusto = safeGet(receipt, 'nome_centro_custo') || 
                        safeGet(receipt, 'centro_custo', {}).nome || 
                        '';
    
    // Extrair forma de pagamento com segurança
    const formaPagamento = safeGet(receipt, 'nome_forma_pagamento') || 
                           safeGet(receipt, 'forma_pagamento', {}).nome || 
                           safeGet(receipt, 'forma_pagamento') || 
                           'Outros';
    
    // Mapear status de liquidação com segurança
    let status: 'PENDENTE' | 'PAGO' | 'CANCELADO' = 'PENDENTE';
    const liquidado = safeGet(receipt, 'liquidado');
    if (liquidado === 'pg' || liquidado === '1' || liquidado === 1) {
      status = 'PAGO';
    } else if (safeGet(receipt, 'status') && this.mapReceiptStatus(safeGet(receipt, 'status')) === 'CANCELADO') {
      status = 'CANCELADO';
    }
    
    // Data com verificação de valores undefined
    const data = safeGet(receipt, 'data_competencia') || 
                 safeGet(receipt, 'data_vencimento') || 
                 safeGet(receipt, 'data_liquidacao') || 
                 safeGet(receipt, 'data_pagamento') || 
                 new Date().toISOString();
    
    // Extrair campos adicionais com segurança
    const codigo = safeGet(receipt, 'codigo');
    const cliente_id = safeGet(receipt, 'cliente_id');
    const nome_cliente = safeGet(receipt, 'nome_cliente');
    const fornecedor_id = safeGet(receipt, 'fornecedor_id');
    const nome_fornecedor = safeGet(receipt, 'nome_fornecedor');
    const loja_id = safeGet(receipt, 'loja_id');
    const nome_loja = safeGet(receipt, 'nome_loja');
    
    // Criar objeto de retorno com dados tratados
    const transaction: GestaoClickTransaction = {
      id: receipt.id.toString(),
      codigo: codigo ? codigo.toString() : undefined,
      descricao: safeGet(receipt, 'descricao') || safeGet(receipt, 'nome') || 'Recebimento sem descrição',
      valor: Math.abs(valor),
      data,
      tipo: 'RECEITA', // Garantir que TODOS os recebimentos sejam marcados como RECEITA
      categoria: categoriaNome,
      contaBancaria,
      centroCusto,
      formaPagamento,
      status,
      
      // Campos adicionais com segurança
      clienteId: cliente_id ? cliente_id.toString() : undefined,
      clienteNome: nome_cliente,
      fornecedorId: fornecedor_id ? fornecedor_id.toString() : undefined,
      fornecedorNome: nome_fornecedor,
      lojaId: loja_id ? loja_id.toString() : undefined,
      lojaNome: nome_loja,
      
      // Metadata tratada para garantir que não há referências circulares
      metadata: {
        codigo,
        plano_contas_id: safeGet(receipt, 'plano_contas_id'),
        data_competencia: safeGet(receipt, 'data_competencia'),
        data_vencimento: safeGet(receipt, 'data_vencimento'),
        data_liquidacao: safeGet(receipt, 'data_liquidacao'),
        data_pagamento: safeGet(receipt, 'data_pagamento'),
        juros: safeGet(receipt, 'juros'),
        desconto: safeGet(receipt, 'desconto'),
        valor_total: safeGet(receipt, 'valor_total'),
        liquidado: safeGet(receipt, 'liquidado'),
        cliente_id,
        nome_cliente,
        fornecedor_id,
        nome_fornecedor,
        loja_id,
        nome_loja,
        // Incluir outros campos relevantes do receipt de forma segura
        id: safeGet(receipt, 'id'),
        observacao: safeGet(receipt, 'observacao'),
        valor: safeGet(receipt, 'valor')
      }
    };
    
    // Log para debug
    console.log(`[GESTAO_CLICK] Recebimento ${receipt.id} processado: ${transaction.descricao}, R$ ${transaction.valor}, tipo ${transaction.tipo}`);
    
    return transaction;
  }
  
  /**
   * Mapeia o status de um pagamento para o formato da aplicação
   * @param status Status do pagamento
   * @returns Status no formato da aplicação
   */
  private mapPaymentStatus(status: string | undefined): 'PENDENTE' | 'PAGO' | 'CANCELADO' {
    if (!status) return 'PENDENTE';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('pag') || statusLower.includes('quit')) {
      return 'PAGO';
    } else if (statusLower.includes('cancel')) {
      return 'CANCELADO';
    }
    
    return 'PENDENTE';
  }
  
  /**
   * Mapeia o status de um recebimento para o formato da aplicação
   * @param status Status do recebimento
   * @returns Status no formato da aplicação
   */
  private mapReceiptStatus(status: string | undefined): 'PENDENTE' | 'PAGO' | 'CANCELADO' {
    if (!status) return 'PENDENTE';
    
    status = status.toLowerCase();
    
    if (status === 'em aberto' || status === 'pendente') {
      return 'PENDENTE';
    } else if (status === 'confirmado' || status === 'pago' || status === 'compensado') {
      return 'PAGO';
    } else if (status === 'cancelado') {
      return 'CANCELADO';
    }
    
    return 'PENDENTE';
  }
  
  /**
   * Gera transações simuladas para demonstração
   * @returns Lista de transações simuladas
   */
  private generateSimulatedTransactions(): GestaoClickTransaction[] {
    console.log('[GESTAO_CLICK] Gerando transações simuladas para demonstração');
    
    const simulatedTransactions: GestaoClickTransaction[] = [];
    const categories = ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Moradia', 'Outros'];
    const descriptions = [
      'Supermercado', 'Restaurante', 'Combustível', 'Uber', 'Farmácia', 
      'Curso', 'Cinema', 'Aluguel', 'Internet', 'Energia', 'Água'
    ];
    const paymentMethods = [
      'Dinheiro',
      'Cartão de Crédito',
      'Cartão de Débito',
      'PIX',
      'Transferência',
      'Boleto'
    ];
    
    // Gerar algumas transações aleatórias
    for (let i = 0; i < 10; i++) {
      const isReceita = Math.random() > 0.6;
      const value = Math.floor(Math.random() * 1000) + 10;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      
      simulatedTransactions.push({
        id: `sim-${Date.now()}-${i}`,
        descricao: `${description} ${i+1}`,
        valor: value,
        data: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        tipo: isReceita ? 'RECEITA' : 'DESPESA',
        categoria: category,
        contaBancaria: 'Conta Simulada',
        formaPagamento: paymentMethod,
        status: 'PAGO',
        metadata: { simulated: true }
      });
    }
    
    return simulatedTransactions;
  }

  /**
   * Importa transações do Gestão Click para a carteira especificada
   * @param walletId ID da carteira para importar as transações
   * @param options Opções de importação
   * @returns Resultado da importação
   */
  async importTransactions(walletId: string, options: {
    startDate: string;
    endDate: string;
    filterCategories?: string[];
    filterAccounts?: string[];
    // Filtros adicionais para a API do Gestão Click
    apiFilters?: {
      loja_id?: number;
      cliente_id?: number;
      fornecedor_id?: number;
      liquidado?: 'ab' | 'at' | 'pg';
      plano_contas_id?: number;
      centro_custo_id?: number;
      conta_bancaria_id?: number;
      forma_pagamento_id?: number;
      valor_inicio?: number;
      valor_fim?: number;
      limit?: number;
      maxTransactions?: number; // Limite máximo total de transações
    };
  }): Promise<{
    totalImported: number;
    details: {
      periodo: {
        inicio: string;
        fim: string;
      };
      processadas: number;
      receitas: number;
      despesas: number;
      ignoradas: number;
      importadas: number;
      paginasProcessadas: {
        pagamentos: number;
        recebimentos: number;
      };
    };
  }> {
    try {
      if (!walletId) {
        throw new Error('ID da carteira não especificado');
      }
      
      // Log de início da importação
      console.log(`[GESTAO_CLICK] Iniciando importação para carteira ${walletId}`);
      console.log(`[GESTAO_CLICK] Período: ${options.startDate} até ${options.endDate}`);
      
      // Definir filtros da API
      const apiFilters = options.apiFilters || {};
      
      // Aumentar o limite máximo total de transações
      const maxTransactions = apiFilters.maxTransactions || 20000; // Aumentar de 10000 para 20000
      console.log(`[GESTAO_CLICK] Limite máximo de transações: ${maxTransactions}`);
      
      // Obter as transações do Gestão Click com paginação
      const startTime = Date.now();
      console.log('[GESTAO_CLICK] Buscando transações com paginação...');
      
      const transactions = await this.getTransactions(
        new Date(options.startDate), 
        new Date(options.endDate),
        apiFilters
      );
      
      const duracao = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[GESTAO_CLICK] ${transactions.length} transações encontradas em ${duracao}s`);
      
      // Se exceder o limite máximo, truncar as transações
      let filteredTransactions = transactions;
      if (transactions.length > maxTransactions) {
        console.log(`[GESTAO_CLICK] Limitando a ${maxTransactions} transações do total de ${transactions.length}`);
        filteredTransactions = transactions.slice(0, maxTransactions);
      }
      
      // Aplicar filtros se especificados
      if (options.filterCategories && options.filterCategories.length > 0) {
        filteredTransactions = this.filterTransactionsByCategory(filteredTransactions, options.filterCategories);
      }
      
      if (options.filterAccounts && options.filterAccounts.length > 0) {
        filteredTransactions = this.filterTransactionsByAccount(filteredTransactions, options.filterAccounts);
      }
      
      console.log(`[GESTAO_CLICK] ${filteredTransactions.length} transações após aplicar filtros`);
      
      // Contadores para estatísticas
      const receitas = filteredTransactions.filter(tx => tx.tipo === 'RECEITA').length;
      const despesas = filteredTransactions.filter(tx => tx.tipo === 'DESPESA').length;
      
      // Importar categorias se necessário
      if (filteredTransactions.length > 0) {
        try {
          await this.importCategories(filteredTransactions, this.userId);
          console.log('[GESTAO_CLICK] Categorias importadas com sucesso');
        } catch (error) {
          console.error('[GESTAO_CLICK] Erro ao importar categorias:', error);
        }
      }
      
      // Converter para o formato da aplicação
      const transactionsToImport = filteredTransactions.map(tx => ({
        description: tx.descricao,
        amount: tx.tipo === 'DESPESA' ? -tx.valor : tx.valor,
        date: new Date(tx.data),
        type: tx.tipo,
        category: this.mapCategoryToEnum(tx.categoria),
        status: tx.status || 'PENDENTE',
        source: {
          name: 'GESTAO_CLICK',
          externalId: tx.id,
          data: {
            ...tx.metadata,
            codigo: tx.codigo,
            clienteId: tx.clienteId,
            clienteNome: tx.clienteNome,
            fornecedorId: tx.fornecedorId,
            fornecedorNome: tx.fornecedorNome,
            lojaId: tx.lojaId,
            lojaNome: tx.lojaNome
          }
        }
      }));
      
      // Importar transações para a carteira
      console.log(`[GESTAO_CLICK] Importando ${transactionsToImport.length} transações para a carteira ${walletId}...`);
      
      // Construir URL absoluta para a API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : '');
      const apiUrl = `${baseUrl}/api/transactions/import`;
      console.log(`[GESTAO_CLICK] URL da API de importação: ${apiUrl}`);
      
      // Obter a chave de API para autenticação entre serviços
      const apiKey = process.env.API_SECRET_KEY || 'contarapida_internal_api_key';
      
      const result = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          walletId,
          userId: this.userId, // Incluir o userId para autenticação via API
          transactions: transactionsToImport,
          source: 'GESTAO_CLICK'
        }),
      });
      
      if (!result.ok) {
        const errorText = await result.text();
        throw new Error(`Erro ao importar transações: ${result.status} - ${errorText}`);
      }
      
      const importResult = await result.json();
      console.log('[GESTAO_CLICK] Resultado da importação:', importResult);
      
      // Salvar configurações da integração
      await this.storeIntegrationSettings(walletId, {
        apiKey: this.apiKey,
        secretToken: this.secretToken,
        apiUrl: this.apiUrl,
        lastSync: new Date().toISOString()
      });
      
      return {
        totalImported: importResult.count || 0,
        details: {
          periodo: {
            inicio: options.startDate,
            fim: options.endDate
          },
          processadas: filteredTransactions.length,
          receitas,
          despesas,
          ignoradas: filteredTransactions.length - (importResult.count || 0),
          importadas: importResult.count || 0,
          paginasProcessadas: {
            pagamentos: Math.ceil(despesas / (apiFilters.limit || 20)),
            recebimentos: Math.ceil(receitas / (apiFilters.limit || 20))
          }
        }
      };
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro na importação de transações:', error);
      
      // Adicionar detalhes do erro para facilitar diagnóstico
      if (error.message && error.message.includes('category')) {
        console.error('[GESTAO_CLICK] Erro relacionado à categoria. Verifique o mapeamento de categorias.');
        
        // Se o erro contiver informações sobre a categoria específica, extrair e logar
        const categoryMatch = error.message.match(/category.*?(['"].*?['"])/i);
        if (categoryMatch && categoryMatch[1]) {
          console.error(`[GESTAO_CLICK] Categoria problemática: ${categoryMatch[1]}`);
        }
      }
      
      throw new Error(`Falha na importação: ${error.message}`);
    }
  }

  /**
   * Importa categorias do Gestão Click para o sistema
   * @param transactions Transações com categorias
   * @param userId ID do usuário
   */
  private async importCategories(transactions: GestaoClickTransaction[], userId: string): Promise<void> {
    try {
      // Extrair categorias únicas das transações
      const uniqueCategories = new Set<string>();
      
      transactions.forEach(tx => {
        if (tx.categoria && tx.categoria.trim() !== '') {
          uniqueCategories.add(tx.categoria.trim());
        }
      });

      // Se não houver categorias, não fazer nada
      if (uniqueCategories.size === 0) return;

      console.log(`[GESTAO_CLICK] Importando ${uniqueCategories.size} categorias exatamente como estão no Gestão Click`);

      // Verificar mapeamentos já existentes para o usuário
      const existingMappings = await prisma.categoryMapping.findMany({
        where: {
          userId: userId,
          source: "GESTAO_CLICK"
        }
      });

      // Criar um conjunto de categorias externas já mapeadas
      const existingExternalCategories = new Set(
        existingMappings.map(mapping => mapping.externalCategory.toLowerCase())
      );

      // Filtrar apenas categorias não mapeadas
      const newCategories = Array.from(uniqueCategories).filter(
        cat => !existingExternalCategories.has(cat.toLowerCase())
      );

      console.log(`[GESTAO_CLICK] ${newCategories.length} novas categorias para importar`);
      
      // Para cada categoria nova, criar um mapeamento direto (sem transformação)
      if (newCategories.length > 0) {
        // Criar registros para cada categoria
        const categoryMappings = newCategories.map(category => ({
          userId: userId,
          externalCategory: category,
          internalCategory: category, // Usar a mesma categoria como interna
          source: "GESTAO_CLICK",
          priority: 50, // Prioridade padrão
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        // Inserir mapeamentos no banco de dados
        await prisma.categoryMapping.createMany({
          data: categoryMappings,
          skipDuplicates: true
        });
        
        console.log(`[GESTAO_CLICK] ${categoryMappings.length} novas categorias importadas com sucesso`);
      }
    } catch (error) {
      console.error('[GESTAO_CLICK] Erro ao importar categorias:', error);
    }
  }

  /**
   * Encontra a melhor categoria interna correspondente para uma categoria externa
   * @param externalCategory Nome da categoria externa do Gestão Click
   * @param internalCategories Lista de categorias internas disponíveis
   * @returns A melhor categoria interna correspondente ou uma categoria padrão
   */
  private findBestMatchingCategory(externalCategory: string, internalCategories: any[]): any {
    // Normalizar a categoria externa
    const normalizedExternal = externalCategory.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    
    // Tentar encontrar uma correspondência exata primeiro
    const exactMatch = internalCategories.find(
      c => c.name.toLowerCase() === normalizedExternal
    );
    
    if (exactMatch) return exactMatch;
    
    // Definir palavras-chave para mapear para categorias internas
    const keywordMap: { [key: string]: string } = {
      'venda': 'VENDAS_PRODUTOS',
      'balcao': 'VENDAS_BALCAO',
      'entrega': 'DELIVERY',
      'delivery': 'DELIVERY',
      'salario': 'REMUNERACAO_FUNCIONARIOS',
      'remuneracao': 'REMUNERACAO_FUNCIONARIOS',
      'funcionario': 'REMUNERACAO_FUNCIONARIOS',
      'fgts': 'ENCARGOS_FGTS',
      'inss': 'ENCARGOS_INSS',
      'alimentacao': 'ENCARGOS_ALIMENTACAO',
      'vale refeicao': 'ENCARGOS_ALIMENTACAO',
      'vale transporte': 'ENCARGOS_VALE_TRANSPORTE',
      'transporte': 'ENCARGOS_VALE_TRANSPORTE',
      '13': 'ENCARGOS_13_SALARIO',
      'rescisao': 'ENCARGOS_RESCISOES',
      'exame': 'ENCARGOS_EXAMES',
      'ferias': 'FERIAS',
      'estoque': 'REPOSICAO_ESTOQUE',
      'reposicao': 'REPOSICAO_ESTOQUE',
      'compra': 'COMPRAS',
      'manutencao': 'MANUTENCAO_EQUIPAMENTOS',
      'equipamento': 'AQUISICAO_EQUIPAMENTOS',
      'escritorio': 'MATERIAL_ESCRITORIO',
      'reforma': 'MATERIAL_REFORMA',
      'marketing': 'MARKETING_PUBLICIDADE',
      'publicidade': 'MARKETING_PUBLICIDADE',
      'telefone': 'TELEFONIA_INTERNET',
      'internet': 'TELEFONIA_INTERNET',
      'energia': 'ENERGIA_AGUA',
      'agua': 'ENERGIA_AGUA',
      'luz': 'ENERGIA_AGUA',
      'frete': 'TRANSPORTADORA',
      'contabilidade': 'CONTABILIDADE',
      'contador': 'CONTABILIDADE',
      'troco': 'TROCO'
    };
    
    // Procurar por palavras-chave na categoria externa
    for (const [keyword, internalName] of Object.entries(keywordMap)) {
      if (normalizedExternal.includes(keyword)) {
        // Encontrar a categoria interna pelo nome
        const matchingCategory = internalCategories.find(
          c => c.name.toUpperCase() === internalName
        );
        
        if (matchingCategory) return matchingCategory;
      }
    }
    
    // Se não encontrar nenhuma correspondência, verificar pelo tipo da categoria
    const lowerName = normalizedExternal;
    let preferredType = "EXPENSE";
    
    if (lowerName.includes("receita") || 
        lowerName.includes("entrada") || 
        lowerName.includes("salario") || 
        lowerName.includes("venda") || 
        lowerName.includes("income")) {
      preferredType = "INCOME";
    }
    
    // Tentar encontrar qualquer categoria do tipo correto
    const matchByType = internalCategories.find(c => c.type === preferredType);
    if (matchByType) return matchByType;
    
    // Se ainda não encontrou, retornar a primeira categoria disponível ou uma padrão
    return internalCategories[0] || { id: 'OTHER', name: 'OTHER' };
  }

  /**
   * Obtém os saldos de contas bancárias do Gestão Click
   * @returns Saldos das contas
   */
  async getAccountBalances(): Promise<any[]> {
    try {
      // Construir a URL da API
      const url = new URL(`${this.apiUrl}/contas_bancarias/saldos`);
      
      // Realizar a chamada para a API
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar saldos: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[GESTAO_CLICK] Resposta da API de saldos:', data);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Resposta da API não contém um array de saldos');
      }
      
      return data;
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro ao buscar saldos:', error);
      throw new Error(`Falha ao buscar saldos das contas do Gestão Click: ${error.message}`);
    }
  }

  /**
   * Obtém as contas bancárias disponíveis no Gestão Click
   * @returns Lista de contas bancárias
   */
  async getBankAccounts(): Promise<GestaoClickAccount[]> {
    try {
      // Obter a URL para consulta de contas bancárias
      const url = new URL(`${this.apiUrl}/contas_bancarias`);
      
      // Realizar a chamada para a API
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar contas bancárias: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[GESTAO_CLICK] Resposta da API de contas bancárias:', result);
      
      // Verificar se a resposta contém a estrutura esperada
      if (!result || !result.data || !Array.isArray(result.data)) {
        throw new Error('Resposta da API não contém um array de contas bancárias');
      }
      
      return result.data;
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro ao buscar contas bancárias:', error);
      throw new Error(`Falha ao buscar contas bancárias do Gestão Click: ${error.message}`);
    }
  }

  /**
   * Obtém os centros de custo disponíveis no Gestão Click
   * @returns Lista de centros de custo
   */
  async getCostCenters(): Promise<GestaoClickCostCenter[]> {
    try {
      const url = `${this.apiUrl}/centros_custos`;
      console.log(`[GESTAO_CLICK] Buscando centros de custo em: ${url}`);
      
      // Realizar a chamada para a API
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar centros de custo: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[GESTAO_CLICK] Resposta da API de centros de custo:', data);
      
      // Verificar se a resposta é um array direto ou está dentro de data
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.data)) {
        return data.data;
      }
      
      throw new Error('Resposta da API não contém um array de centros de custo');
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro ao buscar centros de custo:', error);
      throw new Error(`Falha ao buscar centros de custo do Gestão Click: ${error.message}`);
    }
  }

  /**
   * Mapeia o nome do banco do Gestão Click para o banco correspondente no sistema
   * @param bankName Nome do banco no Gestão Click
   * @returns Objeto com bankId e logo
   */
  private async mapBankNameToSystemBank(bankName?: string): Promise<{ bankId: string | null; logo: string | null }> {
    if (!bankName) {
      return { bankId: null, logo: null };
    }
    
    try {
      // Normalizar o nome do banco
      const normalizedName = bankName.toLowerCase().trim();
      
      // Buscar todos os bancos do sistema
      const banks = await prisma.bank.findMany();
      
      // Mapeamento de nomes comuns de bancos para variações de texto
      const bankNamePatterns: Record<string, string[]> = {
        'banco do brasil': ['bb', 'bco brasil', 'bco do brasil', 'banco brasil'],
        'itau': ['itaú', 'itau unibanco', 'itaú unibanco'],
        'bradesco': ['bradesco'],
        'santander': ['banco santander', 'santander brasil'],
        'caixa economica federal': ['caixa', 'cef', 'caixa econômica', 'cx economica'],
        'nubank': ['nu', 'nubank'],
        'inter': ['banco inter', 'intermedium'],
        'c6 bank': ['c6'],
        'banco original': ['original'],
        'sicoob': ['sicoob'],
        'sicredi': ['sicredi']
      };
      
      // Função para verificar correspondência pelo nome no padrão
      const findBankByPattern = (): string | null => {
        for (const [bankKey, patterns] of Object.entries(bankNamePatterns)) {
          if (patterns.some(pattern => normalizedName.includes(pattern.toLowerCase()))) {
            // Encontrar o banco no sistema com nome correspondente
            const bank = banks.find(b => 
              b.name.toLowerCase() === bankKey || 
              bankKey.includes(b.name.toLowerCase())
            );
            
            return bank?.id || null;
          }
        }
        return null;
      };
      
      // Tentar encontrar por correspondência exata
      const exactMatch = banks.find(bank => 
        bank.name.toLowerCase() === normalizedName ||
        normalizedName.includes(bank.name.toLowerCase())
      );
      
      if (exactMatch) {
        return { bankId: exactMatch.id, logo: exactMatch.logo };
      }
      
      // Tentar encontrar por padrão
      const patternMatchId = findBankByPattern();
      if (patternMatchId) {
        const bank = banks.find(b => b.id === patternMatchId);
        return { bankId: patternMatchId, logo: bank?.logo || null };
      }
      
      // Não encontrou correspondência
      return { bankId: null, logo: null };
    } catch (error) {
      console.error(`[GESTAO_CLICK] Erro ao mapear banco ${bankName}:`, error);
      return { bankId: null, logo: null };
    }
  }

  /**
   * Cria carteiras no sistema a partir das contas bancárias do Gestão Click
   * @returns Resultado da criação de carteiras
   */
  async createWalletsFromAccounts(): Promise<GestaoClickWalletCreationResult> {
    try {
      console.log('[GESTAO_CLICK] Iniciando criação de carteiras a partir de contas bancárias');
      
      // Obter contas bancárias do Gestão Click
      const accounts = await this.getBankAccounts();
      console.log(`[GESTAO_CLICK] ${accounts.length} contas bancárias encontradas`);
      
      // Se não houver contas, retornar resultado vazio
      if (!accounts || accounts.length === 0) {
        console.log('[GESTAO_CLICK] Nenhuma conta bancária encontrada para importar');
        return {
          totalCreated: 0,
          skipped: 0,
          wallets: []
        };
      }
      
      // Em ambiente de desenvolvimento, garantir que temos um usuário para testes
      await this.ensureTestUser();
      
      // Verificar se o userId é válido
      if (!this.userId || this.userId === 'test-user-id') {
        console.warn('[GESTAO_CLICK] Não foi possível criar carteiras: userId inválido ou não definido', this.userId);
        return {
          totalCreated: 0,
          skipped: accounts.length,
          wallets: []
        };
      }
      
      // Verificar se o usuário existe no banco de dados
      const userExists = await prisma.user.findUnique({
        where: { id: this.userId },
        select: { id: true }
      });
      
      if (!userExists) {
        console.error(`[GESTAO_CLICK] Usuário não encontrado com ID ${this.userId}. Não é possível criar carteiras.`);
        return {
          totalCreated: 0,
          skipped: accounts.length,
          wallets: []
        };
      }
      
      // Obter carteiras de contas bancárias já existentes para este usuário
      const existingWallets = await prisma.wallet.findMany({
        where: {
          userId: this.userId,
          type: "GESTAO_CLICK" // Apenas carteiras de contas bancárias
        },
        select: {
          id: true,
          name: true,
          metadata: true
        }
      });
      
      // Mapear IDs de contas já importadas
      const existingAccountIds = new Set(
        existingWallets.map(wallet => {
          try {
            // @ts-ignore - O Prisma trata o campo metadata como any
            return wallet.metadata?.gestaoClickId;
          } catch (e) {
            console.warn('[GESTAO_CLICK] Erro ao acessar metadata de carteira:', e);
            return null;
          }
        }).filter(Boolean)
      );
      
      console.log(`[GESTAO_CLICK] ${existingAccountIds.size} carteiras já existentes com contas do Gestão Click`);
      
      // Filtrar apenas contas novas e ativas
      const newAccounts = accounts.filter(account => {
        // Verificar se não está na lista de contas já importadas
        const isNew = !existingAccountIds.has(account.id);
        
        // Logar detalhes da conta para diagnóstico
        console.log(`[GESTAO_CLICK] Conta: ${account.nome}, ID: ${account.id}, Ativo: ${JSON.stringify(account.ativo)}, Nova: ${isNew}`);
        
        // Importar todas as contas que não existem ainda, independentemente do status
        return isNew;
      });
      
      console.log(`[GESTAO_CLICK] ${newAccounts.length} novas contas bancárias para importar`);
      
      // Resultado da criação
      const result: GestaoClickWalletCreationResult = {
        totalCreated: 0,
        skipped: accounts.length - newAccounts.length,
        wallets: []
      };
      
      // Se não houver novas contas, retornar
      if (newAccounts.length === 0) {
        // Adicionar as carteiras existentes ao resultado
        existingWallets.forEach(wallet => {
          try {
            // @ts-ignore - O Prisma trata o campo metadata como any
            const accountId = wallet.metadata?.gestaoClickId;
            const account = accounts.find(a => a.id === accountId);
            
            if (account) {
              result.wallets.push({
                id: wallet.id,
                name: wallet.name,
                type: "GESTAO_CLICK", // Tipo específico para contas bancárias
                balance: account.saldo,
                isNew: false
              });
            }
          } catch (e) {
            console.warn('[GESTAO_CLICK] Erro ao processar carteira existente:', e);
          }
        });
        
        return result;
      }
      
      // Criar novas carteiras
      for (const account of newAccounts) {
        try {
          // Criar nome da carteira
          let walletName = account.nome;
          if (account.banco) {
            walletName = `${account.banco} - ${walletName}`;
          }
          
          // Mapear o banco para um banco do sistema
          const { bankId, logo } = await this.mapBankNameToSystemBank(account.banco);
          
          console.log(`[GESTAO_CLICK] Mapeamento de banco para conta bancária: ${account.banco} -> ID: ${bankId || 'Não encontrado'}, Logo: ${logo || 'Não encontrado'}`);
          
          // Criar a carteira
          const newWallet = await prisma.wallet.create({
            data: {
              name: walletName,
              balance: account.saldo,
              type: "GESTAO_CLICK", // Tipo específico para contas bancárias
              userId: this.userId,
              bankId: bankId, // Adicionado o ID do banco quando disponível
              metadata: {
                gestaoClickId: account.id,
                gestaoClickType: "ACCOUNT", // Identificar claramente como conta bancária
                gestaoClickBanco: account.banco,
                gestaoClickAgencia: account.agencia,
                gestaoClickConta: account.conta,
                gestaoClick: {
                  apiKey: this.apiKey,
                  secretToken: this.secretToken,
                  apiUrl: this.apiUrl,
                  lastSync: new Date().toISOString()
                }
              }
            }
          });
          
          console.log(`[GESTAO_CLICK] Carteira de conta bancária criada com sucesso: ${newWallet.id} - ${walletName} (Banco: ${bankId || 'Não vinculado'})`);
          
          // Adicionar ao resultado
          result.wallets.push({
            id: newWallet.id,
            name: newWallet.name,
            type: "GESTAO_CLICK", // Tipo consistente para contas bancárias
            balance: account.saldo,
            isNew: true
          });
          
          result.totalCreated++;
        } catch (error) {
          console.error(`[GESTAO_CLICK] Erro ao criar carteira para a conta ${account.id}:`, error);
        }
      }
      
      // Adicionar as carteiras existentes ao resultado
      existingWallets.forEach(wallet => {
        try {
          // @ts-ignore - O Prisma trata o campo metadata como any
          const accountId = wallet.metadata?.gestaoClickId;
          const account = accounts.find(a => a.id === accountId);
          
          if (account) {
            result.wallets.push({
              id: wallet.id,
              name: wallet.name,
              type: "GESTAO_CLICK", // Tipo consistente
              balance: account.saldo,
              isNew: false
            });
          }
        } catch (e) {
          console.warn('[GESTAO_CLICK] Erro ao processar carteira existente:', e);
        }
      });
      
      return result;
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro ao criar carteiras a partir de contas bancárias:', error);
      throw new Error(`Falha ao criar carteiras a partir do Gestão Click: ${error.message}`);
    }
  }

  /**
   * Cria centros de custo no sistema a partir dos centros de custo do Gestão Click
   * e estabelece a relação muitos para muitos com as carteiras bancárias
   * 
   * @returns Resultado da criação de centros de custo
   */
  async createWalletsFromCostCenters(): Promise<GestaoClickWalletCreationResult> {
    try {
      console.log('[GESTAO_CLICK] Iniciando importação de centros de custo');
      
      // Obter centros de custo do Gestão Click
      const costCenters = await this.getCostCenters();
      console.log(`[GESTAO_CLICK] ${costCenters.length} centros de custo encontrados`);
      
      // Se não houver centros de custo, retornar resultado vazio
      if (!costCenters || costCenters.length === 0) {
        console.log('[GESTAO_CLICK] Nenhum centro de custo encontrado para importar');
        return {
          totalCreated: 0,
          skipped: 0,
          wallets: []
        };
      }
      
      // Em ambiente de desenvolvimento, garantir que temos um usuário para testes
      await this.ensureTestUser();
      
      // Verificar se o userId é válido
      if (!this.userId || this.userId === 'test-user-id') {
        console.warn('[GESTAO_CLICK] Não foi possível criar centros de custo: userId inválido ou não definido', this.userId);
        return {
          totalCreated: 0,
          skipped: costCenters.length,
          wallets: []
        };
      }
      
      // Verificar se o usuário existe no banco de dados
      const userExists = await prisma.user.findUnique({
        where: { id: this.userId },
        select: { id: true }
      });
      
      if (!userExists) {
        console.error(`[GESTAO_CLICK] Usuário não encontrado com ID ${this.userId}. Não é possível criar centros de custo.`);
        return {
          totalCreated: 0,
          skipped: costCenters.length,
          wallets: []
        };
      }
      
      // Obter centros de custo já existentes para este usuário
      const existingCostCenters = await prisma.costCenter.findMany({
        where: {
          userId: this.userId,
          externalId: {
            in: costCenters.map(cc => cc.id)
          }
        },
        select: {
          id: true,
          externalId: true,
          name: true
        }
      });
      
      // Mapear IDs de centros de custo já importados
      const existingCostCenterIds = new Set(
        existingCostCenters.map(cc => cc.externalId).filter(Boolean)
      );
      
      console.log(`[GESTAO_CLICK] ${existingCostCenterIds.size} centros de custo já existentes`);
      
      // Filtrar apenas centros de custo novos e ativos
      const newCostCenters = costCenters.filter(center => {
        // Verificar se não está na lista de centros já importados
        const isNew = !existingCostCenterIds.has(center.id);
        
        // Logar detalhes do centro de custo para diagnóstico
        console.log(`[GESTAO_CLICK] Centro de custo: ${center.nome}, ID: ${center.id}, Ativo: ${JSON.stringify(center.ativo)}, Novo: ${isNew}`);
        
        // Importar todos os centros que não existem ainda, independentemente do status
        return isNew;
      });
      
      console.log(`[GESTAO_CLICK] ${newCostCenters.length} novos centros de custo para importar`);
      
      // Resultado da criação
      const result: GestaoClickWalletCreationResult = {
        totalCreated: 0,
        skipped: costCenters.length - newCostCenters.length,
        wallets: []
      };
      
      // Se não houver novos centros de custo, retornar apenas os existentes
      if (newCostCenters.length === 0) {
        // Adicionar os centros de custo existentes ao resultado (com formato compatível)
        existingCostCenters.forEach(cc => {
          const costCenter = costCenters.find(c => c.id === cc.externalId);
          
          if (costCenter) {
            result.wallets.push({
              id: cc.id,
              name: cc.name,
              type: "COST_CENTER", // Tipo diferente para identificar que é um centro de custo
              balance: 0, // Centros de custo não têm saldo
              isNew: false
            });
          }
        });
        
        return result;
      }
      
      // Obter todas as carteiras do tipo GESTAO_CLICK (contas bancárias) para estabelecer relações
      const bankWallets = await prisma.wallet.findMany({
        where: {
          userId: this.userId,
          type: "GESTAO_CLICK" // Apenas carteiras de contas bancárias
        },
        select: {
          id: true,
          name: true
        }
      });
      
      console.log(`[GESTAO_CLICK] ${bankWallets.length} carteiras bancárias encontradas para associar aos centros de custo`);
      
      // Criar novos centros de custo
      for (const costCenter of newCostCenters) {
        try {
          console.log(`[GESTAO_CLICK] Criando centro de custo: "${costCenter.nome}" (ID: ${costCenter.id})`);
          
          // Criar o centro de custo
          const newCostCenter = await prisma.costCenter.create({
            data: {
              name: costCenter.nome,
              description: costCenter.descricao,
              code: costCenter.codigo,
              externalId: costCenter.id,
              active: costCenter.ativo,
              userId: this.userId,
              metadata: {
                gestaoClickId: costCenter.id,
                gestaoClickType: "COST_CENTER",
                gestaoClick: {
                  apiKey: "***", // Não armazenamos o apiKey real
                  secretToken: "***", // Não armazenamos o secretToken real
                  apiUrl: this.apiUrl,
                  lastSync: new Date().toISOString()
                }
              }
            }
          });
          
          console.log(`[GESTAO_CLICK] Centro de custo criado com sucesso: ${newCostCenter.id} - ${newCostCenter.name}`);
          
          // Adicionar ao resultado
          result.wallets.push({
            id: newCostCenter.id,
            name: newCostCenter.name,
            type: "COST_CENTER", // Tipo para identificar que é um centro de custo
            balance: 0,
            isNew: true
          });
          
          // Estabelecer relações com todas as carteiras bancárias
          if (bankWallets.length > 0) {
            console.log(`[GESTAO_CLICK] Estabelecendo relações entre o centro de custo ${newCostCenter.name} e ${bankWallets.length} carteiras bancárias`);
            
            // Criar relações muitos para muitos
            const relations = bankWallets.map(wallet => ({
              costCenterId: newCostCenter.id,
              walletId: wallet.id
            }));
            
            // Criar as relações no banco de dados
            await prisma.costCenterWallet.createMany({
              data: relations,
              skipDuplicates: true
            });
            
            console.log(`[GESTAO_CLICK] ${relations.length} relações criadas para o centro de custo ${newCostCenter.name}`);
          }
          
          result.totalCreated++;
        } catch (error) {
          console.error(`[GESTAO_CLICK] Erro ao criar centro de custo ${costCenter.id}:`, error);
        }
      }
      
      // Adicionar os centros de custo existentes ao resultado
      existingCostCenters.forEach(cc => {
        const costCenter = costCenters.find(c => c.id === cc.externalId);
        
        if (costCenter) {
          result.wallets.push({
            id: cc.id,
            name: cc.name,
            type: "COST_CENTER", // Tipo diferente para identificar que é um centro de custo
            balance: 0,
            isNew: false
          });
        }
      });
      
      return result;
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro ao criar centros de custo:', error);
      throw new Error(`Falha ao criar centros de custo do Gestão Click: ${error.message}`);
    }
  }

  /**
   * Importa todas as carteiras do Gestão Click (contas bancárias e centros de custo)
   * @returns Resultado da criação de carteiras
   */
  async importAllWallets(): Promise<GestaoClickWalletCreationResult> {
    try {
      console.log('[GESTAO_CLICK] Iniciando importação de todas as carteiras do Gestão Click');
      
      // Criar carteiras a partir de contas bancárias
      let accountResult: GestaoClickWalletCreationResult = {
        totalCreated: 0,
        skipped: 0,
        wallets: []
      };
      
      try {
        accountResult = await this.createWalletsFromAccounts();
      } catch (error: any) {
        console.warn('[GESTAO_CLICK] Erro ao criar carteiras de contas bancárias:', error.message);
      }
      
      // Criar carteiras a partir de centros de custo
      let costCenterResult: GestaoClickWalletCreationResult = {
        totalCreated: 0,
        skipped: 0,
        wallets: []
      };
      
      try {
        costCenterResult = await this.createWalletsFromCostCenters();
      } catch (error: any) {
        console.warn('[GESTAO_CLICK] Erro ao criar carteiras de centros de custo:', error.message);
      }
      
      // Combinar os resultados
      const result: GestaoClickWalletCreationResult = {
        totalCreated: accountResult.totalCreated + costCenterResult.totalCreated,
        skipped: accountResult.skipped + costCenterResult.skipped,
        wallets: [...accountResult.wallets, ...costCenterResult.wallets]
      };
      
      return result;
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro ao importar todas as carteiras:', error);
      throw new Error(`Falha ao importar todas as carteiras do Gestão Click: ${error.message}`);
    }
  }

  /**
   * Filtra transações por categoria
   * @param transactions Lista de transações
   * @param filterCategories Lista de categorias para filtrar
   * @returns Lista de transações filtradas
   */
  private filterTransactionsByCategory(transactions: GestaoClickTransaction[], filterCategories: string[]): GestaoClickTransaction[] {
    if (!filterCategories || filterCategories.length === 0) {
      return transactions;
    }
    
    return transactions.filter(tx => {
      const categoria = typeof tx.categoria === 'string' 
        ? tx.categoria 
        : ''; // Removida a propriedade 'nome' que pode não existir
      return filterCategories.includes(categoria);
    });
  }

  /**
   * Filtra transações por conta bancária
   * @param transactions Lista de transações
   * @param filterAccounts Lista de contas para filtrar
   * @returns Lista de transações filtradas
   */
  private filterTransactionsByAccount(transactions: GestaoClickTransaction[], filterAccounts: string[]): GestaoClickTransaction[] {
    if (!filterAccounts || filterAccounts.length === 0) {
      return transactions;
    }
    
    return transactions.filter(tx => {
      const conta = typeof tx.contaBancaria === 'string'
        ? tx.contaBancaria
        : tx.contaBancaria.nome;
      return filterAccounts.includes(conta);
    });
  }

  /**
   * Armazena as configurações de integração na carteira
   * @param walletId ID da carteira
   * @param settings Configurações da integração
   */
  async storeIntegrationSettings(walletId: string, settings: {
    apiKey: string;
    secretToken?: string;
    apiUrl: string;
    empresa?: string;
    lastSync?: string;
  }): Promise<void> {
    try {
      // Em ambiente de desenvolvimento, garantir que temos um usuário para testes
      await this.ensureTestUser();
      
      // Verificar se o userId é válido
      if (!this.userId || this.userId === 'test-user-id') {
        console.warn('[GESTAO_CLICK] Não foi possível salvar configurações: userId inválido', this.userId);
        return; // Não continuar se não tiver userId válido
      }
      
      // Construir URL absoluta para a API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : '');
      const credentialsApiUrl = `${baseUrl}/api/gestao-click/credentials`;
      console.log(`[GESTAO_CLICK] URL da API de credenciais: ${credentialsApiUrl}`);
      
      // Verificar se estamos lidando com configurações globais
      const isGlobal = walletId === "global";
      
      // Preparar os dados para envio
      const bodyData: {
        walletId: string;
        settings: {
          gestaoClick: {
            apiKey: string;
            secretToken?: string;
            apiUrl: string;
            empresa?: string;
            lastSync?: string;
          };
          scope?: string;
        };
        userId: string; // Adicionar userId
      } = {
        walletId,
        settings: {
          gestaoClick: {
            apiKey: settings.apiKey,
            secretToken: settings.secretToken,
            apiUrl: settings.apiUrl,
            empresa: settings.empresa,
            lastSync: settings.lastSync
          }
        },
        userId: this.userId // Incluir userId na requisição
      };
      
      // Se for configuração global, adicionar um campo para indicar isso
      if (isGlobal) {
        bodyData.settings.scope = "global";
      }
      
      // Obter token para autenticação se disponível da sessão
      let authHeader = {};
      
      // Se não estamos no navegador (ambiente servidor), usar credenciais do prisma
      if (typeof window === 'undefined') {
        try {
          // Verificar se o usuário existe para garantir autenticação
          const userExists = await prisma.user.findUnique({
            where: { id: this.userId },
            select: { id: true }
          });
          
          if (!userExists) {
            console.warn(`[GESTAO_CLICK] Usuário não encontrado: ${this.userId}`);
          }
        } catch (error) {
          console.error('[GESTAO_CLICK] Erro ao verificar usuário:', error);
        }
      }
      
      // Enviar a requisição para salvar as configurações
      const response = await fetch(credentialsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify(bodyData),
        credentials: 'include' // Incluir cookies para autenticação
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao salvar configurações: ${response.status} - ${errorText}`);
      }
      
      console.log('[GESTAO_CLICK] Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro ao salvar configurações:', error);
      throw error;
    }
  }

  /**
   * Importa todos os dados do Gestão Click
   * - Carteiras a partir de contas bancárias
   * - Centros de custo (como entidades próprias)
   * - Transações (apenas para carteiras de contas bancárias)
   * 
   * @returns Resultado completo da importação
   */
  async importAllData(): Promise<CompleteImportResult> {
    try {
      console.log('[GESTAO_CLICK] Iniciando importação completa de dados');
      
      // Resultados padrão
      const result: CompleteImportResult = {
        wallets: {
          fromAccounts: { totalCreated: 0, skipped: 0, wallets: [] },
          fromCostCenters: { totalCreated: 0, skipped: 0, wallets: [] }
        },
        transactions: {
          totalImported: 0,
          skipped: 0,
          failed: 0,
          details: []
        }
      };
      
      // 1. Primeiro importar as carteiras de contas bancárias
      console.log('[GESTAO_CLICK] Etapa 1: Importando carteiras a partir de contas bancárias');
      const walletsFromAccountsResult = await this.createWalletsFromAccounts();
      result.wallets.fromAccounts = walletsFromAccountsResult;
      
      console.log(`[GESTAO_CLICK] Carteiras de contas bancárias criadas: ${walletsFromAccountsResult.totalCreated}, ignoradas: ${walletsFromAccountsResult.skipped}`);
      console.log(`[GESTAO_CLICK] Detalhes das carteiras de contas bancárias:`, walletsFromAccountsResult.wallets.map(w => ({ id: w.id, name: w.name, type: w.type })));
      
      // 2. Importar centros de custo como entidades próprias (não mais como carteiras)
      console.log('[GESTAO_CLICK] Etapa 2: Importando centros de custo');
      const costCentersResult = await this.createWalletsFromCostCenters();
      result.wallets.fromCostCenters = costCentersResult;
      
      console.log(`[GESTAO_CLICK] Centros de custo criados: ${costCentersResult.totalCreated}, ignorados: ${costCentersResult.skipped}`);
      console.log(`[GESTAO_CLICK] Detalhes dos centros de custo:`, costCentersResult.wallets.map(w => ({ id: w.id, name: w.name, type: w.type })));
      
      // 3. Importar transações apenas para carteiras de contas bancárias
      if (walletsFromAccountsResult.wallets.length > 0) {
        console.log('[GESTAO_CLICK] Etapa 3: Importando transações para carteiras de contas bancárias');
        
        // Filtrar apenas as carteiras de contas bancárias (tipo GESTAO_CLICK)
        const bankAccountWallets = walletsFromAccountsResult.wallets.filter(wallet => 
        wallet.type === "GESTAO_CLICK"
      );
      
        console.log(`[GESTAO_CLICK] Importando transações para ${bankAccountWallets.length} carteiras de contas bancárias`);
        console.log(`[GESTAO_CLICK] Carteiras de conta bancária para importação:`, bankAccountWallets.map(w => ({ id: w.id, name: w.name })));
        
        // Importar transações apenas para carteiras de contas bancárias
        const transactionResults = await Promise.all(
          bankAccountWallets.map(wallet => this.importTransactionsForWallet(wallet.id))
        );
        
        // Combinar resultados de transações
        result.transactions = transactionResults.reduce((acc, curr) => {
          acc.totalImported += curr.totalImported;
          acc.skipped += curr.skipped;
          acc.failed += curr.failed;
          acc.details = [...acc.details, ...curr.details];
          return acc;
        }, {
          totalImported: 0,
          skipped: 0,
          failed: 0,
          details: []
        });
        
        console.log(`[GESTAO_CLICK] Transações importadas: ${result.transactions.totalImported}, ignoradas: ${result.transactions.skipped}, falhas: ${result.transactions.failed}`);
      } else {
        console.log('[GESTAO_CLICK] Nenhuma carteira de conta bancária disponível para importar transações');
      }
      
      return result;
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro durante importação completa:', error);
      throw new Error(`Falha na importação de dados do Gestão Click: ${error.message}`);
    }
  }
  
  /**
   * Busca transações existentes para uma carteira
   * @param walletId ID da carteira
   * @returns Conjunto de IDs de transações existentes
   */
  private async getExistingTransactions(walletId: string): Promise<Set<string>> {
    try {
      // Verificar transações existentes para esta carteira
      const existingTransactions = await prisma.transaction.findMany({
        where: {
          walletId,
          metadata: {
            path: ['source', 'name'],
            equals: 'GESTAO_CLICK'
          }
        },
        select: {
          id: true,
          name: true,
          metadata: true
        }
      });
      
      console.log(`[GESTAO_CLICK] Encontradas ${existingTransactions.length} transações existentes na carteira ${walletId}`);
      
      const transactionIds = new Set<string>();
      
      // Extrair os IDs externos das transações existentes
      for (const tx of existingTransactions) {
        const safeGet = (obj: any, path: string[], defaultValue: any = null) => {
          let current = obj;
          for (const key of path) {
            if (current == null || typeof current !== 'object') return defaultValue;
            current = current[key];
          }
          return current === undefined ? defaultValue : current;
        };
        
        // Melhorar a robustez da extração do ID externo
        const externalId = safeGet(tx.metadata, ['source', 'externalId'], null) || 
                           safeGet(tx.metadata, ['source', 'data', 'id'], null) ||
                           safeGet(tx.metadata, ['original', 'id'], null);
        
        // Se o ID externo foi encontrado, adicioná-lo ao conjunto
        if (externalId) {
          const externalIdStr = externalId.toString();
          transactionIds.add(externalIdStr);
          
          // Também adicionar variações do ID para maior cobertura
          transactionIds.add(`gc-${externalIdStr}`);
          
          // Log detalhado para as primeiras 5 transações
          if (transactionIds.size <= 5) {
            console.log(`[GESTAO_CLICK] Transação existente: ${tx.id} (${tx.name}), externalId: ${externalIdStr}`);
          }
        } else {
          console.warn(`[GESTAO_CLICK] Transação ${tx.id} (${tx.name}) não possui ID externo do Gestão Click`);
        }
      }
      
      console.log(`[GESTAO_CLICK] Extraídos ${transactionIds.size} IDs de transações existentes para a carteira ${walletId}`);
      
      // Registrar os primeiros 10 IDs para debug
      if (transactionIds.size > 0) {
        const firstIds = Array.from(transactionIds).slice(0, 10);
        console.log(`[GESTAO_CLICK] Exemplos de IDs existentes: ${firstIds.join(', ')}`);
      }
      
      return transactionIds;
    } catch (error) {
      console.error('[GESTAO_CLICK] Erro ao buscar transações existentes:', error);
      return new Set<string>();
    }
  }
  
  /**
   * Importa transações para uma carteira, ignorando as que já existem
   * @param walletId ID da carteira
   * @param options Opções de importação
   * @returns Resultado da importação
   */
  private async importTransactionsWithDeduplication(
    walletId: string, 
    options: {
      startDate: string;
      endDate: string;
      existingTransactionIds: Set<string>;
      apiFilters?: any;
    }
  ): Promise<{
    totalImported: number;
    details: {
      periodo: {
        inicio: string;
        fim: string;
      };
      processadas: number;
      receitas: number;
      despesas: number;
      ignoradas: number;
      importadas: number;
      paginasProcessadas: {
        pagamentos: number;
        recebimentos: number;
      };
    };
  }> {
    try {
      // Buscar todas as transações do período
      const transactions = await this.getTransactions(
        new Date(options.startDate),
        new Date(options.endDate),
        options.apiFilters || {}
      );
      
      console.log(`[GESTAO_CLICK] ${transactions.length} transações encontradas no período para a carteira ${walletId}`);
      
      // Filtrar apenas transações que não existem
      const newTransactions = transactions.filter(tx => {
        // Verificar se o ID da transação já existe (em diferentes formatos possíveis)
        const exists = options.existingTransactionIds.has(tx.id.toString()) || 
                       options.existingTransactionIds.has(`gc-${tx.id}`);
        
        // Para as primeiras 5 transações, logar informações de debug
        if (transactions.indexOf(tx) < 5) {
          console.log(`[GESTAO_CLICK] Verificando transação ${tx.id} (${tx.descricao}): ${exists ? 'EXISTE' : 'NOVA'}`);
        }
        
        return !exists;
      });
      
      console.log(`[GESTAO_CLICK] ${newTransactions.length} novas transações para importar (${transactions.length - newTransactions.length} já existem)`);
      
      // Se não houver novas transações, retornar
      if (newTransactions.length === 0) {
        return {
          totalImported: 0,
          details: {
            periodo: {
              inicio: options.startDate,
              fim: options.endDate
            },
            processadas: transactions.length,
            receitas: transactions.filter(tx => tx.tipo === 'RECEITA').length,
            despesas: transactions.filter(tx => tx.tipo === 'DESPESA').length,
            ignoradas: transactions.length,
            importadas: 0,
            paginasProcessadas: {
              pagamentos: 0,
              recebimentos: 0
            }
          }
        };
      }
      
      // Importar categorias se necessário
      if (newTransactions.length > 0) {
        try {
          await this.importCategories(newTransactions, this.userId);
        } catch (error) {
          console.error('[GESTAO_CLICK] Erro ao importar categorias:', error);
        }
      }
      
      // Converter para o formato da aplicação
      const transactionsToImport = newTransactions.map(tx => ({
        description: tx.descricao,
        amount: tx.tipo === 'DESPESA' ? -tx.valor : tx.valor,
        date: new Date(tx.data),
        type: tx.tipo,
        category: this.mapCategoryToEnum(tx.categoria),
        paymentMethod: this.mapPaymentMethodToEnum(tx.formaPagamento),
        source: {
          name: 'GESTAO_CLICK',
          externalId: tx.id,
          data: {
            ...tx.metadata,
            codigo: tx.codigo,
            clienteId: tx.clienteId,
            clienteNome: tx.clienteNome,
            fornecedorId: tx.fornecedorId,
            fornecedorNome: tx.fornecedorNome,
            lojaId: tx.lojaId,
            lojaNome: tx.lojaNome
          }
        }
      }));
      
      // Importar transações para a carteira
      console.log(`[GESTAO_CLICK] Importando ${transactionsToImport.length} transações para a carteira ${walletId}`);
      
      // Construir URL absoluta para a API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : '');
      const apiUrl = `${baseUrl}/api/transactions/import`;
      
      // Obter a chave de API para autenticação entre serviços
      const apiKey = process.env.API_SECRET_KEY || 'contarapida_internal_api_key';
      
      const result = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          walletId,
          userId: this.userId, // Importante: Incluir o userId para autenticação via API
          transactions: transactionsToImport,
          source: 'GESTAO_CLICK'
        }),
      });
      
      if (!result.ok) {
        const errorText = await result.text();
        throw new Error(`Erro ao importar transações: ${result.status} - ${errorText}`);
      }
      
      const importResult = await result.json();
      
      // Atualizar data da última sincronização
      await this.storeIntegrationSettings(walletId, {
        apiKey: this.apiKey,
        secretToken: this.secretToken,
        apiUrl: this.apiUrl,
        lastSync: new Date().toISOString()
      });
      
      // Retornar resultado
      return {
        totalImported: importResult.count || 0,
        details: {
          periodo: {
            inicio: options.startDate,
            fim: options.endDate
          },
          processadas: transactions.length,
          receitas: transactions.filter(tx => tx.tipo === 'RECEITA').length,
          despesas: transactions.filter(tx => tx.tipo === 'DESPESA').length,
          ignoradas: transactions.length - newTransactions.length,
          importadas: importResult.count || 0,
          paginasProcessadas: {
            pagamentos: 1,
            recebimentos: 1
          }
        }
      };
    } catch (error: any) {
      console.error('[GESTAO_CLICK] Erro na importação de transações com deduplicação:', error);
      
      // Adicionar detalhes do erro para facilitar diagnóstico
      if (error.message && error.message.includes('category')) {
        console.error('[GESTAO_CLICK] Erro relacionado à categoria. Verifique o mapeamento de categorias.');
        
        // Se o erro contiver informações sobre a categoria específica, extrair e logar
        const categoryMatch = error.message.match(/category.*?(['"].*?['"])/i);
        if (categoryMatch && categoryMatch[1]) {
          console.error(`[GESTAO_CLICK] Categoria problemática: ${categoryMatch[1]}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Mapeia categorias do Gestão Click para strings de categoria
   * @param category Categoria em texto livre 
   * @returns String da categoria compatível
   */
  private mapCategoryToEnum(category: string): string {
    // Se não houver categoria, retorna um valor padrão
    if (!category) return "OTHER";
    
    // Normalizar a string da categoria
    const normalizedCategory = category.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')  // Remover acentos
      .trim();
    
    // Mapeamento de categorias do Gestão Click para strings de categoria
    const categoryMap: { [key: string]: string } = {
      // Vendas
      'vendas': "VENDAS_PRODUTOS",
      'vendas balcao': "VENDAS_BALCAO",
      'vendas no balcao': "VENDAS_BALCAO",
      'venda balcao': "VENDAS_BALCAO",
      'venda de produto': "VENDAS_PRODUTOS",
      'venda de produtos': "VENDAS_PRODUTOS",
      'venda produtos': "VENDAS_PRODUTOS",
      'entregas': "DELIVERY",
      'delivery': "DELIVERY",
      
      // Funcionários e encargos
      'salario': "REMUNERACAO_FUNCIONARIOS",
      'salarios': "REMUNERACAO_FUNCIONARIOS",
      'remuneracao': "REMUNERACAO_FUNCIONARIOS",
      'comissao': "REMUNERACAO_FUNCIONARIOS",
      'comissao de vendedores': "REMUNERACAO_FUNCIONARIOS",
      'bonificacao': "REMUNERACAO_FUNCIONARIOS",
      'premio': "REMUNERACAO_FUNCIONARIOS",
      'fgts': "ENCARGOS_FGTS",
      'inss': "ENCARGOS_INSS",
      'alimentacao': "ENCARGOS_ALIMENTACAO",
      'vale alimentacao': "ENCARGOS_ALIMENTACAO",
      'vale refeicao': "ENCARGOS_ALIMENTACAO",
      'refeicao': "ENCARGOS_ALIMENTACAO",
      'vale transporte': "ENCARGOS_VALE_TRANSPORTE",
      'transporte funcionarios': "ENCARGOS_VALE_TRANSPORTE",
      'decimo terceiro': "ENCARGOS_13_SALARIO",
      '13 salario': "ENCARGOS_13_SALARIO",
      '13o salario': "ENCARGOS_13_SALARIO",
      'encargos funcionarios - 13o salario': "ENCARGOS_13_SALARIO",
      'decimo quarto': "ENCARGOS_14_SALARIO",
      '14 salario': "ENCARGOS_14_SALARIO",
      'rescisao': "ENCARGOS_RESCISOES",
      'rescisoes': "ENCARGOS_RESCISOES",
      'exames': "ENCARGOS_EXAMES",
      'exame medico': "ENCARGOS_EXAMES",
      'ferias': "FERIAS",
      
      // Estoque e equipamentos
      'estoque': "REPOSICAO_ESTOQUE",
      'reposicao': "REPOSICAO_ESTOQUE",
      'reposicao de estoque': "REPOSICAO_ESTOQUE",
      'compras': "COMPRAS",
      'compra': "COMPRAS",
      'manutencao': "MANUTENCAO_EQUIPAMENTOS",
      'manutencao de equipamentos': "MANUTENCAO_EQUIPAMENTOS",
      'conserto': "MANUTENCAO_EQUIPAMENTOS",
      'reparo': "MANUTENCAO_EQUIPAMENTOS",
      'equipamentos': "AQUISICAO_EQUIPAMENTOS",
      'aquisicao de equipamentos': "AQUISICAO_EQUIPAMENTOS",
      'compra de equipamentos': "AQUISICAO_EQUIPAMENTOS",
      'material de reforma': "MATERIAL_REFORMA",
      'reforma': "MATERIAL_REFORMA",
      'material de escritorio': "MATERIAL_ESCRITORIO",
      'papelaria': "MATERIAL_ESCRITORIO",
      'escritorio': "MATERIAL_ESCRITORIO",
      
      // Utilidades e serviços
      'marketing': "MARKETING_PUBLICIDADE",
      'publicidade': "MARKETING_PUBLICIDADE",
      'propaganda': "MARKETING_PUBLICIDADE",
      'divulgacao': "MARKETING_PUBLICIDADE",
      'telefone': "TELEFONIA_INTERNET",
      'telefonia': "TELEFONIA_INTERNET",
      'internet': "TELEFONIA_INTERNET",
      'telefonia e internet': "TELEFONIA_INTERNET",
      'energia': "ENERGIA_AGUA",
      'luz': "ENERGIA_AGUA",
      'agua': "ENERGIA_AGUA",
      'energia e agua': "ENERGIA_AGUA",
      'frete': "TRANSPORTADORA",
      'transportadora': "TRANSPORTADORA",
      'transporte': "TRANSPORTADORA",
      'contabilidade': "CONTABILIDADE",
      'contador': "CONTABILIDADE",
      'servicos contabeis': "CONTABILIDADE",
      'troco': "TROCO"
    };
    
    // Procurar por correspondências exatas primeiro
    if (categoryMap[normalizedCategory]) {
      console.log(`[GESTAO_CLICK] Categoria mapeada exatamente: "${category}" -> "${categoryMap[normalizedCategory]}"`);
      return categoryMap[normalizedCategory];
    }
    
    // Procurar por correspondências parciais
    for (const [key, value] of Object.entries(categoryMap)) {
      if (normalizedCategory.includes(key)) {
        console.log(`[GESTAO_CLICK] Categoria mapeada parcialmente: "${category}" -> "${value}"`);
        return value;
      }
    }
    
    // Se não encontrar correspondência, retornar OTHER
    console.log(`[GESTAO_CLICK] Categoria não mapeada: "${category}" -> "OTHER"`);
    return "OTHER";
  }

  /**
   * Mapeia métodos de pagamento do formato texto livre do Gestão Click para o enum TransactionPaymentMethod
   * @param paymentMethod Método de pagamento em texto livre
   * @returns Método de pagamento no formato do enum TransactionPaymentMethod
   */
  private mapPaymentMethodToEnum(paymentMethod: string): TransactionPaymentMethod {
    // Se não houver método de pagamento, retorna OTHER
    if (!paymentMethod) return 'OTHER';

    // Normalizar a string removendo acentos e convertendo para minúsculo
    const normalizedMethod = paymentMethod.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // Mapeamento de métodos de pagamento do Gestão Click
    const methodMap: { [key: string]: TransactionPaymentMethod } = {
      // Cartões
      'cartao de credito': 'CREDIT_CARD',
      'credito': 'CREDIT_CARD',
      'cartao de debito': 'DEBIT_CARD',
      'debito': 'DEBIT_CARD',

      // Transferências e PIX
      'pix': 'PIX',
      'transferencia': 'BANK_TRANSFER',
      'transferencia bancaria': 'BANK_TRANSFER',
      'ted': 'BANK_TRANSFER',
      'doc': 'BANK_TRANSFER',

      // Dinheiro
      'dinheiro': 'CASH',
      'especie': 'CASH',
      'moeda': 'CASH',

      // Boleto
      'boleto': 'BANK_SLIP',
      'boleto bancario': 'BANK_SLIP'
    };

    // Procurar por correspondências exatas
    if (methodMap[normalizedMethod]) {
      return methodMap[normalizedMethod];
    }

    // Procurar por correspondências parciais
    for (const [key, value] of Object.entries(methodMap)) {
      if (normalizedMethod.includes(key)) {
        return value;
      }
    }

    // Se não encontrar correspondência, retornar OTHER
    return 'OTHER';
  }

  /**
   * Cria um usuário temporário para testes em ambiente de desenvolvimento
   * @returns ID do usuário criado
   */
  private async ensureTestUser(): Promise<string> {
    // Apenas em ambiente de desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return this.userId;
    }
    
    try {
      // Verificar se o userId já é válido
      if (this.userId && this.userId !== 'test-user-id') {
        // Verificar se o usuário existe
        const existingUser = await prisma.user.findUnique({
          where: { id: this.userId },
          select: { id: true }
        });
        
        if (existingUser) {
          return this.userId;
        }
      }
      
      // Verificar se já existe um usuário de teste
      const testUser = await prisma.user.findFirst({
        where: {
          email: 'teste@acceleracrm.com.br'
        },
        select: { id: true }
      });
      
      if (testUser) {
        this.userId = testUser.id;
        console.log(`[GESTAO_CLICK] Usando usuário de teste existente: ${this.userId}`);
        return this.userId;
      }
      
      // Criar um usuário de teste
      console.log('[GESTAO_CLICK] Criando usuário de teste para ambiente de desenvolvimento');
      const newUser = await prisma.user.create({
        data: {
          email: 'teste@acceleracrm.com.br',
          name: 'Usuário de Teste',
          emailVerified: new Date(),
        }
      });
      
      this.userId = newUser.id;
      console.log(`[GESTAO_CLICK] Usuário de teste criado: ${this.userId}`);
      return this.userId;
    } catch (error) {
      console.error('[GESTAO_CLICK] Erro ao criar usuário de teste:', error);
      return this.userId;
    }
  }

  /**
   * Importa transações para uma carteira específica e associa aos centros de custo
   * @param walletId ID da carteira para importar transações
   * @param startDateStr Data inicial opcional no formato YYYY-MM-DD
   * @param endDateStr Data final opcional no formato YYYY-MM-DD
   * @returns Resultado da importação de transações
   */
  async importTransactionsForWallet(
    walletId: string,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<{
    totalImported: number;
    skipped: number;
    failed: number;
    details: Array<{
      walletId: string;
      walletName: string;
      newTransactions: number;
      skippedTransactions: number;
      errorMessage?: string;
    }>;
  }> {
    try {
      // Obter detalhes da carteira
      const wallet = await prisma.wallet.findUnique({
        where: { id: walletId },
        select: {
          id: true,
          name: true,
          type: true,
          metadata: true,
          userId: true
        }
      });

      if (!wallet) {
        console.error(`[GESTAO_CLICK] Carteira não encontrada com ID ${walletId}`);
        return {
          totalImported: 0,
          skipped: 0,
          failed: 1,
          details: [{
            walletId,
            walletName: "Desconhecida",
            newTransactions: 0,
            skippedTransactions: 0,
            errorMessage: "Carteira não encontrada"
          }]
        };
      }

      // Verificar se é uma carteira do Gestão Click
      // @ts-ignore - O Prisma trata o campo metadata como any
      if (!wallet.metadata?.gestaoClickId || wallet.type !== "GESTAO_CLICK") {
        console.error(`[GESTAO_CLICK] Carteira ${wallet.name} não é do tipo conta bancária do Gestão Click`);
        return {
          totalImported: 0,
          skipped: 0,
          failed: 1,
          details: [{
            walletId,
            walletName: wallet.name,
            newTransactions: 0,
            skippedTransactions: 0,
            errorMessage: "Carteira não é uma conta bancária do Gestão Click"
          }]
        };
      }

      // Obter todos os centros de custo associados a esta carteira
      const costCenterRelations = await prisma.costCenterWallet.findMany({
        where: { walletId: wallet.id },
        include: {
          costCenter: {
            select: {
              id: true,
              name: true,
              externalId: true
            }
          }
        }
      });

      // Mapear os centros de custo pelo ID externo para fácil acesso
      const costCentersByExternalId = new Map();
      costCenterRelations.forEach(relation => {
        if (relation.costCenter?.externalId) {
          costCentersByExternalId.set(relation.costCenter.externalId, relation.costCenter);
        }
      });

      console.log(`[GESTAO_CLICK] ${costCentersByExternalId.size} centros de custo associados à carteira ${wallet.name}`);

      // Definir período de importação (últimos 5 anos como padrão ou datas informadas)
      const endDate = endDateStr ? new Date(endDateStr) : new Date();
      const startDate = startDateStr ? new Date(startDateStr) : new Date();
      
      // Se não foi especificado startDateStr, recuar 5 anos da data final
      if (!startDateStr) {
        startDate.setFullYear(endDate.getFullYear() - 10); // Últimos 10 anos
      }
      
      // Formatar datas para log e API
      const formattedStartDate = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const formattedEndDate = endDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log(`[GESTAO_CLICK] Período de importação para ${wallet.name}: ${formattedStartDate} até ${formattedEndDate}`);

      // Verificar transações existentes para evitar duplicação
      const existingTransactions = await this.getExistingTransactions(wallet.id);
      console.log(`[GESTAO_CLICK] ${existingTransactions.size} transações já existentes na carteira ${wallet.name}`);
      
      // Obter transações do período - garantir que a API receba as datas corretas
      const transactions = await this.getTransactions(
        startDate, // Garantindo que use a data inicial completa
        endDate,   // Garantindo que use a data final completa
        {          // Sem filtros adicionais que possam restringir a data
          limit: 5000 // Aumentar o limite para obter mais transações por página (de 1000 para 5000)
        }
      );
      
      console.log(`[GESTAO_CLICK] ${transactions.length} transações encontradas no período para análise`);
      
      // Log para debug - conferir se transações estão vindo com datas anteriores a 2025
      const transactionsByYear = new Map<number, number>();
      transactions.forEach(tx => {
        const txDate = new Date(tx.data);
        const year = txDate.getFullYear();
        transactionsByYear.set(year, (transactionsByYear.get(year) || 0) + 1);
      });
      console.log(`[GESTAO_CLICK] Distribuição de transações por ano:`, 
        Object.fromEntries([...transactionsByYear.entries()].sort()));
      
      // Filtrar transações que pertencem a esta carteira
      // @ts-ignore - O Prisma trata o campo metadata como any
      const walletExternalId = wallet.metadata?.gestaoClickId;
      
      let transactionsForWallet = transactions.filter(tx => {
        // Verificar se a transação é desta conta bancária
        const isFromThisWallet = typeof tx.contaBancaria === 'object' 
          ? tx.contaBancaria?.id === walletExternalId
          : tx.contaBancaria === walletExternalId;
          
        // Verificar se já existe - usando tipo string para garantir consistência
        const txIdStr = tx.id.toString();
        const alreadyExists = existingTransactions.has(txIdStr) || existingTransactions.has(`gc-${txIdStr}`);
        
        return isFromThisWallet && !alreadyExists;
      });
      
      // Log para debug - conferir a distribuição das transações por ano após filtro
      const filteredTransactionsByYear = new Map<number, number>();
      transactionsForWallet.forEach(transaction => {
        const transactionDate = new Date(transaction.data);
        const year = transactionDate.getFullYear();
        filteredTransactionsByYear.set(year, (filteredTransactionsByYear.get(year) || 0) + 1);
      });
      console.log(`[GESTAO_CLICK] Distribuição de transações filtradas por ano:`, 
        Object.fromEntries([...filteredTransactionsByYear.entries()].sort()));
      
      console.log(`[GESTAO_CLICK] ${transactionsForWallet.length} novas transações para importar para a carteira ${wallet.name}`);
      
      // Importar categorias primeiro
      await this.importCategories(transactionsForWallet, wallet.userId);
      
      // Importar transações
      let totalImported = 0;
      let totalSkipped = 0;
      
      for (const tx of transactionsForWallet) {
        try {
          // Identificar centro de custo, se existir
          const costCenterId = tx.centroCusto ? costCentersByExternalId.get(tx.centroCusto)?.id : null;
          
          // Obter categoria mapeada do banco de dados
          const mappedCategory = await this.getCategoryMappingForTransaction(wallet.userId, tx.categoria);
          
          // Criar a transação
          const newTransaction = await prisma.transaction.create({
            data: {
              name: tx.descricao,
              amount: tx.tipo === 'DESPESA' ? -Math.abs(tx.valor) : Math.abs(tx.valor),
              date: new Date(tx.data),
              type: tx.tipo === 'DESPESA' ? 'EXPENSE' : 'INCOME',
              category: mappedCategory as any, // Usando categoria como string
              status: tx.status === 'PAGO' ? 'CLEARED' : 'PENDING',
              walletId: wallet.id,
              userId: wallet.userId,
              metadata: {
                source: {
                  name: 'GESTAO_CLICK',
                  externalId: tx.id.toString() // Forçar conversão para string
                },
                originalCategory: tx.categoria, // Armazenar a categoria original
                paymentMethod: this.mapPaymentMethodToEnum(tx.formaPagamento), // Armazenar o método de pagamento no metadata
                centroCusto: costCenterId ? {
                  id: costCenterId,
                  externalId: tx.centroCusto
                } : null,
                original: {
                  ...tx
                }
              },
              tags: ["imported", "gestao-click"]
            } as any
          });
          
          // Se há um centro de custo, registrar a relação
          if (costCenterId) {
            console.log(`[GESTAO_CLICK] Transação ${newTransaction.id} associada ao centro de custo ${costCenterId}`);
          }
          
          totalImported++;
        } catch (error) {
          console.error(`[GESTAO_CLICK] Erro ao importar transação ${tx.id}:`, error);
          totalSkipped++;
        }
      }
      
      console.log(`[GESTAO_CLICK] ${totalImported} transações importadas, ${totalSkipped} ignoradas para carteira ${wallet.name}`);
      
      return {
        totalImported: totalImported,
        skipped: totalSkipped,
        failed: 0,
        details: [{
          walletId: wallet.id,
          walletName: wallet.name,
          newTransactions: totalImported,
          skippedTransactions: totalSkipped
        }]
      };
    } catch (error: any) {
      console.error(`[GESTAO_CLICK] Erro ao importar transações para carteira ${walletId}:`, error);
      return {
        totalImported: 0,
        skipped: 0,
        failed: 1,
        details: [{
          walletId,
          walletName: "Erro",
          newTransactions: 0,
          skippedTransactions: 0,
          errorMessage: error.message
        }]
      };
    }
  }

  /**
   * Busca o mapeamento de categoria para uma transação
   * @param userId ID do usuário
   * @param externalCategory Categoria externa do Gestão Click
   * @returns Categoria interna correspondente como string
   */
  private async getCategoryMappingForTransaction(userId: string, externalCategory: string): Promise<string> {
    try {
      if (!externalCategory || externalCategory.trim() === '') {
        console.log('[GESTAO_CLICK] Categoria vazia, usando categoria padrão OTHER');
        return "OTHER";
      }

      // Verificamos se existe um mapeamento para esta categoria
      const categoryMapping = await prisma.categoryMapping.findFirst({
        where: {
          userId: userId,
          source: 'GESTAO_CLICK',
          externalCategory: {
            equals: externalCategory,
            mode: 'insensitive' // Case insensitive search
          },
          active: true
        }
      });

      // Se encontrou um mapeamento
      if (categoryMapping) {
        console.log(`[GESTAO_CLICK] Encontrado mapeamento para: "${externalCategory}" -> "${categoryMapping.internalCategory}"`);
        return categoryMapping.internalCategory as string;
      }

      // Se não encontrou mapeamento, mapear a categoria original
      console.log(`[GESTAO_CLICK] Mapeando categoria original: "${externalCategory}"`);
      const mappedCategory = this.mapCategoryToEnum(externalCategory);
      
      // Criar um novo mapeamento para uso futuro
      try {
        await prisma.categoryMapping.create({
          data: {
            userId: userId,
            externalCategory: externalCategory,
            internalCategory: mappedCategory, // Armazenar a string da categoria
            source: "GESTAO_CLICK",
            priority: 50,
            active: true
          }
        });
        console.log(`[GESTAO_CLICK] Novo mapeamento de categoria criado: "${externalCategory}" -> "${mappedCategory}"`);
      } catch (mappingError) {
        // Se ocorrer erro ao criar o mapeamento, apenas logamos e continuamos
        console.error(`[GESTAO_CLICK] Erro ao criar mapeamento para "${externalCategory}":`, mappingError);
      }
      
      return mappedCategory;
    } catch (error) {
      console.error(`[GESTAO_CLICK] Erro ao processar categoria "${externalCategory}":`, error);
      return "OTHER";
    }
  }

  /**
   * Importa automaticamente novas transações desde a última sincronização
   * 
   * Este método verifica a última data de sincronização armazenada
   * e importa apenas as transações mais recentes para evitar duplicações.
   * 
   * @param wallet Carteira para importar as transações (ou 'all' para todas as carteiras)
   * @returns Resultado da importação com estatísticas
   */
  async autoImportTransactions(wallet: string = 'all'): Promise<{
    totalImported: number;
    skipped: number;
    newTransactions: number;
    wallets: {
      processed: number;
      withNewTransactions: number;
      details: Array<{
        id: string;
        name: string;
        transactionsImported: number;
      }>;
    };
    lastSync: string;
    nextScheduledSync: string;
  }> {
    console.log(`[GESTAO_CLICK] Iniciando importação automática de transações${wallet !== 'all' ? ` para a carteira ${wallet}` : ''}`);
    
    try {
      // Resultado inicial
      const result = {
        totalImported: 0,
        skipped: 0,
        newTransactions: 0,
        wallets: {
          processed: 0,
          withNewTransactions: 0,
          details: [] as Array<{
            id: string;
            name: string;
            transactionsImported: number;
          }>
        },
        lastSync: new Date().toISOString(),
        nextScheduledSync: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Próxima sincronização em 24h
      };
      
      // Usar os últimos 10 anos ao invés da última sincronização
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      const startDateStr = tenYearsAgo.toISOString().split('T')[0];
      
      // Data atual para limite superior da busca
      const today = new Date().toISOString().split('T')[0];
      
      console.log(`[GESTAO_CLICK] Período de importação: ${startDateStr} até ${today} (últimos 10 anos)`);
      
      // Determinar quais carteiras processar
      let walletsToProcess: Array<{ id: string; name: string }> = [];
      
      if (wallet === 'all') {
        // Buscar todas as carteiras associadas ao Gestão Click
        const allWallets = await prisma.wallet.findMany({
          where: {
            userId: this.userId,
            metadata: {
              path: ['source'],
              equals: 'gestao-click'
            }
          },
          select: {
            id: true,
            name: true
          }
        });
        
        walletsToProcess = allWallets;
      } else {
        // Verificar se a carteira específica existe e está associada ao Gestão Click
        const specificWallet = await prisma.wallet.findFirst({
          where: {
            id: wallet,
            userId: this.userId,
            metadata: {
              path: ['source'],
              equals: 'gestao-click'
            }
          },
          select: {
            id: true,
            name: true
          }
        });
        
        if (specificWallet) {
          walletsToProcess = [specificWallet];
        } else {
          console.warn(`[GESTAO_CLICK] Carteira ${wallet} não encontrada ou não associada ao Gestão Click`);
        }
      }
      
      console.log(`[GESTAO_CLICK] Processando ${walletsToProcess.length} carteiras`);
      result.wallets.processed = walletsToProcess.length;
      
      // Para cada carteira, importar transações
      for (const currentWallet of walletsToProcess) {
        console.log(`[GESTAO_CLICK] Importando transações para carteira ${currentWallet.name} (${currentWallet.id})`);
        
        // Obter IDs de transações existentes para esta carteira
        const existingTransactionIds = await this.getExistingTransactions(currentWallet.id);
        
        // Importar transações para o período dos últimos 10 anos
        const importResult = await this.importTransactionsWithDeduplication(
          currentWallet.id,
          {
            startDate: startDateStr,
            endDate: today,
            existingTransactionIds,
            apiFilters: {
              // Incluir todas as transações (não apenas as confirmadas)
              limit: 1000 // Aumentar o limite para pegar mais transações
            }
          }
        );
        
        // Atualizar estatísticas
        const transactionsImported = importResult.details.importadas;
        result.totalImported += transactionsImported;
        result.skipped += importResult.details.ignoradas;
        
        if (transactionsImported > 0) {
          result.wallets.withNewTransactions++;
          result.newTransactions += transactionsImported;
          
          // Adicionar detalhes desta carteira
          result.wallets.details.push({
            id: currentWallet.id,
            name: currentWallet.name,
            transactionsImported
          });
        }
      }
      
      // Registrar data da sincronização
      const syncTimestamp = new Date().toISOString();
      await this.updateLastSyncDate(syncTimestamp);
      result.lastSync = syncTimestamp;
      
      console.log(`[GESTAO_CLICK] Importação automática concluída. Total: ${result.newTransactions} novas transações`);
      return result;
    } catch (error) {
      console.error('[GESTAO_CLICK] Erro na importação automática:', error);
      throw error;
    }
  }
  
  /**
   * Obtém a data da última sincronização
   */
  private async getLastSyncDate(): Promise<string | null> {
    try {
      // Buscar configuração global
      const settings = await prisma.wallet.findFirst({
        where: {
          userId: this.userId,
          name: "GESTAO_CLICK_GLOBAL",
          type: "SETTINGS"
        },
        select: {
          metadata: true
        }
      });

      if (settings && settings.metadata && typeof settings.metadata === 'object') {
        const metadata = settings.metadata as any;
        return metadata.lastSync || null;
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar data da última sincronização:', error);
      return null;
    }
  }
  
  /**
   * Atualiza a data da última sincronização
   */
  private async updateLastSyncDate(timestamp: string): Promise<void> {
    try {
      // Atualizar na carteira de configuração
      const existingSettings = await prisma.wallet.findFirst({
        where: {
          userId: this.userId,
          name: "GESTAO_CLICK_GLOBAL",
          type: "SETTINGS"
        }
      });
      
      if (existingSettings) {
        // Atualizar configurações existentes
        const currentMetadata = existingSettings.metadata as any || {};
        await prisma.wallet.update({
          where: { id: existingSettings.id },
          data: {
            metadata: {
              ...currentMetadata,
              lastSync: timestamp,
              nextSyncDate: this.calculateNextSyncDate(timestamp)
            }
          }
        });
      } else {
        // Criar novas configurações
        await prisma.wallet.create({
          data: {
            userId: this.userId,
            name: "GESTAO_CLICK_GLOBAL",
            type: "SETTINGS",
            balance: 0,
            metadata: {
              lastSync: timestamp,
              nextSyncDate: this.calculateNextSyncDate(timestamp)
            }
          }
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar data da última sincronização:', error);
    }
  }

  /**
   * Busca vendas do Gestão Click
   * @param startDate Data de início
   * @param endDate Data de fim
   * @param filters Filtros adicionais
   * @returns Lista de vendas
   */
  async getSales(
    startDate: Date,
    endDate: Date,
    filters: {
      cliente_id?: number;
      situacao_id?: number;
      loja_id?: number;
      includeInstallments?: boolean;
      limit?: number;
    } = {}
  ) {
    try {
      console.log('[GESTAO_CLICK] Buscando vendas...');
      console.log('[GESTAO_CLICK] Serviço inicializado com:', {
        apiUrl: this.apiUrl,
        apiKeyLength: this.apiKey ? this.apiKey.length : 0,
        hasSecretToken: !!this.secretToken,
        userId: this.userId
      });
      
      // Converter datas para formato esperado pela API
      const sDate = startDate.toISOString().split('T')[0];
      const eDate = endDate.toISOString().split('T')[0];
      
      console.log(`[GESTAO_CLICK] Período: ${sDate} até ${eDate}`);
      
      // Construir URL da API
      const url = new URL(`${this.apiUrl}/vendas`);
      
      // Adicionar parâmetros
      url.searchParams.append('data_inicio', sDate);
      url.searchParams.append('data_fim', eDate);
      
      // Adicionar limite de resultados
      url.searchParams.append('limit', String(filters.limit || 500));
      
      // Adicionar filtros adicionais
      if (filters.cliente_id) url.searchParams.append('cliente_id', String(filters.cliente_id));
      if (filters.situacao_id) url.searchParams.append('situacao_id', String(filters.situacao_id));
      if (filters.loja_id) url.searchParams.append('loja_id', String(filters.loja_id));
      
      console.log(`[GESTAO_CLICK] URL da requisição: ${url.toString()}`);
      
      // Realizar chamada para API
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      console.log(`[GESTAO_CLICK] Status da resposta: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar vendas: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[GESTAO_CLICK] Recebeu resposta da API, verificando dados...');
      
      // Verificar se a resposta contém a mensagem "Não há dados!"
      if (typeof result === 'string' && result === "Não há dados!") {
        console.log('[GESTAO_CLICK] API retornou "Não há dados!". Retornando array vazio.');
        return { data: [] };
      }
      
      // Verificar se o resultado é um objeto, mas sem propriedade data
      if (result && typeof result === 'object' && !result.data) {
        console.log('[GESTAO_CLICK] Resposta não contém propriedade data. Estruturando resposta.', result);
        // Se for um objeto que não é um array e não tem .data, envolve em { data: [result] }
        if (!Array.isArray(result)) {
          return { data: [result] };
        }
        // Se for um array, envolve em { data: result }
        return { data: result };
      }
      
      // Log de resultados
      const sales = result.data && Array.isArray(result.data) ? result.data : [];
      console.log(`[GESTAO_CLICK] ${sales.length} vendas encontradas`);
      
      // Se solicitado, buscar detalhes de parcelas para cada venda
      if (filters.includeInstallments && sales.length > 0) {
        console.log('[GESTAO_CLICK] Buscando detalhes de parcelas para vendas...');
        const salesWithInstallments = await Promise.all(
          sales.map(async (sale: any) => {
            try {
              const parcelas = await this.getSaleInstallments(sale.id);
              return {
                ...sale,
                parcelas
              };
            } catch (error) {
              console.error(`[GESTAO_CLICK] Erro ao buscar parcelas da venda ${sale.id}:`, error);
              return sale;
            }
          })
        );
        
        console.log('[GESTAO_CLICK] Processamento de parcelas concluído');
        return { data: salesWithInstallments };
      }
      
      return result;
    } catch (error) {
      console.error('[GESTAO_CLICK] Erro ao buscar vendas:', error);
      // Retornar um objeto com array vazio em vez de propagar o erro
      return { data: [] };
    }
  }
  
  /**
   * Busca parcelas de uma venda específica
   * @param saleId ID da venda
   * @returns Lista de parcelas
   */
  async getSaleInstallments(saleId: string | number) {
    try {
      // Realizar chamada para API
      const response = await fetch(`${this.apiUrl}/vendas/${saleId}/parcelas`, {
        headers: this.getAuthHeaders(),
      });

      // Se receber 404, significa que a venda não possui parcelas
      if (response.status === 404) {
        console.log(`[GESTAO_CLICK] Venda ${saleId} não possui parcelas (404)`);
        return []; // Retornar array vazio ao invés de lançar erro
      }
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar parcelas: ${response.status}`);
      }

      // Processar dados da resposta
      const data = await response.json();
      
      // Verificar se temos dados válidos antes de processar
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log(`[GESTAO_CLICK] Venda ${saleId} não retornou parcelas (array vazio ou inválido)`);
        return [];
      }
      
      // Adicionar log detalhado para depuração
      console.log(`[GESTAO_CLICK] Venda ${saleId} possui ${data.length} parcelas a processar`);
      
      // Filtrar parcelas já processadas anteriormente baseado em algum critério único
      // Por exemplo, se o IDs das parcelas já foram importados antes
      const parcelas = data.map((parcela: any) => {
        return {
          id: parcela.id,
          numero: parcela.numero,
          valor: parcela.valor,
          dataVencimento: parcela.data_vencimento,
          status: parcela.status,
          formaPagamento: parcela.forma_pagamento?.descricao || 'Não definida',
          vendaId: saleId // Importante para rastreabilidade
        };
      });
      
      return parcelas;
    } catch (error) {
      // Logar o erro, mas retornar array vazio em vez de propagar o erro
      console.warn(`[GESTAO_CLICK] Erro ao buscar parcelas da venda ${saleId}:`, error);
      return []; // Retornar array vazio para não interromper o fluxo
    }
  }

  /**
   * Obter resumo financeiro por período a partir do Gestão Click
   * @param startDate Data de início
   * @param endDate Data de fim
   * @returns Resumo financeiro agrupado por mês
   */
  async getFinancialSummaryByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<GestaoClickFinancialSummary[]> {
    try {
      // Buscar pagamentos e recebimentos para o período
      const payments = await this.fetchPayments(
        this.formatDateForApi(startDate),
        this.formatDateForApi(endDate)
      );
      
      const receipts = await this.fetchReceipts(
        this.formatDateForApi(startDate),
        this.formatDateForApi(endDate)
      );
      
      // Organizando por período (mês)
      const summaryByPeriod = new Map<string, GestaoClickFinancialSummary>();
      
      // Processar pagamentos (despesas)
      this.processTransactionsForSummary(payments, summaryByPeriod, "EXPENSE");
      
      // Processar recebimentos (receitas)
      this.processTransactionsForSummary(receipts, summaryByPeriod, "INCOME");
      
      // Transformar o mapa em um array ordenado por período
      return Array.from(summaryByPeriod.values())
        .sort((a, b) => a.period.localeCompare(b.period));
      
    } catch (error) {
      console.error("Erro ao obter resumo financeiro:", error);
      return [];
    }
  }
  
  /**
   * Processa transações para construir o resumo financeiro
   * @private
   */
  private processTransactionsForSummary(
    transactions: GestaoClickTransaction[],
    summaryMap: Map<string, GestaoClickFinancialSummary>,
    type: 'INCOME' | 'EXPENSE'
  ): void {
    transactions.forEach(tx => {
      // Determinar o período (mês) da transação: YYYY-MM
      const txDate = new Date(tx.data);
      const period = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Obter ou criar o resumo para este período
      if (!summaryMap.has(period)) {
        summaryMap.set(period, this.createEmptySummary(period));
      }
      
      const summary = summaryMap.get(period)!;
      const amount = Number(tx.valor);
      
      // Adicionar ao total apropriado
      if (type === 'INCOME') {
        // Atualizar receitas
        summary.revenues.total += amount;
        
        // Atualizar por categoria
        this.updateCategorySummary(summary.revenues.byCategory, tx.categoria, amount);
        
        // Atualizar por loja
        const storeId = typeof tx.contaBancaria === 'object' ? tx.contaBancaria.id : '';
        const storeName = typeof tx.contaBancaria === 'object' ? tx.contaBancaria.nome : tx.contaBancaria;
        this.updateEntitySummary(summary.revenues.byStore, storeId, storeName, amount);
        
        // Atualizar por centro de custo
        this.updateEntitySummary(
          summary.revenues.byCostCenter, 
          tx.centroCusto || 'sem-centro', 
          tx.centroCusto || 'Sem Centro de Custo', 
          amount
        );
        
        // Atualizar por forma de pagamento
        this.updateEntitySummary(
          summary.revenues.byPaymentMethod, 
          tx.formaPagamento, 
          tx.formaPagamento, 
          amount
        );
      } else {
        // Atualizar despesas
        summary.expenses.total += amount;
        
        // Atualizar por categoria
        this.updateCategorySummary(summary.expenses.byCategory, tx.categoria, amount);
        
        // Atualizar por loja
        const storeId = typeof tx.contaBancaria === 'object' ? tx.contaBancaria.id : '';
        const storeName = typeof tx.contaBancaria === 'object' ? tx.contaBancaria.nome : tx.contaBancaria;
        this.updateEntitySummary(summary.expenses.byStore, storeId, storeName, amount);
        
        // Atualizar por centro de custo
        this.updateEntitySummary(
          summary.expenses.byCostCenter, 
          tx.centroCusto || 'sem-centro', 
          tx.centroCusto || 'Sem Centro de Custo', 
          amount
        );
        
        // Atualizar por forma de pagamento
        this.updateEntitySummary(
          summary.expenses.byPaymentMethod, 
          tx.formaPagamento, 
          tx.formaPagamento, 
          amount
        );
      }
    });
  }
  
  /**
   * Cria um objeto vazio de resumo financeiro para um período
   * @private
   */
  private createEmptySummary(period: string): GestaoClickFinancialSummary {
    return {
      period,
      revenues: {
        total: 0,
        byCategory: [],
        byStore: [],
        byCostCenter: [],
        byPaymentMethod: []
      },
      expenses: {
        total: 0,
        byCategory: [],
        byStore: [],
        byCostCenter: [],
        byPaymentMethod: []
      }
    };
  }
  
  /**
   * Atualiza um resumo por categoria
   * @private
   */
  private updateCategorySummary(
    categories: { id: string; name: string; amount: number }[],
    category: string,
    amount: number
  ): void {
    // Normalizar a categoria
    const categoryId = category.toLowerCase().replace(/\s+/g, '-');
    
    // Procurar a categoria no array
    const existingCategory = categories.find(c => c.id === categoryId);
    
    if (existingCategory) {
      existingCategory.amount += amount;
    } else {
      categories.push({
        id: categoryId,
        name: category,
        amount
      });
    }
  }
  
  /**
   * Atualiza um resumo por entidade (loja, centro de custo, etc.)
   * @private
   */
  private updateEntitySummary(
    entities: { id: string; name: string; amount: number }[],
    id: string,
    name: string,
    amount: number
  ): void {
    // Normalizar ID se vazio
    const entityId = id || 'unknown';
    
    // Procurar a entidade no array
    const existingEntity = entities.find(e => e.id === entityId);
    
    if (existingEntity) {
      existingEntity.amount += amount;
    } else {
      entities.push({
        id: entityId,
        name: name || 'Não especificado',
        amount
      });
    }
  }
  
  /**
   * Formata data para o padrão aceito pela API
   * @private
   */
  private formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Obter dados financeiros para DRE mensal
   * @param year Ano
   * @param month Mês (1-12)
   */
  async getMonthlyDREData(year: number, month: number): Promise<GestaoClickFinancialSummary | null> {
    // Definir período: primeiro e último dia do mês
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Obter resumo financeiro para o período
    const summary = await this.getFinancialSummaryByPeriod(startDate, endDate);
    
    // Encontrar o resumo para o mês especificado
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const monthSummary = summary.find(s => s.period === monthKey);
    
    return monthSummary || null;
  }
  
  /**
   * Obter dados consolidados para DRE anual
   * @param year Ano 
   */
  async getAnnualDREData(year: number): Promise<GestaoClickFinancialSummary[]> {
    // Definir período: todo o ano
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    // Obter resumo financeiro para o período
    return await this.getFinancialSummaryByPeriod(startDate, endDate);
  }

  /**
   * Calcula a próxima data de sincronização (padrão: 24h depois)
   * @private
   */
  private calculateNextSyncDate(currentDate: string): string {
    const date = new Date(currentDate);
    date.setHours(date.getHours() + 24); // Próxima sincronização em 24h
    return date.toISOString();
  }
}

// Exportar funções auxiliares

/**
 * Função auxiliar para testar a conexão com o Gestão Click
 * @param apiKey Token de acesso
 * @param secretToken Token secreto (opcional)
 * @param apiUrl URL da API (opcional)
 * @returns Verdadeiro se a conexão for bem-sucedida
 */
export async function testGestaoClickConnection(
  apiKey: string, 
  secretToken?: string, 
  apiUrl?: string
): Promise<boolean> {
  try {
    const service = GestaoClickService.configure({
      apiKey,
      secretToken,
      apiUrl,
      userId: 'test-connection'
    });
    
    return await service.testConnection();
  } catch (error) {
    console.error('Erro ao testar conexão com Gestão Click:', error);
    return false;
  }
} 
