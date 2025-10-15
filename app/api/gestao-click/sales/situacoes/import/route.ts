import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
import { GestaoClickClientService } from '@/app/_services/gestao-click-client-service';

// Marcador para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

/**
 * POST /api/gestao-click/sales/situacoes/import
 * Importa situações de vendas do Gestão Click para o banco de dados
 */
export async function POST(req: NextRequest) {
  try {
    // Obter corpo da requisição
    const body = await req.json().catch(() => ({}));
    const useTestData = body.test === true;
    const bypassAuth = body.bypass === true && process.env.NODE_ENV === 'development';
    
    console.log(`[DEBUG] POST /api/gestao-click/sales/situacoes/import - Params: test=${useTestData}, bypass=${bypassAuth}`);

    // Verificar autenticação
    let userId = '1'; // Valor padrão para teste
    let session = null;
    
    if (!bypassAuth) {
      // Verificar autenticação
      session = await getAuthSession();
      console.log(`[DEBUG] Session check: ${session ? 'Session found' : 'No session'}, User ID: ${session?.user?.id || 'N/A'}`);
      
      if (!session?.user?.id) {
        console.log('[DEBUG] Authentication failed: No valid session found');
        return NextResponse.json(
          { 
            error: 'Não autorizado',
            message: 'Sessão de usuário não encontrada ou inválida. Faça login novamente.',
            timestamp: new Date().toISOString()
          },
          { status: 401 }
        );
      }
      
      userId = session.user.id;
    } else {
      console.log('[DEBUG] Bypassing authentication for development testing');
    }

    // Buscar configurações do Gestão Click
    const accessToken = process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
    const secretAccessToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
    const apiUrl = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
    
    console.log('[DEBUG] API Key configured:', accessToken ? 'Yes' : 'No', 'Secret Token configured:', secretAccessToken ? 'Yes' : 'No');
    console.log('[GESTAO_CLICK_CONFIG] Configurações para importação de situações:', {
      apiUrl,
      accessToken: accessToken ? accessToken.substring(0, 6) + '...' : 'não definido',
      secretAccessToken: secretAccessToken ? secretAccessToken.substring(0, 6) + '...' : 'não definido',
    });

    // Verificar se as credenciais são válidas
    if (!accessToken && !bypassAuth) {
      return NextResponse.json(
        {
          error: 'Credenciais da API inválidas',
          details: 'É necessário configurar GESTAO_CLICK_ACCESS_TOKEN e GESTAO_CLICK_SECRET_ACCESS_TOKEN válidos no ambiente',
          help: 'Verifique as variáveis de ambiente ou adicione "bypass": true no corpo da requisição para testes em desenvolvimento',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        },
        { status: 401 }
      );
    }

    // Inicializar o serviço
    const gestaoClickService = new GestaoClickClientService({
      apiKey: accessToken,
      secretToken: secretAccessToken,
      apiUrl,
      userId,
      authMethod: 'token'
    });

    // Testar a conexão antes de prosseguir
    try {
      console.log('[DEBUG] Testando conexão com a API...');
      const connectionTestResult = await gestaoClickService.testConnection();
      if (!connectionTestResult) {
        // Em ambiente de desenvolvimento, continuamos mesmo se o teste falhar
        if (process.env.NODE_ENV === 'development') {
          console.warn("[DEBUG] Aviso: Teste de conexão falhou, mas continuando em ambiente de desenvolvimento");
        } else {
          return NextResponse.json(
            { error: "Não foi possível conectar à API do Gestão Click" },
            { status: 400 }
          );
        }
      } else {
        console.log('[DEBUG] Conexão com API bem-sucedida');
      }
    } catch (error: any) {
      // Em ambiente de desenvolvimento, continuamos mesmo se o teste falhar
      if (process.env.NODE_ENV === 'development') {
        console.warn("[DEBUG] Aviso: Erro ao testar conexão, mas continuando em ambiente de desenvolvimento:", error.message);
      } else {
        return NextResponse.json(
          { error: "Erro ao testar conexão com a API", message: error.message },
          { status: 400 }
        );
      }
    }

    try {
      console.log('[DEBUG] Calling GestaoClickClientService.importSituacoesVendas()');
      
      // Definir um timeout para a operação de importação (60 segundos)
      const IMPORT_TIMEOUT = 60000;
      let importResult: any = null;
      let timeoutError = false;
      
      // Criar uma Promise com timeout
      const importPromise = Promise.race([
        // Promise da operação de importação
        (async () => {
          // Importar situações de vendas do Gestão Click
          let result;
          
          if (useTestData) {
            console.log('[DEBUG] Usando dados de teste, não realizando importação real');
            // Retornar dados de teste para simular sucesso
            result = {
              imported: 4,
              skipped: 1,
              errors: 0,
              details: [
                { id: "101", name: "Situação teste 1", action: "imported" },
                { id: "102", name: "Situação teste 2", action: "imported" },
                { id: "103", name: "Situação teste 3", action: "imported" },
                { id: "104", name: "Situação teste 4", action: "imported" },
                { id: "105", name: "Situação teste 5", action: "skipped" }
              ]
            };
          } else {
            // Importação real
            result = await gestaoClickService.importSituacoesVendas();
          }
          
          return result;
        })(),
        
        // Promise de timeout
        new Promise((_, reject) => {
          setTimeout(() => {
            timeoutError = true;
            reject(new Error(`A operação de importação excedeu o limite de ${IMPORT_TIMEOUT/1000} segundos`));
          }, IMPORT_TIMEOUT);
        })
      ]);
      
      try {
        importResult = await importPromise;
        console.log(`[DEBUG] Import result: ${importResult.imported} imported, ${importResult.skipped} skipped, ${importResult.errors} errors`);
      } catch (timeoutErr) {
        if (timeoutError) {
          console.error('[DEBUG] Importação cancelada por timeout');
          return NextResponse.json({
            error: 'Tempo limite excedido',
            message: `A operação de importação demorou mais de ${IMPORT_TIMEOUT/1000} segundos e foi cancelada.`,
            timestamp: new Date().toISOString()
          }, { status: 408 });
        } else {
          throw timeoutErr;
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Importação concluída. ${importResult.imported} situações importadas, ${importResult.skipped} ignoradas.`,
        result: importResult
      });
    } catch (apiError) {
      console.error('[ERROR] Error in API call to Gestão Click during import:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('[ERROR] Error in sales situations import endpoint:', error);
    return NextResponse.json(
      {
        error: 'Erro ao importar situações de vendas', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        help: process.env.NODE_ENV === 'development' ? 'Para testes em desenvolvimento, use "bypass": true, "test": true no corpo da requisição' : undefined
      },
      { status: 500 }
    );
  }
} 
