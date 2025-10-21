# Loading States - Dashboard CEO

## 📋 Visão Geral

Sistema completo de estados de loading, esqueletos e transições para a Dashboard CEO, totalmente isolado e sem interferência nas outras dashboards.

## 🎨 Componentes Disponíveis

### Skeleton Loaders

#### CardSkeleton
Skeleton loader para componentes Card genéricos.
```tsx
import { CardSkeleton } from './loading-states';

<CardSkeleton 
  showHeader={true} 
  contentRows={5} 
  className="h-full" 
/>
```

#### MetricCardSkeleton
Skeleton específico para cards de métricas com valor e variação.
```tsx
import { MetricCardSkeleton } from './loading-states';

<MetricCardSkeleton className="w-full h-full" />
```

#### ChartSkeleton
Skeleton para componentes de gráfico com barras simuladas.
```tsx
import { ChartSkeleton } from './loading-states';

<ChartSkeleton 
  height="h-64" 
  showLegend={true} 
  showHeader={true} 
/>
```

#### TableSkeleton
Skeleton para componentes de tabela.
```tsx
import { TableSkeleton } from './loading-states';

<TableSkeleton 
  rows={5} 
  columns={4} 
  showHeader={true} 
/>
```

### Progress Indicators

#### ProgressIndicator
Indicador de progresso versátil com múltiplas variantes.
```tsx
import { ProgressIndicator } from './loading-states';

<ProgressIndicator 
  message="Carregando dados..." 
  progress={45} 
  showPercentage={true}
  variant="bar" // 'spinner' | 'bar' | 'dots'
  size="md" // 'sm' | 'md' | 'lg'
/>
```

#### InlineLoader
Loader compacto para uso inline.
```tsx
import { InlineLoader } from './loading-states';

<InlineLoader message="Processando..." size="sm" />
```

### Error States

#### ErrorState
Componente de erro com ações de recuperação.
```tsx
import { ErrorState } from './loading-states';

<ErrorState
  title="Erro ao Carregar"
  message="Não foi possível carregar os dados."
  error={error}
  onRetry={handleRetry}
  variant="card" // 'card' | 'alert' | 'inline'
  showDetails={true}
/>
```

#### ApiErrorState
Estado de erro específico para falhas de API.
```tsx
import { ApiErrorState } from './loading-states';

<ApiErrorState onRetry={handleRetry} />
```

#### NoDataState
Estado para ausência de dados.
```tsx
import { NoDataState } from './loading-states';

<NoDataState message="Nenhum dado disponível para o período." />
```

### Transitions

#### FadeIn
Transição de fade in suave.
```tsx
import { FadeIn } from './loading-states';

<FadeIn duration={400} delay={100}>
  <YourComponent />
</FadeIn>
```

#### SlideIn
Transição de slide from direction.
```tsx
import { SlideIn } from './loading-states';

<SlideIn duration={400} direction="up">
  <YourComponent />
</SlideIn>
```

#### ScaleIn
Transição com escala.
```tsx
import { ScaleIn } from './loading-states';

<ScaleIn duration={300}>
  <YourComponent />
</ScaleIn>
```

## 🔧 Implementação nos Componentes

### Pattern Padrão

```tsx
interface ComponentProps {
  data?: DataType;
  isLoading?: boolean;
  error?: Error | string;
  onRefresh?: () => void;
}

export function Component({ data, isLoading, error, onRefresh }: ComponentProps) {
  // Estado de Loading
  if (isLoading) {
    return <CardSkeleton showHeader={true} contentRows={5} />;
  }

  // Estado de Erro
  if (error) {
    return (
      <ErrorState
        title="Erro no Componente"
        message="Não foi possível carregar os dados."
        error={error}
        onRetry={onRefresh}
        variant="card"
      />
    );
  }

  // Estado de Sem Dados
  if (!data) {
    return <NoDataState />;
  }

  // Renderização com transição
  return (
    <FadeIn duration={400} delay={100}>
      <Card className="transition-shadow hover:shadow-lg">
        {/* Conteúdo do componente */}
      </Card>
    </FadeIn>
  );
}
```

## 📊 Componentes Implementados

### ✅ Componentes de Métricas
- [x] OperationalIndicatorsCard
- [x] CACAnalysisCard
- [x] LiquidityIndicatorsCard

### ✅ Componentes Financeiros
- [x] SimplifiedDRECard
- [x] CashFlowCard
- [x] CostCenterCard

### ✅ Componentes de Análise
- [x] SeasonalAnalysisCard
- [x] DrillDownPanel

### ✅ Componentes Funcionais
- [x] ExportPanel
- [x] CustomReportsPanel

## 🎯 Características

### Null Safety
- Verificação completa de dados nulos/undefined
- Uso de optional chaining (?.)
- Valores padrão seguros (?? operator)
- Estados distintos para loading, erro e sem dados

### Transitions
- FadeIn com duração configurável
- Delays escalonados para efeito staggered
- Transições suaves com CSS
- Hover effects para interatividade

### Error Handling
- Estados de erro específicos por tipo
- Ações de retry configuráveis
- Mensagens de erro detalhadas (opcional)
- Feedback visual claro

### Performance
- Skeleton loaders otimizados
- Animações CSS em vez de JS
- Lazy loading de componentes pesados
- Transições com GPU acceleration

## 🚀 Boas Práticas

1. **Sempre use estados de loading** para operações assíncronas
2. **Implemente error boundaries** para capturar erros não tratados
3. **Forneça fallbacks** para todos os estados possíveis
4. **Use transições** para melhorar a UX
5. **Teste todos os estados** (loading, error, success, empty)

## 🔒 Isolamento

Todos os componentes de loading states estão **100% isolados** da Dashboard CEO:
- Não afetam outras dashboards
- Não compartilham estado global
- Não modificam serviços existentes
- Seguem naming convention CEO*

## 📝 Notas

- Todos os componentes suportam dark mode
- Animações respeitam `prefers-reduced-motion`
- Componentes são acessíveis (ARIA labels)
- Fully typed com TypeScript

