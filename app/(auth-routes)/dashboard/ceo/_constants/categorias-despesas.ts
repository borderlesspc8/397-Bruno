/**
 * 📂 CEO DASHBOARD - CATEGORIAS DE DESPESAS
 * 
 * Mapeamento e categorização de despesas para análise DRE
 */

// ============================================================================
// CATEGORIAS PRINCIPAIS
// ============================================================================

export enum CategoriaDespesaPrincipal {
  VENDAS = 'VENDAS',
  ADMINISTRATIVAS = 'ADMINISTRATIVAS',
  PESSOAL = 'PESSOAL',
  FINANCEIRAS = 'FINANCEIRAS',
  TRIBUTARIAS = 'TRIBUTARIAS',
  MARKETING = 'MARKETING',
  OPERACIONAIS = 'OPERACIONAIS',
  OUTRAS = 'OUTRAS',
}

// ============================================================================
// SUBCATEGORIAS
// ============================================================================

export interface SubcategoriaDespesa {
  id: string;
  nome: string;
  categoriaPrincipal: CategoriaDespesaPrincipal;
  tipo: 'fixa' | 'variavel';
  keywords: string[];
  descricao?: string;
}

export const SUBCATEGORIAS_DESPESAS: SubcategoriaDespesa[] = [
  // ========== VENDAS ==========
  {
    id: 'comissoes',
    nome: 'Comissões',
    categoriaPrincipal: CategoriaDespesaPrincipal.VENDAS,
    tipo: 'variavel',
    keywords: ['comissao', 'comissão', 'vendedor', 'vendas', 'bonus', 'bônus'],
    descricao: 'Comissões pagas aos vendedores',
  },
  {
    id: 'frete_entrega',
    nome: 'Frete e Entrega',
    categoriaPrincipal: CategoriaDespesaPrincipal.VENDAS,
    tipo: 'variavel',
    keywords: ['frete', 'entrega', 'transporte', 'logistica', 'logística', 'correios', 'sedex'],
    descricao: 'Custos de frete e entrega de produtos',
  },
  {
    id: 'embalagens',
    nome: 'Embalagens',
    categoriaPrincipal: CategoriaDespesaPrincipal.VENDAS,
    tipo: 'variavel',
    keywords: ['embalagem', 'caixa', 'pacote', 'envelope', 'sacola'],
    descricao: 'Materiais de embalagem',
  },
  {
    id: 'promocoes',
    nome: 'Promoções e Descontos',
    categoriaPrincipal: CategoriaDespesaPrincipal.VENDAS,
    tipo: 'variavel',
    keywords: ['promocao', 'promoção', 'desconto', 'cupom', 'cashback'],
    descricao: 'Descontos e promoções concedidos',
  },
  
  // ========== ADMINISTRATIVAS ==========
  {
    id: 'aluguel',
    nome: 'Aluguel',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['aluguel', 'locacao', 'locação', 'arrendamento'],
    descricao: 'Aluguel de imóveis e espaços',
  },
  {
    id: 'condominio',
    nome: 'Condomínio',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['condominio', 'condomínio', 'taxa condominial'],
    descricao: 'Taxas de condomínio',
  },
  {
    id: 'energia',
    nome: 'Energia Elétrica',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['energia', 'luz', 'eletrica', 'elétrica', 'eletricidade', 'cemig', 'cpfl'],
    descricao: 'Conta de energia elétrica',
  },
  {
    id: 'agua',
    nome: 'Água',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['agua', 'água', 'saneamento', 'copasa', 'sabesp'],
    descricao: 'Conta de água',
  },
  {
    id: 'telefone_internet',
    nome: 'Telefone e Internet',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['telefone', 'internet', 'telecom', 'banda larga', 'fibra', 'vivo', 'claro', 'oi', 'tim'],
    descricao: 'Serviços de telefonia e internet',
  },
  {
    id: 'material_escritorio',
    nome: 'Material de Escritório',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'variavel',
    keywords: ['material escritorio', 'material escritório', 'papelaria', 'caneta', 'papel'],
    descricao: 'Materiais de escritório e papelaria',
  },
  {
    id: 'limpeza',
    nome: 'Limpeza e Conservação',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['limpeza', 'higiene', 'conservacao', 'conservação', 'faxina'],
    descricao: 'Serviços e produtos de limpeza',
  },
  {
    id: 'seguranca',
    nome: 'Segurança',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['seguranca', 'segurança', 'vigilancia', 'vigilância', 'alarme'],
    descricao: 'Serviços de segurança',
  },
  {
    id: 'seguros',
    nome: 'Seguros',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['seguro', 'apolice', 'apólice', 'sinistro'],
    descricao: 'Seguros diversos',
  },
  {
    id: 'contabilidade',
    nome: 'Contabilidade',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['contabilidade', 'contador', 'contabil', 'contábil'],
    descricao: 'Serviços contábeis',
  },
  {
    id: 'juridico',
    nome: 'Jurídico',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'variavel',
    keywords: ['juridico', 'jurídico', 'advogado', 'advocacia', 'legal'],
    descricao: 'Serviços jurídicos',
  },
  {
    id: 'ti_sistemas',
    nome: 'TI e Sistemas',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'fixa',
    keywords: ['ti', 'tecnologia', 'sistema', 'software', 'saas', 'nuvem', 'cloud', 'licenca', 'licença'],
    descricao: 'Tecnologia da informação e sistemas',
  },
  {
    id: 'manutencao',
    nome: 'Manutenção',
    categoriaPrincipal: CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    tipo: 'variavel',
    keywords: ['manutencao', 'manutenção', 'reparo', 'conserto'],
    descricao: 'Manutenção e reparos',
  },
  
  // ========== PESSOAL ==========
  {
    id: 'salarios',
    nome: 'Salários',
    categoriaPrincipal: CategoriaDespesaPrincipal.PESSOAL,
    tipo: 'fixa',
    keywords: ['salario', 'salário', 'remuneracao', 'remuneração', 'folha pagamento'],
    descricao: 'Salários e remunerações',
  },
  {
    id: 'encargos',
    nome: 'Encargos Sociais',
    categoriaPrincipal: CategoriaDespesaPrincipal.PESSOAL,
    tipo: 'fixa',
    keywords: ['encargo', 'inss', 'fgts', 'previdencia', 'previdência'],
    descricao: 'Encargos sociais e trabalhistas',
  },
  {
    id: 'beneficios',
    nome: 'Benefícios',
    categoriaPrincipal: CategoriaDespesaPrincipal.PESSOAL,
    tipo: 'fixa',
    keywords: ['beneficio', 'benefício', 'vale transporte', 'vale alimentacao', 'vale alimentação', 'plano saude', 'plano saúde'],
    descricao: 'Benefícios aos funcionários',
  },
  {
    id: 'ferias',
    nome: 'Férias',
    categoriaPrincipal: CategoriaDespesaPrincipal.PESSOAL,
    tipo: 'variavel',
    keywords: ['ferias', 'férias', '1/3 ferias', '1/3 férias'],
    descricao: 'Férias e adicional de férias',
  },
  {
    id: '13_salario',
    nome: '13º Salário',
    categoriaPrincipal: CategoriaDespesaPrincipal.PESSOAL,
    tipo: 'variavel',
    keywords: ['13', '13º', 'decimo terceiro', 'décimo terceiro'],
    descricao: '13º salário',
  },
  {
    id: 'rescisoes',
    nome: 'Rescisões',
    categoriaPrincipal: CategoriaDespesaPrincipal.PESSOAL,
    tipo: 'variavel',
    keywords: ['rescisao', 'rescisão', 'demissao', 'demissão', 'desligamento'],
    descricao: 'Verbas rescisórias',
  },
  {
    id: 'treinamento',
    nome: 'Treinamento',
    categoriaPrincipal: CategoriaDespesaPrincipal.PESSOAL,
    tipo: 'variavel',
    keywords: ['treinamento', 'capacitacao', 'capacitação', 'curso', 'workshop'],
    descricao: 'Treinamento e capacitação',
  },
  
  // ========== MARKETING ==========
  {
    id: 'marketing_digital',
    nome: 'Marketing Digital',
    categoriaPrincipal: CategoriaDespesaPrincipal.MARKETING,
    tipo: 'variavel',
    keywords: ['marketing digital', 'google ads', 'facebook ads', 'instagram ads', 'trafego pago', 'tráfego pago'],
    descricao: 'Marketing e publicidade digital',
  },
  {
    id: 'marketing_tradicional',
    nome: 'Marketing Tradicional',
    categoriaPrincipal: CategoriaDespesaPrincipal.MARKETING,
    tipo: 'variavel',
    keywords: ['marketing tradicional', 'outdoor', 'panfleto', 'radio', 'rádio', 'tv'],
    descricao: 'Marketing e publicidade tradicional',
  },
  {
    id: 'redes_sociais',
    nome: 'Redes Sociais',
    categoriaPrincipal: CategoriaDespesaPrincipal.MARKETING,
    tipo: 'variavel',
    keywords: ['redes sociais', 'social media', 'instagram', 'facebook', 'youtube'],
    descricao: 'Gestão de redes sociais',
  },
  {
    id: 'conteudo',
    nome: 'Produção de Conteúdo',
    categoriaPrincipal: CategoriaDespesaPrincipal.MARKETING,
    tipo: 'variavel',
    keywords: ['conteudo', 'conteúdo', 'design', 'criacao', 'criação', 'fotografia', 'video', 'vídeo'],
    descricao: 'Produção de conteúdo e design',
  },
  {
    id: 'eventos',
    nome: 'Eventos',
    categoriaPrincipal: CategoriaDespesaPrincipal.MARKETING,
    tipo: 'variavel',
    keywords: ['evento', 'feira', 'congresso', 'workshop', 'patrocinio', 'patrocínio'],
    descricao: 'Eventos e participações',
  },
  
  // ========== FINANCEIRAS ==========
  {
    id: 'juros',
    nome: 'Juros',
    categoriaPrincipal: CategoriaDespesaPrincipal.FINANCEIRAS,
    tipo: 'variavel',
    keywords: ['juros', 'juro', 'encargo financeiro'],
    descricao: 'Juros pagos',
  },
  {
    id: 'tarifas_bancarias',
    nome: 'Tarifas Bancárias',
    categoriaPrincipal: CategoriaDespesaPrincipal.FINANCEIRAS,
    tipo: 'fixa',
    keywords: ['tarifa bancaria', 'tarifa bancária', 'taxa bancaria', 'taxa bancária', 'banco'],
    descricao: 'Tarifas e taxas bancárias',
  },
  {
    id: 'iof',
    nome: 'IOF',
    categoriaPrincipal: CategoriaDespesaPrincipal.FINANCEIRAS,
    tipo: 'variavel',
    keywords: ['iof', 'imposto operacao', 'imposto operação'],
    descricao: 'Imposto sobre Operações Financeiras',
  },
  {
    id: 'multas_juros',
    nome: 'Multas e Juros',
    categoriaPrincipal: CategoriaDespesaPrincipal.FINANCEIRAS,
    tipo: 'variavel',
    keywords: ['multa', 'mora', 'atraso'],
    descricao: 'Multas e juros por atraso',
  },
  {
    id: 'descontos_concedidos',
    nome: 'Descontos Concedidos',
    categoriaPrincipal: CategoriaDespesaPrincipal.FINANCEIRAS,
    tipo: 'variavel',
    keywords: ['desconto concedido', 'abatimento'],
    descricao: 'Descontos financeiros concedidos',
  },
  
  // ========== TRIBUTÁRIAS ==========
  {
    id: 'simples_nacional',
    nome: 'Simples Nacional',
    categoriaPrincipal: CategoriaDespesaPrincipal.TRIBUTARIAS,
    tipo: 'variavel',
    keywords: ['simples nacional', 'das', 'darf'],
    descricao: 'Simples Nacional',
  },
  {
    id: 'impostos_municipais',
    nome: 'Impostos Municipais',
    categoriaPrincipal: CategoriaDespesaPrincipal.TRIBUTARIAS,
    tipo: 'variavel',
    keywords: ['iss', 'issqn', 'iptu'],
    descricao: 'ISS e outros impostos municipais',
  },
  {
    id: 'impostos_estaduais',
    nome: 'Impostos Estaduais',
    categoriaPrincipal: CategoriaDespesaPrincipal.TRIBUTARIAS,
    tipo: 'variavel',
    keywords: ['icms', 'ipva'],
    descricao: 'ICMS e outros impostos estaduais',
  },
  {
    id: 'impostos_federais',
    nome: 'Impostos Federais',
    categoriaPrincipal: CategoriaDespesaPrincipal.TRIBUTARIAS,
    tipo: 'variavel',
    keywords: ['pis', 'cofins', 'irpj', 'csll'],
    descricao: 'PIS, COFINS, IRPJ e outros impostos federais',
  },
  
  // ========== OPERACIONAIS ==========
  {
    id: 'combustivel',
    nome: 'Combustível',
    categoriaPrincipal: CategoriaDespesaPrincipal.OPERACIONAIS,
    tipo: 'variavel',
    keywords: ['combustivel', 'combustível', 'gasolina', 'diesel', 'etanol', 'posto'],
    descricao: 'Combustível para veículos',
  },
  {
    id: 'veiculos',
    nome: 'Veículos',
    categoriaPrincipal: CategoriaDespesaPrincipal.OPERACIONAIS,
    tipo: 'variavel',
    keywords: ['veiculo', 'veículo', 'carro', 'moto', 'manutencao veiculo', 'manutenção veículo'],
    descricao: 'Manutenção e despesas com veículos',
  },
  {
    id: 'equipamentos',
    nome: 'Equipamentos',
    categoriaPrincipal: CategoriaDespesaPrincipal.OPERACIONAIS,
    tipo: 'variavel',
    keywords: ['equipamento', 'ferramenta', 'maquina', 'máquina'],
    descricao: 'Equipamentos e ferramentas',
  },
  
  // ========== OUTRAS ==========
  {
    id: 'outras_despesas',
    nome: 'Outras Despesas',
    categoriaPrincipal: CategoriaDespesaPrincipal.OUTRAS,
    tipo: 'variavel',
    keywords: ['outra', 'diversa', 'diverso', 'varios', 'vários'],
    descricao: 'Outras despesas não classificadas',
  },
];

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Categoriza uma despesa baseado em keywords
 */
export function categorizarDespesa(descricao: string): SubcategoriaDespesa | null {
  const descricaoLower = descricao.toLowerCase();
  
  for (const subcategoria of SUBCATEGORIAS_DESPESAS) {
    const encontrou = subcategoria.keywords.some(keyword => 
      descricaoLower.includes(keyword.toLowerCase())
    );
    
    if (encontrou) {
      return subcategoria;
    }
  }
  
  return null;
}

/**
 * Obtém todas as subcategorias de uma categoria principal
 */
export function obterSubcategoriasPorCategoria(
  categoria: CategoriaDespesaPrincipal
): SubcategoriaDespesa[] {
  return SUBCATEGORIAS_DESPESAS.filter(
    sub => sub.categoriaPrincipal === categoria
  );
}

/**
 * Obtém todas as despesas fixas
 */
export function obterDespesasFixas(): SubcategoriaDespesa[] {
  return SUBCATEGORIAS_DESPESAS.filter(sub => sub.tipo === 'fixa');
}

/**
 * Obtém todas as despesas variáveis
 */
export function obterDespesasVariaveis(): SubcategoriaDespesa[] {
  return SUBCATEGORIAS_DESPESAS.filter(sub => sub.tipo === 'variavel');
}

/**
 * Verifica se uma despesa é fixa
 */
export function isDespesaFixa(idSubcategoria: string): boolean {
  const subcategoria = SUBCATEGORIAS_DESPESAS.find(sub => sub.id === idSubcategoria);
  return subcategoria?.tipo === 'fixa';
}

// ============================================================================
// MAPEAMENTO PARA DRE
// ============================================================================

export const MAPEAMENTO_DRE = {
  CUSTOS_DIRETOS: [
    CategoriaDespesaPrincipal.VENDAS,
  ],
  DESPESAS_OPERACIONAIS: [
    CategoriaDespesaPrincipal.ADMINISTRATIVAS,
    CategoriaDespesaPrincipal.PESSOAL,
    CategoriaDespesaPrincipal.MARKETING,
    CategoriaDespesaPrincipal.OPERACIONAIS,
  ],
  RESULTADO_FINANCEIRO: [
    CategoriaDespesaPrincipal.FINANCEIRAS,
  ],
  IMPOSTOS: [
    CategoriaDespesaPrincipal.TRIBUTARIAS,
  ],
} as const;

/**
 * Determina em qual seção da DRE a categoria se encaixa
 */
export function obterSecaoDRE(
  categoria: CategoriaDespesaPrincipal
): 'CUSTOS_DIRETOS' | 'DESPESAS_OPERACIONAIS' | 'RESULTADO_FINANCEIRO' | 'IMPOSTOS' | 'OUTRAS' {
  if (MAPEAMENTO_DRE.CUSTOS_DIRETOS.includes(categoria)) {
    return 'CUSTOS_DIRETOS';
  }
  if (MAPEAMENTO_DRE.DESPESAS_OPERACIONAIS.includes(categoria)) {
    return 'DESPESAS_OPERACIONAIS';
  }
  if (MAPEAMENTO_DRE.RESULTADO_FINANCEIRO.includes(categoria)) {
    return 'RESULTADO_FINANCEIRO';
  }
  if (MAPEAMENTO_DRE.IMPOSTOS.includes(categoria)) {
    return 'IMPOSTOS';
  }
  return 'OUTRAS';
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export const CategoriasDespesas = {
  categoriasPrincipais: CategoriaDespesaPrincipal,
  subcategorias: SUBCATEGORIAS_DESPESAS,
  mapeamentoDRE: MAPEAMENTO_DRE,
  
  // Funções
  categorizarDespesa,
  obterSubcategoriasPorCategoria,
  obterDespesasFixas,
  obterDespesasVariaveis,
  isDespesaFixa,
  obterSecaoDRE,
};



