# Roadmap de Desenvolvimento - Conta Rápida

## Visão Geral

Este documento descreve os próximos passos e módulos planejados para a evolução do aplicativo Conta Rápida. Ele serve como guia para o desenvolvimento futuro e ajuda a manter o foco nas prioridades estabelecidas.

## Módulos Implementados

- ✅ **Core da Aplicação**: Next.js 14, autenticação, banco de dados, UI/UX
- ✅ **Integração Bancária**: API do Banco do Brasil, OAuth 2.0, tratamento de erros
- ✅ **Gerenciamento de Carteiras**: Múltiplas carteiras, saldos em tempo real
- ✅ **Gerenciamento de Transações**: CRUD, categorização, busca avançada
- ✅ **Dashboard Financeiro**: Visão geral, gráficos, tendências
- ✅ **Perfil de Usuário**: Página completa, customização, segurança
- ✅ **Categorização Automática**: Regras, padrões, priorização
- ✅ **Importação/Exportação**: Suporte para CSV, OFX, Excel, PDF
- ✅ **Metas Financeiras**: Definição de metas, contribuições, progresso

## Próximos Módulos (Prioridade)

### 1. Sistema de Orçamentos (Próxima Implementação)

O Sistema de Orçamentos permitirá aos usuários definir e gerenciar limites de gastos por categoria e período, fornecendo ferramentas para monitorar aderência ao orçamento e receber alertas quando se aproximarem dos limites estabelecidos.

#### Funcionalidades

- **Orçamento por Categoria**: Definição de limites de gastos para cada categoria
- **Períodos Customizáveis**: Suporte para orçamentos mensais, trimestrais ou anuais
- **Planejado vs. Realizado**: Comparação visual entre gastos orçados e realizados
- **Alertas**: Notificações quando o usuário se aproximar ou ultrapassar limites
- **Recorrência**: Configuração de orçamentos recorrentes

#### Componentes e Páginas

- **BudgetsList**: Listagem de todos os orçamentos ativos
- **BudgetDetails**: Detalhes e progresso de um orçamento específico
- **BudgetForm**: Formulário para criar/editar orçamentos
- **BudgetCategorySelector**: Seletor de categorias para orçamento
- **BudgetProgressBar**: Componente visual de progresso do orçamento
- **BudgetAlert**: Componente de alerta para limites próximos/excedidos

#### Modelos de Dados

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

model BudgetCategory {
  id               String         @id @default(cuid())
  budgetId         String
  categoryName     String
  plannedAmount    Float
  
  budget           Budget         @relation(fields: [budgetId], references: [id], onDelete: Cascade)

  @@index([budgetId])
}

enum RecurringPeriod {
  MONTHLY
  QUARTERLY
  YEARLY
}
```

#### API Endpoints

- **GET /api/budgets**: Listar orçamentos do usuário
- **POST /api/budgets**: Criar novo orçamento
- **GET /api/budgets/:id**: Obter detalhes de um orçamento específico
- **PATCH /api/budgets/:id**: Atualizar orçamento existente
- **DELETE /api/budgets/:id**: Excluir orçamento
- **GET /api/budgets/:id/progress**: Obter progresso atual do orçamento

#### Integrações

- **Transações**: Associar transações a categorias orçamentárias
- **Dashboard**: Adicionar widgets e gráficos de orçamento
- **Metas Financeiras**: Coordenar metas com orçamento disponível

### 2. Sistema de Relatórios Avançados

Um sistema completo para geração, agendamento e compartilhamento de relatórios financeiros personalizados.

#### Funcionalidades

- **Relatórios Personalizados**: Criação com parâmetros específicos
- **Programação**: Geração automática em intervalos definidos
- **Compartilhamento**: Envio de relatórios por email
- **Templates**: Modelos pré-definidos para diversos fins

### 3. Aprendizado de Máquina e IA

Recursos de inteligência artificial para análise avançada e previsões financeiras.

#### Funcionalidades

- **Previsão de Gastos**: Algoritmos para prever despesas futuras
- **Detecção de Anomalias**: Identificação de transações incomuns
- **Sugestões Inteligentes**: Recomendações personalizadas de economia
- **Categorização Aprimorada**: Melhoria do sistema atual com ML

## Melhorias em Módulos Existentes

### Metas Financeiras

- Adicionar suporte a notificações de progresso
- Implementar sugestões baseadas no orçamento
- Adicionar metas recorrentes

### Transações

- Melhorar detecção de duplicatas
- Adicionar reconciliação bancária
- Implementar sistema de etiquetas (tags)

### Dashboard

- Adicionar mais visualizações interativas
- Implementar dashboards personalizáveis
- Adicionar timeline financeira

## Considerações Técnicas

### Performance

- Implementar estratégias de cache para dados frequentemente acessados
- Otimizar consultas para grandes volumes de dados
- Adicionar paginação e carregamento sob demanda

### Segurança

- Implementar autenticação de dois fatores universal
- Adicionar logs de auditoria detalhados
- Implementar proteção contra ataques CSRF e XSS

### Escalabilidade

- Migrar para uma arquitetura de microserviços para módulos-chave
- Implementar sistema de filas para processamento assíncrono
- Adicionar suporte a processamento em lote

## Cronograma Estimado

| Módulo/Melhoria | Prioridade | Tempo Estimado |
|-----------------|------------|----------------|
| Sistema de Orçamentos | Alta | 3-4 semanas |
| Sistema de Relatórios | Média | 4-6 semanas |
| IA/ML | Média-Baixa | 6-8 semanas |
| Melhorias em Módulos Existentes | Variável | Contínuo |

---

*Este roadmap é dinâmico e pode ser ajustado com base no feedback dos usuários e nas necessidades do negócio.* 