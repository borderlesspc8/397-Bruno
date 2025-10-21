# 📊 Mapeamento Completo das APIs do Gestão Click

## 📌 Informações de Conexão

### URL Base
```
https://api.beteltecnologia.com.br
```
**IMPORTANTE:** É `.com.br` e NÃO `.com`

### Headers de Autenticação
```http
Content-Type: application/json
access-token: {GESTAO_CLICK_ACCESS_TOKEN}
secret-access-token: {GESTAO_CLICK_SECRET_ACCESS_TOKEN}
```

### Variáveis de Ambiente Necessárias
```env
GESTAO_CLICK_API_URL=https://api.beteltecnologia.com.br
GESTAO_CLICK_ACCESS_TOKEN=seu_token_aqui
GESTAO_CLICK_SECRET_ACCESS_TOKEN=seu_secret_token_aqui
```

---

## 🔍 Endpoints Mapeados

### 1. `/vendas` - VALIDADO ✅

**Endpoint:**
```
GET /vendas?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD&todas_lojas=true
```

**Resposta:** `{ data: BetelVenda[] }`

**Interface BetelVenda (CAMPOS REAIS):**
```typescript
interface BetelVenda {
  id: number;
  cliente: string;
  cliente_id: number;
  valor_total: string; // Valor como string
  valor_liquido?: string; // Valor líquido após descontos
  valor_produtos?: string; // Valor dos produtos antes de descontos
  data_inclusao: string; // Formato: "YYYY-MM-DD HH:MM:SS"
  data: string; // Formato: "YYYY-MM-DD" ou "YYYY-MM-DDTHH:MM:SS"
  data_venda?: string; // Data com timestamp
  
  // Vendedor
  vendedor_id?: number;
  vendedor_nome?: string;
  nome_vendedor?: string;
  
  // Loja
  loja_id?: string | number;
  nome_loja?: string;
  
  // Valores Financeiros
  valor_custo?: string;
  desconto_valor?: string;
  desconto_porcentagem?: string;
  valor_frete?: string;
  
  // Status
  nome_situacao?: string; // Ex: "Concretizada", "Em andamento", "Cancelada"
  id_situacao_venda?: number;
  
  // Forma de Pagamento (pode ter múltiplas variações de campo)
  forma_pagamento?: string;
  forma_pagamento_id?: number;
  metodo_pagamento?: string;
  
  // Array de pagamentos (vendas com múltiplas formas)
  pagamentos?: Array<{
    id?: number;
    valor?: string;
    status?: string;
    pagamento?: {
      id?: number;
      nome_forma_pagamento?: string;
      tipo_pagamento?: string;
    };
  }>;
  
  // Itens da Venda
  itens: Array<{
    id: number;
    produto_id: number;
    produto: string;
    descricao?: string;
    categoria?: string;
    quantidade: string;
    valor_unitario: string;
    preco_unitario?: string;
    valor_total: string;
    valor_custo?: string;
  }>;
  
  // Campos adicionais possíveis
  produtos?: Array<any>; // Alias para itens
  observacoes?: string;
  notas?: string;
  metadata?: any;
}
```

**Status Válidos Identificados:**
- `"Concretizada"` - Venda finalizada
- `"Em andamento"` - Venda em processo
- `"Cancelada"` - Venda cancelada
- `"Pendente"` - Venda pendente

**Paginação:**
- Suporta `page` e `limit` via query params
- Resposta com `meta` pode incluir `total_paginas`, `proxima_pagina`

---

### 2. `/lojas` - VALIDADO ✅

**Endpoint:**
```
GET /lojas
```

**Resposta:** `{ data: BetelLoja[] }`

**Interface BetelLoja (CAMPOS REAIS):**
```typescript
interface BetelLoja {
  id: string | number;
  nome: string;
  matriz?: boolean;
  endereco?: string;
  cidade?: string;
  estado?: string;
  ativa?: boolean;
}
```

**Uso:**
- Usado para buscar vendas de cada loja individualmente
- Evita duplicação de vendas entre matriz e filiais

---

### 3. `/produtos` - VALIDADO ✅

**Endpoint:**
```
GET /produtos
GET /produtos?limit=100
```

**Resposta:** `{ data: BetelProduto[] }`

**Interface BetelProduto (CAMPOS REAIS):**
```typescript
interface BetelProduto {
  id: number;
  nome: string;
  descricao?: string;
  valor_venda?: string | number;
  valor_custo?: string | number;
  nome_grupo?: string; // Categoria/Grupo
  grupo_id?: number;
  estoque?: number;
  codigo?: string;
  ativo?: boolean;
}
```

---

### 4. `/recebimentos` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /recebimentos?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
```

**Interface Assumida (PRECISA VALIDAR):**
```typescript
interface BetelRecebimento {
  id: number;
  valor: string;
  data_recebimento: string;
  data_vencimento?: string;
  data_pagamento?: string;
  forma_pagamento_id?: number;
  forma_pagamento_nome?: string;
  venda_id?: number;
  cliente_id?: number;
  status?: string; // Ex: "Pago", "Pendente", "Atrasado"
  conta_bancaria_id?: number;
  observacoes?: string;
}
```

**Status:** ⚠️ **PRECISA VALIDAR COM API REAL**

---

### 5. `/pagamentos` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /pagamentos?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
```

**Interface Assumida (PRECISA VALIDAR):**
```typescript
interface BetelPagamento {
  id: number;
  valor: string;
  data_pagamento: string;
  data_vencimento?: string;
  descricao?: string;
  forma_pagamento_id?: number;
  forma_pagamento_nome?: string;
  centro_custo_id?: number;
  centro_custo_nome?: string;
  fornecedor_id?: number;
  fornecedor_nome?: string;
  categoria?: string;
  tipo?: string; // Ex: "Despesa", "Investimento"
  status?: string;
  plano_conta_id?: number;
  conta_bancaria_id?: number;
}
```

**Status:** ⚠️ **PRECISA VALIDAR COM API REAL**

---

### 6. `/clientes` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /clientes
GET /clientes?todos=true
GET /clientes?limit=1000
```

**Interface Assumida (PRECISA VALIDAR):**
```typescript
interface BetelCliente {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  data_cadastro: string;
  data_nascimento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  status?: string; // Ex: "Ativo", "Inativo"
  limite_credito?: string;
  observacoes?: string;
  // Campos calculados (podem não vir da API)
  ultima_compra?: string;
  total_compras?: number;
  valor_total_gasto?: number;
}
```

**Status:** ⚠️ **PRECISA VALIDAR COM API REAL**

---

### 7. `/fornecedores` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /fornecedores
```

**Interface Assumida (PRECISA VALIDAR):**
```typescript
interface BetelFornecedor {
  id: number;
  nome: string;
  razao_social?: string;
  cpf_cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  status?: string;
}
```

**Status:** ⚠️ **PRECISA VALIDAR COM API REAL**

---

### 8. `/funcionarios` - VALIDADO ✅

**Endpoint:**
```
GET /funcionarios
```

**Resposta:** `{ data: BetelFuncionario[] }`

**Interface BetelFuncionario (CAMPOS REAIS):**
```typescript
interface BetelFuncionario {
  id: number;
  nome: string;
  cargo_nome?: string;
  cargo_id?: number;
  email?: string;
  telefone?: string;
  data_admissao?: string;
  status?: string; // Ex: "Ativo", "Inativo"
  loja_id?: number;
  vendedor?: boolean;
}
```

**Uso:** Mapeamento de vendedores (campo `vendedor_id` em vendas)

---

### 9. `/grupos_produto` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /grupos_produto
```

**Interface Assumida (PRECISA VALIDAR):**
```typescript
interface BetelGrupoProduto {
  id: number;
  nome: string;
  descricao?: string;
  categoria_pai_id?: number;
  ativo?: boolean;
}
```

**Status:** ⚠️ **PRECISA VALIDAR COM API REAL**

---

### 10. `/formas_pagamentos` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /formas_pagamentos
```

**Interface Assumida (PRECISA VALIDAR):**
```typescript
interface BetelFormaPagamento {
  id: number;
  nome_forma_pagamento: string;
  nome?: string;
  tipo_pagamento?: string; // Ex: "Crédito", "Débito", "Dinheiro", "PIX"
  categoria?: string;
  ativa?: boolean;
  taxa?: number;
  prazo_compensacao?: number;
}
```

**Status:** ⚠️ **PRECISA VALIDAR COM API REAL**

---

### 11. `/centros_custos` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /centros_custos
```

**Interface Assumida (PRECISA VALIDAR):**
```typescript
interface BetelCentroCusto {
  id: number;
  nome: string;
  descricao?: string;
  codigo?: string;
  tipo?: string; // Ex: "Receita", "Despesa"
  ativo?: boolean;
}
```

**Status:** ⚠️ **PRECISA VALIDAR COM API REAL**

---

### 12. `/situacoes_vendas` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /situacoes_vendas
GET /situacoes
```

**Interface Assumida (PRECISA VALIDAR):**
```typescript
interface BetelSituacaoVenda {
  id: number;
  nome: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
  finalizada?: boolean; // Se a venda está concluída
  ativo?: boolean;
}
```

**Status:** ⚠️ **PRECISA VALIDAR COM API REAL**

---

### 13. `/atributos_vendas` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /atributos_vendas
```

**Status:** ⚠️ **PRECISA VALIDAR SE EXISTE**

---

### 14. `/planos_contas` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /planos_contas
```

**Status:** ⚠️ **PRECISA VALIDAR SE EXISTE**

---

### 15. `/contas_bancarias` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /contas_bancarias
```

**Status:** ⚠️ **PRECISA VALIDAR SE EXISTE**

---

### 16. `/notas_fiscais_produtos` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /notas_fiscais_produtos
```

**Status:** ⚠️ **PRECISA VALIDAR SE EXISTE**

---

### 17. `/despesas` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /despesas?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
```

**Uso:** Métricas Avançadas - Investimentos em Marketing

**Status:** ⚠️ **PRECISA VALIDAR SE EXISTE** (pode ser `/pagamentos` com filtro)

---

### 18. `/atendimentos` ou `/leads` - ASSUMIDO ⚠️

**Endpoint Assumido:**
```
GET /atendimentos?data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
```

**Uso:** Métricas Avançadas - CAC, Taxa de Conversão

**Status:** ⚠️ **PRECISA VALIDAR SE EXISTE**

---

## 📝 Padrões Identificados

### Formato de Resposta
```typescript
// Padrão 1: Com wrapper "data"
{
  "data": [...],
  "meta"?: {
    "total": number,
    "total_paginas": number,
    "pagina_atual": number,
    "proxima_pagina": number | null
  }
}

// Padrão 2: Array direto
[...]
```

### Formato de Datas
- **Data Simples:** `"YYYY-MM-DD"`
- **Data com Hora:** `"YYYY-MM-DD HH:MM:SS"`
- **ISO 8601:** `"YYYY-MM-DDTHH:MM:SS.sssZ"`

### Formato de Valores Monetários
- **Tipo:** `string` (não `number`)
- **Formato:** `"1234.56"` ou `"1234,56"`
- **Conversão:** Sempre usar `parseFloat()` após normalização

### Autenticação
- **Método:** Headers customizados
- **Headers:** `access-token` e `secret-access-token`
- **Erro 401:** Credenciais inválidas ou expiradas

### Timeout
- **Recomendado:** 30 segundos
- **Retry:** 3 tentativas com backoff exponencial

---

## 🎯 Endpoints Prioritários para Dashboard CEO

### Alta Prioridade ⭐⭐⭐
1. ✅ `/vendas` - Base de tudo
2. ✅ `/lojas` - Evitar duplicação
3. ✅ `/produtos` - Produtos mais vendidos
4. ⚠️ `/recebimentos` - Fluxo de caixa, DRE
5. ⚠️ `/pagamentos` - Custos, despesas, DRE
6. ⚠️ `/clientes` - CAC, Churn, LTV

### Média Prioridade ⭐⭐
7. ⚠️ `/centros_custos` - Rentabilidade
8. ⚠️ `/formas_pagamentos` - Análise de pagamentos
9. ✅ `/funcionarios` - Vendedores

### Baixa Prioridade ⭐
10. ⚠️ `/grupos_produto` - Categorização
11. ⚠️ `/situacoes_vendas` - Status
12. ⚠️ Outros - Dados auxiliares

---

## ⚠️ Próximos Passos

1. **Validar endpoints assumidos** fazendo requisições reais
2. **Documentar campos reais** após validação
3. **Atualizar interfaces TypeScript** com campos confirmados
4. **Remover campos assumidos** que não existem
5. **Criar fallbacks inteligentes** apenas para dados críticos

---

## 🔧 Serviço Centralizado

Criar: `app/api/ceo/_lib/gestao-click-service.ts`

**Responsabilidades:**
- Requisições autenticadas
- Retry com backoff
- Cache de dados auxiliares
- Validação de resposta
- Tratamento de erros
- Log estruturado



