import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { processarDatasURL } from '@/app/_utils/dates';

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
 * Endpoint de diagnóstico para analisar produtos nas vendas
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ erro: "Usuário não autenticado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const produtoNome = searchParams.get('produto');
    
    if (!dataInicio || !dataFim) {
      return NextResponse.json({ erro: "Parâmetros de data obrigatórios" }, { status: 400 });
    }

    // Processar datas
    const resultadoDatas = processarDatasURL(dataInicio, dataFim);
    if (!resultadoDatas.success) {
      return NextResponse.json({ erro: resultadoDatas.error }, { status: 400 });
    }

    // Buscar todas as vendas no período
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });

    // Converter vendas para o tipo VendaComProdutos
    const vendas = vendasResult.vendas as unknown as VendaComProdutos[];

    // Normalizar estrutura de produtos em todas as vendas
    const vendasNormalizadas = vendas.map(venda => {
      const vendaNormalizada = { ...venda };
      
      // Verificar e normalizar campos de produtos
      if (!vendaNormalizada.produtos || !Array.isArray(vendaNormalizada.produtos) || vendaNormalizada.produtos.length === 0) {
        if (vendaNormalizada.items && Array.isArray(vendaNormalizada.items) && vendaNormalizada.items.length > 0) {
          vendaNormalizada.produtos = vendaNormalizada.items;
        } else if (vendaNormalizada.itens && Array.isArray(vendaNormalizada.itens) && vendaNormalizada.itens.length > 0) {
          vendaNormalizada.produtos = vendaNormalizada.itens;
        }
      }
      
      return vendaNormalizada;
    });

    // Extrair estrutura de produtos de todas as vendas
    const estruturaProdutos = vendasNormalizadas
      .filter(venda => venda.produtos && Array.isArray(venda.produtos) && venda.produtos.length > 0)
      .map(venda => ({
        venda_id: venda.id,
        data_venda: venda.data || venda.data_inclusao || venda.data_venda,
        produtos: venda.produtos?.map(produto => ({
          id: produto.id,
          produto_id: produto.produto_id,
          nome: produto.nome,
          descricao: produto.descricao,
          quantidade: produto.quantidade,
          valor_unitario: produto.valor_unitario
        }))
      }));

    // Se um nome de produto foi fornecido, filtra apenas as vendas contendo esse produto
    let produtosEspecificos: any[] = [];
    if (produtoNome) {
      const normalizado = produtoNome.toLowerCase();
      
      produtosEspecificos = vendasNormalizadas
        .filter(venda => venda.produtos && Array.isArray(venda.produtos))
        .flatMap(venda => {
          // Encontrar produtos na venda que correspondam ao nome buscado
          const produtosCorrespondentes = venda.produtos
            ?.filter(produto => 
              produto.nome && 
              (
                produto.nome.toLowerCase().includes(normalizado) || 
                normalizado.includes(produto.nome.toLowerCase())
              )
            )
            .map(produto => ({
              venda_id: venda.id,
              cliente: venda.nome_cliente || venda.cliente,
              data_venda: venda.data || venda.data_inclusao || venda.data_venda,
              valor_total_venda: venda.valor_total,
              produto: {
                id: produto.id,
                produto_id: produto.produto_id,
                nome: produto.nome,
                descricao: produto.descricao,
                quantidade: produto.quantidade,
                valor_unitario: produto.valor_unitario
              }
            })) || [];
            
          return produtosCorrespondentes;
        });
    }

    return NextResponse.json({
      totalVendas: vendas.length,
      vendasComProdutos: estruturaProdutos.length,
      primeirosExemplos: estruturaProdutos.slice(0, 5),
      produtosEspecificos: produtosEspecificos,
      totalEncontrado: produtosEspecificos.length
    });
  } catch (error) {
    console.error('Erro no diagnóstico de produtos:', error);
    return NextResponse.json({
      erro: `Erro ao processar diagnóstico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 
