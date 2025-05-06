import { NextRequest, NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { processarDatasURL } from '@/app/_utils/dates';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_lib/auth';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


interface ProdutoEncontrado {
  venda_id: string | number;
  produto_id?: string | number; 
  id?: string | number;
  nome?: string;
  quantidade?: string | number;
  caminho_encontrado: string;
  estrutura_completa: any;
}

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
    const produtoId = searchParams.get('produtoId');
    
    if (!dataInicio || !dataFim) {
      return NextResponse.json({ erro: "Parâmetros de data obrigatórios" }, { status: 400 });
    }
    
    if (!produtoId) {
      return NextResponse.json({ erro: "ID do produto obrigatório" }, { status: 400 });
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
    
    console.log(`Recebidas ${vendasResult.vendas.length} vendas do período`);
    
    // Verificar vários caminhos para encontrar o produto por ID
    const produtoIdNumerico = !isNaN(Number(produtoId)) ? Number(produtoId) : null;
    
    const produtosEncontrados: ProdutoEncontrado[] = [];
    
    // Percorrer todas as vendas
    vendasResult.vendas.forEach((venda: any) => {
      const idVenda = venda.id;
      
      // Verificar produtos no campo 'produtos'
      if (venda.produtos && Array.isArray(venda.produtos)) {
        venda.produtos.forEach((produto: any) => {
          const correspondePorId = 
            String(produto.id) === produtoId || 
            (produtoIdNumerico !== null && produto.id === produtoIdNumerico);
          
          const correspondePorProdutoId = 
            String(produto.produto_id) === produtoId || 
            (produtoIdNumerico !== null && produto.produto_id === produtoIdNumerico);
            
          const correspondePorProductId = 
            String(produto.product_id) === produtoId || 
            (produtoIdNumerico !== null && produto.product_id === produtoIdNumerico);
            
          const correspondePorCodigo = 
            String(produto.codigo) === produtoId || 
            (produtoIdNumerico !== null && produto.codigo === produtoIdNumerico);
          
          if (correspondePorId || correspondePorProdutoId || correspondePorProductId || correspondePorCodigo) {
            produtosEncontrados.push({
              venda_id: idVenda,
              produto_id: produto.produto_id,
              id: produto.id,
              nome: produto.nome || produto.descricao,
              quantidade: produto.quantidade,
              caminho_encontrado: `venda.produtos[${correspondePorId ? 'id' : correspondePorProdutoId ? 'produto_id' : correspondePorProductId ? 'product_id' : 'codigo'}]`,
              estrutura_completa: produto
            });
          }
        });
      }
      
      // Verificar produtos no campo 'items'
      if (venda.items && Array.isArray(venda.items)) {
        venda.items.forEach((produto: any) => {
          const correspondePorId = 
            String(produto.id) === produtoId || 
            (produtoIdNumerico !== null && produto.id === produtoIdNumerico);
          
          const correspondePorProdutoId = 
            String(produto.produto_id) === produtoId || 
            (produtoIdNumerico !== null && produto.produto_id === produtoIdNumerico);
            
          const correspondePorProductId = 
            String(produto.product_id) === produtoId || 
            (produtoIdNumerico !== null && produto.product_id === produtoIdNumerico);
            
          const correspondePorCodigo = 
            String(produto.codigo) === produtoId || 
            (produtoIdNumerico !== null && produto.codigo === produtoIdNumerico);
          
          if (correspondePorId || correspondePorProdutoId || correspondePorProductId || correspondePorCodigo) {
            produtosEncontrados.push({
              venda_id: idVenda,
              produto_id: produto.produto_id,
              id: produto.id,
              nome: produto.nome || produto.descricao,
              quantidade: produto.quantidade,
              caminho_encontrado: `venda.items[${correspondePorId ? 'id' : correspondePorProdutoId ? 'produto_id' : correspondePorProductId ? 'product_id' : 'codigo'}]`,
              estrutura_completa: produto
            });
          }
        });
      }
      
      // Verificar produtos no campo 'itens'
      if (venda.itens && Array.isArray(venda.itens)) {
        venda.itens.forEach((produto: any) => {
          const correspondePorId = 
            String(produto.id) === produtoId || 
            (produtoIdNumerico !== null && produto.id === produtoIdNumerico);
          
          const correspondePorProdutoId = 
            String(produto.produto_id) === produtoId || 
            (produtoIdNumerico !== null && produto.produto_id === produtoIdNumerico);
            
          const correspondePorProductId = 
            String(produto.product_id) === produtoId || 
            (produtoIdNumerico !== null && produto.product_id === produtoIdNumerico);
            
          const correspondePorCodigo = 
            String(produto.codigo) === produtoId || 
            (produtoIdNumerico !== null && produto.codigo === produtoIdNumerico);
          
          if (correspondePorId || correspondePorProdutoId || correspondePorProductId || correspondePorCodigo) {
            produtosEncontrados.push({
              venda_id: idVenda,
              produto_id: produto.produto_id,
              id: produto.id,
              nome: produto.nome || produto.descricao,
              quantidade: produto.quantidade,
              caminho_encontrado: `venda.itens[${correspondePorId ? 'id' : correspondePorProdutoId ? 'produto_id' : correspondePorProductId ? 'product_id' : 'codigo'}]`,
              estrutura_completa: produto
            });
          }
        });
      }
    });
    
    // Verificar também nas listas de produtos diretamente fornecidas pela API
    const produtosResult = await BetelTecnologiaService.buscarProdutosVendidos({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });
    
    // Extrair lista de produtos do resultado
    const produtos = Array.isArray(produtosResult) ? produtosResult : 
                    (produtosResult as any)?.produtos || 
                    (produtosResult as any)?.data || 
                    [];
    
    if (produtos && produtos.length > 0) {
      produtos.forEach((produto: any) => {
        const correspondePorId = 
          String(produto.id) === produtoId || 
          (produtoIdNumerico !== null && produto.id === produtoIdNumerico);
        
        const correspondePorProdutoId = 
          String(produto.produto_id) === produtoId || 
          (produtoIdNumerico !== null && produto.produto_id === produtoIdNumerico);
          
        const correspondePorProductId = 
          String(produto.product_id) === produtoId || 
          (produtoIdNumerico !== null && produto.product_id === produtoIdNumerico);
          
        const correspondePorCodigo = 
          String(produto.codigo) === produtoId || 
          (produtoIdNumerico !== null && produto.codigo === produtoIdNumerico);
        
        if (correspondePorId || correspondePorProdutoId || correspondePorProductId || correspondePorCodigo) {
          produtosEncontrados.push({
            venda_id: 'lista-produtos-direta',
            produto_id: produto.produto_id,
            id: produto.id,
            nome: produto.nome || produto.descricao,
            quantidade: produto.quantidade,
            caminho_encontrado: `produtos[${correspondePorId ? 'id' : correspondePorProdutoId ? 'produto_id' : correspondePorProductId ? 'product_id' : 'codigo'}]`,
            estrutura_completa: produto
          });
        }
      });
    }
    
    return NextResponse.json({
      produtoId,
      produtoIdNumerico,
      totalVendas: vendasResult.vendas.length,
      produtosEncontrados,
      totalEncontrados: produtosEncontrados.length,
      mensagem: produtosEncontrados.length === 0 
        ? "Nenhum produto encontrado com este ID em qualquer estrutura" 
        : `Produto encontrado em ${produtosEncontrados.length} lugares`
    });
  } catch (error) {
    console.error('Erro ao testar estrutura de produto:', error);
    return NextResponse.json({
      erro: `Erro ao processar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 });
  }
} 
