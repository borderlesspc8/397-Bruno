# Integrações - Gestão Click e KOMMO CRM

## Resumo

A aplicação suporta duas integrações principais:

| Integração | Tipo | Autenticação | Dados |
|-----------|------|--------------|-------|
| **Gestão Click** | Financeira | Access Token + Secret Token | Vendas, Pagamentos, Contabilidade |
| **KOMMO CRM** | CRM | JWT Token (Longa Duração) | Contatos, Negociações, Campos Customizados |

## Gestão Click

### Configuração

```env
GESTAO_CLICK_API_URL=https://api.beteltecnologia.com
GESTAO_CLICK_API_KEY=seu_access_token
GESTAO_CLICK_SECRET_TOKEN=seu_secret_token
```

### Endpoints Principais

- `POST /api/gestao-click/test-connection` - Testar conexão
- `GET /api/gestao-click/sales` - Obter vendas
- `GET /api/gestao-click/clients` - Obter clientes
- `POST /api/gestao-click/auto-import` - Importação automática
- `POST /api/gestao-click/sync-schedule` - Configurar sincronização

### Documentação Completa

Veja [Integração Gestão Click](./gestao-click-integration.md)

## KOMMO CRM

### Configuração

```env
KOMMO_JWT_TOKEN=seu_jwt_token_longa_duracao
KOMMO_API_URL=https://api-c.kommo.com
```

### Endpoints Principais

- `POST /api/kommo/test-connection` - Testar conexão
- `GET /api/kommo/contacts` - Obter contatos
- `GET /api/kommo/deals` - Obter negociações
- `POST /api/kommo/sync` - Sincronizar dados
- `GET /api/kommo/sync` - Status de sincronização

### Documentação Completa

Veja [Integração KOMMO CRM](./kommo-crm-integration.md)

## Fluxo de Integração

```
┌─────────────────────────────────────────────────────────────┐
│                   Dashboard Application                     │
└─────────────────────────────────────────────────────────────┘
           │                              │
           │                              │
     ┌─────▼──────┐              ┌───────▼──────┐
     │ Gestão     │              │   KOMMO      │
     │ Click API  │              │   CRM API    │
     └────────────┘              └──────────────┘
           │                              │
     ┌─────▼──────┐              ┌───────▼──────┐
     │ Financeiro │              │  Contatos &  │
     │ de Vendas  │              │ Negociações  │
     └────────────┘              └──────────────┘
```

## Sincronização de Dados

### Gestão Click

Dados são sincronizados através de:
- Importação automática
- Agendamento configurável
- Campos customizados mapeados

### KOMMO CRM

Dados são sincronizados através de:
- Sincronização manual via API
- Armazenamento em `Wallet` table
- Metadados preservados

## Tratamento de Erros Comum

### Erro 401 - Unauthorized

**Causa:** Credenciais inválidas ou expiradas

**Solução:**
- Gestão Click: Regenerar tokens no painel
- KOMMO: Regenerar JWT Token

### Erro 429 - Too Many Requests

**Causa:** Limite de requisições excedido

**Solução:** Aplicação faz retry automático com backoff exponencial

### Erro de Timeout

**Causa:** Requisição demorou demais

**Solução:** Aumentar `TIMEOUT` nas variáveis de ambiente

## Boas Práticas

### 1. Variáveis de Ambiente

```env
# Nunca fazer commit de tokens
# Use .env.local para desenvolvimento
# Use secrets do seu provedor em produção
```

### 2. Teste de Conexão

Sempre testar a conexão antes de usar:

```bash
# Gestão Click
curl -X POST http://localhost:3000/api/gestao-click/test-connection

# KOMMO
curl -X POST http://localhost:3000/api/kommo/test-connection
```

### 3. Monitoramento

Ativar logs para monitorar:

```env
GESTAO_CLICK_DEBUG=true
KOMMO_DEBUG=true
```

### 4. Sincronização

Não sincronizar em horários de pico:

```bash
# Agendar sincronização off-peak
# Ex: 02:00 da manhã
```

## Segurança

### Tokens

- ✅ Nunca expor em logs (aplicação mascara)
- ✅ Usar HTTPS em produção
- ✅ Regenerar periodicamente
- ✅ Armazenar em variáveis de ambiente seguras

### Rate Limiting

- Gestão Click: Implementado com retry
- KOMMO: Implementado com retry e backoff

### Validação

- JWT Token do KOMMO é automaticamente validado
- Scopes são verificados
- Expiração é monitorada

## Arquitetura

### Estrutura de Serviços

```
app/
├── _config/
│   ├── gestao-click.ts
│   └── kommo.ts
├── _services/
│   ├── gestao-click-base-service.ts
│   ├── gestao-click-service.ts
│   ├── kommo-base-service.ts
│   └── kommo-service.ts
├── _types/
│   ├── gestao-click.ts
│   └── kommo.ts
└── api/
    ├── gestao-click/
    │   ├── test-connection/
    │   ├── contacts/
    │   ├── sales/
    │   └── sync-schedule/
    └── kommo/
        ├── test-connection/
        ├── contacts/
        ├── deals/
        └── sync/
```

### Base Service Pattern

Ambas as integrações seguem um padrão de `BaseService`:

```typescript
class GestaoClickBaseService / KommoBaseService {
  // Configuração
  // Headers de autenticação
  // Requisições com retry
  // Tratamento de erros
}
```

## Próximos Passos

### Gestão Click

- [ ] Webhooks para atualizar dados em tempo real
- [ ] Sincronização bidirecional
- [ ] Relatórios combinados

### KOMMO

- [ ] Webhooks do KOMMO
- [ ] Sincronização bidirecional
- [ ] Campos customizados avançados
- [ ] Integração com Gestão Click (vendedor = contato)

### Combinadas

- [ ] Dashboard unificado
- [ ] Relatórios cruzados
- [ ] Fluxos de automação
- [ ] Pipeline de vendas sincronizado

## Contato e Suporte

Para dúvidas sobre as integrações:

1. Verifique os logs: `GESTAO_CLICK_DEBUG=true` ou `KOMMO_DEBUG=true`
2. Teste a conexão: `POST /api/{provider}/test-connection`
3. Verifique as credenciais
4. Consulte a documentação específica do provider

## Referências

- [Documentação Gestão Click](./gestao-click-integration.md)
- [Documentação KOMMO CRM](./kommo-crm-integration.md)
- [KOMMO API Docs](https://www.kommo.com/developers/)
- [Gestão Click API](https://www.beteltecnologia.com/)
