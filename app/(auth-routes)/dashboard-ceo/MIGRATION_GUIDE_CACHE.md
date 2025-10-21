# 📘 Guia de Migração - Sistema de Cache Inteligente CEO

## 🎯 Objetivo

Este guia mostra como migrar os componentes existentes da Dashboard CEO para usar o novo sistema de cache inteligente, garantindo melhor performance e dados sempre atualizados.

## 🚀 Passo a Passo

### 1️⃣ Migrar APIs Route Handlers

#### ❌ ANTES (sem cache)

```typescript
// app/api/ceo/main-metrics/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const filters = await request.json();
    
    // Buscar dados da API Betel
    const data = await fetchFromBetelAPI('/metrics', filters);
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
  }
}
```

#### ✅ DEPOIS (com cache)

```typescript
// app/api/ceo/main-metrics/route.ts
import { NextResponse } from 'next/server';
import getCEOSmartCache, { CEOCacheKey } from '@/app/(auth-routes)/dashboard-ceo/services/smart-cache';

export async function POST(request: Request) {
  try {
    const filters = await request.json();
    const cache = getCEOSmartCache();
    
    // Criar chave única baseada nos filtros
    const cacheKey = `${CEOCacheKey.MAIN_METRICS}:${JSON.stringify(filters)}`;
    
    // Usar cache ou buscar da API
    const data = await cache.getOrSet(
      cacheKey,
      async () => {
        // Buscar dados da API Betel apenas se não estiver em cache
        return await fetchFromBetelAPI('/metrics', filters);
      }
    );
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
  }
}
```

**Benefícios:**
- ✅ Reduz chamadas à API Betel
- ✅ Resposta instantânea quando em cache
- ✅ TTL automático de 5 minutos
- ✅ Invalidação inteligente

---

### 2️⃣ Migrar Componentes React

#### ❌ ANTES (sem cache)

```tsx
// components/MainMetricsCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MainMetricsCard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/ceo/main-metrics', {
          method: 'POST',
          body: JSON.stringify({}),
        });
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro!</div>;
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas Principais</CardTitle>
      </CardHeader>
      <CardContent>
        <div>Receita: R$ {data.totalRevenue}</div>
      </CardContent>
    </Card>
  );
}
```

#### ✅ DEPOIS (com cache)

```tsx
// components/MainMetricsCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import useCEOSmartCache, { CEOCacheKey } from '../hooks/useCEOSmartCache';

export function MainMetricsCard() {
  const { data, isLoading, error, refresh, fromCache } = useCEOSmartCache({
    key: CEOCacheKey.MAIN_METRICS,
    fetchFn: async () => {
      const response = await fetch('/api/ceo/main-metrics', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      return await response.json();
    },
    autoRefresh: true,           // Atualização automática
    refreshInterval: 60000,      // A cada 1 minuto
    revalidateOnFocus: true,     // Revalidar ao focar na janela
  });

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Métricas Principais</CardTitle>
        <div className="flex gap-2">
          {fromCache && (
            <Badge variant="secondary">
              ⚡ Do Cache
            </Badge>
          )}
          <Button size="sm" variant="ghost" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div>Receita: R$ {data.totalRevenue}</div>
      </CardContent>
    </Card>
  );
}
```

**Benefícios:**
- ✅ Cache automático
- ✅ Atualização automática a cada 1 minuto
- ✅ Revalidação ao focar na janela
- ✅ Indicador visual de cache
- ✅ Botão de refresh manual
- ✅ Menos código boilerplate

---

### 3️⃣ Adicionar Invalidação em Operações de Escrita

#### ❌ ANTES (sem invalidação)

```typescript
// services/sales-service.ts
export async function saveSale(saleData: any) {
  const response = await fetch('/api/sales', {
    method: 'POST',
    body: JSON.stringify(saleData),
  });
  
  return await response.json();
}
```

#### ✅ DEPOIS (com invalidação)

```typescript
// services/sales-service.ts
import {
  ceoInvalidateSalesCache,
  ceoInvalidateCashFlowCache,
} from '@/app/(auth-routes)/dashboard-ceo/services/smart-cache';

export async function saveSale(saleData: any) {
  const response = await fetch('/api/sales', {
    method: 'POST',
    body: JSON.stringify(saleData),
  });
  
  const result = await response.json();
  
  // Invalidar caches relacionados após sucesso
  if (response.ok) {
    ceoInvalidateSalesCache();    // Invalida métricas de vendas
    ceoInvalidateCashFlowCache(); // Invalida fluxo de caixa
  }
  
  return result;
}
```

**Benefícios:**
- ✅ Dados sempre atualizados após mudanças
- ✅ Invalidação inteligente e granular
- ✅ Atualização automática nos componentes

---

### 4️⃣ Implementar Pré-carregamento

#### Para melhorar a experiência do usuário, pré-carregue dados ao passar o mouse:

```tsx
// components/DashboardNav.tsx
import { useCEOCachePrefetch } from '../hooks/useCEOSmartCache';
import { CEOCacheKey } from '../services/smart-cache';

export function DashboardNav() {
  const { prefetch } = useCEOCachePrefetch();

  const handleMouseEnterDRE = () => {
    // Pré-carregar dados do DRE ao passar mouse no botão
    prefetch(
      CEOCacheKey.DRE_REPORT,
      async () => {
        const res = await fetch('/api/ceo/dre-report');
        return await res.json();
      }
    );
  };

  return (
    <nav>
      <button onMouseEnter={handleMouseEnterDRE}>
        Ver Relatório DRE
      </button>
    </nav>
  );
}
```

**Benefícios:**
- ✅ Dados já carregados quando usuário clicar
- ✅ Navegação instantânea
- ✅ Melhor UX

---

### 5️⃣ Sincronizar Dados Entre Componentes

#### Para componentes que compartilham os mesmos dados:

```tsx
// components/MetricsUpdater.tsx
import { useCEOCacheSync } from '../hooks/useCEOSmartCache';
import { CEOCacheKey } from '../services/smart-cache';

export function MetricsUpdater() {
  const { updateCache } = useCEOCacheSync(CEOCacheKey.MAIN_METRICS);

  const handleUpdate = async () => {
    const newData = await fetchNewMetrics();
    updateCache(newData); // Todos os componentes serão atualizados
  };

  return <button onClick={handleUpdate}>Atualizar Métricas</button>;
}

// components/MetricsDisplay.tsx
export function MetricsDisplay() {
  const { data } = useCEOCacheSync(CEOCacheKey.MAIN_METRICS);

  return <div>{data?.totalRevenue}</div>;
}
```

**Benefícios:**
- ✅ Sincronização automática entre componentes
- ✅ Estado compartilhado eficiente
- ✅ Menos re-renders

---

## 📋 Checklist de Migração

### Para cada componente/API:

- [ ] Identificar tipo de dados (métrica, gráfico, análise, etc.)
- [ ] Escolher chave de cache apropriada (CEOCacheKey)
- [ ] Implementar cache no componente usando `useCEOSmartCache`
- [ ] Configurar TTL apropriado (ou usar padrão)
- [ ] Adicionar indicador de cache (opcional)
- [ ] Adicionar botão de refresh (opcional)
- [ ] Configurar auto-refresh se necessário
- [ ] Implementar invalidação após operações de escrita
- [ ] Testar funcionamento
- [ ] Verificar que outras dashboards não foram afetadas

---

## 🔑 Mapeamento de Chaves de Cache

| Tipo de Dado | Chave de Cache | TTL Padrão |
|--------------|----------------|------------|
| Métricas Principais | `CEOCacheKey.MAIN_METRICS` | 5 min |
| Métricas Financeiras | `CEOCacheKey.FINANCIAL_METRICS` | 5 min |
| Métricas Operacionais | `CEOCacheKey.OPERATIONAL_METRICS` | 5 min |
| Gráfico de Receita | `CEOCacheKey.REVENUE_CHART` | 5 min |
| Gráfico de Despesas | `CEOCacheKey.EXPENSE_CHART` | 5 min |
| Gráfico de Lucro | `CEOCacheKey.PROFIT_CHART` | 5 min |
| Fluxo de Caixa | `CEOCacheKey.CASH_FLOW` | 1 min |
| Análise CAC | `CEOCacheKey.CAC_ANALYSIS` | 15 min |
| Análise Churn | `CEOCacheKey.CHURN_ANALYSIS` | 15 min |
| Análise LTV | `CEOCacheKey.LTV_ANALYSIS` | 15 min |
| Análise Sazonal | `CEOCacheKey.SEASONAL_ANALYSIS` | 30 min |
| Centros de Custo | `CEOCacheKey.COST_CENTERS` | 1 hora |
| Formas de Pagamento | `CEOCacheKey.PAYMENT_METHODS` | 1 hora |
| Categorias | `CEOCacheKey.CATEGORIES` | 1 hora |
| Vendedores | `CEOCacheKey.VENDORS` | 1 hora |
| Relatório DRE | `CEOCacheKey.DRE_REPORT` | 15 min |
| Relatório Liquidez | `CEOCacheKey.LIQUIDITY_REPORT` | 15 min |
| Alertas Inteligentes | `CEOCacheKey.SMART_ALERTS` | 1 min |

---

## 🎯 Prioridades de Migração

### 1. **ALTA PRIORIDADE** (migrar primeiro)
- ✅ APIs mais chamadas (main-metrics, financial-metrics)
- ✅ Componentes na primeira tela
- ✅ Dados que mudam frequentemente

### 2. **MÉDIA PRIORIDADE**
- ✅ Gráficos e análises
- ✅ Relatórios
- ✅ Componentes de drill-down

### 3. **BAIXA PRIORIDADE**
- ✅ Dados auxiliares (já raramente mudam)
- ✅ Componentes raramente acessados

---

## 🧪 Testando a Migração

### 1. **Teste Básico**

```typescript
// Abra o console do navegador
import getCEOSmartCache from '@/app/(auth-routes)/dashboard-ceo/services/smart-cache';

const cache = getCEOSmartCache();
console.log(cache.getStats());
// Deve mostrar estatísticas do cache
```

### 2. **Teste de Invalidação**

```typescript
// Após salvar uma venda, verifique no console:
// [CEOCache] Invalidated X entries matching: ^ceo:(main|financial|chart:revenue|chart:profit)
```

### 3. **Teste de Performance**

```typescript
// 1. Carregue a dashboard - primeira vez (cache miss)
// 2. Recarregue a página - segunda vez (cache hit)
// Compare os tempos de carregamento
```

### 4. **Teste Visual**

Use o componente de monitoramento:

```tsx
import { CEOCacheMonitor } from '../components/CacheMonitor';

// Adicione na dashboard para debug
<CEOCacheMonitor />
```

---

## ⚠️ Atenção

### **NÃO FAZER:**

❌ Modificar arquivos fora de `/dashboard-ceo/`
❌ Usar serviços compartilhados
❌ Alterar tipos globais
❌ Invalidar cache de outras dashboards

### **SEMPRE FAZER:**

✅ Usar apenas chaves `CEOCacheKey`
✅ Invalidar cache após operações de escrita
✅ Testar isolamento (outras dashboards funcionando)
✅ Verificar logs no console
✅ Monitorar estatísticas de cache

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs no console (prefixo `[CEOCache]`)
2. Use `CEOCacheMonitor` para visualizar estado
3. Execute `cache.getStats()` para estatísticas
4. Consulte `CACHE_SYSTEM_README.md` para detalhes
5. Veja exemplos em `cache-usage-examples.ts`

---

## 🎉 Resultado Esperado

Após migração completa:

- ✅ **Performance**: 80%+ de taxa de acertos no cache
- ✅ **UX**: Carregamento instantâneo em cache hits
- ✅ **Dados**: Sempre atualizados via TTL e invalidação
- ✅ **Memória**: < 30MB de uso de cache
- ✅ **Isolamento**: Zero interferência em outras dashboards

---

**Boa migração! 🚀**

