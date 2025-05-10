import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/app/_lib/prisma";
import { authOptions } from "@/app/_lib/auth-options";

// Exportar para uso em outros arquivos
export { authOptions };

// Criar configuração do NextAuth
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 