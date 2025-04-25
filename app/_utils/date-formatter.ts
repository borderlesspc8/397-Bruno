/**
 * Utilitários para formatação de datas
 */

/**
 * Formata uma data para armazenamento no banco de dados
 * @param date Data a ser formatada, pode ser string ou Date
 * @returns Data formatada como YYYY-MM-DD
 */
export function formatDateForStorage(date: string | Date): string {
  if (!date) return '';

  let dateObj: Date;
  
  // Se for uma string, converter para Date
  if (typeof date === 'string') {
    // Se já estiver no formato YYYY-MM-DD, retornar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Verificar se está no formato DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const parts = date.split('/');
      dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      // Tentar converter diretamente
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Data inválida: ${date}`);
  }
  
  // Formatar como YYYY-MM-DD
  return dateObj.toISOString().split('T')[0];
}

/**
 * Formata uma data para exibição amigável
 * @param date Data a ser formatada, pode ser string ou Date
 * @returns Data formatada como DD/MM/YYYY
 */
export function formatDateForDisplay(date: string | Date): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  // Se for uma string, converter para Date
  if (typeof date === 'string') {
    // Se já estiver no formato DD/MM/YYYY, retornar diretamente
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }
    
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Data inválida: ${date}`);
  }
  
  // Formatar como DD/MM/YYYY
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data no formato do Banco do Brasil (DDMMYYYY)
 * @param date Data a ser formatada, pode ser string ou Date
 * @returns Data formatada como DDMMYYYY
 */
export function formatDateAsBBFormat(date: string | Date): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  // Se for uma string, converter para Date
  if (typeof date === 'string') {
    // Se já estiver no formato YYYY-MM-DD, converter para Date
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      dateObj = new Date(date);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      // Se estiver no formato DD/MM/YYYY, converter para Date
      const parts = date.split('/');
      dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      // Tentar converter diretamente
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  // Verificar se a data é válida
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Data inválida: ${date}`);
  }
  
  // Formatar como DDMMYYYY
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}${month}${year}`;
} 