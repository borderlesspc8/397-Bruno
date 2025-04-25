/**
 * Renderiza um valor de forma segura, convertendo em string
 * e tratando valores null, undefined ou objetos complexos
 * @param value Valor a ser renderizado de forma segura
 * @returns String representando o valor de forma segura para exibição
 */
export function renderSafe(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return value.toLocaleDateString('pt-BR');
    }
    
    return String(value);
  }
  
  return String(value);
}

/**
 * Trunca um texto para o tamanho especificado, adicionando "..." quando necessário
 * @param text Texto a ser truncado
 * @param maxLength Tamanho máximo antes de truncar
 * @returns Texto truncado com elipses ou o texto original se for menor que maxLength
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Formata um texto para iniciar com letra maiúscula
 * @param text Texto a ser formatado
 * @returns Texto com a primeira letra em maiúsculo
 */
export function capitalizeFirstLetter(text: string): string {
  if (!text) return '';
  
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
} 