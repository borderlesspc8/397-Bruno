/**
 * Serviço de gerenciamento de permissões RBAC
 * Fornece funções para verificar roles e permissões de usuários
 */

import { createClient as createServerClient } from '@/app/_lib/supabase-server';
import { SystemRoles, SystemPermissions } from '@/app/_types/rbac';

// Cache em memória para permissões (TTL de 5 minutos)
interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const permissionsCache = new Map<string, CacheEntry>();
const rolesCache = new Map<string, CacheEntry>();

/**
 * Limpa o cache de permissões de um usuário
 */
function clearUserCache(userId: string): void {
  permissionsCache.delete(`permissions:${userId}`);
  rolesCache.delete(`roles:${userId}`);
}

/**
 * Obtém dados do cache se ainda válidos
 */
function getCachedData<T>(key: string): T | null {
  const entry = permissionsCache.get(key) || rolesCache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    permissionsCache.delete(key);
    rolesCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

/**
 * Salva dados no cache
 */
function setCachedData<T>(key: string, data: T): void {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
  };
  
  if (key.startsWith('permissions:')) {
    permissionsCache.set(key, entry);
  } else if (key.startsWith('roles:')) {
    rolesCache.set(key, entry);
  }
}

/**
 * Obtém todas as roles de um usuário
 */
export async function getUserRoles(userId: string): Promise<string[]> {
  const cacheKey = `roles:${userId}`;
  
  // Verificar cache
  const cached = getCachedData<string[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        is_active,
        roles:role_id (
          id,
          name,
          display_name,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      console.error('[getUserRoles] Erro ao buscar roles do usuário:', error);
      return [];
    }
    
    
    const roleNames = (data || [])
      .map((ur: any) => {
        const roleName = ur.roles?.name;
        return roleName;
      })
      .filter(Boolean) as string[];
    
    // Salvar no cache
    setCachedData(cacheKey, roleNames);
    
    return roleNames;
  } catch (error) {
    console.error('[getUserRoles] Erro ao buscar roles:', error);
    return [];
  }
}

/**
 * Verifica se um usuário tem uma role específica
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(roleName);
}

/**
 * Obtém todas as permissões de um usuário
 * Retorna array de nomes de permissões
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const cacheKey = `permissions:${userId}`;
  
  // Verificar cache
  const cached = getCachedData<string[]>(cacheKey);
  if (cached) {
    return cached;
  }
  
  try {
    const supabase = createServerClient();
    
    // Buscar permissões através das roles do usuário
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles:role_id (
          role_permissions (
            permission_id,
            permissions:permission_id (
              name
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
      return [];
    }
    
    // Extrair nomes de permissões únicas
    const permissionNames = new Set<string>();
    
    (data || []).forEach((ur: any) => {
      const rolePermissions = ur.roles?.role_permissions || [];
      rolePermissions.forEach((rp: any) => {
        const permissionName = rp.permissions?.name;
        if (permissionName) {
          permissionNames.add(permissionName);
        }
      });
    });
    
    const permissionsArray = Array.from(permissionNames);
    
    // Salvar no cache
    setCachedData(cacheKey, permissionsArray);
    
    return permissionsArray;
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    return [];
  }
}

/**
 * Verifica se um usuário tem uma permissão específica
 */
export async function hasPermission(
  userId: string, 
  permission: string | SystemPermissions
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

/**
 * Verifica se um usuário tem qualquer uma das permissões especificadas
 */
export async function hasAnyPermission(
  userId: string,
  permissions: (string | SystemPermissions)[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.some(perm => userPermissions.includes(perm));
}

/**
 * Verifica se um usuário tem todas as permissões especificadas
 */
export async function hasAllPermissions(
  userId: string,
  permissions: (string | SystemPermissions)[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.every(perm => userPermissions.includes(perm));
}

/**
 * Obtém informações completas de roles e permissões de um usuário
 */
export async function getUserRBACInfo(userId: string) {
  const [roles, permissions] = await Promise.all([
    getUserRoles(userId),
    getUserPermissions(userId),
  ]);
  
  // Comparação case-insensitive para garantir que funcione mesmo com variações de case
  const normalizedRoles = roles.map(r => r.toLowerCase().trim());
  const isAdmin = normalizedRoles.includes(SystemRoles.ADMIN.toLowerCase());
  const isVendor = normalizedRoles.includes(SystemRoles.VENDEDOR.toLowerCase());
  const isGerente = normalizedRoles.includes(SystemRoles.GERENTE.toLowerCase());
  const isCoordenador = normalizedRoles.includes(SystemRoles.COORDENADOR.toLowerCase());
  return {
    roles,
    permissions,
    isAdmin,
    isVendor,
    isGerente,
    isCoordenador,
  };
}

/**
 * Limpa o cache de um usuário (útil após atualizações de roles/permissions)
 */
export function invalidateUserCache(userId: string): void {
  clearUserCache(userId);
}

/**
 * Limpa todo o cache de permissões
 */
export function clearAllCache(): void {
  permissionsCache.clear();
  rolesCache.clear();
}

