# 📚 Guia de Uso: Dados Auxiliares CEO Dashboard

## 🎯 Visão Geral

O sistema de **Dados Auxiliares** fornece acesso centralizado e otimizado a todos os dados de suporte da API Betel, incluindo:

- ✅ **Centros de Custo** - Para análises financeiras e operacionais
- ✅ **Formas de Pagamento** - Para análises de recebimentos
- ✅ **Categorias de Produtos** - Para análises de vendas por categoria
- ✅ **Produtos** - Para análises detalhadas de produtos
- ✅ **Clientes** - Para análises de segmentação e comportamento
- ✅ **Vendedores** - Para análises de performance de vendedores
- ✅ **Lojas** - Para análises multi-loja
- ✅ **Canais de Venda** - Para análises por canal

## 🚀 Como Usar

### 1️⃣ Usando o Hook React (Recomendado)

```typescript
import { useAuxiliaryData, useCentrosCusto, useFormasPagamento } from '../hooks/useAuxiliaryData';

function MeuComponente() {
  // Buscar TODOS os dados auxiliares
  const { data, isLoading, isError, error, refetch } = useAuxiliaryData();

  // OU buscar dados específicos
  const { centrosCusto, isLoading: loadingCentros } = useCentrosCusto();
  const { formasPagamento, isLoading: loadingFormas } = useFormasPagamento();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <div>
      <h2>Centros de Custo: {data?.centrosCusto?.length || 0}</h2>
      <h2>Formas de Pagamento: {data?.formasPagamento?.length || 0}</h2>
      <button onClick={refetch}>Atualizar</button>
    </div>
  );
}
```

### 2️⃣ Usando Dados Agrupados

```typescript
import { useDadosAgrupados } from '../hooks/useAuxiliaryData';

function AnaliseAgrupada() {
  const { 
    centrosCustoAgrupados,
    formasPagamentoAgrupadas,
    categoriasAgrupadas,
    clientesSegmentados,
    isLoading 
  } = useDadosAgrupados();

  return (
    <div>
      <h3>Centros de Custo por Tipo:</h3>
      {centrosCustoAgrupados.map(grupo => (
        <div key={grupo.id}>
          <strong>{grupo.nome}</strong> ({grupo.totalSubCentros} centros)
          <ul>
            {grupo.subCentros.map(centro => (
              <li key={centro.id}>{centro.nome}</li>
            ))}
          </ul>
        </div>
      ))}
      
      <h3>Clientes por Segmento:</h3>
      {clientesSegmentados.map(segmento => (
        <div key={segmento.id}>
          <strong>{segmento.nome}</strong>: {segmento.totalClientes} clientes
          <p>{segmento.descricao}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3️⃣ Chamada Direta à API

```typescript
async function buscarDadosAuxiliares() {
  try {
    // Buscar todos os dados
    const response = await fetch('/api/ceo/auxiliary-data?type=all');
    const data = await response.json();
    
    // OU buscar dados específicos
    const centros = await fetch('/api/ceo/auxiliary-data?type=centros');
    const formas = await fetch('/api/ceo/auxiliary-data?type=formas&grouped=true');
    
    console.log('Dados auxiliares:', data);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
  }
}
```

## 📋 Tipos de Dados Disponíveis

### Centros de Custo

```typescript
interface BetelCentroCusto {
  id: number;
  nome: string;
  descricao?: string;
  codigo?: string;
  ativo?: boolean;
  tipo?: string;
  categoria?: string;
}

// Agrupado
interface CEOCentroCustoAgrupado {
  id: string;
  nome: string;
  tipo: 'operacional' | 'administrativo' | 'comercial' | 'financeiro' | 'outros';
  subCentros: BetelCentroCusto[];
  totalSubCentros: number;
}
```

### Formas de Pagamento

```typescript
interface BetelFormaPagamento {
  id: number;
  nome_forma_pagamento: string;
  tipo_pagamento?: string;
  ativo?: boolean;
  taxa?: number;
  prazo?: number;
}

// Agrupado
interface CEOFormaPagamentoAgrupada {
  id: string;
  nome: string;
  tipo: 'credito' | 'debito' | 'pix' | 'boleto' | 'dinheiro' | 'outros';
  formas: BetelFormaPagamento[];
  totalFormas: number;
  taxaMedia?: number;
}
```

### Categorias

```typescript
interface BetelCategoria {
  id: number;
  nome: string;
  descricao?: string;
  categoria_pai_id?: number;
  nivel?: number;
  ativo?: boolean;
}

// Agrupado
interface CEOCategoriaAgrupada {
  id: string;
  nome: string;
  nivel: number;
  subCategorias: BetelCategoria[];
  totalSubCategorias: number;
  totalProdutos: number;
}
```

### Clientes

```typescript
interface BetelCliente {
  id: number;
  nome: string;
  cpf_cnpj?: string;
  email?: string;
  data_cadastro: string;
  ultima_compra?: string;
  total_compras?: number;
  status?: string;
  tipo?: 'PF' | 'PJ';
}

// Segmentado
interface CEOClienteSegmento {
  id: string;
  nome: string;
  tipo: 'vip' | 'recorrente' | 'eventual' | 'inativo' | 'novo';
  descricao: string;
  clientes: BetelCliente[];
  totalClientes: number;
  ticketMedioGeral: number;
}
```

## ⚙️ Configurações Avançadas

### Cache e Refresh

```typescript
// Forçar refresh (ignorar cache)
const { data, refetch } = useAuxiliaryData({ 
  forceRefresh: true 
});

// Auto-refresh a cada 5 minutos
const { data } = useAuxiliaryData({ 
  refetchInterval: 5 * 60 * 1000 
});

// Limpar cache manualmente
const { clearCache } = useAuxiliaryData();
await clearCache();
```

### Desabilitar Carregamento

```typescript
// Não carregar automaticamente
const { data, refetch } = useAuxiliaryData({ 
  enabled: false 
});

// Carregar manualmente quando necessário
await refetch();
```

## 🔍 Endpoints da API

### GET /api/ceo/auxiliary-data

Parâmetros:
- `type` - Tipo de dados: `all`, `centros`, `formas`, `categorias`, `produtos`, `clientes`, `vendedores`, `lojas`, `canais`, `grouped`
- `grouped` - Retornar dados agrupados: `true` | `false`
- `forceRefresh` - Forçar refresh do cache: `true` | `false`

Exemplos:
```bash
# Todos os dados
GET /api/ceo/auxiliary-data?type=all

# Centros de custo agrupados
GET /api/ceo/auxiliary-data?type=centros&grouped=true

# Formas de pagamento com refresh forçado
GET /api/ceo/auxiliary-data?type=formas&forceRefresh=true

# Todos os dados agrupados
GET /api/ceo/auxiliary-data?type=grouped&grouped=true
```

### DELETE /api/ceo/auxiliary-data

Limpar cache:
```bash
# Limpar todo cache
DELETE /api/ceo/auxiliary-data

# Limpar cache de tipo específico
DELETE /api/ceo/auxiliary-data?pattern=centros
```

## 🎨 Exemplo Completo: Componente de Análise

```typescript
'use client';

import { useCentrosCusto, useFormasPagamento, useClientes } from '../hooks/useAuxiliaryData';
import { Card } from '@/components/ui/card';

export function AnaliseCompleta() {
  const { 
    centrosCustoAgrupados, 
    isLoading: loadingCentros 
  } = useCentrosCusto(true);
  
  const { 
    formasPagamentoAgrupadas, 
    isLoading: loadingFormas 
  } = useFormasPagamento(true);
  
  const { 
    clientesSegmentados, 
    isLoading: loadingClientes,
    isFallback 
  } = useClientes(true);

  const isLoading = loadingCentros || loadingFormas || loadingClientes;

  if (isLoading) {
    return <LoadingSpinner message="Carregando dados auxiliares..." />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Centros de Custo */}
      <Card>
        <h3>Centros de Custo</h3>
        {centrosCustoAgrupados.map(grupo => (
          <div key={grupo.id} className="mb-2">
            <strong>{grupo.nome}</strong>
            <span className="text-muted-foreground ml-2">
              ({grupo.totalSubCentros})
            </span>
          </div>
        ))}
      </Card>

      {/* Formas de Pagamento */}
      <Card>
        <h3>Formas de Pagamento</h3>
        {formasPagamentoAgrupadas.map(grupo => (
          <div key={grupo.id} className="mb-2">
            <strong>{grupo.nome}</strong>
            <span className="text-muted-foreground ml-2">
              ({grupo.totalFormas})
            </span>
            {grupo.taxaMedia && (
              <span className="text-xs ml-2">
                Taxa: {grupo.taxaMedia.toFixed(2)}%
              </span>
            )}
          </div>
        ))}
      </Card>

      {/* Segmentos de Clientes */}
      <Card>
        <h3>Segmentos de Clientes</h3>
        {isFallback && (
          <div className="text-yellow-600 text-sm mb-2">
            ⚠️ Usando dados de fallback
          </div>
        )}
        {clientesSegmentados.map(segmento => (
          <div key={segmento.id} className="mb-2">
            <strong>{segmento.nome}</strong>
            <span className="text-muted-foreground ml-2">
              ({segmento.totalClientes} clientes)
            </span>
            <p className="text-xs text-muted-foreground">
              {segmento.descricao}
            </p>
          </div>
        ))}
      </Card>
    </div>
  );
}
```

## ✅ Validação e Tratamento de Erros

O sistema inclui validação robusta de dados:

```typescript
import { CEODataValidator } from '../services/data-validation';

// Validar dados antes de usar
const vendaValida = CEODataValidator.validateVenda(venda);
const clienteValido = CEODataValidator.validateCliente(cliente);

// Sanitizar dados malformados
const vendaSanitizada = CEODataValidator.sanitizeVenda(vendaRaw);

// Validação em lote
const { valid, invalid, validationRate } = CEODataValidator.validateBatch(
  vendas,
  CEODataValidator.validateVenda,
  'vendas'
);
```

## 📊 Monitoramento e Estatísticas

```typescript
import { CEODataValidator } from '../services/data-validation';

// Obter estatísticas de validação
const stats = CEODataValidator.getValidationStats();
console.log('Estatísticas de validação:', stats);

// {
//   byType: {
//     vendas: { total: 1000, valid: 980, invalid: 20 },
//     clientes: { total: 500, valid: 500, invalid: 0 }
//   },
//   totalValidations: 15,
//   recentValidations: [...]
// }
```

## 🔒 Isolamento e Segurança

✅ **Completamente isolado** - Não afeta outras dashboards
✅ **Cache inteligente** - TTL dinâmico baseado no tipo de dados
✅ **Validação robusta** - Todos os dados são validados antes do uso
✅ **Fallbacks seguros** - Dados padrão em caso de erro
✅ **Retry automático** - Backoff exponencial para erros temporários

## 📝 Notas Importantes

1. **Cache**: Os dados são cached com TTL diferenciado:
   - Centros de Custo: 1 hora
   - Formas de Pagamento: 1 hora  
   - Categorias: 1 hora
   - Produtos: 30 minutos
   - Clientes: 15 minutos

2. **Validação**: Todos os dados passam por validação antes de serem retornados

3. **Fallback**: Em caso de erro na API, dados padrão são retornados

4. **Performance**: Use `grouped=true` para dados agregados quando possível

5. **Isolamento**: Este sistema é 100% isolado da Dashboard CEO

