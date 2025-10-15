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
  
  // Sistema de controle de acesso baseado em email
  const ADMIN_EMAIL = 'lojapersonalprime@gmail.com';
  const isAdmin = user?.email === ADMIN_EMAIL;
  const isVendor = user?.email !== ADMIN_EMAIL && !!user;
  const isUser = !user;

  // Vendedores (todos os emails exceto o admin) só podem acessar o dashboard de vendedores
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

  // Administrador (lojapersonalprime@gmail.com) tem acesso completo
  if (isAdmin) {
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
      isAdmin: true,
      isUser: false,
    };
  }

  // Usuário não autenticado - sem acesso
  return {
    canAccessVendas: false,
    canAccessVendedores: false,
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
    isVendor: false,
    isAdmin: false,
    isUser: true,
  };
}
