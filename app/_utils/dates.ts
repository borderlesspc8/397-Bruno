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
    let dataInicioObj: Date;
    let dataFimObj: Date;
    
    // Verificar se é formato ISO (contém 'T' ou termina com 'Z')
    if (dataInicioStr.includes('T') || dataInicioStr.endsWith('Z')) {
      // Formato ISO - usar diretamente
      dataInicioObj = new Date(dataInicioStr);
      dataFimObj = new Date(dataFimStr);
    } else if (dataInicioStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Formato YYYY-MM-DD - criar datas locais para evitar conversão UTC
      const [anoInicio, mesInicio, diaInicio] = dataInicioStr.split('-').map(Number);
      const [anoFim, mesFim, diaFim] = dataFimStr.split('-').map(Number);
      
      dataInicioObj = new Date(anoInicio, mesInicio - 1, diaInicio, 0, 0, 0, 0);
      dataFimObj = new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59, 999);
    } else {
      // Formato dd/MM/yyyy - usar parse com locale brasileiro
      dataInicioObj = parse(dataInicioStr, 'dd/MM/yyyy', new Date(), { locale: ptBR });
      dataFimObj = parse(dataFimStr, 'dd/MM/yyyy', new Date(), { locale: ptBR });
      
      // Ajustar para início e fim do dia
      dataInicioObj.setHours(0, 0, 0, 0);
      dataFimObj.setHours(23, 59, 59, 999);
    }
    
    // Verificar se as datas são válidas
    if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
      console.error('Falha ao processar datas:', { dataInicioStr, dataFimStr });
      return {
        success: false,
        error: 'Formato de data inválido. Use o formato ISO ou dd/MM/yyyy'
      };
    }
    
    // Log para debug
    console.log('🔍 [processarDatasURL] Datas processadas:', {
      dataInicioOriginal: dataInicioStr,
      dataFimOriginal: dataFimStr,
      dataInicioProcessada: dataInicioObj.toISOString(),
      dataFimProcessada: dataFimObj.toISOString(),
      dataInicioFormatada: dataInicioObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      dataFimFormatada: dataFimObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    });
    
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