import { NextResponse } from 'next/server';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


// Interfaces para os tipos de dados
interface ConsultorPerformance {
  nome: string;
  vendas: number;
  valor: number;
  conversao: number;
  atendimentos: number;
  score: number;
  posicao: number;
}

interface BonificacaoConsultor {
  nome: string;
  bonificacao: number;
  meta: number;
  desempenho: number; // percentual da meta
  categorias: {
    vendas: number;
    atendimentos: number;
    conversao: number;
    retencao: number;
    satisfacao: number;
  };
}

interface EvoluçãoPerformance {
  periodo: string;
  consultores: {
    nome: string;
    score: number;
  }[];
}

interface DashboardPerformanceData {
  consultores: ConsultorPerformance[];
  bonificacoes: BonificacaoConsultor[];
  evolucao: EvoluçãoPerformance[];
}

// Função para gerar dados mockados para desenvolvimento
function generateMockData(): DashboardPerformanceData {
  const consultores = [
    'Ana Silva',
    'Carlos Santos',
    'Juliana Oliveira',
    'Roberto Almeida',
    'Patricia Lima'
  ];

  // Dados de performance por consultor
  const consultoresData: ConsultorPerformance[] = consultores.map((nome, index) => {
    const vendas = Math.floor(Math.random() * 50) + 10;
    const valor = Math.floor(Math.random() * 100000) + 20000;
    const conversao = Math.random() * 0.5 + 0.2; // 20% a 70%
    const atendimentos = Math.floor(vendas / conversao);
    const score = (
      (vendas * 0.3) + 
      (valor / 10000 * 0.3) + 
      (conversao * 100 * 0.4)
    );
    
    return {
      nome,
      vendas,
      valor,
      conversao,
      atendimentos,
      score,
      posicao: index + 1
    };
  });

  // Reorganizar posições com base no score
  consultoresData.sort((a, b) => b.score - a.score);
  consultoresData.forEach((consultor, index) => {
    consultor.posicao = index + 1;
  });

  // Dados de bonificação
  const bonificacoesData: BonificacaoConsultor[] = consultores.map(nome => {
    const meta = Math.floor(Math.random() * 50000) + 20000;
    const desempenho = Math.random() * 0.6 + 0.6; // 60% a 120% da meta
    const bonificacao = Math.floor(meta * desempenho * 0.1); // 10% do valor realizado

    return {
      nome,
      bonificacao,
      meta,
      desempenho,
      categorias: {
        vendas: Math.floor(Math.random() * 10) + 1,
        atendimentos: Math.floor(Math.random() * 10) + 1,
        conversao: Math.floor(Math.random() * 10) + 1,
        retencao: Math.floor(Math.random() * 10) + 1,
        satisfacao: Math.floor(Math.random() * 10) + 1,
      }
    };
  });

  // Organizar bonificações na mesma ordem do ranking de consultores
  const bonificacoesOrdenadas: BonificacaoConsultor[] = [];
  consultoresData.forEach(consultor => {
    const bonificacao = bonificacoesData.find(b => b.nome === consultor.nome);
    if (bonificacao) {
      bonificacoesOrdenadas.push(bonificacao);
    }
  });

  // Dados de evolução ao longo do tempo (últimos 6 meses)
  const evolucaoData: EvoluçãoPerformance[] = [];
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'];
  
  meses.forEach(mes => {
    const consultoresDoMes = consultores.map(nome => {
      return {
        nome,
        score: Math.floor(Math.random() * 50) + 30
      };
    });
    
    evolucaoData.push({
      periodo: mes,
      consultores: consultoresDoMes
    });
  });

  return {
    consultores: consultoresData,
    bonificacoes: bonificacoesOrdenadas,
    evolucao: evolucaoData
  };
}

// Rota GET para o dashboard de performance
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');

  // Aqui você faria a chamada para a API do Gestão Click para obter os dados reais
  // Para desenvolvimento, usamos dados mockados
  
  // Simula um atraso na resposta para testar estados de loading
  await new Promise(resolve => setTimeout(resolve, 800));

  const data = generateMockData();
  
  return NextResponse.json(data);
} 
