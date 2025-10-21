# 🚀 Guia de Integração - Advanced Metrics Card

## 📋 Como Integrar o Card de Métricas Avançadas

Este guia mostra como adicionar o `AdvancedMetricsCard` ao dashboard CEO.

---

## 1️⃣ Importar o Componente

No arquivo `app/(auth-routes)/dashboard-ceo/page.tsx`, adicione o import:

```typescript
import { AdvancedMetricsCard } from './components/AdvancedMetricsCard';
```

---

## 2️⃣ Usar os Dados do Hook

O hook `useCEODashboard` já fornece os dados necessários:

```typescript
const {
  advancedMetrics,      // ✅ Dados das métricas avançadas
  validationWarnings,   // ⚠️ Avisos de validação
  validationErrors,     // ❌ Erros de validação
  loading,              // ⏳ Estado de carregamento
  error                 // ❌ Erro geral
} = useCEODashboard({ startDate, endDate });
```

---

## 3️⃣ Adicionar o Card ao Layout

Adicione o componente no layout da página:

```tsx
<div className="space-y-6">
  {/* Outros cards existentes */}
  
  {/* Card de Métricas Avançadas */}
  <AdvancedMetricsCard 
    data={advancedMetrics} 
    loading={loading}
  />
  
  {/* Mais cards abaixo... */}
</div>
```

---

## 4️⃣ Exemplo Completo de Integração

```tsx
'use client';

import React from 'react';
import { useCEODashboard } from './hooks/useCEODashboard';
import { AdvancedMetricsCard } from './components/AdvancedMetricsCard';
// ... outros imports

export default function CEODashboardPage() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const {
    data,
    advancedMetrics,
    validationWarnings,
    validationErrors,
    loading,
    error
  } = useCEODashboard({ startDate, endDate });

  return (
    <div className="container mx-auto p-6">
      {/* Header e seletor de período */}
      <CEOHeader />
      <CEOTimeSelector 
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Warnings de Validação */}
      {validationWarnings.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-800 mb-2">
            ⚠️ Avisos de Validação
          </h4>
          <ul className="text-xs text-yellow-700 list-disc list-inside">
            {validationWarnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors de Validação */}
      {validationErrors.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-sm font-semibold text-red-800 mb-2">
            ❌ Erros de Validação
          </h4>
          <ul className="text-xs text-red-700 list-disc list-inside">
            {validationErrors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid de Cards */}
      <div className="space-y-6">
        {/* Cards de Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CEOMetricCard {...data?.financialMetrics} />
          {/* ... outros cards */}
        </div>

        {/* Card de Métricas Avançadas - NOVO */}
        <AdvancedMetricsCard 
          data={advancedMetrics} 
          loading={loading}
        />

        {/* Outros cards e componentes */}
        <OperationalIndicatorsCard {...operationalMetrics} />
        <CashFlowCard {...cashFlowData} />
        <SimplifiedDRECard {...dreData} />
        {/* ... */}
      </div>
    </div>
  );
}
```

---

## 5️⃣ Posicionamento Recomendado

### Opção 1: Após Métricas Principais (Recomendado)
```
┌─────────────────────────────────────────┐
│ Header e Seletor de Período             │
├─────────────────────────────────────────┤
│ [Métrica 1] [Métrica 2] [Métrica 3]     │
├─────────────────────────────────────────┤
│ 📊 ADVANCED METRICS CARD (NOVO)         │  ← Aqui
├─────────────────────────────────────────┤
│ Operational Indicators                  │
│ Cash Flow                               │
│ DRE                                     │
└─────────────────────────────────────────┘
```

### Opção 2: Em Seção Dedicada
```
┌─────────────────────────────────────────┐
│ Header e Seletor de Período             │
├─────────────────────────────────────────┤
│ === Visão Geral ===                     │
│ [Métrica 1] [Métrica 2] [Métrica 3]     │
├─────────────────────────────────────────┤
│ === Análise Operacional ===             │
│ Operational Indicators                  │
│ Cash Flow                               │
├─────────────────────────────────────────┤
│ === Métricas Avançadas ===              │
│ 📊 ADVANCED METRICS CARD (NOVO)         │  ← Aqui
└─────────────────────────────────────────┘
```

### Opção 3: Em Tab Separada
```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
    <TabsTrigger value="operational">Operacional</TabsTrigger>
    <TabsTrigger value="advanced">Métricas Avançadas</TabsTrigger>
  </TabsList>
  
  <TabsContent value="overview">
    {/* Cards principais */}
  </TabsContent>
  
  <TabsContent value="operational">
    {/* Cards operacionais */}
  </TabsContent>
  
  <TabsContent value="advanced">
    <AdvancedMetricsCard 
      data={advancedMetrics} 
      loading={loading}
    />
  </TabsContent>
</Tabs>
```

---

## 6️⃣ Customizações Opcionais

### Adicionar Título de Seção

```tsx
<div className="space-y-6">
  {/* Seção de Métricas Avançadas */}
  <div>
    <h2 className="text-2xl font-bold mb-4 text-gray-900">
      📊 Métricas Avançadas de Performance
    </h2>
    <p className="text-sm text-gray-600 mb-6">
      Análise detalhada com dados reais da API Betel, incluindo CAC, Churn Rate, 
      LTV, Taxa de Conversão, Margem de Lucro e ROI por Canal.
    </p>
    
    <AdvancedMetricsCard 
      data={advancedMetrics} 
      loading={loading}
    />
  </div>
</div>
```

### Adicionar Botão de Refresh

```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-2xl font-bold text-gray-900">
    📊 Métricas Avançadas
  </h2>
  
  <button
    onClick={refetch}
    disabled={loading}
    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
  >
    {loading ? 'Carregando...' : 'Atualizar Dados'}
  </button>
</div>

<AdvancedMetricsCard 
  data={advancedMetrics} 
  loading={loading}
/>
```

### Adicionar Filtros Personalizados

```tsx
<div className="mb-4 flex gap-4">
  <select 
    className="px-4 py-2 border rounded-lg"
    onChange={(e) => setMetricFilter(e.target.value)}
  >
    <option value="all">Todas as Métricas</option>
    <option value="acquisition">Aquisição (CAC, Conversão)</option>
    <option value="retention">Retenção (Churn, LTV)</option>
    <option value="profitability">Rentabilidade (Margem, ROI)</option>
  </select>
</div>

<AdvancedMetricsCard 
  data={advancedMetrics} 
  loading={loading}
/>
```

---

## 7️⃣ Responsividade

O card já é 100% responsivo:

- **Desktop (lg):** 3 colunas de métricas
- **Tablet (md):** 2 colunas de métricas
- **Mobile:** 1 coluna (stack vertical)

### Customizar Breakpoints (Opcional)

```tsx
// Para forçar sempre 2 colunas no desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Métricas */}
</div>

// Para forçar sempre 1 coluna (lista vertical)
<div className="grid grid-cols-1 gap-4">
  {/* Métricas */}
</div>
```

---

## 8️⃣ Verificação de Dados

### Verificar se há dados antes de renderizar

```tsx
{advancedMetrics && (
  <AdvancedMetricsCard 
    data={advancedMetrics} 
    loading={loading}
  />
)}
```

### Mostrar mensagem alternativa

```tsx
{advancedMetrics ? (
  <AdvancedMetricsCard 
    data={advancedMetrics} 
    loading={loading}
  />
) : (
  !loading && (
    <Card className="w-full p-8 text-center text-gray-500">
      <p>Nenhum dado de métricas avançadas disponível para o período selecionado.</p>
    </Card>
  )
)}
```

---

## 9️⃣ Debug e Logs

### Adicionar logs para debug

```tsx
useEffect(() => {
  console.log('Advanced Metrics Data:', advancedMetrics);
  console.log('Validation Warnings:', validationWarnings);
  console.log('Validation Errors:', validationErrors);
}, [advancedMetrics, validationWarnings, validationErrors]);
```

### Mostrar dados brutos (desenvolvimento)

```tsx
{process.env.NODE_ENV === 'development' && advancedMetrics && (
  <details className="mt-4 p-4 bg-gray-100 rounded-lg">
    <summary className="cursor-pointer font-semibold">
      🔍 Debug: Ver Dados Brutos
    </summary>
    <pre className="mt-2 text-xs overflow-auto">
      {JSON.stringify(advancedMetrics, null, 2)}
    </pre>
  </details>
)}
```

---

## 🔟 Testes

### Teste Manual

1. Selecione um período no dashboard
2. Aguarde o carregamento
3. Verifique se as 6 métricas aparecem
4. Verifique se a seção de ROI por Canal aparece
5. Verifique os status coloridos (verde/azul/amarelo/vermelho)
6. Verifique as tendências (↑ ↓ →)
7. Verifique os valores comparados com benchmarks

### Teste de Responsividade

1. Redimensione a janela do browser
2. Teste em mobile (DevTools → Device Mode)
3. Verifique se o layout se ajusta corretamente

### Teste de Fallback

1. Desligue temporariamente a API Betel (ou simule erro)
2. Verifique se o fallback funciona
3. Verifique se os warnings aparecem
4. Verifique se os dados estimados são exibidos

---

## ✅ Checklist de Integração

- [ ] Import do componente adicionado
- [ ] Componente renderizado na página
- [ ] Props passadas corretamente (`data` e `loading`)
- [ ] Posicionamento definido (após métricas principais, em seção, ou tab)
- [ ] Warnings/Errors de validação exibidos (opcional)
- [ ] Testado em desktop
- [ ] Testado em mobile
- [ ] Testado com dados reais
- [ ] Testado com fallback
- [ ] Documentado no código (comentários)

---

## 📝 Notas Importantes

1. **Dados Automáticos:** O hook `useCEODashboard` já busca os dados automaticamente
2. **Sem Configuração Extra:** O card funciona "out of the box"
3. **100% Isolado:** Não afeta outros componentes ou dashboards
4. **Responsivo:** Funciona em todos os tamanhos de tela
5. **Fallback Automático:** Sempre mostra dados, mesmo se API falhar

---

## 🆘 Troubleshooting

### Card não aparece
- Verifique se o import está correto
- Verifique se o hook está sendo chamado
- Verifique no console se há erros

### Dados não carregam
- Verifique se startDate e endDate estão corretos
- Verifique no Network tab se a API foi chamada
- Verifique os logs do console

### Mostra "Nenhum dado disponível"
- Normal se `advancedMetrics` for null
- Aguarde o loading completar
- Verifique se há erros de validação

### Status sempre mostra "Crítico"
- Verifique se os dados reais estão sendo buscados
- Verifique se o fallback está sendo usado
- Verifique os valores dos benchmarks

---

**✅ Integração Completa!**

Após seguir estes passos, o card de métricas avançadas estará funcionando perfeitamente no seu dashboard CEO.

