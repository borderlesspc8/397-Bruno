import { TransactionProcessor } from './transaction-processor';
import { getBankStatement } from './bank-api-service';
import { storeRawStatement } from './bank-statement-storage';

interface ImportOptions {
  userId: string;
  walletId?: string;
  startDate: string;
  endDate: string;
}

interface ImportResult {
  totalProcessed: number;
  skipped: number;
  errors: number;
  startDate: string;
  endDate: string;
}

/**
 * Importa transações bancárias do Banco do Brasil
 */
export async function importBankTransactions(
  apiResponse: any,
  options: ImportOptions
): Promise<ImportResult> {
  console.log(`Iniciando importação de transações para o período ${options.startDate} a ${options.endDate}`);

  try {
    // Validar resposta da API
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error('Resposta da API inválida');
    }

    // Armazenar resposta bruta
    await storeRawStatement(options.startDate, options.endDate, apiResponse);

    // Extrair transações da resposta
    let bankData = [];
    if (Array.isArray(apiResponse)) {
      bankData = apiResponse;
    } else if (apiResponse.listaLancamento && Array.isArray(apiResponse.listaLancamento)) {
      bankData = apiResponse.listaLancamento;
    } else if (apiResponse.data && Array.isArray(apiResponse.data)) {
      bankData = apiResponse.data;
    } else {
      throw new Error('Formato de resposta da API não reconhecido');
    }

    // Processar transações usando o novo processador
    const result = await TransactionProcessor.processTransactions(
      bankData,
      options.userId,
      options.walletId
    );

    return {
      totalProcessed: result.processed,
      skipped: result.skipped,
      errors: result.errors,
      startDate: options.startDate,
      endDate: options.endDate
    };
  } catch (error: any) {
    console.error('Erro na importação de transações:', error);
    throw new Error(`Falha ao importar transações: ${error.message}`);
  }
}

/**
 * Busca dados da API do banco
 */
export async function fetchBankData(startDate: string, endDate: string): Promise<any> {
  try {
    return await getBankStatement(startDate, endDate);
  } catch (error: any) {
    console.error('Erro ao buscar dados bancários:', error);
    throw new Error(`Falha ao buscar dados bancários: ${error.message}`);
  }
} 