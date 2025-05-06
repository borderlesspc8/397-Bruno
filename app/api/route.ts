// Configuração para forçar todas as rotas da API a serem dinâmicas
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Este arquivo garante que todas as rotas da API usem renderização dinâmica
// Isso resolve erros como:
// "Dynamic server usage: Route /api/* couldn't be rendered statically because it used `nextUrl.searchParams`"
// "Dynamic server usage: Route /api/* couldn't be rendered statically because it used `request.url`"
// "Dynamic server usage: Route /api/* couldn't be rendered statically because it used `headers`"

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../_lib/auth-options';
import { cacheService } from '../_lib/cache';

/**
 * Endpoint para obter status do sistema e gerenciar cache
 * Apenas administradores têm acesso
 */
export async function GET(req: NextRequest) {
  // Verificar se a requisição é para a raiz ou para a API de status
  const url = new URL(req.url);
  if (url.pathname === '/api') {
    return new Response('API running. Access specific endpoints for functionality.', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
  
  // Se não for a raiz, assumimos que é o endpoint de status
  // Verificar autenticação e permissões
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 403 }
    );
  }
  
  // Obter estatísticas do cache
  const cacheStats = cacheService.getStats();
  
  return NextResponse.json({
    status: 'online',
    version: process.env.npm_package_version || '1.0.0',
    nodeEnv: process.env.NODE_ENV,
    cache: {
      size: cacheStats.size,
      keys: cacheStats.keys,
      itemAges: cacheStats.itemAges.map(item => ({
        key: item.key,
        ageSeconds: Math.round(item.age / 1000),
        ageMinutes: Math.round(item.age / 60000),
      })),
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Endpoint para limpar o cache ou invalidar itens específicos
 */
export async function POST(req: NextRequest) {
  // Verificar autenticação e permissões
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 403 }
    );
  }
  
  try {
    const { action, key, isPrefix } = await req.json();
    
    switch (action) {
      case 'clear':
        // Limpar todo o cache
        cacheService.clear();
        return NextResponse.json({ 
          success: true, 
          message: 'Cache limpo com sucesso' 
        });
        
      case 'invalidate':
        // Invalidar uma chave específica ou prefixo
        if (!key) {
          return NextResponse.json(
            { error: 'É necessário fornecer uma chave para invalidar' },
            { status: 400 }
          );
        }
        
        cacheService.invalidate(key, !!isPrefix);
        return NextResponse.json({ 
          success: true, 
          message: `Chave${isPrefix ? 's' : ''} "${key}" invalidada${isPrefix ? 's' : ''} com sucesso` 
        });
        
      default:
        return NextResponse.json(
          { error: 'Ação inválida. Use "clear" ou "invalidate"' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Erro ao processar requisição de cache:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição' },
      { status: 500 }
    );
  }
} 