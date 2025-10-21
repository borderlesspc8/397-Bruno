# 📊 Observações: Dashboards Funcionais

## 🎯 Objetivo
Documentar como as dashboards **FUNCIONAIS** (vendas, vendedores) fazem requisições ao Gestão Click para replicar o padrão correto no Dashboard CEO.

---

## ✅ 1. Dashboard de Vendas

### Arquivo Analisado
`app/api/dashboard/vendas/route.ts`

### Padrão de Autenticação e Permissões
```typescript
// 1. Validar permissões do usuário
const permissionCheck = await requireVendasAccess(request);
if (!permissionCheck.success) {
  return NextResponse.json({ erro: 'Acesso negado' }, { status: 403 });
}
```

### Padrão de Requisição à API Betel
```typescript
// 2. Formatar datas
const dataInicio = format(new Date(startDate), 'yyyy-MM-dd');
const dataFim = format(new Date(endDate), 'yyyy-MM-dd');

// 3. Usar BetelTecnologiaService
const vendas = await BetelTecnologiaService.buscarVendas({
  dataInicio: new Date(dataInicio),
  dataFim: new Date(dataFim)
});
```

### Processamento de Dados
```typescript
// 4. Filtrar vendas por período exato
vendas.vendas = vendas.vendas.filter(venda => {
  const dataVenda = venda.data.split('T')[0];
  return dataVenda >= formattedDataInicio && dataVenda <= formattedDataFim;
});

// 5. Filtrar por status válidos
const STATUS_VALIDOS = ["Concretizada", "Em andamento"];
const vendasFiltradas = vendas.vendas.filter(venda => 
  STATUS_VALIDOS.includes(venda.nome_situacao)
);
```

### Cálculos Financeiros
```typescript
// 6. Usar funções de precisão numérica
import { roundToCents, parseValueSafe, sumWithPrecision } from '@/app/_utils/number-processor';

// Processar custo
totalCusto += parseValueSafe(venda.valor_custo);

// Calcular lucro com precisão
totalCusto = roundToCents(totalCusto);
const lucroTotal = roundToCents(vendas.totalValor - totalCusto - totalDescontos);
const margemLucro = vendas.totalValor > 0 ? roundToCents((lucroTotal / vendas.totalValor) * 100) : 0;
```

### Estrutura de Resposta
```typescript
return NextResponse.json({
  vendas: vendasFiltradas,
  totalVendas: totalVendasFiltradas,
  totalValor: totalValorFiltrado,
  financeiro: {
    custo: totalCusto,
    descontos: totalDescontos,
    fretes: totalFretes,
    lucro: lucroTotal,
    margemLucro
  },
  debug: debug ? {
    dataInicioFormatada: formattedDataInicio,
    dataFimFormatada: formattedDataFim,
    statusValidos: STATUS_VALIDOS,
    totalAntesFiltragem: resultado.vendas.length,
    totalAposFiltragem: totalVendasFiltradas
  } : undefined
});
```

### Tratamento de Erros
```typescript
try {
  // ... código
} catch (error) {
  console.error('Erro ao buscar dados do dashboard:', error);
  return NextResponse.json(
    { 
      erro: 'Erro ao processar requisição', 
      mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
      vendas: [],
      totalVendas: 0,
      totalValor: 0
    },
    { status: 500 }
  );
}
```

---

## ✅ 2. BetelTecnologiaService

### Arquivo Analisado
`app/_services/betelTecnologia.ts`

### Configuração da API
```typescript
private static get API_URL() {
  return process.env.GESTAO_CLICK_API_URL || 'https://api.beteltecnologia.com';
}

private static get ACCESS_TOKEN() {
  return process.env.GESTAO_CLICK_ACCESS_TOKEN || '';
}

private static get SECRET_TOKEN() {
  return process.env.GESTAO_CLICK_SECRET_ACCESS_TOKEN || '';
}

private static getHeaders() {
  return {
    'Content-Type': 'application/json',
    'access-token': this.ACCESS_TOKEN,
    'secret-access-token': this.SECRET_TOKEN,
  };
}
```

### Padrão de Retry
```typescript
private static async fetchWithRetry<T>(
  url: string, 
  options = {}, 
  maxRetries = 2
): Promise<{ data: T | null; error: string | null }> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Se não for a primeira tentativa, aguardar tempo exponencial
      if (attempt > 0) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Tentativa ${attempt} falhou, aguardando ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Verificar credenciais antes de fazer qualquer chamada
      const credenciais = this.verificarCredenciais();
      if (!credenciais.valido) {
        throw new Error(credenciais.mensagem);
      }
      
      const response = await fetch(`${this.API_URL}${url}`, {
        ...options,
        headers: this.getHeaders()
      });
      
      // Tratar erros de autenticação
      if (response.status === 401) {
        console.error(`Erro de autenticação (401) ao acessar ${url}`);
        throw new Error('Erro de autenticação: credenciais inválidas ou expiradas');
      }
      
      // Tratar outros erros HTTP
      if (!response.ok) {
        throw new Error(`Erro na API externa: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data, error: null };
      
    } catch (error) {
      lastError = error;
      console.error(`Erro na tentativa ${attempt} de acesso à API externa:`, error);
      
      // Se for erro de credenciais, não faz sentido tentar novamente
      if (error instanceof Error && 
          (error.message.includes('Token') || error.message.includes('credenciais'))) {
        break;
      }
    }
  }
  
  return { 
    data: null, 
    error: lastError instanceof Error ? lastError.message : String(lastError) 
  };
}
```

### Buscar Vendas (Método Correto)
```typescript
static async buscarVendas(params: {
  dataInicio: Date;
  dataFim: Date;
}): Promise<{
  vendas: BetelVenda[];
  totalVendas: number;
  totalValor: number;
  erro?: string;
}> {
  try {
    console.log('Iniciando busca de vendas com parâmetros:', params);
    
    // Formatar datas para o formato que a API espera
    const dataInicio = format(params.dataInicio, 'yyyy-MM-dd');
    const dataFim = format(params.dataFim, 'yyyy-MM-dd');
    
    console.log('Datas formatadas para busca:', { dataInicio, dataFim });
    
    // Buscar vendas diretamente
    return await this.buscarVendasPadrao(dataInicio, dataFim);
  } catch (error) {
    console.error('Erro na busca de vendas:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      vendas: [],
      totalVendas: 0,
      totalValor: 0,
      erro: errorMessage
    };
  }
}
```

### Buscar Vendas por Loja (Evitar Duplicação)
```typescript
private static async buscarVendasPadrao(dataInicio: string, dataFim: string) {
  // Primeiro, buscar a lista de lojas disponíveis
  const lojasResult = await this.fetchWithRetry<{data: Array<{id: string, nome: string}>}>(`/lojas`);
  
  const lojas = lojasResult.data?.data || [];
  console.log(`Encontradas ${lojas.length} lojas:`, lojas.map(l => `${l.nome} (${l.id})`));
  
  // Buscar vendas de todas as lojas individualmente
  let todasVendas: BetelVenda[] = [];
  
  for (const loja of lojas) {
    console.log(`Buscando vendas da loja ${loja.nome} (${loja.id})...`);
    
    let paginaAtual = 1;
    let temMaisPaginas = true;
    let vendasDaLoja: BetelVenda[] = [];
    
    while (temMaisPaginas) {
      // Buscar página atual da loja específica
      const urlVendas = `/vendas?data_inicio=${dataInicio}&data_fim=${dataFim}&loja_id=${loja.id}&page=${paginaAtual}&limit=500`;
      const vendasResult = await this.fetchWithRetry<{data: BetelVenda[], meta?: any}>(urlVendas);
      
      if (vendasResult.error) {
        console.warn(`Erro ao buscar vendas da loja ${loja.nome}: ${vendasResult.error}`);
        break;
      }
      
      const vendasData = vendasResult.data;
      if (!vendasData || !vendasData.data || !Array.isArray(vendasData.data)) {
        console.warn(`Formato de resposta inválido da loja ${loja.nome}`);
        break;
      }
      
      console.log(`Loja ${loja.nome} - Página ${paginaAtual}: ${vendasData.data.length} vendas`);
      
      vendasDaLoja = [...vendasDaLoja, ...vendasData.data];
      
      // Verificar se há mais páginas
      if (vendasData.meta) {
        const { proxima_pagina, total_paginas } = vendasData.meta;
        if (proxima_pagina && paginaAtual < total_paginas) {
          paginaAtual++;
        } else {
          temMaisPaginas = false;
        }
      } else {
        temMaisPaginas = false;
      }
      
      // Proteção contra loop infinito
      if (paginaAtual > 20) {
        console.warn(`Proteção contra loop infinito ativada para loja ${loja.nome}`);
        break;
      }
    }
    
    console.log(`Total de vendas da loja ${loja.nome}: ${vendasDaLoja.length}`);
    todasVendas = [...todasVendas, ...vendasDaLoja];
  }
  
  // Filtrar apenas vendas "Concretizada" e "Em andamento"
  const vendasFiltradas = todasVendas.filter((venda: BetelVenda) => 
    venda.nome_situacao === "Concretizada" || venda.nome_situacao === "Em andamento"
  );
  
  console.log(`Vendas filtradas: ${vendasFiltradas.length}`);
  
  // Calcular totais
  const totalVendas = vendasFiltradas.length;
  const totalValor = parseFloat(vendasFiltradas.reduce((acc: number, venda: BetelVenda) => {
    const valorVenda = parseFloat(venda.valor_total || '0');
    return acc + valorVenda;
  }, 0).toFixed(2));
  
  return {
    vendas: vendasFiltradas,
    totalVendas,
    totalValor
  };
}
```

### Processamento de Descontos
```typescript
// Calcular desconto real (valor + porcentagem)
let descontoReal = 0;
const descontoValor = parseFloat(venda.desconto_valor || '0');
const descontoPercentual = parseFloat(venda.desconto_porcentagem || '0');
const valorProdutos = parseFloat(venda.valor_produtos || venda.valor_total || '0');

// Desconto em valor fixo
if (descontoValor > 0) {
  descontoReal += descontoValor;
}

// Desconto em porcentagem
if (descontoPercentual > 0) {
  const descontoPorcentagem = (valorProdutos * descontoPercentual) / 100;
  descontoReal += descontoPorcentagem;
}

// Se não há desconto explícito, calcular pela diferença
if (descontoReal === 0 && valorProdutos > 0) {
  const valorTotal = parseFloat(venda.valor_total || '0');
  if (valorProdutos > valorTotal) {
    descontoReal = valorProdutos - valorTotal;
  }
}
```

---

## 📋 PADRÕES IDENTIFICADOS PARA REPLICAR NO CEO

### ✅ 1. Autenticação e Permissões
- Sempre validar permissões antes de processar
- Retornar erro 403 se não autorizado

### ✅ 2. Formato de Datas
- **Entrada:** Aceitar ISO string ou Date
- **Processamento:** Converter para `YYYY-MM-DD`
- **API:** Sempre usar `YYYY-MM-DD`

### ✅ 3. Busca de Vendas
- Buscar por loja individual para evitar duplicação
- Usar paginação (`page` e `limit`)
- Filtrar por status válidos: "Concretizada", "Em andamento"
- Filtrar por período exato (data da venda)

### ✅ 4. Cálculos Numéricos
- Usar `parseValueSafe()` para valores
- Usar `roundToCents()` para arredondamento
- Usar `sumWithPrecision()` para somas

### ✅ 5. Estrutura de Resposta
- Incluir dados principais
- Incluir totais calculados
- Incluir metadados de debug (opcional)
- Incluir informações de erro quando aplicável

### ✅ 6. Tratamento de Erros
- Try-catch em todo método público
- Log detalhado de erros
- Retornar estrutura padrão com erro
- Nunca retornar erro 500 sem informação

### ✅ 7. Cache
- Usar para dados auxiliares (formas pagamento, centros custo)
- TTL adequado para cada tipo de dado
- Limpar cache expirado periodicamente

### ✅ 8. Logs
- Log de início de operação
- Log de parâmetros (sem dados sensíveis)
- Log de sucesso com contagens
- Log de erro com contexto

---

## 🚫 O QUE EVITAR

### ❌ 1. Dados Mock/Fake
```typescript
// ❌ NÃO FAZER
const vendasMock = Array.from({ length: 50 }, () => ({ ... }));

// ✅ FAZER
const vendas = await CEOGestaoClickService.getVendas(dataInicio, dataFim);
if (vendas.length === 0) {
  return { erro: 'Nenhuma venda encontrada no período' };
}
```

### ❌ 2. Assumir Estrutura de Campos
```typescript
// ❌ NÃO FAZER
const categoria = produto.categoria || 'Categoria Padrão';
const margem = 0.25; // Assumir margem de 25%

// ✅ FAZER
const categoria = produto.nome_grupo || 'Não categorizado';
const custoItem = parseValueSafe(item.valor_custo); // Usar valor real
```

### ❌ 3. Duplicação de Serviços
```typescript
// ❌ NÃO FAZER
class CEOBetelService {
  // Criar serviço duplicado em cada arquivo
}

// ✅ FAZER
import { CEOGestaoClickService } from '../_lib/gestao-click-service';
const vendas = await CEOGestaoClickService.getVendas(dataInicio, dataFim);
```

### ❌ 4. Fallback com Dados Inventados
```typescript
// ❌ NÃO FAZER
catch (error) {
  return {
    vendas: getDadosMockados(),
    _metadata: { dataSource: 'fallback' }
  };
}

// ✅ FAZER
catch (error) {
  console.error('Erro ao buscar vendas:', error);
  return {
    vendas: [],
    erro: error.message,
    _metadata: { dataSource: 'error', error: error.message }
  };
}
```

### ❌ 5. Buscar Vendas com `todas_lojas=true`
```typescript
// ❌ NÃO FAZER (causa duplicação)
const vendas = await fetch(`/vendas?todas_lojas=true`);

// ✅ FAZER (buscar loja por loja)
const lojas = await fetch('/lojas');
for (const loja of lojas) {
  const vendasLoja = await fetch(`/vendas?loja_id=${loja.id}`);
  todasVendas.push(...vendasLoja);
}
```

---

## 🎯 CHECKLIST DE IMPLEMENTAÇÃO

Para cada API CEO (`sales-analysis`, `financial-analysis`, `advanced-metrics`, `operational-metrics`):

### Estrutura
- [ ] Importar `CEOGestaoClickService` centralizado
- [ ] Remover classe `CEOBetelService` duplicada
- [ ] Validar parâmetros `startDate` e `endDate`
- [ ] Formatar datas para `YYYY-MM-DD`

### Requisições
- [ ] Usar métodos do `CEOGestaoClickService`
- [ ] Buscar dados apenas de endpoints confirmados
- [ ] Tratar erros com try-catch
- [ ] Log estruturado de operações

### Processamento
- [ ] Usar funções de precisão numérica
- [ ] Filtrar por status válidos
- [ ] Filtrar por período exato
- [ ] Calcular totais corretamente

### Resposta
- [ ] Retornar dados reais (zero dados fake)
- [ ] Incluir metadados `_metadata`
- [ ] Retornar array vazio se sem dados (não erro 500)
- [ ] Incluir informação de erro quando aplicável

### Validação
- [ ] Testar com dados reais
- [ ] Comparar totais com Dashboard de Vendas
- [ ] Verificar se não há duplicação
- [ ] Confirmar que cálculos estão corretos



