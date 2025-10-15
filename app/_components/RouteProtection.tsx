"use client";

import React from 'react';
import { useAuthContext } from '@/app/_contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RouteProtectionProps {
  children: React.ReactNode;
  requiredPermission?: 'admin' | 'vendor' | 'vendas' | 'vendedores' | 'metas' | 'dashboard-ceo';
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RouteProtection({ 
  children, 
  requiredPermission, 
  fallback,
  redirectTo 
}: RouteProtectionProps) {
  const { user, isAuthenticated, isAdmin, isVendor, hasAccessTo } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    if (requiredPermission) {
      let hasPermission = false;

      switch (requiredPermission) {
        case 'admin':
          hasPermission = isAdmin;
          break;
        case 'vendor':
          hasPermission = isVendor;
          break;
        case 'vendas':
          hasPermission = hasAccessTo('/dashboard/vendas');
          break;
        case 'vendedores':
          hasPermission = hasAccessTo('/dashboard/vendedores');
          break;
        case 'metas':
          hasPermission = hasAccessTo('/dashboard/metas');
          break;
        case 'dashboard-ceo':
          hasPermission = hasAccessTo('/dashboard-ceo');
          break;
        default:
          hasPermission = true;
      }

      if (!hasPermission) {
        if (redirectTo) {
          router.push(redirectTo);
        } else if (isVendor) {
          router.push('/dashboard-vendedores');
        } else {
          router.push('/auth');
        }
      }
    }
  }, [isAuthenticated, requiredPermission, isAdmin, isVendor, hasAccessTo, router, redirectTo]);

  // Se não está autenticado, não renderizar nada (será redirecionado)
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Verificar permissão específica se fornecida
  if (requiredPermission) {
    let hasPermission = false;

    switch (requiredPermission) {
      case 'admin':
        hasPermission = isAdmin;
        break;
      case 'vendor':
        hasPermission = isVendor;
        break;
      case 'vendas':
        hasPermission = hasAccessTo('/dashboard/vendas');
        break;
      case 'vendedores':
        hasPermission = hasAccessTo('/dashboard/vendedores');
        break;
      case 'metas':
        hasPermission = hasAccessTo('/dashboard/metas');
        break;
      case 'dashboard-ceo':
        hasPermission = hasAccessTo('/dashboard-ceo');
        break;
      default:
        hasPermission = true;
    }

    if (!hasPermission) {
      return fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <button
              onClick={() => {
                if (isVendor) {
                  router.push('/dashboard-vendedores');
                } else {
                  router.push('/auth');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export default RouteProtection;
