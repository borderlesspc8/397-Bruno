import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
import { GestaoClickClientService } from '@/app/_services/gestao-click-client-service';

// Marcador para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

/**
 * GET /api/gestao-click/vendas/[id]
 * Busca os detalhes de uma venda específica no Gestão Click
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter parâmetros de consulta
    const searchParams = req.nextUrl.searchParams;
    const bypassAuth = searchParams.get('bypass') === 'true' && process.env.NODE_ENV === 'development';
    
    // Informações para debug
    console.log(`[DEBUG] GET /api/gestao-click/vendas/${params.id} - Params: bypass=${bypassAuth}`);

    // Verificar autenticação
    let userId = '1'; // Valor padrão para teste
    let session = null;
    
    if (!bypassAuth) {
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
    const apiKey = process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
    const secretToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
    const apiUrl = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
    
    console.log('[DEBUG] API Key configured:', apiKey ? 'Yes' : 'No', apiKey ? `(${apiKey.substring(0, 5)}...)` : '');
    console.log('[DEBUG] Secret Token configured:', secretToken ? 'Yes' : 'No', secretToken ? `(${secretToken.substring(0, 5)}...)` : '');
    console.log('[DEBUG] API URL:', apiUrl);

    // Verificar se as credenciais são válidas
    if (!apiKey && !bypassAuth) {
      console.log('[DEBUG] Invalid API credentials');
      return NextResponse.json(
        {
          error: 'Credenciais da API inválidas',
          details: 'É necessário configurar GESTAO_CLICK_ACCESS_TOKEN e GESTAO_CLICK_SECRET_ACCESS_TOKEN válidos no ambiente',
          help: 'Verifique as variáveis de ambiente ou adicione ?bypass=true para testes em desenvolvimento',
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV
        },
        { status: 401 }
      );
    }

    // Inicializar o serviço
    const gestaoClickService = new GestaoClickClientService({
      apiKey,
      secretToken,
      apiUrl,
      userId
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
      console.log(`[DEBUG] Buscando detalhes da venda com ID: ${params.id}`);
      
      // Buscar venda no Gestão Click
      const venda = await gestaoClickService.getVendaById(params.id);
      
      if (!venda) {
        return NextResponse.json(
          { error: "Venda não encontrada" },
          { status: 404 }
        );
      }
      
      console.log(`[DEBUG] Venda encontrada: código ${venda.codigo}, cliente ${venda.nome_cliente}`);
      return NextResponse.json(venda);
    } catch (apiError) {
      console.error('[ERROR] Error in API call to Gestão Click:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('[ERROR] Error in sales detail endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar detalhes da venda', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        help: process.env.NODE_ENV === 'development' ? 'Para testes em desenvolvimento, use ?bypass=true' : undefined
      },
      { status: 500 }
    );
  }
} 