# Componentes do Dashboard de Vendas

Este diretório contém os componentes utilizados no dashboard de vendas da aplicação Conta Rápida.

## PodiumRanking

O componente `PodiumRanking` foi desenvolvido para exibir um pódio visual dos top 3 vendedores, baseado em diferentes critérios de ordenação (faturamento, quantidade de vendas ou ticket médio).

### Características

- Exibe os três primeiros vendedores em um pódio visual com medalhas
- As medalhas são posicionadas acima das fotos dos vendedores, evitando sobreposições
- Utiliza imagens personalizadas de medalhas para primeiro, segundo e terceiro lugar
- Animações suaves de entrada para cada vendedor no pódio
- Exibição de informações relevantes: nome, valor conforme critério de ordenação e percentual do total
- Design responsivo e compatível com temas claro e escuro

### Uso

O componente pode ser usado em múltiplas partes da aplicação:

```tsx
import PodiumRanking from "./PodiumRanking";

// No seu componente:
<PodiumRanking 
  vendedores={vendedoresOrdenados}
  ordenacao="faturamento" // "faturamento" | "vendas" | "ticket"
  onVendedorClick={(vendedor) => handleClick(vendedor)}
/>
```

#### No Dashboard de Vendas

O componente é utilizado na visualização de pódio do `RankingVendedores` para exibir os três melhores vendedores com métricas de desempenho.

#### No Gerenciamento de Vendedores

Também é utilizado na página de Gerenciamento de Vendedores através do componente `RankingVendedoresPodium`, que adiciona controles para alternar entre diferentes critérios de ordenação.

### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `vendedores` | `Vendedor[]` | Array de vendedores a serem exibidos no pódio |
| `ordenacao` | `"faturamento" \| "vendas" \| "ticket"` | Critério de ordenação (opcional, padrão: "faturamento") |
| `onVendedorClick` | `(vendedor: Vendedor) => void` | Função callback quando um vendedor é clicado (opcional) |

### Recursos

- Utiliza imagens de medalhas personalizadas localizadas em `/public/images/podium/`
- Integração com o `VendedorImagensService` para buscar e exibir fotos dos vendedores
- Animações progressivas para melhor experiência visual

## RankingVendedores

Componente principal que exibe o ranking de vendedores em diferentes visualizações (pódio, lista ou cards).

## VendedoresTable

Tabela que exibe os vendedores com suas métricas de performance.

## ProdutosMaisVendidos

Exibe os produtos mais vendidos no período selecionado.

## DateRangeSelector

Componente de seleção de intervalo de datas para filtrar os dados do dashboard. 