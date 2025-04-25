import { NextResponse } from "next/server";
import { prisma } from "@/app/_lib/prisma";
import { randomBytes } from "crypto";
import { sendEmail } from "@/app/_lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Verifica se o e-mail existe
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "E-mail não encontrado" },
        { status: 404 }
      );
    }

    // Gera um token único
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hora

    // Salva o token no banco
    await prisma.passwordReset.create({
      data: {
        token,
        expires,
        userId: user.id,
      },
    });

    // Envia o e-mail
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
    
    await sendEmail({
      to: email,
      subject: "Recuperação de Senha - Conta Rápida",
      html: `
        <h1>Recuperação de Senha</h1>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Se você não fez esta solicitação, ignore este e-mail.</p>
        <p>Para redefinir sua senha, clique no link abaixo:</p>
        <a href="${resetLink}">Redefinir Senha</a>
        <p>Este link expira em 1 hora.</p>
        <p>Atenciosamente,<br>Equipe Conta Rápida</p>
      `,
    });

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