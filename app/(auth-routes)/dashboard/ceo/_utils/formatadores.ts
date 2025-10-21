/**
 * 🎨 CEO DASHBOARD - FORMATADORES
 * 
 * Funções para formatação de valores, datas e textos
 */

// ============================================================================
// FORMATAÇÃO DE MOEDA
// ============================================================================

/**
 * Formata valor em Real brasileiro (R$)
 */
export function formatarMoeda(valor: number, opcoes?: {
  exibirSimbolo?: boolean;
  casasDecimais?: number;
  compacto?: boolean;
}): string {
  const {
    exibirSimbolo = true,
    casasDecimais = 2,
    compacto = false
  } = opcoes || {};
  
  if (compacto) {
    return formatarMoedaCompacta(valor, exibirSimbolo);
  }
  
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: exibirSimbolo ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });
  
  return formatter.format(valor);
}

/**
 * Formata valor em moeda compacta (ex: R$ 1,5M)
 */
export function formatarMoedaCompacta(valor: number, exibirSimbolo: boolean = true): string {
  const simbolo = exibirSimbolo ? 'R$ ' : '';
  const absValor = Math.abs(valor);
  const sinal = valor < 0 ? '-' : '';
  
  if (absValor >= 1_000_000_000) {
    return `${sinal}${simbolo}${(absValor / 1_000_000_000).toFixed(1)}B`;
  }
  
  if (absValor >= 1_000_000) {
    return `${sinal}${simbolo}${(absValor / 1_000_000).toFixed(1)}M`;
  }
  
  if (absValor >= 1_000) {
    return `${sinal}${simbolo}${(absValor / 1_000).toFixed(1)}K`;
  }
  
  return `${sinal}${simbolo}${absValor.toFixed(2)}`;
}

// ============================================================================
// FORMATAÇÃO DE NÚMEROS
// ============================================================================

/**
 * Formata número com separadores de milhar
 */
export function formatarNumero(valor: number, casasDecimais: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  }).format(valor);
}

/**
 * Formata número compacto (ex: 1,5M)
 */
export function formatarNumeroCompacto(valor: number): string {
  const absValor = Math.abs(valor);
  const sinal = valor < 0 ? '-' : '';
  
  if (absValor >= 1_000_000_000) {
    return `${sinal}${(absValor / 1_000_000_000).toFixed(1)}B`;
  }
  
  if (absValor >= 1_000_000) {
    return `${sinal}${(absValor / 1_000_000).toFixed(1)}M`;
  }
  
  if (absValor >= 1_000) {
    return `${sinal}${(absValor / 1_000).toFixed(1)}K`;
  }
  
  return `${sinal}${absValor.toFixed(0)}`;
}

/**
 * Formata número ordinal (1º, 2º, 3º...)
 */
export function formatarNumeroOrdinal(valor: number): string {
  return `${valor}º`;
}

// ============================================================================
// FORMATAÇÃO DE PERCENTUAIS
// ============================================================================

/**
 * Formata percentual
 */
export function formatarPercentual(valor: number, casasDecimais: number = 1): string {
  return `${valor.toFixed(casasDecimais)}%`;
}

/**
 * Formata percentual com sinal (+/-)
 */
export function formatarPercentualComSinal(valor: number, casasDecimais: number = 1): string {
  const sinal = valor > 0 ? '+' : '';
  return `${sinal}${valor.toFixed(casasDecimais)}%`;
}

/**
 * Formata variação percentual com cor
 */
export function formatarVariacaoPercentual(valor: number): {
  texto: string;
  cor: 'green' | 'red' | 'gray';
} {
  const sinal = valor > 0 ? '+' : '';
  const texto = `${sinal}${valor.toFixed(1)}%`;
  
  let cor: 'green' | 'red' | 'gray';
  if (valor > 0) {
    cor = 'green';
  } else if (valor < 0) {
    cor = 'red';
  } else {
    cor = 'gray';
  }
  
  return { texto, cor };
}

// ============================================================================
// FORMATAÇÃO DE DATAS (Complementar ao date-helpers)
// ============================================================================

/**
 * Formata período YYYY-MM para exibição
 */
export function formatarPeriodo(periodo: string): string {
  const [ano, mes] = periodo.split('-');
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return `${meses[parseInt(mes) - 1]}/${ano}`;
}

/**
 * Formata período completo
 */
export function formatarPeriodoCompleto(periodo: string): string {
  const [ano, mes] = periodo.split('-');
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${meses[parseInt(mes) - 1]} de ${ano}`;
}

/**
 * Formata range de datas
 */
export function formatarRangeDatas(dataInicio: string, dataFim: string): string {
  return `${dataInicio} a ${dataFim}`;
}

// ============================================================================
// FORMATAÇÃO DE TEMPO
// ============================================================================

/**
 * Formata quantidade de dias
 */
export function formatarDias(dias: number): string {
  if (dias === 0) return 'hoje';
  if (dias === 1) return '1 dia';
  return `${dias} dias`;
}

/**
 * Formata quantidade de meses
 */
export function formatarMeses(meses: number): string {
  if (meses === 0) return 'este mês';
  if (meses === 1) return '1 mês';
  if (meses < 12) return `${meses} meses`;
  
  const anos = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  
  if (mesesRestantes === 0) {
    return anos === 1 ? '1 ano' : `${anos} anos`;
  }
  
  return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`;
}

/**
 * Formata tempo relativo (ex: "há 3 dias")
 */
export function formatarTempoRelativo(dias: number): string {
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  if (dias < 365) return `há ${Math.floor(dias / 30)} meses`;
  return `há ${Math.floor(dias / 365)} anos`;
}

// ============================================================================
// FORMATAÇÃO DE STATUS E BADGES
// ============================================================================

/**
 * Formata status financeiro
 */
export function formatarStatusFinanceiro(
  status: 'excelente' | 'bom' | 'atencao' | 'critico'
): {
  texto: string;
  cor: string;
  corTexto: string;
} {
  const map = {
    excelente: {
      texto: 'Excelente',
      cor: 'bg-green-100',
      corTexto: 'text-green-800',
    },
    bom: {
      texto: 'Bom',
      cor: 'bg-blue-100',
      corTexto: 'text-blue-800',
    },
    atencao: {
      texto: 'Atenção',
      cor: 'bg-yellow-100',
      corTexto: 'text-yellow-800',
    },
    critico: {
      texto: 'Crítico',
      cor: 'bg-red-100',
      corTexto: 'text-red-800',
    },
  };
  
  return map[status];
}

/**
 * Formata status de meta
 */
export function formatarStatusMeta(
  status: 'no_prazo' | 'acelerado' | 'atrasado' | 'atingido' | 'superado' | 'nao_atingido' | 'pausado'
): {
  texto: string;
  cor: string;
  corTexto: string;
} {
  const map = {
    no_prazo: {
      texto: 'No Prazo',
      cor: 'bg-blue-100',
      corTexto: 'text-blue-800',
    },
    acelerado: {
      texto: 'Acelerado',
      cor: 'bg-green-100',
      corTexto: 'text-green-800',
    },
    atrasado: {
      texto: 'Atrasado',
      cor: 'bg-red-100',
      corTexto: 'text-red-800',
    },
    atingido: {
      texto: 'Atingido',
      cor: 'bg-green-100',
      corTexto: 'text-green-800',
    },
    superado: {
      texto: 'Superado',
      cor: 'bg-purple-100',
      corTexto: 'text-purple-800',
    },
    nao_atingido: {
      texto: 'Não Atingido',
      cor: 'bg-gray-100',
      corTexto: 'text-gray-800',
    },
    pausado: {
      texto: 'Pausado',
      cor: 'bg-gray-100',
      corTexto: 'text-gray-800',
    },
  };
  
  return map[status];
}

/**
 * Formata tendência
 */
export function formatarTendencia(
  tendencia: 'alta' | 'baixa' | 'estavel'
): {
  texto: string;
  icone: string;
  cor: string;
} {
  const map = {
    alta: {
      texto: 'Alta',
      icone: '↑',
      cor: 'text-green-600',
    },
    baixa: {
      texto: 'Baixa',
      icone: '↓',
      cor: 'text-red-600',
    },
    estavel: {
      texto: 'Estável',
      icone: '→',
      cor: 'text-gray-600',
    },
  };
  
  return map[tendencia];
}

// ============================================================================
// FORMATAÇÃO DE TEXTOS
// ============================================================================

/**
 * Capitaliza primeira letra
 */
export function capitalizarPrimeiraLetra(texto: string): string {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Formata nome próprio (primeira letra de cada palavra maiúscula)
 */
export function formatarNomeProprio(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palavra => capitalizarPrimeiraLetra(palavra))
    .join(' ');
}

/**
 * Trunca texto com reticências
 */
export function truncarTexto(texto: string, maxLength: number): string {
  if (!texto || texto.length <= maxLength) return texto;
  return texto.slice(0, maxLength) + '...';
}

/**
 * Formata CPF
 */
export function formatarCPF(cpf: string): string {
  if (!cpf) return '';
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 */
export function formatarCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  const numeros = cnpj.replace(/\D/g, '');
  return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone
 */
export function formatarTelefone(telefone: string): string {
  if (!telefone) return '';
  const numeros = telefone.replace(/\D/g, '');
  
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return telefone;
}

// ============================================================================
// FORMATAÇÃO ESPECIAL
// ============================================================================

/**
 * Formata valor com unidade
 */
export function formatarValorComUnidade(
  valor: number,
  unidade: 'currency' | 'percentage' | 'number' | 'days'
): string {
  switch (unidade) {
    case 'currency':
      return formatarMoeda(valor);
    case 'percentage':
      return formatarPercentual(valor);
    case 'number':
      return formatarNumero(valor);
    case 'days':
      return formatarDias(valor);
    default:
      return valor.toString();
  }
}

/**
 * Formata faixa de valores
 */
export function formatarFaixaValores(min: number, max: number, unidade: string = 'R$'): string {
  return `${unidade} ${formatarNumero(min)} - ${unidade} ${formatarNumero(max)}`;
}

/**
 * Formata score (0-100)
 */
export function formatarScore(score: number): string {
  return `${Math.round(score)}/100`;
}

/**
 * Formata índice (ex: 1.5x)
 */
export function formatarIndice(indice: number): string {
  return `${indice.toFixed(2)}x`;
}

// ============================================================================
// FORMATAÇÃO DE LISTAS
// ============================================================================

/**
 * Formata lista de itens
 */
export function formatarLista(itens: string[]): string {
  if (itens.length === 0) return '';
  if (itens.length === 1) return itens[0];
  if (itens.length === 2) return `${itens[0]} e ${itens[1]}`;
  
  const ultimoItem = itens[itens.length - 1];
  const outrosItens = itens.slice(0, -1).join(', ');
  return `${outrosItens} e ${ultimoItem}`;
}

/**
 * Formata quantidade de itens
 */
export function formatarQuantidadeItens(quantidade: number, singular: string, plural: string): string {
  if (quantidade === 0) return `Nenhum ${singular}`;
  if (quantidade === 1) return `1 ${singular}`;
  return `${quantidade} ${plural}`;
}

// ============================================================================
// FORMATAÇÃO PARA GRÁFICOS
// ============================================================================

/**
 * Formata label para tooltip de gráfico
 */
export function formatarTooltipGrafico(
  label: string,
  valor: number,
  tipo: 'moeda' | 'numero' | 'percentual' = 'moeda'
): string {
  let valorFormatado: string;
  
  switch (tipo) {
    case 'moeda':
      valorFormatado = formatarMoeda(valor);
      break;
    case 'percentual':
      valorFormatado = formatarPercentual(valor);
      break;
    default:
      valorFormatado = formatarNumero(valor);
  }
  
  return `${label}: ${valorFormatado}`;
}

/**
 * Formata label de eixo para gráfico compacto
 */
export function formatarLabelEixo(valor: number, tipo: 'moeda' | 'numero' | 'percentual' = 'moeda'): string {
  switch (tipo) {
    case 'moeda':
      return formatarMoedaCompacta(valor, false);
    case 'percentual':
      return formatarPercentual(valor, 0);
    default:
      return formatarNumeroCompacto(valor);
  }
}

// ============================================================================
// EXPORT DEFAULT (HELPER OBJECT)
// ============================================================================

export const Formatadores = {
  // Moeda
  formatarMoeda,
  formatarMoedaCompacta,
  
  // Números
  formatarNumero,
  formatarNumeroCompacto,
  formatarNumeroOrdinal,
  
  // Percentuais
  formatarPercentual,
  formatarPercentualComSinal,
  formatarVariacaoPercentual,
  
  // Datas
  formatarPeriodo,
  formatarPeriodoCompleto,
  formatarRangeDatas,
  
  // Tempo
  formatarDias,
  formatarMeses,
  formatarTempoRelativo,
  
  // Status
  formatarStatusFinanceiro,
  formatarStatusMeta,
  formatarTendencia,
  
  // Textos
  capitalizarPrimeiraLetra,
  formatarNomeProprio,
  truncarTexto,
  formatarCPF,
  formatarCNPJ,
  formatarTelefone,
  
  // Especial
  formatarValorComUnidade,
  formatarFaixaValores,
  formatarScore,
  formatarIndice,
  
  // Listas
  formatarLista,
  formatarQuantidadeItens,
  
  // Gráficos
  formatarTooltipGrafico,
  formatarLabelEixo,
};


