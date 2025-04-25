# Documentação do Assistente Financeiro

## Visão Geral

O Assistente Financeiro é um componente da aplicação Conta Rápida que fornece análises e respostas personalizadas sobre a situação financeira do usuário consultando diretamente o banco de dados, sem depender de modelos de linguagem externos como o Groq.

## Arquitetura

O assistente financeiro é composto por duas partes principais:

1. **Frontend (chat-client.tsx)**: Responsável pela interface do usuário, processamento local das consultas e envio para a API.
2. **Backend (api/ai/chat/route.ts)**: Processa a consulta, acessa o banco de dados e gera uma resposta detalhada.

## Fluxo de Funcionamento

1. Usuário faz uma pergunta na interface do chat
2. Frontend processa a consulta localmente com `processQueryLocally`
3. Frontend envia a consulta processada para a API
4. Backend recupera dados financeiros do usuário através da função `getFinancialData`
5. Backend gera a resposta utilizando a função `generateDirectDatabaseResponse`
6. Resposta é devolvida ao frontend e exibida ao usuário

## Tipos de Consultas Suportadas

O assistente detecta a intenção do usuário e gera respostas especializadas para cada tipo de consulta:

| Intent | Descrição | Exemplo de Pergunta |
|--------|-----------|---------------------|
| reservaEmergencia | Análise de reserva financeira | "Quanto preciso guardar para ter uma reserva de emergência?" |
| gastosPorCategoria | Análise de gastos por categoria | "Quanto gastei com alimentação este mês?" |
| economizar/metas | Metas de economia e poupança | "Quanto preciso economizar por mês para juntar R$10.000?" |
| analiseDiaSemana | Análise de gastos por dia da semana | "Em qual dia da semana eu gasto mais?" |
| listarTransacoes | Listagem detalhada de transações | "Liste as transações de março de 2025" |
| generico | Consultas gerais sobre finanças | "Como estão minhas finanças?" |

## Detalhes Técnicos

### Processamento Local (Frontend)

A função `processQueryLocally` no frontend é responsável por:

- Detectar a intenção do usuário usando expressões regulares
- Extrair entidades relevantes (valores monetários, períodos, categorias)
- Estruturar dados financeiros para cálculos específicos
- Validar referências temporais para garantir que consultas futuras sejam identificadas

```typescript
const processQueryLocally = (
  query: string, 
  financialData?: FinancialSummary,
  referenceDate: Date = systemReferenceDate
): {
  intent: string;
  entities: Record<string, any>;
  structuredData: Record<string, any>;
  enhancedQuery: string;
}
```

### Geração de Respostas (Backend)

A função `generateDirectDatabaseResponse` no backend utiliza os dados financeiros do usuário e a consulta processada para gerar respostas específicas:

```typescript
async function generateDirectDatabaseResponse(
  query: {
    intent: string;
    entities: Record<string, any>;
    structuredData: Record<string, any>;
    enhancedQuery: string;
  },
  userData: Record<string, any>
): Promise<string>
```

Cada tipo de consulta possui uma função especializada para gerar a resposta:

- `gerarRespostaReservaEmergencia`: Calcula quanto o usuário precisa para uma reserva de emergência
- `gerarRespostaCategoriaGastos`: Analisa gastos por categoria específica ou todas as categorias
- `gerarRespostaMetasEconomia`: Calcula quanto o usuário precisa poupar para atingir uma meta
- `gerarRespostaDiaSemana`: Analisa em qual dia da semana o usuário gasta mais e em quais categorias
- `gerarRespostaListaTransacoes`: Lista transações detalhadas de um período específico
- `gerarRespostaGenerica`: Fornece uma visão geral das finanças do usuário

## Como Testar

### Usando a Interface do Chat

Basta realizar perguntas no chat, como:
- "Quanto preciso guardar para ter uma reserva de emergência?"
- "Em qual dia da semana eu gasto mais?"
- "Quanto gastei com alimentação este mês?"
- "Liste minhas transações de março de 2025"

### Usando Requisições de API Diretamente

Você pode testar a API diretamente usando `curl` ou ferramentas como Postman:

```bash
# Teste de reserva de emergência
curl -X POST http://localhost:3000/api/ai/chat -H "Content-Type: application/json" -d '{"messages": [{"role": "user", "content": "Quanto preciso guardar para ter uma reserva de emergência?"}], "month": 6, "processedQuery": {"intent": "reservaEmergencia", "entities": {"timePeriods": {"months": 6}}, "structuredData": {}, "enhancedQuery": "Quanto preciso guardar para ter uma reserva de emergência?"}}'

# Teste de listagem de transações
curl -X POST http://localhost:3000/api/ai/chat -H "Content-Type: application/json" -d '{"messages": [{"role": "user", "content": "Liste as transações de março de 2025"}], "month": 3, "processedQuery": {"intent": "listarTransacoes", "entities": {}, "structuredData": {}, "enhancedQuery": "Liste as transações de março de 2025"}}'
```

### Usando a Rota de Teste

Também existe uma rota de teste que usa dados simulados para testar o assistente:

```bash
# Teste de listagem de transações
curl -X POST http://localhost:3000/api/ai/test -H "Content-Type: application/json" -d '{"messages": [{"role": "user", "content": "Liste as transações de março de 2025"}], "includeFinancialData": true, "queryType": "listarTransacoes"}'
```

## Manutenção e Extensão

Para adicionar novos tipos de consultas:

1. Adicione um novo padrão regex na função `processQueryLocally` em `chat-client.tsx`
2. Implemente uma nova função de resposta em `app/api/ai/chat/route.ts`
3. Adicione a nova intent no switch da função `generateDirectDatabaseResponse`

## Vantagens da Abordagem Atual

- Independência de APIs externas de IA (não requer Groq ou outras APIs)
- Respostas rápidas e determinísticas
- Personalização completa das análises financeiras
- Controle total sobre a forma como os dados são processados e apresentados
- Menor custo operacional (sem custos de API de IA) 