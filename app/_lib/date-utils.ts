/**
 * Funções utilitárias para manipulação de datas
 */

type SyncFrequency = 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'MANUAL';

/**
 * Calcula as datas de início e fim para importação com base na frequência
 * @param frequency Frequência de sincronização
 * @returns Objeto com datas de início e fim para importação
 */
export function calculateImportDates(frequency: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();
  
  switch (frequency) {
    case 'HOURLY':
      // Última hora
      startDate.setHours(endDate.getHours() - 1);
      break;
    case 'DAILY':
      // Último dia
      startDate.setDate(endDate.getDate() - 1);
      break;
    case 'WEEKLY':
      // Última semana
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'MONTHLY':
      // Último mês
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'MANUAL':
    default:
      // Padrão: últimos 30 dias
      startDate.setDate(endDate.getDate() - 30);
  }
  
  // Ajustar hora inicial para meia-noite e hora final para final do dia
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Formata uma data para o formato local brasileiro (DD/MM/YYYY)
 * @param date Data a ser formatada
 * @returns String formatada
 */
export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data para o formato local brasileiro com hora (DD/MM/YYYY HH:MM)
 * @param date Data a ser formatada
 * @returns String formatada
 */
export function formatDateTimeBR(date: Date): string {
  return date.toLocaleDateString('pt-BR') + ' ' + 
         date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Calcula a próxima data de execução com base na frequência
 * @param frequency Frequência de sincronização
 * @returns Data da próxima execução
 */
export function calculateNextRunDate(frequency: string): Date {
  const now = new Date();
  const nextRun = new Date(now);
  
  switch (frequency) {
    case 'HOURLY':
      nextRun.setHours(now.getHours() + 1);
      break;
    case 'DAILY':
      nextRun.setDate(now.getDate() + 1);
      nextRun.setHours(3, 0, 0, 0); // Executar às 3h da manhã
      break;
    case 'WEEKLY':
      nextRun.setDate(now.getDate() + 7);
      nextRun.setHours(3, 0, 0, 0); // Executar às 3h da manhã
      break;
    case 'MONTHLY':
      nextRun.setMonth(now.getMonth() + 1);
      nextRun.setDate(1); // Primeiro dia do mês
      nextRun.setHours(3, 0, 0, 0); // Executar às 3h da manhã
      break;
    default:
      nextRun.setDate(now.getDate() + 1);
      nextRun.setHours(3, 0, 0, 0); // Executar às 3h da manhã (padrão diário)
  }
  
  return nextRun;
} 
