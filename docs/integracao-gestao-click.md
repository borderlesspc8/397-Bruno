# Integração com Gestão Click

## Visão Geral

A integração com o Gestão Click permite importar transações financeiras automaticamente para o ContaRápida. Esta documentação descreve como configurar e utilizar esta integração.

## Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Importação Manual](#importação-manual)
   - [Importação de Grandes Volumes de Dados](#importação-de-grandes-volumes-de-dados)
3. [Importação Automática](#importação-automática)
4. [Integração em Tempo Real](#integração-em-tempo-real)
5. [Resolução de Problemas](#resolução-de-problemas)
   - [Transações Incompletas](#problema-nem-todas-as-transações-estão-sendo-importadas)
   - [Erros de Conexão](#problema-erro-de-conexão-com-o-gestão-click)
   - [Categorias Incorretas](#problema-categorias-incorretas-após-importação)
   - [Importação Lenta](#problema-importação-muito-lenta)
6. [Estrutura Técnica](#estrutura-técnica)

## Configuração Inicial

Para configurar a integração com o Gestão Click, você precisará:

1. **Configurar variáveis de ambiente**:
   - Configure as seguintes variáveis no arquivo `.env` do sistema:
     ```
     GESTAO_CLICK_ACCESS_TOKEN=seu_token_de_acesso
     GESTAO_CLICK_SECRET_ACCESS_TOKEN=seu_token_secreto
     GESTAO_CLICK_API_URL=https://api.beteltecnologia.com
     ```
   - Estas credenciais serão usadas automaticamente durante a importação

2. **Testar a conexão** (opcional):
   - Acesse a área de "Configurações > Integrações" no ContaRápida
   - Selecione "Gestão Click" e clique em "Testar Conexão"
   - Verifique se a conexão é estabelecida com sucesso

3. **Mapeamento de Categorias** (opcional):
   - Configure como as categorias do Gestão Click serão mapeadas para as categorias do ContaRápida
   - Isso garante que suas transações sejam categorizadas corretamente após a importação

> **Nota**: Não é mais necessário inserir manualmente as credenciais de API na interface. As credenciais são obtidas automaticamente do arquivo `.env` do sistema.

## Importação Manual

Para importar transações manualmente:

1. Acesse "Transações > Importar" no menu principal
2. Selecione "Gestão Click" como fonte de dados
3. Escolha o período desejado para importação
4. Clique em "Iniciar Importação"
5. Revise as transações encontradas
6. Confirme a importação

A importação manual é ideal para sincronização ocasional ou para períodos específicos.

### Importação de Grandes Volumes de Dados

Se sua empresa possui um grande volume de transações, siga estas orientações para garantir uma importação completa:

1. **Ajuste os Filtros Avançados**:
   - Expanda a seção "Filtros Avançados" na tela de importação
   - Aumente o "Limite por Página" para 500 transações
   - Configure o "Máximo Total" para 20000 transações ou mais
   - O sistema agora está otimizado para buscar até 100 páginas de cada tipo de transação

2. **Divida em Períodos Menores**:
   - Em vez de importar um ano inteiro de uma vez, divida em períodos menores
   - Recomendamos importar no máximo 3 meses por operação
   - Por exemplo, divida o ano em 4 importações trimestrais

3. **Verifique Resultados**:
   - Após a importação, verifique a mensagem de resultado
   - Se mencionar que o "limite máximo de transações foi atingido", considere:
     - Reduzir o período de importação
     - Aplicar filtros adicionais (por loja, conta bancária, etc.)
     - Aumentar ainda mais o limite máximo

4. **Casos de Uso Típicos**:
   
   | Volume de Negócio | Configuração Recomendada |
   | ----------------- | ------------------------ |
   | Pequeno (< 1000 transações/mês) | Período: até 6 meses, Limite por página: 100, Máximo: 10000 |
   | Médio (1000-5000 transações/mês) | Período: até 3 meses, Limite por página: 500, Máximo: 20000 |
   | Grande (> 5000 transações/mês) | Período: 1 mês, Limite por página: 500, Máximo: 50000 |

## Importação Automática

A funcionalidade de importação automática permite sincronizar novas transações do Gestão Click periodicamente, sem intervenção manual.

### Configuração da Sincronização Automática

1. Acesse "Configurações > Integrações > Gestão Click"
2. Na seção "Sincronização Automática", ative a opção "Habilitar sincronização automática"
3. Selecione a frequência desejada:
   - **Horária**: Sincroniza a cada hora
   - **Diária**: Sincroniza uma vez por dia (recomendado)
   - **Semanal**: Sincroniza uma vez por semana
4. Salve as configurações

### Como Funciona

- O sistema verifica automaticamente novas transações no Gestão Click na frequência configurada
- Apenas transações novas (que ainda não existem no ContaRápida) são importadas
- O sistema usa a data da última sincronização como referência
- Você receberá notificações sobre novas transações importadas ou erros durante o processo

### Execução Manual da Sincronização Automática

Para forçar uma sincronização imediata:

1. Acesse "Configurações > Integrações > Gestão Click"
2. Clique no botão "Sincronizar Agora"

## Integração em Tempo Real

A integração em tempo real permite receber atualizações do Gestão Click imediatamente após ocorrerem, sem a necessidade de aguardar pela sincronização automática. Esta funcionalidade utiliza webhooks para atualizar os dados automaticamente.

### Vantagens da Integração em Tempo Real

- **Dados Sempre Atualizados**: Suas transações aparecerão no ContaRápida segundos após serem criadas ou modificadas no Gestão Click
- **Maior Precisão**: Elimina a chance de perder transações devido a falhas durante importações agendadas
- **Menor Consumo de Recursos**: Apenas as transações alteradas são processadas, reduzindo o consumo de recursos
- **DRE e Relatórios Atualizados**: Todos os relatórios e dashboards refletem as mudanças imediatamente

### Configuração da Integração em Tempo Real

#### 1. Configuração no ContaRápida

1. Execute o script de configuração de integração em tempo real:
   ```bash
   node scripts/setup-realtime-integration.js
   ```
2. Siga as instruções na tela para inserir as credenciais necessárias
3. O script irá gerar uma chave secreta para autenticação do webhook e atualizar o arquivo `.env`

#### 2. Configuração no Gestão Click

1. Acesse o painel administrativo do Gestão Click
2. Navegue até "Configurações > Integrações > Webhooks"
3. Adicione um novo webhook com a URL do seu ContaRápida:
   ```
   https://seu-dominio.com/api/webhooks/gestao-click
   ```
4. Configure o cabeçalho de autenticação:
   ```
   Authorization: Bearer CHAVE_SECRETA_GERADA
   ```
5. Selecione os seguintes eventos para serem enviados:
   - `transaction.created` (Quando uma transação é criada)
   - `transaction.updated` (Quando uma transação é modificada)
   - `sale.created` (Quando uma venda é registrada)
   - `sale.updated` (Quando uma venda é modificada)
   - `cost_center.created` (Quando um centro de custo é criado)
   - `cost_center.updated` (Quando um centro de custo é atualizado)

### Limpando o Banco de Dados

Antes de iniciar a integração em tempo real, recomendamos limpar o banco de dados para evitar duplicações:

1. Execute o script de limpeza do banco de dados:
   ```bash
   npx ts-node scripts/clean-database.ts
   ```
2. Confirme a operação quando solicitado
3. O script removerá transações existentes e configurará o sistema para o modo de tempo real

### Monitoramento da Integração em Tempo Real

Você pode monitorar o funcionamento da integração em tempo real:

1. Acesse "Configurações > Integrações > Gestão Click > Logs de Integração"
2. Verifique as notificações no painel de notificações do sistema
3. Consulte os logs de servidor para informações detalhadas sobre cada evento recebido

### Solução de Problemas

Se você encontrar dificuldades com a integração em tempo real:

1. **Evento não recebido**: Verifique se o webhook está configurado corretamente no Gestão Click e se a URL está acessível
2. **Erro de autenticação**: Confirme se o cabeçalho de autorização está configurado com a chave secreta correta
3. **Transações não aparecem**: Verifique os logs do servidor para mensagens de erro específicas

Em caso de problemas persistentes, você pode desativar temporariamente a integração em tempo real e voltar ao modo de sincronização automática até que o problema seja resolvido.

## Resolução de Problemas

Se você encontrar dificuldades durante a integração com o Gestão Click, verifique as seguintes soluções:

### Problema: Nem todas as transações estão sendo importadas

**Sintomas:**
- Algumas transações visíveis no Gestão Click não aparecem no ContaRápida
- O total de transações importadas é menor que o esperado

**Possíveis Causas e Soluções:**

1. **Limite de paginação ou transações atingido:**
   - Aumentar o "Limite por Página" nas configurações avançadas (recomendado: 500)
   - Aumentar o "Máximo Total" de transações (recomendado: 20000 ou mais)
   - Dividir a importação em períodos menores (máximo 3 meses por vez)

2. **Filtros restritivos:**
   - Verificar se há filtros ativos na tela de importação
   - Expandir os Filtros Avançados e garantir que nenhum filtro esteja limitando desnecessariamente
   - Tente remover filtros de "Liquidado" se estiver procurando por todas as transações

3. **Transações muito antigas:**
   - A API do Gestão Click pode ter limitações para dados muito antigos
   - Tente importar os dados mais recentes primeiro e depois os mais antigos

### Problema: Erro de conexão com o Gestão Click

**Sintomas:**
- Mensagem "Falha na conexão com Gestão Click" 
- Importação não inicia

**Possíveis Soluções:**

1. **Verificar credenciais:**
   - Confirmar que o Access Token está correto
   - Verificar se o Secret Token (quando usado) está correto
   - Validar o URL da API se estiver usando uma instância personalizada

2. **Problemas de rede:**
   - Verificar sua conexão com a internet
   - A API do Gestão Click pode estar temporariamente indisponível
   - Aguardar alguns minutos e tentar novamente

### Problema: Categorias incorretas após importação

**Sintomas:**
- Transações são importadas, mas com categorias diferentes das esperadas

**Possíveis Soluções:**

1. **Revisar mapeamento de categorias:**
   - O sistema faz um mapeamento automático entre as categorias do Gestão Click e as categorias internas
   - Entre em contato com o suporte para ajustar mapeamentos específicos
   - Considere editar as transações após a importação para corrigir categorias específicas

### Problema: Importação muito lenta

**Sintomas:**
- O processo de importação demora muito mais que o esperado

**Possíveis Soluções:**

1. **Reduzir volume de dados:**
   - Diminuir o período de importação
   - Aplicar filtros mais específicos
   - Importar em lotes menores

2. **Otimização de recursos:**
   - Não executar outros processos pesados durante a importação
   - Verificar a conexão de internet

## Estrutura Técnica

A integração com o Gestão Click é composta pelos seguintes componentes:

### API e Serviços

- **GestaoClickService**: Serviço principal que gerencia a comunicação com a API do Gestão Click
- **Endpoints de API**:
  - `/api/gestao-click/auto-import`: Endpoint para iniciar importação automática
  - `/api/gestao-click/sync-schedule`: Endpoint para gerenciar configurações de sincronização
  - `/api/cron/gestao-click-sync`: Endpoint para execução programada via CRON

### Modelos de Dados

- **IntegrationSettings**: Armazena configurações de integração por usuário
- **ImportSchedule**: Controla agendamentos de importação
- **CategoryMapping**: Define mapeamentos entre categorias externas e internas

### Jobs Automáticos

- **CRON Jobs**: Executa a sincronização automática na frequência configurada
- **Notificações**: Envia notificações sobre o resultado das sincronizações

### Considerações de Segurança

- As credenciais de API são armazenadas de forma segura e criptografada
- Todas as operações de sincronização são registradas para auditoria
- O acesso às APIs é protegido por autenticação

---

**Última atualização**: [Data Atual]

Para mais informações, entre em contato com nossa equipe de suporte. 