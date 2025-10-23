# 🔍 COMO USAR O DIAGNÓSTICO PÚBLICO

## ⚠️ VERSÃO TEMPORÁRIA - APENAS PARA DIAGNÓSTICO

Esta API não requer login, é apenas para identificar o problema.

---

## 🚀 OPÇÃO 1: Usar userId conhecido

Se você sabe seu userId (do banco de dados ou Supabase):

```
http://localhost:3000/api/ceo/diagnostico-publico?userId=SEU_USER_ID_AQUI
```

Exemplo:
```
http://localhost:3000/api/ceo/diagnostico-publico?userId=123e4567-e89b-12d3-a456-426614174000
```

---

## 🚀 OPÇÃO 2: Pegar userId do localStorage

1. **Abra o Dashboard CEO** no navegador (faça login normalmente)
2. **Abra o Console do navegador** (F12)
3. **Digite no console:**
   ```javascript
   localStorage.getItem('supabase.auth.token')
   ```
4. **Copie o userId** que aparecer
5. **Use na URL:**
   ```
   http://localhost:3000/api/ceo/diagnostico-publico?userId=COLE_O_ID_AQUI
   ```

---

## 🚀 OPÇÃO 3: Usar qualquer userId de teste

Se você tem acesso ao banco de dados, pegue qualquer userId da tabela `users`:

```sql
SELECT id, email FROM users LIMIT 1;
```

E use esse ID na URL.

---

## 📊 O QUE VOCÊ VAI VER

Um JSON completo com:
- ✅ Total de vendas
- ✅ Total de pagamentos (e status de cada um)
- ✅ **TODOS os centros de custo** disponíveis
- ✅ **Resumo por centro de custo** com valores
- ✅ Exemplos de pagamentos
- ✅ Diagnóstico do problema

---

## 🎯 IDENTIFICAR O PROBLEMA

O JSON vai mostrar:

### Se aparecer:
```json
{
  "diagnostico": {
    "centrosCustosComMovimentacao": 1,
    "problemaIdentificado": "APENAS 1 CENTRO DE CUSTO TEM DADOS"
  }
}
```

**Isso significa:** Apenas um centro de custo (provavelmente "funcionários") tem pagamentos vinculados.

### Veja também:
```json
{
  "apis": {
    "centrosCustos": {
      "total": 28,
      "lista": [ ... todos os centros de custo ... ]
    }
  },
  "resumoPorCentroCusto": [
    {
      "id": 123,
      "nome": "ENCARGOS FUNCIONÁRIOS",
      "total": 5000,
      "quantidade": 10
    }
  ]
}
```

Se só aparecer 1 item em `resumoPorCentroCusto`, significa que:
- ✅ Os centros de custo EXISTEM (28 no total)
- ❌ Mas apenas 1 tem pagamentos vinculados
- 🔍 **CAUSA:** Pagamentos não estão sendo associados corretamente aos centros de custo

---

## 🔧 DEPOIS DO DIAGNÓSTICO

Me envie o JSON completo que aparecer, especialmente:
1. `diagnostico.centrosCustosComMovimentacao` - Quantos têm dados
2. `apis.centrosCustos.lista` - Lista completa
3. `resumoPorCentroCusto` - Quais têm valores
4. `apis.pagamentos.exemplos` - Exemplos de pagamentos com seus centros de custo

Com isso vou identificar exatamente o problema e corrigir.

---

## 🗑️ REMOVER DEPOIS

**Esta rota deve ser REMOVIDA** depois de identificar o problema, pois não tem autenticação.

Para remover:
```bash
rm app/api/ceo/diagnostico-publico/route.ts
rm app/api/ceo/diagnostico-publico/COMO_USAR.md
```




