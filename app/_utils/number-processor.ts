/**
 * Utilitários para processamento de números e cálculos financeiros
 * Garante consistência nos cálculos em toda a aplicação
 */

/**
 * Arredonda um número para 2 casas decimais com precisão
 * Evita problemas de ponto flutuante comuns em JavaScript
 * @param value Valor a ser arredondado
 * @returns Valor arredondado com precisão de 2 casas decimais
 */
export function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Converte string para número com segurança
 * @param value String ou número a ser convertido
 * @returns Número convertido ou 0 se inválido
 */
export function parseValueSafe(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    // Remove espaços e substitui vírgula por ponto
    const cleanValue = value.trim().replace(',', '.');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * Soma uma lista de valores com precisão
 * @param values Array de valores (string ou number)
 * @returns Soma total com precisão de 2 casas decimais
 */
export function sumWithPrecision(values: (string | number | null | undefined)[]): number {
  const sum = values.reduce((total, value) => {
    return total + parseValueSafe(value);
  }, 0);
  
  return roundToCents(sum);
}

/**
 * Calcula percentual com segurança
 * @param value Valor atual
 * @param total Valor total
 * @returns Percentual calculado ou 0 se total for 0
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return roundToCents((value / total) * 100);
}

/**
 * Calcula variação percentual entre dois valores
 * @param current Valor atual
 * @param previous Valor anterior
 * @returns Variação percentual ou 0 se valor anterior for 0
 */
export function calculateVariation(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return roundToCents(((current - previous) / previous) * 100);
}

/**
 * Formata valor monetário para exibição
 * @param value Valor a ser formatado
 * @param currency Moeda (padrão: 'BRL')
 * @returns String formatada como moeda
 */
export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Valida se um valor é um número válido para cálculos financeiros
 * @param value Valor a ser validado
 * @returns true se o valor é válido
 */
export function isValidFinancialValue(value: any): boolean {
  const parsed = parseValueSafe(value);
  return !isNaN(parsed) && isFinite(parsed);
}