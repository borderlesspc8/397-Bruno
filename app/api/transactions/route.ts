import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";
import { TransactionType } from "@/app/_types/transaction";

export const dynamic = "force-dynamic";

const toNumber = (value: string | null, fallback?: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseDate = (value: string | null) => {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const page = toNumber(searchParams.get("page"), 1)!;
    const limit = Math.min(toNumber(searchParams.get("limit"), 20)!, 100);
    const skip = (page - 1) * limit;

    const startDate = parseDate(searchParams.get("startDate"));
    const endDate = parseDate(searchParams.get("endDate"));
    const type = searchParams.get("type") as TransactionType | null;
    const category = searchParams.get("category");
    const walletId = searchParams.get("walletId");
    const search = searchParams.get("search");
    const minAmount = toNumber(searchParams.get("minAmount"));
    const maxAmount = toNumber(searchParams.get("maxAmount"));
    const sortField = searchParams.get("sortField") || "date";
    const sortOrder = (searchParams.get("sortOrder") === "asc" ? "asc" : "desc") as "asc" | "desc";

    const where: any = { userId: session.user.id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }
    if (type) where.type = type;
    if (category) where.category = category;
    if (walletId) where.walletId = walletId;
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) where.amount.gte = minAmount;
      if (maxAmount !== undefined) where.amount.lte = maxAmount;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search] } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sortField]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
    return NextResponse.json({ error: "Erro ao listar transações" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, amount, date, type, category, walletId, description, tags, paymentMethod, metadata } = body;

    if (!name || amount === undefined || !date || !type || !walletId) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const created = await prisma.transaction.create({
      data: {
        name,
        amount: Number(amount),
        date: new Date(date),
        type,
        category,
        walletId,
        description,
        tags: tags || [],
        paymentMethod,
        metadata,
        userId: session.user.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[TRANSACTIONS_POST]", error);
    return NextResponse.json({ error: "Erro ao criar transação" }, { status: 500 });
  }
}
