/**
 * 🎨 CEO DASHBOARD - CORES PARA GRÁFICOS
 * 
 * Paleta de cores consistente para todos os gráficos
 */

// ============================================================================
// CORES PRINCIPAIS
// ============================================================================

export const CORES_PRIMARIAS = {
  azul: '#3b82f6',      // blue-500
  verde: '#10b981',     // green-500
  vermelho: '#ef4444',  // red-500
  amarelo: '#f59e0b',   // amber-500
  roxo: '#8b5cf6',      // purple-500
  rosa: '#ec4899',      // pink-500
  indigo: '#6366f1',    // indigo-500
  teal: '#14b8a6',      // teal-500
  laranja: '#f97316',   // orange-500
  ciano: '#06b6d4',     // cyan-500
} as const;

// ============================================================================
// CORES POR CATEGORIA
// ============================================================================

export const CORES_FINANCEIRAS = {
  receita: '#10b981',           // verde
  receitaBruta: '#10b981',
  receitaLiquida: '#059669',
  
  custo: '#ef4444',             // vermelho
  custoFixo: '#dc2626',
  custoVariavel: '#f87171',
  cmv: '#ef4444',
  
  despesa: '#f59e0b',           // amarelo
  despesaOperacional: '#f59e0b',
  despesaVendas: '#fb923c',
  despesaAdmin: '#fbbf24',
  
  lucro: '#8b5cf6',             // roxo
  lucroBruto: '#a78bfa',
  lucroOperacional: '#8b5cf6',
  lucroLiquido: '#7c3aed',
  
  impostos: '#6b7280',          // cinza
  
  margemBruta: '#14b8a6',       // teal
  margemLiquida: '#0d9488',
} as const;

export const CORES_CRESCIMENTO = {
  crescente: '#10b981',         // verde
  acelerado: '#059669',
  moderado: '#10b981',
  lento: '#34d399',
  
  decrescente: '#ef4444',       // vermelho
  negativo: '#dc2626',
  
  estavel: '#6b7280',           // cinza
} as const;

export const CORES_STATUS = {
  excelente: '#10b981',         // verde
  bom: '#3b82f6',               // azul
  adequado: '#14b8a6',          // teal
  atencao: '#f59e0b',           // amarelo
  critico: '#ef4444',           // vermelho
  
  // Status de metas
  atingido: '#10b981',
  superado: '#8b5cf6',          // roxo
  noPrazo: '#3b82f6',
  aceleradoMeta: '#059669',
  atrasado: '#ef4444',
  naoAtingido: '#6b7280',
  pausado: '#9ca3af',
  
  // Status geral
  ativo: '#10b981',
  inativo: '#6b7280',
  pendente: '#f59e0b',
  concluido: '#8b5cf6',
} as const;

export const CORES_TENDENCIA = {
  alta: '#10b981',              // verde
  baixa: '#ef4444',             // vermelho
  estavel: '#6b7280',           // cinza
  
  melhorando: '#10b981',
  piorando: '#ef4444',
  neutro: '#6b7280',
} as const;

export const CORES_ALERTA = {
  sucesso: '#10b981',           // verde
  info: '#3b82f6',              // azul
  atencao: '#f59e0b',           // amarelo
  critico: '#ef4444',           // vermelho
  erro: '#dc2626',              // vermelho escuro
} as const;

// ============================================================================
// GRADIENTES
// ============================================================================

export const GRADIENTES = {
  receita: ['#10b981', '#059669'],      // verde
  custo: ['#ef4444', '#dc2626'],        // vermelho
  lucro: ['#8b5cf6', '#7c3aed'],        // roxo
  neutro: ['#3b82f6', '#2563eb'],       // azul
  alerta: ['#f59e0b', '#d97706'],       // amarelo
} as const;

// ============================================================================
// PALETAS PARA MÚLTIPLAS SÉRIES
// ============================================================================

export const PALETA_PADRAO = [
  '#3b82f6',  // azul
  '#10b981',  // verde
  '#f59e0b',  // amarelo
  '#8b5cf6',  // roxo
  '#ef4444',  // vermelho
  '#14b8a6',  // teal
  '#ec4899',  // rosa
  '#f97316',  // laranja
  '#6366f1',  // indigo
  '#06b6d4',  // ciano
] as const;

export const PALETA_QUENTE = [
  '#ef4444',  // vermelho
  '#f97316',  // laranja
  '#f59e0b',  // amarelo
  '#eab308',  // yellow
  '#fbbf24',  // amber
] as const;

export const PALETA_FRIA = [
  '#3b82f6',  // azul
  '#06b6d4',  // ciano
  '#14b8a6',  // teal
  '#10b981',  // verde
  '#6366f1',  // indigo
] as const;

export const PALETA_NEUTRA = [
  '#1f2937',  // gray-800
  '#374151',  // gray-700
  '#4b5563',  // gray-600
  '#6b7280',  // gray-500
  '#9ca3af',  // gray-400
] as const;

export const PALETA_PASTEL = [
  '#93c5fd',  // blue-300
  '#86efac',  // green-300
  '#fcd34d',  // yellow-300
  '#c4b5fd',  // purple-300
  '#fca5a5',  // red-300
] as const;

// ============================================================================
// CORES ESPECÍFICAS POR TIPO DE GRÁFICO
// ============================================================================

export const CORES_DRE = {
  receitaBruta: '#10b981',
  impostos: '#6b7280',
  receitaLiquida: '#059669',
  cmv: '#ef4444',
  margemBruta: '#14b8a6',
  despesasOperacionais: '#f59e0b',
  lucroOperacional: '#8b5cf6',
  resultadoFinanceiro: '#3b82f6',
  lucroLiquido: '#7c3aed',
} as const;

export const CORES_SAZONALIDADE = {
  vendas: '#3b82f6',
  receitas: '#10b981',
  custos: '#ef4444',
  lucro: '#8b5cf6',
  margem: '#f59e0b',
} as const;

export const CORES_AGING = {
  '0-30': '#10b981',        // verde - baixo risco
  '31-60': '#3b82f6',       // azul - médio risco
  '61-90': '#f59e0b',       // amarelo - alto risco
  '90+': '#ef4444',         // vermelho - crítico
} as const;

export const CORES_METAS = {
  meta: '#9ca3af',          // cinza - linha da meta
  realizado: '#10b981',     // verde - valor realizado
  projecao: '#3b82f6',      // azul - projeção
  esperado: '#fbbf24',      // amarelo - esperado
} as const;

// ============================================================================
// CORES DE FUNDO (BACKGROUNDS)
// ============================================================================

export const FUNDOS = {
  excelente: 'bg-green-50',
  bom: 'bg-blue-50',
  atencao: 'bg-yellow-50',
  critico: 'bg-red-50',
  neutro: 'bg-gray-50',
  
  // Hovers
  excelente_hover: 'bg-green-100',
  bom_hover: 'bg-blue-100',
  atencao_hover: 'bg-yellow-100',
  critico_hover: 'bg-red-100',
  neutro_hover: 'bg-gray-100',
} as const;

// ============================================================================
// CORES DE TEXTO
// ============================================================================

export const TEXTOS = {
  excelente: 'text-green-800',
  bom: 'text-blue-800',
  atencao: 'text-yellow-800',
  critico: 'text-red-800',
  neutro: 'text-gray-800',
  
  // Variações
  excelente_claro: 'text-green-600',
  bom_claro: 'text-blue-600',
  atencao_claro: 'text-yellow-600',
  critico_claro: 'text-red-600',
  neutro_claro: 'text-gray-600',
} as const;

// ============================================================================
// CORES DE BORDA
// ============================================================================

export const BORDAS = {
  excelente: 'border-green-500',
  bom: 'border-blue-500',
  atencao: 'border-yellow-500',
  critico: 'border-red-500',
  neutro: 'border-gray-500',
} as const;

// ============================================================================
// CORES PARA HEATMAP
// ============================================================================

export const CORES_HEATMAP = {
  min: '#fee2e2',           // red-100
  baixo: '#fef3c7',         // yellow-100
  medio: '#dbeafe',         // blue-100
  alto: '#d1fae5',          // green-100
  max: '#059669',           // green-600
} as const;

export const ESCALA_HEATMAP = [
  '#fee2e2',  // 0-20%
  '#fef3c7',  // 20-40%
  '#dbeafe',  // 40-60%
  '#d1fae5',  // 60-80%
  '#10b981',  // 80-100%
  '#059669',  // 100%+
] as const;

// ============================================================================
// OPACIDADES
// ============================================================================

export const OPACIDADES = {
  total: 1.0,
  alta: 0.8,
  media: 0.6,
  baixa: 0.4,
  muito_baixa: 0.2,
} as const;

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Obtém cor por status
 */
export function obterCorPorStatus(
  status: 'excelente' | 'bom' | 'adequado' | 'atencao' | 'critico'
): string {
  return CORES_STATUS[status];
}

/**
 * Obtém cor por tendência
 */
export function obterCorPorTendencia(
  tendencia: 'alta' | 'baixa' | 'estavel'
): string {
  return CORES_TENDENCIA[tendencia];
}

/**
 * Obtém cor por crescimento
 */
export function obterCorPorCrescimento(percentual: number): string {
  if (percentual >= 20) return CORES_CRESCIMENTO.acelerado;
  if (percentual >= 10) return CORES_CRESCIMENTO.moderado;
  if (percentual >= 0) return CORES_CRESCIMENTO.lento;
  return CORES_CRESCIMENTO.negativo;
}

/**
 * Obtém cor da paleta padrão por índice
 */
export function obterCorPaleta(indice: number): string {
  return PALETA_PADRAO[indice % PALETA_PADRAO.length];
}

/**
 * Obtém cor para heatmap baseado em percentual
 */
export function obterCorHeatmap(percentual: number): string {
  if (percentual < 20) return ESCALA_HEATMAP[0];
  if (percentual < 40) return ESCALA_HEATMAP[1];
  if (percentual < 60) return ESCALA_HEATMAP[2];
  if (percentual < 80) return ESCALA_HEATMAP[3];
  if (percentual < 100) return ESCALA_HEATMAP[4];
  return ESCALA_HEATMAP[5];
}

/**
 * Adiciona opacidade a uma cor hex
 */
export function adicionarOpacidade(corHex: string, opacidade: number): string {
  // Converter hex para RGB
  const r = parseInt(corHex.slice(1, 3), 16);
  const g = parseInt(corHex.slice(3, 5), 16);
  const b = parseInt(corHex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacidade})`;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export const Cores = {
  primarias: CORES_PRIMARIAS,
  financeiras: CORES_FINANCEIRAS,
  crescimento: CORES_CRESCIMENTO,
  status: CORES_STATUS,
  tendencia: CORES_TENDENCIA,
  alerta: CORES_ALERTA,
  gradientes: GRADIENTES,
  paletas: {
    padrao: PALETA_PADRAO,
    quente: PALETA_QUENTE,
    fria: PALETA_FRIA,
    neutra: PALETA_NEUTRA,
    pastel: PALETA_PASTEL,
  },
  especificas: {
    dre: CORES_DRE,
    sazonalidade: CORES_SAZONALIDADE,
    aging: CORES_AGING,
    metas: CORES_METAS,
  },
  heatmap: {
    cores: CORES_HEATMAP,
    escala: ESCALA_HEATMAP,
  },
  fundos: FUNDOS,
  textos: TEXTOS,
  bordas: BORDAS,
  opacidades: OPACIDADES,
  
  // Funções
  obterCorPorStatus,
  obterCorPorTendencia,
  obterCorPorCrescimento,
  obterCorPaleta,
  obterCorHeatmap,
  adicionarOpacidade,
};


