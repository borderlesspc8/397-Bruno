import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr';

// Função auxiliar para garantir uso do domínio correto em redirecionamentos
function getSafeRedirectUrl(requestUrl: string, path: string): URL {
  try {
    // Obtém o domínio correto da variável de ambiente ou do request
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    
    // Se temos uma base URL configurada, usamos ela
    if (baseUrl) {
      return new URL(path, baseUrl);
    }
    
    // Caso contrário, usamos a URL da requisição
    return new URL(path, requestUrl);
  } catch (error) {
    // Fallback seguro
    console.error("[MIDDLEWARE_ERROR] Erro ao criar URL segura:", error);
    return new URL(path, requestUrl);
  }
}

// Configuração de origens permitidas
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000', 
  'https://dashboard.lojapersonalprime.com',
  'http://dashboard.lojapersonalprime.com',
];

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const isSocketRoute = request.nextUrl.pathname.startsWith('/api/socket');

  // Se for rota de socket ou a origem está na lista de permitidos
  if (isSocketRoute || allowedOrigins.includes(origin)) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Permitir qualquer origem em produção para facilitar debugging
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Para requisições OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return NextResponse.json({}, { headers: corsHeaders });
    }

    // Para rotas de socket, adicionar log para debugging
    if (isSocketRoute) {
      console.log(`[Socket] Requisição recebida: ${request.method} ${request.nextUrl.pathname}`);
      console.log(`[Socket] Origem: ${origin}`);
    }

    // Adicionar cabeçalhos CORS à resposta para outras requisições
    const response = NextResponse.next();
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // Verifique se a rota requer autenticação antes de obter o token
  const pathname = request.nextUrl.pathname;
  
        // Redirecionar a rota raiz para o dashboard Supabase
        if (pathname === "/") {
          return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
        }

        // Redirecionar a rota /dashboard para /dashboard/vendas
        if (pathname === "/dashboard" || pathname === "/dashboard/") {
          return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
        }
  
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname.startsWith("/auth");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isMarketingDashboardRoute = pathname === "/dashboards";
  const isLoginRoute = pathname === "/auth";
  const isResetPasswordRoute = pathname.startsWith("/auth/reset-password");
  
  // Rotas específicas para o magic link e autenticação via email
  const isVerifyRoute = pathname.startsWith("/auth/verify");
  const isVerifyRequestRoute = pathname.startsWith("/auth/verify-request");
  const isTestLoginRoute = pathname === "/auth/test-login";
  const isApiAuthRoute = pathname.startsWith("/api/auth");
  
  // Evitar autenticação para rotas específicas de verificação por email e test-login
  if (isVerifyRoute || isVerifyRequestRoute || isTestLoginRoute) {
    return NextResponse.next();
  }
  

  // Interceptar requisições para a imagem de avatar padrão não encontrada
  if (pathname === '/images/default-avatar.png') {
    // Redirecionar para o avatar SVG que criamos
    return NextResponse.redirect(getSafeRedirectUrl(request.url, '/images/default-avatar.svg'));
  }

  // Verificar autenticação Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // O AuthProvider global já cuida do redirecionamento de usuários logados
  // Removido redirecionamento do middleware para evitar conflitos

  // O AuthProvider global já cuida da proteção de rotas
  // Removido redirecionamento do middleware para evitar conflitos
  // if (!user && (isDashboardRoute || isAdminRoute)) {
  //   return NextResponse.redirect(getSafeRedirectUrl(request.url, "/auth"));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Regras específicas primeiro
    '/api/user/:path*',
    '/api/socket/:path*',
    '/api/webhooks/:path*',
    // Regra geral por último - removidas APIs problemáticas
    "/((?!api/auth/callback|api/auth|api/dashboard|api/gestao-click|_next/static|_next/image|assets|public|favicon.ico).*)",
  ],
};
