# Componentes do Gestão Click

## VendaDetailModal

O componente `VendaDetailModal` exibe os detalhes de uma venda do Gestão Click em um modal, incluindo:

- Informações gerais da venda (data, cliente, status)
- Produtos incluídos na venda
- Serviços incluídos na venda
- Pagamentos associados à venda

### Melhorias Implementadas

#### 1. Processamento Robusto de Dados (Data: 15/05/2024)

- **Cálculo de Valor Total**: Implementado cálculo consistente de valor total para produtos e serviços
  - Verifica múltiplas propriedades possíveis: `valor_total`, `valorTotal`, `total`
  - Em caso de ausência de valor total, calcula com base em quantidade e valor unitário
  - Validação para garantir que apenas valores numéricos válidos sejam usados

- **Formatação de Valores**:
  - Melhoria na função `formatarValor` para lidar com diferentes formatos
  - Limpeza de caracteres não numéricos, mantendo apenas pontos e vírgulas
  - Tratamento adequado para valores nulos, undefined ou inválidos
  - Padronização da formatação monetária

- **Formatação de Datas**:
  - Suporte a múltiplos formatos de data (ISO, DD/MM/YYYY)
  - Validação de datas para garantir que apenas datas válidas sejam exibidas
  - Tratamento adequado para datas nulas, undefined ou inválidas

- **Cálculos de Totais**:
  - Implementação de cálculos robustos para totais de produtos, serviços e pagamentos
  - Verificação de valores não numéricos antes de incluí-los nas somas
  - Tratamento adequado para arrays vazios ou não definidos

### Tratamento de Dados

O componente foi projetado para lidar com diferentes formatos de dados que podem vir da API do Gestão Click:

- Estruturas aninhadas vs. objetos diretos (ex: `item.produto` vs. `item`)
- Diferentes nomenclaturas de propriedades (`valor_total` vs. `valorTotal`)
- Tipos de dados inconsistentes (strings vs. números)
- Dados ausentes ou incompletos

### Uso

```jsx
<VendaDetailModal
  vendaId={selectedVendaId}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
/>
```

Esta implementação garante uma exibição consistente e confiável dos dados da venda, mesmo quando a API retorna formatos variados ou incompletos. 