/**
 * Utilitários para manipulação e formatação de datas
 */
import { format, parse, isValid, addDays, subDays, startOfMonth, endOfMonth, differenceInDays, Locale } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

/**
 * Função auxiliar para normalizar uma data
 * 
 * @param date Data a ser normalizada (string ou Date)
 * @returns Date object normalizado
 * @throws Error se a data for inválida
 */
export function normalizeDate(date: string | Date): Date {
  if (!date) throw new Error('Data inválida: nula ou vazia');
  
  // Se já for Date, retorna após validação
  if (date instanceof Date) {
    if (!isValid(date)) throw new Error(`Data inválida: ${date}`);
    return date;
  }
  
  // Se for string, converter para Date baseado no formato
  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    if (!isValid(parsedDate)) throw new Error(`Data inválida: ${date}`);
    return parsedDate;
  }
  
  // Formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    const parsedDate = parse(date, 'dd/MM/yyyy', new Date());
    if (!isValid(parsedDate)) throw new Error(`Data inválida: ${date}`);
    return parsedDate;
  }
  
  // Formato DDMMYYYY
  if (/^\d{8}$/.test(date)) {
    const parsedDate = parse(date, 'ddMMyyyy', new Date());
    if (!isValid(parsedDate)) throw new Error(`Data inválida: ${date}`);
    return parsedDate;
  }
  
  // Tentar parse genérico
  const parsedDate = new Date(date);
  if (!isValid(parsedDate)) throw new Error(`Data inválida: ${date}`);
  return parsedDate;
}

/**
 * Formata uma data usando o formato especificado
 * 
 * @param date Data a ser formatada
 * @param formatStr String de formato (padrão: dd/MM/yyyy)
 * @param options Opções adicionais (como locale)
 * @returns String formatada
 */
export function formatDate(
  date: string | Date, 
  formatStr: string = 'dd/MM/yyyy',
  options: { locale?: Locale } = { locale: ptBR }
): string {
  try {
    const dateObj = normalizeDate(date);
    return format(dateObj, formatStr, options);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
}

/**
 * Formata uma data para armazenamento no banco de dados (YYYY-MM-DD)
 */
export function formatDateForStorage(date: string | Date): string {
  return formatDate(date, 'yyyy-MM-dd');
}

/**
 * Formata uma data para exibição (DD/MM/YYYY)
 */
export function formatDateForDisplay(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy');
}

/**
 * Formata uma data no formato do Banco do Brasil (DDMMYYYY)
 */
export function formatDateAsBBFormat(date: string | Date): string {
  return formatDate(date, 'ddMMyyyy');
}

/**
 * Formata uma data com hora (DD/MM/YYYY HH:mm)
 */
export function formatDateTimeForDisplay(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Formata uma data relativa (hoje, ontem, etc)
 */
export function formatRelativeDate(date: string | Date): string {
  try {
    const dateObj = normalizeDate(date);
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    if (formatDateForStorage(dateObj) === formatDateForStorage(today)) {
      return 'Hoje';
    } else if (formatDateForStorage(dateObj) === formatDateForStorage(yesterday)) {
      return 'Ontem';
    } else {
      return formatDateForDisplay(dateObj);
    }
  } catch (error) {
    console.error('Erro ao formatar data relativa:', error);
    return '';
  }
}

/**
 * Retorna o primeiro dia do mês atual
 */
export function getFirstDayOfCurrentMonth(): Date {
  return startOfMonth(new Date());
}

/**
 * Retorna o último dia do mês atual
 */
export function getLastDayOfCurrentMonth(): Date {
  return endOfMonth(new Date());
}

/**
 * Adiciona dias a uma data
 */
export function addDaysToDate(date: string | Date, days: number): Date {
  try {
    const dateObj = normalizeDate(date);
    return addDays(dateObj, days);
  } catch (error) {
    console.error('Erro ao adicionar dias à data:', error);
    return new Date();
  }
}

/**
 * Verifica se uma data está entre duas outras datas
 */
export function isDateBetween(
  date: string | Date, 
  startDate: string | Date, 
  endDate: string | Date
): boolean {
  try {
    const dateObj = normalizeDate(date);
    const startObj = normalizeDate(startDate);
    const endObj = normalizeDate(endDate);
    
    return dateObj >= startObj && dateObj <= endObj;
  } catch (error) {
    console.error('Erro ao verificar se data está entre intervalo:', error);
    return false;
  }
}

/**
 * Calcula a diferença em dias entre duas datas
 */
export function getDaysDifference(
  startDate: string | Date, 
  endDate: string | Date
): number {
  try {
    const startObj = normalizeDate(startDate);
    const endObj = normalizeDate(endDate);
    
    return differenceInDays(endObj, startObj);
  } catch (error) {
    console.error('Erro ao calcular diferença de dias:', error);
    return 0;
  }
} 
