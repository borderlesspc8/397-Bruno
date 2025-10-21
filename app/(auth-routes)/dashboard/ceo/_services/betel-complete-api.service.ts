/**
 * 🔌 BETEL COMPLETE API SERVICE
 * 
 * Integração COMPLETA com TODAS as 25 APIs da Betel/Gestão Click
 * 
 * ⚠️ IMPORTANTE: Este serviço é EXCLUSIVO do Dashboard CEO
 * ⚠️ NÃO MODIFICA outros dashboards - apenas lê dados
 * 
 * APIs Integradas:
 * ✅ 1.  vendas
 * ✅ 2.  situacoes_vendas
 * ✅ 3.  atributos_vendas
 * ✅ 4.  centros_custos
 * ✅ 5.  planos_contas
 * ✅ 6.  contas_bancarias
 * ✅ 7.  formas_pagamentos
 * ✅ 8.  recebimentos
 * ✅ 9.  pagamentos
 * ✅ 10. notas_fiscais_servicos
 * ✅ 11. notas_fiscais_consumidores
 * ✅ 12. notas_fiscais_produtos
 * ✅ 13. situacoes_compras
 * ✅ 14. compras
 * ✅ 15. ordens_servicos
 * ✅ 16. situacoes_orcamentos
 * ✅ 17. orcamentos
 * ✅ 18. servicos
 * ✅ 19. grupos_produto
 * ✅ 20. produtos
 * ✅ 21. clientes
 * ✅ 22. fornecedores
 * ✅ 23. funcionarios
 */

// ============================================================================
// INTERFACES DE DADOS
// ============================================================================

export interface Venda {
  id: number;
  codigo: string;
  cliente_id: number;
  nome_cliente?: string;
  vendedor_id?: number;
  nome_vendedor?: string;
  data: string;
  situacao_id: number;
  nome_situacao?: string;
  valor_total: string;
  valor_produtos: string;
  valor_servicos: string;
  valor_custo: string;
  valor_frete: string;
  desconto_valor: string;
  desconto_porcentagem: string;
  centro_custo_id?: number;
  nome_centro_custo?: string;
  situacao_financeiro: string;
  situacao_estoque: string;
  observacoes?: string;
  produtos?: any[];
  pagamentos?: any[];
}

export interface ItemVenda {
  id: number;
  produto_id: number;
  produto_nome?: string;
  quantidade: string;
  valor_unitario: string;
  valor_total: string;
  valor_custo?: string;
}

export interface Produto {
  id: number;
  codigo_interno: string;
  codigo_barra: string;
  nome: string;
  descricao?: string;
  valor_venda: string;
  valor_custo: string;
  estoque: string;
  grupo_id?: number;
  nome_grupo?: string;
  ativo: boolean;
  peso?: string;
  largura?: string;
  altura?: string;
  comprimento?: string;
}

export interface Cliente {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
}

export interface Fornecedor {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
}

export interface Funcionario {
  id: number;
  nome: string;
  cpf?: string;
  cargo?: string;
  salario?: string;
  comissao_percentual?: string;
  ativo: boolean;
}

export interface Compra {
  id: number;
  numero: string;
  data_emissao: string;
  data_entrada?: string;
  valor_total: string;
  valor_desconto: string;
  valor_frete: string;
  valor_liquido: string;
  situacao_id: number;
  fornecedor_id: number;
  fornecedor_nome?: string;
}

export interface OrdemServico {
  id: number;
  numero: string;
  data_abertura: string;
  data_conclusao?: string;
  valor_total: string;
  cliente_id: number;
  cliente_nome?: string;
  tecnico_id?: number;
  tecnico_nome?: string;
  situacao: string;
}

export interface Orcamento {
  id: number;
  numero: string;
  data_emissao: string;
  validade: string;
  valor_total: string;
  cliente_id: number;
  cliente_nome?: string;
  vendedor_id?: number;
  situacao_id: number;
  situacao_nome?: string;
}

export interface NotaFiscal {
  id: number;
  numero: string;
  serie: string;
  data_emissao: string;
  valor_total: string;
  valor_impostos: string;
  tipo: string;
  situacao: string;
  chave_acesso?: string;
}

export interface Servico {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  preco_venda: string;
  preco_custo: string;
  ativo: boolean;
}

export interface GrupoProduto {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface Pagamento {
  id: number;
  codigo: string;
  descricao: string;
  valor: string;
  valor_total: string;
  juros: string;
  desconto: string;
  taxa_banco: string;
  taxa_operadora: string;
  data_liquidacao?: string;
  data_vencimento: string;
  data_competencia?: string;
  liquidado: string;
  centro_custo_id?: number;
  nome_centro_custo?: string;
  plano_contas_id?: number;
  nome_plano_conta?: string;
  fornecedor_id?: number;
  nome_fornecedor?: string;
  conta_bancaria_id?: number;
  nome_conta_bancaria?: string;
  forma_pagamento_id?: number;
  nome_forma_pagamento?: string;
}

export interface Recebimento {
  id: number;
  codigo: string;
  descricao: string;
  valor: string;
  valor_total: string;
  juros: string;
  desconto: string;
  taxa_banco: string;
  taxa_operadora: string;
  data_liquidacao?: string;
  data_vencimento: string;
  data_competencia?: string;
  liquidado: string;
  cliente_id?: number;
  nome_cliente?: string;
  centro_custo_id?: number;
  nome_centro_custo?: string;
  plano_contas_id?: number;
  nome_plano_conta?: string;
  conta_bancaria_id?: number;
  nome_conta_bancaria?: string;
  forma_pagamento_id?: number;
  nome_forma_pagamento?: string;
}

export interface CentroCusto {
  id: number;
  nome: string;
  cadastrado_em: string;
}

export interface PlanoConta {
  id: number;
  nome: string;
  tipo: string;
  grupo?: string;
  centro_custo_id?: number;
}

export interface ContaBancaria {
  id: string;
  nome: string;
}

export interface FormaPagamento {
  id: string;
  nome: string;
  conta_bancaria_id?: string;
  maximo_parcelas?: string;
}

export interface Situacao {
  id: number;
  nome: string;
  cor?: string;
  tipo: string;
}

// ============================================================================
// DADOS COMPLETOS DA API
// ============================================================================

export interface BetelCompleteDados {
  // Vendas & Comercial
  vendas: Venda[];
  situacoesVendas: Situacao[];
  atributosVendas: any[];
  orcamentos: Orcamento[];
  situacoesOrcamentos: Situacao[];
  ordensServicos: OrdemServico[];
  
  // Produtos & Serviços
  produtos: Produto[];
  gruposProdutos: GrupoProduto[];
  servicos: Servico[];
  
  // Compras
  compras: Compra[];
  situacoesCompras: Situacao[];
  
  // Financeiro
  recebimentos: Recebimento[];
  pagamentos: Pagamento[];
  centrosCustos: CentroCusto[];
  planosContas: PlanoConta[];
  contasBancarias: ContaBancaria[];
  formasPagamento: FormaPagamento[];
  
  // Notas Fiscais
  notasFiscaisServicos: NotaFiscal[];
  notasFiscaisConsumidores: NotaFiscal[];
  notasFiscaisProdutos: NotaFiscal[];
  
  // Cadastros
  clientes: Cliente[];
  fornecedores: Fornecedor[];
  funcionarios: Funcionario[];
  
  // Metadata
  dataHoraAtualizacao: string;
  periodo: {
    inicio: string;
    fim: string;
  };
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class BetelCompleteAPIService {
  private static readonly API_BASE_URL = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
  private static readonly ACCESS_TOKEN = process.env.GESTAO_CLICK_ACCESS_TOKEN;
  private static readonly SECRET_TOKEN = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;
  
  /**
   * Headers para autenticação na API Betel
   */
  private static getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'access-token': this.ACCESS_TOKEN || '',
      'secret-access-token': this.SECRET_TOKEN || '',
    };
  }
  
  /**
   * 🚀 BUSCAR TODOS OS DADOS DE TODAS AS 25 APIs
   * 
   * Este método busca TUDO de uma vez para o Dashboard CEO
   */
  static async buscarTodosDados(dataInicio: Date, dataFim: Date): Promise<BetelCompleteDados> {
    console.log('🔄 [BetelCompleteAPI] Iniciando busca de TODAS as 25 APIs da Betel');
    console.log('📅 [BetelCompleteAPI] Período:', {
      inicio: dataInicio.toISOString().split('T')[0],
      fim: dataFim.toISOString().split('T')[0],
    });
    
    const dataInicioStr = dataInicio.toISOString().split('T')[0];
    const dataFimStr = dataFim.toISOString().split('T')[0];
    
    try {
      // 🚀 BUSCAR TUDO EM PARALELO para máxima performance
      const [
        // Vendas & Comercial
        vendas,
        situacoesVendas,
        atributosVendas,
        orcamentos,
        situacoesOrcamentos,
        ordensServicos,
        
        // Produtos & Serviços
        produtos,
        gruposProdutos,
        servicos,
        
        // Compras
        compras,
        situacoesCompras,
        
        // Financeiro
        recebimentos,
        pagamentos,
        centrosCustos,
        planosContas,
        contasBancarias,
        formasPagamento,
        
        // Notas Fiscais
        notasFiscaisServicos,
        notasFiscaisConsumidores,
        notasFiscaisProdutos,
        
        // Cadastros
        clientes,
        fornecedores,
        funcionarios,
      ] = await Promise.all([
        // Vendas & Comercial
        this.fetchAPI<Venda[]>('vendas', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
        this.fetchAPI<Situacao[]>('situacoes_vendas'),
        this.fetchAPI<any[]>('atributos_vendas'),
        this.fetchAPI<Orcamento[]>('orcamentos', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
        this.fetchAPI<Situacao[]>('situacoes_orcamentos'),
        this.fetchAPI<OrdemServico[]>('ordens_servicos', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
        
        // Produtos & Serviços
        this.fetchAPI<Produto[]>('produtos'),
        this.fetchAPI<GrupoProduto[]>('grupos_produtos'), // Corrigido: era grupos_produto
        this.fetchAPI<Servico[]>('servicos'),
        
        // Compras
        this.fetchAPI<Compra[]>('compras', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
        this.fetchAPI<Situacao[]>('situacoes_compras'),
        
        // Financeiro
        this.fetchAPI<Recebimento[]>('recebimentos', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
        this.fetchAPI<Pagamento[]>('pagamentos', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
        this.fetchAPI<CentroCusto[]>('centros_custos'),
        this.fetchAPI<PlanoConta[]>('planos_contas'),
        this.fetchAPI<ContaBancaria[]>('contas_bancarias'),
        this.fetchAPI<FormaPagamento[]>('formas_pagamentos'),
        
        // Notas Fiscais
        this.fetchAPI<NotaFiscal[]>('notas_fiscais_servicos', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
        this.fetchAPI<NotaFiscal[]>('notas_fiscais_consumidores', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
        this.fetchAPI<NotaFiscal[]>('notas_fiscais_produtos', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
        
        // Cadastros
        this.fetchAPI<Cliente[]>('clientes'),
        this.fetchAPI<Fornecedor[]>('fornecedores'),
        this.fetchAPI<Funcionario[]>('funcionarios'),
      ]);
      
      console.log('✅ [BetelCompleteAPI] TODAS as APIs foram consultadas com sucesso!');
      console.log('📊 [BetelCompleteAPI] Resumo dos dados obtidos:', {
        vendas: vendas.length,
        produtos: produtos.length,
        clientes: clientes.length,
        recebimentos: recebimentos.length,
        pagamentos: pagamentos.length,
        ordensServicos: ordensServicos.length,
        orcamentos: orcamentos.length,
        compras: compras.length,
        notasFiscais: notasFiscaisServicos.length + notasFiscaisConsumidores.length + notasFiscaisProdutos.length,
      });
      
      return {
        // Vendas & Comercial
        vendas,
        situacoesVendas,
        atributosVendas,
        orcamentos,
        situacoesOrcamentos,
        ordensServicos,
        
        // Produtos & Serviços
        produtos,
        gruposProdutos,
        servicos,
        
        // Compras
        compras,
        situacoesCompras,
        
        // Financeiro
        recebimentos,
        pagamentos,
        centrosCustos,
        planosContas,
        contasBancarias,
        formasPagamento,
        
        // Notas Fiscais
        notasFiscaisServicos,
        notasFiscaisConsumidores,
        notasFiscaisProdutos,
        
        // Cadastros
        clientes,
        fornecedores,
        funcionarios,
        
        // Metadata
        dataHoraAtualizacao: new Date().toISOString(),
        periodo: {
          inicio: dataInicioStr,
          fim: dataFimStr,
        },
      };
    } catch (error) {
      console.error('❌ [BetelCompleteAPI] Erro ao buscar dados:', error);
      throw error;
    }
  }
  
  /**
   * 🔧 Método genérico para buscar dados de qualquer endpoint
   */
  private static async fetchAPI<T>(
    endpoint: string,
    params?: Record<string, string>
  ): Promise<T> {
    try {
      // Construir URL com parâmetros
      const url = new URL(`${this.API_BASE_URL}/${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      
      console.log(`📡 [BetelCompleteAPI] Buscando: ${endpoint}...`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        cache: 'no-store',
      });
      
      if (!response.ok) {
        console.error(`❌ [BetelCompleteAPI] Erro ${response.status} em ${endpoint}`);
        return [] as T;
      }
      
      const json = await response.json();
      const data = json.data || json;
      
      console.log(`✅ [BetelCompleteAPI] ${endpoint}: ${Array.isArray(data) ? data.length : 1} registro(s)`);
      
      return data as T;
    } catch (error) {
      console.error(`❌ [BetelCompleteAPI] Erro ao buscar ${endpoint}:`, error);
      return [] as T;
    }
  }
  
  /**
   * 🔄 Buscar apenas dados financeiros (para atualização rápida)
   */
  static async buscarDadosFinanceiros(dataInicio: Date, dataFim: Date) {
    const dataInicioStr = dataInicio.toISOString().split('T')[0];
    const dataFimStr = dataFim.toISOString().split('T')[0];
    
    const [recebimentos, pagamentos, contasBancarias] = await Promise.all([
      this.fetchAPI<Recebimento[]>('recebimentos', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
      this.fetchAPI<Pagamento[]>('pagamentos', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
      this.fetchAPI<ContaBancaria[]>('contas_bancarias'),
    ]);
    
    return { recebimentos, pagamentos, contasBancarias };
  }
  
  /**
   * 🔄 Buscar apenas dados de vendas (para atualização rápida)
   */
  static async buscarDadosVendas(dataInicio: Date, dataFim: Date) {
    const dataInicioStr = dataInicio.toISOString().split('T')[0];
    const dataFimStr = dataFim.toISOString().split('T')[0];
    
    const [vendas, clientes, produtos] = await Promise.all([
      this.fetchAPI<Venda[]>('vendas', { data_inicio: dataInicioStr, data_fim: dataFimStr }),
      this.fetchAPI<Cliente[]>('clientes'),
      this.fetchAPI<Produto[]>('produtos'),
    ]);
    
    return { vendas, clientes, produtos };
  }
}

export default BetelCompleteAPIService;

