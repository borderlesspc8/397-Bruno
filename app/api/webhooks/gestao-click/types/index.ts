/**
 * Tipos e interfaces para o webhook do Gestão Click
 */

export interface InstallmentEventData {
  id?: string;
  parcelaId?: string;
  vendaId?: string;
  saleId?: string;
  [key: string]: any;
}

export interface GestaoClickInstallment {
  id?: string | number;
  numero?: string | number;
  parcela?: string | number;
  valor?: string | number;
  data_vencimento?: string;
  vencimento?: string;
  data_pagamento?: string | null;
  status?: string;
  situacao?: string;
  total_parcelas?: number;
  valor_total?: number;
  [key: string]: any;
}

export interface GestaoClickSale {
  id: string | number;
  valor_total?: string | number;
  valor_liquido?: string | number;
  total?: string | number;
  codigo?: string;
  referencia?: string;
  data?: string;
  data_venda?: string;
  created_at?: string;
  status?: string;
  cliente?: { id?: string | number; nome?: string };
  nome_cliente?: string;
  loja?: { id?: string | number; nome?: string };
  loja_id?: string | number;
  nome_loja?: string;
  forma_pagamento?: { nome?: string } | string;
  parcelas?: GestaoClickInstallment[];
  [key: string]: any;
}

export interface WebhookEvent {
  event: string;
  data: any;
  userId: string;
}

/**
 * Configurações de integração com o Gestão Click
 */
export interface GestaoClickIntegrationSettings {
  apiKey: string;
  secretToken: string;
  apiUrl: string;
  userId?: string;
  // Outras configurações opcionais
  webhookUrl?: string;
  active?: boolean;
} 