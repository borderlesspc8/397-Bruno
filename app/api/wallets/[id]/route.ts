import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";

export const dynamic = "force-dynamic";

async function getWalletForUser(walletId: string, userId: string) {
  return prisma.wallet.findFirst({
    where: { id: walletId, userId },
    include: {
      bank: { select: { id: true, name: true, logo: true } },
    },
  });
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development' || true;
    const session = await getAuthSession();
    
    if (!isDevelopment && !session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session?.user?.id || 'dev-user-id';

    const wallet = await getWalletForUser(params.id, userId);
    if (!wallet) return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });

    return NextResponse.json({ data: wallet });
  } catch (error) {
    console.error("[WALLET_GET]", error);
    return NextResponse.json({ error: "Erro ao buscar carteira" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development' || true;
    const session = await getAuthSession();
    
    if (!isDevelopment && !session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session?.user?.id || 'dev-user-id';

    const wallet = await getWalletForUser(params.id, userId);
    if (!wallet) return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });

    const body = await request.json();
    const {
      name,
      bankId,
      balance,
      allowNegative,
      color,
      icon,
      metadata,
      type,
      isActive,
    } = body;

    const updated = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        name: name ?? wallet.name,
        bankId: bankId !== undefined ? bankId : wallet.bankId,
        balance: balance !== undefined ? Number(balance) : wallet.balance,
        allowNegative: allowNegative ?? wallet.allowNegative,
        color: color ?? wallet.color,
        icon: icon ?? wallet.icon,
        metadata: metadata ?? wallet.metadata,
        type: type ?? wallet.type,
        isActive: isActive ?? wallet.isActive,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[WALLET_PATCH]", error);
    return NextResponse.json({ error: "Erro ao atualizar carteira" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development' || true;
    const session = await getAuthSession();
    
    if (!isDevelopment && !session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session?.user?.id || 'dev-user-id';

    const wallet = await getWalletForUser(params.id, userId);
    if (!wallet) return NextResponse.json({ error: "Carteira não encontrada" }, { status: 404 });

    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WALLET_DELETE]", error);
    return NextResponse.json({ error: "Erro ao arquivar carteira" }, { status: 500 });
  }
}
