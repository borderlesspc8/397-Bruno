"use client";

import { useAuth } from '@/app/_hooks/useAuth';
import { useUserPermissions } from '@/app/_hooks/useUserPermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SystemPermissions } from '@/app/_types/rbac';

interface AdminRouteProtectionProps {
  children: React.ReactNode;
  requiredPermission?: SystemPermissions;
}

export function AdminRouteProtection({ children, requiredPermission }: AdminRouteProtectionProps) {
  const { user, loading: authLoading } = useAuth();
  const permissions = useUserPermissions();
  const router = useRouter();

  // Debug: Log do estado atual das permissões
  useEffect(() => {
    
  }, [user, authLoading, permissions]);

  // Verificar se é admin - usar permissions diretamente para evitar problemas de timing
  const isAdmin = permissions?.isAdmin || false;
  const hasValidPermissions = permissions && permissions.allPermissions && permissions.allPermissions.length > 0;
  const isLoading = authLoading || !permissions || !hasValidPermissions;

  useEffect(() => {
    // Se ainda está carregando, aguardar
    if (isLoading) {
      
      return;
    }

    // Se não tiver usuário, não fazer nada (AuthProvider vai redirecionar)
    if (!user) {
      return;
    }

    const userIsAdmin = permissions?.isAdmin || false;
    if (userIsAdmin) {
      return;
    }

    // Se for vendedor (sem ser admin), redirecionar para o dashboard de vendedores
    if (permissions?.isVendor) {
      router.push('/dashboard-vendedores');
      return;
    }

    // Se for necessário verificar permissão específica (apenas para não-admins)
    // IMPORTANTE: Admin já foi verificado acima, então não precisamos verificar permissão específica para admin
    if (requiredPermission && !userIsAdmin) {
      const hasRequiredPermission = permissions?.hasPermission?.(requiredPermission) || false;
      if (!hasRequiredPermission) {
        router.push('/dashboard/vendas');
        return;
      }
    }
  }, [user, isLoading, permissions, router, requiredPermission, isAdmin]);

  // Se não estiver logado, não renderizar nada (o AuthProvider vai redirecionar)
  if (!user) {
    return null;
  }

  if (isLoading) {
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // AGORA que as permissões carregaram COMPLETAMENTE, verificar se é admin
  // Verificar novamente aqui para garantir que temos o valor mais recente após o carregamento
  // Só fazer esta verificação DEPOIS que allPermissions tem dados válidos
  const userIsAdminAfterLoad = permissions?.isAdmin || false;
  if (userIsAdminAfterLoad) {
    
    return <>{children}</>;
  }

  // Se for vendedor (sem ser admin), mostrar mensagem de acesso negado
  if (permissions?.isVendor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">
            Vendedores não têm permissão para acessar esta área.
          </p>
          <button
            onClick={() => router.push('/dashboard-vendedores')}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Voltar ao Dashboard de Vendedores
          </button>
        </div>
      </div>
    );
  }

  // Se for necessário verificar permissão específica e não tiver (apenas para não-admins)
  // IMPORTANTE: Admin já foi verificado acima, então não precisamos verificar permissão específica para admin
  if (requiredPermission && !userIsAdminAfterLoad) {
    const hasRequiredPermission = permissions?.hasPermission?.(requiredPermission) || false;
    if (!hasRequiredPermission) {
      
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar esta área.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Permissão necessária: {requiredPermission}
            </p>
            <button
              onClick={() => router.push('/dashboard/vendas')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
