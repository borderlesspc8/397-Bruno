# Guia de Implantação do Conta Rápida

Este documento fornece instruções para executar a aplicação Conta Rápida em diferentes ambientes.

## Executando em Ambiente de Desenvolvimento

Para executar a aplicação em ambiente de desenvolvimento com hot-reload:

```bash
npm run dev
```

Este comando inicia o servidor de desenvolvimento na porta 3000 (ou na próxima porta disponível).

## Executando em Ambiente de Produção

Devido a algumas limitações com a renderização estática e o uso de contextos React, recomendamos as seguintes abordagens para execução em produção:

### Opção 1: Modo de Desenvolvimento Simulado (Recomendado)

Esta opção executa a aplicação em modo de desenvolvimento, mas com configurações otimizadas:

```bash
npm run dev:prod
```

### Opção 2: Build Seguro

Se precisar executar em modo de produção completo:

1. Construa a aplicação ignorando erros de lint:

```bash
npm run build:safe
```

2. Inicie o servidor com opções seguras:

```bash
npm run start:safe
```

## Primeiro Lançamento - Dashboard de Indicadores

Para o primeiro lançamento, estamos focando apenas nos indicadores da rota de dashboards. A implantação segue um processo simplificado:

### Ambiente de Staging

O deploy para staging é automatizado através do GitHub Actions quando uma alteração é mesclada na branch `develop`. Você pode também realizar um deploy manual seguindo estes passos:

1. Certifique-se de estar com a branch `develop` atualizada:
```bash
git checkout develop
git pull origin develop
```

2. Execute o build seguro:
```bash
npm run build:safe
```

3. Faça o deploy para o ambiente de staging (substitua [STAGING_URL] pela URL do seu ambiente):
```bash
# Exemplo fictício - ajuste conforme sua infraestrutura
rsync -avz --delete .next/ user@[STAGING_URL]:/path/to/app/
```

### Ambiente de Produção

O deploy para produção é automatizado através do GitHub Actions quando uma alteração é mesclada na branch `main`. Para um deploy manual:

1. Certifique-se de estar com a branch `main` atualizada:
```bash
git checkout main
git pull origin main
```

2. Execute o build seguro:
```bash
npm run build:safe
```

3. Faça o deploy para o ambiente de produção (substitua [PRODUCTION_URL] pela URL do seu ambiente):
```bash
# Exemplo fictício - ajuste conforme sua infraestrutura
rsync -avz --delete .next/ user@[PRODUCTION_URL]:/path/to/app/
```

## Problemas Conhecidos

### Erro "Cannot read properties of null (reading 'useContext')"

Este erro ocorre durante a pré-renderização estática de páginas que usam hooks de contexto React, como `useSession` do NextAuth. As soluções implementadas são:

1. Configuração de `dynamic = 'force-dynamic'` no arquivo `app/layout.tsx`
2. Configuração de `fetchCache = 'force-no-store'` para evitar cache de dados
3. Configuração de `revalidate = 0` para forçar revalidação em cada requisição

### Erros em Rotas de API

Algumas rotas de API podem apresentar erros durante o build devido ao uso de `headers` ou outros recursos dinâmicos. Estes erros são esperados e não afetam o funcionamento da aplicação em tempo de execução.

## Variáveis de Ambiente

Certifique-se de configurar as seguintes variáveis de ambiente:

- `DATABASE_URL`: URL de conexão com o banco de dados PostgreSQL
- `NEXTAUTH_SECRET`: Chave secreta para autenticação
- `NEXTAUTH_URL`: URL base da aplicação
- `STRIPE_SECRET_KEY`: Chave secreta do Stripe (opcional)
- `STRIPE_WEBHOOK_SECRET`: Chave secreta para webhooks do Stripe (opcional)

Para mais informações, consulte o arquivo `.env.example`. 

## Rollback

Em caso de problemas após o deploy, você pode realizar um rollback para a versão anterior:

1. Identifique a tag da versão anterior estável:
```bash
git tag --list
```

2. Faça checkout para essa tag:
```bash
git checkout [TAG_ANTERIOR]
```

3. Execute o build e deploy conforme as instruções acima. 