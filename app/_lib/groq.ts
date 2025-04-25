import { Groq } from "groq-sdk";

// Inicializar o cliente Groq
let groqClient: Groq | null = null;

export function getGroqClient() {
  // Se o cliente já foi inicializado, retorná-lo
  if (groqClient) return groqClient;

  // Verificar se a API key está definida
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY não está definida nas variáveis de ambiente");
    throw new Error("API key da Groq não configurada");
  }

  // Inicializar o cliente
  groqClient = new Groq({
    apiKey,
  });

  return groqClient;
}

// Função para gerar análise financeira
export async function generateFinancialAnalysis(data: {
  startDate: string;
  endDate: string;
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  topCategories: { category: string; amount: number; percentage: number }[];
  transactions: { description: string; amount: number; category: string; date: string }[];
}) {
  try {
    const client = getGroqClient();
    
    // Formatar os dados para enviar para a IA
    const prompt = `
    Como um assistente financeiro especializado, analise os seguintes dados financeiros e forneça insights úteis:

    Período: ${data.startDate} até ${data.endDate}
    Total de despesas: R$ ${data.totalExpenses.toFixed(2)}
    Total de receitas: R$ ${data.totalIncome.toFixed(2)}
    Saldo: R$ ${data.balance.toFixed(2)}

    Principais categorias de gastos:
    ${data.topCategories.map(cat => `- ${cat.category}: R$ ${cat.amount.toFixed(2)} (${cat.percentage}%)`).join('\n')}

    Últimas transações:
    ${data.transactions.slice(0, 10).map(t => 
      `- ${t.date}: "${t.description}" - R$ ${t.amount.toFixed(2)} (${t.category})`
    ).join('\n')}

    Por favor, forneça uma análise financeira completa abordando:
    1. Resumo geral do período
    2. Padrões identificados nos gastos 
    3. Categorias que merecem atenção
    4. Recomendações personalizadas para economizar
    5. Oportunidades de melhoria financeira

    Por favor, formatando a resposta em Markdown com títulos, subtítulos e listas para facilitar a leitura.
    `;

    const completion = await client.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: "Você é um consultor financeiro especializado em análise de dados financeiros pessoais. Você fornece análises concisas e úteis, destacando insights valiosos e recomendações práticas. Você sempre formata suas respostas em Markdown para facilitar a leitura."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1500
    });

    return completion.choices[0]?.message?.content || 
      "Não foi possível gerar uma análise para os dados fornecidos.";
    
  } catch (error) {
    console.error("Erro ao gerar análise financeira com Groq:", error);
    throw new Error("Falha ao gerar relatório de análise financeira");
  }
}

// NOVAS FUNÇÕES

// Função para sugerir categorizações automaticamente
export async function suggestCategories(transactions: { 
  id: string; 
  description: string; 
  amount: number; 
  date: string;
  currentCategory?: string;
}[], existingCategories: string[], userHistory: { description: string; category: string }[] = []) {
  try {
    const client = getGroqClient();

    // Criar um contexto com exemplos anteriores para o modelo aprender
    const historyContext = userHistory.length > 0 
      ? `Exemplos de categorizações anteriores do usuário:
        ${userHistory.map(h => `- "${h.description}" → ${h.category}`).join('\n')}` 
      : '';

    const prompt = `
    Como um assistente financeiro especializado, sugira categorias para as seguintes transações:

    Categorias existentes no sistema:
    ${existingCategories.join(', ')}

    ${historyContext}

    Transações para categorizar:
    ${transactions.map(t => 
      `ID: ${t.id} | Data: ${t.date} | Descrição: "${t.description}" | Valor: R$ ${Math.abs(t.amount).toFixed(2)} | ${t.amount < 0 ? 'Saída' : 'Entrada'} ${t.currentCategory ? `| Categoria atual: ${t.currentCategory}` : ''}`
    ).join('\n')}

    Para cada transação, retorne:
    1. ID da transação
    2. Categoria sugerida (use apenas categorias da lista fornecida)
    3. Confiança (baixa, média, alta)
    4. Razão para a sugestão (breve explicação)

    Formato de resposta JSON:
    [
      {
        "id": "id_da_transação",
        "suggestedCategory": "nome_da_categoria",
        "confidence": "alta|média|baixa",
        "reason": "Breve explicação da sugestão"
      },
      ...
    ]
    `;

    const completion = await client.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: "Você é um assistente de categorização financeira que analisa transações bancárias e sugere categorias apropriadas. Você retorna apenas JSON válido, sem texto adicional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const resultText = completion.choices[0]?.message?.content || '{"suggestions": []}';
    const result = JSON.parse(resultText);
    return result.suggestions || [];
    
  } catch (error) {
    console.error("Erro ao gerar sugestões de categorias com Groq:", error);
    throw new Error("Falha ao gerar sugestões de categorias");
  }
}

// Função para conciliação bancária assistida
export async function suggestReconciliation(bankTransactions: { 
  id: string; 
  description: string; 
  amount: number; 
  date: string;
}[], existingTransactions: {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}[]) {
  try {
    const client = getGroqClient();

    const prompt = `
    Como um assistente de conciliação bancária, ajude a identificar correspondências entre transações importadas e registradas:

    Transações importadas do banco:
    ${Array.isArray(bankTransactions) ? bankTransactions.map(t => 
      `ID: ${t.id} | Data: ${t.date} | Descrição: "${t.description}" | Valor: R$ ${Math.abs(t.amount).toFixed(2)} | ${t.amount < 0 ? 'Saída' : 'Entrada'}`
    ).join('\n') : 'Nenhuma transação importada.'}

    Transações já registradas no sistema:
    ${Array.isArray(existingTransactions) ? existingTransactions.map(t => 
      `ID: ${t.id} | Data: ${t.date} | Descrição: "${t.description}" | Valor: R$ ${Math.abs(t.amount).toFixed(2)} | ${t.amount < 0 ? 'Saída' : 'Entrada'} | Categoria: ${t.category}`
    ).join('\n') : 'Nenhuma transação registrada.'}

    Para cada transação importada, indique:
    1. Se ela corresponde a alguma transação existente (possível duplicata)
    2. ID da transação existente correspondente, se houver
    3. Nível de confiança na correspondência (baixa, média, alta)
    4. Se não houver correspondência, indique "nova transação"

    Formato de resposta JSON:
    {
      "matches": [
        {
          "importedId": "id_da_transação_importada",
          "existingId": "id_da_transação_existente_ou_null",
          "isMatch": true/false,
          "confidence": "alta|média|baixa",
          "status": "possível_duplicata|nova_transação"
        },
        ...
      ]
    }
    `;

    const completion = await client.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: "Você é um assistente de conciliação bancária que analisa transações e identifica possíveis correspondências. Você retorna apenas JSON válido, sem texto adicional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const resultText = completion.choices[0]?.message?.content || '{"matches": []}';
    const result = JSON.parse(resultText);
    return result.matches || [];
    
  } catch (error) {
    console.error("Erro ao gerar sugestões de conciliação com Groq:", error);
    throw new Error("Falha ao gerar sugestões de conciliação");
  }
}

// Função para detectar padrões financeiros
export async function detectPatterns(transactions: { 
  description: string; 
  amount: number; 
  date: string;
  category: string;
}[], timeframe: string) {
  try {
    const client = getGroqClient();

    const prompt = `
    Como um analista financeiro, identifique padrões e insights nas seguintes transações de ${timeframe}:

    Transações:
    ${transactions.map(t => 
      `Data: ${t.date} | Descrição: "${t.description}" | Valor: R$ ${Math.abs(t.amount).toFixed(2)} | ${t.amount < 0 ? 'Saída' : 'Entrada'} | Categoria: ${t.category}`
    ).join('\n')}

    Por favor, identifique:
    1. Possíveis assinaturas e gastos recorrentes
    2. Gastos incomuns ou outliers
    3. Categorias com aumento ou diminuição significativa
    4. Possíveis transações duplicadas
    5. Oportunidades de economia

    Formato de resposta JSON:
    {
      "recurringExpenses": [
        {
          "description": "descrição_da_transação",
          "frequency": "mensal|semanal|etc",
          "averageAmount": valor_numérico,
          "confidence": "alta|média|baixa"
        }
      ],
      "unusualTransactions": [
        {
          "id": "id_da_transação",
          "reason": "razão_do_destaque",
          "suggestion": "sugestão_opcional"
        }
      ],
      "categoryTrends": [
        {
          "category": "nome_da_categoria",
          "trend": "aumento|diminuição|estável",
          "changePercentage": valor_numérico,
          "insight": "insight_sobre_mudança"
        }
      ],
      "possibleDuplicates": [
        {
          "id1": "id_da_transação_1",
          "id2": "id_da_transação_2",
          "confidence": "alta|média|baixa",
          "reason": "razão_da_suspeita"
        }
      ],
      "savingsOpportunities": [
        {
          "category": "nome_da_categoria",
          "suggestion": "sugestão_de_economia",
          "estimatedSavings": valor_numérico
        }
      ]
    }
    `;

    const completion = await client.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content: "Você é um analista financeiro que identifica padrões e insights valiosos em transações financeiras. Você retorna apenas JSON válido, sem texto adicional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const resultText = completion.choices[0]?.message?.content || '{"insights": {}}';
    return JSON.parse(resultText);
    
  } catch (error) {
    console.error("Erro ao detectar padrões com Groq:", error);
    throw new Error("Falha ao detectar padrões nas transações");
  }
}

// Função para o chat aberto com o assistente financeiro
export async function chatWithFinancialAssistant(
  messages: { role: "user" | "assistant" | "system"; content: string }[],
  userData?: {
    totalTransactions?: number;
    totalExpenses?: number;
    totalIncome?: number;
    topCategories?: { name: string; amount: number }[];
    recentTransactions?: { description: string; amount: number; date: string; category: string }[];
  }
) {
  try {
    const client = getGroqClient();
    
    // Criar um sistema de mensagem com contexto do usuário, se disponível
    let systemMessage = `Você é um assistente financeiro pessoal especializado em finanças pessoais. 
    Você é conciso, útil e responde perguntas financeiras com base nas informações que você tem.`;
    
    if (userData) {
      systemMessage += `\n\nInformações financeiras do usuário:`;
      
      if (userData.totalTransactions !== undefined) 
        systemMessage += `\n- Total de transações: ${userData.totalTransactions}`;
      
      if (userData.totalExpenses !== undefined) 
        systemMessage += `\n- Total de despesas: R$ ${userData.totalExpenses.toFixed(2)}`;
      
      if (userData.totalIncome !== undefined) 
        systemMessage += `\n- Total de receitas: R$ ${userData.totalIncome.toFixed(2)}`;
      
      if (userData.topCategories && userData.topCategories.length > 0) {
        systemMessage += `\n\nPrincipais categorias de gastos:`;
        userData.topCategories.forEach(cat => {
          systemMessage += `\n- ${cat.name}: R$ ${cat.amount.toFixed(2)}`;
        });
      }
      
      if (userData.recentTransactions && userData.recentTransactions.length > 0) {
        systemMessage += `\n\nTransações recentes:`;
        userData.recentTransactions.slice(0, 5).forEach(t => {
          systemMessage += `\n- ${t.date}: "${t.description}" - R$ ${t.amount.toFixed(2)} (${t.category})`;
        });
      }
    }
    
    // Adicionar a mensagem do sistema no início
    const allMessages = [
      {
        role: "system" as const,
        content: systemMessage
      },
      ...messages
    ];

    const completion = await client.chat.completions.create({
      model: "llama3-70b-8192",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 1500
    });

    return completion.choices[0]?.message?.content || 
      "Desculpe, não consegui processar sua pergunta. Pode tentar novamente?";
    
  } catch (error) {
    console.error("Erro ao conversar com assistente financeiro:", error);
    throw new Error("Falha na comunicação com o assistente financeiro");
  }
} 