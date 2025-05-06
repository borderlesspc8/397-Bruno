import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/_lib/db";
import { SubscriptionPlan } from "@/app/types";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    // Verificar se o usuário está autenticado e é o administrador autorizado
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário atual é o administrador autorizado (mvcas95@gmail.com)
    if (token?.email !== "mvcas95@gmail.com") {
      return NextResponse.json({ 
        error: "Acesso restrito apenas ao administrador autorizado" 
      }, { status: 403 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { plan } = body;

    // Validar o plano
    const validPlans = Object.values(SubscriptionPlan);
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json({ 
        error: "Plano de assinatura inválido" 
      }, { status: 400 });
    }

    // Verificar se o usuário existe
    const userExists = await db.user.findUnique({
      where: {
        id: userId
      }
    });

    if (!userExists) {
      return NextResponse.json({ 
        error: "Usuário não encontrado" 
      }, { status: 404 });
    }

    // Configurar datas de renovação
    const startDate = new Date();
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1); // Renovação em 1 mês

    // Verificar se o usuário já tem uma assinatura
    const existingSubscription = await db.subscription.findFirst({
      where: {
        userId: userId
      }
    });

    let updatedUser;

    if (existingSubscription) {
      // Atualizar assinatura existente
      await db.subscription.update({
        where: {
          id: existingSubscription.id
        },
        data: {
          plan: plan,
          status: 'ACTIVE', // Sempre ativar ao mudar o plano
          renewalDate: renewalDate
        }
      });
    } else {
      // Criar uma nova assinatura para o usuário
      await db.subscription.create({
        data: {
          userId: userId,
          plan: plan,
          status: 'ACTIVE',
          startDate: startDate,
          renewalDate: renewalDate
        }
      });
    }

    // Buscar o usuário atualizado com seus dados de assinatura
    updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        subscription: true
      }
    });

    // Formatar resposta
    const userResponse = {
      ...updatedUser,
      subscriptionPlan: plan
    };

    return NextResponse.json({
      message: "Assinatura atualizada com sucesso",
      user: userResponse
    });

  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 