import { NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { dynamic, fetchCache, revalidate } from '../_utils/dynamic-config';

export async function GET() {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Obter informações do usuário
    const userInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    // Tentar encontrar o usuário no banco
    const dbUser = await prisma.user.findFirst({
      where: {
        email: user.email,
      },
    });

    // Verificar se há diferença entre os IDs
    const idMatch = dbUser && dbUser.id === user.id;

    return NextResponse.json({
      sessionUser: userInfo,
      databaseUser: dbUser,
      idMatch,
    });
  } catch (error) {
    console.error("[DEBUG_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno ao depurar" },
      { status: 500 }
    );
  }
}

export { dynamic, fetchCache, revalidate }; 