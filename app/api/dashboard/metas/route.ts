import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

// Schema para validação dos dados de entrada
const metaSchema = z.object({
  mesReferencia: z.date(),
  metaMensal: z.number().positive("O valor deve ser positivo"),
  metaSalvio: z.number().positive("O valor deve ser positivo"),
  metaCoordenador: z.number().positive("O valor deve ser positivo"),
  metasVendedores: z.array(
    z.object({
      vendedorId: z.string().min(1, "Vendedor obrigatório"),
      nome: z.string(),
      meta: z.number().positive("O valor deve ser positivo")
    })
  ).optional(),
});

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

// GET - Listar todas as metas
export async function GET(request: NextRequest) {
  try {
    // Removida validação server-side - a autenticação é feita no cliente
    console.log("[API] Retornando metas sem validação server-side");

    // Retornar dados mockados para desenvolvimento
    // TODO: Implementar busca real no banco quando necessário
    const mockData = generateMockData();
    
    // Converter dados mockados para formato de metas
    const metas = [
      {
        id: 'meta-1',
        mesReferencia: new Date('2025-09-01'),
        metaMensal: mockData.metaGlobal.meta,
        metaSalvio: mockData.metaGlobal.meta * 0.6,
        metaCoordenador: mockData.metaGlobal.meta * 0.8,
        metasVendedores: mockData.metasRealizadas.map((meta, index) => ({
          vendedorId: `vendedor-${index + 1}`,
          nome: meta.consultor,
          meta: meta.meta
        })),
        criadoPor: 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Configurar headers para evitar cache
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('Surrogate-Control', 'no-store');

    return new NextResponse(JSON.stringify(metas), {
      headers,
      status: 200
    });
  } catch (error) {
    console.error("Erro ao listar metas:", error);
    return NextResponse.json(
      { error: "Erro ao listar metas" },
      { status: 500 }
    );
  }
}

// POST - Criar nova meta
export async function POST(request: NextRequest) {
  try {
    // Removida validação server-side - a autenticação é feita no cliente
    console.log("[API] Criando meta sem validação server-side");

    // Obter e validar os dados do corpo da requisição
    const body = await request.json();
    
    // Converter a string de data para objeto Date
    if (typeof body.mesReferencia === "string") {
      body.mesReferencia = new Date(body.mesReferencia);
    }
    
    // Validar os dados
    const result = metaSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: result.error.format() },
        { status: 400 }
      );
    }

    // Simular criação de meta para desenvolvimento
    // TODO: Implementar criação real no banco quando necessário
    const novaMeta = {
      id: `meta-${Date.now()}`,
      mesReferencia: body.mesReferencia,
      metaMensal: body.metaMensal,
      metaSalvio: body.metaSalvio,
      metaCoordenador: body.metaCoordenador,
      metasVendedores: body.metasVendedores || [],
      criadoPor: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log("[API] Meta criada (simulada):", novaMeta);
    return NextResponse.json(novaMeta, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    return NextResponse.json(
      { error: "Erro ao criar meta" },
      { status: 500 }
    );
  }
} 
