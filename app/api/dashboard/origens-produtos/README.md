# API de Origens e Produtos

Esta API fornece informações consolidadas sobre canais de origem dos clientes e os produtos adquiridos através de cada canal no período especificado.

## Endpoint

```
GET /api/dashboard/origens-produtos
```

## Parâmetros

| Parâmetro   | Tipo   | Obrigatório | Descrição                                                    |
|-------------|--------|------------|--------------------------------------------------------------|
| dataInicio  | string | Sim        | Data inicial no formato YYYY-MM-DD ou DD/MM/YYYY             |
| dataFim     | string | Sim        | Data final no formato YYYY-MM-DD ou DD/MM/YYYY               |
| tipoLoja    | string | Não        | Filtro por tipo de loja: "todas" (padrão), "Personal Prime MATRI" ou "Filial Golden" |
| debug       | boolean| Não        | Se definido como "true", exibe informações adicionais no console |

## Estrutura de Resposta

```json
{
  "origens": [
    {
      "origem": "Nome do canal de origem",
      "quantidade": 10,
      "percentual": 0.25,
      "valorTotal": 12500.50,
      "produtos": [
        {
          "id": "12345",
          "nome": "Nome do produto",
          "quantidade": 5,
          "valor": 2500.50,
          "percentualQuantidade": 0.5
        }
      ],
      "produtosUnicos": 20,
      "totalUnidades": 100
    }
  ],
  "totalVendas": 40,
  "dataInicio": "2023-01-01",
  "dataFim": "2023-01-31",
  "tipoLoja": "todas"
}
```

## Campos da Resposta

### Objeto Raiz
- `origens`: Array de objetos contendo dados de cada canal de origem
- `totalVendas`: Número total de vendas no período
- `dataInicio`: Data inicial formatada
- `dataFim`: Data final formatada
- `tipoLoja`: Tipo de loja filtrado ("todas", "Personal Prime MATRI" ou "Filial Golden")

### Objeto Origem
- `origem`: Nome do canal de origem (Como nos conheceu)
- `quantidade`: Número de vendas para este canal
- `percentual`: Percentual de vendas deste canal em relação ao total
- `valorTotal`: Valor total de vendas deste canal em reais
- `produtos`: Array de produtos vendidos neste canal
- `produtosUnicos`: Número de produtos únicos vendidos neste canal
- `totalUnidades`: Número total de unidades vendidas neste canal

### Objeto Produto
- `id`: Identificador único do produto
- `nome`: Nome do produto
- `quantidade`: Quantidade vendida
- `valor`: Valor total do produto (quantidade × valor unitário)
- `percentualQuantidade`: Percentual da quantidade deste produto em relação ao total da origem

## Exemplos de Uso

### Requisição para todas as lojas
```
GET /api/dashboard/origens-produtos?dataInicio=2023-05-01&dataFim=2023-05-31
```

### Requisição apenas para a matriz
```
GET /api/dashboard/origens-produtos?dataInicio=2023-05-01&dataFim=2023-05-31&tipoLoja=Personal%20Prime%20MATRI
```

### Requisição apenas para a filial
```
GET /api/dashboard/origens-produtos?dataInicio=2023-05-01&dataFim=2023-05-31&tipoLoja=Filial%20Golden
```

## Implementação

A API consulta dados de vendas do serviço BetelTecnologia e processa os resultados para:

1. Filtrar vendas com status válidos ("Concretizada", "Em andamento")
2. Filtrar por tipo de loja ("Personal Prime MATRI", "Filial Golden" ou todas)
3. Agrupar vendas por canal de origem ("Como nos conheceu")
4. Processar os produtos de cada venda
5. Calcular totais e percentuais
6. Ordenar resultados por quantidade de vendas (decrescente)

## Tratamento de Erros

- 400: Parâmetros inválidos (datas ausentes ou formato inválido)
- 500: Erro interno ao processar os dados

## Notas Adicionais

- A API normaliza os dados de produtos de diferentes fontes
- Valores são processados para assegurar consistência no formato numérico
- Os dados são ordenados para facilitar a visualização
- A identificação das lojas é baseada no campo "nome_loja" de cada venda 