import { NextRequest, NextResponse } from 'next/server';
import { processarDatasURL } from '@/app/_utils/dates';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Interface para produtos
interface ProdutoItem {
  id?: string | number;
  produto_id?: string | number;
  nome?: string;
  descricao?: string;
  quantidade?: number | string;
  valor_unitario?: number | string;
  product_id?: string | number;
  codigo?: string | number;
}

// Interface para vendas
interface VendaComProdutos {
  id: string | number;
  data?: string;
  data_inclusao?: string;
  data_venda?: string;
  nome_cliente?: string;
  cliente?: string;
  valor_total: string | number;
  nome_situacao?: string;
  vendedor_id?: string | number;
  vendedor_nome?: string;
  nome_vendedor?: string;
  produtos?: ProdutoItem[];
  items?: ProdutoItem[];
  itens?: ProdutoItem[];
}

/**
 * @api {get} /api/dashboard/vendas/produto Buscar vendas por produto
 * @apiDescription Endpoint para buscar vendas de um produto específico no período
 * 
 * @apiParam {String} dataInicio Data inicial no formato ISO ou dd/MM/yyyy
 * @apiParam {String} dataFim Data final no formato ISO ou dd/MM/yyyy
 * @apiParam {String} produtoId ID do produto
 * 
 * @apiSuccess {Object[]} vendas Lista de vendas do produto
 * @apiSuccess {Number} totalVendas Total de vendas
 * @apiSuccess {Number} totalValor Total do valor das vendas
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const produtoId = searchParams.get('produtoId');

    // Validar parâmetros
    if (!produtoId) {
      return NextResponse.json(
        { 
          erro: 'ID do produto é obrigatório',
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

    console.log(`Buscando vendas com produto ${produtoId} no período de ${dataInicio} até ${dataFim}`);

    // Buscar todas as vendas no período
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });

    // Filtrar apenas as vendas que contêm o produto especificado
    const vendasComProduto = vendasResult.vendas.filter((venda: VendaComProdutos) => {
      // Verificar se a venda possui produtos
      if (!venda.produtos || !Array.isArray(venda.produtos) || venda.produtos.length === 0) {
        // Verificar também campo items, que pode conter produtos em algumas APIs
        if (venda.items && Array.isArray(venda.items) && venda.items.length > 0) {
          // Substituir produtos por items se o campo produtos não existir
          venda.produtos = venda.items;
        } else if (venda.itens && Array.isArray(venda.itens) && venda.itens.length > 0) {
          // Verificar também campo itens em português
          venda.produtos = venda.itens;
        } else {
          return false;
        }
      }
      
      // Garantir que produtos existe neste ponto
      if (!venda.produtos) return false;

      // Normalizar o ID do produto buscado
      const produtoIdLowerCase = produtoId.toLowerCase();
      const produtoIdSemUnderline = produtoIdLowerCase.replace(/_/g, ' ');
      
      // Verificar se estamos buscando por ID numérico
      const buscaPorIdNumerico = !isNaN(Number(produtoId));
      
      // Se é um ID numérico, tentar como número e string
      const produtoIdNumerico = buscaPorIdNumerico ? Number(produtoId) : null;
      
      // Verificar se algum dos produtos na venda corresponde ao ID buscado
      return venda.produtos.some(produto => {
        // Verificar por ID exato - com múltiplas variações
        if (
          String(produto.id) === produtoId || 
          String(produto.produto_id) === produtoId ||
          (buscaPorIdNumerico && produto.id === produtoIdNumerico) ||
          (buscaPorIdNumerico && produto.produto_id === produtoIdNumerico) ||
          (buscaPorIdNumerico && produto.product_id === produtoIdNumerico) ||
          (buscaPorIdNumerico && produto.codigo === produtoIdNumerico)
        ) {
          return true;
        }
        
        // Verificar por nome (para busca por ID que pode ser um nome codificado)
        if (produto.nome) {
          const produtoNome = produto.nome.toLowerCase();
          
          // Verificar correspondência exata ou parcial
          if (
            produtoNome === produtoIdSemUnderline ||
            produtoIdSemUnderline.includes(produtoNome) ||
            produtoNome.includes(produtoIdSemUnderline)
          ) {
            return true;
          }
        }
        
        return false;
      });
    });
    
    console.log(`Encontradas ${vendasComProduto.length} vendas reais para o produto ${produtoId}`);
    
    // Calcular totais
    const totalVendas = vendasComProduto.length;
    const totalValor = vendasComProduto.reduce((sum, venda) => sum + parseFloat(venda.valor_total || '0'), 0);

    // Retornar resultados
    return NextResponse.json({
      vendas: vendasComProduto,
      totalVendas,
      totalValor
    });
  } catch (error) {
    console.error('Erro ao processar requisição de vendas por produto:', error);
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
