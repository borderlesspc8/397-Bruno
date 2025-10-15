/**
 * Função para gerar um hash para strings, útil para criar identificadores estáveis
 * 
 * @param str A string para gerar o hash
 * @returns Uma string representando o hash
 */
export function hashString(str: string): string {
  // Implementação simples de hash para strings
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converter para 32bit integer
  }
  
  return Math.abs(hash).toString().padStart(8, '0');
} 
