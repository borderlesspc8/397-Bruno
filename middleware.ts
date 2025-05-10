import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { SubscriptionPlan } from "./app/types";

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
  
  // Redirecionar a rota raiz para o dashboard
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
  const isApiAuthRoute = pathname.startsWith("/api/auth");
  
  // Evitar autenticação para rotas específicas de verificação por email
  if (isVerifyRoute || isVerifyRequestRoute) {
    return NextResponse.next();
  }
  
  // Só buscar o token quando necessário (performance)
  let token = null;
  
  try {
    // Verificamos autenticação apenas para rotas que realmente precisam
    if (isAdminRoute || isDashboardRoute || (isAuthRoute && !isResetPasswordRoute && !isVerifyRoute && !isVerifyRequestRoute)) {
      token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET 
      });
    }
  } catch (error) {
    console.error("[MIDDLEWARE_ERROR]", error);
    // Em caso de erro ao verificar token, assumir não autenticado
    token = null;
  }
  
  const isAuthenticated = !!token;
  
  // Proteger rotas admin
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const redirectUrl = getSafeRedirectUrl(request.url, "/auth");
      // Adicionar URL de retorno para redirecionamento após login
      // Certifique-se de usar domínio público para o callback
      const safeCallbackUrl = getSafeRedirectUrl(request.url, pathname).toString();
      redirectUrl.searchParams.set("callbackUrl", encodeURI(safeCallbackUrl));
      return NextResponse.redirect(redirectUrl);
    }

    const role = token?.role;
    if (role !== "SUPERADMIN") {
      return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
    }
  }
  
  // Proteger rotas de dashboard
  if (isDashboardRoute && !isAuthenticated) {
    const redirectUrl = getSafeRedirectUrl(request.url, "/auth");
    const safeCallbackUrl = getSafeRedirectUrl(request.url, pathname).toString();
    redirectUrl.searchParams.set("callbackUrl", encodeURI(safeCallbackUrl));
    return NextResponse.redirect(redirectUrl);
  }

  // Verificar se o usuário é da versão FREE e tentar acessar qualquer rota protegida que não seja dashboard
  if (isAuthenticated && token?.subscriptionPlan === SubscriptionPlan.FREE) {
    // Lista de rotas permitidas para usuários FREE (apenas dashboard)
    const allowedRoutes = [
      "/dashboard", 
      "/dashboard/index",
      "/dashboard/main",
      "/dashboard/vendas"
    ];
    
    // Verificar se a rota atual está na lista de permitidas ou começa com alguma delas
    const isAllowedRoute = allowedRoutes.some(route => 
      pathname === route || 
      (pathname.startsWith(`${route}/`) && route !== "/dashboard") ||
      pathname === "/dashboard"
    );
    
    // Se não for uma rota permitida e não for a rota de auth ou a raiz, redirecionar para dashboard/vendas
    if (!isAllowedRoute && !isAuthRoute && !pathname.startsWith("/api/") && pathname !== "/") {
      console.log(`[MIDDLEWARE] Usuário FREE tentando acessar rota restrita: ${pathname}. Redirecionando para /dashboard/vendas`);
      return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
    }
  }

  // Redirecionar usuários logados para fora de /auth (exceto reset-password e rotas de verificação)
  if (isAuthRoute && isAuthenticated && !isResetPasswordRoute && !isVerifyRoute && !isVerifyRequestRoute) {
    return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
  }

  // Interceptar requisições para a imagem de avatar padrão não encontrada
  if (pathname === '/images/default-avatar.png') {
    // Redirecionar para o avatar SVG que criamos
    return NextResponse.redirect(getSafeRedirectUrl(request.url, '/images/default-avatar.svg'));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Modificado para permitir explicitamente as rotas de verificação e callback
    "/((?!api/auth/callback|api/auth|api/user|api/dashboard|_next/static|_next/image|assets|public|favicon.ico).*)",
    '/api/socket/:path*',
    '/api/gestao-click/:path*',
    '/api/webhooks/:path*',
  ],
};
