# Dashboard de Vendas - Documentação da Refatoração

## Visão Geral
O Dashboard de Vendas foi completamente refatorado seguindo princípios SOLID e padrões de boas práticas em React. A refatoração permitiu:

1. Separar responsabilidades entre componentes visuais e lógica de negócios
2. Utilizar Custom Hooks para gerenciar dados e estado
3. Melhorar a manutenibilidade e testabilidade do código
4. Reduzir a duplicação de código
5. Facilitar futuras expansões

## Estrutura

```
app/(auth-routes)/dashboard/vendas/
├── components/              # Componentes visuais
│   ├── DateRangeSelector.tsx  # Componente de seleção de datas
│   ├── DashboardSummary.tsx   # Cartão de resumo do dashboard
│   ├── VendedoresChart.tsx    # Gráfico de faturamento por vendedor
│   ├── VendedoresTable.tsx    # Tabela de desempenho de vendedores
│   └── VendedoresPanel.tsx    # Contenedor dos componentes de vendedores
├── hooks/                   # Lógica de negócios e gerenciamento de estado
│   ├── useDateRange.ts        # Gerenciamento do intervalo de datas e sincronização com URL
│   └── useDashboardData.ts    # Busca, transformação e cache de dados
├── page.tsx                 # Componente principal que integra todos os elementos
└── README.md                # Esta documentação
```

## Principais Melhorias

### Separação de Responsabilidades
- **Componentes Visuais**: Focados apenas na renderização e interações com o usuário
- **Custom Hooks**: Encapsulam toda a lógica de busca, transformação e gerenciamento de dados

### Redução de Complexidade
- Componente original com mais de 570 linhas dividido em múltiplos componentes menores
- Lógica complexa isolada em hooks reutilizáveis

### Performance
- Uso adequado de `useMemo` para evitar renderizações desnecessárias
- Cache de dados implementado de forma mais estruturada
- Debounce para evitar múltiplas requisições durante mudanças rápidas de datas

### Manutenibilidade
- Componentes com responsabilidades únicas e bem definidas
- Tipos claros e interfaces bem documentadas
- Nomeação consistente e significativa

## Cálculo Correto de Lucro

### Implementação
- O lucro é calculado corretamente como **Faturamento Total - Custo Total - Descontos Totais**
- A implementação utiliza uma API dedicada (`/api/dashboard/custos`) que retorna:
  - `valorTotalFaturamento`: O faturamento total do período
  - `valorTotalCusto`: O custo total das vendas no período
  - `valorTotalDescontos`: O total de descontos aplicados no período
  - `valorTotalFretes`: O total de fretes no período (informativo)
  - `lucroTotal`: O lucro calculado (faturamento - custo - descontos)
  - `margemLucroPercentual`: A margem de lucro em percentual

### Fluxo de Dados
1. O endpoint `/api/dashboard/custos` obtém os dados de vendas do período via `BetelTecnologiaService`
2. O serviço `CalculoFinanceiroService` calcula o custo total, faturamento total, descontos totais e fretes totais
3. O lucro é calculado como Faturamento - Custo - Descontos
4. Esses valores são exibidos no componente `DashboardSummary`
5. Quando os dados de custo não estão disponíveis, o sistema exibe uma estimativa baseada na média do setor

### Tratamento de Descontos e Fretes
- **Descontos**: São detectados por:
  - Campo específico `desconto` na venda, quando disponível
  - Itens na venda com a palavra "desconto" no nome do produto
  - São deduzidos do faturamento para calcular o lucro real
- **Fretes**: São detectados por:
  - Campo específico `frete` na venda, quando disponível
  - Itens na venda com a palavra "frete" no nome do produto
  - São exibidos como informação adicional no card de lucro

### Fallbacks
- **Dados Reais**: O sistema prioriza o uso de dados reais de custo e descontos quando disponíveis nas vendas
- **Estimativa**: Caso não haja dados suficientes, o sistema utiliza uma estimativa de 40% de margem de lucro
- **Interface**: O componente indica claramente quando os valores são estimados vs. calculados com dados reais

## Como Expandir

### Adicionando Novos Gráficos ou Visualizações
1. Criar um novo componente na pasta `components/`
2. Importar e utilizar os dados necessários do hook `useDashboardData`
3. Adicionar o componente ao layout em `page.tsx`

### Modificando a Lógica de Negócios
- Toda a lógica de transformação de dados está centralizada em `useDashboardData.ts`
- Novas regras de negócio devem ser adicionadas neste hook ou em novos hooks específicos

## Considerações Futuras
- Implementar testes unitários para hooks e componentes
- Adicionar mais métricas e visualizações conforme necessário
- Considerar a implementação de filtros adicionais além das datas 
- Melhorar a coleta de dados de custo para aumentar a precisão do cálculo de lucro 

# Dashboard de Vendas - Otimizações

## Otimizações Realizadas na Tab "Ranking de Vendas"

Esta documentação descreve as otimizações implementadas para melhorar a performance e a experiência do usuário no Dashboard de Vendas, especificamente na tab "Ranking de Vendas".

### 1. Hooks Personalizados

Foram criados dois hooks personalizados para otimizar o carregamento e processamento de dados:

- **useVendedoresImagens**: 
  - Implementa carregamento paralelo de imagens utilizando `Promise.all`
  - Adiciona cache em memória para evitar requisições repetidas
  - Limita o número de imagens carregadas apenas ao necessário
  - Gerencia estados de carregamento e erros

- **useRankingVendedores**:
  - Utiliza `useMemo` para evitar recálculos desnecessários
  - Implementa ordenação eficiente de vendedores por diferentes critérios
  - Calcula valores derivados como totais e médias apenas quando necessário
  - Fornece dados pré-processados para os componentes

### 2. Componentização e Memoização

- Uso de `React.memo` para evitar renderizações desnecessárias
- Divisão de componentes grandes em subcomponentes menores e mais focados
- Componentes como `VendedorCard`, `CardHeader_Memo` e `CardFooter_Memo` são renderizados apenas quando seus props mudam

### 3. Carregamento Otimizado

- Implementação de `Suspense` para carregamento assíncrono de componentes menos críticos
- Uso de estados de carregamento mais granulares
- Animações progressivas para melhorar a percepção de performance

### 4. Redução de Requisições

- Carregamento de imagens em paralelo em vez de sequencial
- Reutilização de dados já carregados
- Implementação de dependências adequadas nos efeitos para evitar chamadas desnecessárias

### 5. Uso Eficiente da Árvore de Renderização

- Isolamento de partes dinâmicas em componentes separados
- Passagem apenas das props necessárias para cada componente
- Uso de `useMemo` para controlar quando componentes devem ser renderizados novamente

## Estrutura de Arquivos

O código foi reorganizado da seguinte forma:

- `/hooks/useVendedoresImagens.ts` - Hook para gerenciar imagens
- `/hooks/useRankingVendedores.ts` - Hook para ordenação e filtros
- `/components/PodiumRanking.tsx` - Componente otimizado para exibir o pódio
- `/components/RankingVendedoresPodium.tsx` - Container para ranking de vendedores

## Benefícios

- **Carregamento mais rápido**: Redução significativa no tempo de carregamento
- **Maior fluidez**: Menos travamentos durante a interação do usuário
- **Menor uso de recursos**: Redução na quantidade de dados transferidos pela rede
- **Melhor experiência de usuário**: Feedback visual melhorado durante carregamento
- **Código mais sustentável**: Melhor separação de responsabilidades e maior testabilidade 

## Otimizações de Responsividade e Material Design

Este dashboard foi refinado seguindo princípios do Material Design para melhor experiência em dispositivos móveis e diferentes tamanhos de tela. Abaixo estão as principais melhorias implementadas:

### Princípios Gerais Aplicados

1. **Sistema de Elevação Consistente**
   - Cards com sombras suaves (`shadow-sm`) para indicar elevação
   - Transições suaves ao passar o mouse (`hover:shadow-lg`)
   - Consistência visual em todos os componentes

2. **Paleta de Cores Refinada**
   - Uso de cores do Material Design com boa separação visual
   - Melhor contraste entre texto e fundo
   - Suporte completo a modo claro e escuro

3. **Tipografia Responsiva**
   - Tamanhos de fonte adaptáveis para diferentes dispositivos
   - Hierarquia clara de informação

4. **Espaçamento Consistente**
   - Grid responsivo com gap adaptativo
   - Margens e padding seguindo escala de 4px do Material Design

5. **Feedback Visual**
   - Estados de hover bem definidos
   - Indicadores visuais para ações

6. **Layout Fluido**
   - Reorganização de elementos em telas menores
   - Uso de Flexbox e Grid para layouts adaptáveis

### Componentes Refinados

#### DateRangeSelector
- Melhoria no design do seletor de datas
- Melhor visualização de opções em telas pequenas
- Adição de ícones para melhor compreensão visual

#### VendedoresTable
- Nova apresentação visual para o ranking
- Badges para destacar posições
- Layout responsivo para diferentes dispositivos
- Melhor visualização de dados em telas pequenas

#### VendedoresChart
- Cores adaptadas do Material Design
- Melhor legibilidade em diferentes tamanhos de tela
- Tooltips mais informativos
- Alternar entre visualizações de gráfico de barras e pizza

#### DashboardSummary
- Cards mais claros e informativos
- Melhor visualização de metas
- Indicadores de progresso visuais
- Layout adaptável

#### Página Principal
- Estrutura organizada com grid responsivo
- Tabs em estilo Material Design
- Componente de carregamento (skeleton) para melhor UX
- Cabeçalho adaptável

### Responsividade

O dashboard agora se adapta a diversos tamanhos de tela:
- **Dispositivos móveis**: Layout em coluna única, elementos empilhados
- **Tablets**: 2 colunas para cards principais
- **Desktop**: 4 colunas para cards principais, mais espaço para visualizações

### Acessibilidade

- Melhor contraste de cores
- Estrutura semântica adequada
- Estados focáveis para navegação por teclado
- Texto alternativo para elementos visuais

### Modo Escuro

Todos os componentes agora possuem suporte completo ao modo escuro, com:
- Cores de background ajustadas
- Contraste de texto apropriado
- Cores de elementos gráficos adaptadas

## Uso dos Componentes

Consulte os arquivos individuais para detalhes de implementação. Todos os componentes seguem uma estrutura consistente e utilizam os mesmos princípios de design.

## Performance

Os componentes foram otimizados para melhor performance:
- Memoização de componentes (React.memo)
- Uso de useMemo para valores calculados
- Carregamento assíncrono (lazy loading) para componentes pesados
- Skeleton loaders para melhor percepção de carregamento 