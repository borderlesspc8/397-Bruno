import { NextRequest, NextResponse } from "next/server";
import { processarDatasURL } from '@/app/_utils/dates';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


/**
 * GET /api/dashboard/produtos/mais-vendidos
 * Busca os produtos mais vendidos a partir das vendas reais da API
 */
export async function GET(req: NextRequest) {
  try {
    // Obter parâmetros da requisição
    const params = req.nextUrl.searchParams;
    const dataInicio = params.get("dataInicio");
    const dataFim = params.get("dataFim");
    
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
    
    console.log(`Buscando produtos mais vendidos de ${resultadoDatas.dataInicio!.toISOString()} até ${resultadoDatas.dataFim!.toISOString()}`);

    // Buscar vendas usando o BetelTecnologiaService
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: resultadoDatas.dataInicio!,
      dataFim: resultadoDatas.dataFim!
    });

    // Verificar se houve erro na busca das vendas
    if (vendasResult.erro) {
      return NextResponse.json(
        {
          erro: `Erro ao buscar vendas: ${vendasResult.erro}`,
          produtos: [],
          totalProdutos: 0,
          totalVendas: 0, 
          totalFaturamento: 0
        },
        { status: 500 }
      );
    }

    // Processar produtos das vendas
    const produtosMaisVendidos = processarProdutosMaisVendidos(vendasResult.vendas);
    
    // Calcular totais
    const totalProdutos = produtosMaisVendidos.length;
    const totalVendas = vendasResult.totalVendas;
    const totalFaturamento = produtosMaisVendidos.reduce((acc, produto) => acc + produto.valor, 0);
    
    // Retornar dados processados
    return NextResponse.json({
      produtos: produtosMaisVendidos,
      totalProdutos,
      totalVendas,
      totalFaturamento
    });
    
  } catch (error) {
    console.error("Erro ao processar produtos mais vendidos:", error);
    return NextResponse.json(
      { 
        erro: error instanceof Error ? error.message : "Erro ao processar produtos mais vendidos",
        produtos: []
      },
      { status: 500 }
    );
  }
}

/**
 * Processa a lista de vendas para obter os produtos mais vendidos
 */
function processarProdutosMaisVendidos(vendas: any[]) {
  // Inicializar map para contagem de produtos
  const produtosContagem = new Map();
  
  vendas.forEach((venda) => {
    // Verificar se venda tem itens diretamente
    if (venda && venda.itens && Array.isArray(venda.itens)) {
      venda.itens.forEach((item: any) => {
        processarItem(item, produtosContagem);
      });
    }
    
    // Verificar se venda tem produtos (estrutura da API Betel Tecnologia)
    if (venda && venda.produtos && Array.isArray(venda.produtos)) {
      venda.produtos.forEach((produtoWrapper: any) => {
        // Os produtos estão em um wrapper com propriedade "produto"
        if (produtoWrapper && produtoWrapper.produto) {
          const item = produtoWrapper.produto;
          processarItem(item, produtosContagem);
        }
      });
    }
  });
  
  // Converter para array e ordenar por quantidade (decrescente)
  const result = Array.from(produtosContagem.values())
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 15); // Retornar os 15 mais vendidos
  
  return result;
}

/**
 * Processa um item individual de produto e atualiza o mapa de contagem
 */
function processarItem(item: any, produtosContagem: Map<string, any>) {
  if (!item) return; // Ignorar item indefinido
  
  const produtoId = item.produto_id?.toString() || item.id?.toString() || `unknown-${Math.random()}`;
  const nomeProduto = item.produto_nome || item.nome_produto || item.nome || item.descricao || "Produto sem nome";
  const quantidade = parseFloat(item.quantidade || "1");
  
  // Extrair valores específicos de custo e venda
  const valorVenda = parseFloat(item.valor_venda || item.valor_unitario || "0");
  const valorCusto = parseFloat(item.valor_custo || "0");
  
  // Calcular valores totais
  const valorTotal = item.valor_total 
    ? parseFloat(item.valor_total) 
    : quantidade * valorVenda;
    
  const custoTotal = valorCusto > 0 
    ? valorCusto * quantidade 
    : 0;
    
  const categoria = item.categoria || "Não categorizado";
  
  if (!produtosContagem.has(produtoId)) {
    produtosContagem.set(produtoId, {
      id: produtoId,
      nome: nomeProduto,
      categoria: categoria,
      quantidade: 0,
      valor: 0,
      custo: 0,
      margem: 0,
      margemPercentual: -1 // Valor numérico negativo indica que não há margem calculável
    });
  }
  
  const produtoInfo = produtosContagem.get(produtoId);
  produtoInfo.quantidade += quantidade;
  produtoInfo.valor += valorTotal;
  
  // Calcular custo, margem e margem percentual baseados na disponibilidade do custo real
  if (valorCusto > 0) {
    // Usar valor de custo real disponível
    produtoInfo.custo += custoTotal;
    
    // Calcular lucro (margem absoluta)
    produtoInfo.margem = produtoInfo.valor - produtoInfo.custo;
    
    // Calcular margem percentual
    produtoInfo.margemPercentual = produtoInfo.valor > 0 
      ? Math.round((produtoInfo.margem / produtoInfo.valor) * 100) 
      : 0;
  } else {
    // Quando não há custo informado, definir valores padrão
    produtoInfo.custo = 0;
    produtoInfo.margem = 0;
    // Usar número ao invés de string para manter consistência no tipo
    produtoInfo.margemPercentual = -1; // Valor numérico negativo indica que não há margem calculável
  }
} 
