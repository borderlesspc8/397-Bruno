"use client";

import { useAuth } from '@/app/_hooks/useAuth';
import { useUserPermissions } from '@/app/_hooks/useUserPermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminRouteProtectionProps {
  children: React.ReactNode;
}

export function AdminRouteProtection({ children }: AdminRouteProtectionProps) {
  const { user, loading } = useAuth();
  const { isVendor } = useUserPermissions();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Se for vendedor, redirecionar para o dashboard de vendedores
      if (isVendor) {
        console.log('🚫 Vendedor tentando acessar área restrita. Redirecionando...');
        router.push('/dashboard/vendedores');
        return;
      }
    }
  }, [user, loading, isVendor, router]);

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

  // Se for vendedor, mostrar mensagem de acesso negado
  if (isVendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">
            Vendedores não têm permissão para acessar esta área.
          </p>
          <button
            onClick={() => router.push('/dashboard/vendedores')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Voltar ao Dashboard de Vendedores
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
