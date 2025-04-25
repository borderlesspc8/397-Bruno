import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    // Busca o token no banco
    const resetRequest = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRequest) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 400 }
      );
    }

    // Verifica se o token expirou
    if (resetRequest.expires < new Date()) {
      return NextResponse.json(
        { error: "Token expirado" },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await hash(password, 12);

    // Atualiza a senha do usuário
    await prisma.user.update({
      where: { id: resetRequest.userId },
      data: { password: hashedPassword },
    });

    // Remove o token usado
    await prisma.passwordReset.delete({
      where: { id: resetRequest.id },
    });

    return NextResponse.json(
      { message: "Senha atualizada com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 