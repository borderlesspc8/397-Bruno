import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { dynamic, fetchCache, revalidate } from '../_utils/dynamic-config';

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const banks = await prisma.bank.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ banks });
  } catch (error) {
    console.error("[BANKS_GET]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Comentando a exportação duplicada que está causando o erro
// export { dynamic, fetchCache, revalidate }; 