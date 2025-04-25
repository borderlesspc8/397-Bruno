import { NextRequest, NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { processarDatasURL } from '@/app/_utils/dates';
import { Produto } from '@/app/_services/produtos';

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

    console.log(`Buscando produtos externos de ${resultadoDatas.dataInicio!.toISOString()} até ${resultadoDatas.dataFim!.toISOString()}`);

    try {
      // Chamar o serviço BetelTecnologia para buscar os produtos
      console.log('Buscando produtos da API externa...');
      const produtosResponse = await BetelTecnologiaService.buscarProdutosVendidos({
        dataInicio: resultadoDatas.dataInicio!,
        dataFim: resultadoDatas.dataFim!
      });

      // Verificar se houve erro
      if (produtosResponse.erro) {
        console.warn('Erro na API externa:', produtosResponse.erro);
        
        // Se o erro está relacionado a credenciais, retornar mensagem específica
        if (
          produtosResponse.erro.includes('Token de acesso não configurado') || 
          produtosResponse.erro.includes('Token secreto não configurado') ||
          produtosResponse.erro.includes('credenciais inválidas')
        ) {
          return NextResponse.json(
            { 
              erro: 'É necessário configurar as credenciais da API externa. Verifique as variáveis de ambiente GESTAO_CLICK_ACCESS_TOKEN e GESTAO_CLICK_SECRET_ACCESS_TOKEN.',
              produtos: [],
              totalProdutos: 0,
              totalVendas: 0,
              totalFaturamento: 0
            },
            { status: 401 }
          );
        }
        
        // Outros erros da API
        return NextResponse.json(
          { 
            erro: `Erro na API externa: ${produtosResponse.erro}`,
            produtos: [],
            totalProdutos: 0,
            totalVendas: 0,
            totalFaturamento: 0
          },
          { status: 500 }
        );
      }

      // Se não encontrou produtos
      if (produtosResponse.produtos.length === 0) {
        return NextResponse.json(
          {
            produtos: [],
            totalProdutos: 0,
            totalVendas: 0,
            totalFaturamento: 0,
            mensagem: 'Nenhum produto encontrado no período especificado.'
          },
          { status: 200 }
        );
      }

      // Retornar dados dos produtos
      return NextResponse.json({
        produtos: produtosResponse.produtos,
        totalProdutos: produtosResponse.totalProdutos,
        totalVendas: produtosResponse.totalVendas,
        totalFaturamento: produtosResponse.totalFaturamento
      });
    } catch (error) {
      console.error('Erro ao processar requisição de produtos externos:', error);
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
    console.error('Erro ao processar requisição de produtos externos:', error);
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