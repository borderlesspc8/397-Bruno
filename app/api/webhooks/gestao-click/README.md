# Webhook do Gestão Click

Este webhook recebe e processa eventos do sistema Gestão Click, integrando os dados em tempo real com a aplicação.

## Estrutura de Arquivos

```
app/api/webhooks/gestao-click/
├── README.md                # Esta documentação
├── route.ts                 # Endpoint principal do webhook
├── route.ts.bak             # Backup do arquivo original
├── types/                   # Definição de tipos e interfaces
│   └── index.ts
├── utils/                   # Funções utilitárias
│   ├── index.ts
│   ├── development.ts       # Funções específicas para ambiente de desenvolvimento
│   └── fix-webhook.ts       # Utilitários para correção de problemas
├── fix/                     # Endpoint para correção de problemas
│   └── route.ts
└── handlers/                # Handlers para processar diferentes tipos de eventos
    ├── index.ts
    ├── installment-handler.ts
    ├── misc-handlers.ts
    ├── sale-handler.ts
    └── transaction-handler.ts
```

## Tipos de Eventos Suportados

- `transaction.created` / `transaction.updated`: Eventos de criação/atualização de transações financeiras
- `sale.created` / `sale.updated`: Eventos de criação/atualização de vendas
- `installment.created` / `installment.updated`: Eventos de criação/atualização de parcelas
- `cost_center.created` / `cost_center.updated`: Eventos de criação/atualização de centros de custo (não implementado)
- `inventory.updated`: Eventos de atualização de inventário (não implementado)

## Como Funciona

1. O webhook recebe uma requisição POST com os dados do evento
2. Autentica a requisição usando o cabeçalho de autorização
3. Identifica o tipo de evento e o usuário alvo
4. Direciona o evento para o handler apropriado
5. Notifica o usuário sobre a atualização dos dados
6. Revalida as páginas relevantes para exibir os dados atualizados

## Ambiente de Desenvolvimento

Em ambiente de desenvolvimento, o sistema permite processar eventos de teste:

- Usuários com IDs que começam com "test-" ou "test123" são tratados como de teste
- Eventos podem ser processados com dados reais quando o campo `_realProcessing` é definido como `true`
- Tratamento específico para testes evita a necessidade de configuração completa

## Segurança

Em ambiente de produção, a autenticação é obrigatória através da chave secreta `GESTAO_CLICK_WEBHOOK_SECRET`.

## Solução de Problemas

### Correções para Erros 404 na API

A API do Gestão Click pode retornar erros 404 em algumas situações, especialmente ao buscar parcelas de vendas. O webhook implementa múltiplas estratégias para contornar esse problema:

1. **Abordagem em cascata** - Tenta buscar parcelas por diferentes endpoints, seguindo para o próximo método caso o anterior falhe:
   - Primeiro tenta o endpoint específico de parcelas (`/vendas/{id}/parcelas`)
   - Se falhar, tenta buscar a venda completa (`/vendas/{id}`) e extrair as parcelas
   - Se ainda falhar, busca na listagem completa de vendas e localiza a venda desejada

2. **Sistema de fallback de emergência** - Quando todas as abordagens falham, o sistema pode criar uma "parcela de emergência" com dados mínimos para permitir que o sistema continue funcionando. Este mecanismo:
   - É ativado automaticamente quando há um ID específico de parcela
   - Pode ser habilitado globalmente através da variável de ambiente `ENABLE_FALLBACK_PARCELAS=true`
   - Gera parcelas com valores estimados com base em qualquer informação disponível
   - Marca claramente as parcelas geradas com a flag `_gerada_emergencia: true`

3. **Registro detalhado** - Cada falha é registrada detalhadamente nos logs com:
   - Contagem de tentativas falhas
   - Detalhes específicos de cada erro
   - Informações de debugging que facilitam identificar a causa raiz

### Tratamento Avançado de Erros PostgreSQL

O sistema também foi aprimorado para lidar corretamente com consultas SQL complexas, evitando erros comuns:

1. **Validação de tipos em arrays** - Correção para o erro `operator does not exist: text = text[]` que ocorria durante a verificação de vendas existentes
2. **Placeholder seguro com `$queryRawUnsafe`** - Uso de placeholders numéricos em vez de interpolação direta, evitando SQL injection
3. **Validação rigorosa de resultados** - Verificação robusta de resultados nulos ou indefinidos em cada etapa do processo

### Carteira de Integração Ausente

O webhook necessita de uma carteira específica do tipo "CHECKING" chamada "GESTAO_CLICK_GLOBAL" para funcionar corretamente. Se esta carteira não existir, o webhook tentará criá-la automaticamente.

Para criar ou corrigir manualmente:

1. Use o endpoint de correção: `POST /api/webhooks/gestao-click/fix` com o corpo `{"userId": "ID_DO_USUARIO"}`
2. Execute o script de correção: `node scripts/fix-webhook.js [ID_DO_USUARIO]` (opcional)

### Problemas com Parcelas de Vendas

Se houver problemas para recuperar ou processar parcelas de vendas, utilize o endpoint de correção específico:

```
POST /api/webhooks/gestao-click/fix
Content-Type: application/json

{
  "userId": "ID_DO_USUARIO",
  "action": "fix_installments",
  "saleId": "ID_DA_VENDA"
}
```

Este endpoint irá:

1. Verificar se a venda existe e criar um registro mínimo se não existir
2. Verificar se a venda possui parcelas e marcar para sincronização se necessário
3. Retornar o status da correção

Se o problema persistir, você pode forçar um reprocessamento de um evento de parcela:

```
POST /api/webhooks/gestao-click
Content-Type: application/json

{
  "event": "installment.updated",
  "userId": "ID_DO_USUARIO",
  "data": {
    "saleId": "ID_DA_VENDA",
    "id": "ID_DA_PARCELA",
    "_force_refresh": true
  }
}
```

### Melhorias no Processamento de Parcelas

A versão atual implementa várias estratégias para lidar com diferentes formatos de resposta da API:

1. **Múltiplas tentativas de busca**: Tenta buscar parcelas através de diferentes endpoints
2. **Tratamento de formato de resposta**: Reconhece diferentes estruturas de dados retornadas pela API
3. **Validação robusta de dados**: Filtra parcelas inválidas ou malformadas
4. **Timeout e tratamento de erros**: Evita bloqueios em requisições lentas
5. **Recuperação de falhas**: Cria dados mínimos quando a API não retorna informações suficientes

### Erros Comuns

- **Carteira de integração não encontrada**: O webhook agora detecta e corrige automaticamente este erro.
- **Configurações do Gestão Click não encontradas**: Verifique se existe uma carteira do tipo "SETTINGS" chamada "GESTAO_CLICK_GLOBAL".
- **Falha na conexão com a API**: Verifique se as credenciais (apiKey, secretToken) estão configuradas corretamente.
- **Formato de parcelas inválido**: O sistema agora trata vários formatos e fornece logs detalhados sobre o problema.

### Registro de Logs

Os logs do webhook são identificados pelo prefixo `[WEBHOOK]` para facilitar a identificação.

```
[WEBHOOK] Recebido evento do Gestão Click
[WEBHOOK] Processando evento 'sale.created' para usuário abc123
```

Em caso de erro, mensagens detalhadas são registradas no console:

```
[WEBHOOK] Erro ao processar evento sale.created: Carteira de integração não encontrada
```

Logs específicos de parcelas:

```
[WEBHOOK] Buscando parcelas da venda 12345
[WEBHOOK] 3 parcelas encontradas no campo data
[WEBHOOK] 3 parcelas válidas encontradas
```

### Auto-correção

O webhook implementa um mecanismo de auto-correção para problemas comuns:

1. Detecção automática de problemas de configuração 
2. Criação automática da carteira de integração quando ausente
3. Reprocessamento automático do evento após a correção
4. Tratamento inteligente de diferentes formatos de API
5. Resiliência a falhas temporárias de conexão 