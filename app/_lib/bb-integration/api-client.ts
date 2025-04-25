import * as https from 'https';
import { Agent } from 'https';

interface RequestOptions {
  hostname?: string;
  path?: string;
  method?: string;
  headers?: Record<string, string>;
  agent?: Agent;
  body?: string;
}

/**
 * Faz uma requisição HTTP para a API do Banco do Brasil
 */
export async function makeRequest<T>(
  context: string,
  url: string,
  method: string,
  headers: Record<string, string>,
  agent: Agent,
  body?: string
): Promise<T> {
  try {
    console.log(`[${context}] Enviando requisição para a API do BB:`, {
      url,
      method,
      hasHeaders: !!headers,
      hasBody: !!body
    });

    console.log(`[${context}] Configuração do agente HTTPS:`, {
      rejectUnauthorized: true,
      hasCert: !!agent['options']?.cert,
      hasKey: !!agent['options']?.key,
      hasCA: !!agent['options']?.ca
    });

    // Extrair o hostname e o path da URL
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const path = urlObj.pathname + urlObj.search;

    console.log(`[${context}] Opções da requisição:`, {
      hostname,
      path,
      method
    });

    // Transformar o objeto headers em uma string para verificação
    const headersStr = JSON.stringify(headers, (key, value) => {
      if (key === 'Authorization' || key === 'gw-dev-app-key' || key === 'X-Application-Key') {
        return '[REDACTED]';
      }
      return value;
    });
    console.log(`[${context}] Headers da requisição: ${headersStr}`);

    // Criar as opções da requisição
    const options: RequestOptions = {
      hostname,
      path,
      method,
      headers,
      agent
    };

    // Fazer a requisição usando uma promise
    return new Promise<T>((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log(`[${context}] Resposta recebida:`, { 
            status: res.statusCode, 
            statusText: res.statusMessage 
          });

          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              // Verificar se o corpo da resposta não está vazio
              if (data.trim() === '') {
                console.log(`[${context}] Corpo da resposta vazio, retornando objeto vazio`);
                resolve({} as T);
                return;
              }

              // Log do tamanho da resposta (não o conteúdo completo para evitar logs muito grandes)
              console.log(`[${context}] Tamanho da resposta: ${data.length} bytes`);
              if (data.length < 1000) {
                console.log(`[${context}] Conteúdo da resposta: ${data}`);
              } else {
                console.log(`[${context}] Primeiros 500 caracteres da resposta: ${data.substring(0, 500)}...`);
              }

              const parsedData = JSON.parse(data);
              resolve(parsedData as T);
            } catch (error: any) {
              console.error(`[${context}_ERROR] Erro ao processar resposta:`, error);
              console.error(`[${context}_ERROR] Corpo da resposta:`, data);
              reject(new Error(`Erro ao processar resposta: ${error.message}`));
            }
          } else {
            console.error(`[${context}_ERROR] Resposta com status de erro: ${res.statusCode}`);
            console.error(`[${context}_ERROR] Corpo da resposta de erro:`, data);
            reject(new Error(`Erro na requisição ${context}: ${res.statusMessage || 'Erro desconhecido'}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error(`[${context}_ERROR] Erro na requisição:`, error);
        reject(new Error(`Erro na requisição ${context}: ${error.message}`));
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  } catch (error: any) {
    console.error(`[${context}_ERROR] Erro inesperado:`, error);
    throw new Error(`Erro inesperado na requisição ${context}: ${error.message}`);
  }
} 