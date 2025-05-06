import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { SubscriptionPlan } from "@/app/types";

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  const session = await getAuthSession();
  
  if (!session?.user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  
  // Obter o plano solicitado da query string
  const searchParams = request.nextUrl.searchParams;
  const plan = searchParams.get("plan")?.toLowerCase();
  
  // Validar o plano
  if (!plan || !["basic", "premium", "enterprise"].includes(plan)) {
    return NextResponse.json(
      { error: "Plano inválido" },
      { status: 400 }
    );
  }
  
  // Mapear o plano solicitado para o enum SubscriptionPlan
  let subscriptionPlan: SubscriptionPlan;
  
  switch (plan) {
    case "basic":
      subscriptionPlan = SubscriptionPlan.BASIC;
      break;
    case "premium":
      subscriptionPlan = SubscriptionPlan.PREMIUM;
      break;
    case "enterprise":
      subscriptionPlan = SubscriptionPlan.ENTERPRISE;
      break;
    default:
      subscriptionPlan = SubscriptionPlan.FREE;
  }
  
  try {
    // Simulação direta de atualização de assinatura sem integração de pagamento
    
    // Buscar a assinatura atual do usuário
    const existingSubscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });
    
    const nextRenewalDate = new Date();
    nextRenewalDate.setDate(nextRenewalDate.getDate() + 30); // +30 dias
    
    // Atualizar ou criar a assinatura
    if (existingSubscription) {
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          plan: subscriptionPlan,
          status: "ACTIVE",
          renewalDate: nextRenewalDate,
        },
      });
    } else {
      await db.subscription.create({
        data: {
          userId: session.user.id,
          plan: subscriptionPlan,
          status: "ACTIVE",
          startDate: new Date(),
          renewalDate: nextRenewalDate,
        },
      });
    }
    
    // Log da alteração
    console.log(`[SUBSCRIPTION] Usuário ${session.user.id} alterou para o plano ${subscriptionPlan}`);
    
    // Redirecionar para a página de assinaturas com um parâmetro de sucesso
    return NextResponse.redirect(new URL("/subscription?success=true", request.url));
    
  } catch (error) {
    console.error("Erro ao processar alteração de plano:", error);
    
    return NextResponse.json(
      { error: "Erro ao processar a alteração de plano" },
      { status: 500 }
    );
  }
} 
