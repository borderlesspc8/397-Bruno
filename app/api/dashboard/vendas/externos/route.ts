import { NextRequest, NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { processarDatasURL } from '@/app/_utils/dates';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');

    // Usar o utilitário para processar as datas
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

    console.log(`Buscando vendas de ${resultadoDatas.dataInicio!.toISOString()} até ${resultadoDatas.dataFim!.toISOString()}`);

    try {
      console.log('Buscando vendas da API externa...');
      const vendasResponse = await BetelTecnologiaService.buscarVendas({
        dataInicio: resultadoDatas.dataInicio!,
        dataFim: resultadoDatas.dataFim!
      });

      // Verificar se houve erro
      if (vendasResponse.erro) {
        console.warn('Erro na API externa:', vendasResponse.erro);
        
        // Se o erro está relacionado a credenciais, retornar mensagem específica
        if (
          vendasResponse.erro.includes('Token de acesso não configurado') || 
          vendasResponse.erro.includes('Token secreto não configurado') ||
          vendasResponse.erro.includes('credenciais inválidas')
        ) {
          return NextResponse.json(
            { 
              erro: 'É necessário configurar as credenciais da API externa. Verifique as variáveis de ambiente GESTAO_CLICK_ACCESS_TOKEN e GESTAO_CLICK_SECRET_ACCESS_TOKEN.',
              vendas: [],
              totalVendas: 0,
              totalValor: 0
            },
            { status: 401 }
          );
        }
        
        // Outros erros da API
        return NextResponse.json(
          { 
            erro: `Erro na API externa: ${vendasResponse.erro}`,
            vendas: [],
            totalVendas: 0,
            totalValor: 0
          },
          { status: 500 }
        );
      }

      // Se não encontrou vendas
      if (vendasResponse.vendas.length === 0) {
        return NextResponse.json(
          {
            vendas: [],
            totalVendas: 0,
            totalValor: 0,
            mensagem: 'Nenhuma venda encontrada no período especificado.'
          },
          { status: 200 }
        );
      }

      // Retornar dados das vendas
      return NextResponse.json({
        vendas: vendasResponse.vendas,
        totalVendas: vendasResponse.totalVendas,
        totalValor: vendasResponse.totalValor
      });
    } catch (error) {
      console.error('Erro ao processar requisição de vendas:', error);
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
  } catch (error) {
    console.error('Erro ao processar requisição de vendas:', error);
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