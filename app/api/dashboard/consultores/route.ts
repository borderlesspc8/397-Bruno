import { NextResponse } from 'next/server';

// Interfaces para os tipos de dados dos indicadores
interface ConsultorIndicadores {
  id: string;
  nome: string;
  // Indicadores básicos
  atendimentosRealizados: number;
  vendasRealizadas: number;
  taxaConversao: number; // em decimal (0.25 = 25%)
  faturamento: number;
  ticketMedio: number;
  
  // Indicadores de tempo e eficiência
  tempoMedioFechamento: number; // em dias
  followUpsRealizados: number;
  tempoMedioResposta: number; // em minutos
  
  // Indicadores de produtos
  quantidadeProdutosVendidos: number;
  produtosMaiorMargem: Array<{
    id: string;
    nome: string;
    quantidade: number;
    margem: number;
  }>;
  categoriasMaisVendidas: Array<{
    categoria: string;
    quantidade: number;
    percentual: number;
  }>;
  giroProdutos: number; // em %
  
  // Indicadores de metas e performance
  metaMensal: number;
  metaRealizado: number; // em %
  bonificacaoEstimada: number;
  
  // Indicadores de clientes
  clientesRecompra: number;
  taxaAbandono: number; // em decimal
  
  // Indicadores financeiros
  inadimplencia: number;
  formasPagamento: Array<{
    forma: string;
    quantidade: number;
    valor: number;
    percentual: number;
  }>;
  descontosAplicados: number;
  
  // Indicadores de origem
  origensLeadsMaisEficientes: Array<{
    origem: string;
    quantidade: number;
    conversao: number;
    percentual: number;
  }>;
  
  // Indicadores de variação
  variacaoMesAnterior: number; // em decimal
  variacaoAnoAnterior: number; // em decimal
  
  // Ranking
  posicaoRanking: number;
}

interface ConsultoresResponse {
  consultores: ConsultorIndicadores[];
  periodoInicio: string;
  periodoFim: string;
  totalConsultores: number;
}

// Função para gerar dados mockados para desenvolvimento
function generateMockData(dataInicio?: string, dataFim?: string): ConsultoresResponse {
  // Nomes de consultores para simulação
  const consultores = [
    'Ana Silva',
    'Carlos Santos',
    'Juliana Oliveira',
    'Roberto Almeida',
    'Patricia Lima',
    'Marcos Pereira',
    'Fernanda Costa',
    'Luiz Henrique',
    'Camila Rodrigues',
    'Diego Martins'
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
  
  // Formas de pagamento para simulação
  const formasPagamento = [
    'Cartão de Crédito',
    'Boleto',
    'PIX',
    'Transferência Bancária',
    'Dinheiro'
  ];
  
  // Origens de leads para simulação
  const origensLeads = [
    'Instagram',
    'Facebook',
    'Google',
    'Indicação',
    'Site',
    'WhatsApp',
    'E-mail Marketing',
    'Eventos',
    'Telemarketing',
    'Parcerias'
  ];

  // Gerar indicadores para cada consultor
  const consultoresData: ConsultorIndicadores[] = consultores.map((nome, index) => {
    // Dados básicos
    const id = `CONS-${index + 1000}`;
    const vendasRealizadas = Math.floor(Math.random() * 50) + 5;
    const atendimentosRealizados = vendasRealizadas + Math.floor(Math.random() * 70) + 10;
    const taxaConversao = vendasRealizadas / atendimentosRealizados;
    const ticketMedio = Math.floor(Math.random() * 5000) + 1000;
    const faturamento = vendasRealizadas * ticketMedio;
    
    // Tempo e eficiência
    const tempoMedioFechamento = Math.floor(Math.random() * 15) + 1;
    const followUpsRealizados = Math.floor(Math.random() * 200) + 50;
    const tempoMedioResposta = Math.floor(Math.random() * 120) + 5;
    
    // Produtos
    const quantidadeProdutosVendidos = Math.floor(Math.random() * 100) + 10;
    
    // Gerar produtos com maior margem
    const produtosMaiorMargem = Array.from({ length: 5 }, (_, i) => {
      return {
        id: `PROD-${i + 100}`,
        nome: `Produto Premium ${i+1}`,
        quantidade: Math.floor(Math.random() * 20) + 1,
        margem: Math.floor(Math.random() * 5000) + 500
      };
    }).sort((a, b) => b.margem - a.margem);
    
    // Gerar categorias mais vendidas
    const totalCategoriasVendidas = quantidadeProdutosVendidos;
    const categoriasMaisVendidas = categorias.slice(0, 5).map((categoria, i) => {
      const quantidade = Math.floor(Math.random() * 30) + 1;
      return {
        categoria,
        quantidade,
        percentual: quantidade / totalCategoriasVendidas
      };
    }).sort((a, b) => b.quantidade - a.quantidade);
    
    // Giro de produtos
    const giroProdutos = Math.floor(Math.random() * 100);
    
    // Metas e performance
    const metaMensal = Math.floor(Math.random() * 100000) + 20000;
    const metaRealizado = (faturamento / metaMensal) * 100;
    const bonificacaoEstimada = Math.floor(faturamento * 0.05);
    
    // Clientes
    const clientesRecompra = Math.floor(Math.random() * 20) + 1;
    const taxaAbandono = Math.random() * 0.4;
    
    // Financeiros
    const inadimplencia = Math.floor(Math.random() * 5000);
    
    // Formas de pagamento
    const totalVendas = vendasRealizadas;
    const formasPagamentoData = formasPagamento.map(forma => {
      const quantidade = Math.floor(Math.random() * vendasRealizadas);
      const valor = quantidade * ticketMedio;
      return {
        forma,
        quantidade,
        valor,
        percentual: quantidade / totalVendas
      };
    }).sort((a, b) => b.valor - a.valor);
    
    // Descontos
    const descontosAplicados = Math.floor(Math.random() * 10000);
    
    // Origens
    const origensLeadsMaisEficientes = origensLeads.map(origem => {
      const quantidade = Math.floor(Math.random() * 50) + 5;
      const conversao = Math.random() * 0.8;
      return {
        origem,
        quantidade,
        conversao,
        percentual: quantidade / atendimentosRealizados
      };
    }).sort((a, b) => b.conversao - a.conversao);
    
    // Variações
    const variacaoMesAnterior = (Math.random() * 0.5) - 0.2; // -20% a +30%
    const variacaoAnoAnterior = (Math.random() * 0.8) - 0.3; // -30% a +50%
    
    return {
      id,
      nome,
      atendimentosRealizados,
      vendasRealizadas,
      taxaConversao,
      faturamento,
      ticketMedio,
      tempoMedioFechamento,
      followUpsRealizados,
      tempoMedioResposta,
      quantidadeProdutosVendidos,
      produtosMaiorMargem,
      categoriasMaisVendidas,
      giroProdutos,
      metaMensal,
      metaRealizado,
      bonificacaoEstimada,
      clientesRecompra,
      taxaAbandono,
      inadimplencia,
      formasPagamento: formasPagamentoData,
      descontosAplicados,
      origensLeadsMaisEficientes,
      variacaoMesAnterior,
      variacaoAnoAnterior,
      posicaoRanking: 0 // será preenchido após ordenação
    };
  });
  
  // Ordenar consultores por faturamento e atribuir posição no ranking
  consultoresData.sort((a, b) => b.faturamento - a.faturamento);
  consultoresData.forEach((consultor, index) => {
    consultor.posicaoRanking = index + 1;
  });
  
  // Formatar resposta
  return {
    consultores: consultoresData,
    periodoInicio: dataInicio || '2023-01-01',
    periodoFim: dataFim || '2023-12-31',
    totalConsultores: consultoresData.length
  };
}

// Rota GET para obter indicadores de consultores Personal Prime
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio') || undefined;
    const dataFim = searchParams.get('dataFim') || undefined;
    const consultorId = searchParams.get('consultorId') || undefined;
    
    // Aqui você faria a chamada para a API do Gestão Click ou seu banco de dados
    // para obter os dados reais de consultores e seus indicadores
    
    // Para desenvolvimento, usamos dados mockados
    // Simula um atraso na resposta para testar estados de loading
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const data = generateMockData(dataInicio, dataFim);
    
    // Filtrar por consultorId se fornecido
    if (consultorId) {
      const consultorFiltrado = data.consultores.find(c => c.id === consultorId || c.nome.toLowerCase().includes(consultorId.toLowerCase()));
      
      if (!consultorFiltrado) {
        return NextResponse.json(
          { error: 'Consultor não encontrado' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        consultor: consultorFiltrado,
        periodoInicio: data.periodoInicio,
        periodoFim: data.periodoFim
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição' },
      { status: 500 }
    );
  }
} 