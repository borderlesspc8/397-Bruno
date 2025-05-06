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
  
  try {
    // Simulação direta de downgrade sem integração de pagamento
    
    // Buscar a assinatura atual do usuário
    const existingSubscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!existingSubscription) {
      // Se não houver assinatura, redirecionar para página de assinaturas
      return NextResponse.redirect(new URL("/subscription", request.url));
    }
    
    // Atualizar a assinatura para o plano FREE
    await db.subscription.update({
      where: { id: existingSubscription.id },
      data: {
        plan: SubscriptionPlan.FREE,
        status: "CANCELED",
        endDate: new Date(), // A assinatura anterior termina imediatamente
      },
    });
    
    // Log da alteração
    console.log(`[SUBSCRIPTION] Usuário ${session.user.id} fez downgrade para o plano FREE`);
    
    // Redirecionar para a página de assinaturas com um parâmetro de sucesso
    return NextResponse.redirect(new URL("/subscription?downgrade=true", request.url));
    
  } catch (error) {
    console.error("Erro ao processar downgrade:", error);
    
    return NextResponse.json(
      { error: "Erro ao processar o downgrade" },
      { status: 500 }
    );
  }
} 
