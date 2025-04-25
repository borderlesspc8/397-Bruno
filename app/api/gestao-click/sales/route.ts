/**
 * API para gerenciar vendas e parcelamentos do Gestão Click
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
import { GestaoClickClientService } from '@/app/_services/gestao-click-client-service';
import { GestaoClickVendaFiltros } from '@/app/_types/gestao-click';
import { GestaoClickService } from "@/app/_services/gestao-click-service";
import { InstallmentService } from "@/app/_services/installment-service";
import { GestaoClickSale } from "@/app/_types/transaction";

// Marcador para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

/**
 * GET /api/gestao-click/sales
 * Lista todas as vendas do Gestão Click
 */
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros de consulta
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const bypassAuth = searchParams.get('bypass') === 'true' && process.env.NODE_ENV === 'development';
    
    // Informações para debug
    console.log(`[DEBUG] GET /api/gestao-click/sales - Params: page=${page}, limit=${limit}, bypass=${bypassAuth}`);

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
    
    // Parâmetros de filtro
    const filtros: GestaoClickVendaFiltros = {};
    
    // Filtros opcionais
    if (searchParams.has('loja_id')) filtros.loja_id = searchParams.get('loja_id') as string;
    if (searchParams.has('codigo')) filtros.codigo = searchParams.get('codigo') as string;
    if (searchParams.has('nome')) filtros.nome = searchParams.get('nome') as string;
    if (searchParams.has('situacao_id')) filtros.situacao_id = searchParams.get('situacao_id') as string;
    
    // Tratamento específico para datas, garantindo que sejam tratadas exatamente
    if (searchParams.has('data_inicio')) {
      filtros.data_inicio = searchParams.get('data_inicio') as string;
      // Certificar que a hora seja definida como início do dia (00:00:00)
      console.log(`[DEBUG] Data início original: ${filtros.data_inicio}`);
    }
    
    if (searchParams.has('data_fim')) {
      filtros.data_fim = searchParams.get('data_fim') as string;
      // Certificar que a hora seja definida como fim do dia (23:59:59)
      console.log(`[DEBUG] Data fim original: ${filtros.data_fim}`);
    }
    
    if (searchParams.has('cliente_id')) filtros.cliente_id = searchParams.get('cliente_id') as string;
    if (searchParams.has('centro_custo_id')) filtros.centro_custo_id = searchParams.get('centro_custo_id') as string;
    
    // Log de filtros para depuração
    console.log('[DEBUG] Filtros aplicados:', JSON.stringify(filtros));

    // Buscar configurações do Gestão Click usando os mesmos nomes de variáveis do auto-import
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
      console.log('[DEBUG] Calling GestaoClickClientService.getVendas()');
      // Buscar vendas do Gestão Click
      const result = await gestaoClickService.getVendas(filtros, page, limit);
      console.log(`[DEBUG] API returned data for sales query`);
      
      // Calcular somatório das vendas
      let somatorioPeriodo = 0;
      if (result.data && Array.isArray(result.data)) {
        const dataInicio = filtros.data_inicio ? new Date(filtros.data_inicio) : null;
        const dataFim = filtros.data_fim ? new Date(filtros.data_fim) : null;
        
        // Ajuste para considerar o final do dia para data_fim
        if (dataFim) {
          dataFim.setHours(23, 59, 59, 999);
        }
        
        // Filtrar vendas que estão realmente dentro do período antes de somar
        const vendasFiltradas = result.data.filter(venda => {
          const dataVenda = new Date(venda.data);
          
          // Se tem data de início e a venda é anterior, filtrar
          if (dataInicio && dataVenda < dataInicio) {
            console.log(`[DEBUG] Excluindo venda ${venda.id} com data ${venda.data} do somatório - anterior ao período`);
            return false;
          }
          
          // Se tem data de fim e a venda é posterior, filtrar
          if (dataFim && dataVenda > dataFim) {
            console.log(`[DEBUG] Excluindo venda ${venda.id} com data ${venda.data} do somatório - posterior ao período`);
            return false;
          }
          
          return true;
        });
        
        console.log(`[DEBUG] ${vendasFiltradas.length} de ${result.data.length} vendas incluídas no somatório após filtro de data`);
        
        somatorioPeriodo = vendasFiltradas.reduce((sum, venda) => {
          // Certifica-se de que valor_total seja tratado como número
          const valorVenda = parseFloat(venda.valor_total || '0');
          return sum + (isNaN(valorVenda) ? 0 : valorVenda);
        }, 0);
      }
      
      // Adicionar somatório ao resultado
      const resultWithSummary = {
        ...result,
        summary: {
          somatorioPeriodo,
          periodoInicio: filtros.data_inicio || null,
          periodoFim: filtros.data_fim || null,
          totalRegistros: result.meta?.total_registros || result.meta?.total || 0,
          moeda: 'BRL'
        }
      };
      
      console.log(`[DEBUG] Somatório do período: ${somatorioPeriodo}`);
      return NextResponse.json(resultWithSummary);
    } catch (apiError) {
      console.error('[ERROR] Error in API call to Gestão Click:', apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Erro ao buscar vendas do Gestão Click:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar vendas', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        help: process.env.NODE_ENV === 'development' ? 'Para testes em desenvolvimento, use ?bypass=true' : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gestao-click/sales/:id
 * Busca uma venda específica do Gestão Click
 */
export async function GET_SALE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    // Buscar configurações do Gestão Click
    const userId = session.user.id;
    const apiKey = process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
    const secretToken = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
    const apiUrl = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';

    // Inicializar o serviço
    const gestaoClickService = new GestaoClickClientService({
      apiKey,
      secretToken,
      apiUrl,
      userId
    });

    // Buscar venda específica
    const result = await gestaoClickService.getVendaById(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Erro ao buscar venda do Gestão Click:`, error);
    return NextResponse.json(
      { error: 'Erro ao buscar venda', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 