import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { calculateSimpleWalletBalance } from "@/app/_utils/wallet-balance";

export async function GET(
  request: Request,
  { params }: { params: { walletId: string } }
) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar carteira com informações básicas
    const wallet = await prisma.wallet.findUnique({
      where: {
        id: params.walletId,
        userId: session.user.id,
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true
          }
        },
        transactions: {
          orderBy: {
            date: "desc",
          },
          take: 10,
          select: {
            id: true,
            name: true,
            amount: true,
            date: true,
            type: true
          }
        },
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
    }

    // Calcular o saldo usando a função simplificada
    const calculatedBalance = await calculateSimpleWalletBalance(params.walletId, session.user.id);
    const wasUpdated = wallet.balance !== calculatedBalance;
    
    // Atualizar o saldo se necessário
    if (wasUpdated) {
      await prisma.wallet.update({
        where: { id: params.walletId },
        data: { balance: calculatedBalance }
      });
    }

    // Contagem de transações
    const transactionCount = await prisma.transaction.count({
      where: { walletId: params.walletId }
    });

    // Converter para objeto simples com valores primários para garantir serialização
    const safeWallet = {
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      balance: wallet.balance,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
      userId: wallet.userId,
      metadata: wallet.metadata,
      bank: wallet.bank,
      transactions: wallet.transactions.map(tx => ({
        ...tx,
        date: tx.date.toISOString()
      })),
      calculatedBalance,
      balanceWasUpdated: wasUpdated,
      transactionCount
    };

    return NextResponse.json({ wallet: safeWallet });
  } catch (error) {
    console.error("[WALLET_DETAILS_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 