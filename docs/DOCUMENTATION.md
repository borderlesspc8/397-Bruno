# Documentação do Conta Rápida

## Visão Geral da Aplicação

O Conta Rápida é uma aplicação financeira completa desenvolvida em Next.js que permite aos usuários gerenciar suas finanças pessoais e empresariais de forma eficiente. A plataforma oferece integração com APIs bancárias, visualização de dados financeiros, importação/exportação de dados e recursos avançados de análise.

## Funcionalidades Implementadas

### ✅ Core da Aplicação
- **Next.js Framework**: Estrutura completa com arquitetura moderna de rotas e componentes
- **Autenticação e Autorização**: Sistema completo com login, registro e rotas protegidas
- **Banco de Dados**: Configuração e modelos Prisma para PostgreSQL
- **UI/UX**: Interface moderna com tema claro/escuro e design responsivo

### ✅ Integração Bancária
- **API do Banco do Brasil**: Integração completa para extração de dados financeiros
- **OAuth 2.0**: Autenticação segura com a API bancária
- **Endpoints**: Suporte a ambientes de homologação e produção
- **Tratamento de Erros**: Mecanismos robustos para lidar com falhas de API

### ✅ Gerenciamento de Carteiras
- **Múltiplas Carteiras**: Criação e gerenciamento de diferentes contas e carteiras
- **Saldo Calculado**: Sistema automático de cálculo e verificação de saldo baseado nas transações
- **Carteiras Bancárias**: Sincronização com contas bancárias reais

### ✅ Gerenciamento de Transações
- **CRUD Completo**: Adição, edição, visualização e exclusão de transações
- **Categorização Manual**: Atribuição de categorias a transações
- **Filtragem e Busca**: Busca avançada com filtros por data, valor e categoria
- **Paginação**: Navegação eficiente em grandes conjuntos de dados

### ✅ Dashboard Financeiro
- **Visão Geral**: Painel com resumo financeiro
- **Gráficos e Estatísticas**: Visualização de despesas por categoria e período
- **Tendências**: Análise comparativa entre períodos

### ✅ Perfil de Usuário
- **Página de Perfil Completa**: Interface intuitiva para gerenciar dados pessoais
- **Customização de Avatar**: Opções para personalizar imagem de perfil
- **Preferências**: Configurações de notificações e temas
- **Segurança**: Alteração de senha e ativação de 2FA
- **Histórico de Atividades**: Registro detalhado de ações do usuário
- **Estatísticas de Uso**: Métricas sobre utilização do sistema
- **Gerenciamento de Assinatura**: Visualização e gerenciamento de planos

### ✅ Sistema de Categorização Automática
- **Regras de Categorização**: Criação e gerenciamento de regras personalizadas
- **Padrões e Expressões Regulares**: Suporte a correspondência de texto simples e regex
- **Aplicação em Lote**: Opção para categorizar todas as transações de uma vez
- **Priorização de Regras**: Sistema hierárquico para resolver conflitos entre regras
- **Testar Regras**: Ferramenta para testar o funcionamento de regras antes de aplicá-las

### ✅ Importação e Exportação de Dados
- **Importação CSV**: Suporte para arquivos CSV de diferentes formatos
- **Importação OFX**: Suporte para extratos bancários no formato OFX
- **Exportação CSV**: Geração de arquivos CSV com dados de transações
- **Exportação Excel**: Planilhas formatadas com totalizadores e formatação condicional
- **Exportação PDF**: Relatórios em PDF bem formatados com resumos e detalhes
- **Exportação IRPF**: Formato específico para auxiliar na declaração de imposto de renda
- **Visualização Prévia**: Prévia de dados CSV antes da importação
- **Detecção de Duplicatas**: Sistema para evitar importação de transações duplicadas

### ✅ Sistema de Notificações
- **Notificações Persistentes**: Armazenamento de notificações no banco de dados
- **Tipos de Notificação**: Categorização por transações, orçamentos, metas, segurança, etc.
- **Níveis de Prioridade**: Suporte a prioridades alta, média e baixa
- **Gestão de Notificações**: Interface para marcar como lida, arquivar ou excluir
- **Filtros e Pesquisa**: Filtragem por tipo, status e paginação
- **Integração com Módulos**: Notificações automáticas para eventos importantes

### ✅ Integração com Gestão Click
- **Importação de Carteiras**: Sincronização de contas bancárias com o sistema externo
- **Importação de Transações**: Busca de pagamentos e recebimentos 
- **Mapeamento Automático**: Categorização baseada em regras e mapeamentos
- **Filtros Avançados**: Opções para personalizar os dados importados

### ✅ Cálculo de Saldo de Carteiras
- **Cálculo Automático**: Atualização baseada nas transações
- **Verificação de Consistência**: Detecção e correção de discrepâncias
- **Monitoramento**: Registro de alterações e correções

### ✅ Sistema de Orçamentos
- **Orçamento por Categoria**: Definição de limites de gastos por categoria
- **Período Customizável**: Orçamentos mensais ou customizados
- **Comparativo Planejado vs. Realizado**: Análise visual de aderência ao orçamento
- **Alertas Automatizados**: Notificações quando limites são aproximados ou excedidos
- **Monitoramento Contínuo**: Verificação periódica via endpoints de API

### ✅ Sistema de Metas Financeiras
- **Definição de Metas**: Interface para criar metas com valores e prazos
- **Acompanhamento de Progresso**: Visualização gráfica do progresso
- **Categorização**: Organização por finalidade (emergência, férias, etc.)
- **Notificações Integradas**: Alertas automáticos para metas próximas de conclusão ou vencimento
- **Contribuições**: Registro de contribuições manuais ou vinculadas a transações

## Funcionalidades em Desenvolvimento

### 🚧 Sistema de Relatórios Avançados
- **Relatórios Personalizados**: Criação de relatórios com parâmetros específicos
- **Programação**: Opção para gerar relatórios automaticamente em intervalos definidos
- **Compartilhamento**: Envio de relatórios por email

### 🚧 Aprendizado de Máquina e IA
- **Previsão de Gastos**: Algoritmos para prever despesas futuras
- **Detecção de Anomalias**: Identificação de transações incomuns
- **Sugestões Inteligentes**: Recomendações personalizadas de economia

## Melhorias Planejadas

### 🔄 Módulo de Usuário
- Implementar verificação de email
- Adicionar login social (Google, Facebook, Apple)
- Melhorar processo de recuperação de senha

### 🔄 Importação/Exportação
- Adicionar suporte a mais formatos de arquivo bancário
- Adicionar opção de backup automático de dados

### 🔄 Segurança
- Implementar auditoria detalhada de segurança
- Adicionar opções de bloqueio de IP após tentativas de login
- Melhorar criptografia de dados sensíveis

### 🔄 Performance
- Otimizar consultas de banco de dados para grandes volumes
- Implementar estratégias de cache mais eficientes
- Melhorar tempo de carregamento da aplicação

### 🔄 Experiência Mobile
- Desenvolver aplicativos nativos para iOS e Android
- Adicionar suporte a notificações push
- Implementar captura de recibos via câmera

## Requisitos Técnicos

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI Components
- React Hook Form
- Zod (validação)
- Lucide Icons

### Backend
- Next.js API Routes
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Banco do Brasil API

### DevOps
- ESLint
- Prettier
- Vitest (testes)
- React Testing Library
- PWA Configuration

## Instalação e Execução

```bash
# Clonar o repositório
git clone [url-do-repositorio]

# Instalar dependências
cd contarapida
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Executar migrações do banco de dados
npx prisma migrate dev

# Iniciar o servidor de desenvolvimento
npm run dev

# Executar testes
npm run test
```

## Estrutura de Diretórios

```
contarapida/
├── app/                    # Código-fonte da aplicação
│   ├── (auth-routes)/      # Rotas protegidas por autenticação
│   ├── api/                # API endpoints
│   ├── _components/        # Componentes compartilhados
│   ├── _lib/               # Bibliotecas e utilitários
│   └── _styles/            # Estilos globais
├── prisma/                 # Modelos de banco de dados
├── public/                 # Arquivos estáticos
├── tests/                  # Testes automatizados
└── scripts/                # Scripts utilitários
```

## Contribuindo

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Envie para o GitHub (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Integração com Gestão Click

### Configuração

Para configurar a integração com o Gestão Click, adicione as seguintes variáveis no arquivo `.env`:

```
GESTAO_CLICK_ACCESS_TOKEN=seu-token-de-acesso
GESTAO_CLICK_SECRET_ACCESS_TOKEN=seu-token-secreto
GESTAO_CLICK_API_URL=https://api.beteltecnologia.com
GESTAO_CLICK_EMPRESA=id-da-empresa
```

### Script de Teste da Integração

Para verificar se sua configuração do Gestão Click está funcionando corretamente, você pode executar o script de teste:

```bash
node test-gestao-click.js
```

Este script realiza as seguintes verificações:
- Conexão com a API do Gestão Click
- Busca de contas bancárias
- Busca de pagamentos
- Busca de recebimentos
- Transformação de dados para o formato do Conta Rápida

O script mostrará um resumo detalhado da integração, incluindo exemplos de dados e contagem total de registros encontrados. Isso é útil para diagnosticar problemas de conexão ou verificar se os tokens de acesso estão funcionando corretamente.

### Interface de Usuário da Integração

A integração com o Gestão Click pode ser acessada de duas formas:

1. **Importação de Carteiras**
   - Na página de carteiras, clique em "Nova Carteira" e escolha "Gestão Click"
   - Preencha os dados de autenticação
   - Todas as contas bancárias do sistema serão importadas como carteiras

2. **Importação de Transações**
   - Em uma carteira específica, clique no botão "Gestão Click"
   - Preencha os dados de autenticação e selecione o período
   - Configure os filtros avançados, se necessário
   - Clique em "Importar Transações" para iniciar o processo

### Autenticação com a API

A API do Gestão Click requer dois tokens de autenticação nos cabeçalhos:

```
Content-Type: application/json
access-token: SEU_TOKEN_DE_ACESSO
secret-access-token: SEU_TOKEN_SECRETO
```

### Endpoints da API Utilizados

| Endpoint | Descrição | Status |
|----------|-----------|--------|
| `/contas_bancarias` | Lista as contas bancárias disponíveis | ✅ Disponível |
| `/pagamentos` | Lista os pagamentos (despesas) | ✅ Disponível |
| `/recebimentos` | Lista os recebimentos (receitas) | ✅ Disponível |
| `/lancamentos` | Lista as transações financeiras | ❌ Não disponível |
| `/extrato` | Lista o extrato de transações | ❌ Não disponível |

### Suporte a Paginação

A integração suporta a paginação da API do Gestão Click, permitindo a importação de grandes volumes de dados. O processo funciona da seguinte forma:

1. **Paginação Automática**:
   - O sistema busca automaticamente todas as páginas de resultados
   - A paginação é processada recursivamente, página por página
   - Não há limite de registros por página, exceto o configurado pela API (padrão: 20)

2. **Limites de Segurança**:
   - Por padrão, há um limite de 10 páginas por endpoint para evitar sobrecarga
   - Há um limite máximo de 1000 transações para importação por vez (configurável)
   - Pausa de 500ms entre requisições para evitar sobrecarga na API

3. **Contadores e Feedback**:
   - O sistema fornece feedback sobre o número de páginas processadas
   - Mostra o total de registros encontrados e o tempo de processamento
   - Informa quando o limite máximo de transações é atingido

### Formato de Resposta da API

A API do Gestão Click retorna os dados no seguinte formato:

```json
{
  "code": 200,
  "status": "success",
  "meta": {
    "total_registros": 100,
    "total_da_pagina": 20,
    "pagina_atual": 1,
    "limite_por_pagina": 20,
    "pagina_anterior": null,
    "url_anterior": null,
    "proxima_pagina": 2,
    "proxima_url": "/endpoint?page=2"
  },
  "data": [
    {
      "id": "123",
      "descricao": "Descrição da transação",
      // ... outros campos
    },
    // ... outros registros
  ]
}
```

### Filtros Disponíveis para Transações

A API do Gestão Click oferece os seguintes filtros para consulta de pagamentos e recebimentos:

| Filtro | Tipo | Descrição | Endpoint |
|--------|------|-----------|----------|
| `data_inicio` | string | Data inicial no formato YYYY-MM-DD | Ambos |
| `data_fim` | string | Data final no formato YYYY-MM-DD | Ambos |
| `liquidado` | string | Status de liquidação: 'ab' (Em aberto), 'at' (Em atraso), 'pg' (Confirmado) | Ambos |
| `conta_bancaria_id` | number | ID da conta bancária | Ambos |
| `plano_contas_id` | number | ID do plano de contas | Ambos |
| `centro_custo_id` | number | ID do centro de custo | Ambos |
| `loja_id` | number | ID da loja | Ambos |
| `cliente_id` | number | ID do cliente | Ambos |
| `fornecedor_id` | number | ID do fornecedor | Ambos |
| `valor_inicio` | number | Valor mínimo da transação | Ambos |
| `valor_fim` | number | Valor máximo da transação | Ambos |
| `limit` | number | Limite de resultados por página | Ambos |
| `page` | number | Número da página para paginação | Ambos |
| `maxTransactions` | number | Limite máximo total de transações (controle interno) | - |

### Campos Retornados pelos Endpoints

Os endpoints `/pagamentos` e `/recebimentos` retornam os seguintes campos:

#### Campos Principais
- `id` - ID da transação
- `codigo` - Código da transação
- `descricao` - Descrição da transação
- `valor` - Valor da transação
- `juros` - Valor de juros (opcional)
- `desconto` - Valor de desconto (opcional)
- `taxa_banco` - Taxa bancária (opcional)
- `taxa_operadora` - Taxa de operadora (opcional)
- `valor_total` - Valor total (valor + juros - desconto)

#### Plano de Contas e Centro de Custo
- `plano_contas_id` - ID do plano de contas
- `nome_plano_conta` - Nome do plano de contas
- `centro_custo_id` - ID do centro de custo
- `nome_centro_custo` - Nome do centro de custo

#### Conta Bancária e Forma de Pagamento
- `conta_bancaria_id` - ID da conta bancária
- `nome_conta_bancaria` - Nome da conta bancária
- `forma_pagamento_id` - ID da forma de pagamento
- `nome_forma_pagamento` - Nome da forma de pagamento

#### Entidades Relacionadas
- `entidade` - Tipo de entidade ("C" para cliente, "F" para fornecedor, etc.)
- `fornecedor_id` - ID do fornecedor (se aplicável)
- `nome_fornecedor` - Nome do fornecedor (se aplicável)
- `cliente_id` - ID do cliente (se aplicável)
- `nome_cliente` - Nome do cliente (se aplicável)
- `transportadora_id` - ID da transportadora (se aplicável)
- `nome_transportadora` - Nome da transportadora (se aplicável)
- `funcionario_id` - ID do funcionário (se aplicável)
- `nome_funcionario` - Nome do funcionário (se aplicável)

#### Datas e Status
- `liquidado` - Status de liquidação ("1" para liquidado, "0" para não liquidado)
- `data_vencimento` - Data de vencimento
- `data_liquidacao` - Data de liquidação (quando liquidado)
- `data_competencia` - Data de competência

#### Informações Administrativas
- `usuario_id` - ID do usuário que registrou a transação
- `nome_usuario` - Nome do usuário
- `loja_id` - ID da loja
- `nome_loja` - Nome da loja

### Funcionalidades da Interface

- **Filtros Básicos**:
  - Período de data (início e fim)
  - Token de acesso e Token secreto
  - URL da API personalizada

- **Filtros Avançados**:
  - Status de liquidação (Em aberto, Em atraso, Confirmado)
  - Filtro por conta bancária específica
  - Faixa de valor (mínimo e máximo)
  - Limite de resultados por chamada

- **Importação e Processamento**:
  - Importação com suporte a paginação automática
  - Importação automática de categorias
  - Mapeamento de status (pendente, pago, cancelado)
  - Conversão de tipos (receita/despesa)
  - Armazenamento de dados originais para referência
  - Limitação de volume para evitar sobrecarga

### Processo de Importação

O processo de importação segue as seguintes etapas:

1. **Autenticação e Configuração**:
   - Validação dos tokens de acesso e configurações
   - Definição do período e filtros de importação

2. **Busca de Transações**:
   - Busca de pagamentos com suporte à paginação
   - Busca de recebimentos com suporte à paginação
   - Combinação e ordenação das transações por data

3. **Filtragem e Processamento**:
   - Aplicação de filtros adicionais (categorias, contas)
   - Limitação do número máximo de transações (se necessário)
   - Importação automática de categorias

4. **Persistência de Dados**:
   - Conversão para o formato do Conta Rápida
   - Gravação das transações no banco de dados
   - Armazenamento dos metadados originais
   - Atualização das configurações de integração

5. **Feedback e Relatório**:
   - Contagens detalhadas de transações
   - Informações sobre páginas processadas
   - Detalhes sobre receitas e despesas importadas

### Mapeamento de Dados

A integração realiza o seguinte mapeamento entre os dados do Gestão Click e o Conta Rápida:

| Dados Gestão Click | Dados Conta Rápida | Observações |
|--------------------|---------------------|-------------|
| `id` | `externalId` | ID único da transação na origem |
| `descricao` | `description` | Descrição da transação |
| `valor` | `amount` | Valor convertido para positivo/negativo conforme tipo |
| `data_competencia` | `date` | Prioridade: competência, vencimento, liquidação |
| `nome_plano_conta` | `category` | Categoria da transação |
| `nome_conta_bancaria` | `wallet` | Carteira associada |
| `liquidado` ("1") | `status` ("PAGO") | Liquidado = 1 → Pago |
| `nome_forma_pagamento` | `paymentMethod` | Método de pagamento |

### Resolução de Problemas

Se encontrar problemas com a paginação ou grandes volumes de dados:

1. Verifique se os tokens de acesso estão configurados corretamente
2. Reduza o período de importação para intervalos menores
3. Use os filtros avançados para restringir o volume de dados
4. Verifique se há limites de API no seu plano do Gestão Click
5. Monitore os logs para identificar falhas durante a paginação
6. Configure o parâmetro `maxTransactions` para limitar o volume total

## Cálculo de Saldo de Carteiras

O sistema implementa um mecanismo robusto para garantir que o saldo das carteiras esteja sempre correto, baseando-se nas transações.

### Funcionalidades

1. **Cálculo Automático de Saldo**
   - O saldo de cada carteira é calculado a partir da soma de todas suas transações
   - Receitas são adicionadas e despesas são subtraídas do saldo total
   - O sistema verifica e, se necessário, corrige automaticamente discrepâncias entre o saldo armazenado e o calculado

2. **Utilitários de Carteira**
   - Funções dedicadas para calcular e verificar o saldo das carteiras (`app/_utils/wallet-balance.ts`)
   - API consistente para cálculo de saldo em diferentes partes do sistema
   - Limiar configurável para detecção de discrepâncias (padrão: 0,01)

3. **Implementação nas Rotas da API**
   - `/api/wallets`: Retorna todas as carteiras com saldos verificados
   - `/api/wallets/[walletId]/details`: Fornece detalhes da carteira com saldo recalculado
   - Métodos PATCH e PUT incluem verificação e atualização de saldo

4. **Monitoramento e Logs**
   - O sistema registra quando um saldo é recalculado e atualizado
   - Informações detalhadas sobre a diferença entre saldo armazenado e calculado

### Processo de Cálculo

1. Todas as transações associadas à carteira são recuperadas do banco de dados
2. As transações são processadas por tipo:
   - Receitas (INCOME/DEPOSIT): Valor é somado ao saldo
   - Despesas (EXPENSE): Valor é subtraído do saldo
3. O saldo calculado é comparado com o valor armazenado
4. Se a diferença for maior que o limiar (0,01), o saldo é atualizado no banco de dados

Este sistema garante que os saldos das carteiras sejam sempre precisos e consistentes com as transações registradas, mesmo em casos de falhas na sincronização ou importação de dados.

## Sistema de Notificações

O Conta Rápida implementa um sistema de notificações robusto que conecta todos os módulos da aplicação, permitindo informar o usuário sobre eventos importantes relacionados às suas finanças.

### Características do Sistema de Notificações

#### Persistência e Armazenamento
- Notificações são armazenadas no banco de dados, permitindo histórico e consulta
- Modelo de dados com campos para título, mensagem, tipo, prioridade e metadados
- Suporte a links para navegação direta para recursos relacionados

#### Tipos de Notificação
- **TRANSACTION**: Relacionadas a transações (nova, suspeita, etc.)
- **BUDGET**: Alertas de orçamentos (limite próximo, excedido)
- **GOAL**: Avisos sobre metas financeiras (próxima, alcançada, vencida)
- **SECURITY**: Notificações de segurança (login suspeito, alteração de senha)
- **SYSTEM**: Informações do sistema (manutenção, atualizações)
- **SUBSCRIPTION**: Notificações sobre assinatura (vencimento, renovação)
- **IMPORT**: Avisos sobre importações (concluída, falha)
- **OTHER**: Notificações gerais e diversas

#### Interface do Usuário
- Componente de lista de notificações com abas (não lidas, todas, arquivadas)
- Indicador visual de novas notificações
- Detalhes expandidos para mais informações
- Ações rápidas (marcar como lida, arquivar, excluir)

#### API e Serviços
- Endpoints RESTful para gerenciamento de notificações
- Serviço centralizado para criação e consulta
- Proteção de acesso por autenticação
- Suporte à paginação para grandes volumes

### Integrações com Módulos

#### Orçamentos
- Notificações quando um orçamento se aproxima do limite (80%)
- Alertas quando o orçamento é excedido (100%)
- Detalhes sobre categorias que ultrapassaram o orçamento
- Links diretos para a página de orçamento

#### Metas Financeiras
- Notificações quando uma meta está próxima de ser alcançada
- Avisos quando uma meta está próxima de vencer
- Alertas para metas vencidas sem serem atingidas
- Celebração quando uma meta é alcançada

#### Transações
- Alertas sobre transações de alto valor
- Notificações sobre importações concluídas
- Avisos sobre categorização automática

#### Segurança
- Alertas de login em novo dispositivo
- Notificações de alteração de configurações sensíveis

### Uso Técnico do Sistema de Notificações

#### Criar uma Notificação
```typescript
await NotificationService.createNotification({
  userId: "user-id",
  title: "Título da notificação",
  message: "Mensagem detalhada",
  type: "BUDGET", // Tipo da notificação
  priority: "HIGH", // Prioridade (LOW, MEDIUM, HIGH)
  link: "/path/to/resource", // Link opcional
  metadata: { // Dados adicionais
    resourceId: "123",
    details: "Informações específicas"
  }
});
```

#### Verificação Automática (Cron Jobs)
A aplicação implementa endpoints para verificação automática de:
- Limites de orçamento excedidos
- Progresso de metas financeiras
- Transações suspeitas

Estes endpoints podem ser chamados através de serviços de agendamento (como Vercel Cron Jobs) para manter os usuários informados sem necessidade de interação manual.

## Sanitização de Banco de Dados

A aplicação oferece mecanismos para identificar e remover registros duplicados nas tabelas de carteiras e transações, que podem ocorrer principalmente durante a importação de dados do Gestão Click.

### Opções de Sanitização

Existem três formas de executar a sanitização:

#### 1. Script de Linha de Comando (TypeScript)

Um script independente que pode ser executado via terminal:

```bash
# Executar o script (isso fará alterações permanentes no banco de dados)
npm run cleanup-duplicates -- userId=USER_ID

# Executar o script em modo de simulação (não altera o banco de dados)
npm run cleanup-duplicates -- userId=USER_ID dryRun=true
```

#### 2. Script de Linha de Comando (JavaScript)

Alternativa para compatibilidade com projetos ESM:

```bash
# Executar o script (isso fará alterações permanentes no banco de dados)
npm run cleanup-js -- userId=USER_ID

# Executar o script em modo de simulação (não altera o banco de dados)
npm run cleanup-js -- userId=USER_ID dryRun=true
```

#### 3. API Admin (somente para administradores)

Endpoint de API que permite sanitizar o banco de dados via HTTP:

```
# Analisar duplicatas (sem remover)
GET /api/admin/cleanup?userId=USER_ID

# Executar sanitização (remove duplicatas)
POST /api/admin/cleanup
{
  "userId": "USER_ID",
  "dryRun": true/false
}
```

### Critérios para Identificação de Duplicatas

#### Carteiras

- Carteiras do tipo `GESTAO_CLICK` com o mesmo nome são consideradas duplicatas
- A carteira mais recente ou com mais transações é preservada
- As transações das carteiras removidas são transferidas para a carteira preservada

#### Transações

- Transações com o mesmo ID externo (externalId) na metadata são consideradas duplicatas
- Para transações sem ID externo, usa-se uma "impressão digital" composta por:
  - ID da carteira + data + valor + descrição
- A transação mais recente é sempre preservada

### Segurança

- Apenas administradores podem executar a sanitização via API
- O script de linha de comando requer acesso direto ao servidor
- Um período de espera de 5 segundos é aplicado antes de qualquer alteração permanente
- Modo de simulação permite verificar o que será alterado antes de aplicar

## Módulos do Sistema

### Módulo de Gerenciamento de Transações

Foi implementado um novo sistema centralizado para gerenciamento de transações, garantindo que todos os módulos da aplicação recebam as informações de transações em tempo real e de forma consistente.

**Principais recursos:**
- Store global com Zustand para armazenar e gerenciar o estado das transações
- Contexto React para facilitar o acesso aos dados em qualquer componente
- Sistema de eventos em tempo real para propagar mudanças
- Forte tipagem com TypeScript para maior segurança

**Como usar:**
```tsx
import { useTransactionContext } from '@/app/_hooks/transaction';

function MeuComponente() {
  const { transactions, addTransaction, updateTransaction } = useTransactionContext();
  
  // Agora você tem acesso a todos os dados de transações
  // e métodos para manipulá-las
}
```

Para documentação detalhada, consulte [Sistema de Gerenciamento de Transações](./docs/transaction-management-system.md).

### Módulo de Conciliação

#### Conciliação Manual

A conciliação manual permite associar manualmente vendas do Gestão Click com transações financeiras, garantindo que todas as transações estejam corretamente registradas e contabilizadas no sistema.

#### Conciliação Automática com Machine Learning

A conciliação automática utiliza técnicas de aprendizado de máquina para identificar correspondências entre vendas do Gestão Click e transações bancárias de forma inteligente e precisa.

**Características principais:**

- **Aprendizado adaptativo**: O sistema aprende com as conciliações manuais realizadas pelo usuário para melhorar a precisão ao longo do tempo.
- **Sistema de pontuação multifatorial**: Utiliza diversos fatores para determinar correspondências, incluindo:
  - Proximidade de valor (30%)
  - Proximidade de data (25%)
  - Similaridade textual (20%)
  - Correspondência de canal (10%)
  - Padrões de cliente (10%)
  - Padrões sazonais (5%)
- **Tolerância adaptativa**: Aplica diferentes níveis de tolerância com base no valor da transação (maior tolerância para valores pequenos, menor para valores grandes).
- **Análise de padrões textuais**: Identifica padrões específicos em descrições de transações, como códigos de venda, nomes de clientes e informações de parcelas.
- **Modo de treinamento**: Requer pelo menos 30 conciliações manuais para começar a fazer recomendações automáticas.
- **Métricas de confiança**: Apresenta métricas detalhadas sobre a confiança das conciliações realizadas.

Para utilizar a conciliação automática:

1. Acesse o menu "Conciliação" > "Inteligente (ML)"
2. Selecione o período e a carteira para análise
3. Clique em "Conciliar Automaticamente"
4. Revise os resultados da conciliação

#### Treinamento do Modelo

O modelo de ML requer um mínimo de 30 conciliações manuais confirmadas para começar a funcionar adequadamente. Quanto mais conciliações manuais forem realizadas, maior será a precisão do sistema.

As conciliações automáticas que são confirmadas como corretas também são incorporadas ao modelo de treinamento, melhorando progressivamente os resultados.

## Dashboards do Gestão Click

A integração com o Gestão Click permite a visualização de dados comerciais importantes através de dashboards interativos que ajudam na tomada de decisão.

### Dashboards Disponíveis

1. **Dashboard de Vendas** (`/dashboard/vendas`)
   - Faturamento total
   - Vendas por vendedor
   - Ticket médio
   - Produtos mais vendidos
   - Volume de vendas

2. **Dashboard de Atendimentos** (`/dashboard/atendimentos`)
   - Atendimentos por canal de comunicação
   - Taxa de conversão
   - Performance dos consultores
   - Tempo médio de resposta
   - Taxa de abandono
   - Origem dos leads

3. **Dashboard de Conversão** (`/dashboard/conversao`)
   - Taxa de conversão por canal
   - Etapas do funil de vendas
   - Tempo médio de conversão
   - Motivos de não conversão

4. **Dashboard de Metas Estratégicas** (`/dashboard/metas`)
   - Metas vs. realizado
   - Projeção de vendas
   - Histórico de desempenho
   - Indicadores de sucesso

5. **Dashboard de Performance da Equipe** (`/dashboard/performance`)
   - Ranking de vendedores
   - Métricas individuais
   - Comparativo mensal
   - Histórico de bonificações

### Estrutura de Diretórios

Os dashboards estão organizados na estrutura de pastas do Next.js da seguinte forma:

```
app/
└── (auth-routes)/
    └── dashboard/
        ├── layout.tsx          # Layout comum para todos os dashboards
        ├── page.tsx            # Redirecionamento para o dashboard principal
        ├── _components/        # Componentes compartilhados entre dashboards
        ├── vendas/             # Dashboard de vendas
        ├── atendimentos/       # Dashboard de atendimentos
        ├── conversao/          # Dashboard de conversão 
        ├── metas/              # Dashboard de metas
        └── performance/        # Dashboard de performance
```

### Configuração da Integração

Para utilizar os dashboards, é necessário configurar a integração com o Gestão Click:

1. API Key (obrigatório) - chave de acesso fornecida pelo Gestão Click
2. Secret Token (opcional) - token para autenticação avançada
3. API URL (opcional) - URL personalizada da API, se diferente da padrão

### Endpoints de API utilizados

A integração utiliza os seguintes endpoints do Gestão Click:

- `/vendas` - Dados de vendas e faturamento
- `/funcionarios` - Informações sobre vendedores e consultores
- `/clientes` - Dados de clientes e atendimentos
- `/produtos` - Catálogo de produtos e serviços

### Filtragem de Dados

Todos os dashboards permitem filtragem por período (data inicial e data final) para análise de dados históricos ou recentes conforme necessidade.

---

Documento atualizado em: Outubro de 2023 