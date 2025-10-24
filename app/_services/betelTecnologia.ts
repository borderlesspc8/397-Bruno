import { api } from '@/app/_lib/api';
import { format, parseISO } from 'date-fns';
import { Produto, ProdutosResponse } from './produtos';
import { isDemoMode } from '../_lib/config';
import { cacheService } from '../_lib/cache';
import { roundToCents, parseValueSafe, sumWithPrecision } from '../_utils/number-processor';

interface BetelOrcamento {
  id: number;
  id_situacao_orcamento: number;
  cliente: string;
  cliente_id: number;
  valor_total: string;
  data_inclusao: string;
  itens: BetelItem[];
}

interface BetelVenda {
  id: number;
  cliente: string;
  cliente_id: number;
  valor_total: string;
  data_inclusao: string;
  data: string; // Data da venda no formato YYYY-MM-DD
  data_venda?: string; // Data da venda com timestamp
  vendedor_id?: number;
  vendedor_nome?: string;
  nome_vendedor?: string;
  loja_id?: string | number;
  nome_loja?: string;
  valor_custo?: string;
  nome_situacao?: string;
  desconto_valor?: string;
  desconto_porcentagem?: string;
  valor_produtos?: string;
  itens: BetelItem[];
  // Campos de forma de pagamento
  forma_pagamento?: string;
  metodo_pagamento?: string;
  forma_pagamento_original?: string;
  tipo_pagamento?: string;
  payment_method?: string;
  payment_type?: string;
  payment_form?: string;
  forma_pagamento_id?: number;
  pagamento_id?: number;
  pagamento_tipo?: string;
  pagamento_metodo?: string;
  pagamento_forma?: string;
  // Array de pagamentos (para vendas com múltiplas formas de pagamento)
  pagamentos?: Array<{
    id?: number;
    valor?: string;
    status?: string;
    pagamento?: {
      id?: number;
      nome_forma_pagamento?: string;
      tipo_pagamento?: string;
      metodo_pagamento?: string;
      forma_pagamento?: string;
    };
  }>;
  // Campos de metadata e observações
  metadata?: any;
  observacoes?: string;
  notas?: string;
  info_pagamento?: string;
  payment_info?: string;
  transaction_details?: string;
  detalhes_pagamento?: string;
}

interface BetelItem {
  id: number;
  produto_id: number;
  produto: string;
  categoria?: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  valor_custo?: string;
}

interface SituacaoOrcamento {
  id: number;
  nome: string;
  cor: string;
  // Situações consideradas como vendas finalizadas (ex: "Aprovado", "Entregue")
  finalizadas: boolean;
}

export interface Vendedor {
  id: string;
  nome: string;
  vendas: number;
  faturamento: number;
  ticketMedio: number;
  lojaId?: string;      // ID da loja do vendedor
  lojaNome?: string;    // Nome da loja do vendedor
}

export interface VendedoresResponse {
  vendedores: Vendedor[];
  totalVendedores: number;
  totalVendas: number;
  totalFaturamento: number;
  erro?: string;
}

export class BetelTecnologiaService {
  // Config padrão - lendo dinamicamente para garantir que as variáveis estejam carregadas
  private static get API_URL() {
    return process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
  }
  
  private static get ACCESS_TOKEN() {
    return process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
  }
  
  private static get SECRET_TOKEN() {
    return process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
  }

  /**
   * NOTA IMPORTANTE SOBRE LOJAS:
   * 
   * O Gestão Click gerencia dados de múltiplas lojas (matriz e filiais).
   * Por padrão, esta implementação busca dados de TODAS as lojas ao incluir
   * o parâmetro 'todas_lojas=true' nas requisições de vendas.
   * 
   * Se for necessário filtrar por lojas específicas, será preciso
   * implementar um parâmetro adicional na interface e métodos de busca.
   */

  /**
   * Retorna os headers necessários para autenticação com a API externa
   */
  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      'access-token': this.ACCESS_TOKEN,
      'secret-access-token': this.SECRET_TOKEN,
    };
  }

  /**
   * Verifica se as credenciais da API externa estão configuradas
   * Log detalhado para facilitar debug
   */
  private static verificarCredenciais(): { valido: boolean; mensagem?: string } {
    // Verificar se estamos em modo demo
    if (isDemoMode) {
      console.log('Modo de demonstração ativado. As credenciais não são necessárias.');
      return { valido: true };
    }
    
    // Log detalhado do estado das configurações (sem expor tokens completos)
    console.log('Verificando configurações da API externa:', {
      apiUrl: this.API_URL,
      accessTokenConfigured: !!this.ACCESS_TOKEN,
      secretTokenConfigured: !!this.SECRET_TOKEN,
      accessTokenLength: this.ACCESS_TOKEN?.length || 0,
      secretTokenLength: this.SECRET_TOKEN?.length || 0
    });

    // Verificar se a URL da API está configurada corretamente
    if (!this.API_URL || this.API_URL === 'https://api.beteltecnologia.com') {
      console.warn('URL da API externa não configurada ou usando valor padrão');
    }

    if (!this.ACCESS_TOKEN) {
      console.error('Token de acesso da API externa não configurado');
      return { valido: false, mensagem: 'Token de acesso não configurado (GESTAO_CLICK_ACCESS_TOKEN)' };
    }

    if (!this.SECRET_TOKEN) {
      console.error('Token secreto da API externa não configurado');
      return { valido: false, mensagem: 'Token secreto não configurado (GESTAO_CLICK_SECRET_ACCESS_TOKEN)' };
    }

    return { valido: true };
  }

  /**
   * Método utilitário para tentativas múltiplas de requisição à API externa
   * com tratamento padronizado de erros e caching
   */
  private static async fetchWithRetry<T>(
    url: string, 
    options = {}, 
    maxRetries = 2
  ): Promise<{ data: T | null; error: string | null }> {
    // Gerar uma chave de cache única para esta requisição
    const cacheKey = `betel:${url}`;
    
    // Usar o serviço de cache para buscar os dados
    try {
      return await cacheService.get<{ data: T | null; error: string | null }>(
        cacheKey,
        async () => {
          // Se estamos em modo demo, usar dados mockados
          if (isDemoMode) {
            console.log(`Modo de demonstração ativado. Retornando dados mockados para: ${url}`);
            return this.getMockData<T>(url);
          }
          
          // Caso contrário, fazer requisições à API real
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Se não for a primeira tentativa, aguardar tempo exponencial
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Tentativa ${attempt} falhou, aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // Verificar credenciais antes de fazer qualquer chamada
        const credenciais = this.verificarCredenciais();
        if (!credenciais.valido) {
          throw new Error(credenciais.mensagem);
        }
        
        const response = await fetch(`${this.API_URL}${url}`, {
          ...options,
          headers: this.getHeaders()
        });
        
        // Tratar erros de autenticação
        if (response.status === 401) {
          // Tentar obter mais detalhes da resposta
          let responseDetails = '';
          try {
            const responseBody = await response.text();
            responseDetails = ` - Detalhes: ${responseBody || 'Sem detalhes adicionais'}`;
          } catch (e) {
            // Ignorar erro se não conseguir obter o texto da resposta
          }
          
          console.error(`Erro de autenticação (401) ao acessar ${url}${responseDetails}`);
          throw new Error(`Erro de autenticação: credenciais inválidas ou expiradas para a API Betel Tecnologia${responseDetails}`);
        }
        
        // Tratar erro de autorização (403)
        if (response.status === 403) {
          let responseDetails = '';
          try {
            const responseBody = await response.text();
            responseDetails = ` - Detalhes: ${responseBody || 'Sem detalhes adicionais'}`;
          } catch (e) {
            // Ignorar erro se não conseguir obter o texto da resposta
          }
          
          console.error(`Erro de autorização (403) ao acessar ${url}${responseDetails}`);
          throw new Error(`Erro de autorização: acesso negado pela API Betel Tecnologia. Verifique se as credenciais têm permissão para acessar este recurso${responseDetails}`);
        }
        
        // Tratar outros erros HTTP
        if (!response.ok) {
          let responseDetails = '';
          try {
            const responseBody = await response.text();
            responseDetails = ` - Detalhes: ${responseBody || 'Sem detalhes adicionais'}`;
          } catch (e) {
            // Ignorar erro se não conseguir obter o texto da resposta
          }
          
          throw new Error(`Erro na API externa: ${response.status} - ${response.statusText}${responseDetails}`);
        }
        
        const data = await response.json();
        return { data, error: null };
      } catch (error) {
        lastError = error;
        console.error(`Erro na tentativa ${attempt} de acesso à API externa:`, error);
        
        // Se for erro de credenciais, não faz sentido tentar novamente
        if (error instanceof Error && 
            (error.message.includes('Token') || error.message.includes('credenciais'))) {
          break;
        }
      }
    }
    
    return { 
      data: null, 
      error: lastError instanceof Error ? lastError.message : String(lastError) 
    };
        },
        {
          // Definir fonte dos dados para tempo de expiração apropriado
          source: isDemoMode ? 'mock' : 'api',
        }
      );
    } catch (error) {
      console.error(`Erro ao buscar dados (com cache) para ${url}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Método para gerar dados mockados baseado na URL solicitada
   */
  private static getMockData<T>(url: string): Promise<{ data: T | null; error: string | null }> {
    return new Promise((resolve) => {
      // Simular um pequeno atraso para parecer uma chamada real
      setTimeout(() => {
        if (url.includes('/vendas')) {
          resolve({
            data: {
              data: this.getMockVendas()
            } as unknown as T,
            error: null
          });
        } else if (url.includes('/produtos')) {
          resolve({
            data: {
              data: this.getMockProdutos()
            } as unknown as T,
            error: null
          });
        } else if (url.includes('/situacoes')) {
          resolve({
            data: {
              data: [
                { id: 1, descricao: 'Aberto' },
                { id: 2, descricao: 'Em andamento' },
                { id: 3, descricao: 'Concluído' },
                { id: 4, descricao: 'Cancelado' }
              ]
            } as unknown as T,
            error: null
          });
        } else {
          // Dados genéricos para outras requisições
          resolve({
            data: { data: [] } as unknown as T,
            error: null
          });
        }
      }, 300); // Atraso simulado de 300ms
    });
  }
  
  /**
   * Gera vendas mockadas para o modo demo
   */
  private static getMockVendas(): BetelVenda[] {
    const vendas: BetelVenda[] = [];
    
    // Gerar 50 vendas mockadas
    for (let i = 1; i <= 50; i++) {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - Math.floor(Math.random() * 30));
      
      const vendedores = [
        { id: 1, nome: 'Ana Silva' },
        { id: 2, nome: 'Carlos Santos' },
        { id: 3, nome: 'Juliana Oliveira' },
        { id: 4, nome: 'Roberto Almeida' },
        { id: 5, nome: 'Patricia Lima' }
      ];
      
      const vendedorIdx = Math.floor(Math.random() * vendedores.length);
      const valorTotal = (Math.random() * 5000 + 500).toFixed(2);
      
      const itens: BetelItem[] = [];
      const numItens = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 1; j <= numItens; j++) {
        const produtos = [
          { id: 1, descricao: 'Smartphone Premium', valor: 3500, categoria: 'Eletrônicos' },
          { id: 2, descricao: 'Notebook Ultra', valor: 5500, categoria: 'Eletrônicos' },
          { id: 3, descricao: 'Smart TV 55"', valor: 4200, categoria: 'Eletrônicos' },
          { id: 4, descricao: 'Sofá 3 Lugares', valor: 3200, categoria: 'Móveis' },
          { id: 5, descricao: 'Mesa de Jantar', valor: 2500, categoria: 'Móveis' },
          { id: 6, descricao: 'Quadro Decorativo', valor: 350, categoria: 'Decoração' },
          { id: 7, descricao: 'Conjunto de Panelas', valor: 900, categoria: 'Utensílios' },
          { id: 8, descricao: 'Camisa Social', valor: 180, categoria: 'Vestuário' },
          { id: 9, descricao: 'Tênis Esportivo', valor: 380, categoria: 'Calçados' },
          { id: 10, descricao: 'Relógio', valor: 580, categoria: 'Acessórios' }
        ];
        
        const produtoIdx = Math.floor(Math.random() * produtos.length);
        const produto = produtos[produtoIdx];
        const quantidade = Math.floor(Math.random() * 3) + 1;
        
        // Calcular valor de custo com base em margens de lucro variáveis e realistas
        const valorVenda = produto.valor;
        // Margem de lucro entre 20% e 40% (mais realista para o mercado)
        const margemLucroPercent = Math.random() * 20 + 20; // entre 20% e 40%
        const margemLucro = margemLucroPercent / 100;
        
        // Custo é o valor de venda menos a margem de lucro
        const valorCusto = Math.round(valorVenda / (1 + margemLucro));
        
        itens.push({
          id: j,
          produto_id: produto.id,
          produto: produto.descricao,
          categoria: produto.categoria,
          quantidade: quantidade.toString(),
          valor_unitario: produto.valor.toString(),
          valor_total: (produto.valor * quantidade).toString(),
          valor_custo: valorCusto.toString()
        });
      }
      
      // Calcular o valor de custo total da venda somando os custos dos itens
      const valorCustoTotal = itens.reduce((acc, item) => {
        return acc + (parseFloat(item.valor_custo || '0') * parseFloat(item.quantidade || '1'));
      }, 0).toFixed(2);

      vendas.push({
        id: i,
        cliente: `Cliente ${i}`,
        cliente_id: i * 10,
        valor_total: valorTotal,
        data_inclusao: format(dataInicio, 'yyyy-MM-dd'),
        data: format(dataInicio, 'yyyy-MM-dd'),
        vendedor_id: vendedores[vendedorIdx].id,
        nome_vendedor: vendedores[vendedorIdx].nome,
        valor_custo: valorCustoTotal,
        itens: itens
      });
    }
    
    return vendas;
  }
  
  /**
   * Gera produtos mockados para o modo demo
   */
  private static getMockProdutos(): any[] {
    return [
      { id: 1, descricao: 'Smartphone Premium', valor: 3500, categoria: 'Eletrônicos', estoque: 15 },
      { id: 2, descricao: 'Notebook Ultra', valor: 5500, categoria: 'Eletrônicos', estoque: 8 },
      { id: 3, descricao: 'Smart TV 55"', valor: 4200, categoria: 'Eletrônicos', estoque: 12 },
      { id: 4, descricao: 'Sofá 3 Lugares', valor: 3200, categoria: 'Móveis', estoque: 5 },
      { id: 5, descricao: 'Mesa de Jantar', valor: 2500, categoria: 'Móveis', estoque: 7 },
      { id: 6, descricao: 'Quadro Decorativo', valor: 350, categoria: 'Decoração', estoque: 20 },
      { id: 7, descricao: 'Conjunto de Panelas', valor: 900, categoria: 'Utensílios', estoque: 10 },
      { id: 8, descricao: 'Camisa Social', valor: 180, categoria: 'Vestuário', estoque: 30 },
      { id: 9, descricao: 'Tênis Esportivo', valor: 380, categoria: 'Calçados', estoque: 25 },
      { id: 10, descricao: 'Relógio', valor: 580, categoria: 'Acessórios', estoque: 18 }
    ];
  }

  /**
   * Busca vendedores agrupados por vendas no período
   */
  static async buscarVendedores(params: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<VendedoresResponse> {
    try {
      // Formatar as datas no formato da API (YYYY-MM-DD)
      const dataInicioFormatada = format(params.dataInicio, 'yyyy-MM-dd');
      const dataFimFormatada = format(params.dataFim, 'yyyy-MM-dd');
      
      // Primeiro buscar as vendas diretamente para garantir consistência
      const vendasResponse = await this.buscarVendas({
        dataInicio: params.dataInicio,
        dataFim: params.dataFim
      });
      
      if (vendasResponse.erro) {
        throw new Error(`Erro ao buscar vendas: ${vendasResponse.erro}`);
      }
      
      // Usar o Map para agrupar por vendedor
      const vendedoresMap = new Map<string, Vendedor>();
      
      // Processar vendas e agrupar por vendedor
      vendasResponse.vendas.forEach((venda: BetelVenda) => {
        const vendedorId = venda.vendedor_id?.toString() || 'desconhecido';
        // Usar nome_vendedor com prioridade, mas manter compatibilidade com vendedor_nome
        const vendedorNome = venda.nome_vendedor || venda.vendedor_nome || `Vendedor ${vendedorId}`;
        // Garantir que o valor da venda seja um número válido usando parseFloat
        const valorVenda = parseFloat(parseFloat(venda.valor_total || '0').toFixed(2));
        // Incluir informação da loja no nome do vendedor
        const lojaNome = venda.nome_loja || 'Não informada';
        
        // Chave única para o vendedor
        const chaveVendedor = `${vendedorId}:${vendedorNome}`;
        
        if (!vendedoresMap.has(chaveVendedor)) {
          vendedoresMap.set(chaveVendedor, {
            id: vendedorId,
            nome: `${vendedorNome} (${lojaNome})`,
            vendas: 0,
            faturamento: 0,
            ticketMedio: 0,
            lojaId: venda.loja_id?.toString(),
            lojaNome: lojaNome
          });
        }
        
        const vendedor = vendedoresMap.get(chaveVendedor)!;
        vendedor.vendas += 1;
        vendedor.faturamento += valorVenda;
      });
      
      // Calcular ticket médio e converter para array
      const vendedores = Array.from(vendedoresMap.values()).map(vendedor => {
        vendedor.ticketMedio = vendedor.vendas > 0 ? 
          parseFloat((vendedor.faturamento / vendedor.vendas).toFixed(2)) : 0;
        // Garantir que a precisão do faturamento seja consistente
        vendedor.faturamento = parseFloat(vendedor.faturamento.toFixed(2));
        return vendedor;
      });
      
      // Ordenar por faturamento (decrescente)
      vendedores.sort((a, b) => b.faturamento - a.faturamento);
      
      // Calcular totais
      const totalVendedores = vendedores.length;
      const totalVendas = vendedores.reduce((acc, v) => acc + v.vendas, 0);
      
      // IMPORTANTE: Usar o totalValor já calculado pelo método buscarVendas
      // Em vez de recalcular para garantir consistência entre os relatórios
      const totalFaturamento = parseFloat(vendasResponse.totalValor.toFixed(2));
      
      // Retornar resultados
      return {
        vendedores,
        totalVendedores,
        totalVendas,
        totalFaturamento
      };
      
    } catch (error) {
      console.error('Erro ao buscar vendedores na Betel Tecnologia:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        vendedores: [],
        totalVendedores: 0,
        totalVendas: 0,
        totalFaturamento: 0,
        erro: errorMessage
      };
    }
  }

  static async buscarProdutosVendidos(params: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<ProdutosResponse> {
    try {
      // Usar o método de busca de vendas melhorado que já recupera de todas as lojas
      const vendasResult = await this.buscarVendas({
        dataInicio: params.dataInicio,
        dataFim: params.dataFim
      });
      
      // Verificar se houve erro na busca das vendas
      if (vendasResult.erro) {
        throw new Error(`Erro ao buscar vendas: ${vendasResult.erro}`);
      }

      const vendas = vendasResult.vendas;
      if (!vendas || !Array.isArray(vendas)) {
        throw new Error('Formato de resposta inválido ao buscar vendas');
      }

      // Buscar produtos vendidos diretamente da API
      const produtosResult = await this.fetchWithRetry<{data: any[]}>('/produtos');
      
      if (produtosResult.error) {
        throw new Error(`Erro ao buscar produtos: ${produtosResult.error}`);
      }

      const produtosData = produtosResult.data;
      if (!produtosData || !produtosData.data) {
        throw new Error('Formato de resposta inválido da API de produtos');
      }

      // Mapear produtos para uso rápido por ID
      const produtosMapPorId = new Map();
      if (produtosData.data && Array.isArray(produtosData.data)) {
        produtosData.data.forEach((produto: any) => {
          produtosMapPorId.set(produto.id, {
            nome: produto.nome,
            categoria: produto.nome_grupo || 'Não categorizado',
            valor_venda: parseFloat(produto.valor_venda || 0)
          });
        });
      }

      // Mapa para agrupar produtos vendidos
      const produtosMap = new Map();
      
      // ID para produtos sem identificação
      let produtoSemIdCount = 0;
      
      // Processar todas as vendas para extrair itens
      let totalItens = 0;
      vendas.forEach((venda, index) => {
        // Verificar se a venda tem itens
        if (venda.itens && Array.isArray(venda.itens)) {
          totalItens += venda.itens.length;
          
          venda.itens.forEach((item) => {
            // Informações básicas do item
            const produtoId = item.produto_id || ++produtoSemIdCount;
            const produtoNome = item.produto || 'Produto sem nome';
            const quantidade = parseFloat(item.quantidade) || 1;
            const valorUnitario = parseFloat(item.valor_unitario) || 0;
            const valorTotal = parseFloat(item.valor_total) || 0;
            const valorCusto = parseFloat(item.valor_custo || '0') || 0;
            
            // Buscar categoria do produto no mapa por ID se disponível
            let categoria = item.categoria || 'Não categorizado';
            const produtoCatalogo = produtosMapPorId.get(produtoId);
            if (produtoCatalogo) {
              categoria = produtoCatalogo.categoria || categoria;
            }
            
            // Chave única para agrupar o mesmo produto
            const chave = `${produtoId}:${produtoNome}`;
            
            if (!produtosMap.has(chave)) {
              produtosMap.set(chave, {
                id: produtoId,
                nome: produtoNome,
                categoria: categoria,
                quantidadeVendida: 0,
                valorTotal: 0,
                valorCusto: 0,
                valorLucro: 0,
                margemLucro: 0,
                ticketMedio: 0
              });
            }
            
            // Atualizar dados do produto
            const produto = produtosMap.get(chave);
            produto.quantidadeVendida += quantidade;
            produto.valorTotal += valorTotal;
            produto.valorCusto += valorCusto;
          });
        }
      });

      // Se não encontrou itens nas vendas, usar os produtos do catálogo diretamente
      if (totalItens === 0 && produtosData.data && Array.isArray(produtosData.data)) {
        
        // Mapear produtos do catálogo para o formato esperado
        produtosData.data.forEach((produto: any) => {
          const produtoId = produto.id;
          const produtoNome = produto.nome || 'Produto sem nome';
          const categoria = produto.nome_grupo || 'Não categorizado';
          
          // Chave única para agrupar o mesmo produto
          const chave = `${produtoId}:${produtoNome}`;
          
          if (!produtosMap.has(chave)) {
            produtosMap.set(chave, {
              id: produtoId,
              nome: produtoNome,
              categoria: categoria,
              quantidadeVendida: 0,
              valorTotal: 0,
              valorCusto: 0,
              valorLucro: 0,
              margemLucro: 0,
              ticketMedio: 0
            });
          }
        });
      }

      // Converter Map para array
      const produtos = Array.from(produtosMap.values());

      // Calcular totais com base nos dados reais
      const totalProdutos = produtos.length;
      const totalVendas = vendas.length;
      const totalFaturamento = produtos.reduce((acc, produto) => acc + produto.valorTotal, 0);
      
      // Retornar resultados
      return {
        produtos,
        totalProdutos,
        totalVendas,
        totalFaturamento
      };
      
    } catch (error) {
      console.error('Erro ao buscar produtos vendidos na Betel Tecnologia:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        produtos: [],
        totalProdutos: 0,
        totalVendas: 0,
        totalFaturamento: 0,
        erro: errorMessage
      };
    }
  }

  /**
   * Busca vendas diretamente da API externa no período especificado
   * Combina vendas de todas as lojas (matriz e filiais) com tratamento especial
   * para garantir que as vendas da filial sejam identificadas corretamente
   */
  static async buscarVendas(params: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<{
    vendas: BetelVenda[];
    totalVendas: number;
    totalValor: number;
    erro?: string;
  }> {
    try {
      console.log('Iniciando busca de vendas com parâmetros:', params);
      
      // Formatar datas para o formato que a API espera
      const dataInicio = format(params.dataInicio, 'yyyy-MM-dd');
      const dataFim = format(params.dataFim, 'yyyy-MM-dd');
      
      console.log('Datas formatadas para busca:', { dataInicio, dataFim });
      
      // Buscar vendas diretamente sem paginação por lojas (evitar duplicação)
      console.log('Buscando vendas diretamente...');
      return await this.buscarVendasPadrao(dataInicio, dataFim);
    } catch (error) {
      console.error('Erro na busca de vendas:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na busca de vendas';
      return {
        vendas: [],
        totalVendas: 0,
        totalValor: 0,
        erro: errorMessage
      };
    }
  }

  private static async buscarVendasPadrao(dataInicio: string, dataFim: string): Promise<{
    vendas: BetelVenda[];
    totalVendas: number;
    totalValor: number;
    erro?: string;
  }> {
    try {
      console.log('Buscando vendas pelo método corrigido (loja por loja)...');
      
      // Primeiro, buscar a lista de lojas disponíveis
      const lojasResult = await this.fetchWithRetry<{data: Array<{id: string, nome: string}>}>(`/lojas`);
      
      if (lojasResult.error) {
        throw new Error(`Erro ao buscar lojas: ${lojasResult.error}`);
      }

      const lojas = lojasResult.data?.data || [];
      console.log(`Encontradas ${lojas.length} lojas:`, lojas.map(l => `${l.nome} (${l.id})`));
      
      // Buscar vendas de todas as lojas individualmente
      let todasVendas: BetelVenda[] = [];
      
      for (const loja of lojas) {
        console.log(`Buscando vendas da loja ${loja.nome} (${loja.id})...`);
        
        let paginaAtual = 1;
        let temMaisPaginas = true;
        let vendasDaLoja: BetelVenda[] = [];
        
        while (temMaisPaginas) {
          // Buscar página atual da loja específica
          const urlVendas = `/vendas?data_inicio=${encodeURIComponent(dataInicio)}&data_fim=${encodeURIComponent(dataFim)}&loja_id=${loja.id}&page=${paginaAtual}&limit=500`;
          const vendasResult = await this.fetchWithRetry<{data: BetelVenda[], meta?: any}>(urlVendas);
          
          if (vendasResult.error) {
            console.warn(`Erro ao buscar vendas da loja ${loja.nome} na página ${paginaAtual}: ${vendasResult.error}`);
            break; // Continuar com a próxima loja
          }

          const vendasData = vendasResult.data;
          if (!vendasData || !vendasData.data || !Array.isArray(vendasData.data)) {
            console.warn(`Formato de resposta inválido da API de vendas da loja ${loja.nome} na página ${paginaAtual}`);
            break;
          }

          console.log(`Loja ${loja.nome} - Página ${paginaAtual}: ${vendasData.data.length} vendas`);
          
          // Adicionar vendas da página atual
          vendasDaLoja = [...vendasDaLoja, ...vendasData.data];
          
          // Verificar se há mais páginas
          if (vendasData.meta) {
            const { proxima_pagina, total_paginas } = vendasData.meta;
            if (proxima_pagina && paginaAtual < total_paginas) {
              paginaAtual++;
            } else {
              temMaisPaginas = false;
            }
          } else {
            // Se não há metadados de paginação, assumir que é a única página
            temMaisPaginas = false;
          }
          
          // Proteção contra loop infinito
          if (paginaAtual > 20) {
            console.warn(`Proteção contra loop infinito ativada para loja ${loja.nome}. Parando na página ${paginaAtual}`);
            break;
          }
        }
        
        console.log(`Total de vendas da loja ${loja.nome}: ${vendasDaLoja.length}`);
        todasVendas = [...todasVendas, ...vendasDaLoja];
      }
      
      console.log(`Total de vendas obtidas de todas as lojas: ${todasVendas.length}`);
      
      // Processamento das vendas - Considerar apenas vendas "Concretizada" e "Em andamento"
      const vendasFiltradas = todasVendas.filter((venda: BetelVenda) => 
        venda.nome_situacao === "Concretizada" || venda.nome_situacao === "Em andamento"
      );

      console.log(`Vendas filtradas (apenas Concretizada e Em andamento): ${vendasFiltradas.length}`);
      console.log(`Iniciando processamento de descontos para ${vendasFiltradas.length} vendas...`);
      
      const totalVendas = vendasFiltradas.length;
      
      // Calcular o valor total a partir das vendas filtradas
      const totalValor = parseFloat(vendasFiltradas.reduce((acc: number, venda: BetelVenda) => {
        const valorVenda = parseFloat(venda.valor_total || '0');
        return acc + valorVenda;
      }, 0).toFixed(2));

      // Garantir que todas as vendas tenham valor_custo definido e calcular descontos corretamente
      console.log(`Processando ${vendasFiltradas.length} vendas para calcular descontos...`);
      let vendasProcessadas = vendasFiltradas.map((venda: BetelVenda, index: number) => {
        if (index < 3) { // Log apenas das primeiras 3 vendas
          console.log(`Processando venda ${index + 1}/${vendasFiltradas.length}: ${venda.id}`);
        }
        // Se já tem valor_custo definido, manter
        if (venda.valor_custo) {
          return venda;
        }
        
        // Calcular valor_custo a partir dos itens
        let valorCusto = 0;
        let temValorCusto = false;
        
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach((item: any) => {
            if (item.valor_custo) {
              valorCusto += parseFloat(item.valor_custo) * parseFloat(item.quantidade || '1');
              temValorCusto = true;
            }
            // Se o item não tem valor_custo, não estimamos o valor
          });
        }
        
        // Calcular desconto real (valor + porcentagem)
        let descontoReal = 0;
        const descontoValor = parseFloat(venda.desconto_valor || '0');
        const descontoPercentual = parseFloat(venda.desconto_porcentagem || '0');
        const valorProdutos = parseFloat(venda.valor_produtos || venda.valor_total || '0');
        
        console.log(`Processando venda ${venda.id}: desconto_valor=${descontoValor}, desconto_porcentagem=${descontoPercentual}, valor_produtos=${valorProdutos}`);
        
        // Desconto em valor fixo
        if (descontoValor > 0) {
          descontoReal += descontoValor;
          console.log(`Desconto em valor fixo: ${descontoValor}`);
        }
        
        // Desconto em porcentagem
        if (descontoPercentual > 0) {
          const descontoPorcentagem = (valorProdutos * descontoPercentual) / 100;
          descontoReal += descontoPorcentagem;
          console.log(`Desconto em porcentagem: ${descontoPorcentagem} (${descontoPercentual}% de ${valorProdutos})`);
        }
        
        // Se não há desconto explícito, calcular pela diferença entre valor_produtos e valor_total
        if (descontoReal === 0 && valorProdutos > 0) {
          const valorTotal = parseFloat(venda.valor_total || '0');
          if (valorProdutos > valorTotal) {
            descontoReal = valorProdutos - valorTotal;
            console.log(`Desconto calculado pela diferença: ${descontoReal} (${valorProdutos} - ${valorTotal})`);
          }
        }
        
        console.log(`Desconto final para venda ${venda.id}: ${descontoReal}`);
        
        // Preparar objeto de retorno
        const vendaProcessada = {
          ...venda,
          desconto_valor: descontoReal.toString()
        };
        
        // Só adicionar valor_custo à venda se temos dados reais
        if (temValorCusto) {
          vendaProcessada.valor_custo = valorCusto.toString();
        }
        
        return vendaProcessada;
      });

      // Garantir que as datas nas vendas estejam no formato correto para filtragem posterior
      vendasProcessadas = vendasProcessadas.map((venda: BetelVenda) => {
        // Se não tiver a propriedade data, adicionar
        if (!venda.data) {
          return {
            ...venda,
            data: venda.data_inclusao?.split(' ')[0] || format(new Date(), 'yyyy-MM-dd')
          };
        }
        return venda;
      });

      // Filtrar vendas pelo período exato
      vendasProcessadas = vendasProcessadas.filter((venda: BetelVenda) => {
        const dataVenda = venda.data.split('T')[0];
        return dataVenda >= dataInicio && dataVenda <= dataFim;
      });

      return {
        vendas: vendasProcessadas,
        totalVendas,
        totalValor
      };
    } catch (error) {
      console.error('Erro ao buscar vendas na Betel Tecnologia:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        vendas: [],
        totalVendas: 0,
        totalValor: 0,
        erro: errorMessage
      };
    }
  }

  /**
   * Testa a conexão com a API externa e valida as credenciais
   * @returns Objeto com o resultado do teste
   */
  static async testarConexaoAPI(): Promise<{ 
    sucesso: boolean; 
    mensagem: string; 
    detalhes?: any 
  }> {
    try {
      console.log('Testando conexão com a API externa...');
      
      // Verificar credenciais antes de fazer qualquer chamada
      const credenciais = this.verificarCredenciais();
      if (!credenciais.valido) {
        return { 
          sucesso: false, 
          mensagem: 'Falha na configuração das credenciais', 
          detalhes: credenciais.mensagem
        };
      }
      
      // Tenta fazer uma requisição simples (para um endpoint que requer autenticação)
      const response = await fetch(`${this.API_URL}/situacoes`, {
        headers: this.getHeaders()
      });
      
      if (response.status === 401) {
        let detalhesResposta = '';
        try {
          detalhesResposta = await response.text();
        } catch (e) {}
        
        return { 
          sucesso: false, 
          mensagem: 'Credenciais inválidas ou expiradas', 
          detalhes: detalhesResposta || 'Não foi possível obter detalhes adicionais'
        };
      }
      
      if (!response.ok) {
        return { 
          sucesso: false, 
          mensagem: `Erro na API: ${response.status} ${response.statusText}`,
          detalhes: await response.text().catch(() => 'Não foi possível obter detalhes adicionais')
        };
      }
      
      // Se chegou aqui, a conexão está funcionando
      return { 
        sucesso: true, 
        mensagem: 'Conexão estabelecida com sucesso',
        detalhes: { status: response.status, statusText: response.statusText }
      };
      
    } catch (error) {
      console.error('Erro ao testar conexão com a API externa:', error);
      return { 
        sucesso: false, 
        mensagem: 'Erro ao testar conexão com a API externa',
        detalhes: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Função auxiliar para processar um item e atualizar o mapa de produtos
function processarItem(
  produtosMap: Map<number, Produto>, 
  item: BetelItem & { loja_id?: string | number, nome_loja?: string },
  produtosMapPorId?: Map<string, any>
) {
  const id = item.produto_id.toString();
  const quantidade = parseInt(item.quantidade);
  const precoUnitario = parseFloat(item.valor_unitario);
  const total = parseFloat(item.valor_total);
  
  // Informações adicionais do produto se disponíveis
  const infoProduto = produtosMapPorId?.get(id);
  const categoria = infoProduto?.categoria || item.categoria || 'Não categorizado';
  
  // Informações da loja
  const lojaId = item.loja_id?.toString() || 'matriz';
  const lojaNome = item.nome_loja || 'Matriz';

  // Chave para identificar produto por loja (opcional)
  //const produtoLojaKey = `${item.produto_id}:${lojaId}`;

  if (produtosMap.has(item.produto_id)) {
    // Se o produto já existe, atualiza a quantidade e total
    const produto = produtosMap.get(item.produto_id)!;
    produto.quantidade += quantidade;
    produto.total += total;
    
    // Atualizar informação da loja se não estiver definida
    if (!produto.lojaId && lojaId) produto.lojaId = lojaId;
    if (!produto.lojaNome && lojaNome) produto.lojaNome = lojaNome;
  } else {
    // Se não existe, cria um novo
    produtosMap.set(item.produto_id, {
      id,
      nome: item.produto,
      quantidade,
      precoUnitario,
      total,
      categoria,
      lojaId,
      lojaNome
    });
  }
} 
