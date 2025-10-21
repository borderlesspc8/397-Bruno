# 🔍 API DE DIAGNÓSTICO - CEO DASHBOARD

## ⚠️ GARANTIA DE ISOLAMENTO

Esta API é **100% SEGURA** e **NÃO afeta outros dashboards**:

### ✅ O que esta API FAZ:
- ✅ **LÊ** vendas do Supabase (com `forceUpdate: false`)
- ✅ **LÊ** dados das APIs do Gestão Click
- ✅ **ANALISA** e agrupa dados por centro de custo
- ✅ **RETORNA** JSON com diagnóstico completo
- ✅ **LOGA** informações no console do servidor

### ❌ O que esta API NÃO FAZ:
- ❌ **NÃO modifica** dados de vendas
- ❌ **NÃO modifica** dados de vendedores
- ❌ **NÃO modifica** dados de produtos
- ❌ **NÃO altera** cache de outros dashboards
- ❌ **NÃO cria** novos registros
- ❌ **NÃO atualiza** registros existentes
- ❌ **NÃO deleta** nada

### 🔒 Isolamento Garantido:
1. **Usa apenas serviços do CEO Dashboard** (`gestao-click-api.service.ts`)
2. **Não importa nada** de `/dashboard/vendas/`, `/dashboard/vendedores/` ou `/dashboard/produtos/`
3. **Não afeta cache** de outros sistemas
4. **Apenas leitura** de dados

---

## 🚀 Como Usar

### 1. Acesse a API:
```
http://localhost:3000/api/ceo/diagnostico
```

### 2. Você verá um JSON com:
```json
{
  "success": true,
  "periodo": {
    "inicio": "2024-10-01T00:00:00.000Z",
    "fim": "2024-10-31T23:59:59.999Z"
  },
  "vendas": {
    "total": 150,
    "valorTotal": 50000,
    "exemplo": { ... }
  },
  "apis": {
    "pagamentos": {
      "total": 45,
      "pagos": 42,
      "exemplos": [ ... ]
    },
    "recebimentos": {
      "total": 67
    },
    "centrosCustos": {
      "total": 28,
      "lista": [ ... ]
    },
    "contasBancarias": {
      "total": 3,
      "saldoTotal": 15000
    }
  },
  "resumoPorCentroCusto": [
    {
      "id": 123,
      "nome": "SALÁRIOS",
      "total": 8000,
      "quantidade": 5,
      "pagamentos": [ ... ]
    },
    ...
  ],
  "diagnostico": {
    "temVendas": true,
    "temPagamentos": true,
    "temPagamentosPagos": true,
    "temCentrosCustos": true,
    "centrosCustosComMovimentacao": 15
  }
}
```

### 3. Veja os logs no console do servidor:
```
========================================
🔍 DIAGNÓSTICO CEO - APENAS LEITURA
⚠️ ZERO MODIFICAÇÕES EM OUTROS DASHBOARDS
========================================

🔍 DIAGNÓSTICO INICIADO
User ID: xxx
Período: 2024-10-01 até 2024-10-31

📊 1. Buscando vendas do Supabase...
✅ Total de vendas: 150

💸 2. Buscando dados das APIs...
✅ Pagamentos: 45
✅ Recebimentos: 67
✅ Centros de Custo: 28
✅ Contas Bancárias: 3

📊 3. Analisando pagamentos por centro de custo...
✅ Pagamentos efetivados (liquidado='pg'): 42
✅ Centros de custo com movimentação: 15

📊 TOP 10 CENTROS DE CUSTO COM MAIS DESPESAS:
1. SALÁRIOS: R$ 8000.00 (5 pagamentos)
2. ALUGUEL: R$ 2500.00 (1 pagamentos)
3. MARKETING: R$ 1200.00 (3 pagamentos)
...

========================================
✅ DIAGNÓSTICO CONCLUÍDO
========================================
```

---

## 📋 Próximos Passos

Após executar o diagnóstico:

1. **Compartilhe o JSON completo** que aparecer no navegador
2. **Verifique os logs** no console do servidor
3. **Identifique problemas:**
   - Se `temPagamentos: false` → API de pagamentos não está funcionando
   - Se `centrosCustosComMovimentacao: 0` → Nenhum pagamento tem centro de custo
   - Se `resumoPorCentroCusto` tem só 1 item → Só um centro de custo tem dados

4. **Baseado nos dados REAIS, vou corrigir:**
   - Se centros de custo estão em campo diferente
   - Se precisa usar outra API
   - Se estrutura de dados está diferente do esperado

---

## ⚡ Execução Imediata

```bash
# 1. Certifique-se que o servidor está rodando
npm run dev

# 2. Acesse no navegador
http://localhost:3000/api/ceo/diagnostico

# 3. Copie o JSON completo que aparecer
# 4. Compartilhe comigo para análise
```

---

**GARANTIA:** Esta API não vai afetar absolutamente nada nos outros dashboards. É apenas leitura e análise.


