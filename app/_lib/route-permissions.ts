import { SystemPermissions } from '@/app/_types/rbac';

/**
 * Mapeamento de rotas para permissões necessárias
 * Cada rota requer uma permissão específica para ser acessada
 */
export const ROUTE_PERMISSIONS: Record<string, SystemPermissions> = {
  // Dashboard de Vendas
  '/dashboard/vendas': SystemPermissions.VENDAS_VIEW,
  '/dashboard/vendas/': SystemPermissions.VENDAS_VIEW,
  
  // Dashboard de Vendedores (admin)
  '/dashboard/vendedores': SystemPermissions.VENDEDORES_VIEW,
  '/dashboard/vendedores/': SystemPermissions.VENDEDORES_VIEW,
  
  // Dashboard de Vendedores (vendedor)
  '/dashboard-vendedores': SystemPermissions.VENDEDORES_DASHBOARD,
  '/dashboard-vendedores/': SystemPermissions.VENDEDORES_DASHBOARD,
  
  // Dashboard de Metas
  '/dashboard/metas': SystemPermissions.METAS_VIEW,
  '/dashboard/metas/': SystemPermissions.METAS_VIEW,
  
  // Dashboard CEO
  '/dashboard-ceo': SystemPermissions.CEO_DASHBOARD,
  '/dashboard-ceo/': SystemPermissions.CEO_DASHBOARD,
  
  // RBAC Management
  '/dashboard/admin/rbac': SystemPermissions.ROLES_VIEW,
  '/dashboard/admin/rbac/': SystemPermissions.ROLES_VIEW,
};

/**
 * Verifica se uma rota requer permissão específica
 */
export function getRequiredPermissionForRoute(pathname: string): SystemPermissions | null {
  // Verificar rota exata primeiro
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }
  
  // Verificar se a rota começa com algum prefixo conhecido
  for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      return permission;
    }
  }
  
  return null;
}

/**
 * Mapeamento de rotas para exibição no navbar
 * Inclui informações sobre a permissão necessária e o ícone
 */
export interface NavbarRoute {
  path: string;
  label: string;
  permission: SystemPermissions;
  icon?: string;
  description?: string;
}

export const NAVBAR_ROUTES: NavbarRoute[] = [
  {
    path: '/dashboard/vendas',
    label: 'Vendas',
    permission: SystemPermissions.VENDAS_VIEW,
    icon: 'ChartPie',
    description: 'Dashboard de vendas e faturamento',
  },
  {
    path: '/dashboard/vendedores',
    label: 'Vendedores',
    permission: SystemPermissions.VENDEDORES_VIEW,
    icon: 'Users',
    description: 'Análise de desempenho de vendedores',
  },
  {
    path: '/dashboard-vendedores',
    label: 'Dashboard Vendedores',
    permission: SystemPermissions.VENDEDORES_DASHBOARD,
    icon: 'Users',
    description: 'Dashboard pessoal de vendedores',
  },
  {
    path: '/dashboard/metas',
    label: 'Metas',
    permission: SystemPermissions.METAS_VIEW,
    icon: 'Target',
    description: 'Gerenciamento de metas',
  },
  {
    path: '/dashboard-ceo',
    label: 'Dashboard CEO',
    permission: SystemPermissions.CEO_DASHBOARD,
    icon: 'Star',
    description: 'Dashboard executivo',
  },
  {
    path: '/dashboard/admin/rbac',
    label: 'Permissões',
    permission: SystemPermissions.ROLES_VIEW,
    icon: 'Shield',
    description: 'Gerenciamento de permissões e papéis',
  },
];

