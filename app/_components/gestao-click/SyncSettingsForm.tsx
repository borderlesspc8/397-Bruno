"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDateTimeBR } from "@/app/_lib/date-utils";

// Interface para os valores de configuração retornados pela API
interface SyncSettings {
  autoSync: boolean;
  syncFrequency: string;
  useEnvCredentials: boolean;
  apiKey?: string;
  secretToken?: string;
  apiUrl?: string;
  authMethod?: string;
  lastSyncAt?: string;
  nextSyncAt?: string;
  status?: string;
}

const defaultSettings: SyncSettings = {
  autoSync: false,
  syncFrequency: "daily",
  useEnvCredentials: true,
  apiKey: "",
  secretToken: "",
  apiUrl: "https://api.beteltecnologia.com.br",
  authMethod: "token",
};

interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export default function SyncSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [formValues, setFormValues] = useState<SyncSettings>(defaultSettings);
  const [connectionTestResult, setConnectionTestResult] = useState<ConnectionTestResult | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [nextSync, setNextSync] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  
  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadSettings();
  }, []);
  
  // Carregar configurações do servidor
  async function loadSettings() {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/gestao-click/sync-settings");
      
      if (response.ok) {
        const data = await response.json();
        
        setFormValues({
          autoSync: data.autoSync ?? defaultSettings.autoSync,
          syncFrequency: data.syncFrequency ?? defaultSettings.syncFrequency,
          useEnvCredentials: data.useEnvCredentials ?? defaultSettings.useEnvCredentials,
          apiKey: data.apiKey ?? defaultSettings.apiKey,
          secretToken: data.secretToken ?? defaultSettings.secretToken,
          apiUrl: data.apiUrl ?? defaultSettings.apiUrl,
          authMethod: data.authMethod ?? defaultSettings.authMethod,
        });
        
        // Definir status atual
        setLastSync(data.lastSyncAt || null);
        setNextSync(data.nextSyncAt || null);
        setStatus(data.status || null);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Não foi possível carregar as configurações");
    } finally {
      setIsLoading(false);
    }
  }
  
  // Manipulador de alteração de inputs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };
  
  // Submeter formulário
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/gestao-click/sync-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Atualizar informações de sincronização
        setLastSync(data.lastSyncAt || null);
        setNextSync(data.nextSyncAt || null);
        setStatus(data.status || null);
        
        toast.success("Configurações de sincronização salvas com sucesso!");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error((error as Error).message || "Não foi possível salvar as configurações");
    } finally {
      setIsLoading(false);
    }
  }
  
  // Testar conexão com as credenciais atuais
  async function testConnection() {
    try {
      setIsTesting(true);
      setConnectionTestResult(null);
      
      const response = await fetch("/api/gestao-click/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          useEnvCredentials: formValues.useEnvCredentials,
          apiKey: formValues.apiKey,
          secretToken: formValues.secretToken,
          apiUrl: formValues.apiUrl,
          authMethod: formValues.authMethod
        }),
      });
      
      const data = await response.json();
      
      setConnectionTestResult({
        success: data.success,
        message: data.message || (data.success ? "Conexão bem-sucedida!" : "Falha na conexão"),
      });
      
      if (data.success) {
        toast.success("Conexão testada com sucesso!");
      } else {
        toast.error(data.message || "Falha ao testar conexão");
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      setConnectionTestResult({
        success: false,
        message: (error as Error).message || "Erro desconhecido ao testar conexão",
      });
      toast.error("Não foi possível testar a conexão");
    } finally {
      setIsTesting(false);
    }
  }
  
  // Executar sincronização manual
  async function runManualSync() {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/gestao-click/sync-schedule", {
        method: "PUT",
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Atualizar informações de sincronização
        setLastSync(data.lastSyncAt || null);
        setStatus(data.status || null);
        
        toast.success("Sincronização iniciada com sucesso!");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erro ao iniciar sincronização");
      }
    } catch (error) {
      console.error("Erro ao executar sincronização:", error);
      toast.error((error as Error).message || "Não foi possível iniciar a sincronização");
    } finally {
      setIsLoading(false);
    }
  }

  // Mapear status para texto e cor
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    let text = status;
    let bgColor = "bg-gray-100";
    
    switch (status) {
      case "SUCCESS":
        text = "Sucesso";
        bgColor = "bg-green-100 text-green-800";
        break;
      case "ERROR":
        text = "Erro";
        bgColor = "bg-red-100 text-red-800";
        break;
      case "PENDING":
        text = "Pendente";
        bgColor = "bg-yellow-100 text-yellow-800";
        break;
      case "RUNNING":
        text = "Em execução";
        bgColor = "bg-blue-100 text-blue-800";
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
        {text}
      </span>
    );
  };

  return (
    <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Configurações de Sincronização</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure a sincronização automática com o Gestão Click
        </p>
      </div>
      
      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Status atual */}
          {(lastSync || nextSync || status) && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium mb-2">Status atual</h3>
              <div className="space-y-2 text-sm">
                {status && (
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    {getStatusBadge(status)}
                  </div>
                )}
                
                {lastSync && (
                  <div className="flex items-center justify-between">
                    <span>Última sincronização:</span>
                    <span>{formatDateTimeBR(new Date(lastSync))}</span>
                  </div>
                )}
                
                {nextSync && (
                  <div className="flex items-center justify-between">
                    <span>Próxima sincronização:</span>
                    <span>{formatDateTimeBR(new Date(nextSync))}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Ativar sincronização automática */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div>
              <label htmlFor="autoSync" className="text-base font-medium">Sincronização Automática</label>
              <p className="text-sm text-gray-500 mt-1">
                Ativar sincronização automática de acordo com a frequência definida
              </p>
            </div>
            <div>
              <input
                type="checkbox"
                id="autoSync"
                name="autoSync"
                checked={formValues.autoSync}
                onChange={handleInputChange}
                disabled={isLoading}
                className="h-5 w-5"
              />
            </div>
          </div>
          
          {/* Frequência de sincronização */}
          <div className="space-y-2">
            <label htmlFor="syncFrequency" className="block text-sm font-medium">
              Frequência de Sincronização
            </label>
            <select
              id="syncFrequency"
              name="syncFrequency"
              value={formValues.syncFrequency}
              onChange={handleInputChange}
              disabled={isLoading || !formValues.autoSync}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
              <option value="HOURLY">A cada hora</option>
              <option value="DAILY">Diariamente</option>
              <option value="WEEKLY">Semanalmente</option>
              <option value="MONTHLY">Mensalmente</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Define com que frequência os dados serão sincronizados automaticamente
            </p>
          </div>
          
          {/* Usar credenciais do ambiente */}
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div>
              <label htmlFor="useEnvCredentials" className="text-base font-medium">Usar Variáveis de Ambiente</label>
              <p className="text-sm text-gray-500 mt-1">
                Utilizar credenciais definidas nas variáveis de ambiente
              </p>
            </div>
            <div>
              <input
                type="checkbox"
                id="useEnvCredentials"
                name="useEnvCredentials"
                checked={formValues.useEnvCredentials}
                onChange={handleInputChange}
                disabled={isLoading}
                className="h-5 w-5"
              />
            </div>
          </div>
          
          {/* Credenciais da API */}
          <div className={formValues.useEnvCredentials ? "opacity-50" : ""}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="apiKey" className="block text-sm font-medium">
                  API Key
                </label>
                <input
                  type="text"
                  id="apiKey"
                  name="apiKey"
                  placeholder="Chave de API"
                  value={formValues.apiKey}
                  onChange={handleInputChange}
                  disabled={isLoading || formValues.useEnvCredentials}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="secretToken" className="block text-sm font-medium">
                  Secret Token
                </label>
                <input
                  type="password"
                  id="secretToken"
                  name="secretToken"
                  placeholder="Token secreto"
                  value={formValues.secretToken}
                  onChange={handleInputChange}
                  disabled={isLoading || formValues.useEnvCredentials}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <label htmlFor="apiUrl" className="block text-sm font-medium">
                URL da API
              </label>
              <input
                type="text"
                id="apiUrl"
                name="apiUrl"
                placeholder="URL da API"
                value={formValues.apiUrl}
                onChange={handleInputChange}
                disabled={isLoading || formValues.useEnvCredentials}
                className="w-full p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500">
                Por padrão: https://api.beteltecnologia.com.br
              </p>
            </div>
            
            <div className="space-y-2 mt-4">
              <label htmlFor="authMethod" className="block text-sm font-medium">
                Método de Autenticação
              </label>
              <select
                id="authMethod"
                name="authMethod"
                value={formValues.authMethod}
                onChange={handleInputChange}
                disabled={isLoading || formValues.useEnvCredentials}
                className="w-full p-2 border rounded-md"
              >
                <option value="token">Token (Padrão)</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="api-key">API Key</option>
                <option value="url-params">Parâmetros de URL</option>
              </select>
              <p className="text-xs text-gray-500">
                Método de autenticação utilizado pela API do Gestão Click
              </p>
            </div>
          </div>
          
          {/* Resultado do teste de conexão */}
          {connectionTestResult && (
            <div className={`p-4 rounded-lg ${connectionTestResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {connectionTestResult.success ? (
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${connectionTestResult.success ? 'text-green-800' : 'text-red-800'}`}>
                    {connectionTestResult.success ? 'Conexão bem-sucedida' : 'Falha na conexão'}
                  </h3>
                  <div className={`mt-2 text-sm ${connectionTestResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    <p>{connectionTestResult.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              type="button" 
              onClick={testConnection} 
              disabled={isLoading || isTesting}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isTesting ? "Testando..." : "Testar Conexão"}
            </button>
            
            <button 
              type="button"
              onClick={runManualSync} 
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Sincronizar Agora
            </button>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? "Salvando..." : "Salvar Configurações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
