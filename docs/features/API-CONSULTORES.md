# API de Consultores Personal Prime

Este documento descreve as APIs disponíveis para obter dados e métricas dos consultores Personal Prime.

## Endpoints Disponíveis

### 1. Indicadores Gerais de Consultores

**Endpoint:** `/api/dashboard/consultores`

**Método:** GET

**Parâmetros:**
- `dataInicio` - Data de início do período (formato: YYYY-MM-DD)
- `dataFim` - Data de fim do período (formato: YYYY-MM-DD)
- `consultorId` - ID do consultor específico (opcional)

**Resposta:**
```json
{
  "consultores": [
    {
      "id": "CONS-1000",
      "nome": "Ana Silva",
      "atendimentosRealizados": 85,
      "vendasRealizadas": 32,
      "taxaConversao": 0.376,
      "faturamento": 123500,
      "ticketMedio": 3859.38,
      "tempoMedioFechamento": 5,
      "followUpsRealizados": 178,
      "tempoMedioResposta": 15,
      "quantidadeProdutosVendidos": 48,
      "produtosMaiorMargem": [
        { "id": "PROD-101", "nome": "Produto Premium 1", "quantidade": 5, "margem": 12500 },
        // ... outros produtos
      ],
      "categoriasMaisVendidas": [
        { "categoria": "Eletrônicos", "quantidade": 15, "percentual": 0.31 },
        // ... outras categorias
      ],
      "giroProdutos": 75,
      "metaMensal": 100000,
      "metaRealizado": 123.5,
      "bonificacaoEstimada": 6175,
      "clientesRecompra": 12,
      "taxaAbandono": 0.15,
      "inadimplencia": 3500,
      "formasPagamento": [
        { "forma": "Cartão de Crédito", "quantidade": 20, "valor": 78500, "percentual": 0.64 },
        // ... outras formas
      ],
      "descontosAplicados": 4300,
      "origensLeadsMaisEficientes": [
        { "origem": "Instagram", "quantidade": 45, "conversao": 0.35, "percentual": 0.53 },
        // ... outras origens
      ],
      "variacaoMesAnterior": 0.12,
      "variacaoAnoAnterior": 0.25,
      "posicaoRanking": 1
    },
    // ... outros consultores
  ],
  "periodoInicio": "2023-01-01",
  "periodoFim": "2023-12-31",
  "totalConsultores": 5
}
```

### 2. Histórico de Vendas dos Consultores

**Endpoint:** `/api/dashboard/consultores/historico`

**Método:** GET

**Parâmetros:**
- `dataInicio` - Data de início do período (formato: YYYY-MM-DD)
- `dataFim` - Data de fim do período (formato: YYYY-MM-DD)
- `consultorId` - ID do consultor específico (opcional)
- `tipoPeriodo` - Tipo de agrupamento do período ("diario", "semanal", "mensal") - padrão: "mensal"

**Resposta:**
```json
{
  "historico": [
    {
      "periodo": "Janeiro 2023",
      "data": "2023-01-01",
      "consultores": [
        {
          "id": "CONS-1000",
          "nome": "Ana Silva",
          "vendas": 25,
          "faturamento": 98500,
          "atendimentos": 68,
          "conversao": 0.37
        },
        // ... outros consultores
      ]
    },
    // ... outros períodos
  ],
  "comparativo": {
    "atual": {
      "inicio": "2023-01-01",
      "fim": "2023-01-31",
      "faturamentoTotal": 385000,
      "vendasTotal": 95
    },
    "anterior": {
      "inicio": "2022-12-01",
      "fim": "2022-12-31",
      "faturamentoTotal": 350000,
      "vendasTotal": 88
    },
    "variacao": {
      "faturamento": 0.1,
      "vendas": 0.08
    },
    "porConsultor": [
      {
        "id": "CONS-1000",
        "nome": "Ana Silva",
        "atual": {
          "faturamento": 98500,
          "vendas": 25
        },
        "anterior": {
          "faturamento": 92000,
          "vendas": 23
        },
        "variacao": {
          "faturamento": 0.07,
          "vendas": 0.09
        }
      },
      // ... outros consultores
    ]
  }
}
```

### 3. Produtos Vendidos pelos Consultores

**Endpoint:** `/api/dashboard/consultores/produtos`

**Método:** GET

**Parâmetros:**
- `dataInicio` - Data de início do período (formato: YYYY-MM-DD)
- `dataFim` - Data de fim do período (formato: YYYY-MM-DD)
- `consultorId` - ID do consultor específico (opcional)

**Resposta:**
```json
{
  "consultores": [
    {
      "id": "CONS-1000",
      "nome": "Ana Silva",
      "totalProdutosVendidos": 48,
      "faturamentoTotal": 123500,
      "custoTotal": 68000,
      "margemTotal": 55500,
      "margemMediaPercentual": 0.45,
      "produtos": [
        {
          "id": "PROD-101",
          "nome": "Notebook Ultra",
          "categoria": "Eletrônicos",
          "preco": 5500,
          "custo": 3700,
          "margem": 9000,
          "margemPercentual": 0.33,
          "quantidade": 5,
          "totalVendido": 27500
        },
        // ... outros produtos
      ]
    },
    // ... outros consultores
  ],
  "categorias": [
    {
      "categoria": "Eletrônicos",
      "quantidade": 35,
      "percentual": 0.38,
      "faturamento": 155000,
      "margem": 58000,
      "giro": 80
    },
    // ... outras categorias
  ],
  "periodoInicio": "2023-01-01",
  "periodoFim": "2023-12-31"
}
```

### 4. Clientes dos Consultores

**Endpoint:** `/api/dashboard/consultores/clientes`

**Método:** GET

**Parâmetros:**
- `dataInicio` - Data de início do período (formato: YYYY-MM-DD)
- `dataFim` - Data de fim do período (formato: YYYY-MM-DD)
- `consultorId` - ID do consultor específico (opcional)

**Resposta:**
```json
{
  "consultores": [
    {
      "id": "CONS-1000",
      "nome": "Ana Silva",
      "totalClientes": 35,
      "clientesAtivos": 28,
      "taxaRetencao": 0.8,
      "clientesInadimplentes": 3,
      "taxaInadimplencia": 0.09,
      "valorInadimplencia": 3500,
      "clientesRecompra": 12,
      "taxaRecompra": 0.34,
      "clientes": [
        {
          "id": "CLI-1001",
          "nome": "Cliente 1001",
          "email": "cliente1001@email.com",
          "telefone": "(11) 98765-4321",
          "dataUltimaCompra": "2023-01-15",
          "dataUltimoContato": "2023-01-20",
          "statusAtual": "Ativo",
          "valorCompras": 5500,
          "comprasRealizadas": 2,
          "ticketMedio": 2750,
          "inadimplencia": 0,
          "formasPagamentoUtilizadas": ["Cartão de Crédito", "PIX"],
          "produtos": [
            {
              "id": "PROD-101",
              "nome": "Notebook Ultra",
              "categoria": "Eletrônicos",
              "dataCompra": "2023-01-15",
              "valor": 3500,
              "desconto": 350,
              "statusPagamento": "Pago"
            },
            // ... outros produtos
          ]
        },
        // ... outros clientes
      ]
    },
    // ... outros consultores
  ],
  "segmentacao": [
    {
      "segmento": "VIP",
      "quantidade": 25,
      "percentual": 0.18,
      "valorTotal": 125000,
      "descricao": "Clientes com alto valor de compra e frequência"
    },
    // ... outros segmentos
  ],
  "periodoInicio": "2023-01-01",
  "periodoFim": "2023-12-31"
}
```

## Exemplos de Uso

### Obter todos os indicadores de um consultor específico

```javascript
const fetchConsultorData = async (consultorId) => {
  try {
    const response = await fetch(`/api/dashboard/consultores?consultorId=${consultorId}`);
    const data = await response.json();
    return data.consultores[0]; // Retorna o primeiro consultor (deve ser único pelo ID)
  } catch (error) {
    console.error('Erro ao buscar dados do consultor:', error);
    return null;
  }
};
```

### Obter histórico de vendas por período

```javascript
const fetchHistoricoVendas = async (dataInicio, dataFim, tipoPeriodo = 'mensal') => {
  try {
    const response = await fetch(
      `/api/dashboard/consultores/historico?dataInicio=${dataInicio}&dataFim=${dataFim}&tipoPeriodo=${tipoPeriodo}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar histórico de vendas:', error);
    return null;
  }
};
```

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Parâmetros inválidos ou ausentes |
| 404 | Consultor não encontrado |
| 500 | Erro interno do servidor |

## Considerações sobre Integração

Estas APIs foram projetadas para se integrar com o sistema Gestão Click. Em um ambiente de produção, as funções que atualmente geram dados mockados devem ser substituídas por chamadas ao sistema real, mantendo o mesmo formato de resposta para garantir compatibilidade com o frontend.

Para integrar com o Gestão Click, será necessário:

1. Autenticação apropriada
2. Mapeamento dos campos do Gestão Click para os campos definidos nestas APIs
3. Tratamento adequado de erros e exceções
4. Cache de dados quando apropriado para melhorar performance

## Notas de Implementação

- Todos os valores monetários são representados em centavos (sem casas decimais)
- Todos os percentuais são representados em decimal (ex: 0.25 = 25%)
- As datas devem ser fornecidas no formato ISO (YYYY-MM-DD)
- A bonificação estimada é calculada com base nas regras de negócio específicas para cada consultor 

## Componentes do Frontend

### 1. ConsultoresOverview

Componente principal que exibe uma visão geral dos indicadores de performance dos consultores. Inclui:
- Indicadores básicos de vendas e conversão
- Métricas de eficiência e tempo
- Metas e performance
- Variações de desempenho

### 2. HistoricoVendas

Exibe o histórico de vendas dos consultores com:
- Comparativo entre períodos
- Evolução temporal das vendas
- Análise por consultor
- Filtros por período (diário, semanal, mensal)

### 3. ProdutosVendidos

Apresenta análise detalhada dos produtos vendidos:
- Análise por categoria de produtos
- Desempenho por consultor
- Margens e faturamento
- Giro de produtos

### 4. ClientesConsultores

Mostra informações sobre a base de clientes:
- Segmentação de clientes
- Métricas de retenção
- Detalhamento por consultor
- Status e histórico de compras

### Utilização dos Componentes

```typescript
// Exemplo de uso dos componentes
import { ConsultoresOverview } from "./components/ConsultoresOverview";
import { HistoricoVendas } from "./components/HistoricoVendas";
import { ProdutosVendidos } from "./components/ProdutosVendidos";
import { ClientesConsultores } from "./components/ClientesConsultores";

// Props comuns para todos os componentes
interface DashboardProps {
  dateRange: { from: Date; to: Date };
  consultorId?: string | null;
  onConsultorChange: (consultorId: string | null) => void;
}

// Exemplo de implementação
function ConsultoresDashboard() {
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 1),
    to: new Date()
  });
  const [consultorId, setConsultorId] = useState<string | null>(null);

  return (
    <Tabs defaultValue="overview">
      <TabsContent value="overview">
        <ConsultoresOverview 
          dateRange={dateRange}
          consultorId={consultorId}
          onConsultorChange={setConsultorId}
        />
      </TabsContent>
      
      <TabsContent value="historico">
        <HistoricoVendas 
          dateRange={dateRange}
          consultorId={consultorId}
          onConsultorChange={setConsultorId}
        />
      </TabsContent>
      
      <TabsContent value="produtos">
        <ProdutosVendidos 
          dateRange={dateRange}
          consultorId={consultorId}
          onConsultorChange={setConsultorId}
        />
      </TabsContent>
      
      <TabsContent value="clientes">
        <ClientesConsultores 
          dateRange={dateRange}
          consultorId={consultorId}
          onConsultorChange={setConsultorId}
        />
      </TabsContent>
    </Tabs>
  );
}
```

### Estados de Carregamento

Todos os componentes incluem estados de carregamento (loading states) utilizando o componente `Skeleton` para melhorar a experiência do usuário durante o carregamento dos dados.

### Tratamento de Erros

Os componentes implementam tratamento de erros consistente, exibindo mensagens amigáveis quando ocorrem problemas na obtenção dos dados.

### Responsividade

O layout é totalmente responsivo, adaptando-se a diferentes tamanhos de tela:
- Layout em grid para telas maiores
- Layout em coluna única para dispositivos móveis
- Scroll areas para conteúdo extenso
- Cards redimensionáveis

### Acessibilidade

Os componentes seguem as melhores práticas de acessibilidade:
- Uso de elementos semânticos
- Labels e descrições adequadas
- Suporte a navegação por teclado
- Contraste de cores apropriado 