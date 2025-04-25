import { NextResponse } from 'next/server';
import { format, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces para os tipos de dados históricos
interface HistoricoVendas {
  periodo: string;
  data: string; // ISO format
  consultores: Array<{
    id: string;
    nome: string;
    vendas: number;
    faturamento: number;
    atendimentos: number;
    conversao: number;
  }>;
}

interface ComparativoPeriodos {
  atual: {
    inicio: string;
    fim: string;
    faturamentoTotal: number;
    vendasTotal: number;
  };
  anterior: {
    inicio: string;
    fim: string;
    faturamentoTotal: number;
    vendasTotal: number;
  };
  variacao: {
    faturamento: number; // percentual em decimal
    vendas: number; // percentual em decimal
  };
  porConsultor: Array<{
    id: string;
    nome: string;
    atual: {
      faturamento: number;
      vendas: number;
    };
    anterior: {
      faturamento: number;
      vendas: number;
    };
    variacao: {
      faturamento: number; // percentual em decimal
      vendas: number; // percentual em decimal
    };
  }>;
}

interface HistoricoResponse {
  historico: HistoricoVendas[];
  comparativo: ComparativoPeriodos;
}

// Função para gerar dados mockados de histórico
function generateMockHistorico(
  dataInicio?: string, 
  dataFim?: string, 
  consultorId?: string,
  tipoPeriodo: 'diario' | 'semanal' | 'mensal' = 'mensal'
): HistoricoResponse {
  // Datas padrão se não forem fornecidas
  const dataFimParsed = dataFim ? parseISO(dataFim) : new Date();
  const dataInicioParsed = dataInicio ? parseISO(dataInicio) : subMonths(dataFimParsed, 6);
  
  // Nomes de consultores para simulação
  const consultores = [
    { id: 'CONS-1000', nome: 'Ana Silva' },
    { id: 'CONS-1001', nome: 'Carlos Santos' },
    { id: 'CONS-1002', nome: 'Juliana Oliveira' },
    { id: 'CONS-1003', nome: 'Roberto Almeida' },
    { id: 'CONS-1004', nome: 'Patricia Lima' },
  ];
  
  // Filtrar por consultorId se fornecido
  const consultoresFiltrados = consultorId 
    ? consultores.filter(c => c.id === consultorId || c.nome.toLowerCase().includes(consultorId.toLowerCase()))
    : consultores;
  
  // Gerar dados históricos por mês (últimos 6 meses)
  const periodos = [];
  for (let i = 0; i < 6; i++) {
    const periodoData = subMonths(dataFimParsed, i);
    const periodoStr = format(periodoData, 'MMMM yyyy', { locale: ptBR });
    const dataStr = format(periodoData, 'yyyy-MM-dd');
    
    const consultoresData = consultoresFiltrados.map(consultor => {
      const vendas = Math.floor(Math.random() * 50) + 5;
      const faturamento = vendas * (Math.floor(Math.random() * 5000) + 1000);
      const atendimentos = vendas + Math.floor(Math.random() * 30) + 10;
      const conversao = vendas / atendimentos;
      
      return {
        id: consultor.id,
        nome: consultor.nome,
        vendas,
        faturamento,
        atendimentos,
        conversao
      };
    });
    
    periodos.push({
      periodo: periodoStr,
      data: dataStr,
      consultores: consultoresData
    });
  }
  
  // Ordenar períodos do mais recente ao mais antigo
  periodos.sort((a, b) => (parseISO(b.data).getTime() - parseISO(a.data).getTime()));
  
  // Gerar comparativo entre períodos (atual vs anterior)
  const periodoAtual = periodos[0];
  const periodoAnterior = periodos[1];
  
  // Calcular totais para cada período
  const faturamentoAtual = periodoAtual.consultores.reduce((total, c) => total + c.faturamento, 0);
  const vendasAtual = periodoAtual.consultores.reduce((total, c) => total + c.vendas, 0);
  const faturamentoAnterior = periodoAnterior.consultores.reduce((total, c) => total + c.faturamento, 0);
  const vendasAnterior = periodoAnterior.consultores.reduce((total, c) => total + c.vendas, 0);
  
  // Calcular variações percentuais
  const variacaoFaturamento = faturamentoAnterior > 0 
    ? (faturamentoAtual - faturamentoAnterior) / faturamentoAnterior 
    : 1;
  const variacaoVendas = vendasAnterior > 0 
    ? (vendasAtual - vendasAnterior) / vendasAnterior 
    : 1;
  
  // Gerar comparativo por consultor
  const comparativoPorConsultor = consultoresFiltrados.map(consultor => {
    const dadosAtual = periodoAtual.consultores.find(c => c.id === consultor.id);
    const dadosAnterior = periodoAnterior.consultores.find(c => c.id === consultor.id);
    
    if (!dadosAtual || !dadosAnterior) return null;
    
    const variacaoFaturamentoConsultor = dadosAnterior.faturamento > 0 
      ? (dadosAtual.faturamento - dadosAnterior.faturamento) / dadosAnterior.faturamento 
      : 1;
    const variacaoVendasConsultor = dadosAnterior.vendas > 0 
      ? (dadosAtual.vendas - dadosAnterior.vendas) / dadosAnterior.vendas 
      : 1;
    
    return {
      id: consultor.id,
      nome: consultor.nome,
      atual: {
        faturamento: dadosAtual.faturamento,
        vendas: dadosAtual.vendas
      },
      anterior: {
        faturamento: dadosAnterior.faturamento,
        vendas: dadosAnterior.vendas
      },
      variacao: {
        faturamento: variacaoFaturamentoConsultor,
        vendas: variacaoVendasConsultor
      }
    };
  }).filter(Boolean) as Array<any>;
  
  return {
    historico: periodos,
    comparativo: {
      atual: {
        inicio: periodos[0].data,
        fim: periodos[0].data, // No caso mensal, início e fim são o mesmo
        faturamentoTotal: faturamentoAtual,
        vendasTotal: vendasAtual
      },
      anterior: {
        inicio: periodos[1].data,
        fim: periodos[1].data,
        faturamentoTotal: faturamentoAnterior,
        vendasTotal: vendasAnterior
      },
      variacao: {
        faturamento: variacaoFaturamento,
        vendas: variacaoVendas
      },
      porConsultor: comparativoPorConsultor
    }
  };
}

// Rota GET para obter histórico de vendas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('dataInicio') || undefined;
    const dataFim = searchParams.get('dataFim') || undefined;
    const consultorId = searchParams.get('consultorId') || undefined;
    const tipoPeriodo = (searchParams.get('tipoPeriodo') as 'diario' | 'semanal' | 'mensal') || 'mensal';
    
    // Aqui você faria a chamada para a API do Gestão Click ou seu banco de dados
    // para obter os dados reais históricos
    
    // Para desenvolvimento, usamos dados mockados
    // Simula um atraso na resposta para testar estados de loading
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const data = generateMockHistorico(dataInicio, dataFim, consultorId, tipoPeriodo);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao processar requisição de histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição de histórico' },
      { status: 500 }
    );
  }
} 