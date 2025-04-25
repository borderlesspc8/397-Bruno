import { Agent } from "https";

/**
 * Credenciais para autenticação e comunicação com a API do Banco do Brasil
 */
export interface BBCredentials {
  applicationKey: string;
  clientId: string;
  clientSecret: string;
  clientBasic: string;
  apiUrl?: string;
  agencia?: string;
  conta?: string;
  certPaths: {
    ca: string;
    cert: string;
    key: string;
  };
}

/**
 * Resposta da API de contas do Banco do Brasil
 */
export interface BBAccountResponse {
  Data: {
    Account: Array<{
      AccountId: string;
      AccountType: string;
      AccountSubType: string;
      Description: string;
      Nickname: string;
      Balance: number;
      Currency: string;
    }>
  };
}

/**
 * Resposta da API de transações do Banco do Brasil
 */
export interface BBTransactionResponse {
  Data: {
    Transaction: Array<{
      TransactionId: string;
      BookingDateTime: string;
      ValueDateTime: string;
      TransactionInformation: string;
      Amount: {
        Amount: string;
        Currency: string;
      };
      CreditDebitIndicator: "CRDT" | "DBIT";
      Status: string;
      TransactionReference: string;
      BankTransactionCode: {
        Code: string;
        SubCode: string;
      };
    }>
  };
}

/**
 * Informações de conexão com o banco
 */
export interface BankConnectionInfo {
  id: string;
  userId: string;
  bankId: string;
  accessToken: string | null;
  // refreshToken é opcional, pois alguns bancos não o usam
  refreshToken?: string | null;
  expiresAt: Date | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  status?: string;
  consentId?: string | null;
}

/**
 * Resposta da API de extratos do Banco do Brasil
 */
export interface BBExtractResponse {
  quantidadeTotalPagina: number;
  quantidadeTotalRegistro: number;
  listaLancamento: BBTransaction[];
  textoDvContaContrapartida?: string;
}

/**
 * Estrutura de um lançamento (transação) do extrato do BB
 */
export interface BBTransaction {
  indicadorSinalLancamento: string;
  dataMovimento: string | number;
  indicadorTipoLancamento?: string;
  textoDescricaoHistorico?: string;
  dataLancamento?: number;
  valorLancamento?: number;
  numeroDocumento?: number;
  numeroLote?: number;
  codigoHistorico?: number;
  textoInformacaoComplementar?: string;
  numeroCpfCnpjContrapartida?: number;
  indicadorTipoPessoaContrapartida?: string;
  codigoBancoContrapartida?: number;
  codigoAgenciaContrapartida?: number;
  numeroContaContrapartida?: string;
  textoDvContaContrapartida?: string;
  lancamentoContaCorrenteCliente: {
    numeroRemessaBanco: number;
    nomeTipoOperacao: string;
    valorLancamentoRemessa: number;
    descricaoGrupoPagamento: string;
    codigoHistorico: number;
    lancamentoContaCorrenteCliente: number;
    nomeBanco: string;
    numeroEvento: number;
    complementoHistorico: string;
  };
}

/**
 * Resposta da API de saldo do Banco do Brasil
 */
export interface BBStatementResponse {
  quantidadeTotalPagina: number;
  quantidadeTotalRegistro: number;
  listaLancamento: BBTransaction[];
}

/**
 * Opções para a requisição de extrato bancário
 */
export interface ExtractOptions {
  walletId: string;
  dataInicio?: string;
  dataFim?: string;
  numeroPagina?: number;
  quantidadeRegistros?: number;
  useDatasJaFormatadas?: boolean;
  dataInicioOriginal?: string;
  dataFimOriginal?: string;
}

/**
 * Tipos de categoria para transações
 */
export type TransactionCategory = 
  | "HOUSING" 
  | "TRANSPORTATION" 
  | "FOOD" 
  | "ENTERTAINMENT" 
  | "HEALTH" 
  | "UTILITY" 
  | "SALARY" 
  | "EDUCATION" 
  | "OTHER"; 