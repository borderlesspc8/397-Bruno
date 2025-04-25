import { NextResponse } from 'next/server';
import { GestaoClickClientService } from '@/app/_services/gestao-click-client-service';
import { logger } from '@/app/_services/logger';
import { format } from 'date-fns';
import { gestaoClickConfig } from '@/app/_config/gestao-click';

export async function GET() {
  try {
    // Exibe informações de configuração
    const config = {
      apiUrl: gestaoClickConfig.apiUrl,
      // Mascara os tokens por segurança
      accessToken: `${gestaoClickConfig.accessToken.substring(0, 5)}...${gestaoClickConfig.accessToken.substring(gestaoClickConfig.accessToken.length - 5)}`,
      secretAccessToken: `${gestaoClickConfig.secretAccessToken.substring(0, 5)}...${gestaoClickConfig.secretAccessToken.substring(gestaoClickConfig.secretAccessToken.length - 5)}`,
      timeout: gestaoClickConfig.timeout,
      retryAttempts: gestaoClickConfig.retryAttempts,
      authMethod: gestaoClickConfig.authMethod,
      defaultEndpoint: gestaoClickConfig.defaultEndpoint
    };
    
    logger.info("Configuração do Gestão Click", {
      context: "API_TEST",
      data: config
    });
    
    // Testando múltiplos formatos de autenticação
    const testResults = [];
    
    // Lista de métodos de autenticação para testar
    const authMethodsToTest = ['token', 'bearer', 'api-key', 'basic'];
    
    logger.info(`Testando ${authMethodsToTest.length} métodos de autenticação diferentes`, {
      context: "API_TEST"
    });
    
    // Construir o comando curl equivalente para o método atual configurado
    let curlCommand = "";
    
    switch (gestaoClickConfig.authMethod) {
      case 'bearer':
        curlCommand = `curl -v "${gestaoClickConfig.apiUrl}${gestaoClickConfig.defaultEndpoint}" -H "Authorization: Bearer ${gestaoClickConfig.accessToken.substring(0, 5)}..." -H "X-Secret-Token: ${gestaoClickConfig.secretAccessToken.substring(0, 5)}..." -H "Content-Type: application/json"`;
        break;
      case 'basic':
        curlCommand = `curl -v "${gestaoClickConfig.apiUrl}${gestaoClickConfig.defaultEndpoint}" -H "Authorization: Basic $(echo -n '${gestaoClickConfig.accessToken.substring(0, 5)}...:${gestaoClickConfig.secretAccessToken.substring(0, 5)}...' | base64)" -H "Content-Type: application/json"`;
        break;
      case 'api-key':
        curlCommand = `curl -v "${gestaoClickConfig.apiUrl}${gestaoClickConfig.defaultEndpoint}" -H "X-API-KEY: ${gestaoClickConfig.accessToken.substring(0, 5)}..." -H "X-API-SECRET: ${gestaoClickConfig.secretAccessToken.substring(0, 5)}..." -H "Content-Type: application/json"`;
        break;
      case 'token':
        curlCommand = `curl -v "${gestaoClickConfig.apiUrl}${gestaoClickConfig.defaultEndpoint}" -H "token: ${gestaoClickConfig.accessToken.substring(0, 5)}..." -H "secret: ${gestaoClickConfig.secretAccessToken.substring(0, 5)}..." -H "Content-Type: application/json"`;
        break;
      case 'url-params':
        curlCommand = `curl -v "${gestaoClickConfig.apiUrl}${gestaoClickConfig.defaultEndpoint}?token=${gestaoClickConfig.accessToken.substring(0, 5)}...&secret=${gestaoClickConfig.secretAccessToken.substring(0, 5)}..." -H "Content-Type: application/json"`;
        break;
    }
    
    // Testa conexão direta com curl (simulação)
    let curlResult = {
      command: curlCommand,
      success: false,
      response: ""
    };
    
    // Tenta obter dados básicos de teste
    let testData = null;
    let testHeaders = {};
    let testStatus = 0;
    let testStatusText = "";
    
    try {
      logger.info("Realizando teste direto da API", {
        context: "API_TEST",
        data: {
          url: `${gestaoClickConfig.apiUrl}${gestaoClickConfig.defaultEndpoint}`,
          authMethod: gestaoClickConfig.authMethod
        }
      });
      
      // Criar instância do serviço
      const gestaoClickService = new GestaoClickClientService();
      
      // Gerar URL adequada baseada no método de autenticação
      const buildApiUrl = () => {
        if (gestaoClickConfig.authMethod === 'url-params') {
          const url = new URL(`${gestaoClickConfig.apiUrl}${gestaoClickConfig.defaultEndpoint}`);
          url.searchParams.append('token', gestaoClickConfig.accessToken);
          url.searchParams.append('secret', gestaoClickConfig.secretAccessToken);
          return url.toString();
        }
        return `${gestaoClickConfig.apiUrl}${gestaoClickConfig.defaultEndpoint}`;
      };
      
      // Obter cabeçalhos adequados baseados no método de autenticação
      const getApiHeaders = () => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        switch (gestaoClickConfig.authMethod) {
          case 'bearer':
            headers['Authorization'] = `Bearer ${gestaoClickConfig.accessToken}`;
            headers['X-Secret-Token'] = gestaoClickConfig.secretAccessToken;
            break;
          case 'basic':
            const basicAuthToken = Buffer.from(`${gestaoClickConfig.accessToken}:${gestaoClickConfig.secretAccessToken}`).toString('base64');
            headers['Authorization'] = `Basic ${basicAuthToken}`;
            break;
          case 'api-key':
            headers['X-API-KEY'] = gestaoClickConfig.accessToken;
            headers['X-API-SECRET'] = gestaoClickConfig.secretAccessToken;
            break;
          case 'token':
            headers['access-token'] = gestaoClickConfig.accessToken;
            headers['secret-access-token'] = gestaoClickConfig.secretAccessToken;
            break;
        }
        
        return headers;
      };
      
      // Log dos headers (mascarados)
      const maskedHeaders = { ...getApiHeaders() };
      for (const key in maskedHeaders) {
        if (typeof maskedHeaders[key] === 'string' && maskedHeaders[key].length > 10) {
          maskedHeaders[key] = maskedHeaders[key].substring(0, 5) + '...' + maskedHeaders[key].substring(maskedHeaders[key].length - 5);
        }
      }
      
      logger.info("Headers para teste direto:", {
        context: "API_TEST",
        data: maskedHeaders
      });
      
      // Faz a requisição
      const testResult = await fetch(buildApiUrl(), {
        method: 'GET',
        headers: getApiHeaders()
      });
      
      testStatus = testResult.status;
      testStatusText = testResult.statusText;
      testHeaders = Object.fromEntries(testResult.headers.entries());
      
      try {
        testData = await testResult.text();
        curlResult.success = testResult.ok;
        curlResult.response = testData.substring(0, 500);
      } catch (e) {
        testData = "(Erro ao ler resposta)";
        curlResult.response = `Erro ao ler resposta: ${e instanceof Error ? e.message : String(e)}`;
      }
      
      logger.info("Teste direto da API concluído", {
        context: "API_TEST",
        data: {
          status: testStatus,
          statusText: testStatusText,
          headers: testHeaders,
          body: testData?.substring(0, 200) || "(vazio)"
        }
      });
    } catch (testError) {
      curlResult.response = `Erro na requisição: ${testError instanceof Error ? testError.message : String(testError)}`;
      
      logger.error("Erro no teste direto", {
        context: "API_TEST",
        data: testError instanceof Error 
          ? { message: testError.message, stack: testError.stack } 
          : String(testError)
      });
    }
    
    // Testa a conexão com a API usando o serviço
    const gestaoClickService = new GestaoClickClientService();
    const isConnected = await gestaoClickService.testConnection();
    
    if (!isConnected) {
      logger.error("Conexão com Gestão Click falhou", {
        context: "API_TEST",
      });
      
      return NextResponse.json({
        success: false,
        message: "Falha na conexão com Gestão Click",
        config,
        curlTest: curlResult,
        directTest: {
          status: testStatus,
          statusText: testStatusText,
          headers: testHeaders,
          response: testData?.substring(0, 1000) || "(vazio)"
        }
      }, { status: 500 });
    }
    
    // Se conectou com sucesso, tenta buscar vendas do mês atual
    const today = new Date();
    const startDate = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
    const endDate = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd');
    
    const filtros = {
      data_inicio: startDate,
      data_fim: endDate
    };
    
    logger.info("Buscando vendas no Gestão Click", {
      context: "API_TEST",
      data: filtros
    });
    
    // Tenta buscar vendas
    let vendasResult;
    try {
      const vendas = await gestaoClickService.getVendas(filtros);
      vendasResult = {
        meta: vendas.meta,
        count: vendas.data.length,
        data: vendas.data.slice(0, 3) // Limita a 3 registros para não sobrecarregar a resposta
      };
    } catch (vendasError) {
      vendasResult = {
        error: vendasError instanceof Error ? vendasError.message : String(vendasError),
        meta: null,
        count: 0,
        data: []
      };
    }
    
    return NextResponse.json({
      success: true,
      connection: isConnected,
      config,
      curlTest: curlResult,
      directTest: {
        status: testStatus,
        statusText: testStatusText,
        headers: testHeaders,
        response: testData?.substring(0, 500) || "(vazio)"
      },
      date: {
        startDate,
        endDate
      },
      vendas: vendasResult
    });
    
  } catch (error) {
    logger.error("Erro ao testar Gestão Click", {
      context: "API_TEST",
      data: error instanceof Error 
        ? { message: error.message, stack: error.stack } 
        : String(error)
    });
    
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
      error: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 