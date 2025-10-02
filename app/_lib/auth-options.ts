// Arquivo de configuração de autenticação usando apenas Supabase Auth
// Este arquivo foi refatorado para remover dependências do NextAuth

import { createClient } from "./supabase-server";

// Tipos para o usuário autenticado
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isActive?: boolean;
}

// Função para autenticar usuário via Supabase
export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    console.log(`Tentativa de login Supabase: ${email}`);
    
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.log("Erro na autenticação Supabase:", error?.message);
      return null;
    }

    console.log("Usuário autenticado via Supabase com sucesso");
    return {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.full_name || data.user.email!.split('@')[0],
      image: data.user.user_metadata?.avatar_url,
      isActive: true,
    };
  } catch (error) {
    console.error("Erro de autenticação Supabase:", error);
    return null;
  }
}

// Função para registrar usuário via Supabase
export async function registerUser(email: string, password: string, metadata?: { name?: string }): Promise<AuthUser | null> {
  try {
    console.log(`Tentativa de registro Supabase: ${email}`);
    
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {}
      }
    });

    if (error || !data.user) {
      console.log("Erro no registro Supabase:", error?.message);
      return null;
    }

    console.log("Usuário registrado via Supabase com sucesso");
    return {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.full_name || data.user.email!.split('@')[0],
      image: data.user.user_metadata?.avatar_url,
      isActive: true,
    };
  } catch (error) {
    console.error("Erro no registro Supabase:", error);
    return null;
  }
}

// Função para fazer logout via Supabase
export async function logoutUser(): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Erro no logout Supabase:", error);
      return false;
    }

    console.log("Logout realizado com sucesso");
    return true;
  } catch (error) {
    console.error("Erro no logout Supabase:", error);
    return false;
  }
}

// Função para recuperar senha via Supabase
export async function resetPassword(email: string): Promise<boolean> {
  try {
    console.log(`Tentativa de reset de senha: ${email}`);
    
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      console.log("Erro no reset de senha Supabase:", error?.message);
      return false;
    }

    console.log("Email de reset enviado com sucesso");
    return true;
  } catch (error) {
    console.error("Erro no reset de senha Supabase:", error);
    return false;
  }
} 