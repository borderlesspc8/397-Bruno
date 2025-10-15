import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { prisma } from "@/app/_lib/prisma";
import { dynamic, fetchCache, revalidate } from '../../_utils/dynamic-config';

// Tipos para as estatísticas de uso
interface UsageStats {
  transactionsCount: number;
  transactionsLimit: number;
  walletsCount: number;
  walletsLimit: number;
  apiCallsCount: number;
  apiCallsLimit: number;
  storageUsed: number; // em MB
  storageLimit: number; // em MB
  lastSync: string; // ISO date string
  monthlyActivity: {
    month: string;
    transactions: number;
    apiCalls: number;
  }[];
  featureUsage: {
    feature: string;
    usageCount: number;
    percentage: number;
  }[];
}

// Dados mockados (em uma aplicação real viriam do banco de dados)
const mockUsageStats: UsageStats = {
  transactionsCount: 156,
  transactionsLimit: 500,
  walletsCount: 3,
  walletsLimit: 5,
  apiCallsCount: 287,
  apiCallsLimit: 1000,
  storageUsed: 24.5,
  storageLimit: 100,
  lastSync: new Date().toISOString(),
  monthlyActivity: [
    { month: "Jan", transactions: 42, apiCalls: 98 },
    { month: "Fev", transactions: 38, apiCalls: 87 },
    { month: "Mar", transactions: 55, apiCalls: 120 },
    { month: "Abr", transactions: 47, apiCalls: 110 },
    { month: "Mai", transactions: 32, apiCalls: 95 },
    { month: "Jun", transactions: 0, apiCalls: 0 }
  ],
  featureUsage: [
    { feature: "Sincronização Bancária", usageCount: 45, percentage: 28 },
    { feature: "Relatórios", usageCount: 32, percentage: 20 },
    { feature: "Categorização", usageCount: 28, percentage: 18 },
    { feature: "Busca de Transações", usageCount: 25, percentage: 16 },
    { feature: "Exportação de Dados", usageCount: 18, percentage: 11 },
    { feature: "Outros", usageCount: 12, percentage: 7 }
  ]
};

// Limites por plano
const planLimits = {
  free: {
    transactions: 100,
    wallets: 1,
    apiCalls: 100,
    storage: 10
  },
  basic: {
    transactions: 500,
    wallets: 3,
    apiCalls: 500,
    storage: 50
  },
  premium: {
    transactions: 10000,
    wallets: 5,
    apiCalls: 1000,
    storage: 100
  },
  business: {
    transactions: 50000,
    wallets: 10,
    apiCalls: 5000,
    storage: 500
  }
};

// GET /api/user/usage-stats - Obter estatísticas de uso do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // Em uma aplicação real, buscar do banco de dados
    // const user = await prisma.user.findUnique({
    //   where: { email: userEmail },
    //   include: {
    //     subscription: true,
    //     wallets: true,
    //     transactions: {
    //       select: {
    //         id: true,
    //         createdAt: true,
    //       },
    //     },
    //   },
    // });
    
    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Usuário não encontrado" },
    //     { status: 404 }
    //   );
    // }
    
    // const plan = user.subscription?.plan || "free";
    // const limits = planLimits[plan];
    
    // const transactionsCount = await prisma.transaction.count({
    //   where: { userId: user.id },
    // });
    
    // const walletsCount = await prisma.wallet.count({
    //   where: { userId: user.id },
    // });
    
    // // Calcular uso de armazenamento (simulado)
    // const storageUsed = transactionsCount * 0.1; // 100KB por transação
    
    // // Buscar atividade mensal
    // const monthlyActivity = await getMonthlyActivity(user.id);
    
    // // Buscar uso de recursos
    // const featureUsage = await getFeatureUsage(user.id);
    
    // const usageStats = {
    //   transactionsCount,
    //   transactionsLimit: limits.transactions,
    //   walletsCount,
    //   walletsLimit: limits.wallets,
    //   apiCallsCount: 287, // Simulado
    //   apiCallsLimit: limits.apiCalls,
    //   storageUsed,
    //   storageLimit: limits.storage,
    //   lastSync: new Date().toISOString(),
    //   monthlyActivity,
    //   featureUsage,
    // };

    // Usando dados mockados para simulação
    return NextResponse.json(mockUsageStats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas de uso:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas de uso" },
      { status: 500 }
    );
  }
}

// Comentando a exportação duplicada que está causando o erro
// export { dynamic, fetchCache, revalidate }; 
