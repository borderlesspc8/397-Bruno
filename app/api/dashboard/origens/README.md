# API de Origens por Unidade

Esta API fornece dados sobre as origens de vendas por unidade (como os clientes conheceram a empresa), agrupados por unidade/loja.

## Endpoint

```
GET /api/dashboard/origens
```

## Parâmetros de consulta

| Parâmetro   | Tipo   | Descrição                              | Obrigatório |
|-------------|--------|----------------------------------------|-------------|
| dataInicio  | string | Data inicial no formato YYYY-MM-DD     | Sim         |
| dataFim     | string | Data final no formato YYYY-MM-DD       | Sim         |

## Autenticação

Esta API requer autenticação via NextAuth. O usuário deve estar autenticado para acessar os dados.

## Resposta

A resposta é retornada no formato JSON com a seguinte estrutura:

```json
{
  "dashboard": {
    "origemLeadsPorUnidade": [
      {
        "id": "todos",          // Primeiro item é sempre a visão consolidada
        "nome": "Todas as Unidades",
        "origens": [
          {
            "origem": "string",     // Nome da origem (ex: "Presencial", "Instagram", etc.)
            "quantidade": number,   // Quantidade de vendas com esta origem
            "percentual": number    // Percentual em relação ao total da unidade (0-1)
          }
        ],
        "total": number         // Total de vendas de todas as unidades
      },
      {
        "id": "string",         // ID da unidade/loja
        "nome": "string",       // Nome da unidade/loja
        "origens": [
          {
            "origem": "string",     // Nome da origem (ex: "Presencial", "Instagram", etc.)
            "quantidade": number,   // Quantidade de vendas com esta origem
            "percentual": number    // Percentual em relação ao total da unidade (0-1)
          }
        ],
        "total": number         // Total de vendas da unidade
      }
    ]
  }
}
```

## Exemplo de uso

```javascript
const fetchOrigensData = async (dataInicio, dataFim) => {
  const response = await fetch(
    `/api/dashboard/origens?dataInicio=${dataInicio}&dataFim=${dataFim}`
  );
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar dados: ${response.status}`);
  }
  
  return await response.json();
};
```

## Erros

A API pode retornar os seguintes erros:

| Código | Descrição                                    |
|--------|----------------------------------------------|
| 400    | Parâmetros dataInicio e dataFim são obrigatórios |
| 401    | Usuário não autenticado                      |
| 500    | Erro ao processar dados                      |

## Considerações técnicas

- Os dados são obtidos a partir da API de vendas interna (`/api/dashboard/vendas`)
- As origens são extraídas do atributo "Como nos conheceu" em cada venda
- O primeiro item na lista de unidades é sempre a visão consolidada "Todas as Unidades"
- Os resultados são agrupados por unidade/loja e ordenados por total de vendas (do maior para o menor)
- Dentro de cada unidade, as origens são ordenadas por quantidade (da maior para a menor) 