import { NextRequest } from 'next/server';
import { createClient as createServerClient } from './supabase-server';
import { 
  getUserRBACInfo, 
  hasPermission
} from '@/app/_services/permissions';
import { SystemRoles, SystemPermissions } from '@/app/_types/rbac';

export interface UserPermissions {
  isAdmin: boolean;
  isVendor: boolean;
  canAccessVendas: boolean;
  canAccessVendedores: boolean;
  canAccessMetas: boolean;
  canAccessDashboardCEO: boolean;
}

/**
 * Verifica as permissões do usuário baseado no banco de dados RBAC
 * Mantém fallback para email durante transição
 */
export async function checkUserPermissions(userId: string, userEmail?: string): Promise<UserPermissions> {
  try {
    // Buscar informações RBAC do banco
    const rbacInfo = await getUserRBACInfo(userId);
    
    // Mapear permissões do RBAC para a interface legada
    return {
      isAdmin: rbacInfo.isAdmin,
      isVendor: rbacInfo.isVendor,
      canAccessVendas: await hasPermission(userId, SystemPermissions.VENDAS_VIEW),
      canAccessVendedores: await hasPermission(userId, SystemPermissions.VENDEDORES_DASHBOARD) || rbacInfo.isVendor,
      canAccessMetas: await hasPermission(userId, SystemPermissions.METAS_VIEW) || rbacInfo.isAdmin, // Apenas admin tem acesso a metas
      canAccessDashboardCEO: await hasPermission(userId, SystemPermissions.CEO_DASHBOARD),
    };
  } catch (error) {
    console.error('Erro ao verificar permissões RBAC:', error);
    
    // Em caso de erro, retornar permissões negadas (mais seguro)
    // Não usar fallback baseado em email - forçar uso do sistema RBAC
    return {
      isAdmin: false,
      isVendor: false,
      canAccessVendas: false,
      canAccessVendedores: false,
      canAccessMetas: false,
      canAccessDashboardCEO: false,
    };
  }
}

/**
 * Obtém o usuário autenticado e suas permissões a partir da requisição
 */
export async function getUserPermissions(request: NextRequest): Promise<{
  user: any;
  permissions: UserPermissions;
  error?: string;
}> {
  try {
    // Usar o createClient do supabase-server que usa cookies() do Next.js
    const supabase = createServerClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        permissions: {
          isAdmin: false,
          isVendor: false,
          canAccessVendas: false,
          canAccessVendedores: false,
          canAccessMetas: false,
          canAccessDashboardCEO: false,
        },
        error: error?.message || 'Usuário não autenticado'
      };
    }

    // Buscar permissões do banco de dados RBAC
    const permissions = await checkUserPermissions(user.id, user.email!);

    return {
      user,
      permissions,
    };
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
    return {
      user: null,
      permissions: {
        isAdmin: false,
        isVendor: false,
        canAccessVendas: false,
        canAccessVendedores: false,
        canAccessMetas: false,
        canAccessDashboardCEO: false,
      },
      error: 'Erro interno do servidor'
    };
  }
}

/**
 * Middleware para verificar se o usuário tem acesso a uma rota específica
 */
export async function requirePermission(
  request: NextRequest,
  requiredPermission: keyof UserPermissions
): Promise<{
  success: boolean;
  user?: any;
  permissions?: UserPermissions;
  error?: string;
}> {
  const { user, permissions, error } = await getUserPermissions(request);

  if (error || !user) {
    return {
      success: false,
      error: error || 'Usuário não autenticado'
    };
  }

  if (!permissions[requiredPermission]) {
    return {
      success: false,
      error: 'Acesso negado: permissão insuficiente'
    };
  }

  return {
    success: true,
    user,
    permissions
  };
}

/**
 * Middleware para verificar se o usuário é administrador
 */
export async function requireAdmin(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  permissions?: UserPermissions;
  error?: string;
}> {
  return requirePermission(request, 'isAdmin');
}

/**
 * Middleware para verificar se o usuário pode acessar vendas
 */
export async function requireVendasAccess(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  permissions?: UserPermissions;
  error?: string;
}> {
  return requirePermission(request, 'canAccessVendas');
}

/**
 * Middleware para verificar se o usuário pode acessar vendedores
 */
export async function requireVendedoresAccess(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  permissions?: UserPermissions;
  error?: string;
}> {
  return requirePermission(request, 'canAccessVendedores');
}

/**
 * Middleware para verificar se o usuário pode acessar metas
 */
export async function requireMetasAccess(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  permissions?: UserPermissions;
  error?: string;
}> {
  return requirePermission(request, 'canAccessMetas');
}

/**
 * Middleware para verificar se o usuário pode acessar dashboard CEO
 */
export async function requireDashboardCEOAccess(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  permissions?: UserPermissions;
  error?: string;
}> {
  return requirePermission(request, 'canAccessDashboardCEO');
}
