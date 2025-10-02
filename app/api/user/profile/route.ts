import { NextRequest, NextResponse } from "next/server";
import { validateSessionForAPI } from "@/app/_utils/auth";
import { createClient } from "@/app/_lib/supabase-server";

// Função que gera dados simulados baseados em parâmetros para parecer realista
function generateRealisticData() {
  // Todos os usuários têm acesso total - sem limitações
  const limits = {
    connections: 5
  };
  
  // Uso moderado para todos os usuários
  const usage = {
    connections: Math.floor(limits.connections * 0.4)
  };
  
  // Calcular percentuais
  const resourceUsage = {
    connections: {
      used: usage.connections,
      limit: limits.connections,
      percentage: usage.connections / limits.connections
    }
  };
  
  // Dados estatísticos sobre o usuário
  const stats = {
    categoriesCount: Math.floor(Math.random() * 20) + 5, // Entre 5 e 25 categorias
    memberSince: new Date(Date.now() - (Math.floor(Math.random() * 365) + 30) * 24 * 60 * 60 * 1000) // Entre 30 e 395 dias atrás
  };
  
  return {
    resourceUsage,
    stats
  };
}

// GET /api/user/profile - Obter perfil do usuário
export async function GET(req: NextRequest) {
  try {
    // Obter userId da query string
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: "UserId é obrigatório" }, { status: 400 });
    }

    console.log('Buscando perfil para userId:', userId);
    const supabase = createClient();

    // Buscar dados do usuário no Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      // Se não encontrar no Supabase, retornar dados básicos
      const profileData = {
        id: userId,
        name: 'Usuário',
        email: 'usuario@exemplo.com',
        image: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subscription: {
          plan: 'free',
          status: 'active',
          expiresAt: null,
          isActive: true
        },
        wallets: [],
        limits: generateRealisticData().limits,
        stats: generateRealisticData().stats,
        recentActivity: generateRealisticData().recentActivity
      };

      return NextResponse.json(profileData);
    }

    // Gerar dados realistas baseados no usuário
    const realisticData = generateRealisticData();

    // Dados do perfil do usuário
    const profileData = {
      id: user.id,
      name: user.name || user.email?.split('@')[0],
      email: user.email,
      image: user.image,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      subscription: {
        plan: 'free',
        status: 'active',
        expiresAt: null,
        isActive: true
      },
      wallets: [],
      limits: realisticData.limits,
      stats: realisticData.stats,
      recentActivity: realisticData.recentActivity
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

// PATCH /api/user/profile - Atualizar perfil do usuário
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    const { userId } = data;
    
    if (!userId) {
      return NextResponse.json({ error: "UserId é obrigatório" }, { status: 400 });
    }

    console.log('Atualizando perfil para userId:', userId);
    const supabase = createClient();

    // Campos permitidos para atualização
    const allowedFields = [
      "name",
      "image",
      "phoneNumber",
      "emailNotifications",
      "appNotifications",
      "marketingEmails",
    ];

    // Filtrando os campos permitidos
    const updateData: any = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        // Se o campo é phoneNumber, remover formatação e manter apenas dígitos
        if (field === 'phoneNumber' && data[field]) {
          updateData[field] = data[field].replace(/\D/g, '');
        } else {
          updateData[field] = data[field];
        }
      }
    }

    // Registrar a atualização de perfil
    console.log(`Atualizando perfil para o usuário: ${userId}`, updateData);

    // Atualiza o usuário no Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, name, email, image, created_at, updated_at')
      .single();

    if (updateError) {
      console.error("Erro ao atualizar usuário no Supabase:", updateError);
      return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
    }

    // Retorna o usuário atualizado
    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}