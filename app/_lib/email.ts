import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY não configurada");
    throw new Error("Configuração de e-mail não encontrada");
  }

  try {
    await resend.emails.send({
      from: "Conta Rápida <noreply@contarapida.com.br>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw new Error("Erro ao enviar e-mail");
  }
} 