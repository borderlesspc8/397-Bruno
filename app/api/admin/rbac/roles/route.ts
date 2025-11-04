import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/app/_lib/supabase-server';
import { hasRole } from '@/app/_services/permissions';
import { SystemRoles } from '@/app/_types/rbac';

/**
 * GET /api/admin/rbac/roles
 * Lista todas as roles
 */
export async function GET(request: NextRequest) {
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
        { error: 'Acesso negado. Apenas administradores podem gerenciar papéis.' },
        { status: 403 }
      );
    }

    const { data: roles, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar roles:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar roles' },
        { status: 500 }
      );
    }

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Erro ao listar roles:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/rbac/roles
 * Cria uma nova role
 */
export async function POST(request: NextRequest) {
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
        { error: 'Acesso negado. Apenas administradores podem criar roles.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, display_name, description, is_active = true } = body;

    if (!name || !display_name) {
      return NextResponse.json(
        { error: 'Nome e display_name são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: role, error } = await supabase
      .from('roles')
      .insert({
        name,
        display_name,
        description,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar role:', error);
      return NextResponse.json(
        { error: error.message || 'Erro ao criar role' },
        { status: 500 }
      );
    }

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar role:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

