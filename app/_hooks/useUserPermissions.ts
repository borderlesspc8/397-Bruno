"use client";

import { useAuth } from './useAuth';
import { useMemo } from 'react';

export interface UserPermissions {
  canAccessVendas: boolean;
  canAccessVendedores: boolean;
  canAccessMetas: boolean;
  canAccessDashboardCEO: boolean;
  canAccessRBAC: boolean;
  canAccessAtendimentos: boolean;
  canAccessConsultores: boolean;
  canAccessConversao: boolean;
  canAccessPerformance: boolean;
  canAccessReports: boolean;
  canAccessCategories: boolean;
  canAccessAI: boolean;
  canAccessGoals: boolean;
  canAccessBudgets: boolean;
  canAccessCashFlow: boolean;
  canAccessGestaoClick: boolean;
  canAccessExport: boolean;
  canAccessIntegrations: boolean;
  canAccessSettings: boolean;
  canAccessHelp: boolean;
  canAccessVendasVendedores: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  isCoordenador?: boolean;
  isUser: boolean;
  allPermissions?: string[];
  hasPermission?: (permission: string) => boolean;
}

/**
 * Hook simplificado para modo de teste
 * Retorna todas as permissões ativadas para admin
 */
export function useUserPermissions(): UserPermissions {
  const { user } = useAuth();

  // Retornar permissões padrão para modo teste
  const permissions = useMemo(() => ({
    canAccessVendas: true,
    canAccessVendedores: true,
    canAccessMetas: true,
    canAccessDashboardCEO: true,
    canAccessRBAC: true,
    canAccessAtendimentos: true,
    canAccessConsultores: true,
    canAccessConversao: true,
    canAccessPerformance: true,
    canAccessReports: true,
    canAccessCategories: true,
    canAccessAI: true,
    canAccessGoals: true,
    canAccessBudgets: true,
    canAccessCashFlow: true,
    canAccessGestaoClick: true,
    canAccessExport: true,
    canAccessIntegrations: true,
    canAccessSettings: true,
    canAccessHelp: true,
    canAccessVendasVendedores: true,
    isVendor: false,
    isAdmin: true,
    isCoordenador: false,
    isUser: !!user,
    allPermissions: [
      'view_vendas',
      'view_vendedores',
      'view_metas',
      'view_dashboard_ceo',
      'view_rbac',
      'view_atendimentos',
      'view_consultores',
      'view_conversao',
      'view_performance',
      'view_reports',
      'view_categories',
      'view_ai',
      'view_goals',
      'view_budgets',
      'view_cash_flow',
      'view_gestao_click',
      'export_data',
      'manage_integrations',
      'manage_settings',
      'view_help'
    ],
    hasPermission: (permission: string) => true
  }), [user]);

  return permissions;
}
