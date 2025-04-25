# Módulo de Orçamentos - Conta Rápida

## Visão Geral

O Módulo de Orçamentos permite aos usuários definir e monitorar limites de gastos por categoria durante períodos específicos. O sistema oferece visualizações claras do progresso, comparações entre valores planejados e reais, e alertas quando os limites são aproximados ou excedidos.

## Funcionalidades Principais

- **Orçamentos por Categoria**: Definição de limites de gastos para categorias específicas
- **Orçamento Global**: Visão geral dos gastos totais planejados vs. realizados
- **Períodos Customizáveis**: Orçamentos mensais, trimestrais ou anuais
- **Recorrência**: Configuração de orçamentos recorrentes
- **Progresso Visual**: Visualização clara do progresso em cada categoria
- **Alertas**: Notificações quando limites são aproximados ou excedidos
- **Análise Comparativa**: Visualização de gastos reais vs. planejados

## Estrutura do Módulo

### Páginas

- **`/budgets`**: Página principal que lista todos os orçamentos do usuário
- **`/budgets/new`**: Formulário para criar um novo orçamento
- **`/budgets/[id]`**: Página de detalhes de um orçamento específico
- **`/budgets/[id]/edit`**: Página para editar um orçamento existente

### Componentes

- **`BudgetsList`**: Lista todos os orçamentos ativos
- **`BudgetCard`**: Card que exibe informações resumidas de um orçamento
- **`BudgetForm`**: Formulário para criação/edição de orçamentos
- **`BudgetCategorySelector`**: Seletor de categorias para orçamento
- **`BudgetCategoryItem`**: Item para definir orçamento de categoria específica
- **`BudgetProgress`**: Barra de progresso para acompanhamento de orçamento
- **`BudgetCategoryProgress`**: Progresso específico por categoria
- **`BudgetMonthlyChart`**: Gráfico de gastos mensais vs. orçamento
- **`BudgetAlert`**: Alerta para limites próximos ou excedidos

### API Endpoints

- **`GET /api/budgets`**: Retorna a lista de orçamentos do usuário
- **`POST /api/budgets`**: Cria um novo orçamento
- **`GET /api/budgets/[id]`**: Obtém detalhes de um orçamento específico
- **`PATCH /api/budgets/[id]`**: Atualiza um orçamento existente
- **`DELETE /api/budgets/[id]`**: Remove um orçamento
- **`GET /api/budgets/[id]/progress`**: Obtém o progresso atual do orçamento

## Modelo de Dados

O módulo utiliza os seguintes modelos do Prisma:

### Budget

```prisma
model Budget {
  id               String         @id @default(cuid())
  userId           String
  name             String
  description      String?
  startDate        DateTime
  endDate          DateTime
  isRecurring      Boolean        @default(false)
  recurringPeriod  RecurringPeriod?
  totalAmount      Float?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  categories       BudgetCategory[]

  @@index([userId])
}
```

### BudgetCategory

```prisma
model BudgetCategory {
  id               String         @id @default(cuid())
  budgetId         String
  categoryName     String
  plannedAmount    Float
  
  budget           Budget         @relation(fields: [budgetId], references: [id], onDelete: Cascade)

  @@index([budgetId])
}
```

### Enums

```prisma
enum RecurringPeriod {
  MONTHLY
  QUARTERLY
  YEARLY
}
```

## Como Usar

### Criando um Novo Orçamento

1. Acesse a página `/budgets`
2. Clique no botão "Novo Orçamento"
3. Preencha os campos obrigatórios:
   - Nome do Orçamento
   - Período (Data Início e Data Fim)
   - Categorias e Valores Planejados
4. Configure a recorrência, se desejada
5. Clique em "Criar Orçamento"

### Monitorando o Progresso

1. Acesse a página de detalhes do orçamento (`/budgets/[id]`)
2. Visualize o progresso geral e por categoria
3. Verifique gráficos comparativos
4. Observe alertas para categorias que estejam próximas ou excedendo os limites

### Editando um Orçamento

1. Acesse a página de detalhes do orçamento (`/budgets/[id]`)
2. Clique no botão "Editar"
3. Modifique os campos desejados
4. Clique em "Salvar"

## Cálculo do Progresso

O sistema calcula o progresso do orçamento da seguinte forma:

1. Para cada categoria, as transações do período são filtradas e somadas
2. O valor gasto é comparado com o valor planejado para determinar o percentual de uso
3. Alertas são gerados quando o uso atinge 80% ou excede 100% do valor planejado
4. O progresso geral é calculado considerando todas as categorias ponderadas por seus valores planejados

## Integrações com Outros Módulos

### Transações

- As transações são automaticamente associadas às categorias de orçamento
- Novas transações atualizam o progresso do orçamento em tempo real

### Dashboard

- Widgets de orçamento são exibidos no dashboard principal
- Alertas de orçamento aparecem em áreas de destaque

### Metas Financeiras

- Orçamentos podem ser vinculados a metas específicas
- Economias em categorias podem ser direcionadas para metas financeiras

## Considerações Técnicas

- O cálculo de progresso de orçamento é realizado sob demanda para garantir dados atualizados
- Transações são indexadas por data e categoria para otimizar consultas de orçamento
- Orçamentos recorrentes são clonados automaticamente ao final do período

## Melhorias Futuras

- Implementar previsão de gastos baseada em tendências históricas
- Adicionar recomendações inteligentes para ajuste de orçamento
- Implementar suporte a sub-categorias para orçamento mais detalhado
- Adicionar opção de compartilhamento de orçamento entre usuários
- Implementar notificações por email/push quando limites são excedidos 