# Sistema de Alertas Inteligentes - Dashboard CEO

## 📋 Visão Geral

Sistema completo de alertas inteligentes para monitoramento em tempo real de métricas críticas do negócio. Detecta anomalias, tendências preocupantes, metas não atingidas e valores fora de thresholds definidos.

## 🎯 Funcionalidades

### 1. Tipos de Alertas

- **Threshold**: Valores que ultrapassam limites definidos
- **Tendência**: Mudanças significativas ao longo do tempo
- **Anomalia**: Valores estatisticamente anormais
- **Meta**: Objetivos não atingidos
- **Crítico**: Situações que requerem ação imediata

### 2. Níveis de Severidade

- **CRITICAL**: Requer ação imediata (vermelho)
- **HIGH**: Requer atenção urgente (laranja)
- **MEDIUM**: Requer atenção (amarelo)
- **LOW**: Monitoramento recomendado (azul)
- **INFO**: Apenas informação (cinza)

### 3. Categorias de Alertas

- Revenue (Receita)
- Costs (Custos)
- Profit (Lucro)
- Cash Flow (Fluxo de Caixa)
- Customers (Clientes)
- Operations (Operações)
- Marketing
- Inventory (Estoque)
- Financial (Financeiro)

## 🚀 Como Usar

### Uso Básico com Hook

```tsx
import { useSmartAlerts } from '../hooks/useSmartAlerts';

function MyComponent() {
  const {
    alerts,
    statistics,
    loading,
    analyzeMetrics,
    acknowledgeAlert,
    resolveAlert
  } = useSmartAlerts({
    autoRefresh: true,
    refreshInterval: 60000 // 1 minuto
  });

  // Analisar métricas e gerar alertas
  const handleAnalyze = () => {
    const metrics = {
      receita_total: 50000,
      margem_lucro: 15,
      cac: 250
    };

    const historicalData = {
      receita_total: [100000, 95000, 85000, 75000, 65000, 55000, 50000],
      margem_lucro: [25, 24, 23, 20, 18, 16, 15]
    };

    const newAlerts = analyzeMetrics(metrics, historicalData);
    console.log(`${newAlerts.length} novos alertas gerados`);
  };

  // Reconhecer alerta
  const handleAcknowledge = async (alertId: string) => {
    await acknowledgeAlert(alertId, 'user123');
  };

  // Resolver alerta
  const handleResolve = async (alertId: string) => {
    await resolveAlert(alertId, 'user123', 'Problema corrigido');
  };

  return (
    <div>
      {alerts.map(alert => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onAcknowledge={() => handleAcknowledge(alert.id)}
          onResolve={() => handleResolve(alert.id)}
        />
      ))}
    </div>
  );
}
```

### Uso Direto do Serviço

```typescript
import CEOSmartAlertsService from '../services/smart-alerts';

// Obter instância
const alertService = CEOSmartAlertsService;

// Analisar métricas
const metrics = {
  receita_total: 50000,
  margem_lucro: 15
};

const historicalData = {
  receita_total: [100000, 95000, 85000, 75000],
  margem_lucro: [25, 23, 20, 18]
};

const alerts = alertService.analyzeMetricsAndGenerateAlerts(metrics, historicalData);

// Obter alertas ativos
const activeAlerts = alertService.getActiveAlerts();

// Filtrar por categoria
const revenueAlerts = alertService.getAlertsByCategory(CEOAlertCategory.REVENUE);

// Filtrar por severidade
const criticalAlerts = alertService.getAlertsBySeverity(CEOAlertSeverity.CRITICAL);

// Estatísticas
const stats = alertService.getAlertStatistics();
console.log(`Total de alertas: ${stats.total}`);
console.log(`Alertas críticos: ${stats.criticalUnresolved}`);
console.log(`Tempo médio de resolução: ${stats.averageResolutionTime}h`);
```

### Análise de Tendências

```typescript
import CEOSmartAlertsService from '../services/smart-alerts';

const alertService = CEOSmartAlertsService;

// Dados históricos de receita
const revenueData = [100000, 110000, 105000, 115000, 125000, 130000];

// Analisar tendência
const trend = alertService.analyzeTrend(revenueData);

console.log(`Direção: ${trend.direction}`); // 'up', 'down', 'stable'
console.log(`Mudança: ${trend.changePercentage}%`);
console.log(`Significância: ${trend.significance}`); // 'high', 'medium', 'low'
console.log(`Confiança: ${trend.confidence}`); // 0-1
```

### Detecção de Anomalias

```typescript
import CEOSmartAlertsService from '../services/smart-alerts';

const alertService = CEOSmartAlertsService;

// Dados históricos de CAC
const cacHistory = [200, 210, 195, 205, 200, 198, 202];

// Valor atual anormal
const currentCAC = 450;

// Detectar anomalia (sensibilidade 1-10)
const anomaly = alertService.detectAnomaly(currentCAC, cacHistory, 7);

if (anomaly.isAnomaly) {
  console.log(`⚠️ Anomalia detectada!`);
  console.log(`Score: ${anomaly.score}/100`);
  console.log(`Esperado: ${anomaly.expectedValue}`);
  console.log(`Real: ${anomaly.actualValue}`);
  console.log(`Desvio: ${anomaly.deviationPercentage}%`);
  console.log(`Confiança: ${(anomaly.confidence * 100)}%`);
}
```

### Gerenciar Regras de Alertas

```typescript
import CEOSmartAlertsService, { CEOAlertCategory } from '../services/smart-alerts';

const alertService = CEOSmartAlertsService;

// Listar regras
const rules = alertService.getRules();

// Criar nova regra
const newRule = {
  id: 'low-inventory',
  name: 'Estoque Baixo',
  category: CEOAlertCategory.INVENTORY,
  metric: 'estoque_total',
  enabled: true,
  thresholds: {
    critical: 100,  // Menos de 100 unidades
    high: 200,
    medium: 500,
    low: 1000
  },
  trendConfig: {
    enabled: true,
    period: 14,
    minChange: -20
  },
  anomalyConfig: {
    enabled: true,
    sensitivity: 6,
    lookbackPeriod: 30
  }
};

alertService.upsertRule(newRule);

// Desabilitar regra temporariamente
alertService.toggleRule('low-inventory', false);

// Reabilitar regra
alertService.toggleRule('low-inventory', true);
```

### Hook de Alertas Críticos

```tsx
import { useCriticalAlerts } from '../hooks/useSmartAlerts';

function CriticalAlertsWidget() {
  const {
    criticalAlerts,
    criticalCount,
    hasCriticalAlerts
  } = useCriticalAlerts();

  if (!hasCriticalAlerts) {
    return <div>✅ Nenhum alerta crítico</div>;
  }

  return (
    <div className="critical-alerts">
      <h3>⚠️ {criticalCount} Alertas Críticos</h3>
      {criticalAlerts.map(alert => (
        <div key={alert.id}>{alert.title}</div>
      ))}
    </div>
  );
}
```

### Hook de Análise de Métricas

```tsx
import { useMetricsAnalysis } from '../hooks/useSmartAlerts';

function MetricsAnalyzer() {
  const { analyzeMetrics } = useMetricsAnalysis();

  const handleAnalyze = () => {
    const metrics = {
      receita_total: 85000,
      margem_lucro: 22,
      cac: 180
    };

    const historicalData = {
      receita_total: [100000, 98000, 95000, 90000, 88000],
      margem_lucro: [25, 24, 23, 23, 22],
      cac: [150, 160, 165, 170, 180]
    };

    const analysis = analyzeMetrics(metrics, historicalData);

    console.log('Alertas gerados:', analysis.alerts);
    console.log('Tem problemas?', analysis.hasIssues);
    console.log('Tem críticos?', analysis.hasCriticalIssues);
    console.log('Tendências:', analysis.trends);
    console.log('Anomalias:', analysis.anomalies);
  };

  return <button onClick={handleAnalyze}>Analisar Métricas</button>;
}
```

## 🎨 Componentes de UI

### SmartAlertsPanel

Painel completo de alertas com filtros, estatísticas e ações.

```tsx
import { SmartAlertsPanel } from '../components/SmartAlertsPanel';

function Dashboard() {
  return (
    <SmartAlertsPanel
      onAlertClick={(alert) => console.log('Alerta clicado:', alert)}
    />
  );
}
```

### AlertNotifications

Notificações toast para alertas críticos.

```tsx
import { AlertNotifications } from '../components/AlertNotifications';

function App() {
  return (
    <>
      <AlertNotifications
        position="top-right"
        maxVisible={3}
        autoHideDuration={10000}
        soundEnabled={true}
      />
      {/* Resto da aplicação */}
    </>
  );
}
```

### CriticalAlertsBadge

Badge com contador de alertas críticos.

```tsx
import { CriticalAlertsBadge } from '../components/AlertNotifications';

function Header() {
  return (
    <div className="header">
      <CriticalAlertsBadge onClick={() => navigateToAlerts()} />
    </div>
  );
}
```

### CriticalAlertsBar

Barra de alerta discreta no topo.

```tsx
import { CriticalAlertsBar } from '../components/AlertNotifications';

function Dashboard() {
  return (
    <div>
      <CriticalAlertsBar onViewAll={() => setShowAlerts(true)} />
      {/* Conteúdo da dashboard */}
    </div>
  );
}
```

## 📊 Exemplos de Análise

### Exemplo 1: Monitoramento de Receita

```typescript
// Métricas atuais
const metrics = {
  receita_total: 75000 // Meta: 100.000
};

// Histórico dos últimos 7 dias
const historicalData = {
  receita_total: [100000, 98000, 95000, 90000, 85000, 80000, 75000]
};

// Analisar
const alerts = alertService.analyzeMetricsAndGenerateAlerts(metrics, historicalData);

// Resultado:
// ✅ Alerta de Threshold: Receita abaixo da meta
// ✅ Alerta de Tendência: Receita em queda de 25% em 7 dias
// ✅ Alerta de Meta: Apenas 75% da meta atingida
```

### Exemplo 2: Detecção de Anomalia em CAC

```typescript
const cacHistory = [150, 160, 155, 165, 158, 162, 157]; // CAC estável
const currentCAC = 450; // CAC anormalmente alto

const anomaly = alertService.detectAnomaly(currentCAC, cacHistory, 7);

// Resultado:
// {
//   isAnomaly: true,
//   score: 95,
//   expectedValue: 159.57,
//   actualValue: 450,
//   deviation: 290.43,
//   deviationPercentage: 182%,
//   confidence: 0.95
// }
```

### Exemplo 3: Análise Completa de Dashboard

```typescript
const dashboardMetrics = {
  receita_total: 85000,
  margem_lucro: 18,
  saldo_caixa: 8000,
  cac: 280,
  churn_rate: 6,
  eficiencia_operacional: 72
};

const historicalData = {
  receita_total: [100000, 98000, 95000, 92000, 88000, 86000, 85000],
  margem_lucro: [25, 24, 23, 21, 20, 19, 18],
  saldo_caixa: [50000, 40000, 30000, 20000, 15000, 10000, 8000],
  cac: [200, 210, 225, 240, 255, 270, 280],
  churn_rate: [3, 3.5, 4, 4.5, 5, 5.5, 6],
  eficiencia_operacional: [85, 83, 80, 78, 76, 74, 72]
};

const alerts = alertService.analyzeMetricsAndGenerateAlerts(
  dashboardMetrics,
  historicalData
);

// Resultado: 10+ alertas categorizados por severidade e tipo
// - 3 Críticos (caixa baixo, margem caindo, churn alto)
// - 4 Altos (receita em queda, CAC subindo)
// - 3 Médios (eficiência operacional caindo)
```

## ⚙️ Configuração Avançada

### Ajustar Sensibilidade de Anomalia

```typescript
// Baixa sensibilidade (1-3): Detecta apenas anomalias muito grandes
const conservativeAnomaly = alertService.detectAnomaly(value, history, 2);

// Média sensibilidade (4-6): Balanceado
const balancedAnomaly = alertService.detectAnomaly(value, history, 5);

// Alta sensibilidade (7-10): Detecta anomalias menores
const sensitiveAnomaly = alertService.detectAnomaly(value, history, 9);
```

### Personalizar Thresholds

```typescript
const customRule = {
  id: 'custom-profit',
  name: 'Margem de Lucro Customizada',
  category: CEOAlertCategory.PROFIT,
  metric: 'margem_lucro',
  enabled: true,
  thresholds: {
    critical: 5,   // < 5% = crítico
    high: 10,      // < 10% = alto
    medium: 15,    // < 15% = médio
    low: 20        // < 20% = baixo
  }
};

alertService.upsertRule(customRule);
```

### Callbacks e Notificações

```tsx
function DashboardWithAlerts() {
  const { alerts } = useSmartAlerts({
    autoRefresh: true,
    refreshInterval: 30000,
    onNewAlert: (alert) => {
      // Notificar quando novo alerta é criado
      console.log('🚨 Novo alerta:', alert.title);
      
      if (alert.severity === CEOAlertSeverity.CRITICAL) {
        // Enviar notificação push
        sendPushNotification(alert);
        
        // Tocar som
        playAlertSound();
        
        // Enviar email
        sendEmailAlert(alert);
      }
    },
    onAlertResolved: (alert) => {
      // Notificar quando alerta é resolvido
      console.log('✅ Alerta resolvido:', alert.title);
      showSuccessToast('Alerta resolvido com sucesso!');
    }
  });

  return <SmartAlertsPanel />;
}
```

## 🧪 Testes

Os testes cobrem:

- ✅ Análise de tendências
- ✅ Detecção de anomalias
- ✅ Geração de alertas
- ✅ Gerenciamento de alertas
- ✅ Estatísticas
- ✅ Regras customizadas
- ✅ Validação de dados
- ✅ Limpeza e manutenção

Execute os testes:

```bash
npm test dashboard-ceo/tests/smart-alerts.test.ts
```

## 📝 Melhores Práticas

1. **Análise Regular**: Execute análise de métricas a cada 1-5 minutos
2. **Sensibilidade**: Ajuste baseado em volatilidade dos seus dados
3. **Histórico**: Use pelo menos 7-30 dias de dados históricos
4. **Resolução**: Sempre adicione notas ao resolver alertas
5. **Limpeza**: Execute cleanup() periodicamente (diariamente)
6. **Monitoramento**: Monitore estatísticas de alertas regularmente

## 🔒 Isolamento

Este sistema é **100% isolado** da Dashboard CEO:

- ✅ Não utiliza serviços externos
- ✅ Não modifica código de outras dashboards
- ✅ Armazenamento local independente
- ✅ Prefixos CEO em todas as classes
- ✅ Tipos e interfaces isolados

## 📚 Referências

- Análise de Tendências: Regressão Linear Simples
- Detecção de Anomalias: Z-Score Modificado
- Priorização: Algoritmo de Severidade Ponderada
- Estatísticas: Média Móvel e Desvio Padrão

## 🆘 Suporte

Para problemas ou dúvidas:

1. Verifique os testes para exemplos de uso
2. Consulte os tipos TypeScript para interface completa
3. Revise o código do serviço para detalhes de implementação

---

**Desenvolvido exclusivamente para Dashboard CEO - Sistema Isolado**

