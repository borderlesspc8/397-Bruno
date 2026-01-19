/**
 * Tipos para integração com KOMMO CRM
 */

/**
 * Configuração do JWT decodificado
 */
export interface KommoJWTPayload {
  aud: string; // Account ID
  jti: string;
  iat: number; // Issued at
  nbf: number; // Not before
  exp: number; // Expiration
  sub: string; // Subject (User ID)
  grant_type: string;
  account_id: number;
  base_domain: string;
  version: number;
  scopes: string[];
  hash_uuid: string;
  user_flags: number;
  api_domain: string;
}

/**
 * Informações do JWT após decodificação
 */
export interface KommoJWTInfo {
  accountId: number;
  accountHash: string;
  baseDomain: string;
  apiDomain: string;
  sub: string;
  scopes: string[];
  expiresAt: Date;
  issuedAt: Date;
}

/**
 * Contato no KOMMO
 */
export interface KommoContact {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  responsible_user_id?: number;
  group_id?: number;
  created_at: number;
  updated_at: number;
  custom_fields?: KommoCustomField[];
  _links?: Record<string, any>;
}

/**
 * Campo customizado no KOMMO
 */
export interface KommoCustomField {
  id: number;
  values: Array<{
    value: string | number | boolean;
    enum?: number;
  }>;
}

/**
 * Negociação (Deal/Lead) no KOMMO
 */
export interface KommoDeal {
  id: number;
  name: string;
  price: number;
  responsible_user_id?: number;
  group_id?: number;
  status_id?: number;
  pipeline_id?: number;
  created_at: number;
  updated_at: number;
  custom_fields?: KommoCustomField[];
  _links?: Record<string, any>;
}

/**
 * Resposta de listagem de contatos
 */
export interface KommoContactsResponse {
  _embedded: {
    contacts: KommoContact[];
  };
  _links: Record<string, any>;
  page_count: number;
}

/**
 * Resposta de listagem de negociações
 */
export interface KommoDealsResponse {
  _embedded: {
    deals: KommoDeal[];
  };
  _links: Record<string, any>;
  page_count: number;
}

/**
 * Resposta de sincronização
 */
export interface KommoSyncResult {
  success: boolean;
  contactsCount: number;
  dealsCount: number;
  lastSync: Date;
  errors?: string[];
}

/**
 * Configuração de integração KOMMO
 */
export interface KommoIntegrationConfig {
  jwtToken: string;
  userId: string;
  apiUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  baseDomain?: string;
}

/**
 * Metadata da integração KOMMO no banco
 */
export interface KommoIntegrationMetadata {
  jwtToken?: string;
  lastSync?: string;
  contactsCount?: number;
  dealsCount?: number;
  syncSuccess?: boolean;
  errors?: string[];
  accountId?: number;
  baseDomain?: string;
  scopes?: string[];
  expiresAt?: string;
}
