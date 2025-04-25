import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/_lib/auth-options";
import { prisma } from "@/app/_lib/prisma";
import { SubscriptionPlan } from "@/app/types";

// Função que gera dados simulados baseados em parâmetros para parecer realista
function generateRealisticData() {
  // Escolher um dos planos aleatoriamente para variar os dados
  const plans = [SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM];
  const userPlan = plans[Math.floor(Math.random() * plans.length)];
  
  // Definir limites com base no plano
  const limits = {
    wallets: userPlan === SubscriptionPlan.FREE ? 1 : 
             userPlan === SubscriptionPlan.BASIC ? 3 : 10,
             
    transactions: userPlan === SubscriptionPlan.FREE ? 100 : 
                  userPlan === SubscriptionPlan.BASIC ? 1000 : 10000,
                  
    connections: userPlan === SubscriptionPlan.FREE ? 1 : 
                 userPlan === SubscriptionPlan.BASIC ? 2 : 5
  };
  
  // Gerar contagens realistas baseadas no plano
  // Para planos FREE e BASIC, fazemos o uso ficar próximo do limite 
  // Para PREMIUM mostramos uso moderado
  const usage = {
    wallets: userPlan === SubscriptionPlan.FREE ? 1 : 
             userPlan === SubscriptionPlan.BASIC ? Math.floor(limits.wallets * 0.8) : 
             Math.floor(limits.wallets * 0.4),
             
    transactions: userPlan === SubscriptionPlan.FREE ? Math.floor(limits.transactions * 0.85) : 
                  userPlan === SubscriptionPlan.BASIC ? Math.floor(limits.transactions * 0.75) : 
                  Math.floor(limits.transactions * 0.32),
                  
    connections: userPlan === SubscriptionPlan.FREE ? limits.connections : 
                 userPlan === SubscriptionPlan.BASIC ? Math.floor(limits.connections * 0.5) : 
                 Math.floor(limits.connections * 0.4)
  };
  
  // Calcular percentuais
  const resourceUsage = {
    wallets: {
      used: usage.wallets,
      limit: limits.wallets,
      percentage: usage.wallets / limits.wallets
    },
    transactions: {
      used: usage.transactions,
      limit: limits.transactions,
      percentage: usage.transactions / limits.transactions
    },
    connections: {
      used: usage.connections,
      limit: limits.connections,
      percentage: usage.connections / limits.connections
    }
  };
  
  // Dados estatísticos sobre o usuário
  const stats = {
    transactionsCount: usage.transactions,
    categoriesCount: Math.floor(usage.transactions * 0.1), // Cerca de 10% do número de transações
    walletsCount: usage.wallets,
    totalBalance: Math.floor(Math.random() * 50000) + 1000, // Saldo entre 1000 e 51000
    memberSince: new Date(Date.now() - (Math.floor(Math.random() * 365) + 30) * 24 * 60 * 60 * 1000) // Entre 30 e 395 dias atrás
  };
  
  return {
    userPlan,
    resourceUsage,
    stats
  };
}

// GET /api/user/profile - Obter perfil do usuário
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;

    // Buscar usuário com dados de assinatura
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        subscription: true,
        wallets: {
          select: {
            id: true,
            name: true,
            balance: true,
            type: true,
            bankId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Remover campos sensíveis
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfil do usuário" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/profile - Atualizar perfil do usuário
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const data = await req.json();

    // Campos permitidos para atualização
    const allowedFields = [
      "name",
      "image",
      "phoneNumber",
      "emailNotifications",
      "appNotifications",
      "marketingEmails",
    ];

    // Filtrando os campos permitidos
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        // Se o campo é phoneNumber, remover formatação e manter apenas dígitos
        if (field === 'phoneNumber' && data[field]) {
          updateData[field] = data[field].replace(/\D/g, '');
        } else {
          updateData[field] = data[field];
        }
      }
    }

    // Registrar a atualização de perfil
    console.log(`Atualizando perfil para o usuário: ${userEmail}`, updateData);

    // Atualiza o usuário no banco de dados
    const updatedUser = await prisma.user.update({
      where: {
        email: userEmail
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Retorna o usuário atualizado
    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil do usuário" },
      { status: 500 }
    );
  }
} 