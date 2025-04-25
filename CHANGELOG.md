# Changelog

Todas as alterações notáveis neste projeto serão documentadas neste arquivo.

## [Não lançado]

### Adicionado
- Implementação de sistema de notificações em tempo real usando WebSockets
- Sistema de detecção de anomalias em transações através de análise estatística
- Funcionalidade para envio de notificações personalizadas baseadas em comportamentos de gastos

### Modificado
- Refatoração da estrutura de notificações para suportar tipos de prioridades diferentes
- Modificação da UI para exibir alertas visuais de notificações

### Corrigido
- Problemas de performance ao carregar muitas notificações
- Bugs relacionados à exibição de notificações no mobile

## [1.3.0] - 2023-08-15

### Adicionado
- Implementação completa do módulo de Carteiras e Transações com arquitetura modular
- Novo serviço WalletService para gerenciamento centralizado de carteiras, incluindo:
  - Validação de operações de carteira para prevenir saldos negativos em carteiras que não permitem
  - Reconciliação automática de saldos baseada nas transações
  - Transferências entre carteiras com validação e criação de transações correspondentes
  - Geração de relatórios de fluxo de caixa por carteira
- Novo serviço TransactionService para operações de transação mais robustas:
  - Sistema de validação antes de criar ou modificar transações
  - Atualização automática de saldos de carteira ao criar/modificar/excluir transações
  - Estatísticas de transações por categoria e período
  - Paginação eficiente com suporte a cursor para melhor performance
- Sistema de Transações Recorrentes implementado:
  - Suporte para diferentes frequências (diária, semanal, quinzenal, mensal, trimestral, anual)
  - Processamento automático de transações recorrentes
  - Possibilidade de gerar transações manualmente a partir de recorrências
  - Personalização avançada com suporte a dias específicos do mês ou da semana

### Modificado
- APIs REST atualizadas para utilizar os novos serviços
- Melhorias na tipagem e validação de dados
- Refatoração para uso de transações do Prisma para garantir integridade dos dados

### Corrigido
- Problemas de inconsistência no saldo das carteiras
- Validação inadequada de operações que poderiam levar a saldos negativos
- Problemas de performance ao listar muitas transações

## [1.2.0] - 2023-07-01

### Adicionado
- Funcionalidade de categorização automática de transações
- Integração com API de bancos para importação automática
- Dashboard com gráficos de gastos por categoria

### Corrigido
- Problema de layout no calendário de transações
- Erros de cálculo no balanço mensal

## [1.1.0] - 2024-03-11

### Adicionado
- Relação direta entre orçamentos (`Budget`) e transações (`Transaction`)
- API para associar e desassociar transações a orçamentos
- Adaptadores para converter entre modelos Prisma e interfaces TypeScript
- Serviço para correspondência automática de transações e orçamentos

### Atualizado
- Componente `BudgetTransactions` para usar a interface padronizada
- API CRUD completa para transações (GET, POST, PUT, DELETE)
- API para categorização de transações bancárias
- Correção de relações no schema Prisma
- Atualização das tipagens para compatibilidade entre componentes

### Corrigido
- Incompatibilidade de tipos entre modelos e componentes
- Erros com nomes de propriedades inexistentes
- Relações mal configuradas no schema Prisma
- Referências incorretas ao cliente Prisma

## v1.2.0 - Melhorias nos Módulos de Carteiras e Transações

### Adicionado
- **Serviço de Carteiras (WalletService)**
  - Implementação de serviço dedicado para gerenciar operações de carteiras
  - Tipos de carteira (conta corrente, poupança, cartão de crédito, etc.)
  - Controle de saldo negativo e limites de crédito
  - Método de transferência entre carteiras
  - Reconciliação automática de saldo
  - Geração de relatórios de fluxo de caixa

- **Serviço de Transações (TransactionService)**
  - Implementação de serviço dedicado para gerenciar transações
  - Validação robusta de dados
  - Paginação eficiente baseada em cursor
  - Atualização inteligente de saldos em carteiras
  - Métodos para duplicar transações
  - Resumos estatísticos por categoria

- **Sistema de Transações Recorrentes**
  - Modelo de dados para transações recorrentes
  - Agendamentos flexíveis (diário, semanal, mensal, anual)
  - API completa para gerenciamento
  - Processamento automático via cron
  - Validação de operações contra carteiras

- **Rotas de API**
  - API para transferências entre carteiras
  - Atualização das APIs de transações para usar os novos serviços
  - API dedicada para transações recorrentes
  - Endpoint cron para processamento automático

### Melhorado
- **Modelo de Dados**
  - Adicionado enums para tipos de carteira
  - Adicionado enums para frequência de recorrência
  - Melhorado modelo de transação com status e tags
  - Adicionado constraints e índices para melhor performance

- **Documentação**
  - Atualização do README com seções dedicadas para os novos módulos
  - Documentação detalhada dos serviços e APIs
  - Changelog para acompanhamento de alterações

### Corrigido
- Inconsistências no cálculo de saldo de carteiras
- Validações insuficientes nas operações de transação
- Falta de atomicidade em operações que envolvem múltiplas tabelas

## Remoção do Open Banking e Open Finance

Em 15 de março de 2024, todos os recursos e referências ao Open Banking e Open Finance foram removidos do projeto por questões estratégicas. Isso incluiu a remoção de:

- Modelos de banco de dados (OpenBankingConsent, OpenBankingAccount)
- APIs e endpoints relacionados
- Componentes de interface do usuário
- Bibliotecas e utilitários
- Variáveis de ambiente

Esta decisão simplifica a arquitetura do sistema e foca nos recursos principais da aplicação.

## Versão 2.5.0 (15/09/2023)

### Melhorias
- **Integração Gestão Click**: Aumento significativo nos limites de importação para suportar grandes volumes de transações.
  - Capacidade de importar até 100.000 transações em uma única operação
  - Suporte para até 100 páginas de pagamentos e recebimentos (antes limitado a 50)
  - Configuração avançada para limitar resultados por página (agora com padrão de 500)
  - Documentação atualizada com orientações para importação de grandes volumes
- **Filtro de Todos os Períodos**: Aprimoramento do filtro "Todo o período" para mostrar todas as transações sem restrição de data.

### Correções de Bugs
- Resolvido problema com filtros de data que não estavam considerando transações muito antigas.
- Corrigido problema de importação incompleta do Gestão Click.

## [0.1.0] - Em desenvolvimento
### Primeiro Lançamento - Dashboard de Indicadores

#### Adicionado
- Implementação da rota principal de dashboard com indicadores
- Indicadores de vendas totais
- Indicadores de desempenho por vendedor
- Ranking de produtos mais vendidos
- Métricas de conversão de atendimentos
- Configuração de CI/CD através do GitHub Actions
- Estrutura de branches baseada no modelo GitFlow
- Scripts para facilitar a inicialização do projeto

#### Melhorado
- Refatoração de código com foco em princípios SOLID
- Eliminação de código duplicado (componentes de formatação e gráficos)
- Eliminação de código não utilizado e imports desnecessários
- Melhoria na tipagem TypeScript para maior segurança
- Implementação de tratamento adequado de erros nas APIs
- Refatoração de componentes grandes em componentes menores
- Adição de testes para funcionalidades críticas
- Documentação do projeto atualizada
