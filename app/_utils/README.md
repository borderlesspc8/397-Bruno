# Utilitários da Aplicação Conta Rápida

Este diretório contém funções utilitárias reutilizáveis que são usadas em toda a aplicação Conta Rápida.

## Utilitários Disponíveis

### `venda-processor.ts`

Este utilitário centraliza o processamento de dados de vendas, fornecendo funções para normalizar e padronizar objetos de venda recebidos de diferentes fontes e APIs.

#### Interfaces

- `Pagamento`: Define a estrutura de um pagamento processado
- `Produto`: Define a estrutura de um produto processado
- `VendaProcessada`: Define a estrutura completa de uma venda após processamento

#### Funções Principais

- `converterParaNumero(valor, valorPadrao = 0)`: Converte qualquer tipo de valor para número, tratando diferentes formatos (string com separadores de milhares, valores com símbolos de moeda, etc.)

- `processarParaRenderizacao(obj)`: Processa um objeto para renderização segura, convertendo datas, objetos complexos e outros tipos para formatos adequados de visualização.

- `processarPagamentos(pagamentos, valorTotal = 0)`: Processa uma estrutura de pagamentos (array, objeto, ou string JSON) em um formato padronizado.

- `processarProdutos(produtos)`: Processa uma estrutura de produtos/itens (array, objeto, ou string JSON) em um formato padronizado.

- `processarVenda(venda)`: Função principal que processa uma venda completa, normalizando todos os campos e estruturas internas.

#### Uso

```tsx
import { processarVenda } from '@/app/_utils/venda-processor';

// Em um componente React:
const [vendaProcessada, setVendaProcessada] = useState(null);

useEffect(() => {
  // Dados recebidos de uma API ou fonte externa
  const dados = await fetchDadosVenda(id);
  
  // Processar os dados para um formato padronizado
  const vendaProcessada = processarVenda(dados);
  
  setVendaProcessada(vendaProcessada);
}, [id]);
```

#### Benefícios

- **Consistência**: Garante que os dados tenham o mesmo formato em toda a aplicação
- **Robustez**: Trata valores undefined, null e formatos inesperados
- **Segurança de tipos**: Utiliza TypeScript para definir estruturas claras de dados
- **Reutilização de código**: Evita duplicação de lógica de processamento entre componentes
- **Facilidade de manutenção**: Centraliza a lógica de processamento em um único lugar 