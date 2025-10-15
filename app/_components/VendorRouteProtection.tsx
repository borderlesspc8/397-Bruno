"use client";

import { useAuth } from '@/app/_hooks/useAuth';
import { useUserPermissions } from '@/app/_hooks/useUserPermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface VendorRouteProtectionProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function VendorRouteProtection({ 
  children, 
  allowedRoles = ['user', 'admin'] 
}: VendorRouteProtectionProps) {
  const { user, loading } = useAuth();
  const { isVendor } = useUserPermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const userRole = user.role || 'user';
      
      // Se for vendedor e não estiver na lista de roles permitidos
      if (isVendor && !allowedRoles.includes('vendor')) {
        console.log('🚫 Acesso negado para vendedor. Redirecionando...');
        router.push('/dashboard-vendedores');
        return;
      }
      
      // Se não for vendedor mas estiver tentando acessar rota restrita
      if (!isVendor && allowedRoles.includes('vendor') && !allowedRoles.includes(userRole)) {
        console.log('🚫 Acesso negado. Redirecionando...');
        router.push('/dashboard/vendas');
        return;
      }
    }
  }, [user, loading, isVendor, allowedRoles, router]);

  // Mostrar loading enquanto verifica permissões
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver logado, não renderizar nada (o AuthProvider vai redirecionar)
  if (!user) {
    return null;
  }

  // Verificar se o usuário tem permissão
  const userRole = user.role || 'user';
  const hasPermission = allowedRoles.includes(userRole) || 
    (isVendor && allowedRoles.includes('vendor'));

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <button
            onClick={() => router.push('/dashboard-vendedores')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
