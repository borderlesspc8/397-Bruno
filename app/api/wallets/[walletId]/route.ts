import { getAuthSession } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { calculateWalletBalance } from "@/app/_utils/wallet-balance";

const updateWalletSchema = z.object({
  name: z.string().min(1).optional(),
  balance: z.number().min(0).optional(),
  type: z.enum(["MANUAL", "BANK", "BANK_INTEGRATION"]).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { walletId: string } }
) {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const wallet = await db.wallet.findUnique({
      where: {
        id: params.walletId,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
    }

    if (wallet.userId !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, balance } = updateWalletSchema.parse(body);

    // Se o balance não foi fornecido, calcular com base nas transações
    let calculatedBalance = balance;
    
    if (calculatedBalance === undefined) {
      // Usar nossa função utilitária para calcular o saldo da carteira
      calculatedBalance = await calculateWalletBalance(params.walletId, user.id);
      
      console.log(`[WALLET_PATCH] Saldo calculado para a carteira ${params.walletId}: ${calculatedBalance}`);
    }

    const updatedWallet = await db.wallet.update({
      where: {
        id: params.walletId,
      },
      data: {
        name,
        balance: calculatedBalance,
      },
    });

    return NextResponse.json(updatedWallet);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { walletId: string } }
) {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const wallet = await db.wallet.findUnique({
      where: {
        id: params.walletId,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
    }

    if (wallet.userId !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, balance, type, metadata } = updateWalletSchema.parse(body);

    // Preparar os dados para atualização
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    
    // Se balance não foi fornecido, calcular com base nas transações
    if (balance !== undefined) {
      updateData.balance = balance;
    } else {
      // Usar nossa função utilitária para calcular o saldo da carteira
      updateData.balance = await calculateWalletBalance(params.walletId, user.id);
      
      console.log(`[WALLET_PUT] Saldo calculado para a carteira ${params.walletId}: ${updateData.balance}`);
    }
    
    // Se temos metadados para atualizar, mesclamos com os existentes
    if (metadata) {
      // Mesclar os metadados existentes com os novos
      const existingMetadata = wallet.metadata ? { ...wallet.metadata as object } : {};
      updateData.metadata = {
        ...existingMetadata,
        ...metadata,
        lastUpdated: new Date().toISOString() // Adicionar timestamp de atualização
      };
    }

    const updatedWallet = await db.wallet.update({
      where: {
        id: params.walletId,
      },
      data: updateData,
      include: {
        bank: true,
      },
    });

    return NextResponse.json(updatedWallet);
  } catch (error) {
    console.error("[UPDATE_WALLET_ERROR]", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { walletId: string } }
) {
  try {
    const { user } = await getAuthSession();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const wallet = await db.wallet.findUnique({
      where: {
        id: params.walletId,
      },
    });

    if (!wallet) {
      return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });
    }

    if (wallet.userId !== user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Excluir as transações associadas à carteira
    await db.transaction.deleteMany({
      where: {
        walletId: params.walletId,
      },
    });

    // Agora exclui a carteira
    await db.wallet.delete({
      where: {
        id: params.walletId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_WALLET_ERROR]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 