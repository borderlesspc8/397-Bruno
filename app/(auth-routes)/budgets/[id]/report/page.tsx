import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/app/_lib/auth";
import { prisma } from "@/app/_lib/prisma";
import { BudgetReportHeader } from "./_components/BudgetReportHeader";
import { BudgetSpendingChart } from "./_components/BudgetSpendingChart";
import { BudgetCategoryBreakdown } from "./_components/BudgetCategoryBreakdown";
import { BudgetInsights } from "./_components/BudgetInsights";
import { format } from "date-fns";
import { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Relatório de Orçamento | Conta Rápida",
  description: "Análise detalhada do seu orçamento",
};

interface BudgetReportPageProps {
  params: {
    id: string;
  };
}

export default async function BudgetReportPage({ params }: BudgetReportPageProps) {
  // Verifica autenticação
  const { user: authUser } = await auth();
  const userEmail = authUser?.email;

  if (!authUser || !userEmail) {
    return notFound();
  }

  // Busca o usuário com o orçamento
  const user = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
  });

  if (!user) {
    return notFound();
  }

  // Busca o orçamento pelo ID
  const budget = await prisma.budget.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
    include: {
      category: true,
      wallet: true,
    },
  });

  if (!budget) {
    return notFound();
  }

  // Define filtros de data para as transações conforme período do orçamento
  let startDate: Date = budget.startDate || new Date();
  let endDate: Date = budget.endDate || new Date();

  // Se não houver datas definidas, usa o período
  if (!budget.startDate || !budget.endDate) {
    const now = new Date();
    endDate = now;

    // Define a data de início com base no período
    switch (budget.period) {
      case "DAILY":
        // Último dia
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        break;
      case "WEEKLY":
        // Última semana
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "MONTHLY":
        // Último mês
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "YEARLY":
        // Último ano
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        // Padrão: último mês
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
  }

  // Constrói o filtro para transações relacionadas ao orçamento
  const transactionFilter: Prisma.TransactionWhereInput = {
    userId: user.id,
    date: {
      gte: startDate,
      lte: endDate,
    },
    // Se o orçamento tiver categoria, filtra por ela
    ...(budget.categoryId && {
      categoryId: budget.categoryId,
    }),
    // Se o orçamento tiver carteira, filtra por ela
    ...(budget.walletId && {
      walletId: budget.walletId,
    }),
    // Apenas despesas (valores negativos)
    amount: {
      lt: 0,
    },
  };

  // Calcula o total gasto usando aggregate
  const spentResult = await prisma.transaction.aggregate({
    where: transactionFilter,
    _sum: {
      amount: true
    }
  });

  // Converte para número o resultado da query e usa o valor absoluto
  const totalSpent = Math.abs(Number(spentResult._sum.amount || 0));
  const remainingAmount = budget.amount - totalSpent;
  const progressPercentage = (totalSpent / budget.amount) * 100;

  // Busca todas as transações relacionadas
  const transactions = await prisma.transaction.findMany({
    where: transactionFilter,
    include: {
      categoryObj: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  // Prepara dados para o gráfico de gastos diários
  const dailySpendingMap = new Map();
  
  // Inicializa o mapa com todas as datas dentro do período
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = format(currentDate, "dd/MM");
    dailySpendingMap.set(dateStr, 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Soma os gastos por dia
  transactions.forEach(transaction => {
    const dateStr = format(new Date(transaction.date), "dd/MM");
    const currentAmount = dailySpendingMap.get(dateStr) || 0;
    dailySpendingMap.set(dateStr, currentAmount + Math.abs(transaction.amount));
  });

  // Converte o mapa em array para o componente
  const dailySpending = Array.from(dailySpendingMap).map(([date, amount]) => ({
    date,
    amount,
  }));

  // Prepara dados para o gráfico de categorias
  const categoryMap = new Map();
  
  transactions.forEach(transaction => {
    // Usamos categoryObj (relação com Category) ou fazemos fallback para o campo enum category
    const categoryName = transaction.categoryObj?.name || getCategoryLabel(transaction.category?.toString() || 'OTHER');
    const categoryColor = transaction.categoryObj?.color || getCategoryColor(transaction.category?.toString() || 'OTHER');
    const currentAmount = categoryMap.get(categoryName)?.amount || 0;
    
    categoryMap.set(categoryName, {
      amount: currentAmount + Math.abs(transaction.amount),
      color: categoryColor,
    });
  });

  // Função para obter label de uma categoria a partir do enum
  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      HOUSING: "Moradia",
      TRANSPORTATION: "Transporte",
      FOOD: "Alimentação",
      ENTERTAINMENT: "Entretenimento",
      HEALTH: "Saúde",
      UTILITY: "Serviços",
      EDUCATION: "Educação",
      // Adicionar outros labels conforme necessário
    };
    
    return labels[category] || "Outros";
  }

  // Função para obter cor de uma categoria a partir do enum
  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      HOUSING: "#4f46e5", // indigo
      TRANSPORTATION: "#0891b2", // cyan
      FOOD: "#16a34a", // green
      ENTERTAINMENT: "#c026d3", // fuchsia
      HEALTH: "#ef4444", // red
      UTILITY: "#f59e0b", // amber
      EDUCATION: "#8b5cf6", // violet
      // Adicionar outras cores conforme necessário
    };
    
    return colors[category] || "#6b7280"; // gray
  }

  // Calcula percentagem para cada categoria
  const categorySpending = Array.from(categoryMap).map(([category, data]) => ({
    category,
    amount: data.amount,
    color: data.color,
    percentage: (data.amount / totalSpent) * 100,
  }));

  // Constrói o objeto com todos os dados necessários
  const budgetWithDetails = {
    ...budget,
    spent: totalSpent,
    remaining: remainingAmount,
    progress: progressPercentage,
    transactions,
    dailySpending,
    categorySpending,
  };

  // Mapear transações para o formato esperado pelo componente BudgetInsights
  const mappedTransactions = transactions.map(transaction => ({
    id: transaction.id,
    amount: transaction.amount,
    description: transaction.description,
    date: transaction.date,
    category: {
      name: transaction.categoryObj?.name || getCategoryLabel(transaction.category?.toString() || 'OTHER'),
      color: transaction.categoryObj?.color || getCategoryColor(transaction.category?.toString() || 'OTHER')
    }
  }));

  return (
    <div className="container py-8 space-y-8">
      <BudgetReportHeader budget={budgetWithDetails} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BudgetSpendingChart 
          dailySpending={budgetWithDetails.dailySpending} 
          totalSpent={budgetWithDetails.spent} 
        />
        <BudgetCategoryBreakdown 
          categorySpending={budgetWithDetails.categorySpending} 
          totalSpent={budgetWithDetails.spent}
        />
      </div>

      <BudgetInsights 
        budget={budgetWithDetails} 
        transactions={mappedTransactions}
      />
    </div>
  );
} 