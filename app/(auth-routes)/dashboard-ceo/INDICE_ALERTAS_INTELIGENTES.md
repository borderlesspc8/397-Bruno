# 📑 Índice - Sistema de Alertas Inteligentes

## 🗂️ Estrutura de Arquivos

### 📦 Serviços (Core)
```
app/(auth-routes)/dashboard-ceo/services/
├── smart-alerts.ts              # Serviço principal de alertas
└── smart-alerts.README.md       # Documentação detalhada
```

**smart-alerts.ts**
- Classe: `CEOSmartAlertsService`
- Linhas: ~1.200
- Funções principais:
  - `analyzeMetricsAndGenerateAlerts()` - Análise completa de métricas
  - `analyzeTrend()` - Análise de tendências
  - `detectAnomaly()` - Detecção de anomalias
  - `getActiveAlerts()` - Obter alertas ativos
  - `getAlertStatistics()` - Estatísticas
  - `acknowledgeAlert()` - Reconhecer alerta
  - `resolveAlert()` - Resolver alerta
  - `dismissAlert()` - Descartar alerta

---

### 🎣 Hooks
```
app/(auth-routes)/dashboard-ceo/hooks/
└── useSmartAlerts.ts            # Hooks customizados
```

**useSmartAlerts.ts**
- Linhas: ~350
- Hooks exportados:
  - `useSmartAlerts()` - Hook principal
  - `useCriticalAlerts()` - Alertas críticos
  - `useMetricsAnalysis()` - Análise de métricas
  - `useAlertRules()` - Gerenciar regras

---

### 🎨 Componentes
```
app/(auth-routes)/dashboard-ceo/components/
├── SmartAlertsPanel.tsx         # Painel completo de alertas
└── AlertNotifications.tsx       # Notificações e badges
```

**SmartAlertsPanel.tsx**
- Linhas: ~500
- Componentes exportados:
  - `SmartAlertsPanel` - Painel principal
  - `StatCard` - Card de estatística (interno)
  - `AlertCard` - Card de alerta (interno)

**AlertNotifications.tsx**
- Linhas: ~280
- Componentes exportados:
  - `AlertNotifications` - Toast notifications
  - `CriticalAlertsBadge` - Badge com contador
  - `CriticalAlertsBar` - Barra de alerta

---

### 🧪 Testes
```
app/(auth-routes)/dashboard-ceo/tests/
└── smart-alerts.test.ts         # Testes unitários
```

**smart-alerts.test.ts**
- Linhas: ~550
- Suites de teste: 10
- Total de testes: 38
- Cobertura:
  - Análise de tendências
  - Detecção de anomalias
  - Geração de alertas
  - Gerenciamento
  - Estatísticas
  - Regras
  - Validação

---

### 📚 Exemplos
```
app/(auth-routes)/dashboard-ceo/examples/
└── AlertsIntegrationExample.tsx # Exemplos de integração
```

**AlertsIntegrationExample.tsx**
- Linhas: ~450
- Exemplos: 8
  1. Dashboard completa
  2. Header com badge
  3. Card com anomalia
  4. Análise automática
  5. Filtros
  6. Estatísticas
  7. Ações em lote
  8. Página completa

---

### 📖 Documentação
```
app/(auth-routes)/dashboard-ceo/
├── FASE_6_ALERTAS_INTELIGENTES_COMPLETO.md  # Relatório completo
├── INDICE_ALERTAS_INTELIGENTES.md          # Este arquivo
└── services/
    └── smart-alerts.README.md              # Documentação técnica
```

---

## 🔍 Guia Rápido de Referência

### Tipos Principais

| Tipo | Descrição | Arquivo |
|------|-----------|---------|
| `CEOAlert` | Interface de um alerta | smart-alerts.ts:45 |
| `CEOAlertRule` | Regra de alerta | smart-alerts.ts:72 |
| `CEOAlertStatistics` | Estatísticas | smart-alerts.ts:96 |
| `CEOTrendAnalysis` | Análise de tendência | smart-alerts.ts:107 |
| `CEOAnomalyDetection` | Detecção de anomalia | smart-alerts.ts:116 |

### Enums

| Enum | Valores | Linha |
|------|---------|-------|
| `CEOAlertType` | THRESHOLD, TREND, ANOMALY, GOAL, PREDICTION, CRITICAL | 19 |
| `CEOAlertSeverity` | CRITICAL, HIGH, MEDIUM, LOW, INFO | 27 |
| `CEOAlertStatus` | ACTIVE, ACKNOWLEDGED, RESOLVED, DISMISSED, EXPIRED | 35 |
| `CEOAlertCategory` | REVENUE, COSTS, PROFIT, CASH_FLOW, CUSTOMERS, OPERATIONS, MARKETING, INVENTORY, FINANCIAL | 41 |

---

## 📊 Funções por Categoria

### Análise e Detecção

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `analyzeMetricsAndGenerateAlerts()` | Analisa métricas e gera alertas | `CEOAlert[]` |
| `analyzeTrend()` | Analisa tendência de dados | `CEOTrendAnalysis` |
| `detectAnomaly()` | Detecta anomalias estatísticas | `CEOAnomalyDetection` |

### Gerenciamento de Alertas

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `getActiveAlerts()` | Obter alertas ativos | `CEOAlert[]` |
| `getAlertsByCategory()` | Filtrar por categoria | `CEOAlert[]` |
| `getAlertsBySeverity()` | Filtrar por severidade | `CEOAlert[]` |
| `getAlertHistory()` | Obter histórico | `CEOAlert[]` |
| `getAlertStatistics()` | Obter estatísticas | `CEOAlertStatistics` |

### Ações

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `acknowledgeAlert()` | Reconhecer alerta | `boolean` |
| `resolveAlert()` | Resolver alerta | `boolean` |
| `dismissAlert()` | Descartar alerta | `boolean` |
| `addAlert()` | Adicionar alerta | `void` |

### Regras

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `getRules()` | Listar regras | `CEOAlertRule[]` |
| `upsertRule()` | Criar/atualizar regra | `void` |
| `toggleRule()` | Ativar/desativar regra | `boolean` |
| `removeRule()` | Remover regra | `boolean` |

### Manutenção

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `cleanup()` | Limpar alertas expirados | `void` |
| `resetAllAlerts()` | Resetar todos (cautela!) | `void` |

---

## 🎯 Exemplos Rápidos

### 1. Uso Básico

```typescript
import CEOSmartAlertsService from './services/smart-alerts';

const service = CEOSmartAlertsService;

// Analisar métricas
const alerts = service.analyzeMetricsAndGenerateAlerts(
  { receita_total: 50000 },
  { receita_total: [100000, 95000, 90000, 85000] }
);

// Ver alertas ativos
const activeAlerts = service.getActiveAlerts();

// Estatísticas
const stats = service.getAlertStatistics();
```

### 2. Com Hook

```tsx
import { useSmartAlerts } from './hooks/useSmartAlerts';

function Component() {
  const { alerts, statistics, analyzeMetrics } = useSmartAlerts();
  
  // Usar...
}
```

### 3. Componente

```tsx
import { SmartAlertsPanel } from './components/SmartAlertsPanel';

<SmartAlertsPanel />
```

---

## 📝 Convenções de Nomenclatura

### Prefixos
- **CEO**: Todos os tipos e classes principais
- **use**: Hooks do React
- **Smart**: Contexto de alertas inteligentes

### Arquivos
- **PascalCase**: Componentes React (.tsx)
- **kebab-case**: Serviços (.ts)
- **UPPER_CASE**: Documentação (.md)

---

## 🔗 Links Úteis

### Documentação
- [Relatório Completo](./FASE_6_ALERTAS_INTELIGENTES_COMPLETO.md)
- [README Técnico](./services/smart-alerts.README.md)
- [Exemplos de Integração](./examples/AlertsIntegrationExample.tsx)

### Código
- [Serviço Principal](./services/smart-alerts.ts)
- [Hooks](./hooks/useSmartAlerts.ts)
- [Componentes](./components/)
- [Testes](./tests/smart-alerts.test.ts)

---

## 🚀 Como Começar

### 1. Ler Documentação
1. Comece com [FASE_6_ALERTAS_INTELIGENTES_COMPLETO.md](./FASE_6_ALERTAS_INTELIGENTES_COMPLETO.md)
2. Consulte [smart-alerts.README.md](./services/smart-alerts.README.md) para detalhes técnicos
3. Veja [AlertsIntegrationExample.tsx](./examples/AlertsIntegrationExample.tsx) para exemplos

### 2. Integrar na Dashboard
```tsx
// 1. Importar componentes
import { SmartAlertsPanel } from '@/app/(auth-routes)/dashboard-ceo/components/SmartAlertsPanel';
import { AlertNotifications } from '@/app/(auth-routes)/dashboard-ceo/components/AlertNotifications';

// 2. Usar na página
export default function DashboardCEO() {
  return (
    <>
      <AlertNotifications position="top-right" />
      <SmartAlertsPanel />
    </>
  );
}
```

### 3. Analisar Métricas
```tsx
import { useMetricsAnalysis } from '@/app/(auth-routes)/dashboard-ceo/hooks/useSmartAlerts';

function Dashboard() {
  const { analyzeMetrics } = useMetricsAnalysis();
  
  useEffect(() => {
    const analysis = analyzeMetrics(metrics, historicalData);
    console.log('Alertas gerados:', analysis.alerts);
  }, []);
}
```

---

## 📞 Suporte

### Problemas Comuns

**P: Componentes de UI não encontrados?**
R: Verifique se os imports apontam para `@/app/_components/ui/*`

**P: LocalStorage não funciona?**
R: Componente deve ser `'use client'`

**P: Alertas não aparecem?**
R: Verifique se as métricas atingem os thresholds das regras

**P: Como testar?**
R: Execute `npm test dashboard-ceo/tests/smart-alerts.test.ts`

---

## 📊 Estatísticas do Projeto

| Métrica | Valor |
|---------|-------|
| Total de Arquivos | 7 |
| Total de Linhas | ~3.500 |
| Componentes React | 5 |
| Hooks | 4 |
| Testes Unitários | 38 |
| Funções Públicas | 25+ |
| Tipos/Interfaces | 15+ |
| Regras Padrão | 6 |
| Exemplos | 8 |

---

## 🏆 Features Implementadas

- ✅ Alertas de Threshold
- ✅ Alertas de Tendência
- ✅ Detecção de Anomalias
- ✅ Alertas de Metas
- ✅ Sistema de Priorização
- ✅ Histórico com Resolução
- ✅ Regras Configuráveis
- ✅ Persistência Local
- ✅ Auto-refresh
- ✅ Notificações Toast
- ✅ Badges
- ✅ Estatísticas
- ✅ Filtros
- ✅ Testes
- ✅ Documentação
- ✅ Exemplos

---

**Última Atualização**: 2025-10-16  
**Versão**: 1.0.0  
**Status**: ✅ Completo e Pronto para Produção

