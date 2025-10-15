import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Email do administrador
const ADMIN_EMAIL = 'lojapersonalprime@gmail.com';

export interface UserPermissions {
  isAdmin: boolean;
  isVendor: boolean;
  canAccessVendas: boolean;
  canAccessVendedores: boolean;
  canAccessMetas: boolean;
  canAccessDashboardCEO: boolean;
}

/**
 * Verifica as permissões do usuário baseado no email
 */
export function checkUserPermissions(userEmail: string): UserPermissions {
  const isAdmin = userEmail === ADMIN_EMAIL;
  const isVendor = userEmail !== ADMIN_EMAIL;

  return {
    isAdmin,
    isVendor,
    canAccessVendas: isAdmin,
    canAccessVendedores: true, // Todos os usuários autenticados podem acessar
    canAccessMetas: isAdmin,
    canAccessDashboardCEO: isAdmin,
  };
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
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => 
              request.cookies.set(name, value)
            );
          },
        },
      }
    );

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

    const permissions = checkUserPermissions(user.email!);

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
