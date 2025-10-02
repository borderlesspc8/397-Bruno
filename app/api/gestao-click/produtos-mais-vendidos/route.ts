import { NextRequest, NextResponse } from 'next/server';
import { BetelTecnologiaService } from '@/app/_services/betelTecnologia';

// Tipos para os dados do Gestão Click
interface GestaoClickVenda {
  id: string;
  data: string;
  nome_cliente: string;
  valor_total: string;
  nome_situacao?: string;
  produtos: Array<{
    produto: {
      produto_id: string;
      nome_produto: string;
      quantidade: string;
      valor_venda: string;
      valor_total: string;
      valor_custo?: string;
    };
  }>;
}

interface ProdutoItem {
  id: string;
  nome: string;
  quantidade: number;
  valor: number;
  valorUnitario: number;
  margem: number;
  margemPercentual: number;
}

interface ProdutosResponse {
  equipamentos: ProdutoItem[];
  acessorios: ProdutoItem[];
  acessoriosEspeciais: ProdutoItem[];
  acessoriosSextavados: ProdutoItem[];
  acessoriosEmborrachados: ProdutoItem[];
  totalVendas: number;
  totalFaturamento: number;
  debug?: any;
}

// Configurações da API
const GESTAO_CLICK_API_URL = process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
const ACCESS_TOKEN = process.env.GESTAO_CLICK_ACCESS_TOKEN;
const SECRET_ACCESS_TOKEN = process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN;

// Categorias de produtos (apenas para itens de alto valor)
const CATEGORIAS_EQUIPAMENTOS = [
  'CROSS SMITH', 'LEG 45°', 'BANCO SCOOT', 'BANCO SUPINO', 'AGACHAMENTO SQUAT',
  'POLIA COM REGULAGEM', 'SMITH BARRA GUIADA', 'ESTEIRA PROFISSIONAL', 'BICICLETA SPINNING',
  'ELÍPTICO', 'REMADOR', 'BIKE SPINNING', 'MÁQUINA', 'EQUIPAMENTO'
];

const CATEGORIAS_ACESSORIOS_ESPECIAIS = [
  'ANILHA', 'CABO DE AÇO', 'CABO DE ACO', 'PAR DE CANELEIRAS', 'KETTLEBELL',
  'HALTER', 'CABO DE AÇO METRO'
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const userEmail = searchParams.get('userEmail');
    const debug = searchParams.get('debug') === 'true';

    if (!dataInicio || !dataFim) {
      return NextResponse.json(
        { erro: 'Parâmetros dataInicio e dataFim são obrigatórios' },
        { status: 400 }
      );
    }

    if (!ACCESS_TOKEN || !SECRET_ACCESS_TOKEN) {
      return NextResponse.json(
        { erro: 'Credenciais da API não configuradas' },
        { status: 500 }
      );
    }

    // Buscar vendas do Gestão Click usando o mesmo serviço do betelTecnologia.ts
    const vendasResult = await BetelTecnologiaService.buscarVendas({
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim)
    });
    
    if (vendasResult.erro) {
      return NextResponse.json(
        { error: `Erro ao buscar vendas: ${vendasResult.erro}` },
        { status: 500 }
      );
    }
    
    const vendas = vendasResult.vendas;
    
    if (vendas.length === 0) {
      return NextResponse.json({
        equipamentos: [],
        acessorios: [],
        acessoriosEspeciais: [],
        acessoriosSextavados: [],
        acessoriosEmborrachados: [],
        totalVendas: 0,
        totalFaturamento: 0
      });
    }

    // Processar produtos
    const produtos = processarProdutos(vendas);
    
    // Classificar produtos
    const equipamentos = produtos.filter(p => isEquipamento(p.nome, p.valorUnitario));
    const acessorios = produtos.filter(p => !isEquipamento(p.nome, p.valorUnitario));
    
    // Separar acessórios em categorias
    const acessoriosEspeciais = acessorios.filter(p => isAcessorioEspecial(p.nome));
    const acessoriosSextavados = acessorios.filter(p => 
      p.nome.toLowerCase().includes('sextavado') && !isAcessorioEspecial(p.nome)
    );
    const acessoriosEmborrachados = acessorios.filter(p => 
      p.nome.toLowerCase().includes('emborrachado') && !isAcessorioEspecial(p.nome)
    );
    const acessoriosPrincipais = acessorios.filter(p => 
      !isAcessorioEspecial(p.nome) && 
      !p.nome.toLowerCase().includes('sextavado') && 
      !p.nome.toLowerCase().includes('emborrachado')
    );

    // Calcular totais
    const totalVendas = vendas.length;
    const totalFaturamento = vendas.reduce((total, venda) => 
      total + parseFloat(venda.valor_total || '0'), 0
    );

    const response: ProdutosResponse = {
      equipamentos: equipamentos.sort((a, b) => b.quantidade - a.quantidade),
      acessorios: acessoriosPrincipais.sort((a, b) => b.quantidade - a.quantidade),
      acessoriosEspeciais: acessoriosEspeciais.sort((a, b) => b.quantidade - a.quantidade),
      acessoriosSextavados: acessoriosSextavados.sort((a, b) => b.quantidade - a.quantidade),
      acessoriosEmborrachados: acessoriosEmborrachados.sort((a, b) => b.quantidade - a.quantidade),
      totalVendas,
      totalFaturamento
    };

    if (debug) {
      response.debug = {
        totalVendas,
        totalEquipamentos: equipamentos.length,
        totalAcessorios: acessorios.length,
        totalAcessoriosEspeciais: acessoriosEspeciais.length,
        totalAcessoriosSextavados: acessoriosSextavados.length,
        totalAcessoriosEmborrachados: acessoriosEmborrachados.length
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro na API de produtos mais vendidos:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


/**
 * Processa as vendas e agrega os produtos
 */
function processarProdutos(vendas: GestaoClickVenda[]): ProdutoItem[] {
  const produtosMap = new Map<string, ProdutoItem>();

  vendas.forEach(venda => {
    if (venda.produtos && Array.isArray(venda.produtos)) {
      venda.produtos.forEach(produtoWrapper => {
        const produto = produtoWrapper.produto;
        
        if (!produto || !produto.nome_produto) return;

        const nome = produto.nome_produto.trim();
        const quantidade = parseFloat(produto.quantidade) || 0;
        const valor = parseFloat(produto.valor_total) || 0;
        const valorCusto = parseFloat(produto.valor_custo) || 0;
        
        if (quantidade <= 0) return;

        const chave = nome.toUpperCase();
        
        if (produtosMap.has(chave)) {
          const existente = produtosMap.get(chave)!;
          existente.quantidade += quantidade;
          existente.valor += valor;
          existente.margem += (valor - valorCusto);
          existente.valorUnitario = existente.valor / existente.quantidade;
          existente.margemPercentual = existente.valor > 0 ? (existente.margem / existente.valor) * 100 : 0;
        } else {
          const valorUnitario = quantidade > 0 ? valor / quantidade : 0;
          const margem = valor - valorCusto;
          const margemPercentual = valor > 0 ? (margem / valor) * 100 : 0;

          produtosMap.set(chave, {
            id: produto.produto_id,
            nome,
            quantidade,
            valor,
            valorUnitario,
            margem,
            margemPercentual
          });
        }
      });
    }
  });

  return Array.from(produtosMap.values());
}

/**
 * Verifica se um produto é equipamento
 * CRITÉRIO PRINCIPAL: Valor unitário >= R$ 1.000,00
 * CRITÉRIO SECUNDÁRIO: Nome contém termos específicos de equipamentos (apenas para itens de alto valor)
 */
function isEquipamento(nome: string, valorUnitario: number): boolean {
  // CRITÉRIO PRINCIPAL: Valor unitário >= R$ 1.000,00
  if (valorUnitario >= 1000) {
    return true;
  }
  
  // CRITÉRIO SECUNDÁRIO: Verificar por nome (apenas para itens com valor >= R$ 500,00)
  if (valorUnitario >= 500) {
    const nomeUpper = nome.toUpperCase();
    return CATEGORIAS_EQUIPAMENTOS.some(termo => 
      nomeUpper.includes(termo)
    );
  }
  
  return false;
}

/**
 * Verifica se um produto é acessório especial
 */
function isAcessorioEspecial(nome: string): boolean {
  const nomeUpper = nome.toUpperCase();
  
  return CATEGORIAS_ACESSORIOS_ESPECIAIS.some(termo => 
    nomeUpper.includes(termo)
  );
}
