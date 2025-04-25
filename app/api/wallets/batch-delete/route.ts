import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth-options";

export async function DELETE(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter IDs das carteiras a serem excluídas
    const { walletIds } = await request.json();

    if (!Array.isArray(walletIds) || walletIds.length === 0) {
      return NextResponse.json(
        { error: "IDs de carteiras inválidos" },
        { status: 400 }
      );
    }

    // Verificar se todas as carteiras pertencem ao usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const wallets = await prisma.wallet.findMany({
      where: {
        id: { in: walletIds },
        userId: user.id
      }
    });

    if (wallets.length !== walletIds.length) {
      return NextResponse.json(
        { error: "Algumas carteiras não pertencem ao usuário" },
        { status: 403 }
      );
    }

    // Excluir todas as transações das carteiras
    await prisma.transaction.deleteMany({
      where: {
        walletId: { in: walletIds }
      }
    });

    // Excluir as carteiras
    await prisma.wallet.deleteMany({
      where: {
        id: { in: walletIds },
        userId: user.id
      }
    });

    return NextResponse.json({
      message: "Carteiras excluídas com sucesso",
      deletedCount: walletIds.length
    });
  } catch (error) {
    console.error("[WALLET] Erro ao excluir carteiras:", error);
    return NextResponse.json(
      { error: "Erro ao excluir carteiras" },
      { status: 500 }
    );
  }
} 