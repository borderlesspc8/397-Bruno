import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
import { GestaoClickClientService } from '@/app/_services/gestao-click-client-service';
import { GestaoClickVendaFiltros } from '@/app/_types/gestao-click';
import { addDays, format, isAfter, isBefore, parse, parseISO } from 'date-fns';
import { ReconciliationService } from '@/app/_services/reconciliation-service';

// Marcador para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

/**
 * POST /api/gestao-click/sales/import
 * Importa vendas do Gestão Click para o banco de dados
 */
export async function POST(req: NextRequest) {
  try {
    // Obter dados do corpo da requisição
    const body = await req.json().catch(() => ({}));
    const startDate = body.startDate || '';
    const endDate = body.endDate || '';
    const filtros = body.filtros || {};
    const useTestData = body.test === true;
    const bypassAuth = body.bypass === true && process.env.NODE_ENV === 'development';
    const autoReconcile = body.autoReconcile === true; // Parâmetro para conciliação automática
    
    console.log(`[DEBUG] POST /api/gestao-click/sales/import - Params: startDate=${startDate}, endDate=${endDate}, test=${useTestData}, bypass=${bypassAuth}, autoReconcile=${autoReconcile}`);
    
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
    
    // Validar datas
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'As datas de início e fim são obrigatórias' },
        { status: 400 }
      );
    }
    
    // Validar o intervalo de datas para evitar períodos muito longos
    try {
      const parsedStartDate = parseISO(startDate);
      const parsedEndDate = parseISO(endDate);
      
      if (isAfter(parsedStartDate, parsedEndDate)) {
        return NextResponse.json(
          { error: 'A data de início deve ser anterior à data de fim' },
          { status: 400 }
        );
      }
      
      // Limitar o intervalo a no máximo 31 dias
      const MAX_DAYS = 31;
      const maxEndDate = addDays(parsedStartDate, MAX_DAYS);
      
      if (isAfter(parsedEndDate, maxEndDate)) {
        const formattedMaxDate = format(maxEndDate, 'yyyy-MM-dd');
        return NextResponse.json(
          { 
            error: `O período máximo permitido é de ${MAX_DAYS} dias. Por favor, utilize um intervalo menor.`,
            suggestedEndDate: formattedMaxDate
          },
          { status: 400 }
        );
      }
    } catch (dateError) {
      return NextResponse.json(
        { error: 'Formato de data inválido. Use o formato YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Buscar configurações do Gestão Click
    const accessToken = process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
    const secretAccessToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
    const apiUrl = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
    
    console.log('[DEBUG] API Key configured:', accessToken ? 'Yes' : 'No', 'Secret Token configured:', secretAccessToken ? 'Yes' : 'No');
    console.log('[GESTAO_CLICK_CONFIG] Configurações antes da validação:', {
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
      console.log('[DEBUG] Calling GestaoClickClientService.importVendas()');
      
      // Definir um timeout para a operação de importação (120 segundos)
      const IMPORT_TIMEOUT = 120000;
      let importResult: any = null;
      let timeoutError = false;
      
      // Criar uma Promise com timeout
      const importPromise = Promise.race([
        // Promise da operação de importação
        (async () => {
          // Importar vendas do Gestão Click
          let result;
          
          if (useTestData) {
            console.log('[DEBUG] Usando dados de teste, não realizando importação real');
            // Retornar dados de teste para simular sucesso
            result = {
              imported: 5,
              skipped: 2,
              errors: 0,
              details: [
                { id: "12345", name: "Venda teste 1", action: "imported" },
                { id: "12346", name: "Venda teste 2", action: "imported" },
                { id: "12347", name: "Venda teste 3", action: "imported" },
                { id: "12348", name: "Venda teste 4", action: "imported" },
                { id: "12349", name: "Venda teste 5", action: "imported" },
                { id: "12350", name: "Venda teste 6", action: "skipped" },
                { id: "12351", name: "Venda teste 7", action: "skipped" }
              ]
            };
          } else {
            // Importação real
            result = await gestaoClickService.importVendas(startDate, endDate, filtros);
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
            message: `A operação de importação demorou mais de ${IMPORT_TIMEOUT/1000} segundos e foi cancelada. Tente um período menor.`,
            timestamp: new Date().toISOString()
          }, { status: 408 });
        } else {
          throw timeoutErr;
        }
      }
      
      // Se opção de conciliação automática estiver ativada, executá-la
      let reconciliationResult = null;
      if (autoReconcile && importResult && importResult.imported > 0) {
        try {
          console.log(`[DEBUG] Iniciando conciliação automática para vendas importadas`);
          reconciliationResult = await ReconciliationService.reconcileSalesAndTransactions({
            userId,
            startDate: parseISO(startDate),
            endDate: parseISO(endDate)
          });
          
          console.log(`[DEBUG] Conciliação automática concluída: ${reconciliationResult.matched} correspondências encontradas de ${reconciliationResult.totalProcessed} processados`);
        } catch (reconciliationError) {
          console.error('[ERROR] Erro durante a conciliação automática:', reconciliationError);
          // Não falhar a importação por causa de erro na conciliação
          reconciliationResult = {
            error: true,
            message: reconciliationError instanceof Error ? reconciliationError.message : String(reconciliationError)
          };
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `Importação concluída. ${importResult.imported} vendas importadas, ${importResult.skipped} ignoradas.`,
        result: importResult,
        reconciliation: reconciliationResult
      });
    } catch (apiError) {
      console.error('[ERROR] Error in API call to Gestão Click during import:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('[ERROR] Error in sales import endpoint:', error);
    return NextResponse.json(
      {
        error: 'Erro ao importar vendas', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        help: process.env.NODE_ENV === 'development' ? 'Para testes em desenvolvimento, use "bypass": true, "test": true no corpo da requisição' : undefined
      },
      { status: 500 }
    );
  }
} 