import { NextResponse } from 'next/server';
import { logger } from '@/app/_services/logger';
import { gestaoClickConfig } from '@/app/_config/gestao-click';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    // Lista de endpoints para testar
    const endpoints = [
      "/api/status",
      "/api/vendas",
      "/vendas",
      "/api/v1/vendas",
      "/api/v1/status"
    ];
    
    // Formatos de autenticação para testar
    const authFormats = [
      {
        name: "Headers (X-API-KEY + X-API-SECRET)",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": gestaoClickConfig.accessToken,
          "X-API-SECRET": gestaoClickConfig.secretAccessToken
        },
        url: (endpoint: string) => `${gestaoClickConfig.apiUrl}${endpoint}`
      },
      {
        name: "Headers (Authorization Bearer + X-Secret-Token)",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${gestaoClickConfig.accessToken}`,
          "X-Secret-Token": gestaoClickConfig.secretAccessToken
        },
        url: (endpoint: string) => `${gestaoClickConfig.apiUrl}${endpoint}`
      },
      {
        name: "Headers (API Key Auth)",
        headers: {
          "Content-Type": "application/json",
          "API-Key": gestaoClickConfig.accessToken,
          "API-Secret": gestaoClickConfig.secretAccessToken
        },
        url: (endpoint: string) => `${gestaoClickConfig.apiUrl}${endpoint}`
      },
      {
        name: "URL Params",
        headers: {
          "Content-Type": "application/json"
        },
        url: (endpoint: string) => {
          const url = new URL(`${gestaoClickConfig.apiUrl}${endpoint}`);
          url.searchParams.append('api_key', gestaoClickConfig.accessToken);
          url.searchParams.append('api_secret', gestaoClickConfig.secretAccessToken);
          return url.toString();
        }
      },
      {
        name: "URL Params (access_token)",
        headers: {
          "Content-Type": "application/json"
        },
        url: (endpoint: string) => {
          const url = new URL(`${gestaoClickConfig.apiUrl}${endpoint}`);
          url.searchParams.append('access_token', gestaoClickConfig.accessToken);
          url.searchParams.append('secret_token', gestaoClickConfig.secretAccessToken);
          return url.toString();
        }
      }
    ];
    
    // Testar todas as combinações
    const results = [];
    
    for (const endpoint of endpoints) {
      for (const authFormat of authFormats) {
        try {
          const url = authFormat.url(endpoint);
          logger.info(`Tentando conexão: ${authFormat.name} em ${endpoint}`, {
            context: "CONNECT_TEST",
            data: {
              url,
              headers: Object.keys(authFormat.headers)
            }
          });
          
          // Usar somente as propriedades definidas para evitar problemas de tipo
          const headerEntries = Object.entries(authFormat.headers).filter(([_, value]) => value !== undefined);
          const validHeaders = Object.fromEntries(headerEntries);
          
          const response = await fetch(url, {
            method: 'GET',
            headers: validHeaders
          });
          
          const responseText = await response.text();
          let responseData;
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            responseData = { parseError: true, text: responseText.substring(0, 100) };
          }
          
          results.push({
            endpoint,
            authFormat: authFormat.name,
            url,
            status: response.status,
            statusText: response.statusText,
            success: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
          });
          
          // Se encontrou uma combinação que funciona, podemos registrar isso
          if (response.ok) {
            logger.info(`✅ Conexão bem-sucedida: ${authFormat.name} em ${endpoint}`, {
              context: "CONNECT_TEST"
            });
          }
        } catch (error) {
          results.push({
            endpoint,
            authFormat: authFormat.name,
            error: error instanceof Error ? error.message : String(error),
            success: false
          });
        }
      }
    }
    
    // Encontrar qualquer combinação que tenha funcionado
    const successfulConnections = results.filter(r => r.success);
    
    return NextResponse.json({
      configDetails: {
        apiUrl: gestaoClickConfig.apiUrl,
        accessTokenLength: gestaoClickConfig.accessToken.length,
        secretTokenLength: gestaoClickConfig.secretAccessToken.length
      },
      successfulConnections: successfulConnections.length > 0,
      recommendedConfig: successfulConnections.length > 0 ? {
        endpoint: successfulConnections[0].endpoint,
        authFormat: successfulConnections[0].authFormat
      } : null,
      results
    });
  } catch (error) {
    logger.error('Erro ao testar conexão', {
      context: "CONNECT_TEST",
      data: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
    });
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido ao testar conexão',
      error: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 
