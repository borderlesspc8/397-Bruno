import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { randomBytes } from "crypto";
import { sendPasswordResetEmail } from "@/app/_lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Verifica se o e-mail existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Por questões de segurança, não informamos que o email não existe
      // Apenas retornamos sucesso para evitar enumeração de usuários
      return NextResponse.json(
        { message: "Se o email estiver cadastrado, enviaremos as instruções de recuperação" },
        { status: 200 }
      );
    }

    // Gera um token único
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hora

    // Remove tokens antigos para este usuário (opcional)
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    });

    // Salva o token no banco
    await prisma.passwordReset.create({
      data: {
        token,
        expires,
        userId: user.id,
      },
    });

    // Envia o e-mail usando a nova função especializada
    await sendPasswordResetEmail(email, token);

    // Log de auditoria (opcional)
    console.log(`[PASSWORD_RESET_REQUESTED] User: ${user.id}, Email: ${email}`);

    return NextResponse.json(
      { message: "E-mail de recuperação enviado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 