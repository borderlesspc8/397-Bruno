import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { SubscriptionPlan } from "./app/types";

export async function middleware(request: NextRequest) {
  // Verifique se a rota requer autenticação antes de obter o token
  const pathname = request.nextUrl.pathname;
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
      const redirectUrl = new URL("/auth", request.url);
      // Adicionar URL de retorno para redirecionamento após login
      redirectUrl.searchParams.set("callbackUrl", encodeURI(request.url));
      return NextResponse.redirect(redirectUrl);
    }

    const role = token?.role;
    if (role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  // Proteger rotas de dashboard
  if (isDashboardRoute && !isAuthenticated) {
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("callbackUrl", encodeURI(request.url));
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
      return NextResponse.redirect(new URL("/dashboard/vendas", request.url));
    }
  }

  // Redirecionar usuários logados para fora de /auth (exceto reset-password e rotas de verificação)
  if (isAuthRoute && isAuthenticated && !isResetPasswordRoute && !isVerifyRoute && !isVerifyRequestRoute) {
    return NextResponse.redirect(new URL("/dashboard/vendas", request.url));
  }

  // Interceptar requisições para a imagem de avatar padrão não encontrada
  if (pathname === '/images/default-avatar.png') {
    // Redirecionar para o avatar SVG que criamos
    return NextResponse.redirect(new URL('/images/default-avatar.svg', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Modificado para permitir explicitamente as rotas de verificação e callback
    "/((?!api/auth/callback|api/auth|api/user|api/dashboard|_next/static|_next/image|assets|public|favicon.ico).*)",
  ],
};
