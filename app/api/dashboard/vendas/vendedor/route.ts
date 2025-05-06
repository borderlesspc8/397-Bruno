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
    const vendasDoVendedor = vendasResult.vendas.filter(venda => 
      String(venda.vendedor_id) === vendedorId || 
      String(venda.nome_vendedor) === vendedorId ||
      String(venda.vendedor_nome) === vendedorId
    );
    
    // Calcular totais
    const totalVendas = vendasDoVendedor.length;
    const totalValor = vendasDoVendedor.reduce((sum, venda) => sum + parseFloat(venda.valor_total || '0'), 0);

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
