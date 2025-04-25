/**
 * Utilitários para formatação de valores
 */

/**
 * Formata um valor numérico como moeda no formato brasileiro (R$)
 * @param value Valor numérico a ser formatado
 * @param options Opções adicionais de formatação
 * @returns String formatada como moeda
 */
export function formatCurrency(value: number | string, options?: Intl.NumberFormatOptions): string {
  // Converter para número se for string
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Se não for um número válido, retorna 0 formatado
  if (isNaN(numericValue)) {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      ...options
    }).format(0);
  }
  
  // Formatar o valor conforme moeda brasileira
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    ...options
  }).format(numericValue);
}

/**
 * Formata um valor como percentual
 * @param value Valor numérico ou string a ser formatado
 * @param decimals Número de casas decimais
 * @returns String formatada como percentual
 */
export function formatPercent(value: number | string, decimals: number = 2): string {
  // Se for uma string não numérica (ex: 'N/A'), retornar a própria string
  if (typeof value === 'string' && isNaN(parseFloat(value))) {
    return value;
  }

  // Converter para número se for string numérica
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Se não for um número válido após a conversão, retornar 'N/A'
  if (isNaN(numericValue)) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numericValue / 100);
}

/**
 * Formata um número com separadores de milhar
 * @param value Valor a ser formatado
 * @param decimals Número de casas decimais
 * @returns String com o número formatado
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formata um número decimal com precisão específica
 * @param value Valor a ser formatado
 * @param precision Número de casas decimais
 * @returns String formatada
 */
export function formatDecimal(value: number | string, precision: number = 2): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return '0';
  }
  
  return numericValue.toFixed(precision);
}

/**
 * Formata um número como CPF (000.000.000-00)
 * @param value CPF a ser formatado
 * @returns String formatada como CPF
 */
export function formatCPF(value: string): string {
  // Remover caracteres não numéricos
  const numericOnly = value.replace(/\D/g, '');
  
  // Aplicar máscara
  return numericOnly
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
}

/**
 * Formata um número como CNPJ (00.000.000/0000-00)
 * @param value CNPJ a ser formatado
 * @returns String formatada como CNPJ
 */
export function formatCNPJ(value: string): string {
  // Remover caracteres não numéricos
  const numericOnly = value.replace(/\D/g, '');
  
  // Aplicar máscara
  return numericOnly
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
}

/**
 * Formata um número como telefone ((XX) XXXXX-XXXX)
 * @param value Telefone a ser formatado
 * @returns String formatada como telefone
 */
export function formatPhone(value: string): string {
  // Remover caracteres não numéricos
  const numericOnly = value.replace(/\D/g, '');
  
  // Aplicar máscara com DDD
  if (numericOnly.length <= 10) {
    return numericOnly
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14);
  }
  
  // Aplicar máscara para celular (com nono dígito)
  return numericOnly
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns String com a data formatada
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString('pt-BR');
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
} 