/**
 * 🔍 PÁGINA DE DIAGNÓSTICO - DASHBOARD CEO
 * 
 * Mostra resultado do teste de TODAS as 25 APIs
 * Com estrutura real dos dados
 */

'use client';

import React, { useEffect, useState } from 'react';

interface DiagnosticoAPI {
  endpoint: string;
  status: 'success' | 'error';
  temDados: boolean;
  totalRegistros: number;
  exemplo: any;
  campos: string[];
  erro?: string;
}

interface Resultado {
  success: boolean;
  timestamp: string;
  periodo: { inicio: string; fim: string };
  resumo: {
    totalAPIs: number;
    apisComSucesso: number;
    apisComDados: number;
    apisComErro: number;
    percentualSucesso: string;
  };
  resultados: DiagnosticoAPI[];
  credenciais: {
    apiUrl: string;
    temAccessToken: boolean;
    temSecretToken: boolean;
  };
}

export default function DiagnosticoPage() {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDiagnostico() {
      try {
        setLoading(true);
        const response = await fetch('/api/ceo/diagnostico-completo');
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setResultado(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    carregarDiagnostico();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Testando 25 APIs da Betel...</p>
          <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!resultado) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Diagnóstico Completo - APIs Betel
          </h1>
          <p className="text-gray-600">
            Teste de todas as 25 APIs para identificar estrutura real dos dados
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>⏰ {new Date(resultado.timestamp).toLocaleString('pt-BR')}</span>
            <span>📅 Período: {resultado.periodo.inicio} a {resultado.periodo.fim}</span>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">Total de APIs</p>
            <p className="text-3xl font-bold text-blue-900">{resultado.resumo.totalAPIs}</p>
          </div>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">Com Sucesso</p>
            <p className="text-3xl font-bold text-green-900">{resultado.resumo.apisComSucesso}</p>
            <p className="text-xs text-green-600 mt-1">{resultado.resumo.percentualSucesso}</p>
          </div>
          
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-600 mb-1">Com Dados</p>
            <p className="text-3xl font-bold text-yellow-900">{resultado.resumo.apisComDados}</p>
          </div>
          
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-1">Com Erro</p>
            <p className="text-3xl font-bold text-red-900">{resultado.resumo.apisComErro}</p>
          </div>
        </div>

        {/* Credenciais */}
        <div className="bg-gray-800 text-white rounded-lg p-4 mb-6 font-mono text-sm">
          <p className="font-bold mb-2">🔑 Credenciais:</p>
          <p>API URL: {resultado.credenciais.apiUrl}</p>
          <p>Access Token: {resultado.credenciais.temAccessToken ? '✅ Configurado' : '❌ Ausente'}</p>
          <p>Secret Token: {resultado.credenciais.temSecretToken ? '✅ Configurado' : '❌ Ausente'}</p>
        </div>

        {/* Resultados por API */}
        <div className="space-y-4">
          {resultado.resultados.map((api, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-sm overflow-hidden border-l-4 ${
                api.status === 'success' ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {api.status === 'success' ? '✅' : '❌'} {api.endpoint}
                  </h3>
                  <div className="flex items-center gap-2">
                    {api.temDados && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {api.totalRegistros} registro(s)
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      api.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {api.status === 'success' ? 'Sucesso' : 'Erro'}
                    </span>
                  </div>
                </div>

                {api.erro && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                    <p className="text-red-800 text-sm font-mono">{api.erro}</p>
                  </div>
                )}

                {api.campos.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">📋 Campos Disponíveis ({api.campos.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {api.campos.map((campo, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono"
                        >
                          {campo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {api.exemplo && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-blue-600">
                      📄 Ver Exemplo de Dados
                    </summary>
                    <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-xs">
                      {JSON.stringify(api.exemplo, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard/ceo"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            ← Voltar para Dashboard CEO
          </a>
        </div>
      </div>
    </div>
  );
}



