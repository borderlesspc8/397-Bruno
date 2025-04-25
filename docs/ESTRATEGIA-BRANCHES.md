# Estratégia de Branches - Conta Rápida

Este documento descreve a estratégia de branches adotada no projeto Conta Rápida, especialmente para o primeiro lançamento focado nos indicadores da rota de dashboards.

## Estrutura de Branches

Adotamos o modelo GitFlow adaptado para nossas necessidades:

- **main**: Branch principal que contém o código em produção
- **develop**: Branch de desenvolvimento que contém as funcionalidades aprovadas para o próximo release
- **feature/[nome-da-feature]**: Branches para desenvolvimento de novas funcionalidades
- **fix/[nome-do-fix]**: Branches para correção de bugs
- **release/[versão]**: Branches para preparação de releases

## Fluxo de Trabalho

1. Todo desenvolvimento começa a partir da branch `develop`
2. Para cada nova funcionalidade, crie uma branch `feature/[nome-da-feature]` a partir de `develop`
3. Ao concluir a funcionalidade, abra um Pull Request para a branch `develop`
4. Após a aprovação do PR, a branch será mesclada em `develop`
5. Quando todas as funcionalidades do release estiverem em `develop`, crie uma branch `release/[versão]`
6. Na branch de release, apenas correções de bugs são permitidas
7. Após os testes na branch de release, ela será mesclada tanto em `main` quanto em `develop`
8. A branch `main` receberá uma tag com a versão do release

## Primeiro Lançamento - Foco nos Indicadores de Dashboard

Para o primeiro lançamento, focaremos apenas na rota de dashboards com os seguintes indicadores:

- Totais de vendas
- Desempenho por vendedor
- Métricas de conversão
- Ranking de produtos

### Branches para o Primeiro Lançamento

- `feature/dashboard-indicadores-base`: Implementação dos indicadores básicos
- `feature/dashboard-vendedores`: Implementação dos indicadores por vendedor
- `feature/dashboard-produtos`: Implementação dos indicadores por produto
- `feature/dashboard-ui-melhorias`: Melhorias de UI/UX nos dashboards
- `release/0.1.0`: Branch de release para o primeiro lançamento

## Convenções de Commits

Utilizamos commits semânticos seguindo o padrão:

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alteração na documentação
- `style`: Alterações que não afetam o código (formatação, etc)
- `refactor`: Refatoração de código
- `test`: Adição ou correção de testes
- `chore`: Alterações no processo de build, ferramentas, etc

Exemplo: `feat(dashboard): adiciona gráfico de vendas por mês`

## CI/CD

- Commits em qualquer branch acionam o processo de CI (lint e build)
- Merges na branch `develop` acionam o deploy para o ambiente de staging
- Merges na branch `main` acionam o deploy para o ambiente de produção

## Monorepo vs Múltiplos Repositórios

Para o primeiro lançamento, manteremos a estrutura de monorepo atual, combinando frontend e backend no mesmo repositório, pois:

1. Facilita a coordenação de mudanças que afetam tanto frontend quanto backend
2. Simplifica o processo de CI/CD para um primeiro lançamento
3. Reduz a sobrecarga de gerenciamento de múltiplos repositórios

No futuro, após o crescimento do projeto, poderemos reavaliar essa decisão com base nas necessidades de escala e organização da equipe. 