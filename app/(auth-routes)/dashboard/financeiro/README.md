# Dashboard Financeiro

Um dashboard completo para visualização e análise de dados financeiros, com gráficos interativos, métricas em tempo real e insights inteligentes.

## Funcionalidades

### 📊 Visão Geral
- **Widgets de métricas principais**: Saldo total, receitas, despesas e margem de lucro
- **Análise de gastos**: Indicador visual do percentual de despesas vs receitas
- **Gráfico de fluxo de caixa**: Visualização temporal das entradas e saídas
- **Categorias resumidas**: Gráficos de pizza para receitas e despesas

### 📈 Gráficos e Visualizações
- **ApexCharts**: Gráficos de linha e coluna para fluxo de caixa
- **Chart.js**: Gráficos de rosca (donut) para categorização
- **Responsividade**: Adaptação automática para mobile e desktop
- **Interatividade**: Tooltips, zoom, e navegação nos gráficos

### 🎯 Categorias
- **Receitas por categoria**: Análise detalhada das fontes de receita
- **Despesas por categoria**: Breakdown completo dos gastos
- **Tabelas detalhadas**: Listagem com valores e percentuais
- **Cores consistentes**: Sistema de cores para identificação visual

### 💡 Análises e Insights
- **Saúde financeira**: Indicadores de margem de lucro, burn rate e reservas
- **Diversificação**: Análise da distribuição entre carteiras
- **Recomendações automáticas**: Suggestions baseadas nos dados
- **Alertas inteligentes**: Notificações sobre situações que requerem atenção

## Estrutura de Arquivos

```
financeiro/
├── components/
│   ├── FinancialMetricsWidgets.tsx    # Widgets de métricas principais
│   ├── CashFlowChart.tsx              # Gráfico de fluxo de caixa
│   ├── CategoryCharts.tsx             # Gráficos de categorias
│   ├── TrendAnalysis.tsx              # Componente de análises
│   └── index.ts                       # Exportações
├── hooks/
│   └── useFinancialDashboard.ts       # Hook para dados financeiros
├── types/
│   └── index.ts                       # Definições de tipos TypeScript
└── page.tsx                           # Página principal
```

## Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes de UI
- **ApexCharts** - Gráficos avançados
- **Chart.js + react-chartjs-2** - Gráficos de pizza/donut
- **Lucide React** - Ícones
- **date-fns** - Manipulação de datas

## APIs Integradas

- `/api/cash-flow` - Dados de fluxo de caixa
- `/api/wallets` - Informações das carteiras
- `/api/dre` - Demonstrativo de resultados

## Recursos Implementados

### ✅ Widgets de Métricas
- [x] Card de saldo total com indicador de tendência
- [x] Card de receitas com comparação de período
- [x] Card de despesas com análise de crescimento
- [x] Card de margem de lucro
- [x] Barra de progresso para análise de gastos

### ✅ Gráficos
- [x] Gráfico combinado (colunas + linha) para fluxo de caixa
- [x] Gráficos de donut para categorias de receitas
- [x] Gráficos de donut para categorias de despesas
- [x] Responsividade completa
- [x] Tooltips personalizados
- [x] Legendas interativas

### ✅ Análises
- [x] Indicadores de saúde financeira
- [x] Análise de diversificação de carteiras
- [x] Sistema de recomendações
- [x] Alertas contextuais
- [x] Cálculo de reserva de emergência

### ✅ Interface
- [x] Sistema de abas para organização do conteúdo
- [x] Seletor de período com opções rápidas
- [x] Botões de atualização e exportação
- [x] Estados de loading e erro
- [x] Design responsivo

## Como Usar

1. **Navegação**: Use as abas para alternar entre diferentes visões
2. **Período**: Selecione o período desejado usando os botões rápidos ou o seletor de data
3. **Atualização**: Clique em "Atualizar" para recarregar os dados
4. **Exportação**: Use o botão "Exportar" para baixar relatórios (a implementar)

## Próximas Melhorias

- [ ] Exportação de relatórios em PDF/Excel
- [ ] Comparação entre períodos
- [ ] Previsões e projeções
- [ ] Filtros por carteira específica
- [ ] Histórico de tendências
- [ ] Metas e orçamentos
- [ ] Notificações em tempo real
- [ ] Integração com mais APIs financeiras

## Performance

- **Lazy Loading**: Gráficos carregados dinamicamente
- **Memoização**: Hooks otimizados para evitar re-renders desnecessários
- **Skeleton Loading**: Experiência de carregamento suave
- **Responsividade**: Adaptação automática para diferentes tamanhos de tela