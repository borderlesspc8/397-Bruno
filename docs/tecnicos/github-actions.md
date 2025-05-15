# GitHub Actions - CI/CD

Esta documentação detalha os workflows de CI/CD (Integração Contínua e Entrega Contínua) implementados com GitHub Actions no projeto ContaRápida.

## Visão Geral

O ContaRápida utiliza uma estrutura completa de automação que gerencia:

- Testes e validação de código
- Deploy automatizado para ambientes de staging e produção via Portainer
- Revisão automatizada de Pull Requests
- Mesclagem automática de código aprovado

## Workflows Implementados

### 1. Testes Automatizados (`run-tests.yml`)

Este workflow executa a bateria completa de testes e validações para garantir a qualidade do código.

**Trigger:**
- Push para branches `main` e `develop`
- Pull Requests para branches `main` e `develop`
- Ignora mudanças em arquivos de documentação (`.md`) e configuração

**Serviços:**
- PostgreSQL 15 (para testes de banco de dados)
- Redis 7 (para testes de cache)

**Etapas principais:**
```yaml
steps:
  - Checkout do código
  - Configuração de Node.js 20
  - Cache de dependências
  - Instalação de dependências
  - Geração do cliente Prisma
  - Criação do banco de testes
  - Execução de seeds
  - Verificação de tipos TypeScript
  - Execução de linting
  - Testes unitários e de integração
  - Publicação de cobertura de testes
  - Testes end-to-end (apenas em main)
  - Armazenamento de artefatos de teste
```

### 2. Deploy em Staging (`deploy-staging.yml`)

Este workflow realiza o deploy automático para o ambiente de staging quando novo código é enviado para a branch `develop`.

**Trigger:**
- Push para branch `develop`
- Ignora mudanças em arquivos de documentação e configuração

**Etapas principais:**
```yaml
steps:
  - Checkout do código
  - Configuração de Node.js 20
  - Cache de dependências
  - Instalação de dependências
  - Geração do cliente Prisma
  - Build da aplicação
  - Compactar arquivos para deploy
  - Upload dos arquivos para deploy
  - Deploy para VPS via Portainer
```

**Variáveis de ambiente necessárias:**
- `PORTAINER_WEBHOOK_URL_STAGING`

### 3. Deploy em Produção (`deploy-production.yml`)

Este workflow gerencia o deploy completo para o ambiente de produção, incluindo testes, build, deploy e criação de release.

**Trigger:**
- Push para branch `main`
- Ignora mudanças em arquivos de documentação e configuração

**Jobs:**
1. **Testes e Validação**: Executa todos os testes
2. **Build e Deploy**: Realiza o deploy em produção

**Etapas principais do job de deploy:**
```yaml
steps:
  - Checkout do código
  - Configuração de Node.js 20
  - Cache de dependências
  - Instalação de dependências
  - Geração do cliente Prisma
  - Build da aplicação
  - Criação de tag de release
  - Criação de release no GitHub
  - Compactar arquivos para deploy
  - Upload dos arquivos para deploy
  - Deploy para VPS via Portainer
```

**Automação de versionamento:**
- Criação automática de tags semânticas (patch por padrão)
- Geração automática de changelog
- Criação de release no GitHub

### 4. Revisão de Pull Requests (`pr-review.yml`)

Este workflow auxilia os revisores de código, executando verificações automatizadas em Pull Requests.

**Trigger:**
- Pull Requests para branches `main` e `develop`
- Eventos de abertura, sincronização e reabertura

**Etapas principais:**
```yaml
steps:
  - Checkout do código
  - Configuração de Node.js 20
  - Instalação de dependências
  - Verificação de tipos TypeScript
  - Execução de linting
  - Identificação de arquivos alterados
  - Execução de testes unitários
  - Execução de testes de integração
  - Publicação de relatório de cobertura
  - Comentário automático no PR com resumo das verificações
```

**Comentário automático:**
O workflow posta automaticamente um comentário no PR com o resultado de todas as verificações, indicando se o código está pronto para revisão ou se foram encontrados problemas.

### 5. Mesclagem Automática de PRs (`main.yml`)

Este workflow automatiza a mesclagem de Pull Requests que foram aprovados e passaram em todas as verificações.

**Trigger:**
- Diversos eventos de Pull Request (label, unlabel, sincronização, etc.)
- Pull Request Reviews
- Conclusão de Check Suites

**Etapas principais:**
```yaml
steps:
  - Mesclar PR automaticamente se:
    - Possuir a label "automerge"
    - Não possuir a label "work in progress"
    - Tiver pelo menos uma aprovação
    - Todas as verificações passarem
```

**Configurações:**
- Método de mesclagem: squash
- Formato da mensagem: título do PR
- Tentativas de mesclagem: 6
- Intervalo entre tentativas: 10 segundos

## Configuração Local

### Executando Workflows Localmente

Para testar os workflows localmente antes de enviar para o GitHub, você pode usar a ferramenta `act`:

```bash
# Instalar act
brew install act

# Testar workflow de testes
act -j test --secret-file .secrets -W .github/workflows/run-tests.yml

# Testar workflow de PR
act pull_request -W .github/workflows/pr-review.yml
```

### Testes Manuais

Para executar manualmente os mesmos testes que os workflows executam:

```bash
# Testes completos
npm run test:all

# Apenas testes unitários
npm run test:unit

# Apenas testes de integração
npm run test:integration

# Apenas testes end-to-end
npm run test:e2e

# Verificação de tipos
npm run typecheck

# Linting
npm run lint
```

## Configuração de Secrets

Para o funcionamento correto dos workflows, configure as seguintes secrets no GitHub:

| Secret | Descrição | Onde obter |
|--------|-----------|------------|
| `PORTAINER_WEBHOOK_URL_STAGING` | URL de webhook para deploy no ambiente de staging | Portainer → Stacks → contarapida-staging → Webhooks |
| `PORTAINER_WEBHOOK_URL_PRODUCTION` | URL de webhook para deploy no ambiente de produção | Portainer → Stacks → contarapida-production → Webhooks |
| `CODECOV_TOKEN` | Token para relatórios de cobertura | Dashboard do Codecov → Settings → Repository Upload Token |

## Convenções de Commits e Branches

Para melhor aproveitamento dos workflows, siga estas convenções:

### Formatos de Commit

Utilize o padrão Conventional Commits:

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé(s) opcional(is)]
```

Exemplos:
- `feat: adiciona componente de filtro de datas`
- `fix(dashboard): corrige cálculo de lucro no card de resumo`
- `docs: atualiza instruções de deploy`
- `chore: atualiza dependências`

### Estrutura de Branches

- **main**: Código em produção
- **develop**: Código para próxima release
- **feature/***: Novas funcionalidades
- **bugfix/***: Correções de bugs
- **hotfix/***: Correções urgentes para produção
- **release/***: Preparação para release

## Recursos Adicionais

- [Documentação GitHub Actions](https://docs.github.com/pt/actions)
- [Workflow Syntax for GitHub Actions](https://docs.github.com/pt/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Portainer Documentation](https://docs.portainer.io/)
- [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/) 