"use client";

import { useAuth } from './useAuth';

export interface UserPermissions {
  canAccessVendas: boolean;
  canAccessVendedores: boolean;
  canAccessMetas: boolean;
  canAccessDashboardCEO: boolean;
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
  isVendor: boolean;
  isAdmin: boolean;
  isUser: boolean;
}

export function useUserPermissions(): UserPermissions {
  const { user } = useAuth();
  
  const role = user?.role || 'user';
  const isVendor = role === 'vendor';
  const isAdmin = role === 'admin';
  const isUser = role === 'user';

  // Vendedores só podem acessar o dashboard de vendedores
  if (isVendor) {
    return {
      canAccessVendas: false,
      canAccessVendedores: true, // Único acesso permitido
      canAccessMetas: false,
      canAccessDashboardCEO: false,
      canAccessAtendimentos: false,
      canAccessConsultores: false,
      canAccessConversao: false,
      canAccessPerformance: false,
      canAccessReports: false,
      canAccessCategories: false,
      canAccessAI: false,
      canAccessGoals: false,
      canAccessBudgets: false,
      canAccessCashFlow: false,
      canAccessGestaoClick: false,
      canAccessExport: false,
      canAccessIntegrations: false,
      canAccessSettings: false,
      canAccessHelp: false,
      isVendor: true,
      isAdmin: false,
      isUser: false,
    };
  }

  // Usuários normais e admins têm acesso completo
  return {
    canAccessVendas: true,
    canAccessVendedores: true,
    canAccessMetas: true,
    canAccessDashboardCEO: true,
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
    isVendor: false,
    isAdmin: isAdmin,
    isUser: isUser,
  };
}
