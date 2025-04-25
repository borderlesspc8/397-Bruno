# Sistema de Gerenciamento de Transações

Este documento descreve a nova arquitetura de gerenciamento de transações implementada no sistema ContaRápida, com o objetivo de garantir que todos os módulos da aplicação recebam informações de transações de forma consistente e em tempo real.

## Arquitetura

O sistema foi projetado seguindo princípios SOLID, principalmente o "Single Responsibility Principle" e o "Dependency Inversion Principle", resultando em uma arquitetura modular e desacoplada.

### Componentes Principais

![Diagrama de Arquitetura](https://via.placeholder.com/800x400?text=Diagrama+de+Arquitetura)

1. **TransactionStore (Zustand)**
   - Responsável pelo gerenciamento de estado global das transações
   - Armazena dados de transações, previsões de fluxo de caixa e metadados
   - Implementa métodos para adicionar, atualizar e remover transações
   - Fornece mecanismos de sincronização com o backend

2. **TransactionContext (React Context)**
   - Provê acesso fácil aos dados da TransactionStore para componentes React
   - Garante que qualquer componente na árvore possa acessar os dados de transações
   - Gerencia assinaturas de eventos para atualização em tempo real
   - Simplifica as operações de CRUD de transações

3. **Sistema de Eventos em Tempo Real**
   - Notifica os componentes quando ocorrem mudanças em transações
   - Utiliza tanto WebSockets quanto eventos DOM para maior compatibilidade
   - Garante consistência entre diferentes partes da aplicação

## Como Usar

### 1. Acessando Dados de Transações em Componentes

Para acessar dados de transações em qualquer componente, utilize o hook `useTransactionContext`:

```tsx
import { useTransactionContext } from '@/app/_hooks/transaction';

export function MeuComponente() {
  const { 
    transactions, 
    recentTransactions, 
    isLoading, 
    error 
  } = useTransactionContext();

  if (isLoading) return <p>Carregando...</p>;
  if (error) return <p>Erro: {error}</p>;

  return (
    <div>
      <h2>Transações Recentes</h2>
      <ul>
        {recentTransactions.map(transaction => (
          <li key={transaction.id}>{transaction.name} - {transaction.amount}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 2. Manipulando Transações

Para adicionar, atualizar ou remover transações, utilize os métodos fornecidos pelo contexto:

```tsx
import { useTransactionContext } from '@/app/_hooks/transaction';

export function FormularioTransacao() {
  const { addTransaction, updateTransaction, removeTransaction } = useTransactionContext();

  const handleSave = async (data) => {
    // Para uma nova transação
    addTransaction({
      id: 'temp-id-123', // Um ID temporário será substituído pelo backend
      name: data.name,
      amount: data.amount,
      date: data.date,
      type: data.type,
      // Outros campos...
    });

    // Ou para atualizar uma transação existente
    updateTransaction({
      id: 'existing-id-456',
      name: data.name,
      // Outros campos atualizados...
    });
  };

  const handleDelete = (id) => {
    removeTransaction(id);
  };

  // Resto do componente...
}
```

### 3. Reagindo a Mudanças em Transações

Para reagir a mudanças em transações (por exemplo, para atualizar visualizações):

```tsx
import { useTransactionContext } from '@/app/_hooks/transaction';
import { useEffect, useState } from 'react';

export function DashboardSummary() {
  const { transactions, lastUpdated } = useTransactionContext();
  const [summary, setSummary] = useState({ total: 0, income: 0, expense: 0 });

  // Recalcular o resumo sempre que as transações mudarem
  useEffect(() => {
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    
    setSummary({
      total: income - expense,
      income,
      expense
    });
  }, [transactions, lastUpdated]);

  return (
    <div>
      <h2>Resumo</h2>
      <p>Receitas: {summary.income}</p>
      <p>Despesas: {summary.expense}</p>
      <p>Total: {summary.total}</p>
      <p>Última atualização: {lastUpdated?.toLocaleString()}</p>
    </div>
  );
}
```

## Benefícios e Vantagens

1. **Consistência de Dados**: Todos os componentes visualizam o mesmo estado de transações.

2. **Otimização de Performance**: 
   - Dados são armazenados em cache para acesso rápido
   - Componentes só renderizam novamente quando necessário

3. **Experiência do Usuário Melhorada**:
   - Feedback imediato para ações do usuário
   - Atualizações em tempo real sem refresh da página

4. **Simplicidade de Desenvolvimento**:
   - Acesso centralizado aos dados de transações
   - Redução de código duplicado em diferentes componentes

5. **Manutenção Simplificada**:
   - Lógica de manipulação de transações em um único lugar
   - Facilidade para adicionar novos recursos

## Considerações Técnicas

### Cache e Persistência

A TransactionStore utiliza o middleware Zustand `persist` para armazenar localmente algumas informações, como transações recentes, melhorando a performance percebida pelo usuário ao navegar entre páginas.

### Tipos e Interfaces

Todos os dados são fortemente tipados, aproveitando o TypeScript para maior segurança e completude de código:

```typescript
// Exemplo de tipos principais
interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: Date;
  type: TransactionType;
  // ...outros campos
}

enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
  // ...outros tipos
}
```

### Integração com Serviços Backend

O sistema foi projetado para trabalhar perfeitamente com os serviços backend existentes:

1. As alterações locais são imediatamente refletidas na UI
2. Os dados são persistidos no backend através de chamadas API
3. Atualizações do backend são recebidas via WebSockets/SSE em tempo real

## Conclusão

Esta nova arquitetura de gerenciamento de transações garante que todos os módulos da aplicação recebam informações de transações de forma eficiente e consistente, melhorando tanto a experiência do usuário quanto a facilidade de desenvolvimento.

Para qualquer dúvida ou sugestão, entre em contato com a equipe de desenvolvimento.

---

Última atualização: Abril de 2024 