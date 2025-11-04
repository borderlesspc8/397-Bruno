"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUserPermissions } from '@/app/_hooks/useUserPermissions';
import { AdminRouteProtection } from '@/app/_components/AdminRouteProtection';
import { SystemPermissions } from '@/app/_types/rbac';
import { DashboardHeader } from '@/app/(auth-routes)/dashboard/_components/DashboardHeader';
import { Shield, Users, Key, Settings, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { Button } from '@/app/_components/ui/button';
import { Input } from '@/app/_components/ui/input';
import { Label } from '@/app/_components/ui/label';
import { Textarea } from '@/app/_components/ui/textarea';
import { Switch } from '@/app/_components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/_components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/_components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/_components/ui/tabs';
import { Badge } from '@/app/_components/ui/badge';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  is_active: boolean;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

interface UserRole {
  user_id: string;
  role_id: string;
  roles: Role;
}

export default function RBACManagementPage() {
  const permissions = useUserPermissions();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [updatingUserRoles, setUpdatingUserRoles] = useState<string | null>(null);
  
  // Estados para modais
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [userRoleDialogOpen, setUserRoleDialogOpen] = useState(false);
  
  // Estados para formulários
  const [newRole, setNewRole] = useState({ name: '', display_name: '', description: '', is_active: true });
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Ref para evitar múltiplas execuções simultâneas
  const loadingRef = useRef(false);

  // Buscar roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/rbac/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Erro ao buscar roles:', error);
      toast.error('Erro ao buscar roles');
    }
  }, []);

  // Buscar permissions
  const fetchPermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/rbac/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissionsList(data.permissions || []);
      }
    } catch (error) {
      console.error('Erro ao buscar permissions:', error);
      toast.error('Erro ao buscar permissions');
    }
  }, []);

  // Buscar usuários (otimizado para evitar múltiplas requisições)
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        const usersList = data.users || [];
        setUsers(usersList);
        
        // Buscar roles de todos os usuários em paralelo (limitado a 5 por vez para evitar sobrecarga)
        if (usersList.length > 0) {
          const allUserRoles: UserRole[] = [];
          const batchSize = 5;
          
          // Processar em lotes para evitar sobrecarga de requisições
          for (let i = 0; i < usersList.length; i += batchSize) {
            const batch = usersList.slice(i, i + batchSize);
            const batchPromises = batch.map(async (user: any) => {
              try {
                const rolesResponse = await fetch(`/api/admin/rbac/users/${user.id}/roles`);
                if (rolesResponse.ok) {
                  const rolesData = await rolesResponse.json();
                  return (rolesData.roles || []).map((role: Role) => ({
                    user_id: user.id,
                    role_id: role.id,
                    roles: role,
                  }));
                }
                return [];
              } catch (error) {
                console.error(`Erro ao buscar roles do usuário ${user.id}:`, error);
                return [];
              }
            });
            
            const batchResults = await Promise.all(batchPromises);
            allUserRoles.push(...batchResults.flat());
          }
          
          setUserRoles(allUserRoles);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao buscar usuários');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao buscar usuários');
    }
  }, []);

  // Buscar permissões de uma role
  const fetchRolePermissions = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/rbac/roles/${roleId}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setRolePermissions(data.permissions || []);
      }
    } catch (error) {
      console.error('Erro ao buscar permissões da role:', error);
    }
  };

  // Buscar roles de um usuário
  const fetchUserRoles = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/rbac/users/${userId}/roles`);
      if (response.ok) {
        const data = await response.json();
        const updatedUserRoles = (data.roles || []).map((role: Role) => ({
          user_id: userId,
          role_id: role.id,
          roles: role,
        }));
        
        // Atualizar estado global removendo roles antigas do usuário e adicionando novas
        setUserRoles((prev) => [
          ...prev.filter((ur) => ur.user_id !== userId),
          ...updatedUserRoles,
        ]);
      }
    } catch (error) {
      console.error('Erro ao buscar roles do usuário:', error);
    }
  };

  useEffect(() => {
    // Evitar múltiplas execuções simultâneas
    if (loadingRef.current) {
      return;
    }

    const loadData = async () => {
      loadingRef.current = true;
      setLoading(true);
      try {
        await Promise.all([fetchRoles(), fetchPermissions(), fetchUsers()]);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };
    
    loadData();
  }, [fetchRoles, fetchPermissions, fetchUsers]);

  // Criar role
  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/admin/rbac/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      });

      if (response.ok) {
        toast.success('Role criada com sucesso!');
        setNewRole({ name: '', display_name: '', description: '', is_active: true });
        setRoleDialogOpen(false);
        fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar role');
      }
    } catch (error) {
      toast.error('Erro ao criar role');
    }
  };

  // Atualizar role
  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch(`/api/admin/rbac/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editingRole.display_name,
          description: editingRole.description,
          is_active: editingRole.is_active,
        }),
      });

      if (response.ok) {
        toast.success('Role atualizada com sucesso!');
        setEditingRole(null);
        fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar role');
      }
    } catch (error) {
      toast.error('Erro ao atualizar role');
    }
  };

  // Deletar role
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja desativar esta role?')) return;

    try {
      const response = await fetch(`/api/admin/rbac/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Role desativada com sucesso!');
        fetchRoles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao desativar role');
      }
    } catch (error) {
      toast.error('Erro ao desativar role');
    }
  };

  // Adicionar permissões a role
  const handleAddPermissionsToRole = async (roleId: string, permissionIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/rbac/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission_ids: permissionIds }),
      });

      if (response.ok) {
        toast.success('Permissões adicionadas com sucesso!');
        fetchRolePermissions(roleId);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar permissões');
      }
    } catch (error) {
      toast.error('Erro ao adicionar permissões');
    }
  };

  // Remover permissões de role
  const handleRemovePermissionsFromRole = async (roleId: string, permissionIds: string[]) => {
    try {
      const response = await fetch(`/api/admin/rbac/roles/${roleId}/permissions?permission_ids=${permissionIds.join(',')}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Permissões removidas com sucesso!');
        fetchRolePermissions(roleId);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao remover permissões');
      }
    } catch (error) {
      toast.error('Erro ao remover permissões');
    }
  };

  // Adicionar roles a usuário
  const handleAddRolesToUser = async (userId: string, roleIds: string[]) => {
    if (updatingUserRoles === userId) return; // Evitar múltiplas requisições
    
    setUpdatingUserRoles(userId);
    try {
      const response = await fetch(`/api/admin/rbac/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_ids: roleIds }),
      });

      if (response.ok) {
        toast.success('Roles adicionadas com sucesso!');
        
        // Buscar roles atualizadas do servidor
        const rolesResponse = await fetch(`/api/admin/rbac/users/${userId}/roles`);
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          const updatedUserRoles = (rolesData.roles || []).map((role: Role) => ({
            user_id: userId,
            role_id: role.id,
            roles: role,
          }));
          
          // Atualizar estado global removendo roles antigas do usuário e adicionando novas
          setUserRoles((prev) => [
            ...prev.filter((ur) => ur.user_id !== userId),
            ...updatedUserRoles,
          ]);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar roles');
      }
    } catch (error) {
      console.error('Erro ao adicionar roles:', error);
      toast.error('Erro ao adicionar roles');
    } finally {
      setUpdatingUserRoles(null);
    }
  };

  // Remover roles de usuário
  const handleRemoveRolesFromUser = async (userId: string, roleIds: string[]) => {
    if (updatingUserRoles === userId) return; // Evitar múltiplas requisições
    
    setUpdatingUserRoles(userId);
    try {
      const response = await fetch(`/api/admin/rbac/users/${userId}/roles?role_ids=${roleIds.join(',')}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Roles removidas com sucesso!');
        
        // Buscar roles atualizadas do servidor
        const rolesResponse = await fetch(`/api/admin/rbac/users/${userId}/roles`);
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json();
          const updatedUserRoles = (rolesData.roles || []).map((role: Role) => ({
            user_id: userId,
            role_id: role.id,
            roles: role,
          }));
          
          // Atualizar estado global removendo roles antigas do usuário e adicionando novas
          setUserRoles((prev) => [
            ...prev.filter((ur) => ur.user_id !== userId),
            ...updatedUserRoles,
          ]);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao remover roles');
      }
    } catch (error) {
      console.error('Erro ao remover roles:', error);
      toast.error('Erro ao remover roles');
    } finally {
      setUpdatingUserRoles(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminRouteProtection requiredPermission={SystemPermissions.ROLES_VIEW}>
      <div className="min-h-screen bg-background">
        <DashboardHeader title="Gerenciamento de Permissões" />
        
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="roles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roles">Papéis</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
            </TabsList>

            {/* Tab Roles */}
            <TabsContent value="roles" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Gerenciar Papéis</h2>
                  <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Role
                      </Button>
                    </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Role</DialogTitle>
                      <DialogDescription>
                        Crie uma nova role para o sistema de permissões
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="role-name">Nome (slug)</Label>
                        <Input
                          id="role-name"
                          value={newRole.name}
                          onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                          placeholder="supervisor"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role-display">Nome de Exibição</Label>
                        <Input
                          id="role-display"
                          value={newRole.display_name}
                          onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                          placeholder="Supervisor"
                        />
                      </div>
                      <div>
                        <Label htmlFor="role-description">Descrição</Label>
                        <Textarea
                          id="role-description"
                          value={newRole.description}
                          onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                          placeholder="Descrição da role..."
                        />
                      </div>
                      <Button onClick={handleCreateRole} className="w-full">
                        Criar Role
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="bg-muted/50 border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Como vincular permissões aos papéis</p>
                    <p className="text-sm text-muted-foreground">
                      Clique no ícone <strong>Editar</strong> (✏️) de qualquer papel na tabela abaixo para abrir o modal de edição. 
                      Nele, você encontrará uma seção <strong>"Permissões da Role"</strong> onde pode ativar ou desativar permissões usando os switches. 
                      As permissões ativadas serão vinculadas ao papel automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Nome de Exibição</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => {
                    // Contar permissões do papel (usando userRoles como proxy temporário, mas vamos buscar de forma mais eficiente)
                    const rolePermsCount = rolePermissions.length > 0 && editingRole?.id === role.id 
                      ? rolePermissions.length 
                      : null;
                    
                    return (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.display_name}</TableCell>
                        <TableCell>{role.description || '-'}</TableCell>
                        <TableCell>
                          {rolePermsCount !== null ? (
                            <Badge variant="secondary">
                              {rolePermsCount} {rolePermsCount === 1 ? 'permissão' : 'permissões'}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Clique em Editar para ver</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={role.is_active ? 'default' : 'secondary'}>
                            {role.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                setEditingRole(role);
                                await fetchRolePermissions(role.id);
                              }}
                              title="Editar papel e vincular permissões"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRole(role.id)}
                              title="Excluir papel"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Modal de edição de role */}
              {editingRole && (
                <Dialog open={!!editingRole} onOpenChange={() => setEditingRole(null)}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Editar Role: {editingRole.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome de Exibição</Label>
                        <Input
                          value={editingRole.display_name}
                          onChange={(e) => setEditingRole({ ...editingRole, display_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={editingRole.description || ''}
                          onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingRole.is_active}
                          onCheckedChange={(checked) => setEditingRole({ ...editingRole, is_active: checked })}
                        />
                        <Label>Ativo</Label>
                      </div>

                      {/* Gerenciar permissões da role */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold mb-1">Permissões do Papel</h3>
                            <p className="text-xs text-muted-foreground">
                              Ative ou desative as permissões usando os switches abaixo. As alterações são salvas automaticamente.
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {rolePermissions.length} de {permissionsList.length} {rolePermissions.length === 1 ? 'permissão ativa' : 'permissões ativas'}
                          </Badge>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                          {permissionsList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Carregando permissões...
                            </p>
                          ) : (
                            permissionsList.map((perm) => {
                              const hasPermission = rolePermissions.some((rp) => rp.id === perm.id);
                              return (
                                <div key={perm.id} className="flex items-center justify-between p-2 border rounded hover:bg-accent/50 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">{perm.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{perm.description || 'Sem descrição'}</div>
                                    <Badge variant="outline" className="text-xs mt-1">{perm.resource}.{perm.action}</Badge>
                                  </div>
                                  <Switch
                                    checked={hasPermission}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        handleAddPermissionsToRole(editingRole.id, [perm.id]);
                                      } else {
                                        handleRemovePermissionsFromRole(editingRole.id, [perm.id]);
                                      }
                                    }}
                                  />
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={handleUpdateRole} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                        <Button variant="outline" onClick={() => setEditingRole(null)} className="flex-1">
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </TabsContent>

            {/* Tab Permissions */}
            <TabsContent value="permissions" className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Permissões do Sistema</h2>
                </div>
                <div className="bg-muted/50 border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Key className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">Sobre as Permissões</p>
                      <p className="text-sm text-muted-foreground">
                        Esta aba lista todas as permissões disponíveis no sistema. As permissões definem ações específicas que podem ser realizadas (visualizar, criar, editar, excluir, etc.) em diferentes recursos do sistema (vendas, metas, usuários, etc.).
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Como usar:</strong> Para atribuir permissões a um usuário, vá para a aba <strong>"Papéis"</strong>, edite um papel existente e selecione quais permissões ele deve ter. Em seguida, atribua esse papel ao usuário na aba <strong>"Usuários"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {permissionsList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma permissão encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    permissionsList.reduce((acc: any, perm: Permission) => {
                      if (!acc[perm.resource]) acc[perm.resource] = [];
                      acc[perm.resource].push(perm);
                      return acc;
                    }, {})
                  ).map(([resource, perms]: [string, any]) => (
                    <div key={resource} className="border rounded-lg p-4 bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg capitalize">{resource}</h3>
                        <Badge variant="secondary">{perms.length} {perms.length === 1 ? 'permissão' : 'permissões'}</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {perms.map((perm: Permission) => (
                          <div key={perm.id} className="p-3 border rounded-lg bg-background hover:bg-accent/50 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="font-medium text-sm">{perm.name}</div>
                              <Badge variant="outline" className="text-xs shrink-0">{perm.action}</Badge>
                            </div>
                            {perm.description && (
                              <div className="text-xs text-muted-foreground mt-1">{perm.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab Users */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gerenciar Papéis de Usuários</h2>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum usuário encontrado. Aguarde enquanto os dados são carregados...
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || user.email}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {userRoles
                              .filter((ur) => ur.user_id === user.id)
                              .map((ur) => (
                                <Badge key={ur.role_id} variant="secondary">
                                  {ur.roles?.display_name || ur.roles?.name || 'Sem nome'}
                                </Badge>
                              ))}
                            {userRoles.filter((ur) => ur.user_id === user.id).length === 0 && (
                              <span className="text-sm text-muted-foreground">Sem roles atribuídas</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setSelectedUserId(user.id);
                              await fetchUserRoles(user.id);
                              setUserRoleDialogOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Gerenciar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Modal de gerenciamento de roles do usuário */}
              <Dialog open={userRoleDialogOpen} onOpenChange={setUserRoleDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Gerenciar Papéis do Usuário: {users.find(u => u.id === selectedUserId)?.email || selectedUserId}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {roles.map((role) => {
                      if (!selectedUserId) return null;
                      const currentUserRoles = userRoles.filter((ur) => ur.user_id === selectedUserId);
                      const hasRole = currentUserRoles.some((ur) => ur.role_id === role.id);
                      
                      return (
                        <div key={role.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex-1">
                            <div className="font-medium">{role.display_name}</div>
                            <div className="text-sm text-muted-foreground">{role.description || 'Sem descrição'}</div>
                          </div>
                          <Switch
                            checked={hasRole}
                            onCheckedChange={async (checked) => {
                              if (!selectedUserId) return;
                              if (checked) {
                                await handleAddRolesToUser(selectedUserId, [role.id]);
                              } else {
                                await handleRemoveRolesFromUser(selectedUserId, [role.id]);
                              }
                            }}
                            disabled={!selectedUserId || updatingUserRoles === selectedUserId}
                          />
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminRouteProtection>
  );
}

