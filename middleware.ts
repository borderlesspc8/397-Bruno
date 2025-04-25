import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Verifique se a rota requer autenticação antes de obter o token
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname.startsWith("/auth");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isMarketingDashboardRoute = pathname === "/dashboards";
  const isLoginRoute = pathname === "/auth";
  const isResetPasswordRoute = pathname === "/auth/reset-password";
  
  // Só buscar o token quando necessário (performance)
  let token = null;
  
  try {
    // Verificamos autenticação apenas para rotas que realmente precisam
    if (isAdminRoute || isDashboardRoute || (isAuthRoute && !isResetPasswordRoute)) {
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

  // Redirecionar usuários logados para fora de /auth (exceto reset-password que precisa ser acessível)
  if (isAuthRoute && isAuthenticated && !isResetPasswordRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
    "/admin/:path*",
    "/auth",
    "/auth/reset-password",
    "/dashboard/:path*",
    "/images/:path*"
  ],
};
