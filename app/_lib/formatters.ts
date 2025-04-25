/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
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