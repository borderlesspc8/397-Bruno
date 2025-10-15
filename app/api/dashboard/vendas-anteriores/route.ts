import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Validar parâmetros obrigatórios
    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { 
          erro: 'Parâmetros dataInicio e dataFim são obrigatórios',
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 400 }
      );
    }

    console.log(`Buscando vendas anteriores de ${dataInicio} até ${dataFim}`);

    // Tentar realizar o parsing das datas
    let dataInicioObj: Date;
    let dataFimObj: Date;
    
    try {
      // Tentar primeiro no formato ISO YYYY-MM-DD
      if (dataInicio.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Formato ISO: garantir que seja o início do dia
        dataInicioObj = new Date(`${dataInicio}T00:00:00.000Z`);
      } else {
        // Tentar no formato dd/MM/yyyy que pode vir da UI
        dataInicioObj = parse(dataInicio, 'dd/MM/yyyy', new Date(), { locale: ptBR });
      }
      
      if (dataFim.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Formato ISO: garantir que seja o fim do dia
        dataFimObj = new Date(`${dataFim}T23:59:59.999Z`);
      } else {
        // Tentar no formato dd/MM/yyyy que pode vir da UI
        dataFimObj = parse(dataFim, 'dd/MM/yyyy', new Date(), { locale: ptBR });
      }
      
      // Verificar se as datas são válidas
      if (isNaN(dataInicioObj.getTime()) || isNaN(dataFimObj.getTime())) {
        throw new Error('Formato de data inválido');
      }
    } catch (error) {
      console.error('Erro ao processar datas:', error);
      return NextResponse.json(
        { 
          erro: 'Formato de data inválido. Use o formato ISO (YYYY-MM-DD) ou dd/MM/yyyy',
          vendas: [],
          totalVendas: 0,
          totalValor: 0
        },
        { status: 400 }
      );
    }

    // Ajustar as datas para incluir todo o período
    dataInicioObj.setHours(0, 0, 0, 0);
    dataFimObj.setHours(23, 59, 59, 999);

    console.log('Datas processadas:', {
      dataInicio: dataInicioObj.toISOString(),
      dataFim: dataFimObj.toISOString()
    });

    // ... existing code ...
  } catch (error) {
    console.error('Erro ao processar a solicitação:', error);
    return NextResponse.json(
      { 
        erro: 'Erro ao processar a solicitação',
        vendas: [],
        totalVendas: 0,
        totalValor: 0
      },
      { status: 500 }
    );
  }
} 
