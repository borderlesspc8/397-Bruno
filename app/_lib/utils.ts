import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina classes CSS do Tailwind de forma segura
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um número para exibição como moeda brasileira (R$)
 * @param number Valor a ser formatado
 * @returns String formatada no padrão monetário brasileiro
 */
export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency
  }).format(value);
}

/**
 * Converte uma string monetária formatada para um número
 * @param currencyString String formatada com símbolos monetários
 * @returns Número representando o valor
 */
export function parseCurrencyToNumber(currencyString: string): number {
  // Remove todos os caracteres não numéricos (exceto ponto e vírgula)
  const cleanString = currencyString.replace(/[^0-9.,]/g, '');
  
  // Substitui vírgula por ponto para cálculos
  const normalized = cleanString
    .replace(/\./g, '') // Remove pontos (separadores de milhar)
    .replace(',', '.'); // Substitui vírgula por ponto (decimal)
  
  // Converte para número
  return parseFloat(normalized || '0');
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
