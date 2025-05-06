import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";
import { Prisma } from "@prisma/client";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const { user } = await getAuthSession();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Extrair parâmetros opcionais
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 500;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0;
    const showAll = searchParams.get("all") === "true";

    console.log(`[DEBUG_ENDPOINT] Buscando transações para depuração com limit=${limit}, offset=${offset}, showAll=${showAll}`);

    // Construir consulta básica
    const query = {
      where: {
        userId: user.id
      },
      include: {
        wallet: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        date: Prisma.SortOrder.desc
      },
      skip: offset,
      take: limit
    };

    // Se não for para mostrar tudo, adicionar limit
    if (!showAll) {
      query.take = limit;
    }

    // Executar consulta
    const transactions = await db.transaction.findMany(query);

    console.log(`[DEBUG_ENDPOINT] Encontradas ${transactions.length} transações`);

    // Converter datas para formato serializable
    const serializedTransactions = transactions.map(tx => ({
      ...tx,
      date: tx.date.toISOString(),
      createdAt: tx.createdAt.toISOString(),
      updatedAt: tx.updatedAt.toISOString()
    }));

    // Obter metadados adicionais
    const totalCount = await db.transaction.count({
      where: {
        userId: user.id
      }
    });

    // Retornar resposta
    return NextResponse.json({
      transactions: serializedTransactions,
      meta: {
        totalCount,
        limit,
        offset,
        returned: transactions.length
      }
    });
  } catch (error) {
    console.error("[DEBUG_ENDPOINT] Erro:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
} 
