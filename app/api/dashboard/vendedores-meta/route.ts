import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { db } from "@/app/_lib/prisma";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

// GET - Listar todos os vendedores para o formulário de metas
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

    // Buscar vendedores
    const vendedores = await (db as any).vendedor.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        id: true,
        nome: true
      },
      orderBy: {
        nome: "asc"
      }
    });

    return NextResponse.json(vendedores);
  } catch (error) {
    console.error("Erro ao listar vendedores:", error);
    return NextResponse.json(
      { error: "Erro ao listar vendedores" },
      { status: 500 }
    );
  }
} 