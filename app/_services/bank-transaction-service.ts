import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  shouldHideTransaction as shouldHideTransactionUtil, 
  determinarTipoTransacao,
  getTransactionName
} from "../_utils/transaction-utils";
import { prisma } from "../_lib/prisma";
import { TransactionTypes, TransactionType } from "../_constants/transaction-types";
import { TransactionPaymentMethod } from "../_lib/types";

// TransactionCategory ainda é usado, mas como um tipo string simples
export type TransactionCategory = string;

// Exportamos a versão do utilitário para compatibilidade com código existente
export const shouldHideTransaction = shouldHideTransactionUtil;

// Tipo para os metadados de transações bancárias
export interface BankTransactionMetadata {
  source: string;
  indicadorTipoLancamento?: string;
  dataLancamento?: number;
  dataMovimento?: number;
  codigoAgenciaOrigem?: number;
  numeroLote?: number;
  numeroDocumento?: number;
  codigoHistorico?: number;
  textoDescricaoHistorico?: string;
  valorLancamento?: number;
  indicadorSinalLancamento?: string;
  textoInformacaoComplementar?: string;
  numeroCpfCnpjContrapartida?: number;
  indicadorTipoPessoaContrapartida?: string;
  codigoBancoContrapartida?: number;
  codigoAgenciaContrapartida?: number;
  numeroContaContrapartida?: string;
  textoDvContaContrapartida?: string;
  isSaldoTransaction?: boolean;
  rawTransaction?: any;
  isDebit?: boolean;
  numeroCpfCnpjMascarado?: string;
  [key: string]: any;
}

// Interface para transações bancárias
export interface BankTransaction {
  id?: string;
  date: Date;
  name: string;
  amount: number;
  type: TransactionType;
  category?: TransactionCategory;
  paymentMethod?: TransactionPaymentMethod;
  wallet?: {
    id: string;
    name: string;
  } | null;
  metadata?: BankTransactionMetadata;
}

/**
 * Formata uma data do formato do Banco do Brasil (DDMMYYYY) para um objeto Date
 */
function formatBBDate(dateNumber: number): Date {
  if (!dateNumber) return new Date();
  
  // Converter para string e garantir que tenha 8 dígitos
  let dateStr = dateNumber.toString();
  if (dateStr.length === 7) {
    // Adicionar zero à esquerda para dias 1-9
    dateStr = '0' + dateStr;
  } else if (dateStr.length !== 8) {
    console.error(`[BB_EXTRACT_DATE] Formato de data inválido: ${dateStr}, deve ter 7 ou 8 dígitos`);
    return new Date();
  }
  
  try {
    // Extrair componentes da data
    const dia = parseInt(dateStr.slice(0, 2));
    const mes = parseInt(dateStr.slice(2, 4));
    const ano = parseInt(dateStr.slice(4, 8));
    
    // Verificar se são válidos
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
      console.error(`[BB_EXTRACT_DATE] Componentes de data inválidos: dia=${dia}, mês=${mes}, ano=${ano}`);
      return new Date();
    }
    
    // Verificar limites razoáveis
    if (dia < 1 || dia > 31 || mes < 1 || mes > 12 || ano < 2020 || ano > 2050) {
      console.error(`[BB_EXTRACT_DATE] Valores de data fora dos limites razoáveis: dia=${dia}, mês=${mes}, ano=${ano}`);
      return new Date();
    }
    
    // Criar objeto de data
    return new Date(ano, mes - 1, dia);
  } catch (error) {
    console.error(`[BB_EXTRACT_DATE] Erro ao processar data: ${dateStr}`, error);
    return new Date();
  }
}

// Mapeamento de códigos históricos para categorias adequadas
const CATEGORIA_POR_CODIGO_HISTORICO: Record<number, TransactionCategory> = {
  144: "PIX",
  435: "UTILITY",
  830: "DEPOSIT",
  976: "BANK_TRANSFER",
  999: "OTHER",
};

// Mapeamento de descrições para categorias
const CATEGORIA_POR_DESCRICAO: Record<string, TransactionCategory> = {
  "PIX ENVIADO": "PIX",
  "PIX RECEBIDO": "PIX",
  "PIX - ENVIADO": "PIX",
  "PIX - RECEBIDO": "PIX",
  "SALDO ANTERIOR": "OTHER",
  "SALDO DO DIA": "OTHER",
  "S A L D O": "OTHER",
  "TARIFA": "UTILITY",
  "TARIFA PACOTE": "UTILITY",
  "TED-CRÉDITO EM CONTA": "BANK_TRANSFER",
  "TED RECEBIDO": "BANK_TRANSFER",
  "TED ENVIADO": "BANK_TRANSFER",
  "DEP DINHEIRO": "DEPOSIT",
  "DEPÓSITO EM DINHEIRO": "DEPOSIT",
  "DEP DINHEIRO INTER AG": "DEPOSIT",
};

/**
 * Determina a categoria com base no código histórico e descrição
 * @param codigoHistorico Código histórico da transação
 * @param descricao Descrição da transação
 * @returns Categoria adequada
 */
function determinarCategoria(codigoHistorico: number, descricao: string): TransactionCategory {
  // Primeiro tenta encontrar pelo código histórico
  if (codigoHistorico && CATEGORIA_POR_CODIGO_HISTORICO[codigoHistorico]) {
    return CATEGORIA_POR_CODIGO_HISTORICO[codigoHistorico];
  }
  
  // Se não encontrar pelo código, tenta pela descrição
  const descricaoUpper = descricao.toUpperCase();
  
  for (const [chave, categoria] of Object.entries(CATEGORIA_POR_DESCRICAO)) {
    if (descricaoUpper.includes(chave)) {
      return categoria;
    }
  }
  
  // Caso não encontre em nenhum dos mapeamentos
  return "OTHER";
}

/**
 * Mascara CPF/CNPJ para proteção de dados
 * @param numero CPF ou CNPJ a ser mascarado
 * @returns Versão mascarada do documento
 */
function mascaraCpfCnpj(numero: number | string): string {
  if (!numero) return "";
  
  const numeroStr = numero.toString();
  
  // CPF
  if (numeroStr.length <= 11) {
    return `***.***.${numeroStr.slice(-5, -2)}-${numeroStr.slice(-2)}`;
  } 
  // CNPJ
  else {
    return `**.${numeroStr.slice(-13, -10)}.${numeroStr.slice(-10, -7)}/${numeroStr.slice(-7, -3)}-**`;
  }
}

/**
 * Processa transações bancárias a partir dos dados brutos da API
 */
export function processBankTransactions(bankData: any[], walletId?: string): BankTransaction[] {
  if (!bankData || !Array.isArray(bankData)) {
    console.error("Dados bancários inválidos:", bankData);
    return [];
  }
  
  console.log(`Processando ${bankData.length} lançamentos bancários`);
  const processedTransactions: BankTransaction[] = [];
  
  for (const rawTransaction of bankData) {
    try {
      // Extrair campos essenciais necessários para exibição e processamento
      const textoDescricaoHistorico = rawTransaction.textoDescricaoHistorico || "Lançamento Bancário";
      const valorLancamento = rawTransaction.valorLancamento || 0;
      const indicadorSinalLancamento = rawTransaction.indicadorSinalLancamento;
      const dataLancamento = rawTransaction.dataLancamento;
      const textoInformacaoComplementar = rawTransaction.textoInformacaoComplementar || "";
      const indicadorTipoLancamento = rawTransaction.indicadorTipoLancamento;
      const codigoHistorico = rawTransaction.codigoHistorico || 0;
      
      // Verificar se é um lançamento de saldo
      const isSaldoTransaction = 
        textoDescricaoHistorico.includes("SALDO") ||
        textoDescricaoHistorico.includes("S A L D O") ||
        textoDescricaoHistorico.includes("Saldo") ||
        indicadorTipoLancamento === "S" ||
        indicadorTipoLancamento === "D";
      
      // Se for lançamento de saldo, podemos pular processamento adicional
      if (isSaldoTransaction && shouldHideTransaction(textoDescricaoHistorico)) {
        continue; // Pular este lançamento
      }
      
      // Determinar data da transação - melhor tratamento de erros
      let transactionDate: Date;
      try {
        transactionDate = formatBBDate(dataLancamento);
      } catch (error) {
        console.error(`[BANK_TRANSACTION_DATE] Erro ao processar data ${dataLancamento}:`, error);
        transactionDate = new Date(); // Usar data atual como fallback
      }
      
      // Determinar o tipo da transação com base no indicadorSinalLancamento
      const isDebit = indicadorSinalLancamento === "D" || 
                     indicadorTipoLancamento === "D" ||
                     textoDescricaoHistorico.toLowerCase().includes("debito");
      
      // Imprimir log para debug
      console.log(`[TIPO_TRANSACAO] Descrição: ${textoDescricaoHistorico}, Sinal: ${indicadorSinalLancamento}, Tipo: ${indicadorTipoLancamento}, É débito: ${isDebit}`);
      
      // Determinar o tipo usando a função utilitária
      const transactionType = determinarTipoTransacao(isDebit, textoDescricaoHistorico);
      
      // Determinar a categoria adequada
      const categoria = determinarCategoria(codigoHistorico, textoDescricaoHistorico);
      
      // Mascarar CPF/CNPJ para proteção de dados
      let cpfCnpjMascarado = undefined;
      if (rawTransaction.numeroCpfCnpjContrapartida) {
        cpfCnpjMascarado = mascaraCpfCnpj(rawTransaction.numeroCpfCnpjContrapartida);
      }
      
      // Determinar o nome amigável da transação
      const friendlyName = getTransactionName(textoDescricaoHistorico, textoInformacaoComplementar);
      
      // Determinar o valor correto com base no sinal
      let amount = valorLancamento;
      if (isDebit) {
        // Garantir que valores de débito sejam negativos
        amount = -Math.abs(valorLancamento);
      } else {
        // Garantir que valores de crédito sejam positivos
        amount = Math.abs(valorLancamento);
      }
      
      // Criar objeto de transação
      const transaction: BankTransaction = {
        id: generateTransactionId(walletId || 'unknown', dataLancamento, rawTransaction.numeroLote || 0, rawTransaction.numeroDocumento || 0),
        date: transactionDate,
        name: friendlyName,
        amount,
        type: transactionType,
        category: categoria,
        paymentMethod: TransactionPaymentMethod.OTHER,
        metadata: {
          source: "BB",
          indicadorTipoLancamento,
          dataLancamento,
          dataMovimento: rawTransaction.dataMovimento,
          codigoAgenciaOrigem: rawTransaction.codigoAgenciaOrigem,
          numeroLote: rawTransaction.numeroLote,
          numeroDocumento: rawTransaction.numeroDocumento,
          codigoHistorico,
          textoDescricaoHistorico,
          valorLancamento,
          indicadorSinalLancamento,
          textoInformacaoComplementar,
          numeroCpfCnpjContrapartida: rawTransaction.numeroCpfCnpjContrapartida,
          indicadorTipoPessoaContrapartida: rawTransaction.indicadorTipoPessoaContrapartida,
          codigoBancoContrapartida: rawTransaction.codigoBancoContrapartida,
          codigoAgenciaContrapartida: rawTransaction.codigoAgenciaContrapartida,
          numeroContaContrapartida: rawTransaction.numeroContaContrapartida,
          textoDvContaContrapartida: rawTransaction.textoDvContaContrapartida,
          isSaldoTransaction,
          rawTransaction,
          isDebit,
          numeroCpfCnpjMascarado: cpfCnpjMascarado
        }
      };
      
      processedTransactions.push(transaction);
    } catch (error) {
      console.error(`[BANK_TRANSACTION_ERROR] Erro ao processar transação:`, error);
      // Continuar com a próxima transação
    }
  }
  
  return processedTransactions;
}

/**
 * Gera um ID único para transação
 */
function generateTransactionId(walletId: string, dataLancamento: number, numeroLote: number, numeroDocumento: number): string {
  // Garantir que a data está no formato correto
  let dataStr = dataLancamento.toString();
  if (dataStr.length === 7) {
    dataStr = '0' + dataStr;
  }
  
  // Gerar um ID que inclui todos os campos para evitar colisões
  return `bb-${walletId}-${dataStr}-${numeroLote}-${numeroDocumento}`;
}

/**
 * Sincroniza transações bancárias com o banco de dados,
 * evitando duplicações e preservando os campos essenciais
 */
export async function syncBankTransactions(
  transactions: BankTransaction[], 
  userId: string, 
  walletId?: string
): Promise<{ created: number; updated: number; errors: number }> {
  console.log(`Iniciando sincronização de ${transactions.length} transações para o usuário ${userId}`);
  
  // Filtrar transações inválidas ou vazias
  const validTransactions = transactions.filter(t => 
    t.date && t.amount !== undefined && t.type && t.name
  );
  
  if (validTransactions.length < transactions.length) {
    console.warn(`Filtradas ${transactions.length - validTransactions.length} transações inválidas`);
  }
  
  // Separar transações de saldo das transações normais
  const normalTransactions = validTransactions.filter(t => 
    !t.metadata?.isSaldoTransaction
  );
  
  const saldoTransactions = validTransactions.filter(t => 
    t.metadata?.isSaldoTransaction
  );
  
  console.log(`Transações para sincronização: ${normalTransactions.length} normais, ${saldoTransactions.length} de saldo`);
  
  // Contadores para estatísticas
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  try {
    // Esta função seria implementada usando o prisma ou outro ORM da sua aplicação
    
    // Primeiro processamos transações normais (não saldo)
    for (const transaction of normalTransactions) {
      try {
        // Dupla verificação do tipo de transação para garantir consistência
        const metadata = transaction.metadata || {} as BankTransactionMetadata;
        const indicadorSinal = metadata.indicadorSinalLancamento;
        
        // Verificar se o tipo da transação está consistente com o indicador de sinal
        const isDebit = indicadorSinal === "D";
        let correctType = transaction.type;
        
        if (indicadorSinal) {
          if (isDebit && transaction.type === "DEPOSIT") {
            correctType = "EXPENSE";
            console.warn(`[SYNC_CORRECAO] Transação ${transaction.name} com indicador 'D' incorretamente classificada como DEPOSIT. Corrigindo para EXPENSE.`);
          } else if (!isDebit && transaction.type === "EXPENSE") {
            correctType = "DEPOSIT";
            console.warn(`[SYNC_CORRECAO] Transação ${transaction.name} com indicador 'C' incorretamente classificada como EXPENSE. Corrigindo para DEPOSIT.`);
          }
        }
        
        // Se o tipo mudou, atualizar na transação
        if (correctType !== transaction.type) {
          transaction.type = correctType;
          if (transaction.metadata) {
            transaction.metadata.isDebit = isDebit;
          }
        }
        
        // Verificar se a transação já existe com base em chaves únicas
        let existingTransaction = null;
        
        // Se temos metadados do banco, criar um identificador único
        if (metadata.source === "bank_import") {
          // Componentes para um identificador único de transação
          const uniqueFields = {
            dataLancamento: metadata.dataLancamento || 0,
            numeroLote: metadata.numeroLote || 0,
            numeroDocumento: metadata.numeroDocumento || 0,
            valorLancamento: metadata.valorLancamento || 0,
            indicadorSinalLancamento: metadata.indicadorSinalLancamento || ""
          };
          
          // Criar uma assinatura digital da transação para identificação única
          const transactionSignature = generateTransactionSignature(uniqueFields);
          
          // Log para debug
          console.log(`[SYNC_SIGNATURE] ${transaction.name}: ${transactionSignature}`);
          
          existingTransaction = await prisma.transaction.findFirst({
            where: {
              userId,
              AND: [
                { metadata: { path: ['source'], equals: 'bank_import' } },
                { metadata: { path: ['dataLancamento'], equals: metadata.dataLancamento } },
                { metadata: { path: ['valorLancamento'], equals: metadata.valorLancamento } },
                { metadata: { path: ['indicadorSinalLancamento'], equals: metadata.indicadorSinalLancamento } }
              ]
            }
          });
        }
        
        // Se a transação já existe, atualizar se necessário
        if (existingTransaction) {
          // Atualizar transação existente
          const metadataToSave = {
            ...(existingTransaction.metadata as object || {}),
            ...(transaction.metadata as object || {})
          } as Record<string, any>;

          // Garantir que category e paymentMethod não sejam undefined
          if (!transaction.category) {
            transaction.category = "OTHER";
          }
          if (!transaction.paymentMethod) {
            transaction.paymentMethod = TransactionPaymentMethod.OTHER;
          }

          await prisma.transaction.update({
            where: { id: existingTransaction.id },
            data: {
              amount: transaction.amount,
              type: transaction.type,
              category: transaction.category,
              metadata: {
                ...metadataToSave,
                paymentMethod: transaction.paymentMethod || TransactionPaymentMethod.OTHER
              },
              walletId: walletId as string
            } as any
          });
          
          updated++;
        } else {
          // Se a transação não existe, criar nova
          // Prepare apenas os campos necessários para economizar espaço
          const metadataToSave = transaction.metadata || {} as Record<string, any>;
          
          // Remover campos com valores padrão/vazios para economizar espaço no BD
          Object.keys(metadataToSave).forEach(key => {
            const value = metadataToSave[key];
            if (
              value === 0 || 
              value === "" || 
              value === null || 
              value === undefined ||
              (typeof value === 'string' && value === "00000000000000000000")
            ) {
              delete metadataToSave[key];
            }
          });
          
          // Validar e corrigir inconsistências entre valor e tipo
          if (transaction.amount < 0 && transaction.type === "DEPOSIT") {
            transaction.type = "EXPENSE";
            console.warn(`[SYNC_VALOR_INCONSISTENTE] Valor negativo com tipo incorreto. Corrigindo para EXPENSE.`);
          } else if (transaction.amount > 0 && transaction.type === "EXPENSE") {
            transaction.type = "DEPOSIT";
            console.warn(`[SYNC_VALOR_INCONSISTENTE] Valor positivo com tipo EXPENSE. Corrigindo para DEPOSIT.`);
          }
          
          // Garantir que category e paymentMethod não sejam undefined
          if (!transaction.category) {
            transaction.category = "OTHER";
          }
          if (!transaction.paymentMethod) {
            transaction.paymentMethod = TransactionPaymentMethod.OTHER;
          }
          
          await prisma.transaction.create({
            data: {
              userId,
              date: transaction.date,
              name: transaction.name,
              amount: transaction.amount,
              type: transaction.type,
              category: transaction.category,
              metadata: {
                ...metadataToSave,
                paymentMethod: transaction.paymentMethod || TransactionPaymentMethod.OTHER
              },
              walletId: walletId as string
            } as any
          });
          
          created++;
        }
      } catch (error) {
        console.error("Erro ao sincronizar transação:", error);
        errors++;
      }
    }
    
    // Agora processamos transações de saldo, se houver interesse em salvá-las
    // Normalmente estas são filtradas e não salvas
    
    console.log(`Sincronização concluída: ${created} criadas, ${updated} atualizadas, ${errors} erros`);
    
    return { created, updated, errors };
  } catch (error: any) {
    console.error("Erro geral na sincronização:", error);
    throw new Error(`Falha ao sincronizar transações: ${error.message}`);
  }
}

/**
 * Gera uma assinatura única para a transação com base nos seus campos essenciais
 * Usado para identificar unicamente transações e evitar duplicação
 */
function generateTransactionSignature(fields: any): string {
  // Filtrar campos não vazios
  const relevantFields = Object.entries(fields)
    .filter(([_, value]) => value !== 0 && value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  
  // Criar uma string com os campos ordenados
  const signatureStr = relevantFields
    .map(([key, value]) => `${key}:${value}`)
    .join('|');
  
  return signatureStr;
} 