import { KommoBaseService, KommoBaseConfig } from './kommo-base-service';
import { logger } from './logger';
import { prisma } from '@/app/_lib/prisma';

/**
 * Interface para resposta de contatos
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
  custom_fields?: Array<{
    id: number;
    values: Array<{
      value: string | number | boolean;
      enum?: number;
    }>;
  }>;
}

/**
 * Interface para resposta de negociações (deals)
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
  custom_fields?: Array<{
    id: number;
    values: Array<{
      value: string | number | boolean;
      enum?: number;
    }>;
  }>;
}

/**
 * Interface para listagem de contatos
 */
export interface KommoContactsResponse {
  _embedded: {
    contacts: KommoContact[];
  };
  _links: any;
  page_count: number;
}

/**
 * Interface para listagem de negociações
 */
export interface KommoDealsResponse {
  _embedded: {
    deals: KommoDeal[];
  };
  _links: any;
  page_count: number;
}

/**
 * Interface para sincronização de dados
 */
export interface KommoSyncResult {
  success: boolean;
  contactsCount: number;
  dealsCount: number;
  lastSync: Date;
  errors?: string[];
}

/**
 * Serviço para integração com KOMMO CRM
 */
export class KommoService extends KommoBaseService {
  constructor(config?: KommoBaseConfig) {
    super(config);
  }

  /**
   * Testa a conexão com a API do KOMMO
   */
  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testando conexão com KOMMO', {
        context: 'KOMMO_TEST_CONNECTION',
        data: { userId: this.userId }
      });

      const jwtInfo = this.getJWTInfo();
      
      if (!jwtInfo) {
        throw new Error('JWT inválido ou expirado');
      }

      logger.info('JWT decodificado com sucesso', {
        context: 'KOMMO_JWT_INFO',
        data: {
          accountId: jwtInfo.accountId,
          baseDomain: jwtInfo.baseDomain,
          expiresAt: jwtInfo.expiresAt,
          scopes: jwtInfo.scopes,
        }
      });

      // Tenta buscar contatos para validar a conexão
      const contacts = await this.get<KommoContactsResponse>('/api/v4/contacts', {
        limit: 1,
      });

      logger.info('Conexão com KOMMO validada', {
        context: 'KOMMO_CONNECTION_SUCCESS',
        data: {
          hasContacts: !!contacts._embedded?.contacts,
          userId: this.userId,
        }
      });

      return true;
    } catch (error) {
      logger.error('Erro ao testar conexão com KOMMO', {
        context: 'KOMMO_CONNECTION_ERROR',
        data: {
          error: error instanceof Error ? error.message : String(error),
          userId: this.userId,
        }
      });
      throw error;
    }
  }

  /**
   * Obtém todos os contatos do KOMMO
   */
  async getContacts(
    page: number = 1,
    limit: number = 50,
    query?: string
  ): Promise<KommoContactsResponse> {
    try {
      logger.info(`Buscando contatos do KOMMO (página ${page})`, {
        context: 'KOMMO_GET_CONTACTS',
        data: { userId: this.userId, page, limit, hasQuery: !!query }
      });

      const response = await this.get<KommoContactsResponse>('/api/v4/contacts', {
        page,
        limit,
        query: query || undefined,
        with: 'catalog_elements,leads,customers,is_main_contact',
      });

      logger.info(`Contatos obtidos com sucesso`, {
        context: 'KOMMO_CONTACTS_SUCCESS',
        data: {
          count: response._embedded?.contacts?.length || 0,
          pageCount: response.page_count,
          userId: this.userId,
        }
      });

      return response;
    } catch (error) {
      logger.error('Erro ao buscar contatos do KOMMO', {
        context: 'KOMMO_GET_CONTACTS_ERROR',
        data: {
          error: error instanceof Error ? error.message : String(error),
          userId: this.userId,
          page,
        }
      });
      throw error;
    }
  }

  /**
   * Obtém um contato específico
   */
  async getContact(contactId: number): Promise<KommoContact> {
    try {
      logger.info(`Buscando contato ${contactId} do KOMMO`, {
        context: 'KOMMO_GET_CONTACT',
        data: { userId: this.userId, contactId }
      });

      const response = await this.get<any>(`/api/v4/contacts/${contactId}`, {
        with: 'catalog_elements,leads,customers,is_main_contact',
      });

      return response;
    } catch (error) {
      logger.error(`Erro ao buscar contato ${contactId} do KOMMO`, {
        context: 'KOMMO_GET_CONTACT_ERROR',
        data: {
          error: error instanceof Error ? error.message : String(error),
          userId: this.userId,
          contactId,
        }
      });
      throw error;
    }
  }

  /**
   * Obtém todos os negócios (deals) do KOMMO
   */
  async getDeals(
    page: number = 1,
    limit: number = 50,
    query?: string
  ): Promise<KommoDealsResponse> {
    try {
      logger.info(`Buscando negociações do KOMMO (página ${page})`, {
        context: 'KOMMO_GET_DEALS',
        data: { userId: this.userId, page, limit, hasQuery: !!query }
      });

      const response = await this.get<KommoDealsResponse>('/api/v4/leads', {
        page,
        limit,
        query: query || undefined,
        with: 'catalog_elements,contacts,is_main_contact',
      });

      logger.info(`Negociações obtidas com sucesso`, {
        context: 'KOMMO_DEALS_SUCCESS',
        data: {
          count: response._embedded?.deals?.length || 0,
          pageCount: response.page_count,
          userId: this.userId,
        }
      });

      return response;
    } catch (error) {
      logger.error('Erro ao buscar negociações do KOMMO', {
        context: 'KOMMO_GET_DEALS_ERROR',
        data: {
          error: error instanceof Error ? error.message : String(error),
          userId: this.userId,
          page,
        }
      });
      throw error;
    }
  }

  /**
   * Obtém um negócio específico
   */
  async getDeal(dealId: number): Promise<KommoDeal> {
    try {
      logger.info(`Buscando negociação ${dealId} do KOMMO`, {
        context: 'KOMMO_GET_DEAL',
        data: { userId: this.userId, dealId }
      });

      const response = await this.get<any>(`/api/v4/leads/${dealId}`, {
        with: 'catalog_elements,contacts,is_main_contact',
      });

      return response;
    } catch (error) {
      logger.error(`Erro ao buscar negociação ${dealId} do KOMMO`, {
        context: 'KOMMO_GET_DEAL_ERROR',
        data: {
          error: error instanceof Error ? error.message : String(error),
          userId: this.userId,
          dealId,
        }
      });
      throw error;
    }
  }

  /**
   * Sincroniza contatos e negociações do KOMMO para o banco de dados
   */
  async syncData(): Promise<KommoSyncResult> {
    try {
      logger.info('Iniciando sincronização de dados do KOMMO', {
        context: 'KOMMO_SYNC_START',
        data: { userId: this.userId }
      });

      let contactsCount = 0;
      let dealsCount = 0;
      const errors: string[] = [];

      try {
        // Sincronizar contatos
        const contactsResponse = await this.getContacts(1, 250);
        const contacts = contactsResponse._embedded?.contacts || [];
        contactsCount = contacts.length;

        logger.info(`Sincronizando ${contactsCount} contatos`, {
          context: 'KOMMO_SYNC_CONTACTS',
          data: { userId: this.userId, count: contactsCount }
        });

        // Salvar contatos no banco de dados
        for (const contact of contacts) {
          try {
            await prisma.wallet.upsert({
              where: {
                id: `kommo_contact_${contact.id}`,
              },
              update: {
                metadata: {
                  kommoContactId: contact.id,
                  name: contact.name,
                  firstName: contact.first_name,
                  lastName: contact.last_name,
                  responsibleUserId: contact.responsible_user_id,
                  updatedAt: new Date().toISOString(),
                }
              },
              create: {
                id: `kommo_contact_${contact.id}`,
                userId: this.userId,
                name: `KOMMO_CONTACT_${contact.id}`,
                type: 'EXTERNAL_INTEGRATION',
                balance: 0,
                metadata: {
                  kommoContactId: contact.id,
                  name: contact.name,
                  firstName: contact.first_name,
                  lastName: contact.last_name,
                  responsibleUserId: contact.responsible_user_id,
                  createdAt: new Date().toISOString(),
                }
              }
            });
          } catch (error) {
            errors.push(`Erro ao sincronizar contato ${contact.id}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      } catch (error) {
        errors.push(`Erro ao buscar contatos: ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        // Sincronizar negociações
        const dealsResponse = await this.getDeals(1, 250);
        const deals = dealsResponse._embedded?.deals || [];
        dealsCount = deals.length;

        logger.info(`Sincronizando ${dealsCount} negociações`, {
          context: 'KOMMO_SYNC_DEALS',
          data: { userId: this.userId, count: dealsCount }
        });

        // Salvar negociações no banco de dados
        for (const deal of deals) {
          try {
            await prisma.wallet.upsert({
              where: {
                id: `kommo_deal_${deal.id}`,
              },
              update: {
                metadata: {
                  kommoDealId: deal.id,
                  name: deal.name,
                  price: deal.price,
                  pipelineId: deal.pipeline_id,
                  statusId: deal.status_id,
                  updatedAt: new Date().toISOString(),
                }
              },
              create: {
                id: `kommo_deal_${deal.id}`,
                userId: this.userId,
                name: `KOMMO_DEAL_${deal.id}`,
                type: 'EXTERNAL_INTEGRATION',
                balance: deal.price || 0,
                metadata: {
                  kommoDealId: deal.id,
                  name: deal.name,
                  price: deal.price,
                  pipelineId: deal.pipeline_id,
                  statusId: deal.status_id,
                  createdAt: new Date().toISOString(),
                }
              }
            });
          } catch (error) {
            errors.push(`Erro ao sincronizar negociação ${deal.id}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      } catch (error) {
        errors.push(`Erro ao buscar negociações: ${error instanceof Error ? error.message : String(error)}`);
      }

      const result: KommoSyncResult = {
        success: errors.length === 0,
        contactsCount,
        dealsCount,
        lastSync: new Date(),
        errors: errors.length > 0 ? errors : undefined,
      };

      logger.info('Sincronização do KOMMO concluída', {
        context: 'KOMMO_SYNC_COMPLETE',
        data: {
          ...result,
          userId: this.userId,
        }
      });

      return result;
    } catch (error) {
      logger.error('Erro crítico na sincronização do KOMMO', {
        context: 'KOMMO_SYNC_ERROR',
        data: {
          error: error instanceof Error ? error.message : String(error),
          userId: this.userId,
        }
      });
      throw error;
    }
  }
}
