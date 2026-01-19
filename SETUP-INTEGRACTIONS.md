# Setup de Integrações - KOMMO CRM + Gestão Click

Este documento descreve como configurar as integrações com KOMMO CRM e Gestão Click na aplicação.

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Credenciais do Gestão Click (Access Token + Secret Token)
- JWT Token de longa duração do KOMMO CRM

## 🚀 Configuração Rápida

### 1. Clone o Repositório

```bash
git clone <seu-repo>
cd dashboard-personal
```

### 2. Instale Dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# ===== BANCO DE DADOS =====
DATABASE_URL="postgresql://postgres:password@localhost:5432/dashboard_personal"

# ===== AUTENTICAÇÃO =====
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="gere_uma_chave_secreta_forte"

# ===== GESTÃO CLICK =====
GESTAO_CLICK_API_URL="https://api.beteltecnologia.com"
GESTAO_CLICK_API_KEY="seu_access_token_aqui"
GESTAO_CLICK_SECRET_TOKEN="seu_secret_token_aqui"

# ===== KOMMO CRM =====
KOMMO_JWT_TOKEN="seu_jwt_token_longa_duracao_aqui"
KOMMO_API_URL="https://api-c.kommo.com"
KOMMO_TIMEOUT="30000"
KOMMO_RETRY_ATTEMPTS="3"
KOMMO_RETRY_DELAY="1000"
KOMMO_DEBUG="true"
KOMMO_BASE_DOMAIN="kommo.com"

# ===== AMBIENTE =====
NODE_ENV="development"
```

## 🔐 Obtendo as Credenciais

### Gestão Click

1. Acesse o painel do Gestão Click
2. Vá para "Integrações" ou "API"
3. Gere um novo token de acesso
4. Copie o **Access Token** e o **Secret Token**
5. Cole nos arquivos `.env.local`

```env
GESTAO_CLICK_API_KEY=d82597d5513e7ae570c946eac98da2f8fa1e0092
GESTAO_CLICK_SECRET_TOKEN=2ae6d4e76353c9d187dc42361eec49b6dad423b9
```

### KOMMO CRM

1. Acesse sua conta KOMMO (https://kommo.com)
2. Vá para "Configurações" > "Integrações" > "API"
3. Gere um novo **JWT Token de Longa Duração**
4. Copie o token completo (é um token JWT com múltiplas partes)
5. Cole em `.env.local`

```env
KOMMO_JWT_TOKEN=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjM3MWM4YmExZTgyNjhiYTY0NzQ3ZTYyMDFlOWIzNGMyMzJhMjlmOTU1ZGE4Y2E1YmI3ZWRmMTNlZTM5ZmNiOTliMGYxMTNkNzM5YWYwOWQ0In0.eyJhdWQiOiI0Y2Y0ZTZlMS1iZDNiLTQxY2UtYTdkNy1iN2JjNTk4OTE3ZjYiLCJqdGkiOiIzNzFjOGJhMWU4MjY4YmE2NDc0N2U2MjAxZTliMzRjMjMyYTI5Zjk1NWRhOGNhNWJiN2VkZjEzZWUzOWZjYjk5YjBmMTEzZDczOWFmMDlkNCIsImlhdCI6MTc2ODU3MzU5NSwibmJmIjoxNzY4NTczNTk1LCJleHAiOjE3ODI4NjQwMDAsInN1YiI6Ijc1MTUyMTUiLCJncmFudF90eXBlIjoiIiwiYWNjb3VudF9pZCI6Mjk3NDU4ODcsImJhc2VfZG9tYWluIjoia29tbW8uY29tIiwidmVyc2lvbiI6Miwic2NvcGVzIjpbImNybSIsImZpbGVzIiwiZmlsZXNfZGVsZXRlIiwibm90aWZpY2F0aW9ucyIsInB1c2hfbm90aWZpY2F0aW9ucyJdLCJoYXNoX3V1aWQiOiIxZWY2NWYwZC0wOGMyLTRhZTYtYmVhNy04N2M3OTMzOTczODkiLCJ1c2VyX2ZsYWdzIjowLCJhcGlfZG9tYWluIjoiYXBpLWMua29tbW8uY29tIn0.WamTl2uuwoiHHWv70tEBQ3HTiPkv4tHG50Z48hCZ7xm65wpjGQbSvB1qThbrmUyFxjrgiGNTIFnAV5sLaWjANQgQjOSPscjMnxUdm7ZmwJepVvCBWh3hzSL9uwm-EuMptGqovDpIEsOx4tl1q8Yhko9d0HXDgvMK6FvK7aqC3WinP1S2fES6rGgj4_Bg7sZ7ASduX9BSaR2DWAEVIRycFvf_qZuiL1jFYB8qIKMFS6ZVnkmWvUDby987vk5AmG8dhWZLYV7wkMFZUXj3PZaRO2e6pRWCMuA-PMqMROpP5BFkK-ZuWlxSUc_B-cBVNcYQBmBD7haKhG-hlrEp0uRkqQ
```

## ✅ Testando as Integrações

### 1. Testar Gestão Click

```bash
curl -X POST http://localhost:3000/api/gestao-click/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "seu_access_token",
    "secretToken": "seu_secret_token"
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "message": "Conexão estabelecida com sucesso",
  "connection": {
    "status": "connected"
  },
  "diagnostics": {
    "clients": {
      "count": 5,
      "items": [...]
    }
  }
}
```

### 2. Testar KOMMO CRM

```bash
curl -X POST http://localhost:3000/api/kommo/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "jwtToken": "seu_jwt_token"
  }'
```

**Resposta esperada:**

```json
{
  "success": true,
  "message": "Conexão com KOMMO CRM estabelecida com sucesso",
  "connection": {
    "status": "connected"
  },
  "account": {
    "accountId": 2974588,
    "baseDomain": "kommo.com",
    "expiresAt": "2025-02-20T23:20:00.000Z"
  }
}
```

## 📊 Sincronizando Dados

### KOMMO CRM - Sincronizar Contatos e Negociações

```bash
curl -X POST http://localhost:3000/api/kommo/sync \
  -H "Content-Type: application/json" \
  -d '{
    "jwtToken": "seu_jwt_token"
  }'
```

**Resposta:**

```json
{
  "success": true,
  "message": "Sincronização concluída: 150 contatos, 75 negociações",
  "data": {
    "contactsCount": 150,
    "dealsCount": 75,
    "lastSync": "2025-01-19T10:30:00.000Z"
  }
}
```

## 🔍 Obtendo Dados

### KOMMO - Listar Contatos

```bash
curl "http://localhost:3000/api/kommo/contacts?page=1&limit=50"
```

### KOMMO - Listar Negociações

```bash
curl "http://localhost:3000/api/kommo/deals?page=1&limit=50"
```

### Gestão Click - Obter Vendas

```bash
curl "http://localhost:3000/api/gestao-click/sales"
```

## 📁 Estrutura de Arquivos Criados

```
app/
├── _config/
│   ├── gestao-click.ts                    # Configuração Gestão Click
│   └── kommo.ts                           # Configuração KOMMO ✨ NOVO
├── _services/
│   ├── gestao-click-base-service.ts
│   ├── gestao-click-service.ts
│   ├── kommo-base-service.ts              # ✨ NOVO
│   └── kommo-service.ts                   # ✨ NOVO
├── _types/
│   ├── gestao-click.ts
│   └── kommo.ts                           # ✨ NOVO
├── api/
│   ├── gestao-click/                      # Existente
│   └── kommo/                             # ✨ NOVO
│       ├── test-connection/route.ts
│       ├── contacts/route.ts
│       ├── deals/route.ts
│       └── sync/route.ts
├── lib/
│   └── integration-examples.ts            # ✨ NOVO
└── docs/
    └── integracao/
        ├── gestao-click-integration.md
        ├── kommo-crm-integration.md       # ✨ NOVO
        └── INTEGRACTIONS-GUIDE.md         # ✨ NOVO

.env.example                               # ✨ ATUALIZADO
```

## 🚀 Rodando a Aplicação

### Desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

A aplicação estará disponível em `http://localhost:3000`

### Produção

```bash
npm run build
npm run start
```

## 📝 Logs e Debug

Para ativar logs detalhados das integrações:

```env
GESTAO_CLICK_DEBUG=true
KOMMO_DEBUG=true
NODE_ENV=development
```

Os logs aparecerão no console:

```
[KOMMO_CONFIG] Configurações antes da validação: { apiUrl: '...', jwtToken: 'aYi...' }
[KOMMO_TEST_CONNECTION] JWT decodificado com sucesso
[KOMMO_CONNECTION_SUCCESS] Conexão com KOMMO validada
```

## 🔒 Segurança

### ✅ Boas Práticas

1. **Nunca comitar tokens** nos arquivos de código
   - Use `.env.local` para desenvolvimento (não é trackado pelo git)
   - Use secrets do seu provedor em produção

2. **HTTPS em Produção**
   - Sempre use HTTPS para proteger os tokens em trânsito

3. **Regenerar Tokens Periodicamente**
   - Especialmente em ambientes de produção
   - KOMMO recomenda renovação anual

4. **Monitoramento**
   - Monitore as logs de erro das integrações
   - Configure alertas para falhas de conexão

### ⚠️ O Que NÃO Fazer

```bash
# ❌ NÃO FAÇA ISSO
git add .env
git commit -m "Add API keys"

# ❌ NÃO EXPONHA EM LOGS
console.log('JWT Token:', jwtToken)

# ❌ NÃO USE EM URLs
fetch(`/api/kommo/test-connection?jwtToken=${token}`)
```

## 🆘 Troubleshooting

### Erro: "JWT token não foi fornecido"

```
SOLUÇÃO: Verifique se KOMMO_JWT_TOKEN está definido em .env.local
```

### Erro: "401 Unauthorized"

```
SOLUÇÃO: Token expirou ou é inválido. Regenere o token no KOMMO
```

### Erro: "429 Too Many Requests"

```
SOLUÇÃO: Você fez muitas requisições. A aplicação faz retry automático.
Aguarde alguns momentos.
```

### Erro: "Connection refused"

```
SOLUÇÃO: Verifique:
1. Se a URL da API está correta
2. Se tem conexão com a internet
3. Se há firewall bloqueando
```

## 📚 Documentação Completa

Para documentação detalhada de cada integração:

- [Integração Gestão Click](./docs/integracao/gestao-click-integration.md)
- [Integração KOMMO CRM](./docs/integracao/kommo-crm-integration.md)
- [Guia de Integrações](./docs/integracao/INTEGRACTIONS-GUIDE.md)

## 💡 Exemplos de Código

Veja exemplos completos em:

- [Exemplos de Integração](./app/lib/integration-examples.ts)

## 🆘 Suporte

Para problemas com as integrações:

1. Ativar debug mode: `KOMMO_DEBUG=true`
2. Verificar logs da aplicação
3. Testar a conexão com os endpoints de teste
4. Verificar credenciais em seus painéis

### Links Úteis

- [KOMMO API Documentation](https://www.kommo.com/developers/)
- [Gestão Click API](https://www.beteltecnologia.com/)
- [NextAuth Documentation](https://next-auth.js.org/)

## 📄 Licença

Veja LICENSE para detalhes.

## 🎯 Próximas Etapas

- [ ] Implementar webhooks do KOMMO
- [ ] Sincronização bidirecional
- [ ] Dashboard unificado
- [ ] Relatórios cruzados
- [ ] Automações avançadas
