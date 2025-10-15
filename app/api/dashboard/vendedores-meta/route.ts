import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { requireMetasAccess } from "@/app/_lib/auth-permissions";
import { db } from "@/app/_lib/prisma";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

// GET - Listar todos os vendedores para o formulário de metas
export async function GET(request: NextRequest) {
  try {
    // Verificar permissões de acesso
    const { success, error } = await requireMetasAccess(request);
    if (!success) {
      return NextResponse.json(
        { 
          error: 'Acesso negado',
          message: error || 'Você não tem permissão para acessar esta rota'
        },
        { status: 403 }
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
