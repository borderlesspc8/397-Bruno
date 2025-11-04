import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/app/_lib/supabase-server';
import { hasRole } from '@/app/_services/permissions';
import { SystemRoles } from '@/app/_types/rbac';

/**
 * GET /api/admin/rbac/users/[userId]/roles
 * Lista roles de um usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    const { data: userRoles, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        is_active,
        assigned_at,
        roles:role_id (
          id,
          name,
          display_name,
          description
        )
      `)
      .eq('user_id', params.userId)
      .eq('is_active', true);

    if (error) {
      console.error('Erro ao buscar roles do usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar roles' },
        { status: 500 }
      );
    }

    const roles = (userRoles || [])
      .map((ur: any) => ur.roles)
      .filter(Boolean);

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Erro ao listar roles do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/rbac/users/[userId]/roles
 * Adiciona roles a um usuário
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
    const { role_ids } = body;

    if (!Array.isArray(role_ids) || role_ids.length === 0) {
      return NextResponse.json(
        { error: 'role_ids deve ser um array não vazio' },
        { status: 400 }
      );
    }

    // Inserir roles (ignorar conflitos se já existirem)
    const userRoles = role_ids.map((role_id: string) => ({
      user_id: params.userId,
      role_id,
      assigned_by: user.id,
      is_active: true,
    }));

    const { data, error } = await supabase
      .from('user_roles')
      .upsert(userRoles, {
        onConflict: 'user_id,role_id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Erro ao adicionar roles:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao adicionar roles' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      added: data?.length || 0 
    });
  } catch (error) {
    console.error('Erro ao adicionar roles:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/rbac/users/[userId]/roles
 * Remove roles de um usuário
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
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
    const role_ids = searchParams.get('role_ids');

    if (!role_ids) {
      return NextResponse.json(
        { error: 'role_ids é obrigatório' },
        { status: 400 }
      );
    }

    const idsArray = role_ids.split(',').filter(Boolean);

    if (idsArray.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma role especificada' },
        { status: 400 }
      );
    }

    // Soft delete - apenas desativa
    const { error } = await supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', params.userId)
      .in('role_id', idsArray);

    if (error) {
      console.error('Erro ao remover roles:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao remover roles' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao remover roles:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

