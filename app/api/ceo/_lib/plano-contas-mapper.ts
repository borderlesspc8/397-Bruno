/**
 * Mapeador de Plano de Contas para Classificação Contábil
 * 
 * Classifica planos de contas em categorias para DRE, Fluxo de Caixa e análises
 */

export enum ClassificacaoPlanoContas {
  // Impostos sobre vendas (dedução de receita)
  IMPOSTO_VENDA = 'IMPOSTO_VENDA',
  
  // Despesas operacionais
  DESPESA_ADMINISTRATIVA = 'DESPESA_ADMINISTRATIVA',
  DESPESA_COMERCIAL = 'DESPESA_COMERCIAL',
  DESPESA_MARKETING = 'DESPESA_MARKETING',
  DESPESA_LOGISTICA = 'DESPESA_LOGISTICA',
  DESPESA_TI = 'DESPESA_TI',
  DESPESA_RH = 'DESPESA_RH',
  
  // Receitas e despesas financeiras
  RECEITA_FINANCEIRA = 'RECEITA_FINANCEIRA',
  DESPESA_FINANCEIRA = 'DESPESA_FINANCEIRA',
  
  // Investimentos (Capex)
  INVESTIMENTO_CAPEX = 'INVESTIMENTO_CAPEX',
  
  // Financiamento
  FINANCIAMENTO_EMPRESTIMO = 'FINANCIAMENTO_EMPRESTIMO',
  FINANCIAMENTO_APORTE = 'FINANCIAMENTO_APORTE',
  FINANCIAMENTO_DISTRIBUICAO = 'FINANCIAMENTO_DISTRIBUICAO',
  
  // IR e CSLL
  IMPOSTO_RENDA = 'IMPOSTO_RENDA',
  
  // Outros
  OUTROS = 'OUTROS'
}

interface PlanoContasMapping {
  id?: string;
  nome: string;
  classificacao: ClassificacaoPlanoContas;
  descricao?: string;
}

/**
 * Mapeamento de planos de contas por palavras-chave
 */
const KEYWORDS_MAPPING: Array<{
  keywords: string[];
  classificacao: ClassificacaoPlanoContas;
}> = [
  // Impostos sobre vendas
  {
    keywords: ['icms', 'pis', 'cofins', 'iss', 'simples nacional', 'imposto sobre venda'],
    classificacao: ClassificacaoPlanoContas.IMPOSTO_VENDA
  },
  
  // Marketing e vendas
  {
    keywords: ['marketing', 'publicidade', 'propaganda', 'mídia', 'anúncio', 'google ads', 'facebook ads', 'instagram', 'tráfego pago'],
    classificacao: ClassificacaoPlanoContas.DESPESA_MARKETING
  },
  
  // Despesas comerciais
  {
    keywords: ['comissão', 'vendas', 'comercial', 'representante', 'vendedor', 'frete venda'],
    classificacao: ClassificacaoPlanoContas.DESPESA_COMERCIAL
  },
  
  // Despesas administrativas
  {
    keywords: ['administrativo', 'aluguel', 'água', 'luz', 'energia', 'telefone', 'internet', 'escritório', 'material escritório', 'limpeza', 'segurança', 'contador', 'contabilidade', 'advogado', 'jurídico'],
    classificacao: ClassificacaoPlanoContas.DESPESA_ADMINISTRATIVA
  },
  
  // Logística
  {
    keywords: ['logística', 'transporte', 'frete', 'entrega', 'correio', 'armazenagem'],
    classificacao: ClassificacaoPlanoContas.DESPESA_LOGISTICA
  },
  
  // TI
  {
    keywords: ['ti', 'tecnologia', 'software', 'sistema', 'servidor', 'nuvem', 'cloud', 'hospedagem', 'saas'],
    classificacao: ClassificacaoPlanoContas.DESPESA_TI
  },
  
  // RH
  {
    keywords: ['salário', 'folha', 'pró-labore', 'vale', 'benefício', 'treinamento', 'recrutamento', 'rh', 'recursos humanos'],
    classificacao: ClassificacaoPlanoContas.DESPESA_RH
  },
  
  // Receitas financeiras
  {
    keywords: ['juros recebido', 'receita financeira', 'rendimento', 'aplicação financeira', 'desconto obtido'],
    classificacao: ClassificacaoPlanoContas.RECEITA_FINANCEIRA
  },
  
  // Despesas financeiras
  {
    keywords: ['juros pago', 'despesa financeira', 'juros sobre empréstimo', 'iof', 'tarifa bancária', 'taxa bancária', 'desconto concedido'],
    classificacao: ClassificacaoPlanoContas.DESPESA_FINANCEIRA
  },
  
  // Investimentos (Capex)
  {
    keywords: ['equipamento', 'máquina', 'veículo', 'imóvel', 'móvel', 'imobilizado', 'capex', 'investimento'],
    classificacao: ClassificacaoPlanoContas.INVESTIMENTO_CAPEX
  },
  
  // Financiamento
  {
    keywords: ['empréstimo', 'financiamento', 'aporte', 'capital social', 'distribuição lucro', 'dividendo'],
    classificacao: ClassificacaoPlanoContas.FINANCIAMENTO_EMPRESTIMO
  },
  
  // IR e CSLL
  {
    keywords: ['imposto de renda', 'ir', 'csll', 'irpj', 'irrf sobre lucro'],
    classificacao: ClassificacaoPlanoContas.IMPOSTO_RENDA
  }
];

/**
 * Classifica um plano de contas com base em seu nome
 */
export function classificarPlanoContas(nomePlano: string): ClassificacaoPlanoContas {
  if (!nomePlano) {
    return ClassificacaoPlanoContas.OUTROS;
  }
  
  const nomeNormalizado = nomePlano.toLowerCase().trim();
  
  // Buscar por palavras-chave
  for (const mapping of KEYWORDS_MAPPING) {
    for (const keyword of mapping.keywords) {
      if (nomeNormalizado.includes(keyword.toLowerCase())) {
        return mapping.classificacao;
      }
    }
  }
  
  return ClassificacaoPlanoContas.OUTROS;
}

/**
 * Verifica se uma classificação é de imposto sobre venda
 */
export function isImpostoVenda(classificacao: ClassificacaoPlanoContas): boolean {
  return classificacao === ClassificacaoPlanoContas.IMPOSTO_VENDA;
}

/**
 * Verifica se uma classificação é despesa operacional
 */
export function isDespesaOperacional(classificacao: ClassificacaoPlanoContas): boolean {
  return [
    ClassificacaoPlanoContas.DESPESA_ADMINISTRATIVA,
    ClassificacaoPlanoContas.DESPESA_COMERCIAL,
    ClassificacaoPlanoContas.DESPESA_MARKETING,
    ClassificacaoPlanoContas.DESPESA_LOGISTICA,
    ClassificacaoPlanoContas.DESPESA_TI,
    ClassificacaoPlanoContas.DESPESA_RH
  ].includes(classificacao);
}

/**
 * Verifica se uma classificação é receita/despesa financeira
 */
export function isResultadoFinanceiro(classificacao: ClassificacaoPlanoContas): boolean {
  return [
    ClassificacaoPlanoContas.RECEITA_FINANCEIRA,
    ClassificacaoPlanoContas.DESPESA_FINANCEIRA
  ].includes(classificacao);
}

/**
 * Verifica se uma classificação é investimento (Capex)
 */
export function isInvestimento(classificacao: ClassificacaoPlanoContas): boolean {
  return classificacao === ClassificacaoPlanoContas.INVESTIMENTO_CAPEX;
}

/**
 * Verifica se uma classificação é financiamento
 */
export function isFinanciamento(classificacao: ClassificacaoPlanoContas): boolean {
  return [
    ClassificacaoPlanoContas.FINANCIAMENTO_EMPRESTIMO,
    ClassificacaoPlanoContas.FINANCIAMENTO_APORTE,
    ClassificacaoPlanoContas.FINANCIAMENTO_DISTRIBUICAO
  ].includes(classificacao);
}

/**
 * Verifica se uma classificação é IR/CSLL
 */
export function isImpostoRenda(classificacao: ClassificacaoPlanoContas): boolean {
  return classificacao === ClassificacaoPlanoContas.IMPOSTO_RENDA;
}

/**
 * Agrupa pagamentos por classificação
 */
export interface PagamentoClassificado {
  id: string;
  valor: number;
  descricao: string;
  planoConta: string;
  classificacao: ClassificacaoPlanoContas;
  data: string;
}

export function agruparPorClassificacao(pagamentos: PagamentoClassificado[]): Map<ClassificacaoPlanoContas, number> {
  const agrupado = new Map<ClassificacaoPlanoContas, number>();
  
  for (const pagamento of pagamentos) {
    const valorAtual = agrupado.get(pagamento.classificacao) || 0;
    agrupado.set(pagamento.classificacao, valorAtual + pagamento.valor);
  }
  
  return agrupado;
}

