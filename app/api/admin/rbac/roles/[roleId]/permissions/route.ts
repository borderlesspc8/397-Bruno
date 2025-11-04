import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/app/_lib/supabase-server';
import { hasRole } from '@/app/_services/permissions';
import { SystemRoles } from '@/app/_types/rbac';

/**
 * GET /api/admin/rbac/roles/[roleId]/permissions
 * Lista permissões de uma role
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

    const isAdmin = await hasRole(user.id, SystemRoles.ADMIN);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { data: rolePermissions, error } = await supabase
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

    if (error) {
      console.error('Erro ao buscar permissões da role:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar permissões' },
        { status: 500 }
      );
    }

    const permissions = (rolePermissions || [])
      .map((rp: any) => rp.permissions)
      .filter(Boolean);

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Erro ao listar permissões da role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/rbac/roles/[roleId]/permissions
 * Adiciona permissões a uma role
 */
export async function POST(
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

    const isAdmin = await hasRole(user.id, SystemRoles.ADMIN);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { permission_ids } = body;

    if (!Array.isArray(permission_ids) || permission_ids.length === 0) {
      return NextResponse.json(
        { error: 'permission_ids deve ser um array não vazio' },
        { status: 400 }
      );
    }

    // Inserir permissões (ignorar conflitos se já existirem)
    const rolePermissions = permission_ids.map((permission_id: string) => ({
      role_id: params.roleId,
      permission_id,
    }));

    const { data, error } = await supabase
      .from('role_permissions')
      .upsert(rolePermissions, {
        onConflict: 'role_id,permission_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Erro ao adicionar permissões:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao adicionar permissões' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      added: data?.length || 0 
    });
  } catch (error) {
    console.error('Erro ao adicionar permissões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/rbac/roles/[roleId]/permissions
 * Remove permissões de uma role
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

    const isAdmin = await hasRole(user.id, SystemRoles.ADMIN);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const permission_ids = searchParams.get('permission_ids');

    if (!permission_ids) {
      return NextResponse.json(
        { error: 'permission_ids é obrigatório' },
        { status: 400 }
      );
    }

    const idsArray = permission_ids.split(',').filter(Boolean);

    if (idsArray.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma permissão especificada' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', params.roleId)
      .in('permission_id', idsArray);

    if (error) {
      console.error('Erro ao remover permissões:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao remover permissões' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover permissões:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

