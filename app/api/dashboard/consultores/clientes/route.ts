import { NextResponse } from 'next/server';

// Interfaces para os tipos de dados de clientes
interface ClienteDetalhes {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  dataUltimaCompra: string; // ISO format
  dataUltimoContato: string; // ISO format
  statusAtual: 'Ativo' | 'Inativo' | 'Lead' | 'Fechado' | 'Inadimplente';
  valorCompras: number;
  comprasRealizadas: number;
  ticketMedio: number;
  inadimplencia: number;
  formasPagamentoUtilizadas: string[];
  produtos: Array<{
    id: string;
    nome: string;
    categoria: string;
    dataCompra: string;
    valor: number;
    desconto: number;
    statusPagamento: 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado';
  }>;
}

interface ConsultorClientes {
  id: string;
  nome: string;
  totalClientes: number;
  clientesAtivos: number;
  taxaRetencao: number;
  clientesInadimplentes: number;
  taxaInadimplencia: number;
  valorInadimplencia: number;
  clientesRecompra: number;
  taxaRecompra: number;
  clientes: ClienteDetalhes[];
}

interface SegmentacaoClientes {
  segmento: string;
  quantidade: number;
  percentual: number;
  valorTotal: number;
  descricao: string;
}

interface ClientesResponse {
  consultores: ConsultorClientes[];
  segmentacao: SegmentacaoClientes[];
  periodoInicio: string;
  periodoFim: string;
}

// Função para gerar dados mockados para desenvolvimento
function generateMockData(dataInicio?: string, dataFim?: string, consultorId?: string): ClientesResponse {
  // Nomes de consultores para simulação
  const consultores = [
    { id: 'CONS-1000', nome: 'Ana Silva' },
    { id: 'CONS-1001', nome: 'Carlos Santos' },
    { id: 'CONS-1002', nome: 'Juliana Oliveira' },
    { id: 'CONS-1003', nome: 'Roberto Almeida' },
    { id: 'CONS-1004', nome: 'Patricia Lima' },
  ];
  
  // Categorias de produtos para simulação
  const categorias = ['Eletrônicos', 'Móveis', 'Decoração', 'Utensílios', 'Vestuário', 'Calçados', 'Acessórios', 'Cursos', 'Serviços', 'Assinaturas'];
  
  // Produtos para simulação
  const produtos = [
    'Smartphone Premium',
    'Notebook Ultra',
    'Smart TV 55"',
    'Sofá 3 Lugares',
    'Mesa de Jantar',
    'Poltrona Reclinável',
    'Quadro Decorativo',
    'Luminária de Mesa',
    'Conjunto de Panelas',
    'Camisa Social',
    'Tênis Esportivo',
    'Relógio',
    'Bolsa',
    'Curso de Idiomas',
    'Consultoria de Marketing',
    'Streaming Premium'
  ];
  
  // Formas de pagamento para simulação
  const formasPagamento = [
    'Cartão de Crédito',
    'Boleto',
    'PIX',
    'Transferência Bancária',
    'Dinheiro'
  ];
  
  // Função para gerar uma data aleatória nos últimos 6 meses
  const gerarDataRecente = () => {
    const hoje = new Date();
    const diasAleatorios = Math.floor(Math.random() * 180); // últimos 6 meses
    const dataAleatoria = new Date(hoje);
    dataAleatoria.setDate(hoje.getDate() - diasAleatorios);
    return dataAleatoria.toISOString().split('T')[0];
  };
  
  // Filtrar consultores se um ID específico for fornecido
  const consultoresFiltrados = consultorId 
    ? consultores.filter(c => c.id === consultorId || c.nome.toLowerCase().includes(consultorId.toLowerCase()))
    : consultores;
  
  // Gerar dados de clientes por consultor
  const consultoresData: ConsultorClientes[] = consultoresFiltrados.map((consultor, index) => {
    // Determinar quantos clientes este consultor tem (entre 10 e 50)
    const numClientes = Math.floor(Math.random() * 41) + 10;
    
    // Gerar clientes para este consultor
    const clientesConsultor: ClienteDetalhes[] = [];
    
    for (let i = 0; i < numClientes; i++) {
      // Dados básicos do cliente
      const comprasRealizadas = Math.floor(Math.random() * 8) + 1;
      const valorCompraMedia = Math.floor(Math.random() * 2000) + 500;
      const valorCompras = comprasRealizadas * valorCompraMedia;
      const ticketMedio = valorCompras / comprasRealizadas;
      const inadimplencia = Math.random() < 0.2 ? Math.floor(Math.random() * valorCompras * 0.5) : 0;
      
      // Status do cliente
      let statusAtual: 'Ativo' | 'Inativo' | 'Lead' | 'Fechado' | 'Inadimplente';
      if (inadimplencia > 0) {
        statusAtual = 'Inadimplente';
      } else if (comprasRealizadas > 3) {
        statusAtual = 'Ativo';
      } else if (comprasRealizadas > 1) {
        statusAtual = Math.random() < 0.7 ? 'Ativo' : 'Inativo';
      } else {
        statusAtual = Math.random() < 0.5 ? 'Ativo' : Math.random() < 0.5 ? 'Lead' : 'Fechado';
      }
      
      // Formas de pagamento utilizadas
      const numFormasPagamento = Math.floor(Math.random() * 3) + 1;
      const formasPagamentoUtilizadas: string[] = [];
      for (let f = 0; f < numFormasPagamento; f++) {
        const formaPagamento = formasPagamento[Math.floor(Math.random() * formasPagamento.length)];
        if (!formasPagamentoUtilizadas.includes(formaPagamento)) {
          formasPagamentoUtilizadas.push(formaPagamento);
        }
      }
      
      // Produtos comprados
      const produtosComprados = [];
      for (let p = 0; p < comprasRealizadas; p++) {
        const produto = produtos[Math.floor(Math.random() * produtos.length)];
        const categoria = categorias[Math.floor(Math.random() * categorias.length)];
        const valor = Math.floor(Math.random() * 2000) + 300;
        const desconto = Math.random() < 0.6 ? Math.floor(Math.random() * valor * 0.2) : 0;
        
        let statusPagamento: 'Pago' | 'Pendente' | 'Atrasado' | 'Cancelado';
        if (inadimplencia > 0 && p === 0) {
          statusPagamento = 'Atrasado';
        } else if (Math.random() < 0.9) {
          statusPagamento = 'Pago';
        } else if (Math.random() < 0.8) {
          statusPagamento = 'Pendente';
        } else {
          statusPagamento = 'Cancelado';
        }
        
        produtosComprados.push({
          id: `PROD-${100 + Math.floor(Math.random() * 900)}`,
          nome: produto,
          categoria,
          dataCompra: gerarDataRecente(),
          valor,
          desconto,
          statusPagamento
        });
      }
      
      // Ordenar produtos por data (mais recente primeiro)
      produtosComprados.sort((a, b) => new Date(b.dataCompra).getTime() - new Date(a.dataCompra).getTime());
      
      const cliente: ClienteDetalhes = {
        id: `CLI-${1000 + (index * 100) + i}`,
        nome: `Cliente ${1000 + (index * 100) + i}`,
        email: `cliente${1000 + (index * 100) + i}@email.com`,
        telefone: `(${10 + Math.floor(Math.random() * 90)}) 9${Math.floor(Math.random() * 1000) + 8000}-${Math.floor(Math.random() * 10000)}`,
        dataUltimaCompra: produtosComprados.length > 0 ? produtosComprados[0].dataCompra : gerarDataRecente(),
        dataUltimoContato: gerarDataRecente(),
        statusAtual,
        valorCompras,
        comprasRealizadas,
        ticketMedio,
        inadimplencia,
        formasPagamentoUtilizadas,
        produtos: produtosComprados
      };
      
      clientesConsultor.push(cliente);
    }
    
    // Calcular métricas para o consultor
    const totalClientes = clientesConsultor.length;
    const clientesAtivos = clientesConsultor.filter(c => c.statusAtual === 'Ativo').length;
    const taxaRetencao = clientesAtivos / totalClientes;
    const clientesInadimplentes = clientesConsultor.filter(c => c.inadimplencia > 0).length;
    const taxaInadimplencia = clientesInadimplentes / totalClientes;
    const valorInadimplencia = clientesConsultor.reduce((total, c) => total + c.inadimplencia, 0);
    const clientesRecompra = clientesConsultor.filter(c => c.comprasRealizadas > 1).length;
    const taxaRecompra = clientesRecompra / totalClientes;
    
    return {
      id: consultor.id,
      nome: consultor.nome,
      totalClientes,
      clientesAtivos,
      taxaRetencao,
      clientesInadimplentes,
      taxaInadimplencia,
      valorInadimplencia,
      clientesRecompra,
      taxaRecompra,
      clientes: clientesConsultor
    };
  });
  
  // Gerar segmentação de clientes
  const segmentacao: SegmentacaoClientes[] = [
    {
      segmento: 'VIP',
      quantidade: Math.floor(Math.random() * 50) + 10,
      percentual: 0, // Será calculado depois
      valorTotal: Math.floor(Math.random() * 200000) + 50000,
      descricao: 'Clientes com alto valor de compra e frequência'
    },
    {
      segmento: 'Frequentes',
      quantidade: Math.floor(Math.random() * 100) + 30,
      percentual: 0,
      valorTotal: Math.floor(Math.random() * 150000) + 30000,
      descricao: 'Clientes com múltiplas compras'
    },
    {
      segmento: 'Novos',
      quantidade: Math.floor(Math.random() * 150) + 50,
      percentual: 0,
      valorTotal: Math.floor(Math.random() * 80000) + 20000,
      descricao: 'Clientes com primeira compra recente'
    },
    {
      segmento: 'Inativos',
      quantidade: Math.floor(Math.random() * 80) + 20,
      percentual: 0,
      valorTotal: Math.floor(Math.random() * 50000) + 10000,
      descricao: 'Clientes sem compras recentes'
    },
    {
      segmento: 'Leads',
      quantidade: Math.floor(Math.random() * 200) + 100,
      percentual: 0,
      valorTotal: 0,
      descricao: 'Potenciais clientes em processo de conversão'
    }
  ];
  
  // Calcular percentuais da segmentação
  const totalSegmentacao = segmentacao.reduce((total, seg) => total + seg.quantidade, 0);
  segmentacao.forEach(seg => {
    seg.percentual = seg.quantidade / totalSegmentacao;
  });
  
  return {
    consultores: consultoresData,
    segmentacao,
    periodoInicio: dataInicio || '2023-01-01',
    periodoFim: dataFim || '2023-12-31'
  };
}

// Rota GET para obter dados de clientes dos consultores
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio') || undefined;
    const dataFim = searchParams.get('dataFim') || undefined;
    const consultorId = searchParams.get('consultorId') || undefined;
    
    // Aqui você faria a chamada para a API do Gestão Click ou seu banco de dados
    // para obter os dados reais de clientes
    
    // Para desenvolvimento, usamos dados mockados
    // Simula um atraso na resposta para testar estados de loading
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const data = generateMockData(dataInicio, dataFim, consultorId);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar requisição de clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição de clientes' },
      { status: 500 }
    );
  }
} 