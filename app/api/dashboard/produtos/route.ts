import { NextRequest, NextResponse } from 'next/server';
import { processarDatasURL } from '@/app/_utils/dates';
import { prisma } from '@/app/_lib/prisma';

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
          produtos: [],
          totalProdutos: 0,
          totalVendas: 0,
          totalFaturamento: 0
        },
        { status: 400 }
      );
    }

    console.log(`Buscando produtos de ${resultadoDatas.dataInicio!.toISOString()} até ${resultadoDatas.dataFim!.toISOString()}`);

    try {
      // Aqui você deverá implementar a busca de produtos no banco de dados ou onde eles são armazenados
      // Por enquanto, estamos retornando um array vazio para evitar erros na UI
      
      // Exemplo de como seria a implementação
      /*
      const produtos = await prisma.produto.findMany({
        where: {
          dataVenda: {
            gte: resultadoDatas.dataInicio,
            lte: resultadoDatas.dataFim
          }
        },
        select: {
          id: true,
          nome: true,
          categoria: true,
          precoUnitario: true,
          quantidade: true,
          // Calcular o total
          total: true
        }
      });

      const totalProdutos = produtos.length;
      const totalVendas = produtos.reduce((total, produto) => total + produto.quantidade, 0);
      const totalFaturamento = produtos.reduce((total, produto) => total + produto.total, 0);
      */

      // Por enquanto, retornar dados vazios com uma mensagem de aviso
      return NextResponse.json({
        produtos: [],
        totalProdutos: 0,
        totalVendas: 0,
        totalFaturamento: 0,
        mensagem: 'A busca de produtos locais ainda não foi implementada. Utilize a aba de Produtos Externos para visualizar produtos da API externa.'
      });
    } catch (error) {
      console.error('Erro ao processar requisição de produtos:', error);
      return NextResponse.json(
        { 
          erro: `Erro interno ao processar requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          produtos: [],
          totalProdutos: 0,
          totalVendas: 0,
          totalFaturamento: 0
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao processar requisição de produtos:', error);
    return NextResponse.json(
      { 
        erro: `Erro interno ao processar requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        produtos: [],
        totalProdutos: 0,
        totalVendas: 0,
        totalFaturamento: 0
      },
      { status: 500 }
    );
  }
} 