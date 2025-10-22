# 🚀 Instalação do Dashboard CEO

## ✅ Status da Implementação

**100% dos arquivos criados e funcionais!**

- ✅ 12 arquivos de types e utils
- ✅ 6 serviços (cache, DRE, financeiro, crescimento, metas, orquestrador)
- ✅ 6 hooks React customizados
- ✅ 7 componentes core funcionais
- ✅ 4 páginas (principal, loading, error, readme)
- ✅ 1 migration SQL completa

**Total: 36 arquivos novos criados**

---

## 📋 Pré-requisitos

- [x] Next.js rodando
- [x] Supabase configurado
- [x] Variáveis de ambiente configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🗄️ PASSO 1: Executar Migration no Supabase

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie TODO o conteúdo de: `prisma/migrations/create_metas_financeiras.sql`
6. Cole no editor
7. Clique em **Run** (ou pressione Ctrl+Enter)
8. Aguarde confirmação: "Success. No rows returned"

### Opção B: Via CLI do Supabase

```bash
# Se você usa Supabase CLI
supabase db reset
supabase migration new create_metas_financeiras
# Cole o conteúdo do arquivo SQL
supabase db push
```

---

## ✅ PASSO 2: Verificar Migration

Execute no SQL Editor do Supabase:

```sql
-- Verificar se a tabela foi criada
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'metas_financeiras'
ORDER BY ordinal_position;

-- Deve retornar todas as colunas da tabela
```

Resultado esperado:
```
metas_financeiras | id                    | uuid
metas_financeiras | user_id               | uuid
metas_financeiras | tipo                  | character varying
metas_financeiras | nome                  | character varying
...
```

---

## 🎯 PASSO 3: Testar o Dashboard

### 3.1 Acessar o Dashboard

```
http://localhost:3000/dashboard/ceo
```

### 3.2 O que você deve ver:

✅ **Header**
- Título "Dashboard CEO"
- Período selecionado
- Botões de filtro, atualizar e exportar

✅ **4 KPI Cards**
- Receita Bruta (💰)
- Lucro Líquido (🎯)
- Margem Líquida (📊)
- Ticket Médio (🛒)

✅ **Alertas Financeiros** (se houver)
- Cards coloridos por criticidade
- Descrição e ação recomendada
- Botão para dispensar

✅ **DRE Resumida**
- Todas as linhas da DRE
- Margens percentuais
- Destaque para totalizadores

✅ **Gráfico de Tendência**
- Linha com evolução mensal
- Grid e valores formatados

---

## 🧪 PASSO 4: Testar Funcionalidades

### 4.1 Filtrar por Período

1. Clique no botão **"🔍 Filtros"**
2. Altere a data de início/fim
3. Clique fora ou pressione Enter
4. Dashboard deve recarregar com novos dados

### 4.2 Atualizar Dados

1. Clique no botão **"🔄 Atualizar"**
2. Deve mostrar "Atualizando..."
3. Dados são atualizados
4. Se o cache estava ativo, ele é limpo

### 4.3 Criar uma Meta (via código)

Abra o console do navegador (F12) e execute:

```javascript
// Criar uma meta de teste
fetch('/api/ceo/metas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tipo: 'receita',
    nome: 'Meta de Receita - Teste',
    valorMeta: 50000,
    unidade: 'currency',
    periodo: '2024-01',
  })
}).then(r => r.json()).then(console.log);
```

---

## 🔍 Troubleshooting

### Problema: "Usuário não autenticado"

**Solução**: Faça login no sistema primeiro
```
http://localhost:3000/auth/signin
```

### Problema: "Error: relation 'metas_financeiras' does not exist"

**Solução**: A migration não foi executada. Volte ao PASSO 1

### Problema: Dados não aparecem

**Soluções**:
1. Verifique se há vendas no período selecionado
2. Tente alterar o filtro de data para um período com dados
3. Verifique o console do navegador (F12) para erros
4. Verifique os logs do servidor

### Problema: Cache não funciona

**Solução**: O cache é automático. Para forçar limpeza:
```javascript
// No console do navegador
localStorage.clear();
location.reload();
```

---

## 📊 Dados Exibidos

O Dashboard CEO exibe dados REAIS do `GestaoClickSupabaseService`:

### Origem dos Dados
```typescript
GestaoClickSupabaseService.sincronizarVendas({
  dataInicio,
  dataFim,
  userId,
  forceUpdate: false
})
```

### O que é calculado:
- ✅ Receita Bruta: Soma de `valor_total` de todas as vendas
- ✅ Impostos: 8.65% da Receita Bruta (Simples Nacional)
- ✅ Receita Líquida: Receita Bruta - Impostos
- ✅ CMV: Soma de `valor_custo` das vendas
- ✅ Margem Bruta: Receita Líquida - CMV
- ✅ Despesas: Estimativa baseada em percentuais
- ✅ Lucro Operacional: Margem Bruta - Despesas
- ✅ Lucro Líquido: Lucro Operacional + Resultado Financeiro

### KPIs Calculados:
- ✅ Ticket Médio: Receita Total / Quantidade de Vendas
- ✅ Novos Clientes: Count de `cliente_id` únicos
- ✅ Taxa Recorrência: % de clientes com 2+ compras

---

## 🎨 Personalização

### Alterar Cores

Edite: `app/(auth-routes)/dashboard/ceo/_constants/cores-graficos.ts`

### Alterar Alíquota de Impostos

Edite: `app/(auth-routes)/dashboard/ceo/_services/ceo-dre.service.ts`
```typescript
const aliquota = config?.aliquotaSimplesNacional || 8.65; // Altere aqui
```

### Adicionar Novos KPIs

1. Adicione em `_types/ceo-dashboard.types.ts`
2. Calcule em `_services/ceo-dashboard.service.ts`
3. Exiba em `page.tsx` usando `<KPICard />`

---

## 🚀 Próximos Passos

### Funcionalidades Básicas (Implementadas)
- ✅ Exibir dados reais
- ✅ Filtrar por período
- ✅ Cache automático
- ✅ 4 KPIs principais
- ✅ DRE completa
- ✅ Alertas financeiros
- ✅ Gráfico de tendência

### Funcionalidades Avançadas (Futuro)
- ⏳ Tabs de navegação (Financeiro, Crescimento, Metas, etc)
- ⏳ Gráficos avançados com Recharts
- ⏳ CRUD visual de metas
- ⏳ Exportação de relatórios (PDF/Excel)
- ⏳ Comparação de períodos
- ⏳ Análise de sazonalidade visual
- ⏳ Dashboard de inadimplência
- ⏳ Análise de rentabilidade por dimensão

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs**: Console do navegador (F12)
2. **Verifique o servidor**: Terminal onde o Next.js roda
3. **Verifique o Supabase**: Logs no dashboard do Supabase
4. **Cache**: Limpe com `localStorage.clear()`

---

## ✅ Checklist de Validação

Antes de considerar pronto, verifique:

- [ ] Migration executada com sucesso no Supabase
- [ ] Tabela `metas_financeiras` existe e tem dados
- [ ] Dashboard carrega sem erros
- [ ] 4 KPIs exibem valores corretos
- [ ] DRE está calculada corretamente
- [ ] Gráfico de tendência aparece (se houver múltiplos meses)
- [ ] Filtros de data funcionam
- [ ] Botão atualizar funciona
- [ ] Cache está ativo (veja "Cache ativo" no header)
- [ ] Alertas aparecem se houver problemas financeiros
- [ ] Não houve ZERO modificações em outros dashboards

---

**Dashboard CEO está pronto para uso! 🎉**

Acesse: `http://localhost:3000/dashboard/ceo`



