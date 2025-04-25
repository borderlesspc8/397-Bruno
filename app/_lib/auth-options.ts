import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { SubscriptionPlan } from "../types";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        // Adicione sua lógica de autorização aqui
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Exemplo básico, substitua por sua lógica de autenticação real
        if (credentials.email === "admin@example.com" && credentials.password === "password") {
          return {
            id: "1",
            name: "Admin",
            email: "admin@example.com",
          } as any;
        }

        return null;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  jwt: {
    // Usar o padrão encode/decode para evitar problemas de compatibilidade
    // Isso pode corrigir o erro "Invalid Compact JWE"
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
    signOut: "/auth/logout",
    error: "/auth/error",
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
            // Se não houver assinatura, definir o plano padrão como FREE
            session.user.subscriptionPlan = SubscriptionPlan.FREE;
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
  },
  debug: process.env.NODE_ENV === "development",
}; 