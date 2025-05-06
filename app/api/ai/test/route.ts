import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/app/_lib/auth';
// Removendo importação não utilizada que estava causando erro
// import { processChat } from '../chat/route';

// Função simulada para processamento de chat em ambiente de testes
async function processChat(messages: any[], userData: any, systemContext: any, processedQuery: any) {
  // Versão mock simplificada apenas para testes
  return {
    success: true,
    response: "Esta é uma resposta simulada do assistente para fins de teste.",
    error: null
  };
}

// Dados fictícios completos para teste
const MOCK_USER_DATA = {
  period: {
    startDate: '2025-03-01T00:00:00.000Z',
    endDate: '2025-03-31T23:59:59.999Z',
    month: 3,
    year: 2025,
    monthName: 'março'
  },
  user: {
    name: 'Usuário Teste',
    email: 'teste@exemplo.com',
  },
  totals: {
    income: 8000,
    expenses: 5000,
    transfers: 1500,
    balance: 3000,
    rawExpenses: -5000,
    transactionCount: 52
  },
  comparison: {
    previousMonth: {
      income: 7800,
      expenses: 4800,
      balance: 3000,
      rawExpenses: -4800
    },
    differences: {
      income: 2.56,
      expenses: 4.17,
      balance: 0
    }
  },
  categories: [
    { name: 'Alimentação', amount: 1200, percentage: 24 },
    { name: 'Moradia', amount: 1800, percentage: 36 },
    { name: 'Transporte', amount: 800, percentage: 16 },
    { name: 'Lazer', amount: 600, percentage: 12 },
    { name: 'Outros', amount: 600, percentage: 12 }
  ],
  recentTransactions: [
    {
      id: '1',
      description: 'Supermercado ABC',
      amount: -450,
      date: '2025-03-15',
      category: 'Alimentação',
      wallet: 'Banco Principal',
      type: 'EXPENSE'
    },
    {
      id: '2',
      description: 'Aluguel',
      amount: -1800,
      date: '2025-03-05',
      category: 'Moradia',
      wallet: 'Banco Principal',
      type: 'EXPENSE'
    },
    {
      id: '3',
      description: 'Salário',
      amount: 8000,
      date: '2025-03-05',
      category: 'Receita',
      wallet: 'Banco Principal',
      type: 'INCOME'
    },
    {
      id: '4',
      description: 'Restaurante Delícia',
      amount: -120,
      date: '2025-03-18',
      category: 'Alimentação',
      wallet: 'Banco Principal',
      type: 'EXPENSE'
    },
    {
      id: '5',
      description: 'Conta de Luz',
      amount: -250,
      date: '2025-03-10',
      category: 'Moradia',
      wallet: 'Banco Principal',
      type: 'EXPENSE'
    },
    {
      id: '6',
      description: 'Conta de Água',
      amount: -120,
      date: '2025-03-12',
      category: 'Moradia',
      wallet: 'Banco Principal',
      type: 'EXPENSE'
    },
    {
      id: '7',
      description: 'Internet',
      amount: -180,
      date: '2025-03-14',
      category: 'Moradia',
      wallet: 'Banco Principal',
      type: 'EXPENSE'
    },
    {
      id: '8',
      description: 'Academia',
      amount: -120,
      date: '2025-03-05',
      category: 'Lazer',
      wallet: 'Banco Principal',
      type: 'EXPENSE'
    },
    {
      id: '9',
      description: 'Cinema',
      amount: -80,
      date: '2025-03-25',
      category: 'Lazer',
      wallet: 'Cartão Crédito',
      type: 'EXPENSE'
    },
    {
      id: '10',
      description: 'Uber',
      amount: -35,
      date: '2025-03-28',
      category: 'Transporte',
      wallet: 'Cartão Crédito',
      type: 'EXPENSE'
    },
    {
      id: '11',
      description: 'Transferência para Poupança',
      amount: 1000,
      date: '2025-03-10',
      category: 'Transferência',
      wallet: 'Poupança',
      type: 'TRANSFER'
    }
  ]
};

// Dados financeiros incompletos/inválidos para testar erros
const MOCK_INVALID_USER_DATA = {
  error: 'Não foi possível acessar os dados financeiros completos.',
  totalTransactions: 0,
  totalExpenses: 0,
  totalIncome: 0
};

// Exemplo de consulta processada corretamente
const MOCK_PROCESSED_QUERY = {
  intent: "reservaEmergencia",
  entities: {
    timePeriods: { months: 6 }
  },
  structuredData: {
    emergencyFund: {
      monthlyExpenses: 5000,
      minEmergencyFund: 15000,
      idealEmergencyFund: 30000,
      monthsToReach: 6,
      monthlySavingCapacity: 3000,
      savingRequired: 5000,
      isFeasible: false,
      savingOpportunities: [
        {
          category: 'Moradia',
          currentAmount: 1800,
          suggestedReduction: 360,
          potentialSaving: 360,
          percentage: 36
        },
        {
          category: 'Alimentação',
          currentAmount: 1200,
          suggestedReduction: 240,
          potentialSaving: 240,
          percentage: 24
        }
      ]
    }
  },
  enhancedQuery: "Quanto preciso guardar para ter uma reserva de emergência?\n\nContexto financeiro atual: Receita mensal de R$8000.00, despesas mensais de R$5000.00, com saldo de R$3000.00.\n\nDados para cálculo: Uma reserva ideal seria de R$30000.00 (6x despesas mensais). Com economia mensal de R$3000.00, levaria 10 meses para atingir esse valor."
};

// Exemplo de consulta com erro por falta de dados
const MOCK_ERROR_PROCESSED_QUERY = {
  intent: "reservaEmergencia",
  entities: {
    timePeriods: { months: 6 }
  },
  structuredData: {
    emergencyFund: {
      errorState: true,
      errorMessage: "Dados financeiros insuficientes para calcular reserva de emergência",
      missingData: {
        monthlyExpenses: true,
        monthlyBalance: true,
        generalData: true
      }
    }
  },
  enhancedQuery: "Quanto preciso guardar para ter uma reserva de emergência?"
};

// Endpoint de teste para o assistente financeiro
export async function POST(request: NextRequest) {
  try {
    // Esta rota é apenas para testes e não requer autenticação
    
    // Extrair configurações de teste da requisição
    const { 
      messages, 
      includeFinancialData = true, 
      hasErrorState = false, 
      customQuery = null,
      queryType = "reservaEmergencia" 
    } = await request.json();
    
    console.log('[API-TESTE] Recebida requisição de teste com configurações:', { 
      includeFinancialData, 
      hasErrorState, 
      messageCount: messages?.length,
      queryType 
    });
    
    // Verificar se temos mensagens válidas
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Mensagens inválidas',
          response: 'O formato das mensagens enviadas é inválido para o teste.'
        },
        { status: 400 }
      );
    }
    
    // Criar contexto do sistema
    const systemContext = {
      currentDate: "2025-04-03T00:00:00.000Z",
      simulatedYear: 2025,
      simulatedMonth: 4,
      message: "[SISTEMA] Nota para o modelo de IA: A data atual simulada é 3 de abril de 2025."
    };
    
    // Selecionar o tipo de consulta processada para o teste
    let processedQuery;
    if (customQuery) {
      processedQuery = customQuery;
    } else {
      // Usar uma consulta base de acordo com o tipo
      switch (queryType) {
        case "reservaEmergencia":
          processedQuery = {...MOCK_PROCESSED_QUERY};
          break;
        case "gastosPorCategoria":
          processedQuery = {
            intent: "gastosPorCategoria",
            entities: { mentionedCategories: ["Alimentação"] },
            structuredData: {
              categoryAnalysis: includeFinancialData && !hasErrorState ? {
                category: "Alimentação",
                amount: 1200,
                percentage: 24,
                totalExpenses: 5000,
                transactions: [
                  {
                    description: "Supermercado ABC", 
                    amount: -450, 
                    date: "2025-03-15"
                  }
                ]
              } : {
                errorState: true,
                errorMessage: "Dados financeiros insuficientes para analisar a categoria"
              }
            },
            enhancedQuery: "Quanto gastei com alimentação em março de 2025?"
          };
          break;
        case "economizar":
          processedQuery = {
            intent: "economizar",
            entities: { timePeriods: { months: 24 }, moneyValues: [30000] },
            structuredData: {
              savingGoal: includeFinancialData && !hasErrorState ? {
                currentSavingCapacity: 3000,
                possibleAnnualSaving: 36000,
                incomeSources: 8000,
                expenseSources: 5000,
                savingPercentage: 37.5,
                specificGoal: {
                  amount: 30000,
                  monthsToReach: 10,
                  yearsToReach: "0.8",
                  isFeasible: true,
                  requiredMonthlySaving: 1250,
                  timeSpecified: 24
                }
              } : {
                errorState: true,
                errorMessage: "Dados financeiros insuficientes para calcular capacidade de poupança",
                missingData: {
                  monthlyIncome: true,
                  monthlyExpenses: true,
                  monthlyBalance: true,
                  generalData: true
                }
              }
            },
            enhancedQuery: "Quanto preciso economizar por mês para juntar R$30.000 em 2 anos?"
          };
          break;
        case "listarTransacoes":
          processedQuery = {
            intent: "listarTransacoes",
            entities: {},
            structuredData: {},
            enhancedQuery: "Liste as transações de março de 2025"
          };
          break;
        default:
          processedQuery = {...MOCK_PROCESSED_QUERY};
      }
    }
    
    // Se configurado para simular erro, substituir estrutura de dados
    if (hasErrorState) {
      // Substituir com versão de erro apropriada baseada no tipo
      switch (processedQuery.intent) {
        case "reservaEmergencia":
          processedQuery.structuredData.emergencyFund = {
            errorState: true,
            errorMessage: "Dados financeiros insuficientes para calcular reserva de emergência",
            missingData: {
              monthlyExpenses: true,
              monthlyBalance: true,
              generalData: true
            }
          };
          break;
        case "gastosPorCategoria":
          processedQuery.structuredData.categoryAnalysis = {
            errorState: true,
            errorMessage: "Dados financeiros insuficientes para analisar a categoria",
            missingData: {
              categoryData: true
            }
          };
          break;
        case "economizar":
        case "metas":
          processedQuery.structuredData.savingGoal = {
            errorState: true,
            errorMessage: "Dados financeiros insuficientes para calcular capacidade de poupança",
            missingData: {
              monthlyIncome: true,
              monthlyExpenses: true,
              monthlyBalance: true,
              generalData: true
            }
          };
          break;
      }
    }
    
    // Determinar quais dados financeiros enviar
    const userData = includeFinancialData ? MOCK_USER_DATA : MOCK_INVALID_USER_DATA;
    
    // Processar a conversa com o assistente
    try {
      console.log('[API-TESTE] Processando consulta de teste...');
      console.log('[API-TESTE] Dados financeiros enviados:', includeFinancialData ? 'DADOS COMPLETOS' : 'DADOS INVÁLIDOS');
      console.log('[API-TESTE] Estado de erro simulado:', hasErrorState ? 'SIM' : 'NÃO');
      
      const result = await processChat(messages, userData, systemContext, processedQuery);
      
      console.log('[API-TESTE] Consulta processada com sucesso');
      
      return NextResponse.json({
        success: result.success,
        response: result.response,
        error: result.error,
        financialData: userData,
        testMode: true,
        testConfig: {
          includeFinancialData,
          hasErrorState,
          queryType,
          intentDetected: processedQuery.intent
        }
      });
    } catch (error) {
      console.error('[API-TESTE] Erro ao processar conversa:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar a mensagem de teste',
        response: "Desculpe, ocorreu um erro ao processar sua mensagem de teste.",
        testMode: true
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API-TESTE] Erro interno:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno no servidor de teste',
        response: "Ocorreu um erro interno no servidor de teste.",
        testMode: true
      },
      { status: 500 }
    );
  }
} 