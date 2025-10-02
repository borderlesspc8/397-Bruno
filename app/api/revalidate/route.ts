import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/app/_lib/auth";
import { redis } from '@/app/_lib/redis';
import { dataCache, promiseCache, metricsCache } from '@/app/_services/cache';

// Configuração para forçar o comportamento dinâmico
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { message: 'Path é obrigatório' },
        { status: 400 }
      );
    }

    // Limpar todos os caches
    await redis.flushall(); // Redis
    dataCache.clear(); // LRU Cache
    promiseCache.clear(); // Promise Cache
    metricsCache.clear(); // Metrics Cache

    // Força revalidação do cache para o caminho especificado
    revalidatePath(path);

    // Força revalidação de todas as rotas do dashboard
    const dashboardRoutes = [
      '/dashboard',
      '/dashboard/vendas',
      '/dashboard/vendedores',
      '/dashboard/atendimentos',
      '/dashboard/consultores',
      '/dashboard/metas',
      '/api/dashboard/vendas',
      '/api/dashboard/vendedores',
      '/api/dashboard/atendimentos',
      '/api/dashboard/consultores',
      '/api/dashboard/metas',
      '/api/user/profile'
    ];

    // Revalida todas as rotas
    dashboardRoutes.forEach(route => {
      revalidatePath(route);
    });

    return NextResponse.json(
      { revalidated: true, message: 'Cache revalidado com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao revalidar cache:', error);
    return NextResponse.json(
      { message: 'Erro ao revalidar cache' },
      { status: 500 }
    );
  }
} 
