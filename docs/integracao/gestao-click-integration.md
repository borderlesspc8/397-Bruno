# Integração com Gestão Click

## Visão Geral

A integração com o Gestão Click permite sincronizar dados de vendas e clientes entre o sistema e a plataforma Gestão Click. Esta integração é essencial para manter os dados financeiros atualizados e garantir a consistência das informações.

## Configuração

### Variáveis de Ambiente

As seguintes variáveis de ambiente são necessárias para a integração:

```env
GESTAO_CLICK_API_URL=https://api.beteltecnologia.com.br
GESTAO_CLICK_API_KEY=seu_token_de_acesso
GESTAO_CLICK_SECRET_TOKEN=seu_token_secreto
```

> **Nota:** As variáveis antigas `GESTAO_CLICK_ACCESS_TOKEN` e `GESTAO_CLICK_SECRET_ACCESS_TOKEN` ainda são suportadas para compatibilidade, mas recomendamos migrar para os novos nomes.

### Configuração do Banco de Dados

A integração utiliza a tabela `GestaoClickIntegration` para armazenar as configurações de integração por usuário:

```sql
CREATE TABLE "GestaoClickIntegration" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "apiKey" TEXT NOT NULL,
  "secretToken" TEXT NOT NULL,
  "apiUrl" TEXT NOT NULL,
  "authMethod" TEXT NOT NULL DEFAULT 'token',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  PRIMARY KEY ("id")
);
```

## Métodos de Autenticação

A integração suporta múltiplos métodos de autenticação com a API do Gestão Click:

| Método | Descrição | Formato |
|--------|-----------|---------|
| token | Autenticação via cabeçalhos token/secret | `token: apiKey` e `secret: secretToken` |
| bearer | Autenticação via Bearer Token | `Authorization: Bearer apiKey` |
| basic | Autenticação via Basic Auth | `Authorization: Basic base64(apiKey:secretToken)` |
| api-key | Autenticação via API Key | `X-API-KEY: apiKey` e `X-API-SECRET: secretToken` |
| url-params | Autenticação via parâmetros de URL | `?token=apiKey&secret=secretToken` |

O método padrão é `token`, mas você pode alterá-lo nas configurações conforme necessário.

## Funcionalidades

### Sincronização de Vendas

A integração permite sincronizar vendas do Gestão Click para o sistema local. O processo inclui:

1. Busca de vendas por período
2. Validação dos dados
3. Armazenamento local
4. Atualização do DRE

### Sincronização de Clientes

A integração permite sincronizar clientes do Gestão Click para o sistema local. O processo inclui:

1. Busca de clientes
2. Validação dos dados
3. Armazenamento local
4. Atualização de referências

### Reconciliação de Dados

A integração inclui um processo de reconciliação que:

1. Compara dados do Gestão Click com dados locais
2. Identifica discrepâncias
3. Sugere correções
4. Gera relatórios de reconciliação

## Endpoints de API

### POST /api/gestao-click/test-connection

Testa a conexão com a API do Gestão Click.

**Corpo da Requisição:**
```json
{
  "apiKey": "string",
  "secretToken": "string",
  "apiUrl": "string",
  "authMethod": "token | bearer | basic | api-key | url-params",
  "useEnvCredentials": "boolean"
}
```

**Resposta:**
```json
{
  "success": true,
  "connection": {
    "endpoint": "string",
    "status": "connected | failed",
    "authMethod": "string"
  },
  "diagnostics": {
    "clients": {
      "count": 0,
      "items": []
    },
    "errorDetails": null
  },
  "message": "string"
}
```

### GET /api/gestao-click/sales

Retorna as vendas do Gestão Click para um período específico.

**Parâmetros:**
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)
- `page`: Número da página (opcional, padrão: 1)
- `pageSize`: Tamanho da página (opcional, padrão: 100)

**Resposta:**
```json
{
  "data": [
    {
      "id": "string",
      "codigo": "string",
      "data": "string",
      "cliente_id": "string",
      "valor_total": 0,
      "situacao": "string",
      "itens": [
        {
          "id": "string",
          "produto_id": "string",
          "quantidade": 0,
          "valor_unitario": 0,
          "valor_total": 0
        }
      ]
    }
  ],
  "meta": {
    "current_page": 0,
    "per_page": 0,
    "total": 0,
    "total_pages": 0
  }
}
```

### GET /api/gestao-click/clients

Retorna os clientes do Gestão Click.

**Parâmetros:**
- `page`: Número da página (opcional, padrão: 1)
- `pageSize`: Tamanho da página (opcional, padrão: 20)

**Resposta:**
```json
{
  "data": [
    {
      "id": "string",
      "codigo": "string",
      "nome": "string",
      "cpf_cnpj": "string",
      "email": "string",
      "telefone": "string",
      "endereco": {
        "logradouro": "string",
        "numero": "string",
        "complemento": "string",
        "bairro": "string",
        "cidade": "string",
        "estado": "string",
        "cep": "string"
      }
    }
  ],
  "meta": {
    "current_page": 0,
    "per_page": 0,
    "total": 0,
    "total_pages": 0
  }
}
```

## Resolução de Problemas

### Erro de conexão

Se você estiver enfrentando problemas para conectar com o Gestão Click, verifique:

1. **Credenciais corretas**: Certifique-se de que as credenciais (API Key e Secret Token) estão corretas.
2. **URL da API**: Confirme que a URL da API está correta (geralmente `https://api.beteltecnologia.com.br`).
3. **Método de autenticação**: Verifique se o método de autenticação está configurado corretamente.
4. **Firewall/Proxy**: Verifique se sua rede permite conexões com a API do Gestão Click.
5. **Disponibilidade da API**: Confira se a API do Gestão Click está operacional.

### Estratégia de Retry

A integração implementa uma estratégia de retry progressivo para lidar com falhas temporárias:

1. Quando uma requisição falha, o sistema espera um tempo progressivamente maior antes de tentar novamente.
2. O número de tentativas e atraso entre elas é configurável.
3. Todos os erros são registrados para facilitar o diagnóstico.

## Sincronizações Agendadas

A integração suporta sincronizações automáticas em intervalos regulares:

- **Diária**: Sincroniza os dados uma vez por dia (recomendado)
- **Semanal**: Sincroniza os dados uma vez por semana
- **Mensal**: Sincroniza os dados uma vez por mês

Você pode configurar a frequência de sincronização nas configurações do sistema.

## Atualizações Recentes

### Versão 2.0

- Suporte a múltiplos métodos de autenticação
- Estratégia de retry aprimorada para maior resiliência
- Melhor tratamento de erros e logging
- Interface de usuário aprimorada para configuração
- Padronização dos nomes de variáveis de ambiente
- Suporte para diagnóstico avançado de conexão

## Manutenção

### Atualização de Configurações

Para atualizar as configurações da integração:

1. Acesse o painel de administração
2. Navegue até a seção de integrações
3. Selecione a integração com o Gestão Click
4. Atualize as configurações necessárias
5. Salve as alterações

### Solução de Problemas

Para solucionar problemas com a integração:

1. Verifique os logs de erro
2. Confirme as configurações
3. Teste a conexão
4. Verifique o status da API
5. Entre em contato com o suporte se necessário 