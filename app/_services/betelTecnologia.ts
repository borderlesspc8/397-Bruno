import { api } from '@/app/_lib/api';
import { format, parseISO } from 'date-fns';
import { Produto, ProdutosResponse } from './produtos';
import { isDemoMode } from '../_lib/config';
import { cacheService } from '../_lib/cache';

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
  itens: BetelItem[];
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
  // Config padrão
  private static API_URL = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
  private static ACCESS_TOKEN = process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
  private static SECRET_TOKEN = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';

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
        
        // Tratar outros erros HTTP
        if (!response.ok) {
          throw new Error(`Erro na API externa: ${response.status} - ${response.statusText}`);
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
      
      // 1. Primeiro, buscar as lojas disponíveis
      console.log('Buscando lojas disponíveis...');
      const lojasResult = await this.fetchWithRetry<{data: {id: string, nome: string}[]}>('/lojas');
      
      if (lojasResult.error) {
        console.error(`Erro ao buscar lojas: ${lojasResult.error}. Continuando com busca padrão.`);
        return this.buscarVendasPadrao(dataInicio, dataFim);
      }
      
      const lojasData = lojasResult.data;
      if (!lojasData || !lojasData.data || !Array.isArray(lojasData.data) || lojasData.data.length === 0) {
        console.warn('Nenhuma loja encontrada. Continuando com busca padrão.');
        return this.buscarVendasPadrao(dataInicio, dataFim);
      }
      
      console.log(`${lojasData.data.length} lojas encontradas:`, lojasData.data.map(l => `${l.nome} (ID: ${l.id})`).join(', '));
      
      let todasVendas: BetelVenda[] = [];

      // Buscar vendas para cada loja usando o parâmetro loja_id
      for (const loja of lojasData.data) {
        console.log(`Buscando vendas da loja: ${loja.nome} (ID: ${loja.id})...`);
        
        // Usar o parâmetro loja_id conforme documentação da API
        const urlLoja = `/vendas?data_inicio=${encodeURIComponent(dataInicio)}&data_fim=${encodeURIComponent(dataFim)}&loja_id=${loja.id}`;
        const vendasLojaResult = await this.fetchWithRetry<{data: BetelVenda[]}>(urlLoja);
        
        if (vendasLojaResult.error) {
          console.error(`Erro ao buscar vendas da loja ${loja.nome}: ${vendasLojaResult.error}`);
          continue;
        }
        
        const vendasLojaData = vendasLojaResult.data;
        if (!vendasLojaData || !vendasLojaData.data || !Array.isArray(vendasLojaData.data)) {
          console.warn(`Formato de resposta inválido para a loja ${loja.nome}`);
          continue;
        }
        
        // Adicionar informações da loja às vendas
        const vendasProcessadas = vendasLojaData.data.map(venda => ({
          ...venda,
          loja_id: loja.id,
          nome_loja: loja.nome
        }));
        
        console.log(`Obtidas ${vendasProcessadas.length} vendas da loja ${loja.nome}`);
        
        // Adicionar às vendas totais
        todasVendas = [...todasVendas, ...vendasProcessadas];
      }
      
      // Verificar se temos vendas após buscar em todas as lojas
      if (todasVendas.length === 0) {
        console.warn('Nenhuma venda encontrada usando loja_id. Tentando método alternativo...');
        // Tentar buscar todas as vendas sem filtro de loja
        return this.buscarVendasPadrao(dataInicio, dataFim);
      }
      
      // Filtrar apenas vendas com status "Concretizada" e "Em andamento"
      const vendasFiltradas = todasVendas.filter(venda => 
        venda.nome_situacao === "Concretizada" || venda.nome_situacao === "Em andamento"
      );
      
      console.log(`Total de vendas: ${todasVendas.length}, Vendas filtradas (Concretizada e Em andamento): ${vendasFiltradas.length}`);
      
      // 6. Estatísticas por loja (usando apenas vendas filtradas)
      const estatisticasPorLoja = new Map<string, {nome: string, quantidade: number, valor: number}>();
      vendasFiltradas.forEach(venda => {
        const lojaId = venda.loja_id?.toString() || 'desconhecida';
        const lojaNome = venda.nome_loja || 'Loja Desconhecida';
        const valorVenda = parseFloat(venda.valor_total || '0');
        
        if (!estatisticasPorLoja.has(lojaId)) {
          estatisticasPorLoja.set(lojaId, {nome: lojaNome, quantidade: 0, valor: 0});
        }
        
        const stats = estatisticasPorLoja.get(lojaId)!;
        stats.quantidade += 1;
        stats.valor += valorVenda;
      });
      
      // Exibir estatísticas
      console.log('Distribuição de vendas por loja:');
      estatisticasPorLoja.forEach((stats, lojaId) => {
        console.log(`- ${stats.nome} (ID: ${lojaId}): ${stats.quantidade} vendas, R$ ${stats.valor.toFixed(2)}`);
      });
      
      // 7. Calcular totais apenas com vendas filtradas
      const totalVendas = vendasFiltradas.length;
      const totalValor = parseFloat(vendasFiltradas.reduce((acc: number, venda: BetelVenda) => {
        const valorVenda = parseFloat(venda.valor_total || '0');
        return acc + valorVenda;
      }, 0).toFixed(2));

      // Garantir que todas as vendas tenham valor_custo definido
      todasVendas = todasVendas.map(venda => {
        // Se já tem valor_custo definido, manter
        if (venda.valor_custo) {
          return venda;
        }
        
        // Calcular valor_custo a partir dos itens
        let valorCusto = 0;
        let temValorCusto = false;
        
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach(item => {
            if (item.valor_custo) {
              valorCusto += parseFloat(item.valor_custo) * parseFloat(item.quantidade || '1');
              temValorCusto = true;
            }
            // Se o item não tem valor_custo, não estimamos o valor
          });
        }
        
        // Só adicionar valor_custo à venda se temos dados reais
        if (temValorCusto) {
          return {
            ...venda,
            valor_custo: valorCusto.toString()
          };
        }
        
        // Se não temos dados reais de custo, retornar a venda sem valor_custo
        return venda;
      });

      // Garantir que as datas nas vendas estejam no formato correto para filtragem posterior
      todasVendas = todasVendas.map(venda => {
        // Se não tiver a propriedade data, adicionar
        if (!venda.data) {
          return {
            ...venda,
            data: venda.data_inclusao?.split(' ')[0] || format(new Date(), 'yyyy-MM-dd')
          };
        }
        return venda;
      });

      return {
        vendas: todasVendas,
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
   * Método alternativo para buscar vendas usando a abordagem padrão
   * Este método é usado como fallback caso a busca por loja falhe
   */
  private static async buscarVendasPadrao(dataInicio: string, dataFim: string): Promise<{
    vendas: BetelVenda[];
    totalVendas: number;
    totalValor: number;
    erro?: string;
  }> {
    try {
      console.log('Buscando vendas pelo método padrão...');
      
      // Buscar vendas no período usando o método fetchWithRetry
      const vendasResult = await this.fetchWithRetry<{data: BetelVenda[]}>(`/vendas?data_inicio=${encodeURIComponent(dataInicio)}&data_fim=${encodeURIComponent(dataFim)}`);
      
      if (vendasResult.error) {
        throw new Error(`Erro ao buscar vendas: ${vendasResult.error}`);
      }

      const vendasData = vendasResult.data;
      if (!vendasData || !vendasData.data || !Array.isArray(vendasData.data)) {
        throw new Error('Formato de resposta inválido da API de vendas');
      }

      console.log(`Vendas obtidas pelo método padrão: ${vendasData.data.length}`);
      
      // Processamento das vendas - Considerar apenas vendas "Concretizada" e "Em andamento"
      const vendasFiltradas = vendasData.data.filter(venda => 
        venda.nome_situacao === "Concretizada" || venda.nome_situacao === "Em andamento"
      );

      console.log(`Vendas filtradas (apenas Concretizada e Em andamento): ${vendasFiltradas.length}`);
      
      const totalVendas = vendasFiltradas.length;
      
      // Calcular o valor total a partir das vendas filtradas
      const totalValor = parseFloat(vendasFiltradas.reduce((acc: number, venda: BetelVenda) => {
        const valorVenda = parseFloat(venda.valor_total || '0');
        return acc + valorVenda;
      }, 0).toFixed(2));

      // Garantir que todas as vendas tenham valor_custo definido
      const vendasProcessadas = vendasData.data.map(venda => {
        // Se já tem valor_custo definido, manter
        if (venda.valor_custo) {
          return venda;
        }
        
        // Calcular valor_custo a partir dos itens
        let valorCusto = 0;
        let temValorCusto = false;
        
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach(item => {
            if (item.valor_custo) {
              valorCusto += parseFloat(item.valor_custo) * parseFloat(item.quantidade || '1');
              temValorCusto = true;
            }
            // Se o item não tem valor_custo, não estimamos o valor
          });
        }
        
        // Só adicionar valor_custo à venda se temos dados reais
        if (temValorCusto) {
          return {
            ...venda,
            valor_custo: valorCusto.toString()
          };
        }
        
        // Se não temos dados reais de custo, retornar a venda sem valor_custo
        return venda;
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