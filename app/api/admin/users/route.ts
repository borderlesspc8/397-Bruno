import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/_lib/db";

export async function GET(request: NextRequest) {
  try {
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

    // Buscar todos os usuários do banco de dados
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        subscription: true,
        role: true,
        isOnboarded: true,
        isTermsAccepted: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Processar os dados de usuários para adicionar os campos necessários
    const processedUsers = users.map(user => {
      // Determinar o plano de assinatura com base no relacionamento subscription
      let subscriptionPlan = 'FREE';
      let isActive = true;

      if (user.subscription) {
        subscriptionPlan = user.subscription.plan || 'FREE';
        // Apenas 'ACTIVE' é considerado ativo, todos os outros status são inativos
        isActive = user.subscription.status === 'ACTIVE';
      }

      return {
        ...user,
        subscriptionPlan,
        isActive,
        // Removendo o objeto de assinatura completo para simplificar o retorno
        subscription: undefined
      };
    });

    return NextResponse.json({ users: processedUsers });

  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 