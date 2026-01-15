"use client";

import { useState, useEffect } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
  isActive?: boolean;
}

/**
 * Hook simplificado para modo de teste
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Simular delay mínimo
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!mounted) return;

        // Modo teste sempre ativo
        setUser({
          id: 'test-user-12345',
          email: 'test@example.com',
          name: 'Test User',
          image: null,
          isActive: true,
        });
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (mounted) {
          setUser({
            id: 'test-user-12345',
            email: 'test@example.com',
            name: 'Test User',
            image: null,
            isActive: true,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setUser({
      id: 'test-user-12345',
      email: email,
      name: email.split('@')[0],
      image: null,
      isActive: true,
    });
    return { success: true };
  };

  const signUp = async (email: string, password: string, name: string) => {
    setUser({
      id: 'test-user-12345',
      email: email,
      name: name,
      image: null,
      isActive: true,
    });
    return { success: true };
  };

  const signOut = async () => {
    setUser(null);
    return { success: true };
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
