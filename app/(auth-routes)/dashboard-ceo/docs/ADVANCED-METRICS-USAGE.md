# 📊 Métricas Avançadas - Guia de Uso

## Visão Geral

O sistema de Métricas Avançadas fornece análises detalhadas de performance empresarial baseadas em **dados reais** da API Betel Tecnologia.

## Métricas Disponíveis

### 1. CAC - Custo de Aquisição de Cliente
**O que é:** Quanto custa para adquirir um novo cliente.

**Como é calculado:**
```typescript
CAC = Total de Investimento em Marketing / Número de Novos Clientes
```

**Dados Reais Utilizados:**
- Despesas de marketing da API Betel (categorias: marketing, publicidade, propaganda, ads, anúncios)
- Clientes cadastrados no período da API Betel

**Benchmarks:**
- 🟢 Excelente: ≤ R$ 50
- 🔵 Bom: ≤ R$ 100
- 🟡 Atenção: ≤ R$ 150
- 🔴 Crítico: > R$ 150

---

### 2. Churn Rate - Taxa de Cancelamento
**O que é:** Percentual de clientes que param de comprar.

**Como é calculado:**
```typescript
Churn Rate = (Clientes que Churnaram / Clientes Ativos no Início) × 100
```

**Dados Reais Utilizados:**
- Status dos clientes da API Betel
- Última data de compra (clientes inativos por >90 dias = churned)

**Benchmarks:**
- 🟢 Excelente: ≤ 2%
- 🔵 Bom: ≤ 5%
- 🟡 Atenção: ≤ 8%
- 🔴 Crítico: > 8%

---

### 3. LTV - Lifetime Value
**O que é:** Valor total que um cliente gasta durante todo o relacionamento.

**Como é calculado:**
```typescript
LTV = Soma do Total Gasto por Todos os Clientes Ativos / Número de Clientes Ativos
```

**Dados Reais Utilizados:**
- Histórico de compras dos clientes da API Betel
- Valor total gasto por cada cliente

**Benchmarks:**
- 🟢 Excelente: ≥ R$ 1.000
- 🔵 Bom: ≥ R$ 500
- 🟡 Atenção: ≥ R$ 300
- 🔴 Crítico: < R$ 300

---

### 4. Taxa de Conversão
**O que é:** Percentual de leads que se tornam clientes.

**Como é calculado:**
```typescript
Taxa de Conversão = (Leads Convertidos / Total de Leads) × 100
```

**Dados Reais Utilizados:**
- Atendimentos/Leads da API Betel
- Status de conversão dos leads

**Benchmarks:**
- 🟢 Excelente: ≥ 15%
- 🔵 Bom: ≥ 10%
- 🟡 Atenção: ≥ 5%
- 🔴 Crítico: < 5%

---

### 5. Margem de Lucro Real
**O que é:** Percentual de lucro sobre a receita total.

**Como é calculado:**
```typescript
Margem de Lucro = ((Receita - Custos) / Receita) × 100
```

**Dados Reais Utilizados:**
- Valor total das vendas da API Betel
- Valor de custo dos produtos vendidos da API Betel

**Benchmarks:**
- 🟢 Excelente: ≥ 30%
- 🔵 Bom: ≥ 20%
- 🟡 Atenção: ≥ 10%
- 🔴 Crítico: < 10%

---

### 6. ROI por Canal
**O que é:** Retorno sobre investimento para cada canal de marketing.

**Como é calculado:**
```typescript
ROI = ((Receita do Canal - Investimento no Canal) / Investimento no Canal) × 100
```

**Dados Reais Utilizados:**
- Despesas de marketing por canal da API Betel
- Receita de vendas por canal da API Betel

**Benchmarks:**
- 🟢 Excelente: ≥ 300%
- 🔵 Bom: ≥ 150%
- 🟡 Atenção: ≥ 50%
- 🔴 Crítico: < 50%

---

## Como Usar

### 1. Usando o Hook

```typescript
import { useAdvancedMetrics } from '../hooks/useAdvancedMetrics';

function MyComponent() {
  const { data, loading, error, refetch } = useAdvancedMetrics({
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    autoRefresh: false, // opcional
    refreshInterval: 300000 // 5 minutos (opcional)
  });

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;
  if (!data) return <div>Sem dados</div>;

  return (
    <div>
      <p>CAC: R$ {data.realCAC.value}</p>
      <p>Churn: {data.churnRate.value}%</p>
      <p>LTV: R$ {data.lifetimeValue.value}</p>
      {/* ... */}
    </div>
  );
}
```

### 2. Usando o Componente

```typescript
import { AdvancedMetricsCard } from '../components/AdvancedMetricsCard';
import { useAdvancedMetrics } from '../hooks/useAdvancedMetrics';

function MyDashboard() {
  const { data, loading } = useAdvancedMetrics({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  return <AdvancedMetricsCard data={data} loading={loading} />;
}
```

### 3. Usando o Serviço Diretamente

```typescript
import { CEOAdvancedMetricsService } from '../services/advanced-metrics';

async function fetchMetrics() {
  const metrics = await CEOAdvancedMetricsService.calculateAllAdvancedMetrics({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  console.log('CAC:', metrics.realCAC.value);
  console.log('Churn:', metrics.churnRate.value);
  console.log('LTV:', metrics.lifetimeValue.value);
}
```

---

## Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                    USUÁRIO SOLICITA                         │
│             (Hook ou Serviço ou Componente)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          CEOAdvancedMetricsService.calculateAll()           │
│                (Orquestra todos os cálculos)                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              API: /api/ceo/advanced-metrics                 │
│           (Busca dados reais da API Betel)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  API BETEL TECNOLOGIA                       │
│  • Vendas (com custos)                                      │
│  • Clientes (com histórico)                                 │
│  • Despesas (marketing)                                     │
│  • Leads/Atendimentos                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          PROCESSAMENTO E VALIDAÇÃO DE DADOS                 │
│  • Validação de tipos                                       │
│  • Validação de ranges                                      │
│  • Sanitização                                              │
│  • Fallback quando necessário                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              CÁLCULO DAS MÉTRICAS INDIVIDUAIS               │
│  • calculateRealCAC()                                       │
│  • calculateChurnRate()                                     │
│  • calculateLifetimeValue()                                 │
│  • calculateConversionRate()                                │
│  • calculateRealProfitMargin()                              │
│  • calculateROIByChannel()                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              RETORNO CONSOLIDADO AO USUÁRIO                 │
│            (AdvancedMetrics completo)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Tratamento de Erros

O sistema possui múltiplas camadas de segurança:

1. **Validação de Entrada:** Todos os dados são validados antes do cálculo
2. **Fallback Automático:** Se a API Betel falhar, usa dados estimados
3. **Valores Padrão:** Se tudo falhar, retorna métricas com status "crítico"
4. **Logs Detalhados:** Todos os erros são logados para debug

---

## Otimizações

### Cache Automático
O sistema usa cache inteligente na API para evitar chamadas repetidas:
- Duração: 5 minutos
- Invalidação automática quando o período muda

### Auto-Refresh
Configure auto-refresh no hook:
```typescript
const { data } = useAdvancedMetrics({
  startDate,
  endDate,
  autoRefresh: true,
  refreshInterval: 300000 // 5 minutos
});
```

---

## Isolamento

⚠️ **IMPORTANTE:** Este sistema é **100% isolado** das outras dashboards:

- ✅ Não usa `BetelTecnologiaService`
- ✅ Não modifica serviços existentes
- ✅ Possui sua própria camada de API (`/api/ceo/advanced-metrics`)
- ✅ Possui seus próprios tipos e interfaces
- ✅ Possui seu próprio sistema de cache
- ✅ Possui seu próprio tratamento de erros

---

## Exemplo Completo

```typescript
'use client';

import React from 'react';
import { AdvancedMetricsCard } from './components/AdvancedMetricsCard';
import { useAdvancedMetrics } from './hooks/useAdvancedMetrics';

export function CEOAdvancedMetricsPage() {
  const [dateRange, setDateRange] = React.useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  const { data, loading, error, refetch } = useAdvancedMetrics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutos
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Métricas Avançadas</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Erro: {error.message}</p>
          <button 
            onClick={() => refetch()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      <AdvancedMetricsCard data={data} loading={loading} />
    </div>
  );
}
```

---

## Troubleshooting

### Problema: Métricas mostram valores zerados
**Solução:** Verifique se há dados no período selecionado na API Betel

### Problema: Erro ao buscar dados
**Solução:** Verifique as variáveis de ambiente:
- `GESTAO_CLICK_API_URL`
- `GESTAO_CLICK_ACCESS_TOKEN`
- `GESTAO_CLICK_SECRET_ACCESS_TOKEN`

### Problema: Loading infinito
**Solução:** Verifique o console do navegador para erros da API

---

## Manutenção

Para adicionar novas métricas:

1. Adicione a interface em `advanced-metrics.ts`
2. Crie o método de cálculo
3. Adicione ao `calculateAllAdvancedMetrics()`
4. Atualize o componente para exibir
5. Atualize esta documentação

---

**Última atualização:** Outubro 2024
**Versão:** 1.0.0
**Desenvolvido para:** Dashboard CEO - Personal Prime

