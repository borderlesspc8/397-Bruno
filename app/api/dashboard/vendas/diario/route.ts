import { NextRequest, NextResponse } from 'next/server';
import { processarDatasURL } from '@/app/_utils/dates';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


/**
 * @api {get} /api/dashboard/vendas/diario Buscar vendas por dia
 * @apiDescription Endpoint para buscar vendas agrupadas por dia no período
 * 
 * @apiParam {String} dataInicio Data inicial no formato ISO ou dd/MM/yyyy
 * @apiParam {String} dataFim Data final no formato ISO ou dd/MM/yyyy
 * 
 * @apiSuccess {Object[]} vendasPorDia Lista de vendas agrupadas por dia
 * @apiSuccess {String} vendasPorDia.data Data no formato ISO
 * @apiSuccess {Number} vendasPorDia.totalVendas Total de vendas no dia
 * @apiSuccess {Number} vendasPorDia.totalValor Valor total das vendas no dia
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Validar e processar parâmetros de data
    const resultadoDatas = processarDatasURL(dataInicio, dataFim);
    
    // Se houve erro no processamento das datas
    if (!resultadoDatas.success) {
      return NextResponse.json(
        { 
          erro: resultadoDatas.error,
          vendasPorDia: []
        },
        { status: 400 }
      );
    }

    console.log(`Buscando vendas diárias no período de ${dataInicio} até ${dataFim}`);

    // Buscar todas as vendas no período
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });

    // Agrupar vendas por dia
    const vendasAgrupadas = new Map<string, { totalVendas: number; totalValor: number }>();
    
    vendasResult.vendas.forEach((venda: any) => {
      // Formatar a data para apenas o dia (sem a hora)
      const dataVenda = venda.data || venda.data_inclusao || venda.data_venda;
      if (!dataVenda) return; // Ignorar vendas sem data
      
      // Extrair apenas a parte da data (YYYY-MM-DD)
      const dataSemHora = new Date(dataVenda).toISOString().split('T')[0];
      
      // Converter o valor para número
      const valorVenda = typeof venda.valor_total === 'string' 
        ? parseFloat(venda.valor_total) 
        : Number(venda.valor_total) || 0;
      
      // Adicionar à contagem
      if (vendasAgrupadas.has(dataSemHora)) {
        const dadosExistentes = vendasAgrupadas.get(dataSemHora)!;
        vendasAgrupadas.set(dataSemHora, {
          totalVendas: dadosExistentes.totalVendas + 1,
          totalValor: dadosExistentes.totalValor + valorVenda
        });
      } else {
        vendasAgrupadas.set(dataSemHora, {
          totalVendas: 1,
          totalValor: valorVenda
        });
      }
    });
    
    // Converter o Map para um array para a resposta
    const vendasPorDia = Array.from(vendasAgrupadas.entries()).map(([data, dados]) => ({
      data,
      totalVendas: dados.totalVendas,
      totalValor: dados.totalValor
    }));
    
    // Ordenar por data
    vendasPorDia.sort((a, b) => a.data.localeCompare(b.data));
    
    console.log(`Processadas ${vendasPorDia.length} datas com vendas no período`);

    // Retornar resultados
    return NextResponse.json({
      vendasPorDia
    });
  } catch (error) {
    console.error('Erro ao processar requisição de vendas diárias:', error);
    return NextResponse.json(
      { 
        erro: `Erro interno ao processar requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        vendasPorDia: []
      },
      { status: 500 }
    );
  }
} 
