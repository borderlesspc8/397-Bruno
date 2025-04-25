import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Contar total de transações do usuário
    const totalTransactions = await db.transaction.count({
      where: {
        userId: user.id,
      },
    });

    // Contar transações por tipo
    const transactionsByType = await db.$queryRaw`
      SELECT type, COUNT(*) as count
      FROM "Transaction"
      WHERE "userId" = ${user.id}
      GROUP BY type
      ORDER BY count DESC
    `;

    // Contar transações por carteira
    const transactionsByWallet = await db.$queryRaw`
      SELECT w.name as wallet_name, COUNT(t.id) as count
      FROM "Transaction" t
      JOIN "Wallet" w ON t."walletId" = w.id
      WHERE t."userId" = ${user.id}
      GROUP BY w.name
      ORDER BY count DESC
    `;

    // Contar as 10 categorias mais comuns
    const transactionsByCategory = await db.$queryRaw`
      SELECT category, COUNT(*) as count
      FROM "Transaction"
      WHERE "userId" = ${user.id}
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `;

    // Verificar se há transações sem carteira associada
    const transactionsWithoutWallet = await db.transaction.count({
      where: {
        userId: user.id,
        walletId: null,
      },
    });

    return NextResponse.json({
      totalTransactions,
      transactionsByType,
      transactionsByWallet,
      transactionsByCategory,
      transactionsWithoutWallet,
      message: `Total de ${totalTransactions} transações encontradas no banco de dados.`
    });
  } catch (error) {
    console.error("[TRANSACTION_COUNT] Erro:", error);
    return NextResponse.json(
      { error: "Erro interno ao contar transações" },
      { status: 500 }
    );
  }
} 