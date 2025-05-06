import { NextResponse } from "next/server";
import { sendPasswordResetEmail } from "@/app/_lib/email";

/**
 * Rota para testar o envio de emails
 * IMPORTANTE: Esta rota só deve estar disponível em ambiente de desenvolvimento
 */
export async function POST(request: Request) {
  // Verificar se estamos em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Esta rota só está disponível em ambiente de desenvolvimento" },
      { status: 403 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Gerar um token de teste
    const testToken = "test-token-" + Date.now().toString();
    
    // Enviar o email de teste
    await sendPasswordResetEmail(email, testToken);

    return NextResponse.json(
      { 
        success: true, 
        message: "Email de teste enviado com sucesso",
        details: {
          to: email,
          token: testToken,
          resetLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${testToken}`
        }
      }
    );
  } catch (error) {
    console.error("[TEST_EMAIL]", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Falha ao enviar email de teste", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 