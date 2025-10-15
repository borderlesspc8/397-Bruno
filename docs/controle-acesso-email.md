# Sistema de Controle de Acesso Baseado em Email

## Visão Geral

Este sistema implementa um controle de acesso simples e eficaz baseado no email do usuário. A regra é clara:

- **Email `lojapersonalprime@gmail.com`** = Administrador com acesso total
- **Qualquer outro email** = Vendedor com acesso restrito apenas ao Dashboard Vendedores

## Arquitetura

### 1. Contexto de Autenticação (`AuthContext`)

**Arquivo:** `app/_contexts/AuthContext.tsx`

**Funcionalidades:**
- Detecta automaticamente se o usuário é admin ou vendedor baseado no email
- Implementa redirecionamento automático baseado no tipo de usuário
- Fornece função `hasAccessTo()` para verificar permissões de rota
- Expõe propriedades `isAdmin`, `isVendor` e `isAuthenticated`

**Uso:**
```tsx
import { useAuthContext } from '@/app/_contexts/AuthContext';

function MyComponent() {
  const { isAdmin, isVendor, hasAccessTo } = useAuthContext();
  
  if (isAdmin) {
    // Lógica para administrador
  }
  
  if (hasAccessTo('/dashboard/vendas')) {
    // Usuário pode acessar vendas
  }
}
```

### 2. Hook de Permissões (`useUserPermissions`)

**Arquivo:** `app/_hooks/useUserPermissions.ts`

**Funcionalidades:**
- Retorna objeto com todas as permissões do usuário
- Baseado no email do usuário autenticado
- Usado por componentes de navegação e menu

**Uso:**
```tsx
import { useUserPermissions } from '@/app/_hooks/useUserPermissions';

function NavigationMenu() {
  const permissions = useUserPermissions();
  
  return (
    <div>
      {permissions.canAccessVendas && <Link href="/dashboard/vendas">Vendas</Link>}
      {permissions.canAccessVendedores && <Link href="/dashboard/vendedores">Vendedores</Link>}
    </div>
  );
}
```

### 3. Middleware de Proteção

**Arquivo:** `middleware.ts`

**Funcionalidades:**
- Intercepta requisições antes de chegarem às páginas
- Redireciona vendedores para `/dashboard/vendedores` se tentarem acessar outras rotas
- Permite acesso total para administradores
- Logs detalhados para debugging

### 4. Verificação de Permissões no Backend

**Arquivo:** `app/_lib/auth-permissions.ts`

**Funcionalidades:**
- Utilitários para verificar permissões em rotas de API
- Middleware específico para cada tipo de acesso
- Integração com Supabase para autenticação

**Uso em APIs:**
```typescript
import { requireVendasAccess } from '@/app/_lib/auth-permissions';

export async function GET(request: NextRequest) {
  const { success, error } = await requireVendasAccess(request);
  if (!success) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 });
  }
  
  // Lógica da API...
}
```

### 5. Componente de Proteção de Rota

**Arquivo:** `app/_components/RouteProtection.tsx`

**Funcionalidades:**
- Wrapper para proteger páginas inteiras
- Redirecionamento automático baseado em permissões
- Interface amigável para acesso negado

**Uso:**
```tsx
import RouteProtection from '@/app/_components/RouteProtection';

export default function VendasPage() {
  return (
    <RouteProtection requiredPermission="vendas">
      <div>Conteúdo da página de vendas</div>
    </RouteProtection>
  );
}
```

## Rotas e Permissões

### Administrador (`lojapersonalprime@gmail.com`)
- ✅ Dashboard de Vendas (`/dashboard/vendas`)
- ✅ Dashboard de Vendedores (`/dashboard/vendedores`)
- ✅ Dashboard de Metas (`/dashboard/metas`)
- ✅ Dashboard CEO (`/dashboard-ceo`)
- ✅ Todas as outras rotas administrativas

### Vendedores (qualquer outro email)
- ❌ Dashboard de Vendas (`/dashboard/vendas`)
- ✅ Dashboard de Vendedores (`/dashboard/vendedores`)
- ❌ Dashboard de Metas (`/dashboard/metas`)
- ❌ Dashboard CEO (`/dashboard-ceo`)
- ❌ Outras rotas administrativas

## Implementação em Componentes

### 1. Menu de Navegação

O componente `navbar.tsx` já foi atualizado para usar o sistema de permissões:

```tsx
const permissions = useUserPermissions();

// Só mostra link se usuário tem permissão
{permissions.canAccessVendas && (
  <Link href="/dashboard/vendas">Vendas</Link>
)}
```

### 2. Sidebar

O componente `sidebar` usa a função `getMenuSections()` que já implementa as verificações de permissão.

### 3. APIs Protegidas

As seguintes rotas de API foram protegidas:
- `/api/dashboard/vendas` - Requer permissão de vendas
- `/api/dashboard/vendedores` - Requer permissão de vendedores
- `/api/dashboard/vendedores-meta` - Requer permissão de metas

## Redirecionamentos Automáticos

### Login
- **Admin:** Redirecionado para `/dashboard/vendas`
- **Vendedor:** Redirecionado para `/dashboard/vendedores`

### Acesso Negado
- **Vendedor tentando acessar rota restrita:** Redirecionado para `/dashboard/vendedores`
- **Usuário não autenticado:** Redirecionado para `/auth`

## Logs e Debugging

O sistema inclui logs detalhados para facilitar o debugging:

```
[AuthProvider] ✅ Admin redirecionando para /dashboard/vendas
[AuthProvider] ✅ Vendedor redirecionando para /dashboard/vendedores
[Middleware] Vendedor user@example.com tentando acessar /dashboard/vendas, redirecionando para /dashboard/vendedores
```

## Segurança

### Frontend
- Verificações de permissão em componentes
- Redirecionamento automático
- Interface de acesso negado

### Backend
- Verificação de permissões em todas as APIs sensíveis
- Validação de autenticação via Supabase
- Retorno de erro 403 para acesso negado

### Middleware
- Interceptação de requisições
- Redirecionamento baseado em permissões
- Logs de tentativas de acesso

## Manutenção

### Adicionar Novo Email de Admin
1. Editar `ADMIN_EMAIL` em `app/_lib/auth-permissions.ts`
2. Editar `ADMIN_EMAIL` em `app/_hooks/useUserPermissions.ts`
3. Editar `ADMIN_EMAIL` em `app/_contexts/AuthContext.tsx`

### Adicionar Nova Permissão
1. Adicionar propriedade em `UserPermissions` interface
2. Implementar lógica em `useUserPermissions`
3. Criar middleware específico em `auth-permissions.ts`
4. Aplicar verificação nas APIs necessárias

### Adicionar Nova Rota Protegida
1. Adicionar verificação no middleware
2. Atualizar `hasAccessTo()` no AuthContext
3. Proteger APIs relacionadas
4. Usar `RouteProtection` nas páginas

## Exemplo de Uso Completo

```tsx
// Página de vendas (apenas para admin)
import RouteProtection from '@/app/_components/RouteProtection';

export default function VendasPage() {
  return (
    <RouteProtection requiredPermission="vendas">
      <div>
        <h1>Dashboard de Vendas</h1>
        {/* Conteúdo da página */}
      </div>
    </RouteProtection>
  );
}

// Componente de menu
import { useUserPermissions } from '@/app/_hooks/useUserPermissions';

export function Menu() {
  const permissions = useUserPermissions();
  
  return (
    <nav>
      {permissions.canAccessVendas && (
        <a href="/dashboard/vendas">Vendas</a>
      )}
      {permissions.canAccessVendedores && (
        <a href="/dashboard/vendedores">Vendedores</a>
      )}
    </nav>
  );
}

// API protegida
import { requireVendasAccess } from '@/app/_lib/auth-permissions';

export async function GET(request: NextRequest) {
  const { success, error } = await requireVendasAccess(request);
  if (!success) {
    return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 });
  }
  
  // Lógica da API...
}
```

Este sistema garante que apenas o administrador (`lojapersonalprime@gmail.com`) tenha acesso completo, enquanto todos os outros usuários ficam restritos ao Dashboard de Vendedores.
