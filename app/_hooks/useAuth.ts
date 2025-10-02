"use client";

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/app/_lib/supabase';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isActive?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Criar cliente Supabase uma única vez - OTIMIZADO
  const supabase = useMemo(() => {
    return createClient();
  }, []);

  useEffect(() => {
    let mounted = true;

    // Obter sessão inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Erro ao obter sessão:', error);
          setUser(null);
        } else if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
            image: session.user.user_metadata?.avatar_url,
            isActive: true,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao obter sessão inicial:', error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state change:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0],
            image: session.user.user_metadata?.avatar_url,
            isActive: true,
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Removendo dependência supabase.auth para evitar loops

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Atualizar o estado do usuário imediatamente após login bem-sucedido
      if (data.user) {
        console.log("Login bem-sucedido, atualizando estado do usuário:", data.user);
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata?.full_name || data.user.email!.split('@')[0],
          image: data.user.user_metadata?.avatar_url,
          isActive: true,
        });
        console.log("Estado do usuário atualizado");
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, metadata?: { name?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      // O estado do usuário será atualizado automaticamente pelo onAuthStateChange
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    sendMagicLink,
    isAuthenticated: !!user,
  };
}
