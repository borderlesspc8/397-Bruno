"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/_hooks/useAuth';
import { useUserPermissions } from '@/app/_hooks/useUserPermissions';

interface AuthContextType {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVendor: boolean;
  hasAccessTo: (route: string) => boolean;
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
  const { user, loading: authLoading } = useAuth();
  const permissions = useUserPermissions();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);
  
  // Considerar loading enquanto auth está carregando OU permissões ainda não foram carregadas
  // As permissões são carregadas assincronamente, mas precisamos aguardar antes de verificar acesso
  const loading = authLoading || !permissions || !permissions.allPermissions;
  
  // Rotas que não precisam de autenticação
  const publicRoutes = useMemo(() => [
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
  ], []);
  
  // Rotas que precisam de autenticação (auth-routes)
  const isProtectedRoute = useMemo(() => 
    pathname?.startsWith('/dashboard') || 
    pathname?.startsWith('/gestao-click') ||
    pathname?.startsWith('/goals') ||
    pathname?.startsWith('/cash-flow') ||
    pathname?.startsWith('/dre') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/budgets') ||
    pathname?.startsWith('/metas-vendas') ||
    pathname?.startsWith('/teste-protecao'),
    [pathname]
  );

  const isPublicRoute = useMemo(() => publicRoutes.includes(pathname || ''), [pathname, publicRoutes]);
  
  const isAuthenticated = !!user;

  // Sistema de controle de acesso baseado em RBAC (banco de dados)
  // Usar useMemo para evitar recriação desnecessária
  // Garantir que isAdmin seja boolean (não undefined)
  const isAdmin = useMemo(() => !!permissions?.isAdmin, [permissions?.isAdmin]);
  const isVendor = useMemo(() => !!permissions?.isVendor && !permissions?.isAdmin, [permissions?.isVendor, permissions?.isAdmin]);

  // Função para verificar acesso a rotas específicas baseado em permissões
  // Memoizada para evitar recriação a cada render
  const hasAccessTo = useCallback((route: string): boolean => {
    if (!isAuthenticated) return false;
    
    // Administrador tem acesso a tudo - verificar PRIMEIRO
    // Usar permissions?.isAdmin diretamente para evitar problemas de timing
    const userIsAdmin = permissions?.isAdmin || false;
    if (userIsAdmin || isAdmin) {
      console.log(`[hasAccessTo] Admin tem acesso a ${route}`);
      return true;
    }
    
    // Se não temos permissões carregadas ainda, retornar false mas não bloquear (será verificado depois)
    if (!permissions || !permissions.allPermissions) {
      console.log(`[hasAccessTo] Permissões ainda não carregadas para ${route}`);
      return false;
    }
    
    // Verificar permissões específicas baseado na rota
    if (route === '/dashboard/vendas' || route.startsWith('/dashboard/vendas')) {
      return permissions.canAccessVendas || false;
    }
    if (route === '/dashboard/vendedores' || route.startsWith('/dashboard/vendedores')) {
      return permissions.canAccessVendedores || false;
    }
    if (route === '/dashboard/metas' || route.startsWith('/dashboard/metas')) {
      return permissions.canAccessMetas || false;
    }
    if (route === '/dashboard-ceo' || route.startsWith('/dashboard-ceo')) {
      return permissions.canAccessDashboardCEO || false;
    }
    if (route === '/dashboard/admin/rbac' || route.startsWith('/dashboard/admin/rbac')) {
      // Admin sempre tem acesso a RBAC, mas também verificar canAccessRBAC
      return permissions.isAdmin || permissions.canAccessRBAC || false;
    }
    
    // Vendedores só podem acessar dashboard de análise de vendedores
    if (isVendor) {
      return route === '/dashboard-vendedores' || route.startsWith('/dashboard-vendedores/');
    }
    
    return false;
  }, [isAuthenticated, isAdmin, isVendor, permissions?.canAccessVendas, permissions?.canAccessVendedores, permissions?.canAccessMetas, permissions?.canAccessDashboardCEO, permissions?.canAccessRBAC, permissions?.isAdmin, permissions?.allPermissions]);

  // Redirecionamento automático baseado no estado de autenticação e permissões - OTIMIZADO
  useEffect(() => {
    // Prevenir múltiplos redirecionamentos simultâneos
    if (redirectingRef.current) {
       return;
    }

    // Só executar se não estiver carregando autenticação
    if (loading) {
      return;
    }

    // IMPORTANTE: Para rotas protegidas, SEMPRE aguardar permissões carregarem completamente
    // antes de fazer qualquer verificação de acesso ou redirecionamento
    // Isso evita redirecionamentos incorretos quando o usuário é admin mas as permissões ainda estão carregando
    if (isAuthenticated && isProtectedRoute && pathname) {
      if (!permissions || !permissions.allPermissions) {
        
        return;
      }
    }
    
    // Para outras situações (não são rotas protegidas), verificar se permissões existem
    if (!permissions || !permissions.allPermissions) {
      // Se ainda não temos permissões mas o usuário está autenticado, aguardar
      if (isAuthenticated) {
        
        return;
      }
    }

    // Se não está autenticado e está em rota protegida
    // IMPORTANTE: Verificar user diretamente, não apenas isAuthenticated, para evitar falsos positivos
    if (!user && !isAuthenticated && isProtectedRoute) {
      if (!pathname?.includes('/auth')) {
        console.log(`[AuthProvider] ⚠️ Não autenticado (user: ${user}, isAuthenticated: ${isAuthenticated}), redirecionando para /auth`);
        redirectingRef.current = true;
        router.push('/auth');
      }
      return;
    }
    
    // Se user existe mas isAuthenticated está false (possível problema de timing), aguardar
    if (user && !isAuthenticated && isProtectedRoute) {
      return;
    }

    // Se está autenticado e está em rota de login
    if (isAuthenticated && pathname?.includes('/auth')) {
      redirectingRef.current = true;
      // Redirecionar baseado no tipo de usuário (RBAC)
      if (isAdmin) {
        window.location.href = '/dashboard/vendas';
      } else if (isVendor) {
        window.location.href = '/dashboard-vendedores';
      } else {
        // Usuário sem role definida - redirecionar para dashboard padrão
        window.location.href = '/dashboard/vendas';
      }
      return;
    }

    // Verificar se usuário tem acesso à rota atual baseado em permissões RBAC
    if (isAuthenticated && isProtectedRoute && pathname) {
      const userIsAdmin = permissions?.isAdmin || false;
      if (userIsAdmin) {
        redirectingRef.current = false; // Resetar flag se necessário
        return;
      }
      
      // Só verificar permissões específicas se NÃO for admin
      // Se ainda não temos permissões carregadas, aguardar (exceto para admin que já foi verificado acima)
      if (!permissions || !permissions.allPermissions) {
        
        return;
      }
      
      const hasAccess = hasAccessTo(pathname);
      if (!hasAccess) {
        // CRÍTICO: Verificar novamente se é admin antes de redirecionar
        // Isso evita redirecionar admin por engano
        if (userIsAdmin) {
          redirectingRef.current = false;
          return;
        }
        
        
        redirectingRef.current = true;
        if (isVendor) {
          router.push('/dashboard-vendedores');
        } else {
          // Redirecionar para dashboard padrão baseado em permissões
          // NUNCA redirecionar para /auth se o usuário está autenticado - isso pode causar logout
          if (permissions.canAccessVendas) {
            router.push('/dashboard/vendas');
          } else if (permissions.canAccessVendedores) {
            router.push('/dashboard/vendedores');
          } else {
            router.push('/dashboard/vendas');
          }
        }
        return;
      } 
    }

    // Se chegou aqui, não há redirecionamento necessário - resetar flag
    if (redirectingRef.current && isAuthenticated && isProtectedRoute && pathname) {
      const hasAccess = hasAccessTo(pathname);
      if (hasAccess || isAdmin) {
        console.log('[AuthProvider] Resetando flag de redirecionamento - acesso permitido');
        redirectingRef.current = false;
      }
    }
  }, [
    loading, 
    isAuthenticated, 
    isProtectedRoute, 
    pathname, 
    isAdmin, 
    isVendor, 
    permissions?.canAccessVendas, 
    permissions?.canAccessVendedores,
    permissions?.allPermissions,
    hasAccessTo,
    router
  ]); // Dependências otimizadas - usar optional chaining para permissions

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
    isAuthenticated,
    isAdmin,
    isVendor,
    hasAccessTo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

