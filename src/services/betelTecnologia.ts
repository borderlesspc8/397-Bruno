import { api } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Produto, ProdutosResponse } from './produtos';
import { isDemoMode } from '@/lib/config';
// import { cacheService } from '@/lib/cache';
import { BetelVenda } from '@/utils/calculoFinanceiro';

interface BetelOrcamento {
  id: number;
  id_situacao_orcamento: number;
  cliente: string;
  cliente_id: number;
  valor_total: string;
  data_inclusao: string;
  itens: BetelItem[];
}

export interface Vendedor {
  id: string;
  nome: string;
  vendas: number;
  faturamento: number;
  ticketMedio: number;
  lojaId?: string;      // ID da loja do vendedor
  lojaNome?: string;    // Nome da loja do vendedor
  posicao?: number;     // Posição do vendedor no ranking
}

export interface VendedoresResponse {
  vendedores: Vendedor[];
  totalVendedores: number;
  totalVendas: number;
  totalFaturamento: number;
  erro?: string;
}

export class BetelTecnologiaService {
  private static baseUrl = process.env.BETEL_API_URL;
  private static token = process.env.BETEL_API_TOKEN;

  private static async makeRequest(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro ao fazer requisição para ${endpoint}:`, error);
      throw error;
    }
  }

  public static async buscarVendas(dataInicio: string, dataFim: string): Promise<BetelVenda[]> {
    const endpoint = `/vendas?dataInicio=${dataInicio}&dataFim=${dataFim}`;
    const response = await this.makeRequest(endpoint);
    return response.vendas;
  }

  public static async buscarVendedores(): Promise<any[]> {
    const endpoint = '/vendedores';
    const response = await this.makeRequest(endpoint);
    return response.vendedores;
  }

  public static async buscarProdutosVendidos(dataInicio: string, dataFim: string): Promise<any[]> {
    const endpoint = `/produtos/vendidos?dataInicio=${dataInicio}&dataFim=${dataFim}`;
    const response = await this.makeRequest(endpoint);
    return response.produtos;
  }

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
    // const cacheKey = `betel:${url}`;
    // Usar o serviço de cache para buscar os dados
    // return await cacheService.get<{ data: T | null; error: string | null }>(
    //   cacheKey,
    //   async () => {
    //     ... lógica de busca ...
    //   },
    //   { ttl: ... }
    // );
    // Substituir por chamada direta à API:
    // ... lógica de busca direta ...
    // ... existing code ...
    // console.error(`Erro ao buscar dados (com cache) para ${url}:`, error);
    // ... existing code ...
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
    lojaId?: string;
  }): Promise<VendedoresResponse> {
    try {
      // Formatar as datas no formato da API (YYYY-MM-DD)
      const dataInicioFormatada = format(params.dataInicio, 'yyyy-MM-dd');
      const dataFimFormatada = format(params.dataFim, 'yyyy-MM-dd');
      
      console.log(`buscarVendedores: Buscando vendedores no período: ${dataInicioFormatada} a ${dataFimFormatada}`);
      
      if (params.lojaId) {
        console.log(`buscarVendedores: Filtrando pela loja específica: ${params.lojaId}`);
      } else {
        console.log(`buscarVendedores: Buscando de todas as lojas`);
      }
      
      // Buscar lojas para ter acesso aos IDs e nomes corretos
      const lojasResponse = await this.buscarLojas();
      const lojas = lojasResponse.lojas || [];
      console.log(`Lojas encontradas para mapeamento: ${lojas.length} - ${lojas.map(l => l.nome).join(', ')}`);
      
      // Primeiro buscar as vendas diretamente para garantir consistência
      const vendasResponse = await this.buscarVendas({
        dataInicio: params.dataInicio,
        dataFim: params.dataFim,
        lojaId: params.lojaId
      });
      
      if (vendasResponse.erro) {
        throw new Error(`Erro ao buscar vendas: ${vendasResponse.erro}`);
      }
      
      console.log(`buscarVendedores: Encontradas ${vendasResponse.vendas.length} vendas brutas`);
      
      // Exibir nomes dos vendedores presentes nas vendas brutas para diagnóstico
      const vendedoresNasVendas = new Set<string>();
      vendasResponse.vendas.forEach(venda => {
        const vendedorNome = venda.nome_vendedor || venda.vendedor_nome || '';
        if (vendedorNome) {
          vendedoresNasVendas.add(vendedorNome.toUpperCase());
        }
      });
      console.log(`buscarVendedores: Vendedores encontrados nas vendas brutas: ${Array.from(vendedoresNasVendas).join(', ')}`);
      
      // Verificar vendedores específicos para debug
      console.log(`buscarVendedores: Verificando Marcus nas vendas: ${vendedoresNasVendas.has('MARCUS') || vendedoresNasVendas.has('MARCUS VINICIUS') || vendedoresNasVendas.has('MARCOS VINICIUS') || vendedoresNasVendas.has('MARCUS VINÍCIUS')}`);
      console.log(`buscarVendedores: Verificando Yasmim nas vendas: ${vendedoresNasVendas.has('YASMIM SILVA') || vendedoresNasVendas.has('YASMIM')}`);
      console.log(`buscarVendedores: Verificando Diuly nas vendas: ${vendedoresNasVendas.has('DIULY MORAES') || vendedoresNasVendas.has('DIULY')}`);
      
      // Logar todas as vendas que contêm "Marcus" ou "Marcos" no nome do vendedor
      console.log('Verificando vendas com vendedor Marcus:');
      vendasResponse.vendas.forEach(venda => {
        const vendedorNome = (venda.nome_vendedor || venda.vendedor_nome || '').toUpperCase();
        if (vendedorNome.includes('MARCUS') || vendedorNome.includes('MARCOS')) {
          console.log(`Venda para vendedor ${vendedorNome}: ID=${venda.id}, Data=${venda.data || venda.data_inclusao}, Loja=${venda.nome_loja || venda.loja_id}`);
        }
      });
      
      // Usar o Map para agrupar por vendedor
      const vendedoresMap = new Map<string, Vendedor>();
      
      // Processar vendas e agrupar por vendedor, considerando todos os nomes possíveis
      // e todas as lojas disponíveis
      vendasResponse.vendas.forEach((venda: BetelVenda) => {
        const vendedorId = venda.vendedor_id?.toString() || 'desconhecido';
        // Usar nome_vendedor com prioridade, mas manter compatibilidade com vendedor_nome
        const vendedorNome = venda.nome_vendedor || venda.vendedor_nome || `Vendedor ${vendedorId}`;
        // Normalizar o nome do vendedor para maiúsculas para comparações
        const vendedorNomeNormalizado = vendedorNome.toUpperCase();
        
        // Garantir que o valor da venda seja um número válido usando parseFloat
        const valorVenda = parseFloat(parseFloat(venda.valor_total || '0').toFixed(2));
        
        // Identificar a loja
        const lojaId = venda.loja_id?.toString() || 'desconhecido';
        // Encontrar o nome da loja a partir do ID, se disponível
        let lojaNome = venda.nome_loja || '';
        if (!lojaNome && lojaId !== 'desconhecido') {
          const lojaEncontrada = lojas.find(l => l.id?.toString() === lojaId);
          if (lojaEncontrada) {
            lojaNome = lojaEncontrada.nome || lojaEncontrada.descricao || '';
          }
        }
        // Se ainda não tiver nome da loja, usar um valor padrão
        if (!lojaNome) {
          lojaNome = lojaId === 'desconhecido' ? 'Loja não informada' : `Loja ${lojaId}`;
        }
        
        // Chave única considerando ID, nome e loja
        const chaveVendedor = `${vendedorId}:${vendedorNomeNormalizado}:${lojaId}`;
        
        // Verificar vendedores específicos para debug
        if (vendedorNomeNormalizado.includes('MARCUS') || 
            vendedorNomeNormalizado.includes('MARCOS') || 
            vendedorNomeNormalizado.includes('DIULY') || 
            vendedorNomeNormalizado.includes('YASMIM')) {
          console.log(`Encontrado vendedor especial: ${vendedorNomeNormalizado} na loja ${lojaNome} (ID: ${lojaId}) - Valor: ${valorVenda} - Data: ${venda.data || venda.data_inclusao}`);
        }
        
        if (!vendedoresMap.has(chaveVendedor)) {
          vendedoresMap.set(chaveVendedor, {
            id: vendedorId,
            nome: `${vendedorNome} (${lojaNome})`, // Incluir loja no nome
            vendas: 0,
            faturamento: 0,
            ticketMedio: 0,
            lojaId: lojaId,
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
      
      console.log(`buscarVendedores: Vendedores processados (${vendedores.length}): ${vendedores.map(v => v.nome).join(', ')}`);
      
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
    lojaId?: string;
  }): Promise<{
    vendas: BetelVenda[];
    totalVendas: number;
    totalValor: number;
    erro?: string;
  }> {
    try {
      console.log('Iniciando busca de vendas com parâmetros:', params);
      
      // Garantir que a data fim é sempre no máximo a data atual
      const hoje = new Date();
      const dataFimReal = params.dataFim > hoje ? hoje : params.dataFim;
      
      // Garantir que as datas estejam normalizadas para início e fim do dia
      const dataInicioNormalizada = new Date(params.dataInicio);
      dataInicioNormalizada.setHours(0, 0, 0, 0);
      
      const dataFimNormalizada = new Date(dataFimReal);
      dataFimNormalizada.setHours(23, 59, 59, 999);
      
      const dataInicio = format(dataInicioNormalizada, 'yyyy-MM-dd');
      const dataFim = format(dataFimNormalizada, 'yyyy-MM-dd');
      
      console.log(`Buscando vendas do período: ${dataInicio} a ${dataFim}`);
      
      // Buscar todas as lojas disponíveis primeiro
      const lojasResponse = await this.buscarLojas();
      const lojas = lojasResponse.lojas || [];
      console.log(`Lojas encontradas: ${lojas.length} - ${lojas.map(l => l.nome).join(', ')}`);
      
      // Vendas combinadas de todas as lojas relevantes
      let todasVendas: BetelVenda[] = [];

      // Se tiver loja_id específico, buscar apenas dessa loja
      if (params.lojaId) {
        console.log(`Buscando vendas da loja específica: ${params.lojaId}`);
        const urlBase = `/vendas?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}&loja_id=${encodeURIComponent(params.lojaId)}`;
        
        const vendasResult = await this.fetchWithRetry<{data: BetelVenda[]}>(urlBase);
        if (vendasResult.error) {
          console.error(`Erro ao buscar vendas da loja ${params.lojaId}: ${vendasResult.error}`);
          return {
            vendas: [],
            totalVendas: 0,
            totalValor: 0,
            erro: vendasResult.error
          };
        }
        
        if (vendasResult.data?.data) {
          // Adicionar identificação de loja se não existir
          const lojaNome = lojas.find(l => l.id?.toString() === params.lojaId)?.nome || `Loja ${params.lojaId}`;
          const vendasProcessadas = vendasResult.data.data.map(venda => ({
          ...venda,
            loja_id: params.lojaId,
            nome_loja: lojaNome
          }));
          
          todasVendas = vendasProcessadas;
          console.log(`Obtidas ${vendasProcessadas.length} vendas da loja ${params.lojaId} (${lojaNome})`);
        }
      } 
      // Caso contrário, buscar de todas as lojas
      else {
        // Primeiro tentar buscar com o parâmetro todas_lojas=true
        const urlTodasLojas = `/vendas?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}&todas_lojas=true`;
        
        console.log(`Buscando vendas de todas as lojas com parâmetro todas_lojas=true: ${urlTodasLojas}`);
        const vendasTodasResult = await this.fetchWithRetry<{data: BetelVenda[]}>(urlTodasLojas);
        
        // Se tiver sucesso com todas_lojas=true, usar estas vendas
        if (!vendasTodasResult.error && vendasTodasResult.data?.data) {
          todasVendas = vendasTodasResult.data.data;
          console.log(`Obtidas ${todasVendas.length} vendas com parâmetro todas_lojas=true`);
        }
        // Se falhar, buscar individualmente por loja
        else {
          console.log(`Falha ao buscar com todas_lojas=true, buscando individualmente por loja...`);
          
          // Para cada loja, buscar suas vendas
          for (const loja of lojas) {
            const lojaId = loja.id?.toString();
            if (!lojaId) continue;
            
            console.log(`Buscando vendas da loja: ${loja.nome} (ID: ${lojaId})`);
            const urlLoja = `/vendas?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}&loja_id=${encodeURIComponent(lojaId)}`;
            
            const vendasResult = await this.fetchWithRetry<{data: BetelVenda[]}>(urlLoja);
            if (vendasResult.error) {
              console.warn(`Erro ao buscar vendas da loja ${lojaId}: ${vendasResult.error}`);
              continue;
            }
            
            if (vendasResult.data?.data) {
              // Adicionar identificação de loja se não existir
              const vendasProcessadas = vendasResult.data.data.map(venda => ({
                ...venda,
                loja_id: lojaId,
                nome_loja: loja.nome
              }));
              
              todasVendas = [...todasVendas, ...vendasProcessadas];
              console.log(`Obtidas ${vendasProcessadas.length} vendas da loja ${loja.nome} (ID: ${lojaId})`);
            }
          }
        }
      }
      
      console.log(`Total de vendas brutas obtidas: ${todasVendas.length}`);
      
      // Processar e filtrar vendas pelo período
      const vendasProcessadas = todasVendas
        .map((venda: BetelVenda) => {
          const dadosComplementares: Partial<BetelVenda> = {};
          
        // Se não tiver a propriedade data, adicionar
        if (!venda.data) {
            dadosComplementares.data = venda.data_inclusao?.split(' ')[0] || format(new Date(), 'yyyy-MM-dd');
          }
          
          // Se não tiver loja_id ou nome_loja, usar valores padrão ou da loja especificada
          if (!venda.loja_id || !venda.nome_loja) {
            if (params.lojaId) {
              const lojaNome = lojas.find(l => l.id?.toString() === params.lojaId)?.nome || `Loja ${params.lojaId}`;
              dadosComplementares.loja_id = params.lojaId;
              dadosComplementares.nome_loja = lojaNome;
            } else {
              dadosComplementares.loja_id = '367505'; // ID da Matriz como padrão
              dadosComplementares.nome_loja = 'Unidade Matriz';
            }
          }
          
          return {
            ...venda,
            ...dadosComplementares
          };
        })
        // Filtrar apenas vendas dentro do período especificado
        .filter((venda: BetelVenda) => {
          try {
            // Obter a data da venda da forma mais confiável possível
            let dataVenda: Date;
            
            if (venda.data_venda) {
              // Se tem data_venda (que inclui hora), usar ela
              dataVenda = new Date(venda.data_venda);
            } else if (venda.data) {
              // Se tem apenas data (YYYY-MM-DD), usar início do dia
              dataVenda = new Date(venda.data);
              dataVenda.setHours(12, 0, 0, 0); // Meio-dia para evitar problemas de timezone
            } else if (venda.data_inclusao) {
              // Em último caso, usar data_inclusao
              const dataStr = venda.data_inclusao.split(' ')[0];
              dataVenda = new Date(dataStr);
              dataVenda.setHours(12, 0, 0, 0);
            } else {
              // Se não tem nenhuma data, considerar inválida
              console.warn(`Venda sem data válida: ${venda.id}`);
              return false;
            }
            
            // Verificar se a data é válida
            if (isNaN(dataVenda.getTime())) {
              console.warn(`Data inválida para venda ${venda.id}: ${venda.data || venda.data_venda || venda.data_inclusao}`);
              return false;
            }
            
            // Verificar se está dentro do período
            const estaNoIntervalo = 
              dataVenda >= dataInicioNormalizada && 
              dataVenda <= dataFimNormalizada;
              
            if (!estaNoIntervalo) {
              console.debug(`Venda ${venda.id} com data ${dataVenda.toISOString()} está fora do período: ${dataInicioNormalizada.toISOString()} - ${dataFimNormalizada.toISOString()}`);
            }
            
            return estaNoIntervalo;
          } catch (error) {
            console.error(`Erro ao processar data da venda ${venda.id}:`, error);
            return false;
          }
        });
        
      // Se encontrados vendedores específicos, logar para debug
      const vendedoresPresentes = new Set<string>();
      vendasProcessadas.forEach(venda => {
        const vendedorNome = venda.nome_vendedor || venda.vendedor_nome || '';
        if (vendedorNome) {
          vendedoresPresentes.add(vendedorNome.toUpperCase());
        }
      });
      
      console.log(`Vendedores presentes nas vendas: ${Array.from(vendedoresPresentes).join(', ')}`);
      console.log(`Mantendo ${vendasProcessadas.length} vendas dentro do período especificado`);
      
      // Verificar se Marcos/Marcus, Diuly e Yasmim estão presentes
      const temMarcus = vendedoresPresentes.has('MARCUS VINICIUS MACEDO') || 
                        vendedoresPresentes.has('MARCUS VINICIUS') || 
                        vendedoresPresentes.has('MARCUS') ||
                        vendedoresPresentes.has('MARCOS VINICIUS');
      const temDiuly = vendedoresPresentes.has('DIULY MORAES') || vendedoresPresentes.has('DIULY');
      const temYasmim = vendedoresPresentes.has('YASMIM SILVA') || vendedoresPresentes.has('YASMIM');
      
      console.log(`Verificação de vendedores - Marcus: ${temMarcus ? 'PRESENTE' : 'AUSENTE'}, Diuly: ${temDiuly ? 'PRESENTE' : 'AUSENTE'}, Yasmim: ${temYasmim ? 'PRESENTE' : 'AUSENTE'}`);
      
      // Calcular totais
      const totalVendas = vendasProcessadas.length;
      const totalValor = parseFloat(vendasProcessadas.reduce((acc: number, venda: BetelVenda) => {
        const valorVenda = parseFloat(venda.valor_total || '0');
        return acc + valorVenda;
      }, 0).toFixed(2));

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

  /**
   * Busca informações de todas as lojas disponíveis
   */
  static async buscarLojas(): Promise<{
    lojas: any[];
    totalLojas: number;
    erro?: string;
  }> {
    try {
      console.log('Buscando informações de lojas disponíveis');
      
      // Fazer requisição direta à API para buscar lojas
      const lojasResult = await this.fetchWithRetry<{data: any[]}>('/lojas');
      
      if (lojasResult.error) {
        throw new Error(`Erro ao buscar lojas: ${lojasResult.error}`);
      }
      
      const lojasData = lojasResult.data;
      if (!lojasData || !lojasData.data) {
        throw new Error('Formato de resposta inválido da API de lojas');
      }
      
      const lojas = lojasData.data || [];
      console.log(`Encontradas ${lojas.length} lojas disponíveis`);
      
      // Mostrar detalhes das lojas para debug
      lojas.forEach((loja: any) => {
        console.log(`Loja: ${loja.id} - ${loja.nome || loja.descricao || 'Nome não informado'}`);
      });
      
      return {
        lojas,
        totalLojas: lojas.length
      };
      
    } catch (error) {
      console.error('Erro ao buscar lojas na Betel Tecnologia:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Se estamos em modo demo, retornar lojas mockadas
      if (isDemoMode) {
        console.log('Retornando lojas mockadas em modo demo');
        const lojasMock = [
          { id: 1, nome: 'Unidade Matriz', codigo: 'MTZ' },
          { id: 2, nome: 'Filial Golden', codigo: 'FGL' }
        ];
        
        return {
          lojas: lojasMock,
          totalLojas: lojasMock.length
        };
      }
      
      return {
        lojas: [],
        totalLojas: 0,
        erro: errorMessage
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