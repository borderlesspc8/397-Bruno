import { NextResponse } from 'next/server';

// Interfaces para os tipos de dados
interface MetaRealizado {
  consultor: string;
  meta: number;
  realizado: number;
  percentual: number;
}

interface TaxaRecompra {
  consultor: string;
  clientesTotal: number;
  clientesRetorno: number;
  taxa: number;
}

interface Inadimplencia {
  consultor: string;
  vendasTotal: number;
  vendasInadimplentes: number;
  taxa: number;
}

interface VariacaoVendas {
  periodo: string;
  valor: number;
  variacao: number;
}

interface DashboardMetasData {
  metasRealizadas: MetaRealizado[];
  taxasRecompra: TaxaRecompra[];
  inadimplencia: Inadimplencia[];
  variacaoVendas: VariacaoVendas[];
  metaGlobal: {
    meta: number;
    realizado: number;
    percentual: number;
  };
}

// Função para gerar dados mockados para desenvolvimento
function generateMockData(): DashboardMetasData {
  const consultores = [
    'Ana Silva',
    'Carlos Santos',
    'Juliana Oliveira',
    'Roberto Almeida',
    'Patricia Lima'
  ];

  // Dados de metas realizadas por consultor
  const metasRealizadasData: MetaRealizado[] = consultores.map(consultor => {
    const meta = Math.floor(Math.random() * 30000) + 10000;
    const realizado = Math.floor(Math.random() * (meta * 1.3));
    
    return {
      consultor,
      meta,
      realizado,
      percentual: realizado / meta
    };
  });

  // Calcular meta global
  const metaGlobal = {
    meta: metasRealizadasData.reduce((acc, curr) => acc + curr.meta, 0),
    realizado: metasRealizadasData.reduce((acc, curr) => acc + curr.realizado, 0),
    percentual: 0
  };
  metaGlobal.percentual = metaGlobal.realizado / metaGlobal.meta;

  // Dados de taxa de recompra
  const taxasRecompraData: TaxaRecompra[] = consultores.map(consultor => {
    const clientesTotal = Math.floor(Math.random() * 100) + 20;
    const clientesRetorno = Math.floor(Math.random() * clientesTotal);
    
    return {
      consultor,
      clientesTotal,
      clientesRetorno,
      taxa: clientesRetorno / clientesTotal
    };
  });

  // Dados de inadimplência
  const inadimplenciaData: Inadimplencia[] = consultores.map(consultor => {
    const vendasTotal = Math.floor(Math.random() * 50000) + 10000;
    const vendasInadimplentes = Math.floor(Math.random() * (vendasTotal * 0.3));
    
    return {
      consultor,
      vendasTotal,
      vendasInadimplentes,
      taxa: vendasInadimplentes / vendasTotal
    };
  });

  // Dados de variação de vendas (últimos 6 meses)
  const variacaoVendasData: VariacaoVendas[] = [];
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'];
  
  let valorAnterior = 40000;
  for (let i = 0; i < meses.length; i++) {
    const variacao = (Math.random() * 0.4) - 0.2; // Entre -20% e +20%
    const valor = Math.floor(valorAnterior * (1 + variacao));
    
    variacaoVendasData.push({
      periodo: meses[i],
      valor,
      variacao: valor / valorAnterior - 1
    });
    
    valorAnterior = valor;
  }

  return {
    metasRealizadas: metasRealizadasData,
    taxasRecompra: taxasRecompraData,
    inadimplencia: inadimplenciaData,
    variacaoVendas: variacaoVendasData,
    metaGlobal
  };
}

// Rota GET para o dashboard de metas
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