# Implementação da Relação Muitos para Muitos entre Carteiras e Centros de Custo

## Visão Geral

Esta documentação descreve a implementação da relação Muitos para Muitos entre Carteiras (contas bancárias) e Centros de Custo do Gestão Click. A nova estrutura permite uma representação mais precisa do modelo de negócios, onde:

1. **Carteiras**: Representam contas bancárias onde as transações são efetivamente registradas.
2. **Centros de Custo**: Funcionam como classificadores adicionais para as transações, semelhantes a categorias.

## Modelo de Dados

### Novas Entidades

1. **CostCenter (Centro de Custo)**
   - Representa um centro de custo do Gestão Click
   - Armazena metadados como código, descrição, etc.
   - Pertence a um usuário específico

2. **CostCenterWallet (Relação entre Centro de Custo e Carteira)**
   - Tabela de junção que implementa a relação muitos para muitos
   - Cada registro associa um centro de custo a uma carteira
   - Permite que uma carteira tenha múltiplos centros de custo e vice-versa

## Fluxo de Importação

O processo de importação foi modificado para:

1. **Importar Carteiras**:
   - Criar carteiras a partir de contas bancárias do Gestão Click
   - Tipo: `GESTAO_CLICK`

2. **Importar Centros de Custo**:
   - Criar registros na tabela `CostCenter` em vez de criar carteiras do tipo `GESTAO_CLICK_COST_CENTER`
   - Estabelecer relações muitos para muitos com as carteiras importadas

3. **Importar Transações**:
   - Importar transações apenas para carteiras (contas bancárias)
   - Associar transações aos centros de custo correspondentes através de metadados
   - Permitir consultas de transações filtradas por centro de custo

## Sistema de Mapeamento Dinâmico de Categorias

### Visão Geral do Novo Sistema

Para aprimorar a flexibilidade na importação de categorias, implementamos um sistema dinâmico de mapeamento que:

1. **Detecta e importa categorias automaticamente**:
   - Durante a importação, todas as categorias encontradas são registradas
   - Cada categoria externa do Gestão Click é mapeada para uma categoria interna do sistema

2. **Utiliza a tabela `CategoryMapping`**:
   - Armazena a relação entre categorias externas e internas
   - Permite configuração de prioridade para cada mapeamento
   - Suporta mapeamentos personalizados definidos pelo usuário

3. **Processo de mapeamento inteligente**:
   - Busca correspondências exatas primeiro
   - Realiza correspondências parciais se necessário
   - Utiliza a categoria interna mais apropriada ou cria uma nova

### Benefícios do Mapeamento Dinâmico

1. **Flexibilidade**: Os usuários podem personalizar como as categorias externas são mapeadas para o sistema.
2. **Consistência**: Transações com a mesma categoria externa sempre recebem a mesma categoria interna.
3. **Evolução**: O sistema se adapta à medida que novas categorias são introduzidas no Gestão Click.
4. **Rastreabilidade**: A categoria original é preservada nos metadados da transação.

### Fluxo de Trabalho de Mapeamento

1. **Importação de Categorias**:
   - Categorias externas únicas são identificadas nas transações a serem importadas
   - Sistema verifica se já existe mapeamento para cada categoria
   - Categorias não mapeadas recebem mapeamento automático baseado em regras de correspondência

2. **Aplicação de Mapeamento**:
   - Durante a importação de transações, cada categoria externa é convertida para categoria interna
   - O mapeamento é consultado no banco de dados em tempo real
   - A categoria original é preservada nos metadados para referência

## Detalhes Técnicos

### Modificações no Schema do Prisma

```prisma
// Nova tabela para centros de custo
model CostCenter {
  id          String   @id @default(cuid())
  name        String
  description String?
  code        String?  // Código do centro de custo no Gestão Click
  externalId  String?  // ID externo no Gestão Click
  active      Boolean  @default(true)
  userId      String
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  wallets CostCenterWallet[]  // Relação muitos para muitos com carteiras

  @@index([userId])
  @@unique([userId, externalId])
}

// Tabela de relacionamento entre carteiras e centros de custo
model CostCenterWallet {
  id            String     @id @default(cuid())
  costCenterId  String
  walletId      String
  createdAt     DateTime   @default(now())

  costCenter    CostCenter @relation(fields: [costCenterId], references: [id], onDelete: Cascade)
  wallet        Wallet     @relation(fields: [walletId], references: [id], onDelete: Cascade)

  @@unique([costCenterId, walletId])
  @@index([costCenterId])
  @@index([walletId])
}

// Tabela de mapeamento de categorias
model CategoryMapping {
  id               String   @id @default(cuid())
  userId           String
  externalCategory String
  internalCategory String   // ID da categoria interna ou valor do enum
  source           String   @default("GESTAO_CLICK")
  priority         Int      @default(50)
  active           Boolean  @default(true)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, source])
  @@unique([userId, externalCategory, source])
}
```

### Modificações no GestaoClickService

1. **importCategories**:
   - Agora cria mapeamentos na tabela `CategoryMapping`
   - Utiliza correspondência inteligente para escolher a melhor categoria interna

2. **getCategoryMappingForTransaction**:
   - Novo método que consulta a tabela de mapeamento em tempo real
   - Implementa lógica de fallback para garantir que todas as categorias sejam mapeadas

3. **importTransactionsForWallet**:
   - Agora utiliza o sistema dinâmico de mapeamento para categorias
   - Preserva a categoria original nos metadados da transação

## Benefícios

1. **Representação mais precisa**: O modelo reflete com mais precisão a relação real entre contas bancárias e centros de custo.

2. **Melhor organização de dados**: Separação clara entre entidades financeiras (carteiras) e estruturas organizacionais (centros de custo).

3. **Relatórios mais flexíveis**: Possibilidade de gerar relatórios cruzados por carteira e centro de custo.

4. **Integridade de dados**: Melhor controle sobre a relação entre transações, carteiras e centros de custo.

5. **Categorização flexível**: Sistema adaptável que aprende com o uso e permite personalização.

## Próximos Passos

1. **Interface de usuário**:
   - Desenvolver interface para visualizar e gerenciar centros de custo
   - Implementar filtros por centro de custo nas visões de transações
   - Criar interface para gerenciar mapeamentos de categorias

2. **Relatórios**:
   - Criar relatórios específicos de centros de custo
   - Implementar análises de gastos por centro de custo
   - Adicionar relatórios de categorias por fonte de dados

3. **Extensões futuras**:
   - Permitir alocação parcial de transações a múltiplos centros de custo
   - Implementar orçamentos por centro de custo 
   - Desenvolver sistema de regras para mapeamento automático mais sofisticado 