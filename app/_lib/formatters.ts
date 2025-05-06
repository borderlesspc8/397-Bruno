/**
 * Utilitários para formatação de valores numéricos, datas e textos
 */

/**
 * Formata um valor numérico como moeda (R$)
 * @param value Valor numérico a ser formatado
 * @param options Opções de formatação
 * @returns String formatada como moeda
 */
export function formatCurrency(
  value: number, 
  options?: { 
    currency?: string; 
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    currency = 'BRL',
    locale = 'pt-BR',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options || {};

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
}

/**
 * Formata um valor numérico com separadores de milhar
 * @param value Valor numérico a ser formatado
 * @param options Opções de formatação
 * @returns String formatada com separadores de milhar
 */
export function formatNumber(
  value: number,
  options?: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    locale = 'pt-BR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options || {};

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
}

/**
 * Formata um valor numérico como porcentagem
 * @param value Valor numérico a ser formatado (0.1 para 10%)
 * @param options Opções de formatação
 * @returns String formatada como porcentagem
 */
export function formatPercent(
  value: number,
  options?: {
    locale?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const {
    locale = 'pt-BR',
    minimumFractionDigits = 1,
    maximumFractionDigits = 1
  } = options || {};

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value / 100);
}

/**
 * Formata um número para exibição compacta (ex: 1.2k para 1200)
 * @param value Valor numérico a ser formatado
 * @param locale Localidade para formatação
 * @returns String formatada de forma compacta
 */
export function formatCompactNumber(value: number, locale: string = 'pt-BR'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR').format(dateObj);
}

/**
 * Formata uma string de entrada em formato de moeda enquanto o usuário digita
 */
export function formatCurrencyInput(value: string): string {
  // Remove tudo que não é número
  const numericValue = value.replace(/\D/g, '');
  
  // Converte para centavos
  const cents = parseInt(numericValue || '0', 10);
  
  // Divide por 100 para obter o valor real
  const realValue = cents / 100;
  
  // Formata como moeda
  return formatCurrency(realValue);
}

/**
 * Converte uma string formatada como moeda para um número
 */
export function currencyStringToNumber(currencyString: string): number {
  // Remove todos os caracteres que não são dígitos ou ponto decimal
  const numericString = currencyString.replace(/[^\d,.-]/g, '').replace(',', '.');
  
  // Converte para número
  return parseFloat(numericString) || 0;
}

/**
 * Formata um número como percentagem
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Retorna a cor para um valor de percentagem com base em limites
 */
export function getPercentageColor(percentage: number): string {
  if (percentage >= 90) {
    return 'text-red-600';
  } else if (percentage >= 75) {
    return 'text-amber-600';
  } else if (percentage >= 50) {
    return 'text-blue-600';
  } else {
    return 'text-green-600';
  }
} 