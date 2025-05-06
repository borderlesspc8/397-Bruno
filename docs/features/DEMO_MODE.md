# Modo de Demonstração do ContaRápida

Este documento descreve o modo de demonstração do ContaRápida, que permite executar a aplicação com dados mockados pré-definidos.

## Sobre o Modo de Demonstração

O modo de demonstração foi desenvolvido para:

- **Testes rápidos**: Permite testar rapidamente todas as funcionalidades sem precisar configurar ou cadastrar dados
- **Demonstração para clientes**: Facilita apresentar a aplicação para potenciais clientes
- **Desenvolvimento**: Ajuda desenvolvedores a testar novas funcionalidades com dados consistentes
- **Treinamento**: Utilizado para treinamento de novos usuários

## Dados Pré-configurados

Quando o modo de demonstração está ativo, o sistema é populado com:

- **Usuário**: `demo@acceleracrm.com.br` (senha: `123456`)
- **Carteiras**: 
  - Conta Corrente (Banco do Brasil)
  - Cartão de Crédito (Nubank)
  - Poupança (Caixa)
  - Investimentos (Itaú)
- **Categorias**: Alimentação, Transporte, Moradia, Salário, Investimentos, Lazer, Saúde, Educação
- **Transações**: Histórico de 3 meses de transações recorrentes e aleatórias
- **Metas financeiras**: 3 metas pré-configuradas com contribuições
- **Orçamentos**: Orçamento mensal com categorias

## Como Utilizar

### Ativando o Modo de Demonstração

Existem duas formas de ativar o modo de demonstração:

1. **Script de alternância**:
   ```bash
   npm run toggle-demo
   ```
   Este comando exibe um menu interativo que permite ativar ou desativar o modo de demonstração.

2. **Diretamente no arquivo .env**:
   ```
   DEMO_MODE=true
   ```

### Iniciando a Aplicação em Modo Demo

Para executar a aplicação com o modo de demonstração já ativado e dados carregados:

```bash
npm run dev:demo
```

Este comando:
1. Ativa o modo de demonstração no arquivo .env
2. Verifica se os dados de demonstração já existem
3. Carrega os dados de demonstração se necessário (executa o seed)
4. Inicia o servidor de desenvolvimento

### Acessando a Aplicação em Modo Demo

Após iniciar a aplicação em modo demo, você pode acessar:

- **URL**: http://localhost:3000
- **Credenciais**:
  - Email: demo@acceleracrm.com.br
  - Senha: 123456

## Desenvolvimento e Extensão

### Estrutura de Arquivos

- `app/_lib/config.ts` - Contém as configurações e detecção do modo de demonstração
- `prisma/seed-demo.js` - Script que popula o banco de dados com dados mockados
- `scripts/toggle-demo-mode.js` - Script para alternar entre modo normal e demo
- `scripts/run-demo.js` - Script para executar a aplicação em modo demo
- `app/components/DemoBanner.tsx` - Componente visual que indica quando o modo demo está ativo

### Extendendo os Dados Mockados

Para adicionar ou modificar os dados de demonstração, edite o arquivo `prisma/seed-demo.js` seguindo o padrão existente.

## Considerações de Segurança

O modo de demonstração:

- **Não deve ser usado em produção** - É destinado apenas para ambientes de desenvolvimento e demonstração
- **Utiliza credenciais conhecidas** - O usuário e senha de demonstração são públicos e não seguros
- **Dados são resetáveis** - Você pode regenerar todos os dados a qualquer momento executando `npm run seed:demo`

## Desativando o Modo de Demonstração

Para desativar o modo de demonstração:

1. Execute `npm run toggle-demo` e selecione a opção para desativar
2. Ou edite manualmente o arquivo `.env` e defina `DEMO_MODE=false` 