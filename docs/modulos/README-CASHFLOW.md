# Documentação do Fluxo de Caixa

## Índice
1. [Visão Geral](#visão-geral)
2. [Estrutura de Dados](#estrutura-de-dados)
3. [Integração com Gestão Click](#integração-com-gestão-click)
4. [Migração e Importação de Dados](#migração-e-importação-de-dados)
5. [APIs Disponíveis](#apis-disponíveis)
6. [Boas Práticas e Recomendações](#boas-práticas-e-recomendações)

## Visão Geral

O módulo de Fluxo de Caixa é uma solução abrangente para gerenciamento financeiro que integra transações, previsões, vendas e centros de custo. Ele permite:

- Visualização de fluxo de caixa real e projetado por dia, semana ou mês
- Criação de previsões manuais para receitas e despesas futuras
- Integração com vendas do Gestão Click, incluindo parcelas
- Associação de transações a centros de custo para análise setorial
- Geração de relatórios e insights financeiros

## Estrutura de Dados

O sistema utiliza as seguintes tabelas principais:

### Tabelas Principais

- **Transactions**: Registro de todas as transações financeiras (receitas, despesas)
- **cash_flow_entries**: Centraliza tanto transações reais quanto previsões de fluxo de caixa
- **sales_records**: Registros de vendas importados do Gestão Click
- **installments**: Parcelas associadas às vendas
- **CostCenter**: Centros de custo para categorização setorial

### Tabelas Relacionais

- **sales_cost_center**: Relaciona vendas a centros de custo
- **sales_transaction**: Associa vendas a transações financeiras
- **CostCenterWallet**: Relaciona centros de custo a carteiras específicas

### Diagrama de Relacionamentos

```
Transaction <--> cash_flow_entries  // Uma transação pode gerar uma entrada no fluxo de caixa
Transaction <--> sales_transaction <--> sales_records  // Transações podem estar associadas a vendas
sales_records <--> installments  // Vendas podem ter múltiplas parcelas
installments <--> cash_flow_entries  // Parcelas podem gerar entradas no fluxo de caixa
CostCenter <--> sales_cost_center <--> sales_records  // Centros de custo associados a vendas
CostCenter <--> CostCenterWallet <--> Wallet  // Centros de custo associados a carteiras
```

## Integração com Gestão Click

O sistema se integra ao Gestão Click para importar:

- Vendas realizadas, com todos os detalhes (cliente, loja, valor)
- Parcelas e seus status (pendente, pago, vencido)
- Informações de lojas (mapeadas para centros de custo)

### Mapeamento de Dados

- Lojas do Gestão Click → Centros de Custo
- Vendas → Registros de vendas
- Parcelas → Parcelas e entradas no fluxo de caixa
- Transações associadas automaticamente por data e valor

## Migração e Importação de Dados

O sistema inclui scripts para migração e importação de dados:

### Script Principal de Migração

Para realizar a migração completa dos dados, execute:

```
node scripts/migrate-cash-flow-and-sales.js
```

Este script orquestra todas as etapas necessárias:

1. Popula a tabela de fluxo de caixa com transações existentes
2. Importa vendas e parcelas do Gestão Click
3. Associa transações a centros de custo
4. Verifica e valida os dados migrados

### Scripts Individuais

Também é possível executar cada etapa separadamente:

- **populate-cash-flow.js**: Migra transações para a tabela de fluxo de caixa
- **import-gestao-click-sales.js**: Importa vendas do Gestão Click
- **associate-transactions-cost-centers.js**: Associa transações a centros de custo
- **check-cash-flow.js**: Verifica e valida os dados de fluxo de caixa

## APIs Disponíveis

### GET /api/cash-flow

Obtém o fluxo de caixa para um período, incluindo transações reais e previsões.

**Parâmetros:**
- `startDate`: Data inicial (obrigatório, formato YYYY-MM-DD)
- `endDate`: Data final (obrigatório, formato YYYY-MM-DD)
- `walletId`: ID da carteira (opcional)
- `costCenterId`: ID do centro de custo (opcional)
- `groupBy`: Agrupamento por período (opcional, valores: day, week, month, padrão: day)

**Exemplo de resposta:**
```json
{
  "success": true,
  "cashFlow": [
    {
      "period": "2023-09-01",
      "date": "2023-09-01T00:00:00.000Z",
      "totalIncome": 5000,
      "totalExpense": 2000,
      "netFlow": 3000,
      "predictedIncome": 0,
      "predictedExpense": 500,
      "predictedNetFlow": -500,
      "transactions": [...],
      "predictions": [...],
      "costCenters": [
        {
          "id": "cc1",
          "name": "Matriz",
          "code": "MAT",
          "income": 5000,
          "expense": 1000,
          "net": 4000
        },
        ...
      ]
    },
    ...
  ],
  "summary": {
    "totalTransactions": 56,
    "totalPredictions": 12,
    "installments": {
      "pending": 25,
      "overdue": 5,
      "paid": 30,
      "canceled": 2,
      "totalAmount": 15000,
      "overdueAmount": 2000,
      "pendingAmount": 8000
    },
    "costCenters": [...],
    "period": {
      "start": "2023-09-01",
      "end": "2023-09-30",
      "groupBy": "day"
    }
  }
}
```

### POST /api/cash-flow

Cria uma nova previsão manual no fluxo de caixa.

**Corpo da requisição:**
```json
{
  "amount": 1500.75,
  "type": "INCOME",
  "date": "2023-10-15",
  "description": "Recebimento de Cliente X",
  "category": "SALES",
  "walletId": "wallet123",
  "probability": 0.8
}
```

**Parâmetros:**
- `amount`: Valor da previsão (obrigatório)
- `type`: Tipo (obrigatório, valores: INCOME, EXPENSE)
- `date`: Data (obrigatório, formato YYYY-MM-DD)
- `description`: Descrição (obrigatório)
- `category`: Categoria (opcional)
- `walletId`: ID da carteira (opcional)
- `probability`: Probabilidade de ocorrência (opcional, 0 a 1, padrão: 1)
- `costCenterId`: ID do centro de custo (opcional)

### DELETE /api/cash-flow

Remove uma previsão do fluxo de caixa.

**Parâmetros:**
- `id`: ID da previsão (obrigatório)

## Boas Práticas e Recomendações

### 1. Configuração Inicial

- Execute a migração completa de dados antes de utilizar o módulo
- Configure os mapeamentos entre lojas do Gestão Click e carteiras
- Verifique se os centros de custo estão corretamente associados

### 2. Uso Diário

- Mantenha as transações categorizadas corretamente
- Adicione previsões manuais para despesas e receitas futuras
- Use a filtragem por centro de custo para análises setoriais

### 3. Manutenção

- Execute o script `check-cash-flow.js` periodicamente para verificar a integridade dos dados
- Mantenha a integração com o Gestão Click ativa e atualizada
- Verifique regularmente se todas as transações estão associadas aos centros de custo

### 4. Performance

- Evite consultas com períodos muito extensos (mais de 6 meses)
- Utilize o agrupamento por semana ou mês para visualizações de longo prazo
- Considere arquivar dados muito antigos para melhorar a performance

### 5. Relatórios

- Exporte os dados de fluxo de caixa para análises específicas
- Compare os resultados reais com as previsões para melhorar o planejamento
- Utilize a visão por centro de custo para análise de rentabilidade por setor 