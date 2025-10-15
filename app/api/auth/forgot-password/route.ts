import { NextResponse } from "next/server";
import { createClient } from "@/app/_lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Enviar email de reset via Supabase Auth
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      console.error("[FORGOT_PASSWORD]", error);
      // Por questões de segurança, não informamos se o email existe ou não
      return NextResponse.json(
        { message: "Se o email estiver cadastrado, enviaremos as instruções de recuperação" },
        { status: 200 }
      );
    }

    // Log de auditoria
    console.log(`[PASSWORD_RESET_REQUESTED] Email: ${email}`);

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
