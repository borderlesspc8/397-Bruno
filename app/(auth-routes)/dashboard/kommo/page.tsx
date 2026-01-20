"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { AlertCircle, Users, TrendingUp, DollarSign } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

export default function KommoDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'failed'>('unknown');

  // Testar conexão
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/kommo/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus('connected');
        console.log('Kommo conectado:', data);
      } else {
        setConnectionStatus('failed');
        setError(data.message || 'Falha na conexão');
      }
    } catch (err) {
      setConnectionStatus('failed');
      setError(err instanceof Error ? err.message : 'Erro ao conectar');
    } finally {
      setLoading(false);
    }
  };

  // Buscar contatos
  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kommo/contacts?page=1&limit=10');
      const data = await response.json();
      
      if (data.success) {
        setContacts(data.contacts || []);
      } else {
        setError(data.message || 'Erro ao buscar contatos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar contatos');
    } finally {
      setLoading(false);
    }
  };

  // Buscar negócios
  const loadDeals = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/kommo/deals?page=1&limit=10');
      const data = await response.json();
      
      if (data.success) {
        setDeals(data.deals || []);
      } else {
        setError(data.message || 'Erro ao buscar negócios');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar negócios');
    } finally {
      setLoading(false);
    }
  };

  // Carregar tudo
  const loadAll = async () => {
    await testConnection();
    await loadContacts();
    await loadDeals();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Kommo CRM</h1>
        <p className="text-gray-600 mt-2">Gerencie seus contatos e negócios do Kommo</p>
      </div>

      {/* Ação */}
      <div className="flex gap-3">
        <Button onClick={testConnection} disabled={loading}>
          {loading ? 'Testando...' : 'Testar Conexão'}
        </Button>
        <Button onClick={loadContacts} disabled={loading} variant="outline">
          Carregar Contatos
        </Button>
        <Button onClick={loadDeals} disabled={loading} variant="outline">
          Carregar Negócios
        </Button>
        <Button onClick={loadAll} disabled={loading}>
          Carregar Tudo
        </Button>
      </div>

      {/* Status da Conexão */}
      {connectionStatus !== 'unknown' && (
        <Alert variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {connectionStatus === 'connected' ? 'Conectado!' : 'Falha na Conexão'}
          </AlertTitle>
          <AlertDescription>
            {connectionStatus === 'connected' 
              ? 'A integração com Kommo está funcionando corretamente.' 
              : 'Verifique se o token KOMMO_JWT_TOKEN está configurado no .env'}
          </AlertDescription>
        </Alert>
      )}

      {/* Erro */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">Carregados do Kommo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Negócios</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
            <p className="text-xs text-muted-foreground">Carregados do Kommo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {deals.reduce((acc, deal) => acc + (deal.price || 0), 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">Soma dos negócios</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contatos */}
      {contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contatos</CardTitle>
            <CardDescription>Últimos contatos do Kommo CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {contacts.map((contact: any) => (
                <div key={contact.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{contact.name || 'Sem nome'}</p>
                    <p className="text-sm text-gray-500">ID: {contact.id}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {contact._embedded?.tags?.map((tag: any) => tag.name).join(', ') || 'Sem tags'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Negócios */}
      {deals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Negócios</CardTitle>
            <CardDescription>Últimos negócios do Kommo CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {deals.map((deal: any) => (
                <div key={deal.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{deal.name || 'Sem nome'}</p>
                    <p className="text-sm text-gray-500">ID: {deal.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {(deal.price || 0).toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-gray-500">
                      Status: {deal.status_id || 'Desconhecido'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {connectionStatus === 'unknown' && (
        <Card>
          <CardHeader>
            <CardTitle>Como configurar</CardTitle>
            <CardDescription>Siga os passos abaixo para conectar ao Kommo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Obtenha seu token JWT do Kommo</h3>
              <p className="text-sm text-gray-600">
                Acesse seu painel do Kommo CRM e gere um token de acesso JWT
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Configure o .env</h3>
              <p className="text-sm text-gray-600 mb-2">
                Adicione o token no arquivo .env:
              </p>
              <pre className="bg-gray-100 p-3 rounded text-sm">
                KOMMO_JWT_TOKEN=seu_token_aqui
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Reinicie o servidor</h3>
              <p className="text-sm text-gray-600">
                Após adicionar o token, reinicie o servidor Next.js
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
