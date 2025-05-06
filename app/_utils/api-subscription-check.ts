import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { SubscriptionPlan } from "@/app/types";

/**
 * Verifica se um usuário tem acesso a um endpoint específico baseado em seu plano de assinatura
 */
export async function checkApiSubscriptionAccess(
  request: NextRequest,
  allowedPlans = [SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
  allowDashboardEndpoints = true
) {
  try {
    // Obter o token de autenticação
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Se não tiver token, não está autenticado
    if (!token) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se é uma rota de dashboard e se esta exceção está habilitada
    const url = request.nextUrl.pathname;
    const isDashboardEndpoint = url.includes("/api/dashboard");
    
    if (allowDashboardEndpoints && isDashboardEndpoint) {
      // Permitir acesso a endpoints de dashboard independente do plano
      return null; // Continua o fluxo normal
    }

    // Verificar o plano do usuário
    const userPlan = token.subscriptionPlan as SubscriptionPlan || SubscriptionPlan.FREE;
    
    // Se o plano do usuário estiver na lista de planos permitidos, permite o acesso
    if (allowedPlans.includes(userPlan)) {
      return null; // Continua o fluxo normal
    }

    // Caso contrário, retorna erro de acesso não permitido
    return NextResponse.json(
      { 
        error: "Acesso restrito", 
        message: "Seu plano atual não permite acesso a esta funcionalidade. Faça upgrade para um plano pago.",
        requiredPlans: allowedPlans
      },
      { status: 403 }
    );
  } catch (error) {
    console.error("Erro ao verificar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao verificar permissões" },
      { status: 500 }
    );
  }
} 