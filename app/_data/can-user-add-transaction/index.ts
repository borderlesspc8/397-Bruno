import { prisma } from "@/app/_lib/prisma";
import { getAuthSession } from "@/app/_lib/auth";
import { SubscriptionPlan } from "@/app/types";

export async function canUserAddTransaction() {
  const { user } = await getAuthSession();
  
  if (!user) {
    return false;
  }
  
  // Usuários com plano premium ou enterprise sempre podem adicionar transações
  if (user.subscriptionPlan === SubscriptionPlan.PREMIUM || 
      user.subscriptionPlan === SubscriptionPlan.ENTERPRISE) {
    return true;
  }
  
  // O status de isActive não deve impedir que usuários FREE façam suas transações básicas
  
  // Para usuários no plano gratuito ou básico, verificar o limite de transações
  const transactionsCount = await prisma.transaction.count({
    where: {
      userId: user.id
    }
  });
  
  // Limite de transações baseado no plano
  if (user.subscriptionPlan === SubscriptionPlan.BASIC) {
    return transactionsCount < 50; // Limite de 50 transações para plano básico
  }
  
  // Plano gratuito - verificamos esse limite independente do status isActive
  return transactionsCount < 50; // Atualizamos para 50 transações para plano gratuito
}
