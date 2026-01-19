/**
 * Exemplo de integração com as APIs no Frontend
 * Este arquivo contém exemplos de como usar as integrações KOMMO e Gestão Click
 */

// ===================================
// EXEMPLO 1: Testar Conexão KOMMO
// ===================================

async function testKommoConnection(jwtToken: string, userId: string = '1') {
  try {
    const response = await fetch('/api/kommo/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jwtToken,
        userId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ KOMMO conectado com sucesso');
      console.log('Account ID:', result.account?.accountId);
      console.log('Domínio:', result.account?.baseDomain);
      console.log('Scopes:', result.account?.scopes);
      console.log('Expira em:', result.account?.expiresAt);
      return true;
    } else {
      console.error('❌ Erro ao conectar:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return false;
  }
}

// ===================================
// EXEMPLO 2: Obter Contatos KOMMO
// ===================================

async function getKommoContacts(page: number = 1, limit: number = 50) {
  try {
    const response = await fetch(
      `/api/kommo/contacts?page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log(`✅ ${result.data.length} contatos obtidos`);
      return result.data;
    } else {
      console.error('❌ Erro ao obter contatos:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return [];
  }
}

// ===================================
// EXEMPLO 3: Obter Negociações KOMMO
// ===================================

async function getKommoDeals(page: number = 1, limit: number = 50) {
  try {
    const response = await fetch(
      `/api/kommo/deals?page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log(`✅ ${result.data.length} negociações obtidas`);
      return result.data;
    } else {
      console.error('❌ Erro ao obter negociações:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return [];
  }
}

// ===================================
// EXEMPLO 4: Sincronizar Dados KOMMO
// ===================================

async function syncKommoData(jwtToken: string, userId: string = '1') {
  try {
    const response = await fetch('/api/kommo/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jwtToken,
        userId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Sincronização concluída');
      console.log(`Contatos: ${result.data.contactsCount}`);
      console.log(`Negociações: ${result.data.dealsCount}`);
      console.log(`Última atualização: ${result.data.lastSync}`);
      return result.data;
    } else {
      console.error('❌ Erro na sincronização:', result.error);
      if (result.data?.errors) {
        result.data.errors.forEach((error: string) => {
          console.error('  -', error);
        });
      }
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return null;
  }
}

// ===================================
// EXEMPLO 5: Obter Status KOMMO
// ===================================

async function getKommoSyncStatus(userId: string = '1') {
  try {
    const response = await fetch(`/api/kommo/sync?userId=${userId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success && result.data) {
      console.log('✅ Status da última sincronização:');
      console.log(`Contatos: ${result.data.contactsCount}`);
      console.log(`Negociações: ${result.data.dealsCount}`);
      console.log(`Última atualização: ${result.data.lastSync}`);
      console.log(`Sucesso: ${result.data.syncSuccess}`);
      return result.data;
    } else {
      console.log('⚠️ Nenhuma sincronização anterior');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return null;
  }
}

// ===================================
// EXEMPLO 6: Testar Conexão Gestão Click
// ===================================

async function testGestaoClickConnection(
  apiKey: string,
  secretToken: string
) {
  try {
    const response = await fetch('/api/gestao-click/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey,
        secretToken,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Gestão Click conectado com sucesso');
      return true;
    } else {
      console.error('❌ Erro ao conectar:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
    return false;
  }
}

// ===================================
// EXEMPLO 7: Hook React para KOMMO
// ===================================

// import { useState, useCallback } from 'react';

/*
export function useKommoIntegration() {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [error, setError] = useState<string | null>(null);

  const testConnection = useCallback(async (jwtToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await testKommoConnection(jwtToken);
      if (!success) {
        setError('Falha ao conectar com KOMMO');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadContacts = useCallback(async (page = 1, limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getKommoContacts(page, limit);
      setContacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDeals = useCallback(async (page = 1, limit = 50) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getKommoDeals(page, limit);
      setDeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar negociações');
    } finally {
      setLoading(false);
    }
  }, []);

  const syncData = useCallback(async (jwtToken: string) => {
    setLoading(true);
    setError(null);
    try {
      await syncKommoData(jwtToken);
      // Recarregar dados após sincronização
      await loadContacts();
      await loadDeals();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na sincronização');
    } finally {
      setLoading(false);
    }
  }, [loadContacts, loadDeals]);

  return {
    loading,
    error,
    contacts,
    deals,
    testConnection,
    loadContacts,
    loadDeals,
    syncData,
  };
}
*/

// ===================================
// EXEMPLO 8: Componente React KOMMO
// ===================================

/*
import React, { useState } from 'react';

export function KommoIntegrationPanel() {
  const [jwtToken, setJwtToken] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const { testConnection, syncData, contacts, deals, loading } = useKommoIntegration();

  const handleConnect = async () => {
    const success = await testConnection(jwtToken);
    setIsConnected(success);
  };

  const handleSync = async () => {
    await syncData(jwtToken);
  };

  return (
    <div className="kommo-panel">
      <h2>KOMMO CRM Integration</h2>
      
      <div className="token-input">
        <label>JWT Token:</label>
        <textarea
          value={jwtToken}
          onChange={(e) => setJwtToken(e.target.value)}
          placeholder="Cole seu JWT Token aqui..."
        />
      </div>

      <div className="actions">
        <button onClick={handleConnect} disabled={!jwtToken || loading}>
          {loading ? 'Conectando...' : 'Testar Conexão'}
        </button>
        
        {isConnected && (
          <button onClick={handleSync} disabled={loading}>
            {loading ? 'Sincronizando...' : 'Sincronizar Dados'}
          </button>
        )}
      </div>

      {isConnected && (
        <div className="data-display">
          <div className="contacts">
            <h3>Contatos ({contacts.length})</h3>
            <ul>
              {contacts.map((contact) => (
                <li key={contact.id}>{contact.name}</li>
              ))}
            </ul>
          </div>
          
          <div className="deals">
            <h3>Negociações ({deals.length})</h3>
            <ul>
              {deals.map((deal) => (
                <li key={deal.id}>
                  {deal.name} - R${deal.price}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
*/

// ===================================
// EXEMPLO 9: Classe Wrapper para KOMMO
// ===================================

class KommoClient {
  private jwtToken: string;
  private userId: string;
  private baseUrl: string = '/api/kommo';

  constructor(jwtToken: string, userId: string = '1') {
    this.jwtToken = jwtToken;
    this.userId = userId;
  }

  async testConnection(): Promise<boolean> {
    return testKommoConnection(this.jwtToken, this.userId);
  }

  async getContacts(page: number = 1, limit: number = 50) {
    return getKommoContacts(page, limit);
  }

  async getDeals(page: number = 1, limit: number = 50) {
    return getKommoDeals(page, limit);
  }

  async sync() {
    return syncKommoData(this.jwtToken, this.userId);
  }

  async getSyncStatus() {
    return getKommoSyncStatus(this.userId);
  }

  async getContact(contactId: number) {
    const response = await fetch(`${this.baseUrl}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jwtToken: this.jwtToken,
        userId: this.userId,
        contactId,
      }),
    });
    return response.json();
  }

  async getDeal(dealId: number) {
    const response = await fetch(`${this.baseUrl}/deals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jwtToken: this.jwtToken,
        userId: this.userId,
        dealId,
      }),
    });
    return response.json();
  }
}

// ===================================
// EXEMPLO 10: Uso da Classe Wrapper
// ===================================

/*
async function example() {
  const kommo = new KommoClient('seu_jwt_token_aqui');
  
  // Testar conexão
  const isConnected = await kommo.testConnection();
  if (!isConnected) {
    console.error('Falha ao conectar');
    return;
  }
  
  // Obter contatos
  const contacts = await kommo.getContacts(1, 50);
  console.log('Contatos:', contacts);
  
  // Obter um contato específico
  const contact = await kommo.getContact(123);
  console.log('Contato 123:', contact);
  
  // Sincronizar dados
  const syncResult = await kommo.sync();
  console.log('Sincronização:', syncResult);
}
*/

export {
  testKommoConnection,
  getKommoContacts,
  getKommoDeals,
  syncKommoData,
  getKommoSyncStatus,
  testGestaoClickConnection,
  KommoClient,
};
