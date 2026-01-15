import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { SystemRoles, SystemPermissions } from '@/app/_types/rbac';
import { getRequiredPermissionForRoute } from '@/app/_lib/route-permissions';

// Check if we're in test mode
const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === 'true';

/**
 * Função auxiliar para verificar role no contexto do middleware
 */
async function checkUserRole(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  roleName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles:role_id (
          name
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return false;
    }
    
    return data.some((ur: any) => ur.roles?.name === roleName);
  } catch (error) {
    console.error('Erro ao verificar role:', error);
    return false;
  }
}

/**
 * Verifica se o usuário tem uma permissão específica no contexto do middleware
 */
async function checkUserPermission(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  permissionName: SystemPermissions
): Promise<boolean> {
  try {
    // Buscar roles do usuário
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        roles:role_id (
          id,
          role_permissions:role_permissions (
            permission_id,
            permissions:permission_id (
              name
            )
          )
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (rolesError || !userRoles) {
      return false;
    }

    // Verificar se alguma role do usuário tem a permissão
    for (const ur of userRoles) {
      if (ur.roles?.role_permissions) {
        const hasPerm = ur.roles.role_permissions.some((rp: any) => 
          rp.permissions?.name === permissionName
        );
        if (hasPerm) return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
}

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
  const pathname = request.nextUrl.pathname;
  
  // Ignorar completamente arquivos estáticos e favicon
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/assets/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.map')
  ) {
    return NextResponse.next();
  }
  
  const origin = request.headers.get('origin') || '';
  const isSocketRoute = pathname.startsWith('/api/socket');
  const isDashboardApiRoute = pathname.startsWith('/api/dashboard');

  // Para rotas da API do dashboard, apenas passar adiante
  // A autenticação será verificada dentro de cada rota usando requireVendedoresAccess, requireAdmin, etc.
  if (isDashboardApiRoute) {
    return NextResponse.next();
  }

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

  // pathname já foi definido acima
  
        // Redirecionar a rota raiz para o dashboard apropriado baseado no usuário
        if (pathname === "/") {
          if (TEST_MODE) {
            return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
          }
          
          try {
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
            
            if (user) {
              // Verificar role no banco de dados
              const isVendor = await checkUserRole(supabase, user.id, SystemRoles.VENDEDOR);
              const isAdmin = await checkUserRole(supabase, user.id, SystemRoles.ADMIN);
            
              if (isVendor && !isAdmin) {
              return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard-vendedores"));
            } else {
              return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
              }
            }
          } catch (error) {
            console.error("Erro no middleware para rota /:", error);
            if (TEST_MODE) {
              return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
            }
          }
        }

        // Redirecionar a rota /dashboard para o dashboard apropriado
        if (pathname === "/dashboard" || pathname === "/dashboard/") {
          if (TEST_MODE) {
            return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
          }
          
          try {
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
            
            if (user) {
              // Verificar role no banco de dados
              const isVendor = await checkUserRole(supabase, user.id, SystemRoles.VENDEDOR);
              const isAdmin = await checkUserRole(supabase, user.id, SystemRoles.ADMIN);
            
              if (isVendor && !isAdmin) {
              return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard-vendedores"));
            } else {
              return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
              }
            }
          } catch (error) {
            console.error("Erro no middleware para rota /dashboard:", error);
            if (TEST_MODE) {
              return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard/vendas"));
            }
          }
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

  // Sistema de controle de acesso baseado em RBAC (banco de dados)
  if (user) {
    try {
      // Verificar roles no banco de dados
      const isAdmin = await checkUserRole(supabase, user.id, SystemRoles.ADMIN);
      const isVendor = await checkUserRole(supabase, user.id, SystemRoles.VENDEDOR);

      // Verificar se a rota requer uma permissão específica
      const requiredPermission = getRequiredPermissionForRoute(pathname);
      
      if (requiredPermission) {
        // Admin tem acesso a todas as rotas, não precisa verificar permissão específica
        if (!isAdmin) {
          // Verificar se o usuário tem a permissão necessária (apenas para não-admins)
          const hasRequiredPermission = await checkUserPermission(supabase, user.id, requiredPermission);
          
          if (!hasRequiredPermission) {
            // Se não tiver permissão, redirecionar baseado no role
            if (isVendor) {
              return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard-vendedores"));
            } else {
              // Usuário sem role ou sem permissão - redirecionar para auth
              return NextResponse.redirect(getSafeRedirectUrl(request.url, "/auth"));
            }
          }
        }
        // Se for admin, permitir acesso sem verificação adicional
      }

      // Se for vendedor (sem ser admin), redirecionar para o dashboard de análise de vendedores
      if (isVendor && !isAdmin) {
        // Se estiver tentando acessar qualquer rota que não seja o dashboard de análise de vendedores
        if (pathname !== '/dashboard-vendedores' && 
            !pathname.startsWith('/dashboard-vendedores/') &&
            !pathname.startsWith('/auth') &&
            !pathname.startsWith('/api')) {
          return NextResponse.redirect(getSafeRedirectUrl(request.url, "/dashboard-vendedores"));
        }
      }

      // Se for admin, permitir acesso a todas as rotas administrativas
      if (isAdmin) {
        // Acesso permitido - continuar
      }
    } catch (error) {
      // Em caso de erro ao buscar roles, bloquear acesso (mais seguro)
      // Não usar fallback baseado em email - forçar uso do sistema RBAC
      console.error('[Middleware] Erro ao verificar roles:', error);
      
      // Se houver erro ao verificar permissões, redirecionar para auth
      // Isso força o usuário a se autenticar novamente e garante que o sistema RBAC funcione
      if (pathname !== '/auth' && 
          !pathname.startsWith('/auth/') &&
          !pathname.startsWith('/api')) {
        return NextResponse.redirect(getSafeRedirectUrl(request.url, "/auth"));
      }
    }
  }

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
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth/callback (autenticação)
     * - api/auth (autenticação)
     * - api/gestao-click (API externa)
     * - _next/static (arquivos estáticos do Next.js)
     * - _next/image (otimização de imagens)
     * - _next/webpack-hmr (hot module replacement)
     * - favicon.ico e outros favicons
     * - Arquivos com extensões estáticas (.ico, .png, .jpg, etc)
     */
    "/((?!api/auth/callback|api/auth|api/gestao-click|_next/static|_next/image|_next/webpack-hmr|favicon\\.ico|favicon-16x16\\.png|favicon-32x32\\.png|apple-touch-icon\\.png|android-chrome-192x192\\.png|android-chrome-512x512\\.png|site\\.webmanifest|.*\\.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp|.*\\.woff|.*\\.woff2|.*\\.ttf|.*\\.eot|.*\\.css|.*\\.js|.*\\.map).*)",
  ],
};
