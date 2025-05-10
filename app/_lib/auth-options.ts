import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { SubscriptionPlan } from "../types";
import { compare } from "bcryptjs";
import { isDemoMode, demoConfig } from "./config";
import { User } from "next-auth";
import { sendEmail } from "./email";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@acceleracrm.com.br",
      async sendVerificationRequest({ identifier: email, url }) {
        try {
          // Envio personalizado usando nossa função de envio de email
          await sendEmail({
            to: email,
            subject: "Acesso ao Conta Rápida",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #3b82f6; text-align: center;">Conta Rápida</h1>
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-top: 20px;">
                  <h2 style="color: #111827;">Seu link de acesso</h2>
                  <p style="color: #4b5563; line-height: 1.5;">
                    Clique no botão abaixo para acessar sua conta no Conta Rápida. 
                    Este link é válido por 10 minutos.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 4px; font-weight: bold;
                              display: inline-block;">
                      Acessar minha conta
                    </a>
                  </div>
                  <p style="color: #4b5563; line-height: 1.5;">
                    Se você não solicitou este link, ignore este e-mail.
                  </p>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 14px;">
                    <p>© ${new Date().getFullYear()} Conta Rápida - Todos os direitos reservados</p>
                  </div>
                </div>
              </div>
            `,
          });
        } catch (error) {
          console.error("Erro ao enviar email de verificação:", error);
          throw new Error("Erro ao enviar email de verificação");
        }
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credenciais não fornecidas");
          return null;
        }

        try {
          console.log(`Tentativa de login: ${credentials.email}, Modo demo: ${isDemoMode}`);
          
          // Modo de demonstração
          if (isDemoMode && credentials.email === demoConfig.email && credentials.password === "123456") {
            console.log("Tentando autenticar usuário demo");
            
            // Buscar o usuário demo no banco de dados
            const demoUser = await prisma.user.findUnique({
              where: { email: demoConfig.email }
            });

            if (!demoUser) {
              console.log("Usuário demo não encontrado no banco de dados");
              return null;
            }
            
            console.log("Usuário demo encontrado, autenticando...");
            // NextAuth espera exatamente este formato
            return {
              id: demoUser.id,
              email: demoUser.email,
              name: demoUser.name,
              image: demoUser.image
            } as User;
          }

          // Autenticação para usuários regulares
          console.log("Autenticando usuário regular");
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            console.log("Usuário não encontrado");
            return null;
          }

          if (!user.password) {
            console.log("Usuário não possui senha definida");
            return null;
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("Senha inválida");
            return null;
          }

          console.log("Usuário autenticado com sucesso");
          // NextAuth espera exatamente este formato
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          } as User;
        } catch (error) {
          console.error("Erro de autenticação:", error);
        return null;
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/auth",
    signOut: "/auth",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request", // Página exibida após envio do magic link
  },
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub;
        
        // Carregar os dados de assinatura do usuário
        try {
          const subscription = await prisma.subscription.findUnique({
            where: { userId: token.sub },
            select: {
              plan: true,
              status: true,
              endDate: true,
            },
          });
          
          // Definir o plano na sessão
          if (subscription) {
            // Converter a string do plano para o enum SubscriptionPlan
            let planValue = SubscriptionPlan.FREE;
            
            // Normalizar o plano (converter para maiúsculas e remover espaços)
            const normalizedPlan = subscription.plan.toUpperCase().trim();
            
            // Mapear o plano do banco de dados para o enum SubscriptionPlan
            switch (normalizedPlan) {
              case 'BASIC':
                planValue = SubscriptionPlan.BASIC;
                break;
              case 'PREMIUM':
                planValue = SubscriptionPlan.PREMIUM;
                break;
              case 'ENTERPRISE':
                planValue = SubscriptionPlan.ENTERPRISE;
                console.log("Plano ENTERPRISE definido para o usuário:", token.sub);
                break;
              default:
                planValue = SubscriptionPlan.FREE;
            }
            
            session.user.subscriptionPlan = planValue;
            
            // Verificar se a assinatura está ativa
            session.user.isActive = subscription.status === "ACTIVE";
            
            // Se houver uma data de término, usá-la como data de expiração
            if (subscription.endDate) {
              session.user.planExpiresAt = subscription.endDate;
            }
          } else {
            // Modo de demonstração - usuário demo recebe plano premium
            if (isDemoMode && session.user.email === demoConfig.email) {
              session.user.subscriptionPlan = SubscriptionPlan.PREMIUM;
              session.user.isActive = true;
            } else {
              // Usuários sem assinatura recebem plano FREE
              session.user.subscriptionPlan = SubscriptionPlan.FREE;
              session.user.isActive = true;
            }
          }
          
          // FORÇAR PLANO ENTERPRISE PARA ADMINISTRADOR
          if (session.user.email === "mvcas95@gmail.com") {
            console.log("Forçando plano ENTERPRISE para o administrador");
            session.user.subscriptionPlan = SubscriptionPlan.ENTERPRISE;
            session.user.isActive = true;
          }
        } catch (error) {
          console.error("Erro ao carregar dados de assinatura:", error);
          // Definir valores padrão em caso de erro
          session.user.subscriptionPlan = SubscriptionPlan.FREE;
          session.user.isActive = true;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Personaliza os redirecionamentos para garantir que a verificação funcione
      if (url.startsWith('/api/auth/callback') || url.startsWith('/auth/verify')) {
        return url;
      }
      
      // Garantir que a URL base seja sempre o domínio correto
      const safeBaseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || baseUrl;
      
      // Se a URL já é externa, verificar se é uma URL válida para o domínio permitido
      if (url.startsWith('http')) {
        // Extrair o hostname da URL
        try {
          const urlObj = new URL(url);
          const baseUrlObj = new URL(safeBaseUrl);
          
          // Verificar se o hostname da URL está dentro do domínio permitido
          if (urlObj.hostname === baseUrlObj.hostname) {
            return url;
          }
          
          // Se não for um domínio permitido, redirecionar para o dashboard
          console.log(`Redirecionamento bloqueado para domínio não permitido: ${urlObj.hostname}`);
          return `${safeBaseUrl}/dashboard`;
        } catch (e) {
          console.error("Erro ao analisar URL:", e);
          return `${safeBaseUrl}/dashboard`;
        }
      }
      
      // Se a URL começa com '/', é uma URL relativa
      if (url.startsWith('/')) {
        return `${safeBaseUrl}${url}`;
      }
      
      // Para outros casos, redirecionar para o dashboard
      return `${safeBaseUrl}/dashboard`;
    },
  },
  debug: process.env.NODE_ENV !== "production", // Habilitar apenas em desenvolvimento
}; 