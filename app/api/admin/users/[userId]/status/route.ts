import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/app/_lib/db";

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
    const { isActive } = body;

    // Validar o status
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ 
        error: "Status inválido" 
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

    // Impedir que o administrador desative sua própria conta
    if (userExists.email === "mvcas95@gmail.com" && !isActive) {
      return NextResponse.json({ 
        error: "Não é permitido desativar a conta do administrador principal" 
      }, { status: 400 });
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

    if (existingSubscription) {
      // Atualizar status da assinatura existente
      await db.subscription.update({
        where: {
          id: existingSubscription.id
        },
        data: {
          status: isActive ? 'ACTIVE' : 'PAST_DUE' // Usando um enum válido para status inativo
        }
      });
    } else if (isActive) {
      // Se estamos ativando um usuário que não tem assinatura, criar uma gratuita
      await db.subscription.create({
        data: {
          userId: userId,
          plan: 'FREE',
          status: 'ACTIVE',
          startDate: startDate,
          renewalDate: renewalDate
        }
      });
    }

    // Buscar o usuário atualizado
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        subscription: true
      }
    });

    // Formatar a resposta
    const userResponse = {
      ...(updatedUser || {}),
      isActive,
      name: updatedUser?.name || null,
      email: updatedUser?.email || ""
    };

    return NextResponse.json({
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      user: userResponse
    });

  } catch (error) {
    console.error("Erro ao atualizar status do usuário:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 