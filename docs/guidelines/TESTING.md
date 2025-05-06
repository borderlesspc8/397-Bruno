# Guia de Testes do Conta Rápida

Este documento descreve a estratégia de testes implementada no projeto Conta Rápida, fornecendo orientações sobre como executar, escrever e manter os testes.

## Estrutura de Testes

Nossa estrutura de testes é organizada em três níveis principais:

```
/tests
  /unit               # Testes unitários
  /integration        # Testes de integração
  /e2e                # Testes de ponta a ponta (end-to-end)
  /fixtures           # Dados de teste
  /helpers            # Funções auxiliares para testes
  jest.setup.js       # Configuração do Jest
  __mocks__           # Mocks globais
```

Além disso, os testes podem ser escritos em arquivos `*.test.ts` ou `*.test.tsx` ao lado dos próprios componentes.

## Tipos de Testes

### 1. Testes Unitários

Testam componentes, funções e classes isoladamente. Encontram-se em `/tests/unit` ou junto aos arquivos que testam.

**Padrão de nomenclatura**: `ComponenteName.test.tsx` ou `serviceName.test.ts`

**Exemplos**:
- Testes de componentes React
- Testes de utilidades e funções auxiliares
- Testes de serviços isolados

### 2. Testes de Integração

Testam como diferentes partes do sistema interagem entre si. Encontram-se em `/tests/integration`.

**Padrão de nomenclatura**: `feature.test.ts`

**Exemplos**:
- Testes de APIs
- Testes de serviços que interagem com banco de dados
- Testes de hooks e contextos

### 3. Testes E2E (End-to-End)

Testam fluxos completos da aplicação, simulando a interação do usuário. Encontram-se em `/tests/e2e`.

**Padrão de nomenclatura**: `feature.e2e.ts`

**Exemplos**:
- Fluxo de autenticação
- Criação e edição de transações
- Navegação entre páginas

## Ferramentas de Teste

- **Jest**: Framework de testes principal
- **React Testing Library**: Testes de componentes React
- **MSW (Mock Service Worker)**: Interceptação e simulação de requisições
- **Playwright**: Testes E2E automatizados

## Como Executar os Testes

```bash
# Executar todos os testes
npm test

# Executar testes no modo watch (desenvolvimento)
npm run test:watch

# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de integração
npm run test:integration

# Executar testes E2E
npm run test:e2e

# Gerar relatório de cobertura
npm run test:coverage
```

## Práticas Recomendadas

### Para Testes Unitários

1. **Teste comportamentos, não implementações**
   - Foque em testar o comportamento externo e resultados esperados
   - Evite testar detalhes de implementação que podem mudar

2. **Use mocks com moderação**
   - Mock apenas dependências externas que não fazem parte do que está sendo testado
   - Prefira stubs e spies em vez de mocks completos quando possível

3. **Mantenha os testes isolados**
   - Cada teste deve ser independente
   - Evite dependências entre testes

### Para Testes de Integração

1. **Configure o ambiente corretamente**
   - Use `beforeEach` e `afterEach` para configurar e limpar o ambiente
   - Mock APIs externas com MSW

2. **Teste cenários completos**
   - Teste fluxos de sucesso e de erro
   - Verifique efeitos colaterais esperados

### Para Testes E2E

1. **Teste os fluxos principais**
   - Foque nos caminhos críticos da aplicação
   - Evite testar cada pequeno detalhe

2. **Use dados de teste controlados**
   - Prefira criar dados no início do teste
   - Limpe os dados após os testes

## Cobertura de Código

Estabelecemos uma meta de cobertura de código de pelo menos 70% para o projeto. O relatório de cobertura pode ser gerado com `npm run test:coverage`.

Prioridades para cobertura:
1. Serviços de negócios críticos
2. Componentes compartilhados e reutilizáveis
3. Lógica complexa e processamento de dados
4. APIs e endpoints

## Testes de Fluxos Críticos

### Autenticação
- Login de usuário
- Registro de nova conta
- Recuperação de senha
- Verificação de autenticação em rotas protegidas

### Transações Financeiras
- Criação de transações
- Edição de transações
- Exclusão de transações
- Categorização
- Reconciliação de transações

### Carteiras
- Criação de carteiras
- Cálculo de saldo
- Conexão com APIs bancárias
- Sincronização de dados

### Notificações e Alertas
- Recebimento de notificações
- Configurações de preferências
- Alertas para limites excedidos

## Mocks e Fixtures

Utilize os mocks e fixtures disponíveis em:
- `/tests/fixtures`: Dados de teste reutilizáveis
- `/tests/__mocks__`: Mocks globais

Para adicionar novos mocks, siga o padrão existente e documente a finalidade.

## CI/CD

Os testes são executados automaticamente em nosso pipeline de CI/CD em cada pull request e merge para a branch principal.

## Solução de Problemas

### Testes Falhos

Se os testes estiverem falhando localmente:

1. Certifique-se de que todas as dependências estão instaladas: `npm install`
2. Limpe o cache do Jest: `npx jest --clearCache`
3. Execute apenas o teste específico: `npm test -- -t "nome do teste"`

### Ambiente de Teste

Para problemas com o ambiente de teste:

1. Verifique se as variáveis de ambiente estão configuradas corretamente
2. Para testes E2E, certifique-se de que o servidor local está em execução
3. Verifique se o banco de dados de teste está configurado corretamente

## Contribuindo com Novos Testes

Ao implementar uma nova funcionalidade:

1. Adicione testes unitários para componentes e serviços
2. Adicione testes de integração para APIs e interações entre serviços
3. Adicione ou atualize testes E2E para fluxos de usuário afetados

## Recursos Adicionais

- [Documentação do Jest](https://jestjs.io/docs/getting-started)
- [Documentação do React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Documentação do Playwright](https://playwright.dev/docs/intro)
- [Guia de Melhores Práticas de Teste](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) 