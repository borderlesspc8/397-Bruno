import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { z } from "zod";

import { db } from "@/app/_lib/prisma";

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

// GET - Obter meta específica por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar meta por ID
    const meta = await (db as any).meta.findUnique({
      where: { id: params.id },
    });

    if (!meta) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }
    
    // Processar o campo metasVendedores
    try {
      // Garantir que metasVendedores sempre seja um array
      let metasVendedores = [];
      
      if (meta.metasVendedores) {
        try {
          const parsedValue = JSON.parse(meta.metasVendedores as string);
          // Verificar se o resultado é realmente um array
          metasVendedores = Array.isArray(parsedValue) ? parsedValue : [];
        } catch (parseError) {
          console.error(`Erro ao processar JSON de metasVendedores para meta ${meta.id}:`, parseError);
          metasVendedores = [];
        }
      }
      
      const metaProcessada = {
        ...meta,
        metasVendedores
      };
      return NextResponse.json(metaProcessada);
    } catch (error) {
      console.error(`Erro ao processar metasVendedores para meta ${meta.id}:`, error);
      return NextResponse.json({
        ...meta,
        metasVendedores: []
      });
    }
  } catch (error) {
    console.error("Erro ao obter meta:", error);
    return NextResponse.json(
      { error: "Erro ao obter meta" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar meta por ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se a meta existe
    const metaExistente = await (db as any).meta.findUnique({
      where: { id: params.id },
    });

    if (!metaExistente) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    // Obter e validar os dados do corpo da requisição
    const body = await request.json();
    
    // Converter a string de data para objeto Date se necessário
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

    // Verificar se já existe outra meta para o mesmo mês (excluindo a meta atual)
    const mesReferencia = new Date(body.mesReferencia);
    const firstDayOfMonth = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth(), 1);
    const lastDayOfMonth = new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + 1, 0);
    
    const existingMeta = await (db as any).meta.findFirst({
      where: {
        AND: [
          {
            mesReferencia: {
              gte: firstDayOfMonth,
              lte: lastDayOfMonth,
            },
          },
          {
            id: {
              not: params.id,
            },
          },
        ],
      },
    });

    if (existingMeta) {
      return NextResponse.json(
        { error: "Já existe outra meta cadastrada para este mês" },
        { status: 409 }
      );
    }

    // Atualizar meta
    const metaAtualizada = await (db as any).meta.update({
      where: { id: params.id },
      data: {
        mesReferencia: body.mesReferencia,
        metaMensal: body.metaMensal,
        metaSalvio: body.metaSalvio,
        metaCoordenador: body.metaCoordenador,
        metasVendedores: body.metasVendedores ? JSON.stringify(body.metasVendedores) : null,
        atualizadoPor: session.user.id,
      },
    });

    return NextResponse.json(metaAtualizada);
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar meta" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir meta por ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Verificar se a meta existe
    const metaExistente = await (db as any).meta.findUnique({
      where: { id: params.id },
    });

    if (!metaExistente) {
      return NextResponse.json(
        { error: "Meta não encontrada" },
        { status: 404 }
      );
    }

    // Excluir meta
    await (db as any).meta.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir meta:", error);
    return NextResponse.json(
      { error: "Erro ao excluir meta" },
      { status: 500 }
    );
  }
} 