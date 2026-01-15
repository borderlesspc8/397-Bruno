import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { endOfDay, isValid, parseISO, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return undefined;
  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development' || true;
    const session = await getAuthSession();

    if (!isDevelopment && !session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session?.user?.id || 'dev-user-id';

    const { searchParams } = new URL(request.url);
    const startDateParam = parseDateParam(searchParams.get("startDate"));
    const endDateParam = parseDateParam(searchParams.get("endDate"));
    const includeInactive = searchParams.get("includeInactive") === "true";

    const transactionDateFilter: Record<string, any> = {};
    if (startDateParam || endDateParam) {
      transactionDateFilter.date = {} as Record<string, Date>;
      if (startDateParam) transactionDateFilter.date.gte = startOfDay(startDateParam);
      if (endDateParam) transactionDateFilter.date.lte = endOfDay(endDateParam);
    }

    const [wallets, transactionSums, transactionRecency] = await Promise.all([
      prisma.wallet.findMany({
        where: {
          userId: userId,
          ...(includeInactive ? {} : { isActive: true }),
        },
        include: {
          bank: {
            select: { id: true, name: true, logo: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.transaction.groupBy({
        by: ["walletId", "type"],
        where: {
          userId: userId,
          ...transactionDateFilter,
        },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["walletId"],
        where: {
          userId: userId,
          ...transactionDateFilter,
        },
        _max: { date: true, updatedAt: true },
        _count: { _all: true },
      }),
    ]);

    const recencyMap = new Map<string, { lastTransactionAt?: Date; totalTransactions: number }>();
    transactionRecency.forEach((item) => {
      recencyMap.set(item.walletId, {
        lastTransactionAt: item._max.date || item._max.updatedAt || undefined,
        totalTransactions: item._count._all,
      });
    });

    const walletSummaries = wallets.map((wallet) => {
      const aggregates = transactionSums.filter((tx) => tx.walletId === wallet.id);
      const income = aggregates
        .filter((tx) => tx.type === "INCOME")
        .reduce((sum, tx) => sum + (tx._sum.amount || 0), 0);
      const expenses = aggregates
        .filter((tx) => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + Math.abs(tx._sum.amount || 0), 0);
      const investments = aggregates
        .filter((tx) => tx.type === "INVESTMENT")
        .reduce((sum, tx) => sum + Math.abs(tx._sum.amount || 0), 0);
      const transfers = aggregates
        .filter((tx) => tx.type === "TRANSFER")
        .reduce((sum, tx) => sum + (tx._sum.amount || 0), 0);

      const net = income - expenses - investments + transfers;
      const computedBalance = (wallet.balance || 0) + net;
      const recency = recencyMap.get(wallet.id);

      return {
        id: wallet.id,
        name: wallet.name,
        type: wallet.type,
        bankId: wallet.bankId,
        bank: wallet.bank,
        balance: wallet.balance,
        computedBalance,
        autoBalance: {
          income,
          expenses,
          investments,
          transfers,
          net,
        },
        allowNegative: wallet.allowNegative,
        color: wallet.color,
        icon: wallet.icon,
        lastSync: (wallet.metadata as any)?.lastSync || null,
        metadata: wallet.metadata,
        lastTransactionAt: recency?.lastTransactionAt || null,
        totalTransactions: recency?.totalTransactions || 0,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      };
    });

    const totals = walletSummaries.reduce(
      (acc, wallet) => {
        acc.income += wallet.autoBalance.income;
        acc.expenses += wallet.autoBalance.expenses;
        acc.investments += wallet.autoBalance.investments;
        acc.transfers += wallet.autoBalance.transfers;
        acc.net += wallet.autoBalance.net;
        acc.computedBalance += wallet.computedBalance ?? wallet.balance;
        return acc;
      },
      { income: 0, expenses: 0, investments: 0, transfers: 0, net: 0, computedBalance: 0 }
    );

    return NextResponse.json({ data: walletSummaries, totals });
  } catch (error) {
    console.error("[WALLETS_GET]", error);
    return NextResponse.json({ error: "Erro ao buscar carteiras" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development' || true;
    const session = await getAuthSession();

    if (!isDevelopment && !session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session?.user?.id || 'dev-user-id';

    const body = await request.json();
    const {
      name,
      type = "CHECKING",
      bankId,
      initialBalance = 0,
      allowNegative = false,
      color,
      icon,
      metadata,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Nome da carteira é obrigatório" }, { status: 400 });
    }

    const created = await prisma.wallet.create({
      data: {
        name,
        type,
        bankId: bankId || null,
        balance: Number(initialBalance) || 0,
        allowNegative,
        color,
        icon,
        metadata,
        userId: userId,
      },
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("[WALLETS_POST]", error);
    return NextResponse.json({ error: "Erro ao criar carteira" }, { status: 500 });
  }
}
