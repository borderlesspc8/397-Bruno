import { NextResponse } from 'next/server';

// Interfaces para os tipos de dados
interface ConsultorConversao {
  nome: string;
  atendimentos: number;
  vendas: number;
  taxa: number;
  tempoMedio: number;
  followUps: number;
  taxaFollowUp: number;
}

interface TempoFechamento {
  consultor: string;
  tempo: number;
  quantidade: number;
}

interface FollowUpData {
  consultor: string;
  leadsSemConversao: number;
  leadsRetomados: number;
  taxa: number;
}

interface NutricaoLead {
  consultor: string;
  diasSemContato: number[];
  leadsAtivos: number;
  leadsPerdidos: number;
}

interface DashboardConversaoData {
  consultores: ConsultorConversao[];
  tempoFechamento: TempoFechamento[];
  followUp: FollowUpData[];
  nutricaoLeads: NutricaoLead[];
}

// Função para gerar dados mockados para desenvolvimento
function generateMockData(): DashboardConversaoData {
  const consultores = [
    'Ana Silva',
    'Carlos Santos',
    'Juliana Oliveira',
    'Roberto Almeida',
    'Patricia Lima'
  ];

  // Dados de conversão por consultor
  const consultoresData: ConsultorConversao[] = consultores.map(nome => {
    const atendimentos = Math.floor(Math.random() * 150) + 50;
    const vendas = Math.floor(Math.random() * atendimentos);
    const taxa = vendas / atendimentos;
    const tempoMedio = Math.floor(Math.random() * 15) + 3;
    const followUps = Math.floor(Math.random() * 30) + 5;
    const taxaFollowUp = followUps / (atendimentos - vendas);

    return {
      nome,
      atendimentos,
      vendas,
      taxa,
      tempoMedio,
      followUps,
      taxaFollowUp
    };
  });

  // Dados de tempo de fechamento
  const tempoFechamentoData: TempoFechamento[] = consultores.map(consultor => {
    return {
      consultor,
      tempo: Math.floor(Math.random() * 20) + 1,
      quantidade: Math.floor(Math.random() * 50) + 10
    };
  });

  // Dados de follow-up
  const followUpData: FollowUpData[] = consultores.map(consultor => {
    const leadsSemConversao = Math.floor(Math.random() * 50) + 20;
    const leadsRetomados = Math.floor(Math.random() * leadsSemConversao);
    
    return {
      consultor,
      leadsSemConversao,
      leadsRetomados,
      taxa: leadsRetomados / leadsSemConversao
    };
  });

  // Dados de nutrição de leads
  const nutricaoLeadsData: NutricaoLead[] = consultores.map(consultor => {
    const diasSemContato = [
      Math.floor(Math.random() * 14) + 1
    ];
    const leadsAtivos = Math.floor(Math.random() * 80) + 20;
    const leadsPerdidos = Math.floor(Math.random() * 30) + 5;

    return {
      consultor,
      diasSemContato,
      leadsAtivos,
      leadsPerdidos
    };
  });

  return {
    consultores: consultoresData,
    tempoFechamento: tempoFechamentoData,
    followUp: followUpData,
    nutricaoLeads: nutricaoLeadsData
  };
}

// Rota GET para o dashboard de conversão
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