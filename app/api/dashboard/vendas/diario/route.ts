import { NextRequest, NextResponse } from 'next/server';
import { processarDatasURL } from '@/app/_utils/dates';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { format } from 'date-fns';

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
    const debug = searchParams.get('debug') === 'true';

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

    console.log(`Buscando vendas diárias no período de ${resultadoDatas.dataInicio!.toISOString()} até ${resultadoDatas.dataFim!.toISOString()}`);

    // Buscar todas as vendas no período
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });

    if (debug) {
      console.log(`Total de vendas recebidas: ${vendasResult.vendas.length}`);
    }

    // Agrupar vendas por dia
    const vendasAgrupadas = new Map<string, { totalVendas: number; totalValor: number }>();
    
    // Contador para vendas sem data
    let vendasSemData = 0;
    let vendasProcessadas = 0;

    vendasResult.vendas.forEach((venda: any) => {
      try {
        // Tentar extrair a data da venda de vários campos possíveis
        let dataVenda = null;
        
        // Verificar os campos possíveis para data, em ordem de prioridade
        if (venda.data && typeof venda.data === 'string' && venda.data.trim() !== '') {
          dataVenda = venda.data;
        } else if (venda.data_venda && typeof venda.data_venda === 'string' && venda.data_venda.trim() !== '') {
          dataVenda = venda.data_venda;
        } else if (venda.data_inclusao && typeof venda.data_inclusao === 'string' && venda.data_inclusao.trim() !== '') {
          dataVenda = venda.data_inclusao;
        }
        
        // Se não encontrou data válida, registrar e pular
        if (!dataVenda) {
          vendasSemData++;
          if (debug) {
            console.warn('Venda sem data identificada:', venda.id || 'ID não disponível');
          }
          return;
        }
        
        // Limpar e padronizar o formato da data
        let dataSemHora: string;
        
        // Se a data já está no formato YYYY-MM-DD (ou contém esse formato no início)
        if (dataVenda.match(/^\d{4}-\d{2}-\d{2}/)) {
          dataSemHora = dataVenda.substring(0, 10);
        } else {
          // Tentar processar outros formatos de data
          const dataObj = new Date(dataVenda);
          if (isNaN(dataObj.getTime())) {
            if (debug) {
              console.warn(`Data inválida: ${dataVenda}`);
            }
            vendasSemData++;
            return;
          }
          dataSemHora = format(dataObj, 'yyyy-MM-dd');
        }
        
        // Obter o valor da venda
        let valorVenda = 0;
        
        if (venda.valor_total) {
          valorVenda = typeof venda.valor_total === 'string' 
            ? parseFloat(venda.valor_total.replace(',', '.')) 
            : Number(venda.valor_total);
        } else if (venda.valor_liquido) {
          valorVenda = typeof venda.valor_liquido === 'string' 
            ? parseFloat(venda.valor_liquido.replace(',', '.')) 
            : Number(venda.valor_liquido);
        }
        
        if (isNaN(valorVenda)) {
          valorVenda = 0;
          if (debug) {
            console.warn(`Valor inválido para venda ${venda.id || 'sem ID'}: ${venda.valor_total}`);
          }
        }
        
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
        
        vendasProcessadas++;
      } catch (err) {
        console.error('Erro ao processar venda:', err, venda.id || 'ID não disponível');
        vendasSemData++;
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
    
    console.log(`Processadas ${vendasProcessadas} vendas para ${vendasPorDia.length} datas diferentes. Vendas sem data: ${vendasSemData}`);

    // Retornar resultados com informações de diagnóstico
    return NextResponse.json({
      vendasPorDia,
      diagnostico: {
        totalRecebidas: vendasResult.vendas.length,
        totalProcessadas: vendasProcessadas,
        totalSemData: vendasSemData,
        datasUnicas: vendasPorDia.length
      }
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
