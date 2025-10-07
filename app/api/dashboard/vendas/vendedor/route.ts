import { NextRequest, NextResponse } from 'next/server';
import { processarDatasURL } from '@/app/_utils/dates';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


/**
 * @api {get} /api/dashboard/vendas/vendedor Buscar vendas por vendedor
 * @apiDescription Endpoint para buscar vendas de um vendedor específico no período
 * 
 * @apiParam {String} dataInicio Data inicial no formato ISO ou dd/MM/yyyy
 * @apiParam {String} dataFim Data final no formato ISO ou dd/MM/yyyy
 * @apiParam {String} vendedorId ID do vendedor
 * 
 * @apiSuccess {Object[]} vendas Lista de vendas do vendedor
 * @apiSuccess {Number} totalVendas Total de vendas
 * @apiSuccess {Number} totalValor Total do valor das vendas
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const vendedorId = searchParams.get('vendedorId');

    // Validar parâmetros
    if (!vendedorId) {
      return NextResponse.json(
        { 
          erro: 'ID do vendedor é obrigatório',
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 400 }
      );
    }

    // Validar e processar parâmetros de data
    const resultadoDatas = processarDatasURL(dataInicio, dataFim);
    
    // Log para debug das datas
    console.log('🔍 [API Vendas Vendedor] Datas recebidas:', {
      dataInicio,
      dataFim,
      dataInicioProcessada: resultadoDatas.dataInicio?.toISOString(),
      dataFimProcessada: resultadoDatas.dataFim?.toISOString(),
      vendedorId
    });
    
    // Se houve erro no processamento das datas
    if (!resultadoDatas.success) {
      return NextResponse.json(
        { 
          erro: resultadoDatas.error,
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 400 }
      );
    }

    // Buscar todas as vendas no período
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });

    if (vendasResult.erro) {
      return NextResponse.json(
        { 
          erro: `Erro ao buscar vendas: ${vendasResult.erro}`,
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 500 }
      );
    }

    // Filtrar apenas as vendas do vendedor especificado
    // Normalizar o vendedorId para comparação
    const vendedorIdNormalizado = vendedorId.replace('gc-', ''); // Remove prefixo se existir
    
    const vendasDoVendedor = vendasResult.vendas.filter(venda => {
      // Comparar por ID do vendedor (removendo prefixo se existir)
      const vendaVendedorId = String(venda.vendedor_id || '').replace('gc-', '');
      const vendaNomeVendedor = String(venda.nome_vendedor || '').toLowerCase().trim();
      const vendaVendedorNome = String(venda.vendedor_nome || '').toLowerCase().trim();
      const vendedorIdLower = vendedorIdNormalizado.toLowerCase().trim();
      
      // Log para debug
      if (vendasResult.vendas.indexOf(venda) < 3) {
        console.log('🔍 Comparando venda:', {
          vendaId: venda.id,
          vendaVendedorId,
          vendaNomeVendedor,
          vendaVendedorNome,
          vendedorIdNormalizado,
          matchId: vendaVendedorId === vendedorIdNormalizado,
          matchNome: vendaNomeVendedor === vendedorIdLower || vendaVendedorNome === vendedorIdLower
        });
      }
      
      return vendaVendedorId === vendedorIdNormalizado || 
             vendaNomeVendedor === vendedorIdLower ||
             vendaVendedorNome === vendedorIdLower ||
             // Comparação adicional por nome completo (caso o ID não bata)
             vendaNomeVendedor.includes(vendedorIdLower) ||
             vendaVendedorNome.includes(vendedorIdLower);
    });
    
    // Calcular totais
    const totalVendas = vendasDoVendedor.length;
    const totalValor = vendasDoVendedor.reduce((sum, venda) => sum + parseFloat(venda.valor_total || '0'), 0);

    // Log para debug dos resultados
    console.log('✅ [API Vendas Vendedor] Resultados encontrados:', {
      vendedorId,
      totalVendasEncontradas: vendasDoVendedor.length,
      totalValor,
      periodo: `${resultadoDatas.dataInicio?.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} até ${resultadoDatas.dataFim?.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
      periodoISO: `${resultadoDatas.dataInicio?.toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })} até ${resultadoDatas.dataFim?.toLocaleString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })}`,
      periodoISOUTC: `${resultadoDatas.dataInicio?.toISOString()} até ${resultadoDatas.dataFim?.toISOString()}`,
      primeirasVendas: vendasDoVendedor.slice(0, 3).map(v => ({
        id: v.id,
        data: v.data,
        dataFormatada: v.data ? new Date(v.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'N/A',
        cliente: v.cliente,
        valor_total: v.valor_total
      }))
    });

    // Retornar resultados
    return NextResponse.json({
      vendas: vendasDoVendedor,
      totalVendas,
      totalValor
    });
  } catch (error) {
    console.error('Erro ao processar requisição de vendas por vendedor:', error);
    return NextResponse.json(
      { 
        erro: `Erro interno ao processar requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        vendas: [],
        totalVendas: 0,
        totalValor: 0
      },
      { status: 500 }
    );
  }
} 
