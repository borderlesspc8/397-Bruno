# Integração KOMMO CRM

## Visão Geral

A aplicação suporta integração completa com o KOMMO CRM através de JWT Token de longa duração. Este documento descreve como configurar e utilizar a integração.

## Configuração

### Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias:

```env
# Token JWT de longa duração (obrigatório)
KOMMO_JWT_TOKEN=seu_jwt_token_aqui

# Alternativa (compatibilidade)
KOMMO_LONG_LIVED_TOKEN=seu_token_alternativo_aqui

# URL da API (padrão: https://api-c.kommo.com)
KOMMO_API_URL=https://api-c.kommo.com

# Configurações opcionais
KOMMO_TIMEOUT=30000                 # Timeout em ms
KOMMO_RETRY_ATTEMPTS=3              # Tentativas de retry
KOMMO_RETRY_DELAY=1000              # Delay entre retries em ms
KOMMO_DEBUG=true                    # Debug mode
KOMMO_BASE_DOMAIN=kommo.com         # Domínio base do KOMMO
```

### Decodificação do JWT

O JWT Token fornecido pelo KOMMO é um token Bearer no formato:

```
eyJhbGciOiJSUzI1NiIsImp0aSI6IjM3MWM4YmExZTgyNjhiYTY0NzQ3ZTYyMDFlOWIzNGMyMzJhMjlmOTU1ZGE4Y2E1YmI3ZWRmMTNlZTM5ZmNiOTliMGYxMTNkNzM5YWYwOWQ0In0...
```

O token contém informações decodificadas como:
- `account_id`: ID da conta
- `base_domain`: Domínio base (kommo.com)
- `api_domain`: Domínio da API
- `scopes`: Permissões concedidas
- `exp`: Data de expiração
- `iat`: Data de emissão

## Endpoints da API

### 1. Testar Conexão

**POST** `/api/kommo/test-connection`

Testa a conexão com o KOMMO CRM e valida o JWT.

**Corpo da Requisição:**
```json
{
  "jwtToken": "seu_jwt_token_aqui",
  "userId": "user_id_opcional"
}
```

**Resposta Sucesso:**
```json
{
  "success": true,
  "message": "Conexão com KOMMO CRM estabelecida com sucesso",
  "connection": {
    "status": "connected",
    "apiUrl": "https://api-c.kommo.com"
  },
  "account": {
    "accountId": 2974588,
    "baseDomain": "kommo.com",
    "apiDomain": "api-c.kommo.com",
    "scopes": ["crm", "files", "files_delete", "notifications", "push_notifications"],
    "expiresAt": "2025-02-20T23:20:00.000Z"
  },
  "diagnostics": {
    "contacts": {
      "count": 3,
      "items": [
        {"id": 123, "name": "Contato 1"},
        {"id": 124, "name": "Contato 2"},
        {"id": 125, "name": "Contato 3"}
      ]
    }
  }
}
```

### 2. Obter Contatos

**GET** `/api/kommo/contacts`

Obtém lista de contatos do KOMMO CRM.

**Parâmetros Query:**
- `jwtToken` (opcional): Token JWT
- `userId` (opcional): ID do usuário (padrão: 1)
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 50)
- `query` (opcional): Termo de busca

**Exemplo:**
```
GET /api/kommo/contacts?page=1&limit=50&query=João
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "João Silva",
      "first_name": "João",
      "last_name": "Silva",
      "responsible_user_id": 456,
      "group_id": 1,
      "created_at": 1700000000,
      "updated_at": 1700100000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "pageCount": 1
  },
  "message": "50 contatos obtidos"
}
```

### 3. Obter Contato Específico

**POST** `/api/kommo/contacts`

Obtém um contato específico.

**Corpo da Requisição:**
```json
{
  "jwtToken": "seu_jwt_token_aqui",
  "userId": "user_id_opcional",
  "contactId": 123
}
```

### 4. Obter Negociações

**GET** `/api/kommo/deals`

Obtém lista de negociações (leads) do KOMMO CRM.

**Parâmetros Query:**
- `jwtToken` (opcional): Token JWT
- `userId` (opcional): ID do usuário
- `page` (opcional): Página
- `limit` (opcional): Itens por página
- `query` (opcional): Termo de busca

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "name": "Negócio em andamento",
      "price": 5000.00,
      "responsible_user_id": 789,
      "pipeline_id": 1,
      "status_id": 1,
      "created_at": 1700000000,
      "updated_at": 1700100000
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "pageCount": 1
  },
  "message": "50 negociações obtidas"
}
```

### 5. Obter Negociação Específica

**POST** `/api/kommo/deals`

Obtém uma negociação específica.

**Corpo da Requisição:**
```json
{
  "jwtToken": "seu_jwt_token_aqui",
  "userId": "user_id_opcional",
  "dealId": 456
}
```

### 6. Sincronizar Dados

**POST** `/api/kommo/sync`

Sincroniza contatos e negociações do KOMMO para o banco de dados.

**Corpo da Requisição:**
```json
{
  "jwtToken": "seu_jwt_token_aqui",
  "userId": "user_id_opcional"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Sincronização concluída: 150 contatos, 75 negociações",
  "data": {
    "contactsCount": 150,
    "dealsCount": 75,
    "lastSync": "2025-01-19T10:30:00.000Z",
    "errors": []
  }
}
```

### 7. Obter Status de Sincronização

**GET** `/api/kommo/sync`

Obtém informações da última sincronização realizada.

**Parâmetros Query:**
- `userId` (opcional): ID do usuário

**Resposta:**
```json
{
  "success": true,
  "message": "Status de sincronização obtido",
  "data": {
    "lastSync": "2025-01-19T10:30:00.000Z",
    "contactsCount": 150,
    "dealsCount": 75,
    "syncSuccess": true,
    "errors": []
  }
}
```

## Estrutura de Dados

### Contato

```typescript
interface KommoContact {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  responsible_user_id?: number;
  group_id?: number;
  created_at: number;
  updated_at: number;
  custom_fields?: Array<{
    id: number;
    values: Array<{
      value: string | number | boolean;
      enum?: number;
    }>;
  }>;
}
```

### Negociação (Deal)

```typescript
interface KommoDeal {
  id: number;
  name: string;
  price: number;
  responsible_user_id?: number;
  group_id?: number;
  status_id?: number;
  pipeline_id?: number;
  created_at: number;
  updated_at: number;
  custom_fields?: Array<{
    id: number;
    values: Array<{
      value: string | number | boolean;
      enum?: number;
    }>;
  }>;
}
```

## Tratamento de Erros

### Erro de Autenticação

```json
{
  "success": false,
  "message": "JWT token não foi fornecido",
  "error": "JWT token ausente"
}
```

### Erro de Conexão

```json
{
  "success": false,
  "message": "Erro ao testar conexão com KOMMO CRM",
  "error": "Descrição do erro"
}
```

### Token Expirado

O JWT Token possui data de expiração. Se expirado:

```json
{
  "success": false,
  "message": "Erro ao validar conexão",
  "error": "Autenticação falhou: 401 Unauthorized"
}
```

## Scopes Necessários

O JWT Token deve possuir os seguintes scopes:

- `crm`: Acesso ao CRM (obrigatório)
- `files`: Gerenciamento de arquivos
- `files_delete`: Exclusão de arquivos
- `notifications`: Notificações
- `push_notifications`: Notificações push

## Limite de Taxa (Rate Limiting)

A API do KOMMO possui limite de requisições. A aplicação implementa retry automático com backoff exponencial:

- Tentativas de retry: 3 (configurável via `KOMMO_RETRY_ATTEMPTS`)
- Delay entre retries: 1000ms (configurável via `KOMMO_RETRY_DELAY`)
- Timeout por requisição: 30000ms (configurável via `KOMMO_TIMEOUT`)

## Sincronização de Dados

A sincronização pode ser configurada de forma automática:

```bash
# Sincronizar dados
POST /api/kommo/sync
```

Os dados sincronizados são armazenados na tabela `Wallet` do banco de dados:

- Contatos: `name: "KOMMO_CONTACT_*"`
- Negociações: `name: "KOMMO_DEAL_*"`

## Resolução de Problemas

### Token Inválido

- Verifique se o JWT Token foi copiado corretamente
- Verifique se o token não expirou
- Regenere o token no painel do KOMMO

### Erro 401 - Unauthorized

- Token inválido ou expirado
- Verificar se o domínio está correto
- Regenerar o token

### Erro 429 - Too Many Requests

- Limite de requisições excedido
- Aguarde um tempo antes de fazer novas requisições
- A aplicação faz retry automático

### Conexão Recusada

- Verificar se a URL da API está correta
- Verificar se há acesso à internet
- Verificar firewall/proxy

## Exemplos de Uso

### JavaScript/TypeScript

```typescript
// Testar conexão
const response = await fetch('/api/kommo/test-connection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jwtToken: 'seu_jwt_token',
    userId: '123'
  })
});

const result = await response.json();
console.log(result);

// Obter contatos
const contactsResponse = await fetch('/api/kommo/contacts?page=1&limit=50');
const contacts = await contactsResponse.json();

// Sincronizar dados
const syncResponse = await fetch('/api/kommo/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jwtToken: 'seu_jwt_token',
    userId: '123'
  })
});

const syncResult = await syncResponse.json();
```

### cURL

```bash
# Testar conexão
curl -X POST http://localhost:3000/api/kommo/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "jwtToken": "seu_jwt_token",
    "userId": "123"
  }'

# Obter contatos
curl http://localhost:3000/api/kommo/contacts?page=1

# Sincronizar dados
curl -X POST http://localhost:3000/api/kommo/sync \
  -H "Content-Type: application/json" \
  -d '{
    "jwtToken": "seu_jwt_token",
    "userId": "123"
  }'
```

## Segurança

- Nunca exponha o JWT Token em URLs (apenas no corpo da requisição)
- O token é mascarado nos logs por segurança
- Use HTTPS em produção
- Regenere o token periodicamente
- Não commit o token no git (use .env.local)

## Atualizações Recentes

- ✅ Suporte a JWT Token de longa duração
- ✅ Sincronização de contatos e negociações
- ✅ Decodificação automática de JWT
- ✅ Tratamento de erros e retry automático
- ✅ Armazenamento em banco de dados

## Próximos Passos

- [ ] Implementar webhooks do KOMMO
- [ ] Suporte a campos customizados avançados
- [ ] Sincronização bidirecional
- [ ] Agendamento de sincronizações periódicas
- [ ] Relatórios integrados KOMMO + Gestão Click
