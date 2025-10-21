# 🚀 Sistema de Cache Inteligente CEO

## 📋 Visão Geral

O Sistema de Cache Inteligente CEO é uma solução completa e isolada para otimizar a performance da Dashboard CEO, garantindo que os dados estejam sempre atualizados enquanto reduz drasticamente o tempo de carregamento e o número de requisições à API.

## ✨ Características Principais

### 1. **TTL Dinâmico**
- Cada tipo de dado tem um TTL (Time To Live) otimizado baseado na frequência de mudança
- Dados que mudam constantemente (ex: cash flow) têm TTL de 1 minuto
- Dados auxiliares (ex: categorias) têm TTL de 1 hora
- TTL customizável por requisição

### 2. **Cache por Componentes**
- Cada card/componente tem sua própria chave de cache
- Invalidação granular - atualizar apenas o necessário
- Zero interferência entre componentes

### 3. **Invalidação Inteligente**
- Invalidação por chave específica
- Invalidação por padrão (regex)
- Invalidação em cascata (dados dependentes)
- Hooks especializados para diferentes tipos de dados

### 4. **Pré-carregamento**
- Carregamento automático de dados críticos
- Pré-carregamento baseado em proximidade de expiração
- Pré-carregamento manual para otimizar navegação

### 5. **Compressão de Dados**
- Compressão automática usando Base64
- Redução significativa do uso de memória
- Transparente para o desenvolvedor

### 6. **Monitoramento em Tempo Real**
- Estatísticas detalhadas de performance
- Visualização de todas as entradas
- Identificação de gargalos
- Recomendações automáticas

## 📊 Configuração de TTL

```typescript
// Dados em tempo real (1 minuto)
CASH_FLOW: 60 * 1000
SMART_ALERTS: 60 * 1000

// Dados frequentes (5 minutos)
MAIN_METRICS: 5 * 60 * 1000
FINANCIAL_METRICS: 5 * 60 * 1000
REVENUE_CHART: 5 * 60 * 1000

// Dados moderados (15 minutos)
CAC_ANALYSIS: 15 * 60 * 1000
DRE_REPORT: 15 * 60 * 1000

// Dados raros (30 minutos)
SEASONAL_ANALYSIS: 30 * 60 * 1000

// Dados auxiliares (1 hora)
COST_CENTERS: 60 * 60 * 1000
CATEGORIES: 60 * 60 * 1000
```

## 🎯 Como Usar

### 1. **Em Componentes React**

```tsx
import useCEOSmartCache, { CEOCacheKey } from '../hooks/useCEOSmartCache';

function MainMetricsCard() {
  const { data, isLoading, error, refresh, fromCache } = useCEOSmartCache({
    key: CEOCacheKey.MAIN_METRICS,
    fetchFn: async () => {
      const response = await fetch('/api/ceo/main-metrics');
      return await response.json();
    },
    autoRefresh: true,           // Atualização automática
    refreshInterval: 60000,      // A cada 1 minuto
    revalidateOnFocus: true,     // Revalidar ao focar na janela
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas Principais</CardTitle>
        {fromCache && <Badge>Do Cache ⚡</Badge>}
        <Button onClick={refresh}>Atualizar</Button>
      </CardHeader>
      <CardContent>
        <div>Receita: R$ {data.totalRevenue}</div>
      </CardContent>
    </Card>
  );
}
```

### 2. **Em APIs e Serviços**

```typescript
import getCEOSmartCache, { CEOCacheKey } from '../services/smart-cache';

export async function fetchMainMetrics(filters: any) {
  const cache = getCEOSmartCache();
  
  // Criar chave única com parâmetros
  const cacheKey = `${CEOCacheKey.MAIN_METRICS}:${JSON.stringify(filters)}`;
  
  // Usar getOrSet - busca do cache ou API automaticamente
  return await cache.getOrSet(
    cacheKey,
    async () => {
      const response = await fetch('/api/ceo/main-metrics', {
        method: 'POST',
        body: JSON.stringify(filters),
      });
      return await response.json();
    }
  );
}
```

### 3. **Invalidação Após Mudanças**

```typescript
import {
  ceoInvalidateSalesCache,
  ceoInvalidateExpensesCache,
  ceoInvalidateCashFlowCache,
} from '../services/smart-cache';

// Após salvar uma venda
export async function saveSale(saleData: any) {
  await fetch('/api/sales', {
    method: 'POST',
    body: JSON.stringify(saleData),
  });
  
  // Invalidar caches relacionados
  ceoInvalidateSalesCache(); // Invalida métricas de vendas, receita, lucro
  ceoInvalidateCashFlowCache(); // Invalida fluxo de caixa
}

// Após salvar uma despesa
export async function saveExpense(expenseData: any) {
  await fetch('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(expenseData),
  });
  
  // Invalidar caches relacionados
  ceoInvalidateExpensesCache(); // Invalida métricas de despesas, DRE
  ceoInvalidateCashFlowCache(); // Invalida fluxo de caixa
}
```

### 4. **Pré-carregamento**

```typescript
import { useCEOCachePrefetch } from '../hooks/useCEOSmartCache';

function NavigationButton() {
  const { prefetch } = useCEOCachePrefetch();
  
  const handleMouseEnter = () => {
    // Pré-carregar dados ao passar o mouse
    prefetch(
      CEOCacheKey.DRE_REPORT,
      async () => {
        const res = await fetch('/api/ceo/dre-report');
        return await res.json();
      }
    );
  };
  
  return (
    <button onMouseEnter={handleMouseEnter}>
      Ver Relatório DRE
    </button>
  );
}
```

### 5. **Sincronização Entre Componentes**

```tsx
import { useCEOCacheSync } from '../hooks/useCEOSmartCache';

// Componente A - Atualiza dados
function MetricsUpdater() {
  const { updateCache } = useCEOCacheSync(CEOCacheKey.MAIN_METRICS);
  
  const handleUpdate = async () => {
    const newData = await fetchNewData();
    updateCache(newData); // Todos os componentes usando essa chave serão atualizados
  };
  
  return <button onClick={handleUpdate}>Atualizar</button>;
}

// Componente B - Recebe atualizações automaticamente
function MetricsDisplay() {
  const { data } = useCEOCacheSync(CEOCacheKey.MAIN_METRICS);
  
  return <div>{data?.totalRevenue}</div>;
}
```

## 🔧 Configuração Avançada

### Criar Cache Customizado

```typescript
import { getCEOSmartCache } from '../services/smart-cache';

const cache = getCEOSmartCache({
  defaultTTL: 10 * 60 * 1000,      // 10 minutos padrão
  maxSize: 100 * 1024 * 1024,      // 100MB máximo
  enableCompression: true,          // Habilitar compressão
  enablePrefetch: true,             // Habilitar pré-carregamento
  cleanupInterval: 30 * 1000,       // Limpeza a cada 30 segundos
});
```

## 📈 Monitoramento

### Componente de Monitoramento

```tsx
import { CEOCacheMonitor } from '../components/CacheMonitor';

function AdminPanel() {
  return (
    <div>
      <h1>Painel Administrativo</h1>
      <CEOCacheMonitor /> {/* Exibe estatísticas em tempo real */}
    </div>
  );
}
```

### Monitoramento Programático

```typescript
import getCEOSmartCache from '../services/smart-cache';

const cache = getCEOSmartCache();

// Obter estatísticas
const stats = cache.getStats();
console.log('Taxa de acertos:', stats.hitRate);
console.log('Memória usada:', stats.memoryUsage, 'MB');
console.log('Entradas:', stats.entries);

// Listar todas as chaves
const keys = cache.getKeys();

// Obter info de uma entrada específica
const info = cache.getEntryInfo(CEOCacheKey.MAIN_METRICS);
console.log('Hits:', info?.hits);
console.log('Idade:', Date.now() - (info?.timestamp || 0), 'ms');
```

## 🎯 Estratégias de Invalidação

### 1. **Invalidação Imediata**

Use quando dados mudam imediatamente:

```typescript
cache.invalidate(CEOCacheKey.MAIN_METRICS);
```

### 2. **Invalidação por Padrão**

Use para invalidar múltiplas chaves relacionadas:

```typescript
// Invalidar todos os gráficos
cache.invalidatePattern('^ceo:chart:');

// Invalidar todas as análises
cache.invalidatePattern('^ceo:analysis:');
```

### 3. **Invalidação em Cascata**

Use quando dados dependentes precisam ser atualizados:

```typescript
import { CEOCacheInvalidationStrategies } from '../services/cache-usage-examples';

const strategies = new CEOCacheInvalidationStrategies();
strategies.cascadeInvalidation(CEOCacheKey.MAIN_METRICS);
// Também invalida: REVENUE_CHART, PROFIT_CHART, SMART_ALERTS
```

### 4. **Invalidação Inteligente**

Use quando quiser verificar se dados realmente mudaram:

```typescript
import { CEOCacheInvalidationStrategies } from '../services/cache-usage-examples';

const strategies = new CEOCacheInvalidationStrategies();
await strategies.smartInvalidation(CEOCacheKey.MAIN_METRICS, newData);
// Só invalida se os dados forem diferentes
```

## 🚀 Otimizações de Performance

### 1. **Pré-carregamento de Dados Críticos**

```typescript
import { prefetchCriticalCEOData } from '../services/cache-usage-examples';

// Chamar ao carregar a dashboard
useEffect(() => {
  prefetchCriticalCEOData();
}, []);
```

### 2. **Cache com Parâmetros**

```typescript
// Criar chaves únicas para cada combinação de parâmetros
const cacheKey = `${CEOCacheKey.REVENUE_CHART}:${startDate}:${endDate}:${groupBy}`;
```

### 3. **Limpeza Periódica**

O cache limpa automaticamente entradas expiradas a cada 1 minuto. Você pode ajustar:

```typescript
const cache = getCEOSmartCache({
  cleanupInterval: 30 * 1000, // Limpar a cada 30 segundos
});
```

## 📊 Métricas de Performance

### Objetivo: Taxa de Acertos > 80%

- **Excelente**: > 80% (verde)
- **Bom**: 50-80% (amarelo)
- **Precisa Otimização**: < 50% (vermelho)

### Uso de Memória

- **Limite Máximo**: 50MB (configurável)
- **Recomendado**: < 30MB
- **Alerta**: > 40MB

### TTL Ideal por Tipo de Dado

- **Tempo Real**: 1 minuto
- **Frequente**: 5 minutos
- **Moderado**: 15 minutos
- **Raro**: 30 minutos
- **Auxiliar**: 1 hora

## 🔒 Isolamento

**IMPORTANTE**: Este sistema de cache é 100% isolado da Dashboard CEO:

- ✅ Não afeta outras dashboards
- ✅ Não usa serviços compartilhados
- ✅ Não modifica tipos globais
- ✅ Totalmente independente

## 🐛 Debug

### Habilitar Logs Detalhados

O sistema já possui logs detalhados. Para visualizar:

```typescript
// Abra o console do navegador
// Todos os logs começam com [CEOCache]

// Exemplos de logs:
// [CEOCache] Set: ceo:main:metrics (TTL: 300000ms, Size: 1024 bytes)
// [CEOCache] Hit: ceo:main:metrics (hits: 5, age: 150000ms)
// [CEOCache] Miss: ceo:financial:metrics
// [CEOCache] Expired: ceo:cash:flow (age: 65000ms, ttl: 60000ms)
```

### Verificar Estado do Cache

```typescript
import { logCacheStats } from '../services/cache-usage-examples';

// Exibe estatísticas detalhadas no console
logCacheStats();
```

## 📚 Referência de APIs

### CEOSmartCacheManager

```typescript
class CEOSmartCacheManager {
  // Definir dados
  set<T>(key: string, data: T, customTTL?: number): void;
  
  // Obter dados
  get<T>(key: string): T | null;
  
  // Obter ou buscar
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, customTTL?: number): Promise<T>;
  
  // Invalidação
  invalidate(key: string): void;
  invalidatePattern(pattern: string): void;
  invalidateMetrics(): void;
  invalidateCharts(): void;
  invalidateAnalyses(): void;
  clear(): void;
  
  // Informações
  getStats(): CEOCacheStats;
  getEntryInfo(key: string): CEOCacheEntry | null;
  getKeys(): string[];
  
  // Lifecycle
  destroy(): void;
}
```

### Hooks React

```typescript
// Hook principal
useCEOSmartCache<T>(options: UseCEOCacheOptions<T>): UseCEOCacheResult<T>;

// Hook de estatísticas
useCEOCacheStats(): CEOCacheStats | null;

// Hook de invalidação
useCEOCacheInvalidation(): {
  invalidateKeys: (keys: string[]) => void;
  invalidatePattern: (pattern: string) => void;
  invalidateAll: () => void;
};

// Hook de pré-carregamento
useCEOCachePrefetch(): {
  prefetch: <T>(key: string, fetchFn: () => Promise<T>, ttl?: number) => Promise<void>;
  prefetchMultiple: (items: Array<{...}>) => Promise<void>;
};

// Hook de sincronização
useCEOCacheSync<T>(key: string): {
  data: T | null;
  updateCache: (newData: T, ttl?: number) => void;
};
```

## 🎓 Exemplos Práticos

Consulte o arquivo `cache-usage-examples.ts` para exemplos completos de:

1. Uso básico em APIs
2. Invalidação após mudanças
3. Pré-carregamento
4. Cache com parâmetros
5. Invalidação inteligente
6. Monitoramento
7. Uso em componentes React
8. Sincronização entre componentes
9. Pré-carregamento em componentes
10. Estratégias de invalidação

## 🚀 Começando

1. **Importe o hook no componente**:
   ```tsx
   import useCEOSmartCache, { CEOCacheKey } from '../hooks/useCEOSmartCache';
   ```

2. **Use no componente**:
   ```tsx
   const { data, isLoading } = useCEOSmartCache({
     key: CEOCacheKey.MAIN_METRICS,
     fetchFn: async () => await fetchData(),
   });
   ```

3. **Pronto!** O cache gerencia tudo automaticamente.

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Consulte este README
2. Veja os exemplos em `cache-usage-examples.ts`
3. Use o componente `CEOCacheMonitor` para debug
4. Verifique os logs no console (começam com `[CEOCache]`)

---

**Sistema desenvolvido especificamente para a Dashboard CEO - 100% isolado e otimizado para máxima performance! 🚀**

