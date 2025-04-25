import { TransactionCategory } from './types';

/**
 * Limita uma data para que não seja no futuro
 * @param date Data a ser limitada
 * @returns A data fornecida ou a data atual, se a data fornecida for no futuro
 */
export function limitarDataFutura(date: Date): Date {
  const agora = new Date();
  
  // Se a data for maior que hoje, retornar hoje
  if (date > agora) {
    console.warn("[BB_UTILS] Data futura detectada, limitando para a data atual:", {
      dataRecebida: date.toISOString(),
      dataAtual: agora.toISOString()
    });
    return agora;
  }
  
  return date;
}

/**
 * Normaliza um intervalo de datas para consulta na API do BB
 * @param dataInicio Data de início do intervalo
 * @param dataFim Data de fim do intervalo
 * @returns Objeto com as datas normalizadas (dataInicio e dataFim)
 */
export function normalizarPeriodo(dataInicio: Date, dataFim: Date): { dataInicio: Date, dataFim: Date } {
  const agora = new Date();
  
  // Se a data de fim for no futuro, limitar para hoje
  if (dataFim > agora) {
    console.warn("[BB_UTILS] Data fim é futura, limitando para a data atual:", {
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString(),
      dataAtual: agora.toISOString()
    });
    
    dataFim = new Date(agora);
  }
  
  // Se a data de início for maior que a data de fim (pode acontecer devido à limitação acima)
  if (dataInicio > dataFim) {
    console.warn("[BB_UTILS] Data início é maior que data fim após limitação, ajustando data início:", {
      dataInicio: dataInicio.toISOString(),
      dataFim: dataFim.toISOString()
    });
    
    // Se a data de início for maior que a data de fim, usar a data de fim como início
    dataInicio = new Date(dataFim);
  }
  
  return { dataInicio, dataFim };
}

/**
 * Formata a data de acordo com os requisitos da API do BB
 * @param dateStr Data no formato YYYY-MM-DD
 * @returns Data no formato ddMMyyyy (sem zeros à esquerda para dias 1-9, conforme exigido pela API do BB)
 */
export function formatarData(dateStr: string | Date): string {
  // Se for uma instância de Date, converter diretamente
  if (dateStr instanceof Date) {
    const day = dateStr.getDate().toString(); // Sem zero à esquerda
    const month = (dateStr.getMonth() + 1).toString().padStart(2, '0');
    const year = dateStr.getFullYear().toString();
    
    return `${day}${month}${year}`;
  }
  
  // Se for uma string no formato ddMMyyyy (apenas dígitos), retorna como está
  if (typeof dateStr === 'string' && /^\d{8}$/.test(dateStr)) {
    return dateStr;
  }
  
  try {
    // Se for string no formato ISO (YYYY-MM-DD)
    if (typeof dateStr === 'string' && dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-");
      
      // Garantir que temos os componentes corretos
      if (!year || !month || !day) {
        throw new Error("Formato de data inválido");
      }
      
      // Remove o zero à esquerda do dia se for entre 01 e 09 (REQUISITO DO BB)
      const normalizedDay = day.startsWith("0") ? day.substring(1) : day;
      
      // Usar apenas os últimos 4 dígitos do ano para garantir
      const normalizedYear = year.slice(-4);
      
      return `${normalizedDay}${month}${normalizedYear}`;
    }
    
    // Caso contrário, tentar criar um objeto Date e formatar
    const date = new Date(dateStr as any);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString(); // Sem zero à esquerda
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      
      return `${day}${month}${year}`;
    }
  } catch (error) {
    console.error("[BB_FORMAT_DATE_ERROR]", error);
  }
  
  // Em caso de erro ou formato não reconhecido, usar a data atual
  console.warn("[BB_FORMAT_DATE_WARNING] Formato de data não reconhecido:", dateStr);
  console.warn("[BB_FORMAT_DATE_WARNING] Usando data atual como fallback");
  
  const now = new Date();
  const day = now.getDate().toString(); // Sem zero à esquerda
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString();
  
  return `${day}${month}${year}`;
}

/**
 * Formata a data para uso interno no banco de dados
 * @param dateStr Data no formato YYYY-MM-DD ou Date
 * @returns Data no formato ddMMyyyy (com zeros à esquerda para dias 1-9)
 */
export function formatarDataInterna(dateStr: string | Date): string {
  // Se for uma instância de Date, converter diretamente
  if (dateStr instanceof Date) {
    const day = dateStr.getDate().toString().padStart(2, '0'); // COM zero à esquerda
    const month = (dateStr.getMonth() + 1).toString().padStart(2, '0');
    const year = dateStr.getFullYear().toString();
    
    return `${day}${month}${year}`;
  }
  
  try {
    // Se for string no formato ISO (YYYY-MM-DD)
    if (typeof dateStr === 'string' && dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-");
      
      // Garantir que temos os componentes corretos
      if (!year || !month || !day) {
        throw new Error("Formato de data inválido");
      }
      
      // Garantir que o dia tem zero à esquerda quando necessário
      const normalizedDay = day.padStart(2, '0');
      
      // Usar apenas os últimos 4 dígitos do ano para garantir
      const normalizedYear = year.slice(-4);
      
      return `${normalizedDay}${month}${normalizedYear}`;
    }
    
    // Se for uma string no formato ddMMyyyy (apenas dígitos)
    if (typeof dateStr === 'string' && /^\d{8}$/.test(dateStr)) {
      // Verificar se o primeiro caractere é um dígito entre 1-9
      if (/^[1-9]\d{7}$/.test(dateStr)) {
        // Adicionar o zero à esquerda
        return `0${dateStr}`;
      }
      return dateStr; // Já tem o formato correto
    }
    
    // Se for um número (formatado como DMMMAAAA) com apenas 7 dígitos
    if (typeof dateStr === 'string' && /^\d{7}$/.test(dateStr)) {
      // Adicionar o zero à esquerda
      return `0${dateStr}`;
    }
    
    // Caso contrário, tentar criar um objeto Date e formatar
    const date = new Date(dateStr as any);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, '0'); // COM zero à esquerda
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      
      return `${day}${month}${year}`;
    }
  } catch (error) {
    console.error("[FORMAT_DATE_INTERNAL_ERROR]", error);
  }
  
  // Em caso de erro ou formato não reconhecido, usar a data atual
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0'); // COM zero à esquerda
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString();
  
  return `${day}${month}${year}`;
}

/**
 * Parse avançado de datas do formato do Banco do Brasil
 * @param dataStr Data no formato DDMMYYYY ou número
 * @returns Objeto Date
 */
export function parseBBDate(dataStr: string | number): Date {
  // Converter para string se for número
  const dateStr = dataStr.toString();
  
  // Garantir que tenha 8 dígitos (formato DDMMAAAA)
  let formattedDateStr = dateStr;
  if (dateStr.length === 7) {
    formattedDateStr = '0' + dateStr;
  } else if (dateStr.length !== 8) {
    console.warn(`[BB_DATE_PARSE] Formato de data inválido: ${dateStr}, deve ter 7 ou 8 dígitos`);
    return new Date(); // Retorna data atual em caso de erro
  }
  
  try {
    // Extrair dia, mês e ano
    const day = parseInt(formattedDateStr.substring(0, 2));
    const month = parseInt(formattedDateStr.substring(2, 4)) - 1; // Meses em JS são 0-11
    const year = parseInt(formattedDateStr.substring(4, 8));
    
    // Verificar se temos componentes válidos
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error(`Componentes de data inválidos: dia=${day}, mês=${month+1}, ano=${year}`);
    }
    
    // Verificar se os componentes estão dentro dos limites razoáveis
    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2020 || year > 2050) {
      console.warn(`[BB_DATE_PARSE] Componentes de data fora dos limites: dia=${day}, mês=${month+1}, ano=${year}`);
      return new Date();
    }
    
    return new Date(year, month, day);
  } catch (error) {
    console.error(`[BB_DATE_PARSE] Erro ao processar data: ${dateStr}`, error);
    return new Date();
  }
}

/**
 * Converte um número de data do BB (DDMMAAAA) para o formato ISO YYYY-MM-DD
 */
export function bbDateToIsoDate(dateNumber: number | string): string {
  try {
    const date = parseBBDate(dateNumber);
    return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  } catch (error) {
    console.error(`[BB_DATE_TO_ISO] Erro ao converter data: ${dateNumber}`, error);
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Mapeia a categoria de uma transação com base na descrição
 * @param description Descrição da transação
 * @returns Categoria da transação
 */
export function mapTransactionCategory(description: string): TransactionCategory {
  if (!description) return "OTHER";
  
  const lowerDesc = description.toLowerCase();
  
  // Mapeamento de palavras-chave para categorias
  if (lowerDesc.includes("aluguel") || lowerDesc.includes("imovel") || 
      lowerDesc.includes("condominio") || lowerDesc.includes("casa")) {
    return "HOUSING";
  }
  
  if (lowerDesc.includes("uber") || lowerDesc.includes("99 taxi") || 
      lowerDesc.includes("taxi") || lowerDesc.includes("transporte") || 
      lowerDesc.includes("combustivel") || lowerDesc.includes("gasolina")) {
    return "TRANSPORTATION";
  }
  
  if (lowerDesc.includes("restaurante") || lowerDesc.includes("refeicao") || 
      lowerDesc.includes("supermercado") || lowerDesc.includes("mercado") || 
      lowerDesc.includes("ifood") || lowerDesc.includes("comida")) {
    return "FOOD";
  }
  
  if (lowerDesc.includes("cinema") || lowerDesc.includes("show") || 
      lowerDesc.includes("teatro") || lowerDesc.includes("ingresso") || 
      lowerDesc.includes("netflix") || lowerDesc.includes("spotify")) {
    return "ENTERTAINMENT";
  }
  
  if (lowerDesc.includes("medico") || lowerDesc.includes("hospital") || 
      lowerDesc.includes("farmacia") || lowerDesc.includes("consulta") || 
      lowerDesc.includes("exame") || lowerDesc.includes("saude")) {
    return "HEALTH";
  }
  
  if (lowerDesc.includes("luz") || lowerDesc.includes("agua") || 
      lowerDesc.includes("gas") || lowerDesc.includes("internet") || 
      lowerDesc.includes("telefone") || lowerDesc.includes("celular")) {
    return "UTILITY";
  }
  
  if (lowerDesc.includes("salario") || lowerDesc.includes("pagamento") || 
      lowerDesc.includes("remuneracao") || lowerDesc.includes("pro labore") || 
      lowerDesc.includes("rescisao")) {
    return "SALARY";
  }
  
  if (lowerDesc.includes("escola") || lowerDesc.includes("curso") || 
      lowerDesc.includes("faculdade") || lowerDesc.includes("universidade") || 
      lowerDesc.includes("livro") || lowerDesc.includes("material")) {
    return "EDUCATION";
  }
  
  // Categoria padrão
  return "OTHER";
} 