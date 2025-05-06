import { NextRequest, NextResponse } from "next/server";
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';
import { parse, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BetelVenda } from '@/app/_utils/calculoFinanceiro';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Interface extendida para incluir campos adicionais
interface VendaExtendida extends BetelVenda {
  atributos?: Array<{
    atributo: {
      descricao: string;
      conteudo: string;
    }
  }>;
  produtos?: Array<any>;
  filial_id?: string | number;
  filial?: string | number;
  id_filial?: string | number;
}

// Interface para produtos por origem
interface ProdutoOrigem {
  id: string;
  nome: string;
  quantidade: number;
  valor: number;
  percentualQuantidade: number;
}

// Interface de dados de retorno
interface OrigemComProdutos {
  origem: string;
  quantidade: number;
  percentual: number;
  valorTotal: number;
  produtos: {
    id: string;
    nome: string;
    quantidade: number;
    valor: number;
    percentualQuantidade: number;
  }[];
  produtosUnicos: number;
  totalUnidades: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dataInicio = searchParams.get("dataInicio") || "";
    const dataFim = searchParams.get("dataFim") || "";
    const debug = searchParams.get("debug") === "true";
    const tipoLoja = searchParams.get("tipoLoja") || "todas";

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { error: "Parâmetros dataInicio e dataFim são obrigatórios" },
        { status: 400 }
      );
    }

    // Processar datas para formato correto
    let formattedDataInicio: string;
    let formattedDataFim: string;

    try {
      if (dataInicio.includes('-') && dataInicio.length === 10) {
        formattedDataInicio = dataInicio;
      } else {
        const dataInicioObj = parse(dataInicio, 'dd/MM/yyyy', new Date(), { locale: ptBR });
        if (isNaN(dataInicioObj.getTime())) {
          throw new Error('Formato de data inicial inválido');
        }
        formattedDataInicio = format(dataInicioObj, 'yyyy-MM-dd');
      }

      if (dataFim.includes('-') && dataFim.length === 10) {
        formattedDataFim = dataFim;
      } else {
        const dataFimObj = parse(dataFim, 'dd/MM/yyyy', new Date(), { locale: ptBR });
        if (isNaN(dataFimObj.getTime())) {
          throw new Error('Formato de data final inválido');
        }
        formattedDataFim = format(dataFimObj, 'yyyy-MM-dd');
      }
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Formato de data inválido. Use o formato ISO (YYYY-MM-DD) ou dd/MM/yyyy',
          origens: []
        },
        { status: 400 }
      );
    }

    // Criar objetos Date
    const dataInicioObj = new Date(`${formattedDataInicio}T00:00:00.000Z`);
    const dataFimObj = new Date(`${formattedDataFim}T23:59:59.999Z`);

    if (debug) {
      console.log('Buscando dados de origens e produtos:', {
        dataInicio: formattedDataInicio,
        dataFim: formattedDataFim
      });
    }

    // Buscar vendas
    const vendas = await BetelTecnologiaService.buscarVendas({
      dataInicio: dataInicioObj, 
      dataFim: dataFimObj
    });

    // Estatísticas de vendas
    const statusValidos = ["Concretizada", "Em andamento"];
    
    // Filtrar apenas vendas com status válidos e do mês atual
    const vendasFiltradas = vendas.vendas.filter(venda => {
      // Verificar status
      const statusValido = statusValidos.includes(venda.nome_situacao || "");
      
      // Verificar se a data da venda está dentro do período solicitado
      const dataVenda = venda.data ? new Date(venda.data) : null;
      const dataValida = dataVenda && 
                         dataVenda >= dataInicioObj && 
                         dataVenda <= dataFimObj;
      
      // Verificar tipo de loja se não for "todas"
      let lojaValida = true;
      if (tipoLoja !== "todas") {
        // Usar casting para any para acessar propriedades que podem não estar na interface
        const vendaAny = venda as any;
        const nomeLoja = vendaAny.nome_loja || "";
        
        // Verificar se a loja corresponde ao filtro selecionado
        if (tipoLoja !== nomeLoja) {
          lojaValida = false;
        }
      }
      
      return statusValido && dataValida && lojaValida;
    }) as VendaExtendida[];
    
    if (debug) {
      console.log(`Total de vendas filtradas: ${vendasFiltradas.length} (tipo loja: ${tipoLoja})`);
    }

    // Mapear origens (Como nos conheceu)
    const origensMap = new Map<string, {
      origem: string,
      quantidade: number,
      valor: number,
      produtosMap: Map<string, ProdutoOrigem>
    }>();

    // Processar vendas para contabilizar origens e produtos
    vendasFiltradas.forEach(venda => {
      // Obter a origem da venda (como nos conheceu)
      const atributosVenda = venda.atributos || [];
      const comoNosConheceuAtributo = atributosVenda.find(
        (atr) => atr?.atributo?.descricao === "Como nos conheceu"
      );
      const origem = comoNosConheceuAtributo?.atributo?.conteudo || "Não informado";
      
      // Obter valor da venda
      const valorVenda = typeof venda.valor_total === 'string' 
        ? parseFloat(venda.valor_total.replace(',', '.')) 
        : (venda.valor_total || 0);

      // Inicializar registro da origem se não existir
      if (!origensMap.has(origem)) {
        origensMap.set(origem, {
          origem,
          quantidade: 0,
          valor: 0,
          produtosMap: new Map()
        });
      }

      // Incrementar contadores da origem
      const origemData = origensMap.get(origem)!;
      origemData.quantidade += 1;
      origemData.valor += valorVenda;

      // Processar produtos desta venda
      if (Array.isArray(venda.produtos)) {
        venda.produtos.forEach((produtoWrapper: any) => {
          // Na API, os produtos estão dentro de um objeto "produto"
          const produto = produtoWrapper.produto || produtoWrapper;
          
          // Obter ID do produto
          const produtoId = produto.produto_id || produto.id || `desconhecido-${Math.random()}`;
          
          // Obter nome do produto - prioridade para nome_produto conforme API
          const produtoNome = produto.nome_produto || 
                             produto.nome || 
                             produto.descricao || 
                             produto.referencia || 
                             "Produto sem nome";
          
          // Obter quantidade
          let produtoQuantidade = 0;
          if (produto.quantidade) {
            produtoQuantidade = typeof produto.quantidade === 'string' 
              ? parseFloat(produto.quantidade.replace(',', '.')) 
              : Number(produto.quantidade);
          } else {
            produtoQuantidade = 1;
          }
          
          // Obter valor do produto
          let produtoValor = 0;
          
          // Priorizar valor_total ou valor_venda
          if (produto.valor_total !== undefined) {
            produtoValor = typeof produto.valor_total === 'string'
              ? parseFloat(produto.valor_total.replace(',', '.'))
              : Number(produto.valor_total);
          } else if (produto.valor_venda !== undefined) {
            const valorUnitario = typeof produto.valor_venda === 'string'
              ? parseFloat(produto.valor_venda.replace(',', '.'))
              : Number(produto.valor_venda);
            
            produtoValor = valorUnitario * produtoQuantidade;
          } else if (produto.valor_unitario !== undefined || produto.preco_unitario !== undefined || produto.preco !== undefined) {
            let valorUnitario = 0;
            
            // Tentar converter valor de string para número
            if (typeof produto.valor_unitario === 'string') {
              valorUnitario = parseFloat(produto.valor_unitario.replace(',', '.'));
            } else if (typeof produto.preco_unitario === 'string') {
              valorUnitario = parseFloat(produto.preco_unitario.replace(',', '.'));
            } else if (typeof produto.preco === 'string') {
              valorUnitario = parseFloat(produto.preco.replace(',', '.'));
            } else {
              valorUnitario = produto.valor_unitario || produto.preco_unitario || produto.preco || 0;
            }
            
            produtoValor = Number(valorUnitario) * produtoQuantidade;
          }
          
          if (debug && origemData.quantidade < 2) {
            console.log('Produto processado:', {
              id: produtoId,
              nome: produtoNome,
              quantidade: produtoQuantidade,
              valor: produtoValor
            });
          }
          
          // Adicionar ou atualizar produto para esta origem
          const produtoExistente = origemData.produtosMap.get(produtoId);
          
          if (produtoExistente) {
            produtoExistente.quantidade += produtoQuantidade;
            produtoExistente.valor += produtoValor;
          } else {
            origemData.produtosMap.set(produtoId, {
              id: produtoId,
              nome: produtoNome,
              quantidade: produtoQuantidade,
              valor: produtoValor,
              percentualQuantidade: 0 // Será calculado depois
            });
          }
        });
      }
    });

    // Calcular total de vendas para percentuais
    const totalVendas = vendasFiltradas.length;
    
    // Transformar mapa em array de resultados e calcular percentuais
    const origens: OrigemComProdutos[] = [];
    origensMap.forEach(origem => {
      // Calcular percentual da origem
      const percentual = totalVendas > 0 ? origem.quantidade / totalVendas : 0;
      
      // Transformar mapa de produtos em array
      const produtos = Array.from(origem.produtosMap.values())
        .map(produto => {
          // Calcular percentual do produto em relação ao total da origem
          const percentualQuantidade = origem.quantidade > 0 
            ? produto.quantidade / origem.quantidade 
            : 0;
          
          return {
            id: produto.id,
            nome: produto.nome,
            quantidade: produto.quantidade,
            valor: produto.valor,
            percentualQuantidade
          };
        })
        // Ordenar produtos por quantidade (decrescente)
        .sort((a, b) => b.quantidade - a.quantidade);
      
      // Calcular o valor total baseado nos produtos
      const valorProdutos = produtos.reduce((total, produto) => total + produto.valor, 0);
      // Total de unidades vendidas
      const totalUnidades = produtos.reduce((total, produto) => total + produto.quantidade, 0);
      
      origens.push({
        origem: origem.origem,
        quantidade: origem.quantidade,
        percentual,
        // Usar o valor dos produtos como valor total para consistência
        valorTotal: valorProdutos,
        produtos,
        produtosUnicos: produtos.length,
        totalUnidades
      });
    });

    // Ordenar origens por quantidade (decrescente)
    origens.sort((a, b) => b.quantidade - a.quantidade);

    return NextResponse.json({
      origens,
      totalVendas,
      dataInicio: formattedDataInicio,
      dataFim: formattedDataFim,
      tipoLoja
    });
  } catch (error) {
    console.error("Erro ao processar dados de origens com produtos:", error);
    return NextResponse.json(
      { 
        error: "Erro ao processar dados",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        origens: []
      },
      { status: 500 }
    );
  }
} 
