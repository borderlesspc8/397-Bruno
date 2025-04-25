import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { walletId: string } }
) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const walletId = params.walletId;
    
    if (!walletId) {
      return NextResponse.json(
        { error: "ID da carteira não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se a carteira pertence ao usuário
    const wallet = await prisma.wallet.findUnique({
      where: {
        id: walletId,
        userId: session.user.id
      }
    });

    if (!wallet) {
      return NextResponse.json(
        { error: "Carteira não encontrada ou não pertence ao usuário" },
        { status: 404 }
      );
    }

    // Excluir todas as transações associadas à carteira
    const result = await prisma.transaction.deleteMany({
      where: {
        walletId,
        userId: session.user.id // Garantia adicional de que só excluímos transações do próprio usuário
      }
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} transações excluídas com sucesso`
    });
  } catch (error) {
    console.error("Erro ao excluir transações da carteira:", error);
    
    return NextResponse.json(
      { error: "Erro ao processar a requisição" },
      { status: 500 }
    );
  }
} 