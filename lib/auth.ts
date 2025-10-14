// Arquivo de autenticação refatorado para usar apenas Supabase Auth
// Este arquivo foi simplificado para remover dependências do NextAuth e Prisma

import { createClient } from '@/app/_lib/supabase-server';

// Tipos para o usuário autenticado
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
}

// Função para obter o usuário atual do Supabase
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Buscar dados completos do usuário na tabela users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, name, image, role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Erro ao buscar dados do usuário:', userError);
      return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || user.email!.split('@')[0],
        image: user.user_metadata?.avatar_url,
        role: 'user', // Role padrão
      };
    }

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name || user.email!.split('@')[0],
      image: userData.image,
      role: userData.role || 'user',
    };
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
}

// Função para verificar se o usuário está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

// Função para obter a sessão atual
export async function getSession() {
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
} 