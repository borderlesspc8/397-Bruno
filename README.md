# Conta Rápida - Gestão Financeira Inteligente

Aplicação de gestão financeira pessoal e empresarial com interface moderna e recursos de inteligência artificial.

## Visão Geral

Conta Rápida é uma plataforma web de gestão financeira que permite aos usuários:
- Acompanhar despesas e receitas
- Categorizar transações
- Visualizar relatórios e gráficos
- Gerenciar múltiplas carteiras
- Criar metas financeiras
- Receber insights personalizados via IA

## Tecnologias

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Estilização**: TailwindCSS, shadcn/ui
- **Infraestrutura**: Vercel

## Funcionalidades Principais

- **Gestão de Transações**: Registro e categorização de despesas e receitas
- **Múltiplas Carteiras**: Suporte para diferentes contas e cartões
- **Categorização Inteligente**: Sugestões automáticas para categorização
- **Dashboards Personalizados**: Visualizações customizáveis dos dados financeiros
- **Dashboards Integrados ao Gestão Click**: Visualização consolidada de dados de vendas e atendimentos
- **Notificações em Tempo Real**: Alertas sobre movimentações importantes
- **Exportação de Dados**: Relatórios em diversos formatos
- **Tema Escuro/Claro**: Interface adaptável à preferência do usuário

## Arquitetura Responsiva

O layout da aplicação foi estruturado para oferecer uma experiência consistente em diferentes dispositivos:

- **Layout Adaptativo**: Interface que se ajusta automaticamente para desktop, tablet e celular
- **Sidebar Colapsável**: Menu lateral que pode ser expandido ou recolhido para maximizar o espaço útil
- **Navbar Fixa**: Barra de navegação superior sempre acessível com ações principais
- **Sistema de Notificações**: Notificações em tempo real via WebSockets
- **Conteúdo Fluido**: Área de conteúdo principal com dimensionamento dinâmico

## Níveis de Assinatura

- **Gratuito**: Funcionalidades básicas com limites de uso
- **Básico**: Recursos intermediários com limites ampliados
- **Premium**: Acesso completo a todas as funcionalidades
- **Empresarial**: Soluções personalizadas para empresas

## Deployment

Para executar localmente:

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Executar migrações do banco de dados
npx prisma migrate dev

# Iniciar servidor de desenvolvimento
npm run dev
```

## Contribuição

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das alterações (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT.

## Módulo de Orçamentos

O módulo de orçamentos permite:

- Criar orçamentos por categoria ou carteira
- Definir limites diários, semanais, mensais ou anuais
- Acompanhar o progresso de gastos em tempo real
- Visualizar relatórios detalhados com gráficos
- Receber insights e recomendações baseados nos padrões de gastos

### Relatórios de Orçamento

Os relatórios de orçamento fornecem:

- Gráficos de progressão de gastos ao longo do tempo
- Análises de distribuição de gastos por categoria
- Comparações com períodos anteriores
- Insights sobre padrões de gastos
- Sugestões para economia e melhor gestão financeira

## Sistema de Notificações Inteligentes

### Visão Geral

O sistema de notificações da aplicação Conta Rápida foi aprimorado para incluir recursos inteligentes baseados em IA. 
Ele agora é capaz de:

1. **Detectar anomalias em transações** - Analisa o histórico de transações do usuário para identificar valores incomuns
2. **Enviar notificações em tempo real** - Utiliza WebSockets para comunicação instantânea
3. **Exibir alertas visuais interativos** - Interface aprimorada com visualização detalhada das anomalias

### Componentes Principais

#### 1. TransactionAnomalyService

Serviço responsável por analisar transações e detectar padrões anômalos baseados em:
- Média histórica de valores por categoria
- Desvio padrão dos valores
- Análise estatística (z-score)

Métodos principais:
- `detectAnomaly()` - Analisa uma transação e determina se é anômala
- `analyzeAndNotify()` - Verifica anomalias e envia notificações quando necessário
- `analyzeRecentTransactions()` - Analisa transações recentes em lote

#### 2. NotificationAlert

Componente UI para exibição de alertas interativos de notificações importantes:
- Exibe detalhes visuais sobre anomalias detectadas
- Permite interação direta com a notificação
- Apresenta estatísticas relevantes (nível de anomalia, razão, comparações)

#### 3. Integração com WebSockets

O sistema utiliza WebSockets para:
- Enviar notificações em tempo real
- Atualizar contadores de notificações não lidas
- Manter o usuário informado imediatamente sobre eventos importantes

### Fluxo de Funcionamento

1. Quando uma nova transação é criada, o `TransactionAnomalyService` analisa a transação
2. Se uma anomalia é detectada, uma notificação é criada com metadados detalhados
3. Se o usuário estiver online, a notificação é enviada em tempo real via WebSocket
4. O componente `NotificationAlert` exibe a notificação de forma interativa
5. O usuário pode visualizar detalhes ou navegar diretamente para a transação

### Configuração

Os limiares de detecção de anomalias podem ser configurados:
- **Threshold (padrão: 50)** - Percentual que determina se uma transação é anômala
- **Lookback Period (padrão: 90 dias)** - Período histórico para análise

### Extensibilidade

O sistema foi projetado de forma modular para suportar futuros tipos de análises inteligentes:
- Detecção de fraudes
- Padrões de gastos
- Recomendações de economia
- Alertas de orçamento preditivos

## Módulos Aprimorados

### Carteiras (Wallets)

O sistema de carteiras foi recentemente aprimorado para oferecer mais funcionalidades e maior robustez no controle financeiro:

#### Recursos Adicionados
- **Tipos de Carteira**: Agora as carteiras podem ser especificadas como conta corrente, poupança, cartão de crédito, investimento, dinheiro físico ou carteiras digitais.
- **Controle de Saldo Negativo**: Opção para configurar se uma carteira permite saldo negativo.
- **Limites de Crédito**: Para carteiras do tipo cartão de crédito, é possível definir limites e configurar datas de fechamento e vencimento.
- **Reconciliação Automática**: O saldo é automaticamente recalculado com base nas transações para garantir consistência dos dados.
- **Transferências Entre Carteiras**: Implementação de transferências diretas entre carteiras.

#### Serviço Dedicado
O `WalletService` centraliza todas as operações de carteira em um único local com métodos para:
- Criar, atualizar e excluir carteiras
- Validar operações antes de executá-las
- Reconciliar saldos
- Gerar relatórios de fluxo de caixa
- Transferir fundos entre carteiras

### Transações (Transactions)

O módulo de transações foi redesenhado para oferecer mais funcionalidades, melhor desempenho e maior consistência:

#### Recursos Adicionados
- **Validação Robusta**: Todas as transações passam por uma validação antes de serem processadas.
- **Paginação Eficiente**: Implementação de paginação baseada em cursor para melhor desempenho em grandes conjuntos de dados.
- **Tags e Status**: Adição de campos para categorização avançada e acompanhamento de status das transações.
- **Atualização Inteligente de Saldo**: As mudanças em transações existentes atualizam automaticamente os saldos das carteiras afetadas.
- **Resumos e Agrupamentos**: Métodos para obter resumos estatísticos de transações por categorias e períodos.

#### Serviço Dedicado
O `TransactionService` centraliza a lógica de transações com métodos para:
- Criar, atualizar e excluir transações
- Validar dados antes do processamento
- Buscar transações com filtros avançados
- Duplicar transações existentes
- Gerar relatórios e resumos

### Transações Recorrentes

Uma nova funcionalidade implementada para automatizar transações repetitivas:

#### Recursos
- **Agendamento Flexível**: Configuração de transações com frequência diária, semanal, mensal ou anual.
- **Geração Automática**: Execução automática via tarefa cron para criar transações nos momentos adequados.
- **Configurações Avançadas**: Suporte para dias específicos do mês, dias da semana e intervalos personalizados.
- **Validação por Carteira**: Verificação automática se a carteira associada permite a operação.
- **Prazo Limitado**: Possibilidade de definir uma data final para a recorrência.

#### API Completa
API REST dedicada para gerenciar transações recorrentes com endpoints para:
- Criar e configurar padrões de recorrência
- Listar transações recorrentes ativas
- Atualizar configurações de recorrência
- Excluir padrões de recorrência
- Gerar transações manualmente a partir de um padrão

#### Processamento Automático
Implementação de um endpoint cron protegido para o processamento automático:
- Execução diária para verificar transações pendentes
- Geração automática de transações quando chegam as datas agendadas
- Atualização das datas de próxima geração
- Registros detalhados para auditoria

## Contribuição

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das alterações (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT.

## Contato

Para qualquer dúvida ou sugestão, entre em contato pelo email: contato@contarapida.com.br

## Integração com Banco do Brasil

A integração com a API do Banco do Brasil foi implementada seguindo as especificações oficiais disponíveis no Portal do Desenvolvedor do BB. Principais características:

### Autenticação

- **Padrão OAuth 2.0**: Implementamos o fluxo Client Credentials conforme RFC 6749
- **Ambientes**: 
  - Homologação: https://oauth.bb.com.br
  - Produção: https://oauth.bb.com.br
- **Segurança**: Suporte a autenticação mútua de certificados (mTLS)
- **Renovação de token**: Gerenciamento automático de expiração e renovação de tokens

### API de Extratos

- **Endpoints**:
  - Homologação: https://api.hm.bb.com.br/financas/v1
  - Produção: https://api.bb.com.br/financas/v1
- **Recursos**:
  - Obtenção de extratos com suporte a filtros e paginação
  - Formatação automática de datas e números de conta
  - Mapeamento de transações para o formato interno
  
### Funcionalidades Implementadas

- **Teste de Conexão**: Verificação da validade da conexão e acesso às informações bancárias
- **Sincronização**: Importação de transações do período especificado
- **Consulta de Extratos**: API para consulta de transações com filtros e paginação
- **Tratamento de Erros**: Identificação e tratamento adequado de erros de autenticação e acesso

### Boas Práticas de Segurança

- Certificados A1 da cadeia ICP-Brasil
- Criptografia de dados em trânsito
- Gerenciamento seguro de chaves e tokens
- Logs detalhados para auditoria

Para mais informações sobre a API do Banco do Brasil, consulte a [documentação oficial](https://developers.bb.com.br/).

## Melhorias Recentes (Março 2025)

### Integração com Gestão Click

A integração com o sistema Gestão Click foi aprimorada para oferecer uma experiência mais robusta e confiável:

#### Funcionalidades:
- **Mapeamento de Categorias**: Implementado sistema inteligente de mapeamento de categorias do Gestão Click para as categorias internas, com normalização de texto e detecção de padrões.
- **Mapeamento de Métodos de Pagamento**: Adicionado mapeamento de formas de pagamento do Gestão Click para o enum `TransactionPaymentMethod` do sistema.
- **Importação de Carteiras**: Suporte para criação automática de carteiras (contas bancárias) com base nos dados do Gestão Click.
- **Deduplição de Transações**: Algoritmo aprimorado para evitar duplicação de transações durante importações recorrentes.

#### Melhorias Técnicas:
- **Tipagem Forte**: Corrigidos erros de tipagem no sistema de verificação de transações.
- **Logs Aprimorados**: Adicionados logs detalhados para facilitar depuração em caso de erros.
- **Padrões SOLID**: Refatoração seguindo princípios de responsabilidade única e aberto/fechado, facilitando extensões futuras.

### Configuração do Stripe

O sistema de pagamentos com Stripe foi aprimorado para oferecer melhor experiência em ambiente de desenvolvimento:

#### Melhorias:
- **Modo de Desenvolvimento**: Implementada detecção automática de ambiente de desenvolvimento com respostas simuladas para webhooks.
- **Logs Detalhados**: Adicionados logs para facilitar a depuração de eventos do webhook.
- **Versão da API**: Atualizada para usar a versão estável da API do Stripe (2023-10-16).

#### Notas de Integração:
- Em ambiente de desenvolvimento, os webhooks do Stripe retornam respostas simuladas para facilitar testes.
- Em produção, é necessário configurar as variáveis de ambiente `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` com valores válidos.

### Problemas Conhecidos:
- Durante a importação de categorias do Gestão Click, categorias não reconhecidas são mapeadas para "OTHER".
- A integração do Stripe em modo de desenvolvimento exibirá mensagens de log adicionais para depuração.

## Scripts de Build

A aplicação possui diferentes scripts de build para atender a diferentes necessidades:

- `npm run build`: Script padrão de build do Next.js
- `npm run build:safe`: Build ignorando erros de linting
- `npm run build:dynamic`: Build com geração estática desativada
- `npm run build:skip-errors`: **RECOMENDADO** Build que ignora erros de pré-renderização

### Solução para Erros de Pré-renderização

A aplicação pode apresentar erros durante o build relacionados à pré-renderização das páginas de erro 404 e 500. Estes erros ocorrem devido a conflitos entre o componente `<Html>` importado fora do contexto apropriado.

Para contornar esse problema, foi implementado um script personalizado (`scripts/build-skip-errors.js`) que:

1. Executa o processo de build com as configurações apropriadas
2. Captura e filtra mensagens de erro relacionadas à pré-renderização
3. Permite que o build seja concluído com sucesso, ignorando apenas os erros específicos de pré-renderização
4. Gera um marcador de build bem-sucedido para deploy

**Uso recomendado:**

```bash
npm run build:skip-errors
```

Este script é especialmente útil em ambientes de CI/CD, onde erros no build podem interromper o pipeline de deploy.

## Configuração de Transações Recorrentes

Para garantir que as transações recorrentes sejam processadas automaticamente, você precisa configurar um job para executar diariamente. Existem duas opções principais:

### Opção 1: API Route com Cron

1. Crie um arquivo em `app/api/cron/recurring-transactions/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { RecurringTransactionService } from "@/app/_services/recurring-transaction-service";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Verificar se a solicitação contém o token de autorização
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Não autorizado", { status: 401 });
    }
    
    // Processar transações recorrentes
    const processedCount = await RecurringTransactionService.processRecurringTransactions();
    
    return NextResponse.json({
      success: true,
      processedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao processar transações recorrentes:", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
```

2. Configure a variável de ambiente `CRON_SECRET` em seu `.env.local` e no ambiente de produção.

3. Configure um serviço de cron para acessar esta API diariamente:
   - Usando Vercel Cron Jobs (recomendado se estiver hospedado na Vercel)
   - Utilizando um serviço como Uptime Robot, Cronitor ou Similar

### Opção 2: Criar um script separado para execução via cron

1. Crie um arquivo em `scripts/process-recurring-transactions.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { RecurringTransactionService } from "../app/_services/recurring-transaction-service";

async function processRecurringTransactions() {
  try {
    console.log("Iniciando processamento de transações recorrentes...");
    
    const processedCount = await RecurringTransactionService.processRecurringTransactions();
    
    console.log(`Processamento concluído. ${processedCount} transações geradas.`);
    process.exit(0);
  } catch (error) {
    console.error("Erro ao processar transações recorrentes:", error);
    process.exit(1);
  }
}

processRecurringTransactions();
```

2. Configure um job cron no servidor para executar:

```bash
# Exemplo de configuração cron para execução diária às 3:00 AM
0 3 * * * cd /caminho/para/contarapida && npx ts-node scripts/process-recurring-transactions.ts >> /var/log/contarapida/recurring.log 2>&1
```

Escolha a opção que melhor se adapta à sua infraestrutura e necessidades de hospedagem.

## Atualização: Importação do Gestão Click (30/06/2024)

### Problema Corrigido
- O fluxo de automação do Gestão Click estava importando apenas movimentações de 2025, quando deveria importar dos últimos 5 anos.

### Alterações Realizadas
1. **Modificado o método `importTransactionsForWallet`**:
   - Agora aceita parâmetros explícitos de data início e fim
   - Melhorada a documentação de parâmetros
   - Adicionados logs detalhados para diagnóstico das datas das transações

2. **Ajustado o método `autoImportTransactions`**:
   - Substituída a lógica de usar apenas a última data de sincronização
   - Configurado para sempre usar os últimos 5 anos de dados
   - Aumentado o limite de transações por página para 1000 (era menor)

3. **Atualizada a rota de importação automática**:
   - Forçado o modelo de importação para "histórico completo"
   - Aumentado o limite máximo de transações para 50.000
   - Adicionados logs detalhados para diagnóstico

4. **Documentação:**
   - Atualizada a documentação explicando as mudanças
   - Adicionada seção de solução de problemas

### Benefícios da Correção
- Agora todos os dados de movimentações financeiras dos últimos 5 anos são corretamente importados
- Maior consistência com os dados exibidos no Gestão Click
- Melhor suporte para análises históricas e relatórios financeiros

### Como Testar
Execute a importação automática do Gestão Click e verifique se as movimentações dos anos anteriores a 2025 estão sendo importadas corretamente. Consulte a documentação em `docs/GESTAO_CLICK.md` para mais detalhes.

## Integrações

### Gestão Click

O sistema possui integração com o Gestão Click para importação e gerenciamento de:

- **Clientes**: Importação e visualização de clientes
- **Vendas**: Importação e visualização de vendas, com detalhes e situações
- **Financeiro**: Importação de transações financeiras
- **Relatórios**: Cruzamento de dados entre clientes, vendas e transações

A integração requer acesso ao sistema Gestão Click e configuração das credenciais de API.

Para mais detalhes, consulte a [documentação completa da integração](docs/gestao-click-implementacao.md).

## Componentes do Dashboard

### ProdutosVendidos

O componente `ProdutosVendidos` foi aprimorado para exibir dados de produtos vendidos com as seguintes funcionalidades:

- **Visualização em Gráficos**: Exibe um gráfico de barras com os 10 produtos mais vendidos.
- **Tabela Detalhada**: Apresenta uma tabela completa com detalhes de todos os produtos.
- **Ordenação Flexível**: Permite ordenar produtos por quantidade vendida ou por faturamento total.
- **Categorização Visual**: Utiliza ícones e cores diferentes para cada categoria de produto.
- **Formatação Monetária**: Exibe valores monetários no formato brasileiro (R$).
- **Responsividade**: Layout adaptável para diferentes tamanhos de tela.
- **Estado de Vazio**: Tratamento adequado para quando não há produtos no período selecionado.

#### Utilização

```jsx
<ProdutosVendidos produtos={listaDeProdutos} />
```

#### Interface do Produto

```typescript
interface Produto {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
  categoria?: string;
}
```

O componente agora está totalmente tipado e compatível com o TypeScript, seguindo as melhores práticas de desenvolvimento React.

### RankingVendedores

O componente `RankingVendedores` foi desenvolvido para exibir um ranking visual dos vendedores com base em seu desempenho, com as seguintes funcionalidades:

- **Visualização de Pódio**: Exibe os três melhores vendedores em um formato de pódio interativo com medalhas.
- **Ranking Completo**: Apresenta uma lista completa de todos os vendedores ordenados por desempenho.
- **Opções de Ordenação**: Permite ordenar por valor absoluto de vendas ou por percentual em relação ao total.
- **Formatação Monetária**: Exibe valores financeiros no formato brasileiro (R$).
- **Gráficos de Progresso**: Barras de progresso visual para comparar o desempenho entre vendedores.
- **Avatares Personalizados**: Utiliza as iniciais do nome para criar avatares de identificação.
- **Responsividade**: Layout adaptável para diferentes tamanhos de tela.
- **Interface Intuitiva**: Uso de cores e ícones para facilitar a compreensão dos dados.
- **Estado de Vazio**: Tratamento adequado para quando não há dados no período selecionado.

#### Utilização

```jsx
<RankingVendedores 
  vendedores={listaDeVendedores} 
  totalVendas={valorTotalVendas}
  titulo="Ranking de Vendedores"
/>
```

#### Interface do Vendedor

```typescript
interface Vendedor {
  id: string;
  nome: string;
  vendas: number;
  faturamento: number;
  ticketMedio: number;
}
```

#### Props Disponíveis

| Propriedade | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| vendedores | Vendedor[] | Sim | Lista de vendedores a serem exibidos no ranking |
| totalVendas | number | Não | Valor total de vendas para cálculo de percentuais |
| titulo | string | Não | Título personalizado para o componente |
| periodo | string | Não | Período de referência dos dados ("7d", "30d", "90d", etc.) |
| onPeriodoChange | (periodo: string) => void | Não | Callback acionado quando o período é alterado |

#### Como Funciona

1. O componente ordena a lista de vendedores conforme a opção selecionada (valor ou percentual)
2. Extrai os três primeiros vendedores para o pódio
3. Renderiza o pódio com avatares personalizados e medalhas para os três primeiros
4. Cria uma lista completa com todos os vendedores, exibindo barras de progresso
5. Cada vendedor tem seu percentual calculado em relação ao total de vendas

O componente segue os princípios SOLID, mantendo uma responsabilidade única e sendo facilmente extensível para novas funcionalidades ou visualizações.

### VendedoresChart

O componente `VendedoresChart` foi desenvolvido para visualização gráfica do desempenho de vendedores, com as seguintes características:

- **Gráfico de Barras Horizontal**: Apresenta barras horizontais para melhor visualização do faturamento por vendedor.
- **Ordenação Automática**: Ordena os vendedores por faturamento em ordem decrescente.
- **Formatação Monetária**: Exibe valores em formato monetário brasileiro (R$).
- **Tooltip Interativo**: Ao passar o mouse sobre as barras, exibe informações detalhadas.
- **Responsividade**: Adapta-se automaticamente a diferentes tamanhos de tela.
- **Truncamento Inteligente**: Nomes muito longos são truncados para melhor visualização.
- **Eixos Personalizados**: Eixo Y com nomes dos vendedores e eixo X com valores em milhares (k).
- **Tema Consistente**: Utiliza a cor dourada padrão da aplicação para manter a identidade visual.
- **Estado de Vazio**: Tratamento adequado para quando não há dados no período selecionado.

#### Utilização

```jsx
<VendedoresChart vendedores={listaDeVendedores} />
```

#### Interface do Vendedor

```typescript
interface VendedorData {
  nome: string;
  faturamento: number;
  vendas: number;
  ticketMedio: number;
}
```

#### Implementação Técnica

O componente utiliza a biblioteca `recharts` para renderização do gráfico e contém:

1. Uma função interna `formatCurrency` para formatação de valores monetários
2. Constante para padronização da cor dourada
3. Tratamento para dados vazios ou nulos
4. Ordenação dos vendedores por faturamento
5. Personalização avançada dos eixos X e Y
6. Configuração de tooltip interativo com formatação monetária
7. Uso de `ResponsiveContainer` para garantir adaptabilidade a diferentes telas

O gráfico é renderizado em um componente `Card` que segue o padrão visual da aplicação, com cabeçalho, título e descrição.

### VendedoresTable

O componente `VendedoresTable` apresenta uma tabela detalhada com os dados de desempenho dos vendedores, com as seguintes características:

- **Tabela Organizada**: Exibe dados tabulares com colunas para nome, vendas, faturamento e ticket médio.
- **Ordenação por Faturamento**: Ordena automaticamente os vendedores por faturamento em ordem decrescente.
- **Formatação Monetária**: Apresenta valores financeiros no formato brasileiro (R$).
- **Interatividade**: Suporte para clique nos nomes dos vendedores para exibir detalhes.
- **Estilização Consistente**: Design visual alinhado com a identidade da aplicação.
- **Responsividade**: Tabela com scroll horizontal para adaptação a telas menores.
- **Estado de Vazio**: Tratamento adequado para quando não há dados disponíveis.
- **Cabeçalho Informativo**: Título e descrição personalizáveis.

#### Utilização

```jsx
<VendedoresTable 
  vendedores={listaDeVendedores} 
  onClickVendedor={handleClickVendedor}
  titulo="Desempenho de Vendedores"
/>
```

#### Interface do Vendedor

```typescript
interface VendedorData {
  nome: string;
  faturamento: number;
  vendas: number;
  ticketMedio: number;
  percentual?: number;
  posicao?: number;
}
```

#### Props Disponíveis

| Propriedade | Tipo | Obrigatório | Descrição |
|-------------|------|-------------|-----------|
| vendedores | VendedorData[] | Sim | Lista de vendedores a serem exibidos na tabela |
| onClickVendedor | (vendedor: VendedorData) => void | Não | Callback acionado ao clicar no nome de um vendedor |
| titulo | string | Não | Título personalizado para o componente (padrão: "Desempenho de Vendedores") |

#### Implementação Técnica

O componente possui as seguintes características técnicas:

1. Verifica a presença de dados antes da renderização
2. Ordena os vendedores por faturamento em ordem decrescente
3. Adiciona a propriedade `posicao` ao vendedor quando o usuário clica no nome
4. Utiliza a função `formatCurrency` para formatação monetária
5. Utiliza design responsivo com overflow para tabelas em dispositivos menores
6. Implementa interatividade com hovers nos itens da tabela

Esse componente se integra perfeitamente com o `VendedoresChart` e o `RankingVendedores` para criar uma experiência completa de visualização de dados de vendedores.
