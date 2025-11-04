/**
 * Tipos TypeScript para o sistema RBAC (Role-Based Access Control)
 */

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by?: string;
  is_active: boolean;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
}

/**
 * Roles padrão do sistema
 */
export enum SystemRoles {
  ADMIN = 'admin',
  GERENTE = 'gerente',
  COORDENADOR = 'coordenador-comercial',
  VENDEDOR = 'vendedor',
}

/**
 * Permissions padrão do sistema
 * Formato: {recurso}.{ação}
 */
export enum SystemPermissions {
  // Vendas
  VENDAS_VIEW = 'vendas.view',
  VENDAS_CREATE = 'vendas.create',
  VENDAS_EDIT = 'vendas.edit',
  VENDAS_DELETE = 'vendas.delete',
  
  // Vendedores
  VENDEDORES_VIEW = 'vendedores.view',
  VENDEDORES_CREATE = 'vendedores.create',
  VENDEDORES_EDIT = 'vendedores.edit',
  VENDEDORES_DELETE = 'vendedores.delete',
  VENDEDORES_DASHBOARD = 'vendedores.dashboard',
  
  // Metas
  METAS_VIEW = 'metas.view',
  METAS_CREATE = 'metas.create',
  METAS_EDIT = 'metas.edit',
  METAS_DELETE = 'metas.delete',
  
  // Dashboard CEO
  CEO_DASHBOARD = 'ceo.dashboard',
  
  // Outros módulos
  ATENDIMENTOS_VIEW = 'atendimentos.view',
  CONSULTORES_VIEW = 'consultores.view',
  CONVERSAO_VIEW = 'conversao.view',
  PERFORMANCE_VIEW = 'performance.view',
  REPORTS_VIEW = 'reports.view',
  CATEGORIES_VIEW = 'categories.view',
  AI_ACCESS = 'ai.access',
  GOALS_VIEW = 'goals.view',
  BUDGETS_VIEW = 'budgets.view',
  CASHFLOW_VIEW = 'cashflow.view',
  GESTAO_CLICK = 'gestao.click',
  EXPORT_ACCESS = 'export.access',
  INTEGRATIONS_ACCESS = 'integrations.access',
  SETTINGS_ACCESS = 'settings.access',
  HELP_ACCESS = 'help.access',

  // Gerenciamento de Usuários/RBAC
  USERS_VIEW = 'users.view',
  USERS_EDIT_ROLES = 'users.edit_roles',
  ROLES_VIEW = 'roles.view',
  ROLES_CREATE = 'roles.create',
  ROLES_EDIT = 'roles.edit',
  ROLES_DELETE = 'roles.delete',
  PERMISSIONS_VIEW = 'permissions.view',
  PERMISSIONS_ASSIGN = 'permissions.assign',
}

/**
 * Mapeamento de roles para permissões padrão
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRoles, SystemPermissions[]> = {
  [SystemRoles.ADMIN]: Object.values(SystemPermissions),
  [SystemRoles.GERENTE]: [
    SystemPermissions.VENDAS_VIEW,
    SystemPermissions.VENDAS_CREATE,
    SystemPermissions.VENDAS_EDIT,
    SystemPermissions.VENDEDORES_VIEW,
    SystemPermissions.VENDEDORES_DASHBOARD,
    SystemPermissions.METAS_VIEW,
    SystemPermissions.METAS_CREATE,
    SystemPermissions.METAS_EDIT,
    SystemPermissions.REPORTS_VIEW,
  ],
  [SystemRoles.VENDEDOR]: [
    SystemPermissions.VENDEDORES_DASHBOARD,
    SystemPermissions.VENDAS_VIEW,
  ],
};

