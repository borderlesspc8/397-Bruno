"use client";

import { useAuth } from './useAuth';
import { useEffect, useState, useRef } from 'react';

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
  canAccessVendasVendedores: boolean; // Permissão para vendedores acessarem dados de vendas no dashboard-vendedores
  isVendor: boolean;
  isAdmin: boolean;
  isCoordenador?: boolean;
  isUser: boolean;
  allPermissions?: string[];
  hasPermission?: (permission: string) => boolean;
}

const defaultPermissions: UserPermissions = {
    canAccessVendas: false,
    canAccessVendedores: false,
    canAccessMetas: false,
    canAccessDashboardCEO: false,
    canAccessRBAC: false,
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
    canAccessVendasVendedores: false,
    isVendor: false,
    isAdmin: false,
    isCoordenador: false,
    isUser: true,
    allPermissions: [],
    hasPermission: () => false,
  };

// Cache compartilhado para evitar múltiplas requisições simultâneas
const permissionsCache = new Map<string, {
  data: UserPermissions;
  timestamp: number;
  promise: Promise<UserPermissions> | null;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Limpa o cache de permissões de um usuário específico (útil após mudanças de roles)
 */
export function clearUserPermissionsCache(userId?: string): void {
  if (userId) {
    permissionsCache.delete(`permissions:${userId}`);
  } else {
    permissionsCache.clear();
  }
}

export function useUserPermissions(): UserPermissions {
  const { user, loading } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const [isLoading, setIsLoading] = useState(true);
  const fetchRef = useRef<boolean>(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user?.id) {
      setPermissions(defaultPermissions);
      setIsLoading(false);
      return;
    }

    const userId = user.id;
    const cacheKey = `permissions:${userId}`;
    const cached = permissionsCache.get(cacheKey);

    // Verificar se há cache válido
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      // IMPORTANTE: Se o cache tem dados vazios (allPermissions = 0), forçar busca novamente
      const hasValidData = cached.data.allPermissions && cached.data.allPermissions.length > 0;
      const hasAdminFlag = cached.data.isAdmin !== undefined;
      
      if (hasValidData || hasAdminFlag) {
        setPermissions(cached.data);
        setIsLoading(false);
        return;
      } else {
        permissionsCache.delete(cacheKey);
      }
    } else if (cached) {
      permissionsCache.delete(cacheKey);
    }

    // Se já há uma requisição em andamento, aguardar ela
    if (cached?.promise) {
      cached.promise.then((data) => {
        setPermissions(data);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
      return;
    }

    // Prevenir múltiplas chamadas simultâneas
    if (fetchRef.current) {
      return;
    }

    fetchRef.current = true;

    // Buscar permissões do banco de dados via API
    const fetchPermissions = async (): Promise<UserPermissions> => {
      try {
        const response = await fetch('/api/user/permissions', {
          cache: 'no-store', // Forçar sempre buscar do servidor
        });
        
        if (response.ok) {
          const data = await response.json();
          
          
          // Adicionar função helper para verificar permissões dinamicamente
          const permissionsWithHelper: UserPermissions = {
            ...data,
            hasPermission: (permission: string) => {
              const has = data.allPermissions?.includes(permission) || false;
              
              return has;
            },
          };
          
          // Atualizar cache
          permissionsCache.set(cacheKey, {
            data: permissionsWithHelper,
            timestamp: Date.now(),
            promise: null,
          });

          return permissionsWithHelper;
        } else {
          // Se a API retornar erro, manter permissões padrão (todas negadas)
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          console.error(`[useUserPermissions] Erro na resposta da API de permissões para usuário ${userId}:`, {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });
          const errorPermissions = {
            ...defaultPermissions,
            allPermissions: [],
            hasPermission: () => false,
          };
          
          permissionsCache.set(cacheKey, {
            data: errorPermissions,
            timestamp: Date.now(),
            promise: null,
          });

          return errorPermissions;
        }
      } catch (error) {
        console.error(`[useUserPermissions] Erro ao buscar permissões para usuário ${userId}:`, error);
        const errorPermissions = {
          ...defaultPermissions,
          allPermissions: [],
          hasPermission: () => false,
        };
        
        permissionsCache.set(cacheKey, {
          data: errorPermissions,
          timestamp: Date.now(),
          promise: null,
        });

        return errorPermissions;
      }
    };

    // Criar promise compartilhada
    const fetchPromise = fetchPermissions();
    permissionsCache.set(cacheKey, {
      data: cached?.data || defaultPermissions,
      timestamp: cached?.timestamp || 0,
      promise: fetchPromise,
    });

    fetchPromise.then((data) => {
      setPermissions(data);
      setIsLoading(false);
      fetchRef.current = false;
    }).catch(() => {
      setIsLoading(false);
      fetchRef.current = false;
    });
  }, [user?.id, loading]); // Usar apenas user.id para evitar re-execuções desnecessárias

  if (isLoading || loading) {
    const hasValidPermissions = permissions && permissions.allPermissions && permissions.allPermissions.length > 0;
    if (hasValidPermissions) {
      return permissions;
    }
    return defaultPermissions;
  }

  return permissions;
}
