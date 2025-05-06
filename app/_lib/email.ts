import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Função genérica para envio de emails
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY não configurada");
    throw new Error("Configuração de e-mail não encontrada");
  }

  try {
    const result = await resend.emails.send({
      from: "Conta Rápida <noreply@acceleracrm.com.br>",
      to,
      subject,
      html,
    });
    
    console.log("[EMAIL_SENT]", { to, subject, result });
    return result;
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw new Error("Erro ao enviar e-mail");
  }
}

/**
 * Template para email de recuperação de senha
 */
export function getPasswordResetTemplate(resetLink: string): string {
  const currentYear = new Date().getFullYear();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #3b82f6; margin: 0;">Conta Rápida</h1>
      </div>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 20px;">
        <h2 style="color: #111827; margin-top: 0;">Recuperação de Senha</h2>
        
        <p style="color: #4b5563; line-height: 1.5;">
          Você solicitou a recuperação de senha para sua conta no Conta Rápida.
          Use o link abaixo para definir uma nova senha:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; font-weight: bold;
                    display: inline-block;">
            Redefinir minha senha
          </a>
        </div>
        
        <p style="color: #4b5563; line-height: 1.5;">
          Se você não solicitou esta recuperação de senha, ignore este e-mail.
        </p>
        
        <p style="color: #4b5563; line-height: 1.5;">
          Por questões de segurança, este link expira em 1 hora.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0;">© ${currentYear} Conta Rápida - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Função específica para envio de email de recuperação de senha
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: "Recuperação de Senha - Conta Rápida",
    html: getPasswordResetTemplate(resetLink),
  });
} 