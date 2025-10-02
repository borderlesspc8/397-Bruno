import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/app/_lib/prisma";
import { formatCurrency } from "@/app/_lib/formatters";
import { BudgetDetails } from "./_components/BudgetDetails";
import { BudgetTransactions } from "./_components/BudgetTransactions";
import Link from "next/link";
import { Button } from "@/app/_components/ui/button";
import { ArrowLeft, Pencil, ChartPieIcon } from "lucide-react";
import { DeleteBudgetButton } from "@/app/_components/DeleteBudgetButton";
import { Budget, Transaction, transactionAdapter, budgetAdapter } from "@/app/_lib/types";

export const metadata: Metadata = {
  title: "Detalhes do Orçamento | Conta Rápida",
  description: "Visualize os detalhes do seu orçamento",
};

interface BudgetPageProps {
  params: {
    id: string;
  };
}

export default async function BudgetPage({ params }: BudgetPageProps) {
  const user = await getCurrentUser();
  if (!user?.email) {
    return notFound();
  }

  // Buscar o orçamento pelo ID
  const budget = await db.budget.findFirst({
    where: {
      id: params.id,
      user: {
        email: user.email,
      },
    },
    include: {
      category: true,
      wallet: true,
    },
  });

  // Se o orçamento não existir ou não pertencer ao usuário
  if (!budget) {
    return notFound();
  }

  // Determinar o período de datas para filtrar transações
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  // Se o orçamento tiver datas específicas, usá-las
  if (budget.startDate) {
    startDate = new Date(budget.startDate);
  } else {
    // Caso contrário, determinar o período com base no campo 'period'
    const now = new Date();
    
    switch (budget.period) {
      case 'DAILY':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'WEEKLY':
        // Início da semana (domingo)
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        
        // Fim da semana (sábado)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'MONTHLY':
        // Início do mês
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        // Fim do mês
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'YEARLY':
        // Início do ano
        startDate = new Date(now.getFullYear(), 0, 1);
        // Fim do ano
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
    }
  }

  if (budget.endDate) {
    endDate = new Date(budget.endDate);
  }

  // Construir filtro para as transações
  const transactionFilter: any = {
    walletId: budget.walletId,
    type: "EXPENSE", // Considerar apenas despesas
    date: {},
  };

  if (startDate) {
    transactionFilter.date.gte = startDate;
  }

  if (endDate) {
    transactionFilter.date.lte = endDate;
  }

  // Se o orçamento for específico para uma categoria
  if (budget.categoryId) {
    transactionFilter.categoryId = budget.categoryId;
  }

  // Buscar a soma das transações para este orçamento
  const transactionsAggregate = await db.transaction.aggregate({
    where: transactionFilter,
    _sum: {
      amount: true,
    },
  });

  const spent = transactionsAggregate._sum.amount || 0;
  const remaining = budget.amount - spent;
  const progress = (spent / budget.amount) * 100;

  // Buscar as transações relacionadas a este orçamento
  const dbTransactions = await db.transaction.findMany({
    where: transactionFilter,
    orderBy: {
      date: "desc",
    },
    include: {
      categoryObj: true,
      wallet: true,
    },
    take: 10, // Limitar a 10 transações mais recentes
  });

  // Converter o formato dos dados usando os adaptadores
  const transactions: Transaction[] = dbTransactions.map(transaction => 
    transactionAdapter.fromPrisma(transaction)
  );

  const budgetWithProgress = budgetAdapter.fromPrisma({
    ...budget,
    spent,
    remaining,
    progress,
  });

  return (
    <div className="container py-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link href="/budgets">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para orçamentos
            </Link>
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">{budget.title}</h1>
          <p className="text-muted-foreground">{budget.description || "Sem descrição"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/budgets/${budget.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DeleteBudgetButton id={budget.id} />
          <Button variant="default" size="sm" asChild>
            <Link href={`/budgets/${budget.id}/report`}>
              <ChartPieIcon className="mr-2 h-4 w-4" />
              Ver Relatório
            </Link>
          </Button>
        </div>
      </div>
      <BudgetDetails budget={budgetWithProgress} />
      <BudgetTransactions
        transactions={transactions}
        budget={budgetWithProgress}
      />
    </div>
  );
} 