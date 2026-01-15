import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const tx = await prisma.transaction.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!tx) return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });

    return NextResponse.json(tx);
  } catch (error) {
    console.error("[TRANSACTION_GET]", error);
    return NextResponse.json({ error: "Erro ao buscar transação" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json();

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        ...body,
        amount: body.amount !== undefined ? Number(body.amount) : existing.amount,
        date: body.date ? new Date(body.date) : existing.date,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[TRANSACTION_PATCH]", error);
    return NextResponse.json({ error: "Erro ao atualizar transação" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession();
    if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const existing = await prisma.transaction.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!existing) return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });

    await prisma.transaction.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRANSACTION_DELETE]", error);
    return NextResponse.json({ error: "Erro ao excluir transação" }, { status: 500 });
  }
}
