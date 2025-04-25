/**
 * Utilidades específicas para a integração com o Gestão Click
 */

import { format } from 'date-fns';

/**
 * Formata uma data para o formato esperado pela API do Gestão Click
 * @param date Data a ser formatada
 * @returns String no formato YYYY-MM-DD
 */
export function formatGestaoClickDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Formata um valor monetário para o formato esperado pela API do Gestão Click
 * @param value Valor monetário
 * @returns String formatada
 */
export function formatGestaoClickCurrency(value: number): string {
  return value.toFixed(2);
}

/**
 * Constrói uma URL com parâmetros para o Gestão Click
 * @param baseUrl URL base
 * @param path Caminho do endpoint
 * @param params Parâmetros de query
 * @returns URL formatada
 */
export function buildGestaoClickUrl(
  baseUrl: string, 
  path: string, 
  params: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
  
  // Adiciona apenas parâmetros que não sejam undefined
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Extrai dados do Gestão Click de formato de resposta complexo
 * @param response Resposta da API
 * @returns Objeto com dados extraídos
 */
export function extractGestaoClickData<T>(response: any): T[] {
  if (!response) return [];
  
  // Tenta extrair dados de diferentes formatos de resposta
  if (Array.isArray(response)) {
    return response as T[];
  }
  
  if (response.data && Array.isArray(response.data)) {
    return response.data as T[];
  }
  
  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return [response.data as T];
  }
  
  return [];
}

/**
 * Valida se o token de acesso está presente e no formato correto
 * @param token Token de acesso
 * @returns true se válido, false caso contrário
 */
export function isValidAccessToken(token: string | undefined): boolean {
  if (!token) return false;
  return token.length >= 20; // Critério simples para validação
} 