import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TransactionTypes, TransactionType } from "../_constants/transaction-types";

/**
 * Mapeamento de códigos históricos para categorias adequadas
 */
export const CATEGORIA_POR_CODIGO_HISTORICO: Record<number, string> = {
  144: "PIX",          // PIX
  126: "SALARY",       // Salário/pagamento
  210: "BANK_TRANSFER", // Transferências
  124: "BANK_TRANSFER", // Transferências
  156: "UTILITY",      // Contas e pagamentos
  435: "OTHER",        // Tarifa Bancária
  830: "DEPOSIT",      // Depósito em Dinheiro
  976: "BANK_TRANSFER", // TED
  624: "BANK_TRANSFER", // Cobrança
  999: "OTHER",        // Saldo
  // Adicionar mais códigos conforme necessário
};

/**
 * Mapeamento de descrições para categorias
 */
export const CATEGORIA_POR_DESCRICAO: Record<string, string> = {
  "PIX ENVIADO": "PIX",
  "PIX RECEBIDO": "PIX",
  "PIX - ENVIADO": "PIX",
  "PIX - RECEBIDO": "PIX",
  "SALDO ANTERIOR": "Saldo",
  "SALDO DO DIA": "Saldo",
  "S A L D O": "Saldo",
  "TARIFA": "Tarifa Bancária",
  "TARIFA PACOTE": "Tarifa Bancária",
  "TED-CRÉDITO EM CONTA": "TED Recebido",
  "TED RECEBIDO": "TED Recebido",
  "TED ENVIADO": "TED Enviado",
  "DEP DINHEIRO": "Depósito em Dinheiro",
  "DEPÓSITO EM DINHEIRO": "Depósito em Dinheiro",
  "DEP DINHEIRO INTER AG": "Depósito em Dinheiro",
  // Adicionar mais descrições conforme necessário
};

/**
 * Constantes para esconder transações de saldo específicas
 */
export const HIDDEN_TRANSACTION_KEYWORDS = [
  "SALDO DO DIA", 
  "SALDO ANTERIOR", 
  "S A L D O", 
  "SALDO FINAL", 
  "SALDO INICIAL",
  "SALDO DISPONIVEL",
  "SALDO ATUAL",
  "SALDO",
];

/**
 * Verifica se uma transação deve ser ocultada com base na descrição
 */
export const shouldHideTransaction = (description: string): boolean => {
  if (!description) return false;
  
  const upperDesc = description.toUpperCase();
  return HIDDEN_TRANSACTION_KEYWORDS.some(keyword => upperDesc.includes(keyword));
};

/**
 * Determina a categoria com base no código histórico e descrição
 */
export function determinarCategoria(codigoHistorico: number, descricao: string): string {
  // Primeiro tenta encontrar pelo código histórico
  if (codigoHistorico && CATEGORIA_POR_CODIGO_HISTORICO[codigoHistorico]) {
    return CATEGORIA_POR_CODIGO_HISTORICO[codigoHistorico];
  }
  
  // Se não encontrar pelo código, tenta pela descrição
  const descricaoNormalizada = descricao.toLowerCase().trim();
  
  for (const [chave, categoria] of Object.entries(CATEGORIA_POR_DESCRICAO)) {
    if (descricaoNormalizada.includes(chave.toLowerCase())) {
      return categoria;
    }
  }
  
  // Caso não encontre em nenhum dos mapeamentos
  return "OTHER";
}

/**
 * Mascara CPF/CNPJ para proteção de dados
 */
export function mascaraCpfCnpj(numero: number | string): string {
  if (!numero) return "";
  
  const numeroStr = numero.toString();
  return numeroStr.length <= 11
    ? numeroStr.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.***.$3-$4') // CPF
    : numeroStr.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '**.$2.$3/$4-**'); // CNPJ
}

/**
 * Formata moeda em formato brasileiro (R$)
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(valor));
}

/**
 * Formata data no padrão brasileiro
 */
export function formatarData(data: Date): string {
  return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Verifica se uma transação é do tipo débito
 */
export function isDebitoTransaction(metadata: any): boolean {
  if (!metadata) return false;
  
  // Verificar pela propriedade explícita primeiro
  if (metadata.isDebit === true) {
    return true;
  }
  
  // Verificar pelos indicadores de sinal
  return metadata.indicadorSinalLancamento === "D" || 
         metadata.indicadorTipoLancamento === "D" ||
         (metadata.textoDescricaoHistorico || "").toLowerCase().includes("debito");
}

/**
 * Gera o texto formatado para o valor com sinal e cor
 */
export function getValorFormatado(valor: number, ehDebito: boolean): string {
  return ehDebito ? `-${formatarMoeda(Math.abs(valor))}` : formatarMoeda(Math.abs(valor));
}

/**
 * Determina a classe CSS para colorir o valor (positivo/negativo)
 */
export function getValorColorClass(ehDebito: boolean): string {
  return ehDebito ? "text-red-600" : "text-green-600";
}

/**
 * Obtém um nome mais amigável para a transação
 */
export function getTransactionName(textoDescricao: string, textoComplementar: string): string {
  if (!textoComplementar || textoComplementar.trim() === "") {
    return textoDescricao;
  }
  
  // Para PIX e TED, a informação complementar frequentemente contém informações úteis
  if (textoDescricao.toLowerCase().includes("pix") || 
      textoDescricao.toLowerCase().includes("ted") || 
      textoDescricao.toLowerCase().includes("transferencia") ||
      textoDescricao.toLowerCase().includes("deposito") ||
      textoDescricao.toLowerCase().includes("pagamento")) {
    return `${textoDescricao} - ${textoComplementar}`;
  }
  
  return textoDescricao;
}

/**
 * Determina o tipo de transação com base no indicador de sinal
 */
export function determinarTipoTransacao(
  isDebit: boolean, 
  descricao: string
): TransactionType {
  const ehInvestimento = descricao && 
    (descricao.includes("INVEST") || descricao.includes("APLIC"));
  
  if (ehInvestimento) {
    return TransactionTypes.INVESTMENT;
  }
  
  return isDebit ? TransactionTypes.EXPENSE : TransactionTypes.DEPOSIT;
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
