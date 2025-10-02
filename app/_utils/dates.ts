import { parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Interface para resultado do processamento de datas
 */
interface DateParsingResult {
  success: boolean;
  dataInicio?: Date;
  dataFim?: Date;
  error?: string;
}

/**
 * Processa strings de datas vindas dos parâmetros da URL
 * Tenta diferentes formatos de data para aumentar a compatibilidade 
 * @param dataInicioStr Data inicial como string
 * @param dataFimStr Data final como string
 * @returns Objeto com resultado do processamento
 */
export function processarDatasURL(
  dataInicioStr: string | null, 
  dataFimStr: string | null
): DateParsingResult {
  // Verificar se ambos os parâmetros foram fornecidos
  if (!dataInicioStr || !dataFimStr) {
    return {
      success: false,
      error: 'Os parâmetros dataInicio e dataFim são obrigatórios'
    };
  }

  try {
    // Tentar primeiro no formato ISO
    let dataInicioObj = new Date(dataInicioStr);
    let dataFimObj = new Date(dataFimStr);
    
    // Verificar se as datas são válidas
    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      // Tentar no formato dd/MM/yyyy que pode vir da UI
      dataInicioObj = parse(dataInicioStr, 'dd/MM/yyyy', new Date(), { locale: ptBR });
      dataFimObj = parse(dataFimStr, 'dd/MM/yyyy', new Date(), { locale: ptBR });
      
      // Verificar novamente se as datas são válidas
      if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
        console.error('Falha ao processar datas após tentativa de formato dd/MM/yyyy');
        return {
          success: false,
          error: 'Formato de data inválido. Use o formato ISO ou dd/MM/yyyy'
        };
      }
    }
    
    // Ajustar as datas para incluir todo o período
    // Data inicial começa à meia-noite
    dataInicioObj.setUTCHours(0, 0, 0, 0);
    // Data final termina no último milissegundo do dia
    dataFimObj.setUTCHours(23, 59, 59, 999);
    
    return {
      success: true,
      dataInicio: dataInicioObj,
      dataFim: dataFimObj
    };
  } catch (error) {
    console.error('Erro ao processar datas:', error);
    return {
      success: false,
      error: 'Erro ao processar as datas fornecidas'
    };
  }
} 