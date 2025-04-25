import { NextResponse } from 'next/server';

// Interfaces para os tipos de dados de produtos
interface ProdutoVendido {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  custo: number;
  margem: number;
  margemPercentual: number;
  quantidade: number;
  totalVendido: number;
}

interface ConsultorProdutos {
  id: string;
  nome: string;
  totalProdutosVendidos: number;
  faturamentoTotal: number;
  custoTotal: number;
  margemTotal: number;
  margemMediaPercentual: number;
  produtos: ProdutoVendido[];
}

interface CategoriaAnalise {
  categoria: string;
  quantidade: number;
  percentual: number;
  faturamento: number;
  margem: number;
  giro: number;
}

interface ProdutosResponse {
  consultores: ConsultorProdutos[];
  categorias: CategoriaAnalise[];
  periodoInicio: string;
  periodoFim: string;
}

// Função para gerar dados mockados para desenvolvimento
function generateMockData(dataInicio?: string, dataFim?: string, consultorId?: string): ProdutosResponse {
  // Nomes de consultores para simulação
  const consultores = [
    { id: 'CONS-1000', nome: 'Ana Silva' },
    { id: 'CONS-1001', nome: 'Carlos Santos' },
    { id: 'CONS-1002', nome: 'Juliana Oliveira' },
    { id: 'CONS-1003', nome: 'Roberto Almeida' },
    { id: 'CONS-1004', nome: 'Patricia Lima' },
  ];
  
  // Categorias de produtos para simulação
  const categorias = [
    'Eletrônicos',
    'Móveis',
    'Decoração',
    'Utensílios',
    'Vestuário',
    'Calçados',
    'Acessórios',
    'Cursos',
    'Serviços',
    'Assinaturas'
  ];
  
  // Produtos para simulação
  const produtosDisponiveis = [
    { nome: 'Smartphone Premium', categoria: 'Eletrônicos', preco: 3500, custo: 2100 },
    { nome: 'Tablet Pro', categoria: 'Eletrônicos', preco: 2800, custo: 1700 },
    { nome: 'Notebook Ultra', categoria: 'Eletrônicos', preco: 5500, custo: 3700 },
    { nome: 'Smart TV 55"', categoria: 'Eletrônicos', preco: 4200, custo: 2800 },
    { nome: 'Sofá 3 Lugares', categoria: 'Móveis', preco: 3200, custo: 1900 },
    { nome: 'Mesa de Jantar', categoria: 'Móveis', preco: 2500, custo: 1400 },
    { nome: 'Poltrona Reclinável', categoria: 'Móveis', preco: 1800, custo: 950 },
    { nome: 'Armário Multiuso', categoria: 'Móveis', preco: 1200, custo: 650 },
    { nome: 'Quadro Decorativo', categoria: 'Decoração', preco: 350, custo: 120 },
    { nome: 'Luminária de Mesa', categoria: 'Decoração', preco: 280, custo: 90 },
    { nome: 'Vaso Decorativo', categoria: 'Decoração', preco: 220, custo: 70 },
    { nome: 'Tapete Grande', categoria: 'Decoração', preco: 800, custo: 450 },
    { nome: 'Conjunto de Panelas', categoria: 'Utensílios', preco: 900, custo: 520 },
    { nome: 'Kit de Facas', categoria: 'Utensílios', preco: 450, custo: 210 },
    { nome: 'Jogo de Talheres', categoria: 'Utensílios', preco: 350, custo: 180 },
    { nome: 'Cafeteira Elétrica', categoria: 'Utensílios', preco: 320, custo: 170 },
    { nome: 'Camisa Social', categoria: 'Vestuário', preco: 180, custo: 75 },
    { nome: 'Calça Jeans', categoria: 'Vestuário', preco: 220, custo: 90 },
    { nome: 'Vestido Casual', categoria: 'Vestuário', preco: 250, custo: 110 },
    { nome: 'Blazer', categoria: 'Vestuário', preco: 320, custo: 150 },
    { nome: 'Tênis Esportivo', categoria: 'Calçados', preco: 380, custo: 210 },
    { nome: 'Sapato Social', categoria: 'Calçados', preco: 320, custo: 170 },
    { nome: 'Sandália', categoria: 'Calçados', preco: 150, custo: 60 },
    { nome: 'Bota de Couro', categoria: 'Calçados', preco: 420, custo: 250 },
    { nome: 'Relógio', categoria: 'Acessórios', preco: 580, custo: 290 },
    { nome: 'Bolsa', categoria: 'Acessórios', preco: 420, custo: 180 },
    { nome: 'Óculos de Sol', categoria: 'Acessórios', preco: 350, custo: 120 },
    { nome: 'Cinto de Couro', categoria: 'Acessórios', preco: 180, custo: 65 },
    { nome: 'Curso de Idiomas', categoria: 'Cursos', preco: 1800, custo: 600 },
    { nome: 'Curso de Programação', categoria: 'Cursos', preco: 2200, custo: 900 },
    { nome: 'Workshop de Fotografia', categoria: 'Cursos', preco: 850, custo: 350 },
    { nome: 'Treinamento Empresarial', categoria: 'Cursos', preco: 3500, custo: 1200 },
    { nome: 'Consultoria de Marketing', categoria: 'Serviços', preco: 5000, custo: 2500 },
    { nome: 'Assessoria Financeira', categoria: 'Serviços', preco: 4200, custo: 2000 },
    { nome: 'Design de Interiores', categoria: 'Serviços', preco: 3800, custo: 1700 },
    { nome: 'Suporte Técnico', categoria: 'Serviços', preco: 1500, custo: 600 },
    { nome: 'Streaming Premium', categoria: 'Assinaturas', preco: 360, custo: 180 },
    { nome: 'Clube de Livros', categoria: 'Assinaturas', preco: 420, custo: 250 },
    { nome: 'Academia VIP', categoria: 'Assinaturas', preco: 1800, custo: 1100 },
    { nome: 'Clube de Vinhos', categoria: 'Assinaturas', preco: 2400, custo: 1500 }
  ];
  
  // Filtrar consultores se um ID específico for fornecido
  const consultoresFiltrados = consultorId 
    ? consultores.filter(c => c.id === consultorId || c.nome.toLowerCase().includes(consultorId.toLowerCase()))
    : consultores;
  
  // Gerar dados de produtos vendidos por consultor
  const consultoresData: ConsultorProdutos[] = consultoresFiltrados.map((consultor, index) => {
    // Determinar quantos tipos de produtos diferentes este consultor vendeu (entre 5 e 15)
    const numProdutosDiferentes = Math.floor(Math.random() * 11) + 5;
    
    // Selecionar aleatoriamente produtos vendidos por este consultor
    const produtosConsultor: ProdutoVendido[] = [];
    const produtosIndices = new Set<number>();
    
    while (produtosIndices.size < numProdutosDiferentes) {
      const randomIndex = Math.floor(Math.random() * produtosDisponiveis.length);
      produtosIndices.add(randomIndex);
    }
    
    Array.from(produtosIndices).forEach(idx => {
      const produto = produtosDisponiveis[idx];
      const quantidade = Math.floor(Math.random() * 10) + 1;
      const totalVendido = produto.preco * quantidade;
      const custo = produto.custo * quantidade;
      const margem = totalVendido - custo;
      const margemPercentual = margem / totalVendido;
      
      produtosConsultor.push({
        id: `PROD-${idx}`,
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco,
        custo: produto.custo,
        margem,
        margemPercentual,
        quantidade,
        totalVendido
      });
    });
    
    // Ordenar por margem (decrescente)
    produtosConsultor.sort((a, b) => b.margem - a.margem);
    
    // Calcular totais para o consultor
    const totalProdutosVendidos = produtosConsultor.reduce((total, p) => total + p.quantidade, 0);
    const faturamentoTotal = produtosConsultor.reduce((total, p) => total + p.totalVendido, 0);
    const custoTotal = produtosConsultor.reduce((total, p) => total + (p.custo * p.quantidade), 0);
    const margemTotal = faturamentoTotal - custoTotal;
    const margemMediaPercentual = margemTotal / faturamentoTotal;
    
    return {
      id: consultor.id,
      nome: consultor.nome,
      totalProdutosVendidos,
      faturamentoTotal,
      custoTotal,
      margemTotal,
      margemMediaPercentual,
      produtos: produtosConsultor
    };
  });
  
  // Análise por categoria - consolidar dados de todos os consultores
  const categoriasMap = new Map<string, CategoriaAnalise>();
  
  consultoresData.forEach(consultor => {
    consultor.produtos.forEach(produto => {
      const categoriaAtual = categoriasMap.get(produto.categoria);
      
      if (categoriaAtual) {
        categoriaAtual.quantidade += produto.quantidade;
        categoriaAtual.faturamento += produto.totalVendido;
        categoriaAtual.margem += produto.margem;
      } else {
        categoriasMap.set(produto.categoria, {
          categoria: produto.categoria,
          quantidade: produto.quantidade,
          percentual: 0, // Será calculado depois
          faturamento: produto.totalVendido,
          margem: produto.margem,
          giro: Math.floor(Math.random() * 100) // Simulação de giro
        });
      }
    });
  });
  
  // Calcular percentuais por categoria
  const totalQuantidade = Array.from(categoriasMap.values()).reduce((total, cat) => total + cat.quantidade, 0);
  const categoriasAnalise = Array.from(categoriasMap.values()).map(cat => {
    cat.percentual = cat.quantidade / totalQuantidade;
    return cat;
  }).sort((a, b) => b.quantidade - a.quantidade);
  
  return {
    consultores: consultoresData,
    categorias: categoriasAnalise,
    periodoInicio: dataInicio || '2023-01-01',
    periodoFim: dataFim || '2023-12-31'
  };
}

// Rota GET para obter dados de produtos vendidos por consultores
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio') || undefined;
    const dataFim = searchParams.get('dataFim') || undefined;
    const consultorId = searchParams.get('consultorId') || undefined;
    
    // Aqui você faria a chamada para a API do Gestão Click ou seu banco de dados
    // para obter os dados reais de produtos vendidos
    
    // Para desenvolvimento, usamos dados mockados
    // Simula um atraso na resposta para testar estados de loading
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const data = generateMockData(dataInicio, dataFim, consultorId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar requisição de produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição de produtos' },
      { status: 500 }
    );
  }
} 