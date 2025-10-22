/**
 * 📅 CEO DASHBOARD - DATE HELPERS
 * 
 * Funções utilitárias para manipulação de datas
 */

import { format, parse, startOfMonth, endOfMonth, subMonths, addMonths, differenceInDays, differenceInMonths, isAfter, isBefore, isWithinInterval, eachMonthOfInterval, startOfYear, endOfYear, getMonth, getYear, startOfQuarter, endOfQuarter, addDays, subDays, getQuarter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// FORMATAÇÃO DE DATAS
// ============================================================================

/**
 * Formata data para string no formato YYYY-MM
 */
export function formatarPeriodoMensal(date: Date): string {
  return format(date, 'yyyy-MM');
}

/**
 * Formata data para string no formato YYYY-MM-DD
 */
export function formatarData(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Formata data para exibição (ex: "Jan 2024")
 */
export function formatarDataExibicao(date: Date): string {
  return format(date, 'MMM yyyy', { locale: ptBR });
}

/**
 * Formata data para exibição completa (ex: "15 de Janeiro de 2024")
 */
export function formatarDataCompleta(date: Date): string {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Formata data para exibição curta (ex: "15/01/2024")
 */
export function formatarDataCurta(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

/**
 * Retorna o nome do mês
 */
export function obterNomeMes(mesNumero: number): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mesNumero - 1] || '';
}

/**
 * Retorna o nome curto do mês
 */
export function obterNomeMesCurto(mesNumero: number): string {
  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return meses[mesNumero - 1] || '';
}

/**
 * Retorna o nome do trimestre
 */
export function obterNomeTrimestre(trimestre: number): string {
  return `${trimestre}º Trimestre`;
}

// ============================================================================
// PARSING DE DATAS
// ============================================================================

/**
 * Parse de string YYYY-MM para Date
 */
export function parsePeriodoMensal(periodo: string): Date {
  return parse(periodo, 'yyyy-MM', new Date());
}

/**
 * Parse de string YYYY-MM-DD para Date
 */
export function parseData(data: string): Date {
  return parse(data, 'yyyy-MM-dd', new Date());
}

// ============================================================================
// MANIPULAÇÃO DE PERÍODOS
// ============================================================================

/**
 * Retorna o início e fim do mês de uma data
 */
export function obterInicioFimMes(date: Date): { inicio: Date; fim: Date } {
  return {
    inicio: startOfMonth(date),
    fim: endOfMonth(date)
  };
}

/**
 * Retorna o início e fim do ano de uma data
 */
export function obterInicioFimAno(date: Date): { inicio: Date; fim: Date } {
  return {
    inicio: startOfYear(date),
    fim: endOfYear(date)
  };
}

/**
 * Retorna o início e fim do trimestre de uma data
 */
export function obterInicioFimTrimestre(date: Date): { inicio: Date; fim: Date } {
  return {
    inicio: startOfQuarter(date),
    fim: endOfQuarter(date)
  };
}

/**
 * Retorna o mês anterior
 */
export function obterMesAnterior(date: Date): Date {
  return subMonths(date, 1);
}

/**
 * Retorna o mesmo mês do ano anterior
 */
export function obterMesmoMesAnoAnterior(date: Date): Date {
  return subMonths(date, 12);
}

/**
 * Retorna o próximo mês
 */
export function obterProximoMes(date: Date): Date {
  return addMonths(date, 1);
}

/**
 * Retorna array de meses entre duas datas
 */
export function obterMesesEntre(dataInicio: Date, dataFim: Date): Date[] {
  return eachMonthOfInterval({ start: dataInicio, end: dataFim });
}

/**
 * Retorna array de períodos (YYYY-MM) entre duas datas
 */
export function obterPeriodosEntre(dataInicio: Date, dataFim: Date): string[] {
  const meses = obterMesesEntre(dataInicio, dataFim);
  return meses.map(mes => formatarPeriodoMensal(mes));
}

// ============================================================================
// CÁLCULOS COM DATAS
// ============================================================================

/**
 * Calcula a diferença em dias entre duas datas
 */
export function calcularDiferencaDias(dataInicio: Date, dataFim: Date): number {
  return differenceInDays(dataFim, dataInicio);
}

/**
 * Calcula a diferença em meses entre duas datas
 */
export function calcularDiferencaMeses(dataInicio: Date, dataFim: Date): number {
  return differenceInMonths(dataFim, dataInicio);
}

/**
 * Calcula o número de dias em um período
 */
export function calcularDiasPeriodo(dataInicio: Date, dataFim: Date): number {
  return calcularDiferencaDias(dataInicio, dataFim) + 1;
}

/**
 * Calcula o número de dias do mês
 */
export function calcularDiasMes(date: Date): number {
  const { inicio, fim } = obterInicioFimMes(date);
  return calcularDiasPeriodo(inicio, fim);
}

/**
 * Calcula o número de dias decorridos no mês
 */
export function calcularDiasDecorridosMes(date: Date, dataAtual: Date = new Date()): number {
  const inicio = startOfMonth(date);
  const fim = isBefore(dataAtual, endOfMonth(date)) ? dataAtual : endOfMonth(date);
  return calcularDiasPeriodo(inicio, fim);
}

/**
 * Calcula o percentual de dias decorridos no mês
 */
export function calcularPercentualDiasDecorridos(date: Date, dataAtual: Date = new Date()): number {
  const diasDecorridos = calcularDiasDecorridosMes(date, dataAtual);
  const diasTotais = calcularDiasMes(date);
  return (diasDecorridos / diasTotais) * 100;
}

/**
 * Calcula o número de dias úteis (estimado - sem considerar feriados)
 */
export function calcularDiasUteis(dataInicio: Date, dataFim: Date): number {
  const totalDias = calcularDiasPeriodo(dataInicio, dataFim);
  const diasUteis = Math.floor((totalDias / 7) * 5); // Aproximação: 5 dias úteis por semana
  return diasUteis;
}

// ============================================================================
// VALIDAÇÕES E COMPARAÇÕES
// ============================================================================

/**
 * Verifica se uma data está no passado
 */
export function estaNoPassado(date: Date): boolean {
  return isBefore(date, new Date());
}

/**
 * Verifica se uma data está no futuro
 */
export function estaNoFuturo(date: Date): boolean {
  return isAfter(date, new Date());
}

/**
 * Verifica se uma data está entre duas outras
 */
export function estaEntre(date: Date, inicio: Date, fim: Date): boolean {
  return isWithinInterval(date, { start: inicio, end: fim });
}

/**
 * Verifica se a data está vencida
 */
export function estaVencida(dataVencimento: Date, dataAtual: Date = new Date()): boolean {
  return isBefore(dataVencimento, dataAtual);
}

/**
 * Calcula dias de atraso
 */
export function calcularDiasAtraso(dataVencimento: Date, dataAtual: Date = new Date()): number {
  if (!estaVencida(dataVencimento, dataAtual)) {
    return 0;
  }
  return calcularDiferencaDias(dataVencimento, dataAtual);
}

// ============================================================================
// INFORMAÇÕES DE DATA
// ============================================================================

/**
 * Extrai mês e ano de uma data
 */
export function extrairMesAno(date: Date): { mes: number; ano: number } {
  return {
    mes: getMonth(date) + 1, // getMonth retorna 0-11
    ano: getYear(date)
  };
}

/**
 * Extrai trimestre de uma data
 */
export function extrairTrimestre(date: Date): number {
  return getQuarter(date);
}

/**
 * Cria data a partir de mês e ano
 */
export function criarDataMesAno(mes: number, ano: number): Date {
  return new Date(ano, mes - 1, 1);
}

// ============================================================================
// PERÍODOS COMPARATIVOS
// ============================================================================

export interface PeriodoComparativo {
  atual: {
    inicio: Date;
    fim: Date;
  };
  anterior: {
    inicio: Date;
    fim: Date;
  };
}

/**
 * Cria período comparativo (mês atual vs mês anterior)
 */
export function criarPeriodoComparativoMensal(dataReferencia: Date = new Date()): PeriodoComparativo {
  const mesAtual = obterInicioFimMes(dataReferencia);
  const dataAnterior = obterMesAnterior(dataReferencia);
  const mesAnterior = obterInicioFimMes(dataAnterior);

  return {
    atual: mesAtual,
    anterior: mesAnterior
  };
}

/**
 * Cria período comparativo (mês atual vs mesmo mês ano anterior)
 */
export function criarPeriodoComparativoAnual(dataReferencia: Date = new Date()): PeriodoComparativo {
  const mesAtual = obterInicioFimMes(dataReferencia);
  const dataAnoAnterior = obterMesmoMesAnoAnterior(dataReferencia);
  const mesAnoAnterior = obterInicioFimMes(dataAnoAnterior);

  return {
    atual: mesAtual,
    anterior: mesAnoAnterior
  };
}

/**
 * Cria período comparativo customizado
 */
export function criarPeriodoComparativoCustomizado(
  dataInicio: Date,
  dataFim: Date
): PeriodoComparativo {
  const diasPeriodo = calcularDiferencaDias(dataInicio, dataFim);
  
  const anteriorFim = subDays(dataInicio, 1);
  const anteriorInicio = subDays(anteriorFim, diasPeriodo);

  return {
    atual: {
      inicio: dataInicio,
      fim: dataFim
    },
    anterior: {
      inicio: anteriorInicio,
      fim: anteriorFim
    }
  };
}

// ============================================================================
// RANGES E INTERVALOS
// ============================================================================

/**
 * Obtém últimos N meses
 */
export function obterUltimosNMeses(n: number, dataReferencia: Date = new Date()): Date[] {
  const meses: Date[] = [];
  for (let i = 0; i < n; i++) {
    meses.unshift(subMonths(dataReferencia, i));
  }
  return meses;
}

/**
 * Obtém últimos N meses como períodos (YYYY-MM)
 */
export function obterUltimosNMesesPeriodos(n: number, dataReferencia: Date = new Date()): string[] {
  const meses = obterUltimosNMeses(n, dataReferencia);
  return meses.map(mes => formatarPeriodoMensal(mes));
}

/**
 * Obtém próximos N meses
 */
export function obterProximosNMeses(n: number, dataReferencia: Date = new Date()): Date[] {
  const meses: Date[] = [];
  for (let i = 1; i <= n; i++) {
    meses.push(addMonths(dataReferencia, i));
  }
  return meses;
}

/**
 * Obtém ano completo (todos os meses)
 */
export function obterMesesAno(ano: number): Date[] {
  const meses: Date[] = [];
  for (let mes = 1; mes <= 12; mes++) {
    meses.push(criarDataMesAno(mes, ano));
  }
  return meses;
}

// ============================================================================
// HELPERS ESPECÍFICOS PARA CEO DASHBOARD
// ============================================================================

/**
 * Verifica se o período é o mês atual
 */
export function ehMesAtual(periodo: string): boolean {
  const periodoAtual = formatarPeriodoMensal(new Date());
  return periodo === periodoAtual;
}

/**
 * Verifica se o período é o ano atual
 */
export function ehAnoAtual(ano: number): boolean {
  return ano === getYear(new Date());
}

/**
 * Calcula idade de um registro em dias
 */
export function calcularIdadeDias(dataRegistro: Date, dataAtual: Date = new Date()): number {
  return calcularDiferencaDias(dataRegistro, dataAtual);
}

/**
 * Determina a faixa de aging
 */
export function determinarFaixaAging(diasAtraso: number): string {
  if (diasAtraso <= 0) return 'Em dia';
  if (diasAtraso <= 30) return '0-30 dias';
  if (diasAtraso <= 60) return '31-60 dias';
  if (diasAtraso <= 90) return '61-90 dias';
  return '90+ dias';
}

/**
 * Calcula próxima data de vencimento
 */
export function calcularProximoVencimento(dataBase: Date, diasVencimento: number): Date {
  return addDays(dataBase, diasVencimento);
}

// ============================================================================
// EXPORT DEFAULT (HELPER OBJECT)
// ============================================================================

export const DateHelpers = {
  // Formatação
  formatarPeriodoMensal,
  formatarData,
  formatarDataExibicao,
  formatarDataCompleta,
  formatarDataCurta,
  obterNomeMes,
  obterNomeMesCurto,
  obterNomeTrimestre,
  
  // Parsing
  parsePeriodoMensal,
  parseData,
  
  // Manipulação
  obterInicioFimMes,
  obterInicioFimAno,
  obterInicioFimTrimestre,
  obterMesAnterior,
  obterMesmoMesAnoAnterior,
  obterProximoMes,
  obterMesesEntre,
  obterPeriodosEntre,
  
  // Cálculos
  calcularDiferencaDias,
  calcularDiferencaMeses,
  calcularDiasPeriodo,
  calcularDiasMes,
  calcularDiasDecorridosMes,
  calcularPercentualDiasDecorridos,
  calcularDiasUteis,
  
  // Validações
  estaNoPassado,
  estaNoFuturo,
  estaEntre,
  estaVencida,
  calcularDiasAtraso,
  
  // Informações
  extrairMesAno,
  extrairTrimestre,
  criarDataMesAno,
  
  // Períodos
  criarPeriodoComparativoMensal,
  criarPeriodoComparativoAnual,
  criarPeriodoComparativoCustomizado,
  
  // Ranges
  obterUltimosNMeses,
  obterUltimosNMesesPeriodos,
  obterProximosNMeses,
  obterMesesAno,
  
  // Específicos
  ehMesAtual,
  ehAnoAtual,
  calcularIdadeDias,
  determinarFaixaAging,
  calcularProximoVencimento,
};



