# Restrições de Acesso por Plano de Assinatura

## Visão Geral

Este documento descreve a implementação de restrições de acesso para usuários no plano gratuito (FREE) da plataforma Conta Rápida. A restrição permite que usuários no plano gratuito tenham acesso apenas à área de Dashboard, enquanto as demais funcionalidades ficam restritas aos planos pagos.

## Arquitetura da Solução

A solução implementada utiliza múltiplas camadas de proteção:

1. **Middleware de Next.js**: Intercepta todas as requisições HTTP e verifica o plano do usuário
2. **Hooks React para Client-side**: Verifica o plano do usuário nas páginas client-side
3. **Verificação de API**: Implementa validações nas rotas de API para restringir acesso
4. **Feedback Visual**: Mostra informações claras ao usuário sobre as limitações do plano gratuito

## Componentes Principais

### 1. Middleware (middleware.ts)

O middleware verifica se o usuário está no plano gratuito e tenta acessar rotas protegidas. Se for o caso, redireciona para o dashboard.

```typescript
// Verificar se o usuário é da versão FREE e tenta acessar qualquer rota protegida que não seja dashboard
if (isAuthenticated && token?.subscriptionPlan === SubscriptionPlan.FREE) {
  // Lista de rotas permitidas para usuários FREE (apenas dashboard)
  const allowedRoutes = [
    "/dashboard", 
    "/dashboard/index",
    "/dashboard/main"
  ];
  
  // Verificar se a rota atual está na lista de permitidas
  const isAllowedRoute = allowedRoutes.some(route => 
    pathname === route || 
    (pathname.startsWith(`${route}/`) && route !== "/dashboard") ||
    pathname === "/dashboard"
  );
  
  // Se não for uma rota permitida, redirecionar para dashboard
  if (!isAllowedRoute && !isAuthRoute && !pathname.startsWith("/api/") && pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
```

### 2. Hook de Verificação de Assinatura (use-subscription-check.ts)

Hook personalizado para verificar o plano do usuário em componentes React:

```typescript
export function useSubscriptionCheck({
  redirectTo = '/dashboard',
  allowedPlans = [SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
  onlyCheckDontRedirect = false
}: UseSubscriptionCheckOptions = {}) {
  // ... implementação
}
```

### 3. HOC para Páginas Protegidas (with-subscription-check.tsx)

Higher-order component para proteger páginas inteiras:

```typescript
export function withSubscriptionCheck<P extends object>(
  Component: React.ComponentType<P>,
  {
    allowedPlans = [SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
    redirectTo = '/dashboard',
    onlyShowWarning = false,
    restrictionMessage
  }: WithSubscriptionCheckProps = {}
) {
  // ... implementação
}
```

### 4. Utilitário para APIs (api-subscription-check.ts)

Verifica o plano do usuário em endpoints de API:

```typescript
export async function checkApiSubscriptionAccess(
  request: NextRequest,
  allowedPlans = [SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
  allowDashboardEndpoints = true
) {
  // ... implementação
}
```

### 5. Componentes de Feedback Visual

1. **SubscriptionStatus**: Exibe um banner de status no dashboard para usuários gratuitos
2. **FreePlanRestriction**: Exibe mensagens de restrição quando necessário

## Como Usar

### Proteger uma Página

```tsx
// Método 1 - Usando o HOC
import { withSubscriptionCheck } from '@/app/_hooks/with-subscription-check';

function MinhaFuncionalidade() {
  // ... implementação
}

export default withSubscriptionCheck(MinhaFuncionalidade);

// Método 2 - Usando o hook diretamente
import { useSubscriptionCheck } from '@/app/_hooks/use-subscription-check';

function OutraFuncionalidade() {
  const { isLoading, hasAccess } = useSubscriptionCheck();
  
  if (isLoading) return <Loader />;
  if (!hasAccess) return null; // O hook já redirecionou
  
  return <div>Conteúdo protegido</div>;
}
```

### Proteger uma API

```typescript
import { checkApiSubscriptionAccess } from '@/app/_utils/api-subscription-check';

export async function GET(request: NextRequest) {
  // Verificar acesso por assinatura
  const subscriptionCheck = await checkApiSubscriptionAccess(request);
  if (subscriptionCheck) return subscriptionCheck;
  
  // Resto da implementação
}
```

## Planos e Recursos

| Recurso               | FREE | BASIC | PREMIUM | ENTERPRISE |
|-----------------------|------|-------|---------|------------|
| Dashboard             | ✓    | ✓     | ✓       | ✓          |
| Carteiras             | ✗    | ✓     | ✓       | ✓          |
| Transações            | ✗    | ✓     | ✓       | ✓          |
| Relatórios            | ✗    | ✓     | ✓       | ✓          |
| Orçamentos            | ✗    | ✗     | ✓       | ✓          |
| Metas                 | ✗    | ✗     | ✓       | ✓          |
| Análise AI            | ✗    | ✗     | ✓       | ✓          |
| Usuários múltiplos    | ✗    | ✗     | ✓       | ✓          |
| Personalização        | ✗    | ✗     | ✗       | ✓          |

## Considerações e Boas Práticas

1. **Sempre verifique assinaturas em múltiplas camadas** (cliente, servidor, API)
2. **Forneça feedback visual claro** ao usuário sobre as limitações
3. **Considere usar o middleware como principal mecanismo de proteção** por ser executado antes de qualquer código da aplicação
4. **Mantenha a lista de rotas permitidas atualizada** conforme a aplicação evolui 