import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/app/_lib/supabase-server';
import { getUserRBACInfo, hasPermission } from '@/app/_services/permissions';
import { SystemPermissions } from '@/app/_types/rbac';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar informações RBAC do usuário
    const rbacInfo = await getUserRBACInfo(user.id);

    // Buscar todas as permissões do usuário de uma vez para evitar múltiplas chamadas
    const allPermissions = [
      SystemPermissions.VENDAS_VIEW,
      SystemPermissions.VENDEDORES_DASHBOARD,
      SystemPermissions.VENDEDORES_VIEW,
      SystemPermissions.METAS_VIEW,
      SystemPermissions.CEO_DASHBOARD,
      SystemPermissions.ROLES_VIEW,
      SystemPermissions.ATENDIMENTOS_VIEW,
      SystemPermissions.CONSULTORES_VIEW,
      SystemPermissions.CONVERSAO_VIEW,
      SystemPermissions.PERFORMANCE_VIEW,
      SystemPermissions.REPORTS_VIEW,
      SystemPermissions.CATEGORIES_VIEW,
      SystemPermissions.AI_ACCESS,
      SystemPermissions.GOALS_VIEW,
      SystemPermissions.BUDGETS_VIEW,
      SystemPermissions.CASHFLOW_VIEW,
      SystemPermissions.GESTAO_CLICK,
      SystemPermissions.EXPORT_ACCESS,
      SystemPermissions.INTEGRATIONS_ACCESS,
      SystemPermissions.SETTINGS_ACCESS,
      SystemPermissions.HELP_ACCESS,
    ];

    // Verificar todas as permissões em paralelo
    const permissionChecks = await Promise.all(
      allPermissions.map(perm => hasPermission(user.id, perm))
    );

    // Criar um mapa de permissões para acesso rápido
    const permissionMap = new Map(
      allPermissions.map((perm, index) => [perm, permissionChecks[index]])
    );

    // Função helper para verificar permissão
    const checkPermission = (perm: SystemPermissions) => permissionMap.get(perm) || false;

    // Mapear permissões do RBAC para a interface legada
    const permissions = {
      canAccessVendas: checkPermission(SystemPermissions.VENDAS_VIEW) || rbacInfo.isAdmin || rbacInfo.isCoordenador,
      canAccessVendedores: checkPermission(SystemPermissions.VENDEDORES_VIEW) || rbacInfo.isVendor || rbacInfo.isAdmin || rbacInfo.isCoordenador,
      canAccessMetas: checkPermission(SystemPermissions.METAS_VIEW) || rbacInfo.isAdmin, // Apenas admin tem acesso a metas
      canAccessDashboardCEO: checkPermission(SystemPermissions.CEO_DASHBOARD) || rbacInfo.isAdmin,
      canAccessRBAC: checkPermission(SystemPermissions.ROLES_VIEW) || rbacInfo.isAdmin, // Admin sempre tem acesso a RBAC
      canAccessAtendimentos: checkPermission(SystemPermissions.ATENDIMENTOS_VIEW),
      canAccessConsultores: checkPermission(SystemPermissions.CONSULTORES_VIEW),
      canAccessConversao: checkPermission(SystemPermissions.CONVERSAO_VIEW),
      canAccessPerformance: checkPermission(SystemPermissions.PERFORMANCE_VIEW),
      canAccessReports: checkPermission(SystemPermissions.REPORTS_VIEW),
      canAccessCategories: checkPermission(SystemPermissions.CATEGORIES_VIEW),
      canAccessAI: checkPermission(SystemPermissions.AI_ACCESS),
      canAccessGoals: checkPermission(SystemPermissions.GOALS_VIEW),
      canAccessBudgets: checkPermission(SystemPermissions.BUDGETS_VIEW),
      canAccessCashFlow: checkPermission(SystemPermissions.CASHFLOW_VIEW),
      canAccessGestaoClick: checkPermission(SystemPermissions.GESTAO_CLICK),
      canAccessExport: checkPermission(SystemPermissions.EXPORT_ACCESS),
      canAccessIntegrations: checkPermission(SystemPermissions.INTEGRATIONS_ACCESS),
      canAccessSettings: checkPermission(SystemPermissions.SETTINGS_ACCESS),
      canAccessHelp: checkPermission(SystemPermissions.HELP_ACCESS),
      canAccessVendasVendedores: rbacInfo.isVendor || rbacInfo.isAdmin || rbacInfo.isCoordenador,
      isVendor: rbacInfo.isVendor,
      isAdmin: rbacInfo.isAdmin,
      isCoordenador: rbacInfo.isCoordenador,
      isUser: false,
      // Lista de todas as permissões do usuário para verificação dinâmica
      // rbacInfo.permissions já é uma array de strings (nomes de permissões)
      allPermissions: rbacInfo.permissions,
    };

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar permissões' },
      { status: 500 }
    );
  }
}

