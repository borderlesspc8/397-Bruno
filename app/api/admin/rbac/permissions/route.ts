import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/app/_lib/supabase-server';
import { hasRole } from '@/app/_services/permissions';
import { SystemRoles } from '@/app/_types/rbac';

/**
 * GET /api/admin/rbac/permissions
 * Lista todas as permissions
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
        { error: 'Acesso negado. Apenas administradores podem visualizar permissions.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');

    let query = supabase
      .from('permissions')
      .select('*')
      .order('resource')
      .order('action');

    if (resource) {
      query = query.eq('resource', resource);
    }

    const { data: permissions, error } = await query;

    if (error) {
      console.error('Erro ao buscar permissions:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar permissions' },
        { status: 500 }
      );
    }

    // Agrupar por resource
    const grouped = (permissions || []).reduce((acc: any, perm: any) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {});

    return NextResponse.json({ 
      permissions,
      grouped 
    });
  } catch (error) {
    console.error('Erro ao listar permissions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

