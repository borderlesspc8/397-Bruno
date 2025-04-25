# Módulo de Metas Financeiras - Conta Rápida

## Visão Geral

O Módulo de Metas Financeiras permite aos usuários criar, visualizar, editar e gerenciar objetivos financeiros personalizados. O sistema oferece recursos para definir metas com valores específicos, categorias, prazos e acompanhar o progresso através de contribuições.

## Funcionalidades Principais

- **Listagem de Metas**: Visualização de todas as metas financeiras do usuário em formato de cards
- **Detalhes da Meta**: Página dedicada com informações detalhadas sobre cada meta 
- **Criação de Meta**: Formulário para adicionar novas metas com diversos campos de personalização
- **Edição de Meta**: Possibilidade de modificar metas existentes
- **Exclusão de Meta**: Opção para remover metas não desejadas
- **Contribuições**: Sistema para adicionar e rastrear contribuições para cada meta
- **Progresso Visual**: Exibição gráfica do progresso em direção ao objetivo financeiro

## Estrutura do Módulo

### Páginas

- **`/goals`**: Página principal que lista todas as metas do usuário
- **`/goals/new`**: Formulário para criar uma nova meta
- **`/goals/[id]`**: Página de detalhes de uma meta específica
- **`/goals/[id]/edit`**: Página para editar uma meta existente
- **`/goals/[id]/contribute`**: Página para adicionar uma contribuição a uma meta

### Componentes

- **`GoalCard`**: Card que exibe uma meta na listagem principal
- **`GoalDetails`**: Exibe detalhes completos de uma meta específica
- **`NewGoalForm`**: Formulário para criação de nova meta
- **`EditGoalForm`**: Formulário para edição de meta existente
- **`ContributeForm`**: Formulário para adicionar contribuições a uma meta
- **`GoalContributions`**: Exibe o histórico de contribuições de uma meta

### API Endpoints

- **`GET /api/goals`**: Retorna a lista de metas do usuário
- **`POST /api/goals`**: Cria uma nova meta
- **`PATCH /api/goals/[id]`**: Atualiza uma meta existente
- **`DELETE /api/goals/[id]`**: Remove uma meta
- **`POST /api/goals/[id]/contribute`**: Adiciona uma contribuição à meta
- **`GET /api/goals/[id]/contribute`**: Retorna o histórico de contribuições

## Modelo de Dados

O módulo utiliza os seguintes modelos do Prisma:

### FinancialGoal

```prisma
model FinancialGoal {
  id               String             @id @default(cuid())
  userId           String
  title            String
  description      String?
  targetAmount     Float
  currentAmount    Float              @default(0)
  category         GoalCategory
  startDate        DateTime           @default(now())
  targetDate       DateTime
  status           GoalStatus         @default(IN_PROGRESS)
  walletId         String?
  colorAccent      String?            @default("#4F46E5")
  iconName         String?            @default("target")
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  
  user             User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  wallet           Wallet?            @relation(fields: [walletId], references: [id])
  contributions    GoalContribution[]

  @@index([userId])
  @@index([walletId])
}
```

### GoalContribution

```prisma
model GoalContribution {
  id               String        @id @default(cuid())
  goalId           String
  amount           Float
  date             DateTime      @default(now())
  note             String?
  transactionId    String?
  createdAt        DateTime      @default(now())
  
  goal             FinancialGoal @relation(fields: [goalId], references: [id], onDelete: Cascade)

  @@index([goalId])
}
```

### Enums

```prisma
enum GoalCategory {
  EMERGENCY_FUND
  RETIREMENT
  VACATION
  EDUCATION
  HOME
  CAR
  WEDDING
  DEBT_PAYMENT
  INVESTMENT
  OTHER
}

enum GoalStatus {
  IN_PROGRESS
  COMPLETED
  CANCELED
  OVERDUE
}
```

## Como Usar

### Criando uma Nova Meta

1. Acesse a página `/goals`
2. Clique no botão "Nova Meta"
3. Preencha os campos obrigatórios:
   - Título da Meta
   - Valor da Meta
   - Categoria
   - Data Alvo
4. Preencha os campos opcionais se desejar:
   - Descrição
5. Clique em "Criar Meta"

### Editando uma Meta

1. Acesse a página de detalhes da meta (`/goals/[id]`)
2. Clique no botão "Editar"
3. Modifique os campos desejados
4. Clique em "Salvar"

### Adicionando uma Contribuição

1. Acesse a página de detalhes da meta (`/goals/[id]`)
2. Clique no botão "Adicionar Contribuição"
3. Preencha o valor da contribuição
4. Selecione a data
5. Adicione uma observação opcional
6. Clique em "Adicionar Contribuição"

### Excluindo uma Meta

1. Acesse a página de detalhes da meta (`/goals/[id]`)
2. Clique no botão "Excluir"
3. Confirme a exclusão no diálogo de confirmação

## Fluxo de Dados

1. O usuário cria uma meta com valor alvo, categoria e data
2. A meta é armazenada no banco de dados com status "EM_PROGRESSO" e valor atual zero
3. O usuário adiciona contribuições para a meta ao longo do tempo
4. Cada contribuição incrementa o valor atual da meta
5. Quando o valor atual atinge ou ultrapassa o valor alvo, o status da meta é atualizado para "COMPLETED"
6. O usuário pode visualizar seu progresso através de barras de progresso e porcentagens

## Considerações Técnicas

- Todas as páginas do módulo são protegidas por autenticação
- A validação de dados é realizada tanto no cliente quanto no servidor usando Zod
- Os valores monetários são formatados de acordo com o padrão brasileiro (R$)
- O módulo utiliza prisma para interações com o banco de dados
- Transações são utilizadas ao adicionar contribuições para garantir a integridade dos dados

## Melhorias Futuras

- Implementar notificações quando uma meta estiver próxima da conclusão
- Adicionar opção para vincular transações a contribuições
- Implementar categorias personalizadas
- Adicionar recursos de compartilhamento de metas
- Implementar relatórios e estatísticas sobre as metas
- Adicionar previsões baseadas no ritmo atual de contribuições 