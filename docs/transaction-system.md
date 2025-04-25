# Sistema Centralizado de Gestão de Transações - ContaRápida

## Introdução

O Sistema Centralizado de Gestão de Transações é uma arquitetura que permite o compartilhamento e reutilização dos dados de transações financeiras em toda a aplicação, seguindo o princípio DRY (Don't Repeat Yourself). Este documento descreve a arquitetura, componentes e como utilizá-los em diferentes partes da aplicação.

## Arquitetura

O sistema utiliza o padrão Context API do React para compartilhar dados entre componentes sem a necessidade de prop drilling. A arquitetura é composta por:

1. **Providers**: Componentes que encapsulam a lógica de negócios e fornecem acesso aos dados.
2. **Hooks**: Funções personalizadas que facilitam o acesso e manipulação dos dados.
3. **Types**: Definições de tipos que garantem consistência nos dados.

### Diagrama de Componentes

```
TransactionProvider (app/protected-layout.tsx)
├── useTransactionContext (hook básico)
│   └── useDashboardTransactions (hook específico para dashboard)
│       ├── BasicMetrics (componente)
│       ├── ExpenseCategories (componente)
│       └── RecentTransactions (componente)
└── Outros hooks específicos
```

## Componentes Principais

### TransactionProvider

Responsável por:
- Carregar dados de transações
- Gerenciar o estado de carregamento e erros
- Fornecer métodos para adicionar, atualizar e remover transações
- Sincronizar dados com backend

### Hooks

#### useTransactionContext

Hook básico que dá acesso direto ao contexto de transações:

```typescript
const { 
  transactions, 
  isLoading, 
  error,
  addTransaction,
  updateTransaction,
  deleteTransaction
} = useTransactionContext();
```

#### useDashboardTransactions

Hook especializado para processar dados para o dashboard:

```typescript
const { 
  totalIncome,
  totalExpenses,
  balance,
  expensesByCategory,
  recentTransactions,
  filteredTransactions,
  formatCurrency,
  loading,
  error
} = useDashboardTransactions(month, year);
```

## Componentes de Visualização

### BasicMetrics

Exibe os totais de receitas, despesas e saldo, além de uma barra de progresso de gastos.

### ExpenseCategories

Mostra as categorias de despesas com seus valores e percentuais.

### RecentTransactions

Lista as transações mais recentes com links para seus detalhes.

## Como Utilizar

### 1. Adicionar o Provider

O `TransactionProvider` deve envolver os componentes que precisam acessar os dados de transações. Na nossa aplicação, ele está no `ProtectedLayout`:

```tsx
// app/protected-layout.tsx
export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return (
    <TransactionProvider>
      <SocketProvider>
        {children}
      </SocketProvider>
    </TransactionProvider>
  );
}
```

### 2. Utilizar os Hooks em Componentes

Para acessar os dados de transações em qualquer componente:

```tsx
import { useTransactionContext } from "@/app/_hooks/transaction";

function MyComponent() {
  const { transactions } = useTransactionContext();
  
  return (
    <div>
      Total de transações: {transactions.length}
    </div>
  );
}
```

Para dados específicos do dashboard:

```tsx
import { useDashboardTransactions } from "@/app/_hooks/transaction";

function DashboardComponent({ month, year }) {
  const { totalIncome, totalExpenses, balance } = useDashboardTransactions(month, year);
  
  return (
    <div>
      Saldo: {balance}
    </div>
  );
}
```

### 3. Componentes Modulares

Utilize os componentes modulares para exibir dados específicos:

```tsx
<BasicMetrics month={month} year={year} />
<ExpenseCategories month={month} year={year} />
<RecentTransactions month={month} year={year} />
```

## Benefícios

1. **Consistência**: Os mesmos dados são utilizados em toda a aplicação.
2. **Desempenho**: Os dados são carregados uma única vez e compartilhados.
3. **Manutenção**: Alterações na lógica de negócios são feitas em um único local.
4. **Reutilização**: Os mesmos hooks e componentes podem ser utilizados em diferentes partes da aplicação.
5. **Modularidade**: Cada componente tem uma responsabilidade única e bem definida.

## Exemplos de Uso

### Dashboard

O dashboard utiliza o hook `useDashboardTransactions` para exibir:
- Métricas básicas (receitas, despesas, saldo)
- Categorias de despesas
- Transações recentes

### Relatórios

Os relatórios podem usar o mesmo hook para exibir dados filtrados por período.

### Perfil do Usuário

O perfil do usuário pode exibir estatísticas pessoais usando o mesmo sistema.

## Considerações Futuras

- **Paginação**: Implementar paginação para melhorar o desempenho com grandes volumes de dados.
- **Filtros Avançados**: Adicionar filtros por categoria, tipo, valor, etc.
- **Exportação**: Permitir exportação de relatórios em diferentes formatos.
- **Sincronização em Tempo Real**: Integrar com WebSockets para atualizar dados em tempo real.

## Conclusão

O Sistema Centralizado de Gestão de Transações oferece uma solução robusta e escalável para gerenciar dados de transações financeiras em toda a aplicação. Ao seguir os princípios de modularidade e reutilização, conseguimos reduzir a duplicação de código e melhorar a manutenibilidade do projeto. 