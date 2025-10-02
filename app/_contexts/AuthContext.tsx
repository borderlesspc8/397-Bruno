"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/_hooks/useAuth';

interface AuthContextType {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Rotas que não precisam de autenticação
  const publicRoutes = [
    '/auth',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify',
    '/auth/verify-request',
    '/',
    '/sobre',
    '/contato',
    '/precos'
  ];
  
  // Rotas que precisam de autenticação (auth-routes)
  const isProtectedRoute = pathname?.startsWith('/dashboard') || 
                          pathname?.startsWith('/gestao-click') ||
                          pathname?.startsWith('/goals') ||
                          pathname?.startsWith('/cash-flow') ||
                          pathname?.startsWith('/dre') ||
                          pathname?.startsWith('/profile') ||
                          pathname?.startsWith('/budgets') ||
                          pathname?.startsWith('/metas-vendas') ||
                          pathname?.startsWith('/teste-protecao');

  const isPublicRoute = publicRoutes.includes(pathname || '');
  
  const isAuthenticated = !!user;

  // Redirecionamento automático baseado no estado de autenticação - OTIMIZADO
  useEffect(() => {
    // Só executar se não estiver carregando
    if (loading) {
      return;
    }

    // Se não está autenticado e está em rota protegida
    if (!isAuthenticated && isProtectedRoute) {
      console.log(`[AuthProvider] ⚠️ Redirecionando para /auth`);
      router.push('/auth');
      return;
    }

    // Se está autenticado e está em rota de login
    if (isAuthenticated && pathname?.includes('/auth')) {
      console.log(`[AuthProvider] ✅ Redirecionando para /dashboard/vendas`);
      window.location.href = '/dashboard/vendas';
      return;
    }
  }, [loading, isAuthenticated, isProtectedRoute, pathname, router]); // Dependências otimizadas

  // Mostrar loading durante verificação de autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado e está em rota protegida, não renderizar nada (será redirecionado)
  if (!isAuthenticated && isProtectedRoute) {
    return null;
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
