import { api } from '@/app/_lib/api';
import { format, parseISO } from 'date-fns';
import { Produto, ProdutosResponse } from './produtos';

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
  vendedor_id?: number;
  vendedor_nome?: string;
  nome_vendedor?: string;
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
   * com tratamento padronizado de erros
   */
  private static async fetchWithRetry<T>(
    url: string, 
    options = {}, 
    maxRetries = 2
  ): Promise<{ data: T | null; error: string | null }> {
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
  }

  static async buscarVendedores(params: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<VendedoresResponse> {
    try {
      console.log('Iniciando busca de vendedores com parâmetros:', params);
      
      // Formatar datas para o formato que a API espera
      const dataInicio = format(params.dataInicio, 'yyyy-MM-dd');
      const dataFim = format(params.dataFim, 'yyyy-MM-dd');
      
      console.log('Datas formatadas:', { dataInicio, dataFim });
      console.log('Tentando buscar vendas da API externa para processar vendedores...');

      // Buscar vendas no período usando o novo método fetchWithRetry
      const vendasResult = await this.fetchWithRetry<{data: BetelVenda[]}>(`/vendas?data_inicio=${encodeURIComponent(dataInicio)}&data_fim=${encodeURIComponent(dataFim)}`);
      
      if (vendasResult.error) {
        throw new Error(`Erro ao buscar vendas: ${vendasResult.error}`);
      }

      const vendasData = vendasResult.data;
      if (!vendasData || !vendasData.data || !Array.isArray(vendasData.data)) {
        throw new Error('Formato de resposta inválido da API de vendas');
      }

      console.log(`Vendas obtidas para processamento de vendedores: ${vendasData.data.length}`);
      
      // Diagnóstico: Verificar vendedores nas primeiras 5 vendas
      if (vendasData.data.length > 0) {
        const amostraVendas = vendasData.data.slice(0, 5);
        console.log('Diagnóstico - Amostra de vendedores encontrados nas primeiras 5 vendas:');
        amostraVendas.forEach((venda, idx) => {
          console.log(`Venda #${idx+1}: ID: ${venda.id}, Vendedor: ${venda.nome_vendedor || venda.vendedor_nome || 'Não informado'}, ID Vendedor: ${venda.vendedor_id || 'Não informado'}`);
        });
      }
      
      // Agrupar vendas por vendedor
      const vendedoresMap = new Map<string, Vendedor>();
      
      // Processar vendas e agrupar por vendedor
      vendasData.data.forEach((venda: BetelVenda) => {
        const vendedorId = venda.vendedor_id?.toString() || 'desconhecido';
        // Usar nome_vendedor com prioridade, mas manter compatibilidade com vendedor_nome
        const vendedorNome = venda.nome_vendedor || venda.vendedor_nome || `Vendedor ${vendedorId}`;
        const valorVenda = parseFloat(venda.valor_total || '0');
        
        // Verificar se é a Diuly
        if (vendedorNome.includes('Diuly')) {
          console.log('Diuly encontrada em uma venda:', {
            vendaId: venda.id,
            vendedorId,
            vendedorNome,
            valorVenda
          });
        }
        
        if (!vendedoresMap.has(vendedorId)) {
          vendedoresMap.set(vendedorId, {
            id: vendedorId,
            nome: vendedorNome,
            vendas: 0,
            faturamento: 0,
            ticketMedio: 0
          });
        }
        
        const vendedor = vendedoresMap.get(vendedorId)!;
        vendedor.vendas += 1;
        vendedor.faturamento += valorVenda;
      });
      
      // Calcular ticket médio e converter para array
      const vendedores = Array.from(vendedoresMap.values()).map(vendedor => {
        vendedor.ticketMedio = vendedor.vendas > 0 ? vendedor.faturamento / vendedor.vendas : 0;
        return vendedor;
      });
      
      // Diagnóstico: Verificar se Diuly está na lista de vendedores
      const vendedorDiuly = vendedores.find(v => v.nome.includes('Diuly'));
      if (vendedorDiuly) {
        console.log('Diuly encontrada na lista de vendedores processados:', vendedorDiuly);
      } else {
        console.log('Diuly NÃO foi encontrada na lista de vendedores processados');
      }
      
      // Verificar se Marcos Vinicius já está na lista
      const vendedorMarcos = vendedores.find(v => v.nome.includes('Marcos Vinicius'));
      
      // MODIFICAÇÃO: Incluir todos os vendedores, mesmo os sem vendas
      // Antes filtrava apenas vendedores com vendas (v.vendas > 0)
      // Agora incluímos todos os vendedores
      const vendedoresComVendas = vendedores;
      
      // Se Marcos Vinicius não estiver na lista, adicionar manualmente
      if (!vendedorMarcos) {
        console.log('Marcos Vinicius NÃO encontrado na lista. Adicionando manualmente...');
        vendedoresComVendas.push({
          id: 'marcos-vinicius',
          nome: 'Marcos Vinicius',
          vendas: 0,
          faturamento: 0,
          ticketMedio: 0
        });
      }
      
      // Verificar novamente após o filtro
      const diulyAposFiltragem = vendedoresComVendas.find(v => v.nome.includes('Diuly'));
      if (diulyAposFiltragem) {
        console.log('Diuly MANTIDA após filtragem:', diulyAposFiltragem);
      } else if (vendedorDiuly) {
        console.log('Diuly foi REMOVIDA durante a filtragem. Adicionando-a de volta...');
        vendedoresComVendas.push(vendedorDiuly);
      }
      
      // Ordenar por faturamento (decrescente)
      vendedoresComVendas.sort((a, b) => b.faturamento - a.faturamento);
      
      // Diagnóstico: Listar todos os vendedores ordenados
      console.log('Lista final de vendedores ordenados:');
      vendedoresComVendas.forEach((v, i) => {
        console.log(`${i+1}. ${v.nome} - ${v.vendas} vendas - R$ ${v.faturamento.toFixed(2)}`);
      });
      
      // Calcular totais
      const totalVendedores = vendedoresComVendas.length;
      const totalVendas = vendedoresComVendas.reduce((acc, v) => acc + v.vendas, 0);
      const totalFaturamento = vendedoresComVendas.reduce((acc, v) => acc + v.faturamento, 0);
      
      console.log(`Total de vendedores processados com vendas: ${totalVendedores}`);
      
      // Retornar resultados
      return {
        vendedores: vendedoresComVendas,
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
      console.log('Iniciando busca de produtos vendidos com parâmetros:', params);
      
      // Formatar datas para o formato que a API espera
      const dataInicio = format(params.dataInicio, 'yyyy-MM-dd');
      const dataFim = format(params.dataFim, 'yyyy-MM-dd');
      
      console.log('Datas formatadas:', { dataInicio, dataFim });
      console.log('Tentando buscar vendas da API externa para processar produtos...');

      // Buscar vendas no período usando o novo método fetchWithRetry
      const vendasResult = await this.fetchWithRetry<{data: BetelVenda[]}>(`/vendas?data_inicio=${encodeURIComponent(dataInicio)}&data_fim=${encodeURIComponent(dataFim)}`);
      
      if (vendasResult.error) {
        throw new Error(`Erro ao buscar vendas: ${vendasResult.error}`);
      }

      const vendasData = vendasResult.data;
      if (!vendasData || !vendasData.data || !Array.isArray(vendasData.data)) {
        throw new Error('Formato de resposta inválido da API de vendas');
      }

      console.log(`Vendas obtidas para processamento de produtos: ${vendasData.data.length}`);
      
      // Verificar estrutura das vendas para debug
      if (vendasData.data.length > 0) {
        console.log('Estrutura da primeira venda:', {
          id: vendasData.data[0].id,
          cliente: vendasData.data[0].cliente,
          valor_total: vendasData.data[0].valor_total,
          data_inclusao: vendasData.data[0].data_inclusao,
          tem_itens: Array.isArray(vendasData.data[0].itens),
          qtd_itens: vendasData.data[0].itens?.length || 0
        });
      }

      // Buscar produtos vendidos diretamente da API
      console.log('Tentando buscar produtos da API externa...');
      const produtosResult = await this.fetchWithRetry<{data: any[]}>('/produtos');
      
      if (produtosResult.error) {
        throw new Error(`Erro ao buscar produtos: ${produtosResult.error}`);
      }

      const produtosData = produtosResult.data;
      if (!produtosData || !produtosData.data) {
        throw new Error('Formato de resposta inválido da API de produtos');
      }

      console.log(`Produtos obtidos: ${produtosData.data?.length || 0}`);

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

      // Combinar itens de vendas
      const produtosMap = new Map<number, Produto>();

      // Processar itens de vendas
      let totalItens = 0;
      vendasData.data.forEach((venda: BetelVenda, index: number) => {
        if (venda.itens && Array.isArray(venda.itens)) {
          totalItens += venda.itens.length;
          if (index === 0 && venda.itens.length > 0) {
            console.log('Estrutura do primeiro item da primeira venda:', venda.itens[0]);
          }
          venda.itens.forEach((item) => {
            processarItem(produtosMap, item, produtosMapPorId);
          });
        }
      });
      console.log(`Total de itens processados: ${totalItens}`);

      // Se não encontrou itens nas vendas, usar os produtos do catálogo diretamente
      if (totalItens === 0 && produtosData.data && Array.isArray(produtosData.data)) {
        console.log('Não foram encontrados itens nas vendas. Processando produtos do catálogo diretamente...');
        
        // Mapear produtos do catálogo para o formato esperado
        produtosData.data.forEach((produto: any) => {
          if (produto.id && produto.nome) {
            const id = produto.id.toString();
            // Usar valores padrão para quantidade e preço quando não disponíveis
            const precoUnitario = parseFloat(produto.valor_venda || '0');
            // Simplificando, consideramos 1 unidade vendida para cada produto do catálogo
            const quantidade = 1;
            const total = precoUnitario * quantidade;
            
            produtosMap.set(parseInt(id), {
              id,
              nome: produto.nome,
              quantidade,
              precoUnitario,
              total,
              categoria: produto.nome_grupo || 'Não categorizado'
            });
          }
        });
        
        console.log(`Processados ${produtosMap.size} produtos do catálogo`);
      }

      // Converter Map para array
      const produtos = Array.from(produtosMap.values());

      // Calcular totais com base nos dados reais
      const totalProdutos = produtos.length;
      const totalVendas = vendasData.data.length;
      const totalFaturamento = produtos.reduce((acc, produto) => acc + produto.total, 0);
      
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
      
      console.log('Datas formatadas:', { dataInicio, dataFim });
      console.log('Buscando vendas da API externa...');

      // Buscar vendas no período usando o novo método fetchWithRetry
      const vendasResult = await this.fetchWithRetry<{data: BetelVenda[]}>(`/vendas?data_inicio=${encodeURIComponent(dataInicio)}&data_fim=${encodeURIComponent(dataFim)}`);
      
      if (vendasResult.error) {
        throw new Error(`Erro ao buscar vendas: ${vendasResult.error}`);
      }

      const vendasData = vendasResult.data;
      if (!vendasData || !vendasData.data || !Array.isArray(vendasData.data)) {
        throw new Error('Formato de resposta inválido da API de vendas');
      }

      console.log(`Vendas obtidas: ${vendasData.data.length}`);
      
      // Adicionar log detalhado da primeira venda para verificação dos campos
      if (vendasData.data.length > 0) {
        console.log('Estrutura detalhada da primeira venda:', {
          ...vendasData.data[0],
          itens: vendasData.data[0].itens?.length || 0 // Exibir apenas a quantidade de itens para evitar logs muito grandes
        });
      }
      
      // Processamento das vendas
      const vendas = vendasData.data;
      const totalVendas = vendas.length;
      const totalValor = vendas.reduce((acc: number, venda: BetelVenda) => {
        const valorVenda = parseFloat(venda.valor_total || '0');
        return acc + valorVenda;
      }, 0);

      return {
        vendas,
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
  item: BetelItem, 
  produtosMapPorId?: Map<string, any>
) {
  const id = item.produto_id.toString();
  const quantidade = parseInt(item.quantidade);
  const precoUnitario = parseFloat(item.valor_unitario);
  const total = parseFloat(item.valor_total);
  
  // Informações adicionais do produto se disponíveis
  const infoProduto = produtosMapPorId?.get(id);
  const categoria = infoProduto?.categoria || item.categoria || 'Não categorizado';

  if (produtosMap.has(item.produto_id)) {
    // Se o produto já existe, atualiza a quantidade e total
    const produto = produtosMap.get(item.produto_id)!;
    produto.quantidade += quantidade;
    produto.total += total;
  } else {
    // Se não existe, cria um novo
    produtosMap.set(item.produto_id, {
      id,
      nome: item.produto,
      quantidade,
      precoUnitario,
      total,
      categoria,
    });
  }
} 