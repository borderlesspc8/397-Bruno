# ContaRápida

Sistema de gestão financeira para controle e análise de finanças pessoais e empresariais, com dashboard e integrações para controle de vendas.

## Funcionalidades

- Controle de receitas e despesas
- Planejamento orçamentário
- Metas financeiras
- Análise e relatórios
- Dashboard interativo
- Categorização automática
- Importação de extratos
- Gestão multi-carteira
- Lembretes de pagamento
- Dashboard de vendas com dados da API Gestão Click
- Ranking de vendedores e análise de produtos

## Documentação

Toda a documentação do projeto foi organizada para facilitar o acesso às informações. Consulte nosso [índice de documentação](./docs/indice.md) para navegar pelos seguintes tópicos:

- Documentação principal do sistema
- Módulos (Fluxo de Caixa, DRE, Metas, Orçamentos, etc.)
- Arquitetura do sistema
- Integrações (Gestão Click, Centros de Custo, etc.)
- Funcionalidades (Autenticação, Email, Modo Demo, etc.)
- Diretrizes de desenvolvimento
- Relatórios técnicos

## Tecnologias Utilizadas

- Next.js 14
- TypeScript
- Prisma ORM
- PostgreSQL
- NextAuth.js
- TailwindCSS
- Lucide Icons
- Chart.js
- react-hook-form
- Zod
- ShadcnUI

## Instalação e Configuração

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/contarapida.git
cd contarapida
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas configurações, incluindo as credenciais da API Gestão Click:
```bash
GESTAO_CLICK_API_URL=https://api.beteltecnologia.com
GESTAO_CLICK_ACCESS_TOKEN=seu-token-aqui
GESTAO_CLICK_SECRET_ACCESS_TOKEN=seu-token-secreto-aqui
```

5. Execute as migrações do banco de dados:
```bash
npx prisma migrate dev
```

6. Popule o banco de dados com dados iniciais do sistema:
```bash
npm run seed:system
```

7. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Modo de Demonstração

O ContaRápida possui um modo de demonstração com dados mockados para facilitar testes e apresentações.

### Utilizando o Modo Demo

Para iniciar o sistema no modo de demonstração:

```bash
npm run dev:demo
```

Este comando configura automaticamente o ambiente, carrega os dados de demonstração e inicia o servidor.

### Acessando com Usuário Demo

- **URL**: http://localhost:3000
- **Email**: demo@acceleracrm.com.br
- **Senha**: 123456

Para mais informações sobre o modo de demonstração, consulte [nossa documentação](./docs/DEMO_MODE.md).

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Constrói a aplicação para produção
- `npm run start` - Inicia a aplicação em modo de produção
- `npm run dev:demo` - Inicia a aplicação em modo de demonstração
- `npm run toggle-demo` - Alterna entre modo normal e demonstração
- `npm run seed:system` - Popula o banco com dados essenciais do sistema
- `npm run seed:demo` - Popula o banco com dados de demonstração

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Contato

Para qualquer dúvida ou sugestão, entre em contato pelo email: contato@acceleracrm.com.br

## Integração com Banco do Brasil

A integração com a API do Banco do Brasil foi implementada seguindo as especificações oficiais disponíveis no Portal do Desenvolvedor do BB. Principais características:

### Autenticação

- **Padrão OAuth 2.0**: Implementamos o fluxo Client Credentials conforme RFC 6749
- **Ambientes**: 
  - Homologação: https://oauth.bb.com.br
  - Produção: https://oauth.bb.com.br
- **Segurança**: Suporte a autenticação mútua de certificados (mTLS)
- **Renovação de token**: Gerenciamento automático de expiração e renovação de tokens

### API de Extratos

- **Endpoints**:
  - Homologação: https://api.hm.bb.com.br/financas/v1
  - Produção: https://api.bb.com.br/financas/v1
- **Recursos**:
  - Obtenção de extratos com suporte a filtros e paginação
  - Formatação automática de datas e números de conta
  - Mapeamento de transações para o formato interno
  
## Integração com Gestão Click (Betel Tecnologia)

A integração com o sistema Gestão Click permite visualizar dados de vendas, produtos e vendedores diretamente no ContaRápida.

### Recursos Implementados

- **Dashboard de Vendas**: Visualização completa de indicadores de vendas com comparativo entre períodos
- **Ranking de Vendedores**: Exibição dos vendedores com melhor performance, ordenados por faturamento
- **Produtos Mais Vendidos**: Análise dos produtos com maior volume de vendas e faturamento
- **Filtro por Período**: Seleção flexível de datas para análise dos dados
- **Cálculo de Lucro**: Estimativa automática de lucro baseada no faturamento (59,5% de custo)
- **Detalhes do Vendedor**: Visualização detalhada do desempenho de cada vendedor
- **Detalhes da Venda**: Acesso aos dados completos de cada venda realizada

### API Gestão Click

A integração utiliza os seguintes endpoints da API Gestão Click:

- `/vendas` - Obtém dados de vendas com filtros de data e loja
- `/lojas` - Lista todas as lojas disponíveis (matriz e filiais)
- `/produtos` - Recupera o catálogo de produtos

### Configuração da API

Para configurar a integração, adicione as seguintes variáveis ao seu arquivo `.env`:

```bash
GESTAO_CLICK_API_URL=https://api.beteltecnologia.com
GESTAO_CLICK_ACCESS_TOKEN=seu-token-aqui
GESTAO_CLICK_SECRET_ACCESS_TOKEN=seu-token-secreto-aqui
```

### Implementação Técnica

- **Cache Inteligente**: Implementação de cache para reduzir chamadas à API externa
- **Tratamento de Erros**: Sistema robusto para lidar com falhas na API
- **Agrupamento de Dados**: Consolidação de dados de vendas de todas as lojas
- **Identificação de Lojas**: Utilização do parâmetro `loja_id` para diferenciar vendas por estabelecimento
- **Diagnóstico**: Logs detalhados para facilitar a identificação de problemas

## Melhorias Recentes (Maio 2025)

### Dashboard de Vendas

- **Correção do Cálculo de Lucro**: Ajustado o percentual de custo de 60% para 59,5% para refletir corretamente o lucro esperado
- **Otimização da Consulta de Vendedores**: Melhorada a performance da listagem de vendedores
- **Remoção de Código Legacy**: Eliminado código que forçava a inserção de vendedores fixos na listagem
- **Unificação de "Como nos Conheceu" e "Distribuição de Vendas"**: Implementado um componente integrado que combina informações de origens de contato com os produtos vendidos para cada canal, eliminando a necessidade de autenticação para visualização dos dados.

### Nova API de Origens com Produtos

Foi criada uma nova API unificada para fornecer dados estatísticos sobre como os clientes conheceram a empresa e quais produtos foram adquiridos em cada canal:

- **Endpoint**: `/api/dashboard/origens-produtos`
- **Parâmetros**: `dataInicio` e `dataFim` (no formato YYYY-MM-DD)
- **Funcionalidades**:
  - Extração de dados de origem diretamente das vendas, sem necessidade de autenticação adicional
  - Agrupamento de produtos por canal de origem
  - Cálculo de métricas como quantidade de vendas, valor total e percentuais
  - Ordenação de resultados por relevância

### Componente "Como nos Conheceu & Produtos"

Novo componente visual que apresenta dados consolidados sobre origens de clientes e produtos:

- **Visualizações**:
  - Gráfico de pizza para distribuição de origens
  - Gráfico de barras para comparação entre canais
  - Tabela detalhada com métricas por origem
  - Lista expandível de produtos por canal de origem
- **Recursos interativos**:
  - Alternância entre visualização por quantidade ou valor (R$)
  - Expansão/contração de detalhes por origem
  - Animações suaves para transições entre visualizações
  - Tooltip com informações detalhadas nos gráficos
  - Exibição dos 5 produtos mais vendidos por origem

### Interface do Usuário

- **Componentes Responsivos**: Melhorada a experiência em dispositivos móveis
- **Dark Mode**: Suporte completo para tema escuro em todos os componentes
- **Acessibilidade**: Implementadas melhorias de acessibilidade seguindo WCAG

### Performance

- **Otimização de Cache**: Implementado sistema de cache mais eficiente
- **Redução de Bundle Size**: Otimizado carregamento de scripts e estilos
- **Lazy Loading**: Componentes carregados sob demanda para melhor performance inicial

## Scripts de Build

A aplicação possui diferentes scripts de build para atender a diferentes necessidades:

- `npm run build`: Script padrão de build do Next.js
- `npm run build:safe`: Build ignorando erros de linting
- `npm run build:dynamic`: Build com geração estática desativada
- `npm run build:skip-errors`: **RECOMENDADO** Build que ignora erros de pré-renderização

### Solução para Erros de Pré-renderização

A aplicação pode apresentar erros durante o build relacionados à pré-renderização das páginas de erro 404 e 500. Estes erros ocorrem devido a conflitos entre o componente `<Html>` importado fora do contexto apropriado.

Para contornar esse problema, foi implementado um script personalizado (`scripts/build-skip-errors.js`) que:

1. Executa o processo de build com as configurações apropriadas
2. Captura e filtra mensagens de erro relacionadas à pré-renderização
3. Permite que o build seja concluído com sucesso, ignorando apenas os erros específicos de pré-renderização
4. Gera um marcador de build bem-sucedido para deploy

**Uso recomendado:**

```bash
npm run build:skip-errors
```

Este script é especialmente útil em ambientes de CI/CD, onde erros no build podem interromper o pipeline de deploy.

# Atualização no Cálculo de Lucro

Foi implementada uma correção no algoritmo de cálculo de lucro na plataforma.

## O que mudou?

1. **Uso apenas de dados reais**: O sistema agora usa apenas os valores de custo reais disponíveis nas vendas e itens, em vez de estimar custos com um percentual fixo (60%) quando a informação não está disponível.

2. **Criação de um módulo utilitário**: Foi criado um módulo dedicado `calculoFinanceiro.ts` com funções para:
   - Calcular lucro a partir de vendas
   - Converter valores para números de forma segura
   - Calcular variações percentuais

3. **Transparência nos dados**: A função de cálculo de lucro agora retorna informações detalhadas, incluindo:
   - Quantas vendas tinham informação de custo
   - Qual a margem de lucro calculada
   - Qual o total de faturamento considerado no cálculo

## Como Utilizar

Para calcular o lucro em qualquer parte da aplicação:

```typescript
import { calcularLucroVendas } from "@/app/_utils/calculoFinanceiro";

// Buscar vendas da API
const vendasResult = await BetelTecnologiaService.buscarVendas({
  dataInicio,
  dataFim
});

// Calcular lucro
const resultado = calcularLucroVendas(vendasResult.vendas);

// Verificar se há dados suficientes
if (resultado.temDadosSuficientes) {
  console.log(`Lucro: R$ ${resultado.lucro}`);
  console.log(`Margem: ${resultado.margemLucro}%`);
}
```

## Comportamento com Dados Ausentes

Quando uma venda não possui informação de custo (nem na venda nem em seus itens), ela é excluída do cálculo de lucro, em vez de usar uma estimativa que poderia distorcer o resultado.

Se nenhuma venda no período tiver informação de custo, o sistema indica que não há dados suficientes para calcular o lucro.
