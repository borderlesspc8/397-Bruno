import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { db } from "@/app/_lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar autenticação
    const session = await validateSessionForAPI();

    if (!session || session.user.email !== "mvcas95@gmail.com") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter nova senha do corpo da requisição
    const { newPassword } = await request.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Senha inválida. A senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await hash(newPassword, 12);

    // Atualizar senha do usuário
    const updatedUser = await db.user.update({
      where: { id: params.userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    return NextResponse.json({
      message: "Senha atualizada com sucesso",
      user: updatedUser
    });
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar senha" },
      { status: 500 }
    );
  }
} 