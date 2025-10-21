/**
 * SERVIÇO CENTRALIZADO DO GESTÃO CLICK PARA CEO
 * 
 * Este serviço é ISOLADO e NÃO depende de outros serviços (BetelTecnologiaService, etc).
 * Todas as requisições à API do Gestão Click passam por aqui.
 * 
 * Características:
 * - Retry com backoff exponencial
 * - Cache de dados auxiliares (formas pagamento, centros custo, etc)
 * - Validação de credenciais
 * - Tratamento robusto de erros
 * - Log estruturado
 * - Timeout configurável
 */

// ============================================================================
// INTERFACES - CAMPOS REAIS VALIDADOS
// ============================================================================

/**
 * Interface para vendas - CAMPOS REAIS da API Gestão Click
 * Baseado em observação do BetelTecnologiaService
 */
export interface GestaoClickVenda {
  id: number;
  cliente: string;
  cliente_id: number;
  
  // Valores (sempre string na API)
  valor_total: string;
  valor_liquido?: string;
  valor_produtos?: string;
  valor_custo?: string;
  desconto_valor?: string;
  desconto_porcentagem?: string;
  valor_frete?: string;
  
  // Datas
  data_inclusao: string; // "YYYY-MM-DD HH:MM:SS"
  data: string; // "YYYY-MM-DD" ou ISO
  data_venda?: string;
  
  // Vendedor
  vendedor_id?: number;
  vendedor_nome?: string;
  nome_vendedor?: string;
  
  // Loja
  loja_id?: string | number;
  nome_loja?: string;
  
  // Status
  nome_situacao?: string; // "Concretizada", "Em andamento", etc
  id_situacao_venda?: number;
  
  // Forma de Pagamento
  forma_pagamento?: string;
  forma_pagamento_id?: number;
  metodo_pagamento?: string;
  
  // Itens da venda
  itens: Array<{
    id: number;
    produto_id: number;
    produto: string;
    descricao?: string;
    categoria?: string;
    quantidade: string;
    valor_unitario: string;
    preco_unitario?: string;
    valor_total: string;
    valor_custo?: string;
  }>;
  
  // Alias para itens (pode vir como "produtos" em algumas respostas)
  produtos?: any[];
  
  // Campos adicionais possíveis
  observacoes?: string;
  notas?: string;
  metadata?: any;
  pagamentos?: Array<{
    id?: number;
    valor?: string;
    status?: string;
    pagamento?: {
      id?: number;
      nome_forma_pagamento?: string;
      tipo_pagamento?: string;
    };
  }>;
}

/**
 * Interface para recebimentos - CAMPOS ASSUMIDOS (PRECISA VALIDAR)
 */
export interface GestaoClickRecebimento {
  id: number;
  valor: string;
  data_recebimento: string;
  data_vencimento?: string;
  forma_pagamento_id?: number;
  forma_pagamento_nome?: string;
  venda_id?: number;
  cliente_id?: number;
  status?: string;
  conta_bancaria_id?: number;
  observacoes?: string;
}

/**
 * Interface para pagamentos - CAMPOS ASSUMIDOS (PRECISA VALIDAR)
 */
export interface GestaoClickPagamento {
  id: number;
  valor: string;
  data_pagamento: string;
  data_vencimento?: string;
  descricao?: string;
  forma_pagamento_id?: number;
  forma_pagamento_nome?: string;
  centro_custo_id?: number;
  centro_custo_nome?: string;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  categoria?: string;
  tipo?: string;
  status?: string;
  plano_conta_id?: number;
  conta_bancaria_id?: number;
}

/**
 * Interface para clientes - CAMPOS ASSUMIDOS (PRECISA VALIDAR)
 */
export interface GestaoClickCliente {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  data_cadastro: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  status?: string;
  // Campos calculados (podem não vir da API)
  ultima_compra?: string;
  total_compras?: number;
  valor_total_gasto?: number;
}

/**
 * Interface para produtos - CAMPOS REAIS VALIDADOS
 */
export interface GestaoClickProduto {
  id: number;
  nome: string;
  descricao?: string;
  valor_venda?: string | number;
  valor_custo?: string | number;
  nome_grupo?: string; // Categoria
  grupo_id?: number;
  estoque?: number;
  codigo?: string;
  ativo?: boolean;
}

/**
 * Interface para lojas - CAMPOS REAIS VALIDADOS
 */
export interface GestaoClickLoja {
  id: string | number;
  nome: string;
  matriz?: boolean;
  endereco?: string;
  cidade?: string;
  estado?: string;
  ativa?: boolean;
}

/**
 * Interface para funcionários - CAMPOS REAIS VALIDADOS
 */
export interface GestaoClickFuncionario {
  id: number;
  nome: string;
  cargo_nome?: string;
  cargo_id?: number;
  email?: string;
  telefone?: string;
  data_admissao?: string;
  status?: string;
  loja_id?: number;
  vendedor?: boolean;
}

/**
 * Interface para centros de custo - CAMPOS ASSUMIDOS (PRECISA VALIDAR)
 */
export interface GestaoClickCentroCusto {
  id: number;
  nome: string;
  descricao?: string;
  codigo?: string;
  tipo?: string;
  ativo?: boolean;
}

/**
 * Interface para formas de pagamento - CAMPOS ASSUMIDOS (PRECISA VALIDAR)
 */
export interface GestaoClickFormaPagamento {
  id: number;
  nome_forma_pagamento: string;
  nome?: string;
  tipo_pagamento?: string;
  categoria?: string;
  ativa?: boolean;
  taxa?: number;
  prazo_compensacao?: number;
}

// ============================================================================
// TIPOS DE RESPOSTA DA API
// ============================================================================

/**
 * Tipo de resposta padrão da API Gestão Click
 * Pode retornar com wrapper "data" ou array direto
 */
type ApiResponse<T> = {
  data: T;
  meta?: {
    total?: number;
    total_paginas?: number;
    pagina_atual?: number;
    proxima_pagina?: number | null;
  };
} | T;

// ============================================================================
// CACHE SIMPLES PARA DADOS AUXILIARES
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em ms
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

export class CEOGestaoClickService {
  private static cache = new SimpleCache();
  
  // TTLs para diferentes tipos de dados
  private static readonly TTL = {
    VENDAS: 5 * 60 * 1000, // 5 minutos
    RECEBIMENTOS: 5 * 60 * 1000, // 5 minutos
    PAGAMENTOS: 5 * 60 * 1000, // 5 minutos
    CLIENTES: 30 * 60 * 1000, // 30 minutos (muda menos)
    PRODUTOS: 30 * 60 * 1000, // 30 minutos
    AUXILIARES: 60 * 60 * 1000, // 1 hora (centros custo, formas pagamento, etc)
  };
  
  // Configurações da API
  private static get API_URL(): string {
    // ✅ CORRIGIDO: Usar .com (sem .br)
    return process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
  }
  
  private static get ACCESS_TOKEN(): string {
    return process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
  }
  
  private static get SECRET_TOKEN(): string {
    return process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
  }
  
  /**
   * Headers para autenticação
   */
  private static getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'access-token': this.ACCESS_TOKEN,
      'secret-access-token': this.SECRET_TOKEN,
    };
  }
  
  /**
   * Verificar se as credenciais estão configuradas
   */
  private static verificarCredenciais(): { valido: boolean; erro?: string } {
    if (!this.ACCESS_TOKEN) {
      return { 
        valido: false, 
        erro: 'GESTAO_CLICK_ACCESS_TOKEN não configurado' 
      };
    }
    
    if (!this.SECRET_TOKEN) {
      return { 
        valido: false, 
        erro: 'GESTAO_CLICK_SECRET_ACCESS_TOKEN não configurado' 
      };
    }
    
    return { valido: true };
  }
  
  /**
   * Fazer requisição com retry e backoff exponencial
   */
  private static async fetchWithRetry<T>(
    endpoint: string,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    // Verificar credenciais primeiro
    const credenciais = this.verificarCredenciais();
    if (!credenciais.valido) {
      throw new Error(`Erro de configuração: ${credenciais.erro}`);
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const url = `${this.API_URL}${endpoint}`;
        
        console.log(`[CEOGestaoClick] Tentativa ${attempt + 1}/${maxRetries}: ${endpoint}`);
        
        const response = await fetch(url, {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000) // 30 segundos
        });
        
        // Tratar erros HTTP
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Erro de autenticação: credenciais inválidas ou expiradas');
          }
          
          if (response.status === 404) {
            throw new Error(`Endpoint não encontrado: ${endpoint}`);
          }
          
          if (response.status >= 500) {
            // Erro do servidor - tentar novamente
            throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
          }
          
          throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Parse da resposta
        const data = await response.json();
        
        // Normalizar resposta (pode vir com ou sem wrapper "data")
        const normalizedData = this.normalizeResponse<T>(data);
        
        console.log(`[CEOGestaoClick] ✅ Sucesso: ${endpoint}`);
        
        return normalizedData;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(`[CEOGestaoClick] ❌ Erro na tentativa ${attempt + 1}:`, lastError.message);
        
        // Não fazer retry para erros de configuração ou autenticação
        if (lastError.message.includes('configuração') || 
            lastError.message.includes('autenticação') ||
            lastError.message.includes('não encontrado')) {
          throw lastError;
        }
        
        // Se não for a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries - 1) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.log(`[CEOGestaoClick] Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    throw lastError || new Error('Falha ao fazer requisição após múltiplas tentativas');
  }
  
  /**
   * Normalizar resposta da API
   * A API pode retornar { data: [...] } ou [...] diretamente
   */
  private static normalizeResponse<T>(response: any): T {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data as T;
    }
    return response as T;
  }
  
  /**
   * Limpar cache expirado (chamar periodicamente)
   */
  static clearExpiredCache(): void {
    this.cache.clearExpired();
  }
  
  /**
   * Limpar todo o cache
   */
  static clearCache(): void {
    this.cache.clear();
    console.log('[CEOGestaoClick] Cache limpo');
  }
  
  // ==========================================================================
  // MÉTODOS PÚBLICOS - VENDAS
  // ==========================================================================
  
  /**
   * Buscar vendas por período
   * 
   * @param dataInicio - Data início no formato YYYY-MM-DD
   * @param dataFim - Data fim no formato YYYY-MM-DD
   * @param opcoes - Opções adicionais
   * @returns Array de vendas
   */
  static async getVendas(
    dataInicio: string,
    dataFim: string,
    opcoes: {
      todasLojas?: boolean;
      lojaId?: string | number;
      situacao?: string;
      useCache?: boolean;
    } = {}
  ): Promise<GestaoClickVenda[]> {
    const {
      todasLojas = true,
      lojaId,
      situacao,
      useCache = true
    } = opcoes;
    
    // Chave de cache
    const cacheKey = `vendas:${dataInicio}:${dataFim}:${todasLojas}:${lojaId || 'all'}:${situacao || 'all'}`;
    
    // Verificar cache
    if (useCache) {
      const cached = this.cache.get<GestaoClickVenda[]>(cacheKey);
      if (cached) {
        console.log(`[CEOGestaoClick] ♻️  Cache hit: ${cacheKey}`);
        return cached;
      }
    }
    
    // Construir query params
    const params = new URLSearchParams({
      data_inicio: dataInicio,
      data_fim: dataFim,
    });
    
    if (todasLojas && !lojaId) {
      params.append('todas_lojas', 'true');
    }
    
    if (lojaId) {
      params.append('loja_id', String(lojaId));
    }
    
    if (situacao) {
      params.append('situacao', situacao);
    }
    
    // Fazer requisição
    const vendas = await this.fetchWithRetry<GestaoClickVenda[]>(
      `/vendas?${params.toString()}`
    );
    
    // Garantir que é array
    const vendasArray = Array.isArray(vendas) ? vendas : [];
    
    // Armazenar em cache
    if (useCache) {
      this.cache.set(cacheKey, vendasArray, this.TTL.VENDAS);
    }
    
    return vendasArray;
  }
  
  // ==========================================================================
  // MÉTODOS PÚBLICOS - RECEBIMENTOS
  // ==========================================================================
  
  /**
   * Buscar recebimentos por período
   * ⚠️ ENDPOINT ASSUMIDO - PRECISA VALIDAR
   */
  static async getRecebimentos(
    dataInicio: string,
    dataFim: string,
    useCache: boolean = true
  ): Promise<GestaoClickRecebimento[]> {
    const cacheKey = `recebimentos:${dataInicio}:${dataFim}`;
    
    if (useCache) {
      const cached = this.cache.get<GestaoClickRecebimento[]>(cacheKey);
      if (cached) {
        console.log(`[CEOGestaoClick] ♻️  Cache hit: ${cacheKey}`);
        return cached;
      }
    }
    
    try {
      const recebimentos = await this.fetchWithRetry<GestaoClickRecebimento[]>(
        `/recebimentos?data_inicio=${dataInicio}&data_fim=${dataFim}`
      );
      
      const recebimentosArray = Array.isArray(recebimentos) ? recebimentos : [];
      
      if (useCache) {
        this.cache.set(cacheKey, recebimentosArray, this.TTL.RECEBIMENTOS);
      }
      
      return recebimentosArray;
    } catch (error) {
      console.warn('[CEOGestaoClick] ⚠️  Endpoint de recebimentos não disponível:', error);
      return [];
    }
  }
  
  // ==========================================================================
  // MÉTODOS PÚBLICOS - PAGAMENTOS
  // ==========================================================================
  
  /**
   * Buscar pagamentos por período
   * ⚠️ ENDPOINT ASSUMIDO - PRECISA VALIDAR
   */
  static async getPagamentos(
    dataInicio: string,
    dataFim: string,
    useCache: boolean = true
  ): Promise<GestaoClickPagamento[]> {
    const cacheKey = `pagamentos:${dataInicio}:${dataFim}`;
    
    if (useCache) {
      const cached = this.cache.get<GestaoClickPagamento[]>(cacheKey);
      if (cached) {
        console.log(`[CEOGestaoClick] ♻️  Cache hit: ${cacheKey}`);
        return cached;
      }
    }
    
    try {
      const pagamentos = await this.fetchWithRetry<GestaoClickPagamento[]>(
        `/pagamentos?data_inicio=${dataInicio}&data_fim=${dataFim}`
      );
      
      const pagamentosArray = Array.isArray(pagamentos) ? pagamentos : [];
      
      if (useCache) {
        this.cache.set(cacheKey, pagamentosArray, this.TTL.PAGAMENTOS);
      }
      
      return pagamentosArray;
    } catch (error) {
      console.warn('[CEOGestaoClick] ⚠️  Endpoint de pagamentos não disponível:', error);
      return [];
    }
  }
  
  // ==========================================================================
  // MÉTODOS PÚBLICOS - CLIENTES
  // ==========================================================================
  
  /**
   * Buscar todos os clientes
   * ⚠️ ENDPOINT ASSUMIDO - PRECISA VALIDAR
   */
  static async getClientes(useCache: boolean = true): Promise<GestaoClickCliente[]> {
    const cacheKey = 'clientes:all';
    
    if (useCache) {
      const cached = this.cache.get<GestaoClickCliente[]>(cacheKey);
      if (cached) {
        console.log(`[CEOGestaoClick] ♻️  Cache hit: ${cacheKey}`);
        return cached;
      }
    }
    
    try {
      const clientes = await this.fetchWithRetry<GestaoClickCliente[]>('/clientes?todos=true');
      
      const clientesArray = Array.isArray(clientes) ? clientes : [];
      
      if (useCache) {
        this.cache.set(cacheKey, clientesArray, this.TTL.CLIENTES);
      }
      
      return clientesArray;
    } catch (error) {
      console.warn('[CEOGestaoClick] ⚠️  Endpoint de clientes não disponível:', error);
      return [];
    }
  }
  
  // ==========================================================================
  // MÉTODOS PÚBLICOS - DADOS AUXILIARES (COM CACHE LONGO)
  // ==========================================================================
  
  /**
   * Buscar produtos
   */
  static async getProdutos(useCache: boolean = true): Promise<GestaoClickProduto[]> {
    const cacheKey = 'produtos:all';
    
    if (useCache) {
      const cached = this.cache.get<GestaoClickProduto[]>(cacheKey);
      if (cached) return cached;
    }
    
    const produtos = await this.fetchWithRetry<GestaoClickProduto[]>('/produtos');
    const produtosArray = Array.isArray(produtos) ? produtos : [];
    
    if (useCache) {
      this.cache.set(cacheKey, produtosArray, this.TTL.PRODUTOS);
    }
    
    return produtosArray;
  }
  
  /**
   * Buscar lojas
   */
  static async getLojas(useCache: boolean = true): Promise<GestaoClickLoja[]> {
    const cacheKey = 'lojas:all';
    
    if (useCache) {
      const cached = this.cache.get<GestaoClickLoja[]>(cacheKey);
      if (cached) return cached;
    }
    
    const lojas = await this.fetchWithRetry<GestaoClickLoja[]>('/lojas');
    const lojasArray = Array.isArray(lojas) ? lojas : [];
    
    if (useCache) {
      this.cache.set(cacheKey, lojasArray, this.TTL.AUXILIARES);
    }
    
    return lojasArray;
  }
  
  /**
   * Buscar funcionários
   */
  static async getFuncionarios(useCache: boolean = true): Promise<GestaoClickFuncionario[]> {
    const cacheKey = 'funcionarios:all';
    
    if (useCache) {
      const cached = this.cache.get<GestaoClickFuncionario[]>(cacheKey);
      if (cached) return cached;
    }
    
    const funcionarios = await this.fetchWithRetry<GestaoClickFuncionario[]>('/funcionarios');
    const funcionariosArray = Array.isArray(funcionarios) ? funcionarios : [];
    
    if (useCache) {
      this.cache.set(cacheKey, funcionariosArray, this.TTL.AUXILIARES);
    }
    
    return funcionariosArray;
  }
  
  /**
   * Buscar centros de custo
   * ⚠️ ENDPOINT ASSUMIDO - PRECISA VALIDAR
   */
  static async getCentrosCusto(useCache: boolean = true): Promise<GestaoClickCentroCusto[]> {
    const cacheKey = 'centros_custo:all';
    
    if (useCache) {
      const cached = this.cache.get<GestaoClickCentroCusto[]>(cacheKey);
      if (cached) return cached;
    }
    
    try {
      const centros = await this.fetchWithRetry<GestaoClickCentroCusto[]>('/centros_custos');
      const centrosArray = Array.isArray(centros) ? centros : [];
      
      if (useCache) {
        this.cache.set(cacheKey, centrosArray, this.TTL.AUXILIARES);
      }
      
      return centrosArray;
    } catch (error) {
      console.warn('[CEOGestaoClick] ⚠️  Endpoint de centros de custo não disponível:', error);
      return [];
    }
  }
  
  /**
   * Buscar formas de pagamento
   * ⚠️ ENDPOINT ASSUMIDO - PRECISA VALIDAR
   */
  static async getFormasPagamento(useCache: boolean = true): Promise<GestaoClickFormaPagamento[]> {
    const cacheKey = 'formas_pagamento:all';
    
    if (useCache) {
      const cached = this.cache.get<GestaoClickFormaPagamento[]>(cacheKey);
      if (cached) return cached;
    }
    
    try {
      const formas = await this.fetchWithRetry<GestaoClickFormaPagamento[]>('/formas_pagamentos');
      const formasArray = Array.isArray(formas) ? formas : [];
      
      if (useCache) {
        this.cache.set(cacheKey, formasArray, this.TTL.AUXILIARES);
      }
      
      return formasArray;
    } catch (error) {
      console.warn('[CEOGestaoClick] ⚠️  Endpoint de formas de pagamento não disponível:', error);
      return [];
    }
  }
  
  // ==========================================================================
  // UTILITÁRIOS
  // ==========================================================================
  
  /**
   * Converter string de valor para número
   * Trata tanto "1234.56" quanto "1234,56"
   */
  static parseValor(valor: string | number | undefined | null): number {
    if (valor === undefined || valor === null) return 0;
    if (typeof valor === 'number') return valor;
    
    // Remover espaços e substituir vírgula por ponto
    const valorNormalizado = valor.toString().trim().replace(',', '.');
    const numero = parseFloat(valorNormalizado);
    
    return isNaN(numero) ? 0 : numero;
  }
  
  /**
   * Converter string de data para objeto Date
   */
  static parseData(data: string | undefined | null): Date | null {
    if (!data) return null;
    
    try {
      // Tentar parse direto
      const date = new Date(data);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Se falhar, tentar formato BR (DD/MM/YYYY)
      const parts = data.split('/');
      if (parts.length === 3) {
        const [dia, mes, ano] = parts;
        return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Formatar data para formato da API (YYYY-MM-DD)
   */
  static formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}



