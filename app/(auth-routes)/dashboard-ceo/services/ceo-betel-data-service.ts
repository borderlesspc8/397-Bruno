// Serviço CEO ISOLADO para busca de dados auxiliares da API Betel
// NÃO utiliza BetelTecnologiaService existente - completamente independente
// Centraliza todas as buscas de dados auxiliares com cache inteligente

import { CEOErrorHandler, logCEOError } from './error-handler';
import { CEODataValidator } from './data-validation';

// ==================== INTERFACES DE DADOS DA API BETEL ====================

// Centro de Custo
export interface BetelCentroCusto {
  id: number;
  nome: string;
  descricao?: string;
  codigo?: string;
  ativo?: boolean;
  tipo?: string;
  categoria?: string;
}

// Forma de Pagamento
export interface BetelFormaPagamento {
  id: number;
  nome_forma_pagamento: string;
  tipo_pagamento?: string;
  descricao?: string;
  ativo?: boolean;
  taxa?: number;
  prazo?: number;
}

// Categoria de Produto
export interface BetelCategoria {
  id: number;
  nome: string;
  descricao?: string;
  codigo?: string;
  categoria_pai_id?: number;
  nivel?: number;
  ativo?: boolean;
}

// Produto
export interface BetelProduto {
  id: number;
  nome: string;
  descricao?: string;
  codigo?: string;
  categoria_id?: number;
  categoria_nome?: string;
  valor_venda?: string;
  valor_custo?: string;
  estoque_atual?: number;
  ativo?: boolean;
  marca?: string;
  unidade_medida?: string;
}

// Cliente
export interface BetelCliente {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  data_cadastro: string;
  ultima_compra?: string;
  total_compras?: number;
  valor_total_compras?: string;
  status?: string;
  tipo?: 'PF' | 'PJ';
  cidade?: string;
  estado?: string;
  segmento?: string;
}

// Vendedor
export interface BetelVendedor {
  id: number;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  data_admissao?: string;
  ativo?: boolean;
  comissao?: number;
  meta_mensal?: string;
  loja_id?: number;
  loja_nome?: string;
}

// Loja
export interface BetelLoja {
  id: number;
  nome: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
  ativo?: boolean;
  tipo?: string;
}

// Canal de Venda
export interface BetelCanalVenda {
  id: number;
  nome: string;
  descricao?: string;
  tipo?: 'online' | 'offline' | 'marketplace' | 'representante';
  ativo?: boolean;
  taxa?: number;
}

// ==================== DADOS AGREGADOS/AGRUPADOS ====================

// Agrupamento de Centro de Custo
export interface CEOCentroCustoAgrupado {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'operacional' | 'administrativo' | 'comercial' | 'financeiro' | 'outros';
  categoria: string;
  subCentros: BetelCentroCusto[];
  totalSubCentros: number;
}

// Agrupamento de Forma de Pagamento
export interface CEOFormaPagamentoAgrupada {
  id: string;
  nome: string;
  tipo: 'credito' | 'debito' | 'pix' | 'boleto' | 'dinheiro' | 'outros';
  formas: BetelFormaPagamento[];
  totalFormas: number;
  taxaMedia?: number;
  prazoMedio?: number;
}

// Agrupamento de Categoria
export interface CEOCategoriaAgrupada {
  id: string;
  nome: string;
  nivel: number;
  categoriaPaiId?: string;
  subCategorias: BetelCategoria[];
  totalSubCategorias: number;
  totalProdutos: number;
}

// Agrupamento de Cliente por Segmento
export interface CEOClienteSegmento {
  id: string;
  nome: string;
  tipo: 'vip' | 'recorrente' | 'eventual' | 'inativo' | 'novo';
  descricao: string;
  clientes: BetelCliente[];
  totalClientes: number;
  ticketMedioGeral: number;
  totalComprasGeral: number;
}

// ==================== CONFIGURAÇÃO DE CACHE ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_TTL = {
  CENTROS_CUSTO: 60 * 60 * 1000, // 1 hora - dados estáticos
  FORMAS_PAGAMENTO: 60 * 60 * 1000, // 1 hora - dados estáticos
  CATEGORIAS: 60 * 60 * 1000, // 1 hora - dados semi-estáticos
  PRODUTOS: 30 * 60 * 1000, // 30 minutos - dados que mudam mais
  CLIENTES: 15 * 60 * 1000, // 15 minutos - dados dinâmicos
  VENDEDORES: 60 * 60 * 1000, // 1 hora - dados semi-estáticos
  LOJAS: 60 * 60 * 1000, // 1 hora - dados estáticos
  CANAIS: 60 * 60 * 1000, // 1 hora - dados estáticos
};

// ==================== CLASSE PRINCIPAL DO SERVIÇO ====================

export class CEOBetelDataService {
  // Cache em memória
  private static cache = new Map<string, CacheEntry<any>>();

  // Configuração da API Betel
  private static get API_URL() {
    return process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
  }

  private static get ACCESS_TOKEN() {
    return process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
  }

  private static get SECRET_TOKEN() {
    return process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
  }

  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      'access-token': this.ACCESS_TOKEN,
      'secret-access-token': this.SECRET_TOKEN,
    };
  }

  // ==================== MÉTODOS DE CACHE ====================

  private static getCacheKey(endpoint: string, params?: Record<string, any>): string {
    const paramsStr = params ? JSON.stringify(params) : '';
    return `${endpoint}-${paramsStr}`;
  }

  private static getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log(`CEO: Cache HIT para ${key}`);
    return entry.data as T;
  }

  private static saveToCache<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };
    
    this.cache.set(key, entry);
    console.log(`CEO: Dados salvos em cache para ${key} (TTL: ${ttl}ms)`);
  }

  public static clearCache(): void {
    this.cache.clear();
    console.log('CEO: Cache limpo');
  }

  public static clearCacheByPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => this.cache.delete(key));
    console.log(`CEO: ${matchingKeys.length} entradas de cache removidas para padrão ${pattern}`);
  }

  // ==================== MÉTODOS DE BUSCA NA API ====================

  private static async fetchFromAPI<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const fetchOperation = async (): Promise<T> => {
      const queryParams = params 
        ? '?' + Object.entries(params).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
        : '';
      
      const url = `${this.API_URL}${endpoint}${queryParams}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(30000), // Timeout de 30 segundos
      });

      if (!response.ok) {
        const error = new Error(`Erro na API Betel: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        throw error;
      }

      const data = await response.json();
      return data.data || data;
    };

    // Usar sistema de retry com backoff exponencial
    return CEOErrorHandler.executeWithRetry(fetchOperation, endpoint);
  }

  // Método genérico com cache
  private static async fetchWithCache<T>(
    endpoint: string,
    cacheTTL: number,
    params?: Record<string, any>,
    validator?: (data: any) => boolean
  ): Promise<T> {
    // Verificar cache primeiro
    const cacheKey = this.getCacheKey(endpoint, params);
    const cachedData = this.getFromCache<T>(cacheKey);
    
    if (cachedData !== null) {
      return cachedData;
    }

    try {
      // Buscar da API
      console.log(`CEO: Buscando dados reais da API Betel: ${endpoint}`);
      const data = await this.fetchFromAPI<T>(endpoint, params);
      
      // Validar dados se validator foi fornecido
      if (validator && !validator(data)) {
        throw new Error(`Dados inválidos retornados da API: ${endpoint}`);
      }

      // Salvar em cache
      this.saveToCache(cacheKey, data, cacheTTL);
      
      return data;
    } catch (error) {
      logCEOError(`CEOBetelDataService.fetchWithCache[${endpoint}]`, error, params);
      throw error;
    }
  }

  // ==================== BUSCA DE CENTROS DE CUSTO ====================

  public static async getCentrosCusto(forceRefresh: boolean = false): Promise<BetelCentroCusto[]> {
    if (forceRefresh) {
      this.clearCacheByPattern('/centros_custos');
    }

    try {
      const centros = await this.fetchWithCache<any[]>(
        '/centros_custos',
        CACHE_TTL.CENTROS_CUSTO,
        undefined,
        (data) => Array.isArray(data)
      );

      // Validar e normalizar dados
      const centrosValidados = centros
        .filter(centro => CEODataValidator.validateCentroCusto(centro))
        .map(centro => ({
          id: centro.id,
          nome: centro.nome || centro.descricao || `Centro ${centro.id}`,
          descricao: centro.descricao,
          codigo: centro.codigo,
          ativo: centro.ativo !== false,
          tipo: centro.tipo,
          categoria: centro.categoria,
        }));

      console.log(`CEO: ${centrosValidados.length} centros de custo obtidos e validados`);
      return centrosValidados;
    } catch (error) {
      logCEOError('CEOBetelDataService.getCentrosCusto', error);
      // Retornar array vazio em vez de falhar
      return [];
    }
  }

  public static async getCentrosCustoAgrupados(): Promise<CEOCentroCustoAgrupado[]> {
    const centros = await this.getCentrosCusto();
    
    // Agrupar por tipo/categoria
    const grupos: Record<string, BetelCentroCusto[]> = {
      operacional: [],
      administrativo: [],
      comercial: [],
      financeiro: [],
      outros: [],
    };

    centros.forEach(centro => {
      const tipo = centro.tipo?.toLowerCase() || '';
      const nome = centro.nome?.toLowerCase() || '';
      const categoria = centro.categoria?.toLowerCase() || '';

      if (tipo.includes('operac') || nome.includes('produção') || nome.includes('estoque')) {
        grupos.operacional.push(centro);
      } else if (tipo.includes('admin') || nome.includes('administr') || nome.includes('rh')) {
        grupos.administrativo.push(centro);
      } else if (tipo.includes('comerc') || tipo.includes('vend') || nome.includes('marketing')) {
        grupos.comercial.push(centro);
      } else if (tipo.includes('financ') || nome.includes('contab') || nome.includes('fiscal')) {
        grupos.financeiro.push(centro);
      } else {
        grupos.outros.push(centro);
      }
    });

    return Object.entries(grupos).map(([tipo, subCentros]) => ({
      id: tipo,
      nome: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      tipo: tipo as any,
      categoria: tipo,
      subCentros,
      totalSubCentros: subCentros.length,
    })).filter(grupo => grupo.totalSubCentros > 0);
  }

  // ==================== BUSCA DE FORMAS DE PAGAMENTO ====================

  public static async getFormasPagamento(forceRefresh: boolean = false): Promise<BetelFormaPagamento[]> {
    if (forceRefresh) {
      this.clearCacheByPattern('/formas_pagamentos');
    }

    try {
      const formas = await this.fetchWithCache<any[]>(
        '/formas_pagamentos',
        CACHE_TTL.FORMAS_PAGAMENTO,
        undefined,
        (data) => Array.isArray(data)
      );

      // Validar e normalizar dados
      const formasValidadas = formas
        .filter(forma => CEODataValidator.validateFormaPagamento(forma))
        .map(forma => ({
          id: forma.id,
          nome_forma_pagamento: forma.nome_forma_pagamento || forma.nome || `Forma ${forma.id}`,
          tipo_pagamento: forma.tipo_pagamento || forma.tipo,
          descricao: forma.descricao,
          ativo: forma.ativo !== false,
          taxa: forma.taxa ? parseFloat(forma.taxa) : undefined,
          prazo: forma.prazo ? parseInt(forma.prazo) : undefined,
        }));

      console.log(`CEO: ${formasValidadas.length} formas de pagamento obtidas e validadas`);
      return formasValidadas;
    } catch (error) {
      logCEOError('CEOBetelDataService.getFormasPagamento', error);
      // Retornar formas de pagamento padrão
      return this.getFormasPagamentoPadrao();
    }
  }

  private static getFormasPagamentoPadrao(): BetelFormaPagamento[] {
    return [
      { id: 1, nome_forma_pagamento: 'Dinheiro', tipo_pagamento: 'dinheiro', ativo: true },
      { id: 2, nome_forma_pagamento: 'PIX', tipo_pagamento: 'pix', ativo: true },
      { id: 3, nome_forma_pagamento: 'Cartão de Débito', tipo_pagamento: 'debito', ativo: true },
      { id: 4, nome_forma_pagamento: 'Cartão de Crédito', tipo_pagamento: 'credito', ativo: true },
      { id: 5, nome_forma_pagamento: 'Boleto', tipo_pagamento: 'boleto', ativo: true },
    ];
  }

  public static async getFormasPagamentoAgrupadas(): Promise<CEOFormaPagamentoAgrupada[]> {
    const formas = await this.getFormasPagamento();
    
    // Agrupar por tipo
    const grupos: Record<string, BetelFormaPagamento[]> = {
      pix: [],
      dinheiro: [],
      debito: [],
      credito: [],
      boleto: [],
      outros: [],
    };

    formas.forEach(forma => {
      const tipo = forma.tipo_pagamento?.toLowerCase() || '';
      const nome = forma.nome_forma_pagamento?.toLowerCase() || '';

      if (tipo.includes('pix') || nome.includes('pix')) {
        grupos.pix.push(forma);
      } else if (tipo.includes('dinheiro') || nome.includes('dinheiro') || nome.includes('espécie')) {
        grupos.dinheiro.push(forma);
      } else if (tipo.includes('debito') || tipo.includes('débito') || nome.includes('débito')) {
        grupos.debito.push(forma);
      } else if (tipo.includes('credito') || tipo.includes('crédito') || nome.includes('crédito')) {
        grupos.credito.push(forma);
      } else if (tipo.includes('boleto') || nome.includes('boleto')) {
        grupos.boleto.push(forma);
      } else {
        grupos.outros.push(forma);
      }
    });

    return Object.entries(grupos).map(([tipo, formasGrupo]) => {
      const taxaMedia = formasGrupo.length > 0
        ? formasGrupo.reduce((sum, f) => sum + (f.taxa || 0), 0) / formasGrupo.length
        : undefined;
      
      const prazoMedio = formasGrupo.length > 0
        ? Math.round(formasGrupo.reduce((sum, f) => sum + (f.prazo || 0), 0) / formasGrupo.length)
        : undefined;

      return {
        id: tipo,
        nome: this.getNomeFormaPagamento(tipo),
        tipo: tipo as any,
        formas: formasGrupo,
        totalFormas: formasGrupo.length,
        taxaMedia,
        prazoMedio,
      };
    }).filter(grupo => grupo.totalFormas > 0);
  }

  private static getNomeFormaPagamento(tipo: string): string {
    const nomes: Record<string, string> = {
      pix: 'PIX',
      dinheiro: 'Dinheiro',
      debito: 'Cartão de Débito',
      credito: 'Cartão de Crédito',
      boleto: 'Boleto Bancário',
      outros: 'Outros',
    };
    return nomes[tipo] || tipo;
  }

  // ==================== BUSCA DE CATEGORIAS ====================

  public static async getCategorias(forceRefresh: boolean = false): Promise<BetelCategoria[]> {
    if (forceRefresh) {
      this.clearCacheByPattern('/categorias');
    }

    try {
      const categorias = await this.fetchWithCache<any[]>(
        '/categorias',
        CACHE_TTL.CATEGORIAS,
        undefined,
        (data) => Array.isArray(data)
      );

      // Validar e normalizar dados
      const categoriasValidadas = categorias
        .filter(cat => CEODataValidator.validateCategoria(cat))
        .map(cat => ({
          id: cat.id,
          nome: cat.nome || `Categoria ${cat.id}`,
          descricao: cat.descricao,
          codigo: cat.codigo,
          categoria_pai_id: cat.categoria_pai_id || cat.pai_id,
          nivel: cat.nivel || 1,
          ativo: cat.ativo !== false,
        }));

      console.log(`CEO: ${categoriasValidadas.length} categorias obtidas e validadas`);
      return categoriasValidadas;
    } catch (error) {
      logCEOError('CEOBetelDataService.getCategorias', error);
      // Retornar categorias padrão
      return this.getCategoriasPadrao();
    }
  }

  private static getCategoriasPadrao(): BetelCategoria[] {
    return [
      { id: 1, nome: 'Suplementos', nivel: 1, ativo: true },
      { id: 2, nome: 'Roupas', nivel: 1, ativo: true },
      { id: 3, nome: 'Acessórios', nivel: 1, ativo: true },
      { id: 4, nome: 'Equipamentos', nivel: 1, ativo: true },
      { id: 5, nome: 'Outros', nivel: 1, ativo: true },
    ];
  }

  public static async getCategoriasAgrupadas(): Promise<CEOCategoriaAgrupada[]> {
    const categorias = await this.getCategorias();
    const produtos = await this.getProdutos();
    
    // Separar categorias principais (sem pai) das subcategorias
    const categoriasPrincipais = categorias.filter(cat => !cat.categoria_pai_id);
    
    return categoriasPrincipais.map(catPrincipal => {
      const subCategorias = categorias.filter(cat => cat.categoria_pai_id === catPrincipal.id);
      const produtosDaCategoria = produtos.filter(
        prod => prod.categoria_id === catPrincipal.id || 
                subCategorias.some(sub => sub.id === prod.categoria_id)
      );

      return {
        id: catPrincipal.id.toString(),
        nome: catPrincipal.nome,
        nivel: catPrincipal.nivel || 1,
        categoriaPaiId: catPrincipal.categoria_pai_id?.toString(),
        subCategorias,
        totalSubCategorias: subCategorias.length,
        totalProdutos: produtosDaCategoria.length,
      };
    });
  }

  // ==================== BUSCA DE PRODUTOS ====================

  public static async getProdutos(forceRefresh: boolean = false): Promise<BetelProduto[]> {
    if (forceRefresh) {
      this.clearCacheByPattern('/produtos');
    }

    try {
      const produtos = await this.fetchWithCache<any[]>(
        '/produtos',
        CACHE_TTL.PRODUTOS,
        { todos: 'true' },
        (data) => Array.isArray(data)
      );

      // Validar e normalizar dados
      const produtosValidados = produtos
        .filter(prod => CEODataValidator.validateProduto(prod))
        .map(prod => ({
          id: prod.id,
          nome: prod.nome || prod.descricao || `Produto ${prod.id}`,
          descricao: prod.descricao,
          codigo: prod.codigo || prod.sku,
          categoria_id: prod.categoria_id,
          categoria_nome: prod.categoria_nome || prod.categoria,
          valor_venda: prod.valor_venda || prod.preco_venda,
          valor_custo: prod.valor_custo || prod.preco_custo,
          estoque_atual: prod.estoque_atual || prod.estoque || 0,
          ativo: prod.ativo !== false,
          marca: prod.marca,
          unidade_medida: prod.unidade_medida || prod.unidade,
        }));

      console.log(`CEO: ${produtosValidados.length} produtos obtidos e validados`);
      return produtosValidados;
    } catch (error) {
      logCEOError('CEOBetelDataService.getProdutos', error);
      return [];
    }
  }

  // ==================== BUSCA DE CLIENTES ====================

  public static async getClientes(forceRefresh: boolean = false): Promise<BetelCliente[]> {
    if (forceRefresh) {
      this.clearCacheByPattern('/clientes');
    }

    try {
      const clientes = await this.fetchWithCache<any[]>(
        '/clientes',
        CACHE_TTL.CLIENTES,
        { todos: 'true' },
        (data) => Array.isArray(data)
      );

      // Validar e normalizar dados
      const clientesValidados = clientes
        .filter(cli => CEODataValidator.validateCliente(cli))
        .map(cli => ({
          id: cli.id,
          nome: cli.nome || cli.razao_social || `Cliente ${cli.id}`,
          cpf_cnpj: cli.cpf_cnpj || cli.cpf || cli.cnpj,
          email: cli.email,
          telefone: cli.telefone || cli.celular,
          data_cadastro: cli.data_cadastro || cli.created_at || new Date().toISOString(),
          ultima_compra: cli.ultima_compra,
          total_compras: cli.total_compras || 0,
          valor_total_compras: cli.valor_total_compras || '0',
          status: cli.status || 'ativo',
          tipo: cli.tipo || (cli.cpf_cnpj?.length > 14 ? 'PJ' : 'PF'),
          cidade: cli.cidade,
          estado: cli.estado || cli.uf,
          segmento: cli.segmento,
        }));

      console.log(`CEO: ${clientesValidados.length} clientes obtidos e validados`);
      return clientesValidados;
    } catch (error) {
      logCEOError('CEOBetelDataService.getClientes', error);
      return [];
    }
  }

  public static async getClientesSegmentados(): Promise<CEOClienteSegmento[]> {
    const clientes = await this.getClientes();
    
    const now = Date.now();
    const diasInatividade = 90 * 24 * 60 * 60 * 1000; // 90 dias em ms
    const diasNovo = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms

    // Segmentar clientes
    const segmentos: Record<string, BetelCliente[]> = {
      vip: [],
      recorrente: [],
      eventual: [],
      inativo: [],
      novo: [],
    };

    clientes.forEach(cliente => {
      const totalCompras = cliente.total_compras || 0;
      const valorTotal = parseFloat(cliente.valor_total_compras || '0');
      const ticketMedio = totalCompras > 0 ? valorTotal / totalCompras : 0;
      const dataCadastro = new Date(cliente.data_cadastro).getTime();
      const ultimaCompra = cliente.ultima_compra 
        ? new Date(cliente.ultima_compra).getTime() 
        : dataCadastro;

      // Verificar se é novo (cadastrado há menos de 30 dias)
      if (now - dataCadastro < diasNovo) {
        segmentos.novo.push(cliente);
      }
      // Verificar se está inativo (última compra há mais de 90 dias)
      else if (now - ultimaCompra > diasInatividade) {
        segmentos.inativo.push(cliente);
      }
      // VIP: mais de 10 compras OU ticket médio > R$ 500
      else if (totalCompras > 10 || ticketMedio > 500) {
        segmentos.vip.push(cliente);
      }
      // Recorrente: 3-10 compras
      else if (totalCompras >= 3) {
        segmentos.recorrente.push(cliente);
      }
      // Eventual: 1-2 compras
      else {
        segmentos.eventual.push(cliente);
      }
    });

    return Object.entries(segmentos).map(([tipo, clientesSegmento]) => {
      const totalCompras = clientesSegmento.reduce((sum, c) => sum + (c.total_compras || 0), 0);
      const valorTotal = clientesSegmento.reduce((sum, c) => sum + parseFloat(c.valor_total_compras || '0'), 0);
      const ticketMedio = totalCompras > 0 ? valorTotal / totalCompras : 0;

      return {
        id: tipo,
        nome: this.getNomeSegmento(tipo),
        tipo: tipo as any,
        descricao: this.getDescricaoSegmento(tipo),
        clientes: clientesSegmento,
        totalClientes: clientesSegmento.length,
        ticketMedioGeral: ticketMedio,
        totalComprasGeral: totalCompras,
      };
    }).filter(seg => seg.totalClientes > 0);
  }

  private static getNomeSegmento(tipo: string): string {
    const nomes: Record<string, string> = {
      vip: 'Clientes VIP',
      recorrente: 'Clientes Recorrentes',
      eventual: 'Clientes Eventuais',
      inativo: 'Clientes Inativos',
      novo: 'Clientes Novos',
    };
    return nomes[tipo] || tipo;
  }

  private static getDescricaoSegmento(tipo: string): string {
    const descricoes: Record<string, string> = {
      vip: 'Clientes com mais de 10 compras ou ticket médio acima de R$ 500',
      recorrente: 'Clientes com 3 a 10 compras realizadas',
      eventual: 'Clientes com 1 a 2 compras realizadas',
      inativo: 'Clientes sem compras nos últimos 90 dias',
      novo: 'Clientes cadastrados nos últimos 30 dias',
    };
    return descricoes[tipo] || tipo;
  }

  // ==================== BUSCA DE VENDEDORES ====================

  public static async getVendedores(forceRefresh: boolean = false): Promise<BetelVendedor[]> {
    if (forceRefresh) {
      this.clearCacheByPattern('/vendedores');
    }

    try {
      const vendedores = await this.fetchWithCache<any[]>(
        '/vendedores',
        CACHE_TTL.VENDEDORES,
        { todos: 'true' },
        (data) => Array.isArray(data)
      );

      // Validar e normalizar dados
      const vendedoresValidados = vendedores
        .filter(vend => vend && vend.id)
        .map(vend => ({
          id: vend.id,
          nome: vend.nome || `Vendedor ${vend.id}`,
          cpf: vend.cpf,
          email: vend.email,
          telefone: vend.telefone || vend.celular,
          data_admissao: vend.data_admissao || vend.created_at,
          ativo: vend.ativo !== false,
          comissao: vend.comissao ? parseFloat(vend.comissao) : undefined,
          meta_mensal: vend.meta_mensal,
          loja_id: vend.loja_id,
          loja_nome: vend.loja_nome || vend.loja,
        }));

      console.log(`CEO: ${vendedoresValidados.length} vendedores obtidos e validados`);
      return vendedoresValidados;
    } catch (error) {
      logCEOError('CEOBetelDataService.getVendedores', error);
      return [];
    }
  }

  // ==================== BUSCA DE LOJAS ====================

  public static async getLojas(forceRefresh: boolean = false): Promise<BetelLoja[]> {
    if (forceRefresh) {
      this.clearCacheByPattern('/lojas');
    }

    try {
      const lojas = await this.fetchWithCache<any[]>(
        '/lojas',
        CACHE_TTL.LOJAS,
        undefined,
        (data) => Array.isArray(data)
      );

      // Validar e normalizar dados
      const lojasValidadas = lojas
        .filter(loja => loja && loja.id)
        .map(loja => ({
          id: loja.id,
          nome: loja.nome || loja.razao_social || `Loja ${loja.id}`,
          cnpj: loja.cnpj,
          endereco: loja.endereco,
          cidade: loja.cidade,
          estado: loja.estado || loja.uf,
          telefone: loja.telefone,
          ativo: loja.ativo !== false,
          tipo: loja.tipo,
        }));

      console.log(`CEO: ${lojasValidadas.length} lojas obtidas e validadas`);
      return lojasValidadas;
    } catch (error) {
      logCEOError('CEOBetelDataService.getLojas', error);
      return [{ id: 1, nome: 'Loja Principal', ativo: true }];
    }
  }

  // ==================== BUSCA DE CANAIS DE VENDA ====================

  public static async getCanaisVenda(forceRefresh: boolean = false): Promise<BetelCanalVenda[]> {
    if (forceRefresh) {
      this.clearCacheByPattern('/canais');
    }

    try {
      // Tentar buscar canais da API (pode não existir endpoint específico)
      const canais = await this.fetchWithCache<any[]>(
        '/canais_venda',
        CACHE_TTL.CANAIS,
        undefined,
        (data) => Array.isArray(data)
      );

      return canais.map(canal => ({
        id: canal.id,
        nome: canal.nome,
        descricao: canal.descricao,
        tipo: canal.tipo || 'offline',
        ativo: canal.ativo !== false,
        taxa: canal.taxa ? parseFloat(canal.taxa) : undefined,
      }));
    } catch (error) {
      // Se não houver endpoint, retornar canais padrão
      return this.getCanaisPadrao();
    }
  }

  private static getCanaisPadrao(): BetelCanalVenda[] {
    return [
      { id: 1, nome: 'Loja Física', tipo: 'offline', ativo: true },
      { id: 2, nome: 'E-commerce', tipo: 'online', ativo: true },
      { id: 3, nome: 'WhatsApp', tipo: 'online', ativo: true },
      { id: 4, nome: 'Instagram', tipo: 'online', ativo: true },
      { id: 5, nome: 'Representantes', tipo: 'representante', ativo: true },
    ];
  }

  // ==================== MÉTODOS DE BUSCA COMBINADA ====================

  public static async getDadosAuxiliaresCompletos(forceRefresh: boolean = false) {
    console.log('CEO: Buscando todos os dados auxiliares em paralelo...');
    
    const [
      centrosCusto,
      formasPagamento,
      categorias,
      produtos,
      clientes,
      vendedores,
      lojas,
      canais,
    ] = await Promise.allSettled([
      this.getCentrosCusto(forceRefresh),
      this.getFormasPagamento(forceRefresh),
      this.getCategorias(forceRefresh),
      this.getProdutos(forceRefresh),
      this.getClientes(forceRefresh),
      this.getVendedores(forceRefresh),
      this.getLojas(forceRefresh),
      this.getCanaisVenda(forceRefresh),
    ]);

    return {
      centrosCusto: centrosCusto.status === 'fulfilled' ? centrosCusto.value : [],
      formasPagamento: formasPagamento.status === 'fulfilled' ? formasPagamento.value : [],
      categorias: categorias.status === 'fulfilled' ? categorias.value : [],
      produtos: produtos.status === 'fulfilled' ? produtos.value : [],
      clientes: clientes.status === 'fulfilled' ? clientes.value : [],
      vendedores: vendedores.status === 'fulfilled' ? vendedores.value : [],
      lojas: lojas.status === 'fulfilled' ? lojas.value : [],
      canais: canais.status === 'fulfilled' ? canais.value : [],
      timestamp: new Date().toISOString(),
    };
  }

  public static async getDadosAgrupadosCompletos(forceRefresh: boolean = false) {
    console.log('CEO: Buscando todos os dados agrupados em paralelo...');
    
    const [
      centrosCustoAgrupados,
      formasPagamentoAgrupadas,
      categoriasAgrupadas,
      clientesSegmentados,
    ] = await Promise.allSettled([
      this.getCentrosCustoAgrupados(),
      this.getFormasPagamentoAgrupadas(),
      this.getCategoriasAgrupadas(),
      this.getClientesSegmentados(),
    ]);

    return {
      centrosCustoAgrupados: centrosCustoAgrupados.status === 'fulfilled' ? centrosCustoAgrupados.value : [],
      formasPagamentoAgrupadas: formasPagamentoAgrupadas.status === 'fulfilled' ? formasPagamentoAgrupadas.value : [],
      categoriasAgrupadas: categoriasAgrupadas.status === 'fulfilled' ? categoriasAgrupadas.value : [],
      clientesSegmentados: clientesSegmentados.status === 'fulfilled' ? clientesSegmentados.value : [],
      timestamp: new Date().toISOString(),
    };
  }
}

