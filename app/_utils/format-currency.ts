interface FormatCurrencyOptions {
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Formata um valor como moeda (padrão BRL)
 * @param value Valor a ser formatado
 * @param options Opções de formatação
 * @returns String formatada em moeda
 */
export function formatCurrency(
  value: number | null | undefined,
  options: FormatCurrencyOptions = {}
): string {
  // Valor padrão se for nulo ou indefinido
  const amount = value ?? 0;
  
  const {
    notation = 'standard',
    currency = 'BRL',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    notation,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
} 
