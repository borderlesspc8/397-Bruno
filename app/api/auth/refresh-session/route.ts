import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/_lib/auth-options";
import { prisma } from "@/app/_lib/prisma";
import { SubscriptionPlan } from "@/app/types";

export async function GET(request: NextRequest) {
  try {
    // Obter a sessão atual do usuário
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }
    
    // Buscar os dados de assinatura atualizados do banco de dados
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: {
        plan: true,
        status: true,
        endDate: true,
      },
    });
    
    console.log("Dados da assinatura encontrados:", subscription);
    
    // Mapear o plano do banco de dados para o enum SubscriptionPlan
    let updatedPlan = SubscriptionPlan.FREE;
    
    if (subscription) {
      const normalizedPlan = subscription.plan.toUpperCase().trim();
      
      switch (normalizedPlan) {
        case 'BASIC':
          updatedPlan = SubscriptionPlan.BASIC;
          break;
        case 'PREMIUM':
          updatedPlan = SubscriptionPlan.PREMIUM;
          break;
        case 'ENTERPRISE':
          updatedPlan = SubscriptionPlan.ENTERPRISE;
          break;
        default:
          updatedPlan = SubscriptionPlan.FREE;
      }
    }
    
    console.log("Plano atualizado mapeado para:", updatedPlan);
    
    // Retornar os dados atualizados
    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      status: subscription?.status || "ACTIVE",
      endDate: subscription?.endDate,
    });
    
  } catch (error) {
    console.error("Erro ao atualizar sessão:", error);
    
    return NextResponse.json(
      { error: "Falha ao atualizar sessão" },
      { status: 500 }
    );
  }
} 