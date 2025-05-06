# Documentação da Integração com Gestão Click

## Visão Geral

Esta documentação descreve a implementação da integração com o sistema Gestão Click, focando nas novas funcionalidades de importação e gerenciamento de clientes, vendas e situações de vendas. A integração complementa as funcionalidades existentes de importação de carteiras, centros de custo e transações financeiras.

## Estrutura da Implementação

### 1. Modelagem de Dados

#### 1.1 Tipos/Interfaces
- **GestaoClickCliente**: Interface para clientes do Gestão Click
- **GestaoClickVenda**: Interface para vendas do Gestão Click
- **GestaoClickSituacaoVenda**: Interface para situações de vendas do Gestão Click
- **GestaoClickResponse**: Interface genérica para respostas paginadas da API
- **GestaoClickVendaFiltros**: Interface para filtros de vendas
- **GestaoClickImportResult**: Interface para resultados de importação

### 2. Serviços

#### 2.1 GestaoClickClientService
Classe dedicada à integração com as APIs de clientes, vendas e situações de vendas do Gestão Click.

**Métodos principais:**
- `getClientes()`: Busca clientes do Gestão Click
- `getVendas()`: Busca vendas do Gestão Click
- `getSituacoesVendas()`: Busca situações de vendas do Gestão Click
- `importClientes()`: Importa clientes para o banco de dados
- `importVendas()`: Importa vendas para o banco de dados
- `importSituacoesVendas()`: Importa situações de vendas para o banco de dados
- `importAllClientData()`: Importa todos os dados relacionados ao cliente
- `getCrossClientData()`: Realiza cruzamento de dados entre clientes, vendas e transações

### 3. APIs

#### 3.1 API de Clientes
- `GET /api/gestao-click/clients`: Lista clientes do Gestão Click
- `POST /api/gestao-click/clients/import`: Importa clientes para o banco de dados

#### 3.2 API de Vendas
- `GET /api/gestao-click/sales`: Lista vendas do Gestão Click
- `POST /api/gestao-click/sales/import`: Importa vendas para o banco de dados
- `GET /api/gestao-click/sales/:id`: Busca uma venda específica por ID

#### 3.3 API de Situações de Vendas
- `GET /api/gestao-click/sales/situacoes`: Lista situações de vendas do Gestão Click
- `POST /api/gestao-click/sales/situacoes/import`: Importa situações de vendas para o banco de dados

#### 3.4 API de Relatórios
- `GET /api/gestao-click/relatorios/cruzamento`: Gera relatórios consolidados cruzando dados de clientes, vendas e transações financeiras

### 4. Interface do Usuário

#### 4.1 Páginas Principais
- `/gestao-click`: Página principal com acesso às funcionalidades
- `/gestao-click/clientes`: Listagem e importação de clientes
- `/gestao-click/vendas`: Listagem e importação de vendas
- `/gestao-click/relatorios`: Relatórios e cruzamento de dados

## Fluxo de Dados

### 1. Importação de Clientes

O fluxo de importação de clientes segue os seguintes passos:

1. O usuário acessa a página de clientes e clica em "Importar Clientes"
2. A aplicação faz uma requisição para a API `/api/gestao-click/clients/import`
3. O serviço `GestaoClickClientService` busca todos os clientes do Gestão Click
4. Para cada cliente, verifica se já existe no banco de dados
5. Novos clientes são inseridos, clientes existentes são atualizados
6. A importação retorna estatísticas: total processado, importados, ignorados e erros

### 2. Importação de Vendas

O fluxo de importação de vendas segue os seguintes passos:

1. O usuário acessa a página de vendas, configura o período e clica em "Importar Vendas"
2. A aplicação faz uma requisição para a API `/api/gestao-click/sales/import` com as datas
3. O serviço `GestaoClickClientService` busca vendas do período especificado
4. Para cada venda, verifica se já existe no banco de dados
5. Novas vendas são inseridas, vendas existentes são atualizadas
6. A importação retorna estatísticas: total processado, importados, ignorados e erros

### 3. Geração de Relatórios de Cruzamento

O fluxo de geração de relatórios segue os seguintes passos:

1. O usuário acessa a página de relatórios, seleciona filtros e clica em "Gerar Relatório"
2. A aplicação faz uma requisição para a API `/api/gestao-click/relatorios/cruzamento`
3. O backend busca dados de clientes, vendas e transações financeiras
4. Os dados são processados e cruzados para gerar estatísticas e insights
5. O resultado é retornado com três seções principais: dados do cliente, dados de vendas e dados financeiros

## Banco de Dados

### 1. Tabelas e Relações

A implementação utiliza as seguintes tabelas do banco de dados:

- **Customer**: Armazena dados de clientes importados
- **Sale**: Armazena vendas importadas
- **SaleStatus**: Armazena situações de vendas
- **SaleItem**: Armazena itens de vendas (produtos e serviços)
- **Transaction**: Armazena transações financeiras relacionadas às vendas

### 2. Campos de Metadados

Para manter a rastreabilidade da origem dos dados, os registros importados incluem metadados:

- **source**: Indica a origem do dado ("GESTAO_CLICK")
- **externalId**: ID do registro no sistema Gestão Click
- **createdAt**: Data de criação do registro
- **updatedAt**: Data da última atualização do registro
- **rawData**: Dados brutos do registro (para vendas)

## Estratégias de Integração

### 1. Deduplicação

Para evitar duplicação de dados, a implementação utiliza as seguintes estratégias:

- Verifica a existência de registros pelo campo `externalId` nos metadados
- Atualiza registros existentes em vez de criar novos
- Mantém registros das importações realizadas

### 2. Sincronização

A sincronização de dados segue as seguintes estratégias:

- Importação manual sob demanda
- Possibilidade de filtragem por período e outros critérios
- Importação completa de todas as entidades relacionadas

### 3. Cruzamento de Dados

O cruzamento de dados implementa as seguintes estratégias:

- Associação de vendas aos clientes através do ID do cliente
- Associação de transações financeiras às vendas
- Agrupamento de dados por período, categoria, situação, etc.
- Cálculo de estatísticas e métricas para análise

## Endpoints de Teste e Diagnóstico

Para facilitar testes e diagnósticos da integração, os seguintes endpoints foram implementados:

### 1. Teste de Conexão

Endpoint: `GET /api/gestao-click/test-connection`

Este endpoint pode ser utilizado sem autenticação completa se as chaves de API forem fornecidas:

```
curl -X GET "http://localhost:3000/api/gestao-click/test-connection?apiKey=CHAVE_API&secretToken=TOKEN_SECRETO"
```

Também pode ser usado com autenticação normal:

```
curl -X GET "http://localhost:3000/api/gestao-click/test-connection" -H "Cookie: next-auth.session-token=SEU_TOKEN"
```

### 2. Teste de Webhooks

Endpoint: `POST /api/webhooks/gestao-click/test`

Este endpoint permite testar diferentes tipos de webhooks:

```
curl -X POST "http://localhost:3000/api/webhooks/gestao-click/test" \
  -H "Content-Type: application/json" \
  -d '{"userId":"1", "type":"client"}'
```

Tipos suportados:
- `client`: Testa criação de cliente
- `sale`: Testa criação de venda
- `situacao`: Testa criação de situação de venda
- `relatorio`: Testa geração de relatório
- `payment`: Testa registro de pagamento

### 3. Diagnóstico da Integração

Endpoint: `GET /api/gestao-click/diagnostic`

Este endpoint fornece informações completas sobre o estado da integração:

```
curl -X GET "http://localhost:3000/api/gestao-click/diagnostic?test=true&userId=1"
```

A resposta inclui:
- Status da conexão com a API
- Estatísticas dos dados importados
- Configuração de sincronização
- Histórico de importações recentes

## Limitações e Considerações

### 1. Limitações Conhecidas

- A API atual suporta apenas importação, não exportação
- Não há sincronização bidirecional de alterações
- Dados complexos como contatos e endereços de clientes podem exigir processamento adicional

### 2. Considerações de Performance

- A importação de grandes volumes de dados pode ser demorada
- Implementar paginação para lidar com muitos registros
- Considerar importações incrementais para melhor performance

## Próximos Passos

### 1. Melhorias Futuras

- Implementar sincronização automática programada
- Expandir o cruzamento de dados com análises avançadas
- Adicionar funcionalidades de exportação de dados para o Gestão Click
- Melhorar a interface de usuário com visualizações gráficas
- Implementar cache para consultas frequentes

### 2. Pontos de Extensão

A implementação foi projetada com os seguintes pontos de extensão:

- Serviço modular que pode ser expandido para novas entidades
- APIs bem definidas para suportar novas operações
- Interface de usuário modular que pode incorporar novas funcionalidades
- Estrutura de tipos flexível para acomodar alterações na API do Gestão Click 