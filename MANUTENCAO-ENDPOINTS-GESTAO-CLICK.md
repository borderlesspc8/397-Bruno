# Guia de Manutenção - Endpoints API Gestão Click

## 📋 Índice
1. [Como Testar os Endpoints](#como-testar-os-endpoints)
2. [Configuração de Autenticação](#configuração-de-autenticação)
3. [Endpoints Disponíveis](#endpoints-disponíveis)
4. [Troubleshooting](#troubleshooting)
5. [Monitoramento](#monitoramento)

---

## 🧪 Como Testar os Endpoints

### Método 1: Usando o Script PowerShell (Recomendado)

```powershell
# Execute o script de teste automatizado
powershell.exe -ExecutionPolicy Bypass -File test-endpoints.ps1
```

O script irá:
- ✅ Testar todos os 23 endpoints
- ✅ Gerar relatório JSON com resultados
- ✅ Exibir resumo colorido no terminal
- ✅ Identificar problemas automaticamente

### Método 2: Teste Manual com cURL

```bash
curl -X GET "https://api.beteltecnologia.com/[ENDPOINT]" \
  -H "access-token: 35f6a8f4b1f80e1a0c2bb0c85fb6f071ba92e82b" \
  -H "Secret-Access-Token: 823e5135fab01a057328fbd0a8a99f17aa38933d" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

Substitua `[ENDPOINT]` por qualquer um da lista:
- `vendas`, `produtos`, `clientes`, `fornecedores`, etc.

### Método 3: Usando o Serviço TypeScript

```typescript
import { GestaoClickService } from '@/app/_services/gestao-click-service';

const service = new GestaoClickService();
const vendas = await service.fetchVendas();
```

---

## 🔐 Configuração de Autenticação

### Variáveis de Ambiente (.env)

```env
GESTAO_CLICK_API_URL=https://api.beteltecnologia.com
GESTAO_CLICK_ACCESS_TOKEN=35f6a8f4b1f80e1a0c2bb0c85fb6f071ba92e82b
GESTAO_CLICK_SECRET_ACCESS_TOKEN=823e5135fab01a057328fbd0a8a99f17aa38933d
```

### Headers Obrigatórios

Todas as requisições devem incluir:

| Header | Valor | Obrigatório |
|--------|-------|-------------|
| `access-token` | Token de acesso da API | ✅ Sim |
| `Secret-Access-Token` | Token secreto | ✅ Sim |
| `Content-Type` | application/json | ✅ Sim |
| `Accept` | application/json | ✅ Sim |

---

## 📡 Endpoints Disponíveis

### Financeiros (9 endpoints)
```
GET /vendas
GET /situacoes_vendas
GET /atributos_vendas
GET /centros_custos
GET /planos_contas
GET /contas_bancarias
GET /formas_pagamentos
GET /recebimentos
GET /pagamentos
```

### Fiscais (3 endpoints)
```
GET /notas_fiscais_servicos
GET /notas_fiscais_consumidores
GET /notas_fiscais_produtos
```

### Operacionais (6 endpoints)
```
GET /compras
GET /situacoes_compras
GET /ordens_servicos
GET /orcamentos
GET /situacoes_orcamentos
GET /servicos
```

### Cadastros (5 endpoints)
```
GET /produtos
GET /grupos_produtos    ⭐ ATENÇÃO: plural
GET /clientes
GET /fornecedores
GET /funcionarios
```

---

## 🔧 Troubleshooting

### Problema: Erro 404 em /grupos_produto

**Causa:** Endpoint incorreto  
**Solução:** Use `/grupos_produtos` (com 's' no final)

```diff
- https://api.beteltecnologia.com/grupos_produto ❌
+ https://api.beteltecnologia.com/grupos_produtos ✅
```

### Problema: Erro 401 Unauthorized

**Causa:** Headers de autenticação ausentes ou incorretos  
**Solução:** Verifique se os headers estão corretos:

```typescript
headers: {
  'access-token': process.env.GESTAO_CLICK_ACCESS_TOKEN,
  'Secret-Access-Token': process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

### Problema: Timeout em requisições

**Causa:** Endpoint com grande volume de dados  
**Soluções:**

1. **Aumentar timeout:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 60000); // 60s
```

2. **Usar paginação:**
```
GET /vendas?pagina=1&limite=50
```

3. **Adicionar filtros de data:**
```
GET /vendas?data_inicio=2025-10-01&data_fim=2025-10-21
```

### Problema: Resposta vazia (0 items)

**Causa:** Pode ser normal - não há dados no período  
**Verificação:**

```typescript
const response = await fetch(url);
const data = await response.json();

if (data.retorno && Object.keys(data.retorno).length === 0) {
  console.log('Sem dados no período especificado');
}
```

---

## 📊 Monitoramento

### Endpoints que Requerem Atenção

| Endpoint | Tempo Médio | Ação Recomendada |
|----------|-------------|------------------|
| `/notas_fiscais_produtos` | 2929ms | Implementar cache |
| `/vendas` | 1382ms | Usar filtros de data |
| `/compras` | 1226ms | Implementar paginação |
| `/orcamentos` | 1188ms | Considerar cache |

### Implementar Cache

```typescript
import { cache } from '@/app/_lib/cache';

const CACHE_TIME = 5 * 60 * 1000; // 5 minutos

async function fetchVendasComCache() {
  const cacheKey = 'gestao-click:vendas';
  const cached = await cache.get(cacheKey);
  
  if (cached) return cached;
  
  const data = await fetchVendas();
  await cache.set(cacheKey, data, CACHE_TIME);
  
  return data;
}
```

### Implementar Retry Logic

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        headers: getHeaders()
      });
      
      if (response.ok) return response;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

---

## 📝 Logs e Debugging

### Habilitar Debug

```typescript
// app/_config/gestao-click.ts
export const gestaoClickConfig = {
  debug: true, // ← Habilitar logs detalhados
  // ...
};
```

### Ver Logs no Console

```typescript
import { logger } from '@/app/_services/logger';

logger.debug('[GESTAO_CLICK] Iniciando requisição', { endpoint: '/vendas' });
logger.info('[GESTAO_CLICK] Requisição concluída', { status: 200, time: '481ms' });
logger.error('[GESTAO_CLICK] Erro na requisição', { error });
```

---

## 🔄 Atualizar Endpoints

Se novos endpoints forem adicionados à API:

1. **Adicione ao arquivo de teste:**
```powershell
# test-endpoints.ps1
$endpoints = @(
    # ... existentes
    "novo_endpoint"  # ← Adicione aqui
)
```

2. **Execute os testes:**
```powershell
powershell.exe -ExecutionPolicy Bypass -File test-endpoints.ps1
```

3. **Atualize a documentação:**
- `ENDPOINTS-GESTAO-CLICK-LISTA.txt`
- `RELATORIO-TESTE-ENDPOINTS-GESTAO-CLICK.md`

---

## 📚 Referências

- **Documentação Completa:** `RELATORIO-TESTE-ENDPOINTS-GESTAO-CLICK.md`
- **Lista Rápida:** `ENDPOINTS-GESTAO-CLICK-LISTA.txt`
- **Script de Teste:** `test-endpoints.ps1`
- **Dados Brutos:** `test-report-*.json`

---

## ✅ Checklist de Verificação

Antes de fazer deploy ou ao investigar problemas:

- [ ] Verificar se variáveis de ambiente estão configuradas
- [ ] Testar endpoints com `test-endpoints.ps1`
- [ ] Verificar se todos retornam HTTP 200
- [ ] Confirmar que autenticação está funcionando
- [ ] Verificar tempo de resposta dos endpoints lentos
- [ ] Testar em ambiente de staging primeiro
- [ ] Revisar logs por erros
- [ ] Confirmar que cache está funcionando (se implementado)

---

## 🆘 Suporte

Em caso de problemas persistentes:

1. Execute o script de diagnóstico completo
2. Verifique os logs do servidor
3. Confirme conectividade com a API
4. Valide tokens de autenticação
5. Teste endpoint individual com cURL

---

**Última Atualização:** 21/10/2025  
**Versão da API:** Atual  
**Status:** ✅ Operacional

