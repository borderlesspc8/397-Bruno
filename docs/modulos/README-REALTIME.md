# Integração em Tempo Real com o Gestão Click

Este documento descreve o processo de configuração e utilização da integração em tempo real entre o ContaRápida e o Gestão Click.

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Processo de Implementação](#processo-de-implementação)
   - [Passo 1: Limpeza do Banco de Dados](#passo-1-limpeza-do-banco-de-dados)
   - [Passo 2: Configuração do Ambiente](#passo-2-configuração-do-ambiente)
   - [Passo 3: Configuração do Webhook](#passo-3-configuração-do-webhook)
4. [Funcionamento](#funcionamento)
5. [Monitoramento](#monitoramento)
6. [Manutenção](#manutenção)
7. [Solução de Problemas](#solução-de-problemas)

## Visão Geral

A integração em tempo real com o Gestão Click permite que transações, vendas e outras informações financeiras sejam automaticamente sincronizadas com o ContaRápida assim que ocorrem no Gestão Click. Isso elimina a necessidade de importações periódicas e garante que seus dados estejam sempre atualizados.

### Benefícios

- **Dados sempre atualizados**: Visualize suas transações no ContaRápida segundos após serem registradas no Gestão Click
- **Menor consumo de recursos**: Apenas as alterações são processadas, não todo o conjunto de dados
- **Maior confiabilidade**: Elimina falhas comuns em sincronizações agendadas
- **DRE e relatórios atualizados**: Relatórios financeiros sempre refletem a situação mais atual

## Pré-requisitos

Antes de implementar a integração em tempo real, certifique-se de que:

1. Você tem uma conta ativa no Gestão Click com permissões administrativas
2. O Gestão Click permite a configuração de webhooks em sua conta (geralmente disponível em planos Business ou Enterprise)
3. Sua instalação do ContaRápida está na versão 2.5.0 ou superior
4. Seu servidor está acessível publicamente (possui um domínio e certificado SSL)

## Processo de Implementação

A implementação da integração em tempo real envolve três etapas principais:

### Passo 1: Limpeza do Banco de Dados

Para evitar duplicação de dados, é recomendável limpar o banco de dados antes de iniciar a integração em tempo real.

```bash
# Execute o script de limpeza do banco de dados
npx ts-node scripts/clean-database.ts
```

Este script irá:
- Remover todas as transações existentes
- Limpar o histórico de importações
- Resetar os saldos das carteiras
- Remover mapeamentos de categorias anteriores

É importante fazer um backup antes de executar este script!

### Passo 2: Configuração do Ambiente

Execute o script de configuração para preparar o ambiente:

```bash
# Configure a integração em tempo real
node scripts/setup-realtime-integration.js
```

O script irá:
- Atualizar o arquivo `.env` com as variáveis necessárias
- Gerar uma chave secreta para autenticação do webhook
- Configurar parâmetros de sincronização

### Passo 3: Configuração do Webhook

Configure o webhook no Gestão Click seguindo estes passos:

1. Acesse o painel administrativo do Gestão Click
2. Navegue até "Configurações > Integrações > Webhooks"
3. Adicione um novo webhook com:
   - **URL**: `https://seu-dominio.com/api/webhooks/gestao-click`
   - **Método**: POST
   - **Cabeçalho**: `Authorization: Bearer CHAVE_SECRETA` (use a chave gerada pelo script)
4. Configure os eventos a serem notificados:
   - `transaction.created`
   - `transaction.updated`
   - `sale.created`
   - `sale.updated`
   - `cost_center.created`
   - `cost_center.updated`
5. Ative o webhook

## Funcionamento

O processo de integração em tempo real funciona da seguinte forma:

1. Quando uma ação ocorre no Gestão Click (ex: nova transação), um evento é gerado
2. O Gestão Click envia uma notificação para o webhook configurado no ContaRápida
3. O ContaRápida recebe e autentica a notificação
4. Os dados são processados e armazenados no banco de dados
5. Os usuários são notificados sobre as atualizações
6. As visualizações de UI são revalidadas para mostrar os novos dados

Cada evento contém informações como:
- Tipo de evento (criação, atualização)
- Identificador do usuário associado
- Dados específicos do evento (detalhes da transação, venda, etc.)
- Timestamp da ocorrência

## Monitoramento

Para monitorar o funcionamento da integração em tempo real:

1. **Logs do Sistema**:
   ```bash
   # Visualizar logs em tempo real
   tail -f logs/server.log | grep "WEBHOOK"
   ```

2. **Painel de Notificações**:
   - Acesse o painel de notificações no ContaRápida para ver atualizações sobre eventos processados

3. **Página de Status da Integração**:
   - Acesse "Configurações > Integrações > Gestão Click > Status" para visualizar estatísticas de eventos recebidos

## Manutenção

Para manter a integração em tempo real funcionando corretamente:

1. **Verificações Periódicas**:
   - Execute `node scripts/verify-webhook.js` mensalmente para verificar se o webhook está ativo
   - Verifique os logs regularmente para identificar erros recorrentes

2. **Rotação de Chaves**:
   - A cada 6 meses, considere atualizar a chave secreta do webhook:
   ```bash
   node scripts/rotate-webhook-key.js
   ```

3. **Backups**:
   - Mantenha backups regulares do banco de dados, especialmente antes de grandes mudanças

## Solução de Problemas

### Problema: Eventos não estão sendo recebidos

**Possíveis causas**:
- Webhook não configurado corretamente no Gestão Click
- Problema de conectividade entre o Gestão Click e seu servidor
- Firewall bloqueando as requisições

**Soluções**:
1. Verifique se a URL do webhook está correta
2. Confirme se seu servidor está acessível externamente
3. Verifique logs de firewall para bloqueios

### Problema: Eventos são recebidos mas não processados

**Possíveis causas**:
- Erro de autenticação do webhook
- Formato de dados inesperado
- Erro no processamento

**Soluções**:
1. Verifique se a chave secreta está configurada corretamente
2. Consulte os logs do servidor para mensagens de erro específicas
3. Teste manualmente enviando eventos de teste:
   ```bash
   node scripts/test-webhook.js
   ```

### Problema: Duplicação de dados

**Possíveis causas**:
- Eventos processados múltiplas vezes
- Conflito com importação manual ou automática

**Soluções**:
1. Verifique se há múltiplos webhooks configurados
2. Desative importações automáticas enquanto usa a integração em tempo real
3. Execute o diagnóstico:
   ```bash
   node scripts/check-duplicates.js
   ```

---

Para mais informações ou suporte, entre em contato com nossa equipe técnica. 