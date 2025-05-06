import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/app/_lib/prisma";

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
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar todas as metas
    const metas = await (db as any).meta.findMany({
      orderBy: { mesReferencia: "desc" },
    });
    
    // Processar o campo metasVendedores para deserializar o JSON
    const metasProcessadas = metas.map((meta: any) => {
      try {
        // Garantir que metasVendedores sempre seja um array ou null
        let metasVendedores = null;
        
        if (meta.metasVendedores) {
          try {
            const parsedValue = JSON.parse(meta.metasVendedores as string);
            // Verificar se o resultado é realmente um array
            metasVendedores = Array.isArray(parsedValue) ? parsedValue : [];
          } catch (parseError) {
            console.error(`Erro ao processar JSON de metasVendedores para meta ${meta.id}:`, parseError);
            metasVendedores = [];
          }
        } else {
          metasVendedores = [];
        }
        
        return {
          ...meta,
          metasVendedores
        };
      } catch (error) {
        console.error(`Erro ao processar metasVendedores para meta ${meta.id}:`, error);
        return {
          ...meta,
          metasVendedores: []
        };
      }
    });

    return NextResponse.json(metasProcessadas);
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
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

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

    // Verificar se já existe uma meta para o mesmo mês
    const mesReferencia = new Date(body.mesReferencia);
    const firstDayOfMonth = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1);
    const lastDayOfMonth = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0);
    
    const existingMeta = await (db as any).meta.findFirst({
      where: {
        mesReferencia: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth,
        },
      },
    });

    if (existingMeta) {
      return NextResponse.json(
        { error: "Já existe uma meta cadastrada para este mês" },
        { status: 409 }
      );
    }

    // Criar nova meta
    const novaMeta = await (db as any).meta.create({
      data: {
        mesReferencia: body.mesReferencia,
        metaMensal: body.metaMensal,
        metaSalvio: body.metaSalvio,
        metaCoordenador: body.metaCoordenador,
        metasVendedores: body.metasVendedores ? JSON.stringify(body.metasVendedores) : null,
        criadoPor: session.user.id,
      },
    });

    return NextResponse.json(novaMeta, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    return NextResponse.json(
      { error: "Erro ao criar meta" },
      { status: 500 }
    );
  }
} 
