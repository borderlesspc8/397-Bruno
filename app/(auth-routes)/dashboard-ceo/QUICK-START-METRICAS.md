# ⚡ QUICK START - Métricas Avançadas

## 🎯 Comece a usar em 3 passos

---

## 📦 PASSO 1: Copie e Cole Este Código

```typescript
'use client';

import React from 'react';
import { useAdvancedMetrics } from './hooks/useAdvancedMetrics';
import { AdvancedMetricsCard } from './components/AdvancedMetricsCard';

export default function MinhaPageComMetricas() {
  // 🔥 Isso é tudo que você precisa!
  const { data, loading } = useAdvancedMetrics({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Métricas Avançadas
      </h1>
      
      <AdvancedMetricsCard data={data} loading={loading} />
    </div>
  );
}
```

---

## ✅ PASSO 2: Verifique se Funciona

Abra a página e você verá:

### ✅ CAC (Custo de Aquisição)
- Quanto custa adquirir um cliente
- Calculado com dados reais de despesas + clientes

### ✅ Churn Rate (Taxa de Cancelamento)
- Quantos clientes param de comprar
- Baseado em clientes inativos (>90 dias sem compra)

### ✅ LTV (Lifetime Value)
- Quanto cada cliente vale
- Soma total gasto / clientes ativos

### ✅ Taxa de Conversão
- Quantos leads viram vendas
- Leads convertidos / total de leads

### ✅ Margem de Lucro Real
- Percentual de lucro
- (Receita - Custos) / Receita

### ✅ ROI por Canal
- Retorno de cada canal de marketing
- Lista com Google Ads, Facebook, Instagram, etc.

---

## 🎨 PASSO 3: Customize (Opcional)

### Mudar Período

```typescript
const { data, loading } = useAdvancedMetrics({
  startDate: '2024-10-01',  // ← Mude aqui
  endDate: '2024-10-31'     // ← Mude aqui
});
```

### Adicionar Auto-Refresh

```typescript
const { data, loading } = useAdvancedMetrics({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  autoRefresh: true,           // ← Ativa refresh automático
  refreshInterval: 300000      // ← A cada 5 minutos
});
```

### Adicionar Botão de Atualizar

```typescript
const { data, loading, refetch } = useAdvancedMetrics({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

return (
  <div>
    <button onClick={refetch}>
      Atualizar Métricas
    </button>
    
    <AdvancedMetricsCard data={data} loading={loading} />
  </div>
);
```

### Tratar Erros

```typescript
const { data, loading, error } = useAdvancedMetrics({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});

if (error) {
  return <div>Erro ao carregar: {error.message}</div>;
}
```

---

## 🔍 Exemplo Completo com Tudo

```typescript
'use client';

import React, { useState } from 'react';
import { useAdvancedMetrics } from './hooks/useAdvancedMetrics';
import { AdvancedMetricsCard } from './components/AdvancedMetricsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardMetricas() {
  // Estado para controlar período
  const [period, setPeriod] = useState({
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  });

  // Hook de métricas
  const { data, loading, error, refetch } = useAdvancedMetrics({
    startDate: period.startDate,
    endDate: period.endDate,
    autoRefresh: true,
    refreshInterval: 300000 // 5 minutos
  });

  // Funções para mudar período
  const setUltimoMes = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);
    setPeriod({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  const setUltimoAno = () => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    setPeriod({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Métricas Avançadas</h1>
          <p className="text-gray-500">
            Período: {period.startDate} até {period.endDate}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={setUltimoMes} variant="outline">
            Último Mês
          </Button>
          <Button onClick={setUltimoAno} variant="outline">
            Último Ano
          </Button>
          <Button onClick={refetch}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800 font-semibold">
              Erro ao carregar métricas
            </p>
            <p className="text-red-600 text-sm mt-2">
              {error.message}
            </p>
            <Button 
              onClick={refetch} 
              className="mt-4"
              variant="destructive"
            >
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resumo Rápido */}
      {data && !loading && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">CAC</p>
              <p className="text-2xl font-bold">
                R$ {data.realCAC.value}
              </p>
              <p className={`text-sm ${
                data.realCAC.status === 'excellent' ? 'text-green-600' :
                data.realCAC.status === 'good' ? 'text-blue-600' :
                data.realCAC.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {data.realCAC.status === 'excellent' ? '🟢 Excelente' :
                 data.realCAC.status === 'good' ? '🔵 Bom' :
                 data.realCAC.status === 'warning' ? '🟡 Atenção' :
                 '🔴 Crítico'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Churn Rate</p>
              <p className="text-2xl font-bold">
                {data.churnRate.value}%
              </p>
              <p className={`text-sm ${
                data.churnRate.status === 'excellent' ? 'text-green-600' :
                data.churnRate.status === 'good' ? 'text-blue-600' :
                data.churnRate.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {data.churnRate.status === 'excellent' ? '🟢 Excelente' :
                 data.churnRate.status === 'good' ? '🔵 Bom' :
                 data.churnRate.status === 'warning' ? '🟡 Atenção' :
                 '🔴 Crítico'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">LTV</p>
              <p className="text-2xl font-bold">
                R$ {data.lifetimeValue.value}
              </p>
              <p className={`text-sm ${
                data.lifetimeValue.status === 'excellent' ? 'text-green-600' :
                data.lifetimeValue.status === 'good' ? 'text-blue-600' :
                data.lifetimeValue.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {data.lifetimeValue.status === 'excellent' ? '🟢 Excelente' :
                 data.lifetimeValue.status === 'good' ? '🔵 Bom' :
                 data.lifetimeValue.status === 'warning' ? '🟡 Atenção' :
                 '🔴 Crítico'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Margem de Lucro</p>
              <p className="text-2xl font-bold">
                {data.realProfitMargin.value}%
              </p>
              <p className={`text-sm ${
                data.realProfitMargin.status === 'excellent' ? 'text-green-600' :
                data.realProfitMargin.status === 'good' ? 'text-blue-600' :
                data.realProfitMargin.status === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {data.realProfitMargin.status === 'excellent' ? '🟢 Excelente' :
                 data.realProfitMargin.status === 'good' ? '🔵 Bom' :
                 data.realProfitMargin.status === 'warning' ? '🟡 Atenção' :
                 '🔴 Crítico'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Métricas Detalhadas */}
      <AdvancedMetricsCard data={data} loading={loading} />
    </div>
  );
}
```

---

## 🧪 Como Testar

### 1. Teste Rápido via Browser
```
http://localhost:3000/api/ceo/advanced-metrics?startDate=2024-01-01&endDate=2024-12-31
```

### 2. Teste via Script
```bash
cd app/(auth-routes)/dashboard-ceo
node test-advanced-metrics.js
```

### 3. Teste no Dashboard
Adicione o código acima em uma página e acesse no navegador.

---

## ❓ Problemas Comuns

### "Erro ao buscar dados"
✅ Verifique as variáveis de ambiente da API Betel

### "Valores todos zerados"
✅ Selecione um período com vendas registradas

### "Loading infinito"
✅ Verifique o console do navegador e logs do servidor

---

## 📚 Quer Saber Mais?

- **Detalhes técnicos:** `FASE4-METRICAS-AVANCADAS-COMPLETO.md`
- **Guia completo:** `docs/ADVANCED-METRICS-USAGE.md`
- **Mais exemplos:** `docs/ADVANCED-METRICS-EXAMPLE.tsx`
- **README geral:** `METRICAS-AVANCADAS-README.md`

---

## ✅ Pronto!

Agora você tem:
- ✅ 6 métricas avançadas funcionando
- ✅ Dados 100% reais da API Betel
- ✅ Componente visual completo
- ✅ Sistema isolado e seguro

**Comece a usar agora mesmo! 🚀**

