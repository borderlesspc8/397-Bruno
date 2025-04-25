# Scripts de Utilidades

Este diretório contém scripts para auxiliar no desenvolvimento, manutenção e administração da aplicação Conta Rápida.

## Scripts Disponíveis

### Sanitização do Banco de Dados

Existem duas versões do script de sanitização para remover registros duplicados nas tabelas de carteiras e transações:

#### Versão TypeScript (`cleanup-duplicates.ts`)

```bash
# Executar o script (isso fará alterações permanentes no banco de dados)
npm run cleanup-duplicates -- userId=USER_ID

# Executar o script em modo de simulação (não altera o banco de dados)
npm run cleanup-duplicates -- userId=USER_ID dryRun=true
```

#### Versão JavaScript (`cleanup-duplicates.js`)

Esta versão é uma alternativa caso a versão TypeScript apresente problemas de compatibilidade com o ambiente ESM:

```bash
# Executar o script (isso fará alterações permanentes no banco de dados)
npm run cleanup-js -- userId=USER_ID

# Executar o script em modo de simulação (não altera o banco de dados)
npm run cleanup-js -- userId=USER_ID dryRun=true
```

#### Parâmetros

- `userId`: (OBRIGATÓRIO) ID do usuário cujos dados serão sanitizados
- `dryRun`: (OPCIONAL) Se definido como `true`, o script apenas simula as operações sem realizar alterações

#### O que o script faz

O script realiza as seguintes operações:

1. **Sanitização de Carteiras**:
   - Identifica carteiras do tipo GESTAO_CLICK com o mesmo nome
   - Preserva a carteira mais recente ou com mais transações
   - Move todas as transações das carteiras duplicadas para a carteira preservada
   - Remove as carteiras duplicadas

2. **Sanitização de Transações**:
   - Identifica transações com o mesmo ID externo (externalId)
   - Preserva a transação mais recente
   - Remove as transações duplicadas
   - Para transações sem ID externo, identifica duplicatas com base em uma "impressão digital" (mesma carteira, data, valor e descrição)

#### Segurança

O script inclui várias medidas de segurança:

- Verificação do ID do usuário
- Tempo de espera de 5 segundos antes de iniciar alterações permanentes
- Modo de simulação para verificar o que será alterado antes de aplicar as mudanças
- Log detalhado de todas as operações realizadas

### Outros Scripts

- `dev-with-logs.js`: Inicia o servidor de desenvolvimento com logs melhorados
- `check-certs.js`: Verifica certificados SSL
- `test-storage.ts`: Testa a configuração de armazenamento
- `build-skip-errors.js`: Builds the app skipping errors

## Contribuição

Ao adicionar novos scripts, por favor documente-os adequadamente neste README. 