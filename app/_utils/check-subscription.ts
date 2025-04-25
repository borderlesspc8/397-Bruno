import { SubscriptionPlan } from "@/app/types";
import { auth } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";

// Mapa de recursos por plano
const PLAN_FEATURES = {
  [SubscriptionPlan.FREE]: {
    maxTransactions: 50,
    aiReports: false,
    dataExport: false,
    maxWallets: 1,
    maxUsers: 1,
  },
  [SubscriptionPlan.BASIC]: {
    maxTransactions: -1, // ilimitado
    aiReports: false,
    dataExport: true,
    maxWallets: 3,
    maxUsers: 1,
  },
  [SubscriptionPlan.PREMIUM]: {
    maxTransactions: -1,
    aiReports: true,
    dataExport: true,
    maxWallets: 10,
    maxUsers: 5,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxTransactions: -1,
    aiReports: true,
    dataExport: true,
    maxWallets: -1, // ilimitado
    maxUsers: -1, // ilimitado
  },
};

// Lista de recursos disponíveis no plano FREE mesmo se o usuário não estiver com isActive
const FREE_RESOURCES = ['maxTransactions', 'maxWallets'];

export type Feature = keyof (typeof PLAN_FEATURES)[SubscriptionPlan];

export async function hasAccess(feature: Feature): Promise<boolean> {
  const { user } = await auth();
  
  if (!user) {
    return false;
  }
  
  // Se o recurso está na lista de recursos gratuitos, permite acesso mesmo sem status ativo
  if (FREE_RESOURCES.includes(feature)) {
    const userPlan = user.subscriptionPlan || SubscriptionPlan.FREE;
    const planFeatures = PLAN_FEATURES[userPlan as keyof typeof PLAN_FEATURES];
    
    if (userPlan === SubscriptionPlan.FREE) {
      // Verificar limites numéricos para plano gratuito
      const featureValue = planFeatures[feature];
      if (typeof featureValue === 'number') {
        // -1 significa ilimitado
        return featureValue === -1 || featureValue > 0;
      }
      // Recursos booleanos
      return !!featureValue;
    }
  }
  
  // Para outros recursos, verificar se o usuário está ativo
  if (!user.isActive) {
    return false;
  }
  
  const userPlan = user.subscriptionPlan || SubscriptionPlan.FREE;
  const planFeatures = PLAN_FEATURES[userPlan as keyof typeof PLAN_FEATURES];
  
  // Verificar se o recurso existe no plano do usuário
  if (!(feature in planFeatures)) {
    return false;
  }
  
  // Verificar limites numéricos
  const featureValue = planFeatures[feature];
  if (typeof featureValue === 'number') {
    // -1 significa ilimitado
    return featureValue === -1 || featureValue > 0;
  }
  
  // Recursos booleanos
  return !!featureValue;
}

export async function getRemainingFeatureCount(feature: Feature): Promise<number | null> {
  const { user } = await auth();
  
  if (!user || !user.isActive) {
    return 0;
  }
  
  const userPlan = user.subscriptionPlan || SubscriptionPlan.FREE;
  const planFeatures = PLAN_FEATURES[userPlan];
  
  // Verificar se o recurso existe e é numérico
  const featureValue = planFeatures[feature];
  if (typeof featureValue !== 'number') {
    return null;
  }
  
  // -1 significa ilimitado
  if (featureValue === -1) {
    return -1;
  }
  
  // Para recursos com contagem, buscar o quanto já foi usado
  // e calcular o restante
  switch (feature) {
    case 'maxTransactions':
      const usedTransactions = await getUsedTransactionsCount(user.id);
      return Math.max(0, featureValue - usedTransactions);
    
    case 'maxWallets':
      const usedWallets = await getUsedWalletsCount(user.id);
      return Math.max(0, featureValue - usedWallets);
    
    case 'maxUsers':
      const usedUsers = await getSharedUsersCount(user.id);
      return Math.max(0, featureValue - usedUsers);
    
    default:
      return featureValue;
  }
}

// Implementação completa das funções auxiliares
async function getUsedTransactionsCount(userId: string): Promise<number> {
  try {
    // Obter o primeiro dia do mês atual
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Contar transações do usuário no mês atual
    const transactionCount = await db.transaction.count({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        }
      }
    });
    
    return transactionCount;
  } catch (error) {
    console.error("Erro ao contar transações:", error);
    return 0;
  }
}

async function getUsedWalletsCount(userId: string): Promise<number> {
  try {
    // Considerando o modelo Wallet que foi definido em implementações anteriores
    const walletCount = await db.wallet.count({
      where: {
        userId: userId
      }
    });
    
    return walletCount;
  } catch (error) {
    console.error("Erro ao contar carteiras:", error);
    return 0;
  }
}

async function getSharedUsersCount(userId: string): Promise<number> {
  try {
    // Como não temos modelo WalletMember, retornamos 0 por padrão
    // Esta função deve ser implementada quando o modelo de compartilhamento for adicionado
    return 0;
  } catch (error) {
    console.error("Erro ao contar usuários compartilhados:", error);
    return 0;
  }
}

// Função adicional para verificar se o usuário pode adicionar mais uma transação
export async function canAddTransaction(): Promise<boolean> {
  // Verificar limite de transações
  const remainingTransactions = await getRemainingFeatureCount('maxTransactions');
  
  // -1 significa ilimitado, qualquer número maior que 0 significa que pode adicionar
  return remainingTransactions === -1 || (remainingTransactions !== null && remainingTransactions > 0);
}

// Função adicional para verificar se o usuário pode criar mais uma carteira
export async function canCreateWallet(): Promise<boolean> {
  // Verificar limite de carteiras
  const remainingWallets = await getRemainingFeatureCount('maxWallets');
  
  // -1 significa ilimitado, qualquer número maior que 0 significa que pode adicionar
  return remainingWallets === -1 || (remainingWallets !== null && remainingWallets > 0);
}

// Função adicional para verificar se o usuário pode compartilhar com mais um usuário
export async function canAddSharedUser(): Promise<boolean> {
  // Verificar limite de usuários compartilhados
  const remainingUsers = await getRemainingFeatureCount('maxUsers');
  
  // -1 significa ilimitado, qualquer número maior que 0 significa que pode adicionar
  return remainingUsers === -1 || (remainingUsers !== null && remainingUsers > 0);
}
