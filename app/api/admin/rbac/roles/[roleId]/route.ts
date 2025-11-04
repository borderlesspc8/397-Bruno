import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/app/_lib/supabase-server';
import { hasRole } from '@/app/_services/permissions';
import { SystemRoles } from '@/app/_types/rbac';

/**
 * GET /api/admin/rbac/roles/[roleId]
 * Obtém detalhes de uma role específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário é admin
    const isAdmin = await hasRole(user.id, SystemRoles.ADMIN);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { data: role, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', params.roleId)
      .single();

    if (error || !role) {
      return NextResponse.json(
        { error: 'Role não encontrada' },
        { status: 404 }
      );
    }

    // Buscar permissões da role
    const { data: rolePermissions } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions:permission_id (
          id,
          name,
          resource,
          action,
          description
        )
      `)
      .eq('role_id', params.roleId);

    return NextResponse.json({
      role,
      permissions: rolePermissions?.map((rp: any) => rp.permissions).filter(Boolean) || []
    });
  } catch (error) {
    console.error('Erro ao buscar role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/rbac/roles/[roleId]
 * Atualiza uma role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário é admin
    const isAdmin = await hasRole(user.id, SystemRoles.ADMIN);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { display_name, description, is_active } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) updateData.display_name = display_name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: role, error } = await supabase
      .from('roles')
      .update(updateData)
      .eq('id', params.roleId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar role:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao atualizar role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/rbac/roles/[roleId]
 * Deleta uma role (soft delete - desativa)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário é admin
    const isAdmin = await hasRole(user.id, SystemRoles.ADMIN);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Não permitir deletar roles do sistema
    const { data: role } = await supabase
      .from('roles')
      .select('name')
      .eq('id', params.roleId)
      .single();

    if (role && ['admin', 'vendedor', 'gerente'].includes(role.name)) {
      return NextResponse.json(
        { error: 'Não é possível deletar roles do sistema' },
        { status: 400 }
      );
    }

    // Soft delete - apenas desativa
    const { error } = await supabase
      .from('roles')
      .update({ is_active: false })
      .eq('id', params.roleId);

    if (error) {
      console.error('Erro ao deletar role:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao deletar role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

