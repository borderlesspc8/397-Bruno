import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/_lib/supabase-server";
import { hasRole } from '@/app/_services/permissions';
import { SystemRoles } from '@/app/_types/rbac';

export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado usando Supabase Auth
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se o usuário é admin
    const isAdmin = await hasRole(user.id, SystemRoles.ADMIN);
    if (!isAdmin) {
      return NextResponse.json({ 
        error: "Acesso restrito apenas a administradores" 
      }, { status: 403 });
    }

    // Buscar usuários da tabela users primeiro
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, created_at, updated_at, role')
      .order('created_at', { ascending: false });

    let allUsers: any[] = [];

    // Se houver usuários na tabela users, usar eles
    if (!usersError && usersData && usersData.length > 0) {
      allUsers = usersData.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name || u.email?.split('@')[0],
        createdAt: u.created_at,
        updatedAt: u.updated_at,
        role: u.role || 'user',
      }));
    }

    // Também buscar de auth.users usando a função SQL
    try {
      const { data: authUsers, error: authError } = await supabase.rpc('get_auth_users');

      if (!authError && authUsers) {
        // Adicionar usuários que não estão na tabela users
        const existingIds = new Set(allUsers.map(u => u.id));
        const newUsers = authUsers
          .filter((au: any) => !existingIds.has(au.id))
          .map((au: any) => ({
            id: au.id,
            email: au.email,
            name: au.name || au.email?.split('@')[0],
            createdAt: au.created_at,
            updatedAt: au.created_at,
            role: 'user',
          }));
        allUsers = [...allUsers, ...newUsers];
      }
    } catch (rpcError) {
      console.error('Erro ao buscar via RPC:', rpcError);
    }

    // Se ainda não tiver usuários, retornar pelo menos o usuário atual
    if (allUsers.length === 0) {
      allUsers = [{
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
      createdAt: user.created_at,
        updatedAt: user.updated_at,
        role: 'user',
      }];
    }

    return NextResponse.json({ users: allUsers });

  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ 
      error: "Erro interno do servidor" 
    }, { status: 500 });
  }
} 
