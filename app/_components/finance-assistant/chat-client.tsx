"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/app/_components/ui/button";
import { Loader2, Send, Info } from "lucide-react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { Textarea } from "@/app/_components/ui/textarea";
import { Avatar, AvatarFallback } from "@/app/_components/ui/avatar";
import { cn } from "@/app/_lib/utils";
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/_components/ui/tooltip";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  feedback?: 'positive' | 'negative';
}

interface FinancialSummary {
  period?: {
    startDate: string;
    endDate: string;
    month: number;
    year: number;
    monthName: string;
  };
  user?: {
    name: string;
    email: string;
  };
  totals?: {
    income: number;
    expenses: number;
    transfers: number;
    balance: number;
    rawExpenses: number;
    transactionCount: number;
  };
  comparison?: {
    previousMonth: {
      income: number;
      expenses: number;
      balance: number;
      rawExpenses: number;
    };
    differences: {
      income: number;
      expenses: number;
      balance: number;
    };
  };
  categories?: Array<{name: string, amount: number, percentage: number}>;
  recentTransactions?: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    category: string;
    wallet: string;
    type: string;
  }>;
  dailySpending?: Array<{day: number, amount: number, date: string}>;
  budgets?: {
    all: Array<{
      id: string;
      categoryId: string | null;
      categoryName: string;
      planned: number;
      current: number;
      remaining: number;
      percentage: number;
    }>;
    exceeded: Array<{
      categoryId: string | null;
      categoryName: string;
      amount: number;
      exceeded: number;
      percentage: number;
    }>;
    count: number;
  };
  wallets?: Array<{
    name: string;
    incoming: number;
    outgoing: number;
    balance: number;
  }>;
}

interface ChatClientProps {
  initialMessages?: ChatMessage[];
  onClose: () => void;
  month?: string;
  financialData?: FinancialSummary;
  /** 
   * Data de referência usada pelo assistente para validar consultas temporais.
   * Se não fornecida, usará a data atual do sistema.
   * Útil para testes e simulações com diferentes contextos temporais.
   */
  referenceDate?: Date;
}

/**
 * Componente cliente para o assistente financeiro inteligente com análise detalhada de dados
 * 
 * Funcionalidades:
 * - Interface de chat para interação com IA financeira especializada em análises granulares
 * - Exibição de resumo financeiro com dados contextuais e métricas detalhadas
 * - Sugestões de perguntas personalizadas baseadas nos dados financeiros
 * - Suporte a formatação markdown nas respostas para estruturação clara dos insights
 * - Processamento detalhado de transações individuais e padrões comportamentais
 * - Validação temporal rigorosa para prevenir análises de períodos futuros
 * - Data de referência dinâmica para simulações e testes em diferentes contextos temporais
 * 
 * Sistema de Data de Referência Dinâmica:
 * - O componente pode receber uma data de referência via props ou usar a data atual do sistema
 * - A data de referência é usada como base para todas as validações temporais e contextos
 * - O usuário pode alterar a data de referência durante a execução através de uma interface opcional
 * - Todas as validações temporais e mensagens são atualizadas automaticamente com a nova data
 * - Útil para testes, simulações ou para definir o contexto temporal específico do assistente
 * 
 * Regras de especificidade:
 * - Detecção automática de perguntas genéricas através de padrões regex
 * - Instrução à IA para solicitar maior especificidade do usuário quando necessário
 * - Sugestões de perguntas formuladas de maneira específica como exemplos
 * - Parâmetros de contexto temporais (mês atual) e financeiros incluídos nas sugestões
 * - Mensagens de sistema que orientam a IA a exigir mais detalhes antes de responder
 * - Verificação da validade temporal de todas as solicitações (rejeição automática de períodos futuros)
 * 
 * Fluxo de processamento de dados:
 * - Recebimento da solicitação do usuário via interface de chat
 * - Validação da temporalidade da solicitação (rejeição de períodos futuros)
 * - Transformação da solicitação em consulta estruturada detalhada ao banco de dados
 * - Recuperação dos dados financeiros granulares do sistema (transações individuais)
 * - Processamento e análise aprofundada dos dados para extrair insights específicos
 * - Identificação de padrões, anomalias, tendências temporais e oportunidades
 * - Formatação e apresentação dos insights com alto nível de detalhamento
 * - Recomendações práticas específicas baseadas na análise granular dos dados
 * 
 * Princípios de análise de dados:
 * - Priorização do detalhamento completo sobre resumos simplificados
 * - Foco em transações individuais e seus padrões emergentes
 * - Análise multidimensional (temporal, categórica, comportamental)
 * - Identificação precisa de anomalias e oportunidades específicas
 * - Contextualização completa das recomendações com dados específicos
 * - Estrita aderência à realidade temporal (apenas períodos passados ou presentes)
 * - Proibição absoluta de dados fabricados para períodos futuros ou inexistentes
 */
export default function ChatClient({ initialMessages = [], onClose, month, financialData, referenceDate }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finData, setFinData] = useState<FinancialSummary | undefined>(financialData);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Referência para a data do sistema - inicializada com o valor da prop ou a data atual
  const [systemReferenceDate, setSystemReferenceDate] = useState<Date>(referenceDate || new Date());
  
  // Array com os nomes dos meses em português
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  
  // Função auxiliar para obter o nome do mês a partir do número (0-11)
  const getMonthName = (monthIndex: number): string => {
    // Garantir que o índice esteja entre 0-11
    const normalizedIndex = ((monthIndex % 12) + 12) % 12;
    return monthNames[normalizedIndex];
  };
  
  // Função para atualizar a data de referência dinamicamente
  const updateReferenceDate = (newDate: Date) => {
    setSystemReferenceDate(newDate);
  };
  
  // Atualiza a data de referência se a prop for alterada
  useEffect(() => {
    if (referenceDate) {
      setSystemReferenceDate(referenceDate);
    }
  }, [referenceDate]);
  
  // Referência para controlar debounce da digitação
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Referência para o container de mensagens para controlar o scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Função de scroll para o final da lista de mensagens
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Efeito para rolar para o final quando mensagens são atualizadas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (financialData) {
      setFinData(financialData);
    }
  }, [financialData]);

  // Cleanup effect para limpar timeouts quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, []);
  
  // Handler otimizado para entrada de texto com debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Atualiza o valor imediatamente para feedback visual
    setInput(value);
    
    // Limpa qualquer timeout pendente
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }
  };
  
  /**
   * Verifica se um período temporal mencionado é válido (não futuro)
   * 
   * Esta função analisa o texto da pergunta para identificar referências a anos e meses,
   * e determina se o período mencionado é válido (passado ou presente) ou inválido (futuro).
   * 
   * @param text Texto da pergunta do usuário
   * @returns Objeto contendo informações sobre a validade temporal da pergunta
   */
  const validateTemporalReference = (text: string): {
    isValid: boolean;
    hasFuturePeriod: boolean;
    mentionedYear?: number;
    mentionedMonth?: string;
    errorMessage?: string;
  } => {
    // Usar a data de referência do sistema
    const referenceDate = systemReferenceDate;
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth() + 1;
    
    // Detector de anos
    const yearPattern = /\b(20\d{2}|19\d{2})\b/g;
    const yearMatches = [...text.matchAll(yearPattern)];
    
    // Mapeamento de nomes de meses para números
    const monthMapping: {[key: string]: number} = {};
    monthNames.forEach((month, index) => {
      // Adicionar mês normalizado (sem acentos)
      const normalizedMonth = month.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      monthMapping[month] = index + 1;
      if (normalizedMonth !== month) {
        monthMapping[normalizedMonth] = index + 1;
      }
    });
    
    // Detector de meses
    const monthPattern = new RegExp(`\\b(${monthNames.join('|')})\\b`, 'gi');
    const monthMatches = [...text.matchAll(monthPattern)];
    
    // Se não menciona período específico, é válido
    if (yearMatches.length === 0 && monthMatches.length === 0) {
      return { isValid: true, hasFuturePeriod: false };
    }
    
    // Verificar se a pergunta é sobre planejamento financeiro para um período futuro
    const isPlanningQuestion = /planej(ar|amento|ando)|economizar|reserva|meta|preciso guardar|juntar dinheiro|poupar/i.test(text);
    
    // Verificar anos mencionados
    for (const yearMatch of yearMatches) {
      const mentionedYear = parseInt(yearMatch[0], 10);
      
      // Anos futuros são inválidos, EXCETO para perguntas de planejamento financeiro
      if (mentionedYear > currentYear && !isPlanningQuestion) {
        return {
          isValid: false,
          hasFuturePeriod: true,
          mentionedYear,
          errorMessage: `Referência a um ano futuro (${mentionedYear}) detectada. Não é possível fornecer dados para períodos que ainda não ocorreram.`
        };
      }
      
      // Para perguntas de planejamento com ano futuro, considerar válido
      if (mentionedYear > currentYear && isPlanningQuestion) {
        console.log(`[TEMPORAL] Permitindo referência a ano futuro (${mentionedYear}) pois é pergunta de planejamento financeiro`);
        return { 
          isValid: true, 
          hasFuturePeriod: false,
          mentionedYear
        };
      }
      
      // Para o ano atual, precisamos verificar o mês também (se não for planejamento)
      if (mentionedYear === currentYear && monthMatches.length > 0 && !isPlanningQuestion) {
        for (const monthMatch of monthMatches) {
          const monthName = monthMatch[0].toLowerCase();
          const normalizedMonthName = monthName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const monthNumber = monthMapping[normalizedMonthName] || monthMapping[monthName];
          
          if (monthNumber > currentMonth) {
            const currentMonthName = getMonthName(referenceDate.getMonth());
            
            return {
              isValid: false,
              hasFuturePeriod: true,
              mentionedYear,
              mentionedMonth: monthName,
              errorMessage: `Referência a um período futuro (${monthName} de ${mentionedYear}) detectada. Como estamos em ${currentMonthName} de ${currentYear}, não é possível fornecer dados para períodos que ainda não ocorreram.`
            };
          }
        }
      }
    }
    
    // Se chegou até aqui, o período é válido
    return {
      isValid: true,
      hasFuturePeriod: false,
      mentionedYear: yearMatches.length > 0 ? parseInt(yearMatches[0][0], 10) : undefined,
      mentionedMonth: monthMatches.length > 0 ? monthMatches[0][0] : undefined
    };
  };

  /**
   * Processa localmente a consulta do usuário para extrair entidades relevantes
   * e estruturar a informação antes de enviar para o modelo de linguagem
   * 
   * @param query Pergunta do usuário em linguagem natural
   * @param financialData Dados financeiros disponíveis
   * @returns Objeto com entidades extraídas e dados estruturados
   */
  const processQueryLocally = (
    query: string, 
    financialData?: FinancialSummary,
    referenceDate: Date = systemReferenceDate
  ): {
    intent: string;
    entities: Record<string, any>;
    structuredData: Record<string, any>;
    enhancedQuery: string;
  } => {
    // Definir padrões para identificação de intenções e entidades
    const patterns = {
      reservaEmergencia: /reserva de emergência|reserva emergencial|fundo de emergência|economizar para emergência/i,
      gastosPorCategoria: /gast(os|ei) (com|em) ([a-záàâãéèêíïóôõöúçñ\s]+)|categoria.*gastos?|categoria.*despesas?|qual categoria|gasto por categoria|despesas? por categoria|maior(es)? categoria|principal categoria/i,
      economizar: /economizar|poupar|guardar|juntar dinheiro/i,
      comparacaoMensal: /compar(ar|ando|e) (com|ao)( o)? mês (anterior|passado)/i,
      investimentos: /invest(ir|imento|indo)/i,
      orcamento: /orçamento|budget|planejar gastos/i,
      dividaAnalise: /dívidas?|devo|endividamento|endividado/i,
      fluxoCaixa: /fluxo de caixa|entrada e saída|receitas e despesas/i,
      metas: /meta financeira|objetivo financeiro|quero atingir/i,
      padraoGastos: /padrão de gastos|análise de gastos|dia.*(gasto|despesa)|dia da semana.*(gasto|despesa)/i,
      gastosDetalhados: /detalhamento|detalhes de gastos|transações detalhadas|histórico detalhado|histórico de transações/i,
      gastosCategoria: /quanto gastei em ([a-záàâãéèêíïóôõöúçñ\s]+)|gastos em ([a-záàâãéèêíïóôõöúçñ\s]+)|despesas com ([a-záàâãéèêíïóôõöúçñ\s]+)/i,
      balançoMensal: /saldo mensal|balanço mensal|entradas e saídas|receitas versus despesas/i,
      tendenciaGastos: /tendência|evolução|comportamento financeiro|padrão histórico|histórico de gastos/i,
      projeçãoFutura: /(projeção|previsão) (financeira|de gastos|de despesas)/i,
      analiseDiaSemana: /dia da semana|gastos por dia|despesas por dia/i,
      listarTransacoes: /list(ar|e|em) (as |minhas )?transa(ç|c)(õ|o)es( de| em| do mês( de)?)?|minhas transa(ç|c)(õ|o)es( de| em| do mês( de)?)?|mostrar? (as |minhas )?transa(ç|c)(õ|o)es/i
    };
    
    // Verificar se a pergunta é sobre planejamento futuro
    const temporalValidation = validateTemporalReference(query);
    const isPlanningForFuture = temporalValidation.isValid && temporalValidation.mentionedYear && temporalValidation.mentionedYear > referenceDate.getFullYear();
    
    console.log('[FINANCE] Análise temporal da consulta:', {
      isFuturePlanning: isPlanningForFuture,
      mentionedYear: temporalValidation.mentionedYear,
      currentYear: referenceDate.getFullYear(),
      isValid: temporalValidation.isValid
    });
    
    // Detectar a intenção principal da consulta
    let intent = "generico";
    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.test(query)) {
        intent = key;
        break;
      }
    }
    
    // Refinar a intenção com base em expressões chave
    if (query.match(/dia da semana.*gasto/i) || query.match(/dia.*mais.*gasto/i) || query.match(/quando.*gasto mais/i)) {
      intent = "analiseDiaSemana";
    }
    
    if (query.match(/reserva.*emergência/i) || query.match(/fundo.*emergência/i)) {
      intent = "reservaEmergencia";
    }
    
    if (query.match(/list(ar|e|em) transa(ç|c)(õ|o)es/i) || query.match(/minhas transa(ç|c)(õ|o)es/i)) {
      intent = "listarTransacoes";
    }
    
    // Verificar se é uma consulta sobre dias da semana que mais gasta
    if (query.match(/dia da semana/i) && query.match(/gasto/i)) {
      intent = "analiseDiaSemana";
    }
    
    console.log('[FINANCE] Intent detectada:', intent);
    
    // Extração de entidades inicial
    const entities: Record<string, any> = {};
    
    // Extrair valores monetários mencionados
    const moneyValues = query.match(/R\$\s*\d+(\.\d+)?(,\d+)?|\d+(\.\d+)?(,\d+)?\s*reais|\d+(\.\d+)?(,\d+)?/g);
    if (moneyValues) {
      entities.moneyValues = moneyValues.map((val: string) => {
        // Normalizar o valor para formato numérico
        const normalized = val
          .replace('R$', '')
          .replace('reais', '')
          .replace('.', '')
          .replace(',', '.')
          .trim();
        return parseFloat(normalized);
      });
    }
    
    // Extrair períodos de tempo mencionados
    const timePatterns = {
      days: /(\d+)\s*dias?/i,
      weeks: /(\d+)\s*semanas?/i,
      months: /(\d+)\s*meses|(\d+)\s*mes(es)?/i,
      years: /(\d+)\s*anos?/i
    };
    
    entities.timePeriods = {};
    for (const [unit, pattern] of Object.entries(timePatterns)) {
      const match = query.match(pattern);
      if (match) {
        entities.timePeriods[unit] = parseInt(match[1]);
      }
    }
    
    // Extrair categorias de gastos mencionadas
    if (financialData?.categories) {
      const allCategories = financialData.categories.map(cat => cat.name.toLowerCase());
      entities.mentionedCategories = allCategories.filter(cat => 
        query.toLowerCase().includes(cat.toLowerCase())
      );
    }
    
    // Verificar se temos dados financeiros válidos (Adicionar logs detalhados)
    console.log('[FINANCE] Verificando dados financeiros:', {
      financialData: !!financialData,
      totalsDefined: financialData?.totals ? 'SIM' : 'NÃO',
      expensesDefined: financialData?.totals?.expenses !== undefined ? 'SIM' : 'NÃO',
      expensesIsNumber: financialData?.totals?.expenses !== undefined && typeof financialData.totals.expenses === 'number' ? 'SIM' : 'NÃO',
      expensesValue: financialData?.totals?.expenses,
      incomeDefined: financialData?.totals?.income !== undefined ? 'SIM' : 'NÃO',
      incomeIsNumber: financialData?.totals?.income !== undefined && typeof financialData.totals.income === 'number' ? 'SIM' : 'NÃO',
      incomeValue: financialData?.totals?.income,
    });
    
    const hasValidFinancialData = financialData && 
                                 financialData.totals && 
                                 typeof financialData.totals.expenses === 'number' && 
                                 financialData.totals.expenses > 0 &&
                                 typeof financialData.totals.income === 'number' && 
                                 financialData.totals.income > 0;
    
    // Dados estruturados para a resposta
    const structuredData: Record<string, any> = {};
    
    // Valores mensais para cálculos
    const monthlyIncome = hasValidFinancialData && financialData?.totals ? financialData.totals.income : null;
    const monthlyExpenses = hasValidFinancialData && financialData?.totals ? financialData.totals.expenses : null;
    const monthlyBalance = hasValidFinancialData && monthlyIncome !== null && monthlyExpenses !== null ? 
      monthlyIncome - monthlyExpenses : null;
    
    console.log('[FINANCE] Valores financeiros mensais calculados:', {
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance,
      hasValidFinancialData
    });
    
    // Estruturar dados específicos com base na intenção
    if (intent === "reservaEmergencia") {
      if (hasValidFinancialData && monthlyExpenses !== null && monthlyExpenses > 0 && monthlyBalance !== null) {
        // Cálculos para reserva de emergência
        const minEmergencyFund = monthlyExpenses * 3; // 3 meses de despesas
        const idealEmergencyFund = monthlyExpenses * 6; // 6 meses de despesas
        
        // Capacidade de poupança mensal (saldo positivo)
        const monthlySavingCapacity = monthlyBalance > 0 ? monthlyBalance : 0;
        
        // Meses para atingir a reserva ideal se poupar todo o saldo mensal
        const monthsToReachIdeal = monthlySavingCapacity > 0 ? 
          Math.ceil(idealEmergencyFund / monthlySavingCapacity) : 0;
          
        // Se a pergunta menciona um período específico (ex: "em 6 meses")
        let targetMonths = entities.timePeriods?.months || 6; // Padrão é 6 meses se não especificado
        
        // Calcular quanto precisaria poupar por mês para atingir a reserva em X meses
        const monthlySavingNeeded = targetMonths > 0 ? 
          idealEmergencyFund / targetMonths : 0;
          
        // Verificar se é viável com o saldo atual
        const isViable = monthlySavingCapacity >= monthlySavingNeeded;
        
        // Dados estruturados para a reserva de emergência
        structuredData.emergencyFund = {
          monthlyExpenses,
          minEmergencyFund,
          idealEmergencyFund,
          monthlySavingCapacity, 
          monthsToReachIdeal,
          targetMonths,
          monthlySavingNeeded,
          isViable,
          deficitIfNotViable: !isViable ? monthlySavingNeeded - monthlySavingCapacity : 0
        };
        
        console.log('[FINANCE] Dados de reserva de emergência calculados:', structuredData.emergencyFund);
      } else {
        // Indicar erro se não temos dados suficientes
        structuredData.emergencyFund = {
          errorState: true,
          errorMessage: "Dados financeiros insuficientes para calcular reserva de emergência",
          missingData: {
            monthlyExpenses: monthlyExpenses === null || monthlyExpenses <= 0,
            monthlyBalance: monthlyBalance === null,
            generalData: !hasValidFinancialData
          }
        };
        
        console.log('[FINANCE] Erro em dados de reserva de emergência:', structuredData.emergencyFund);
      }
    } else if (intent === "economizar" || intent === "metas") {
      if (hasValidFinancialData && monthlyBalance !== null && monthlyIncome !== null) {
        // Meta padrão (pode ser ajustada com base na pergunta)
        let targetAmount = 10000; // Valor padrão de R$ 10.000
        
        // Se a pergunta menciona um valor específico, usar ele
        if (entities.moneyValues && entities.moneyValues.length > 0) {
          targetAmount = entities.moneyValues[0];
        }
        
        // Meses para atingir (padrão é 12 = 1 ano)
        let targetMonths = entities.timePeriods?.months || 
                         (entities.timePeriods?.years ? entities.timePeriods.years * 12 : 12);
        
        // Quanto precisaria poupar por mês
        const monthlySavingNeeded = targetAmount / targetMonths;
        
        // Capacidade atual de poupança
        const currentSavingCapacity = monthlyBalance > 0 ? monthlyBalance : 0;
        
        // É viável com o saldo atual?
        const isViable = currentSavingCapacity >= monthlySavingNeeded;
        
        // Percentual da renda atual que precisaria ser poupado
        const savingRateNeeded = (monthlySavingNeeded / monthlyIncome) * 100;
        
        structuredData.savingGoal = {
          targetAmount,
          targetMonths,
          monthlySavingNeeded,
          currentSavingCapacity,
          isViable,
          deficitIfNotViable: !isViable ? monthlySavingNeeded - currentSavingCapacity : 0,
          savingRateNeeded,
          currentSavingRate: (currentSavingCapacity / monthlyIncome) * 100
        };
        
        console.log('[FINANCE] Dados de meta de economia calculados:', structuredData.savingGoal);
      } else {
        // Dados insuficientes
        structuredData.savingGoal = {
          errorState: true,
          errorMessage: "Dados financeiros insuficientes para calcular capacidade de poupança",
          missingData: {
            monthlyIncome: monthlyIncome === null,
            monthlyExpenses: monthlyExpenses === null,
            monthlyBalance: monthlyBalance === null,
            generalData: !hasValidFinancialData
          },
          isFuturePlanning: isPlanningForFuture,
          planningYear: isPlanningForFuture ? temporalValidation.mentionedYear : null
        };
        
        console.log('[FINANCE] Erro em dados de meta de economia:', structuredData.savingGoal);
      }
    }
    
    // Criar uma query aprimorada que inclui detalhes extraídos
    let enhancedQuery = query;
    
    // Para planejamento futuro, adicionar contexto explícito
    if (isPlanningForFuture) {
      enhancedQuery = `${query}\n\nObservação: Esta é uma pergunta sobre planejamento financeiro para o futuro (${temporalValidation.mentionedYear}), usando dados financeiros atuais como referência.`;
    }
    
    // Adicionar contexto financeiro explícito à query
    if (hasValidFinancialData && monthlyIncome !== null && monthlyExpenses !== null && monthlyBalance !== null) {
      enhancedQuery += `\n\nContexto financeiro atual: Receita mensal de R$${monthlyIncome.toFixed(2)}, despesas mensais de R$${monthlyExpenses.toFixed(2)}, com saldo de R$${monthlyBalance.toFixed(2)}.`;
    }
    
    // Adicionar contexto específico baseado na intenção
    if (intent === "reservaEmergencia" && structuredData.emergencyFund && !structuredData.emergencyFund.errorState) {
      enhancedQuery += `\n\nDados para cálculo: Uma reserva ideal seria de R$${structuredData.emergencyFund.idealEmergencyFund.toFixed(2)} (6x despesas mensais). Com economia mensal de R$${structuredData.emergencyFund.monthlySavingCapacity.toFixed(2)}, levaria ${Math.ceil(structuredData.emergencyFund.idealEmergencyFund / structuredData.emergencyFund.monthlySavingCapacity)} meses para atingir esse valor.`;
    }
    
    return {
      intent,
      entities,
      structuredData,
      enhancedQuery
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Adicionar a mensagem do usuário
      const userMessage: ChatMessage = {
        role: 'user',
        content: input.trim(),
        timestamp: new Date()
      };
      
      // Atualizar a lista de mensagens com a mensagem do usuário
      setMessages(prev => [...prev, userMessage]);
      
      // Limpar o campo de entrada
      setInput("");
      
      // Scroll para o final ao adicionar a mensagem do usuário
      setTimeout(scrollToBottom, 100);
      
      // Extrair informações da data de referência
      const currentYear = systemReferenceDate.getFullYear();
      const currentDay = systemReferenceDate.getDate();
      const currentMonthName = getMonthName(systemReferenceDate.getMonth());
      
      // Validar se a pergunta não é genérica demais
      if (isGenericQuestion(userMessage.content)) {
        console.log('Pergunta considerada genérica:', userMessage.content);
        
        const genericResponse: ChatMessage = {
          role: 'assistant',
          content: `Sua pergunta parece um pouco genérica. Para que eu possa te ajudar melhor, poderia ser mais específico? Por exemplo:

- Em vez de "como economizar dinheiro", tente "como reduzir meus gastos em Alimentação"
- Em vez de "me ajude com minhas finanças", tente "como está meu balanço financeiro este mês"
- Em vez de "quais são minhas maiores despesas", tente "quais são minhas maiores despesas em Março de 2023"

Quanto mais específico você for, melhor poderei analisar seus dados financeiros e fornecer insights relevantes. Poderia reformular sua pergunta com mais detalhes?`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, genericResponse]);
        setLoading(false);
        setTimeout(scrollToBottom, 100);
        return;
      }
      
      // Clonamos os dados financeiros do estado para evitar mutações
      const finData = {...financialData};
      
      // Obter as mensagens anteriores, removendo as instruções de sistema
      const filteredMessages = messages
        .filter(m => m.role !== 'system' || m.content.startsWith('[SISTEMA]'))
        .concat(userMessage);
      
      // NOVA ETAPA: Processamento local da consulta para extrair entidades e estruturar dados
      const processedQuery = processQueryLocally(userMessage.content, finData, systemReferenceDate);
      
      console.log('Consulta processada localmente:', processedQuery);
      
      // Enviar mensagem para o servidor com dados processados localmente
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: filteredMessages,
          month,
          systemContext: {
            currentDate: systemReferenceDate.toISOString(),
            simulatedYear: currentYear,
            simulatedMonth: systemReferenceDate.getMonth() + 1,
            message: `[SISTEMA] Data atual de referência: ${currentDay} de ${currentMonthName} de ${currentYear}.`
          },
          // Adicionar os dados processados localmente - chave para consulta direta ao banco
          processedQuery: processedQuery
        }),
      });
      
      const data = await response.json();
      
      console.log('Resposta da API:', data); 
      
      // Verificar se a resposta não está OK (status de erro HTTP)
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Falha na comunicação com o servidor');
      }
      
      // Verificação mais robusta da resposta
      if (data.success === false) {
        console.log('Resposta com sucesso=false:', data);
        throw new Error(data.error || 'Erro ao processar a mensagem');
      }
      
      // Verificar se temos uma resposta do assistente
      if (!data.response) {
        console.log('Resposta sem conteúdo:', data);
        throw new Error('Resposta vazia do assistente');
      }
      
      // Atualizar dados financeiros se disponíveis na resposta
      if (data.financialData) {
        setFinData(data.financialData);
      }
      
      console.log('Processando resposta bem-sucedida:', data.response.substring(0, 50) + '...');
      
      // Adicionar resposta do assistente
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Scroll para o final após adicionar a resposta
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
      // Adicionar uma mensagem de erro como resposta do assistente para feedback visual
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Desculpe, ocorreu um problema ao processar sua mensagem. Por favor, tente novamente mais tarde. ${error instanceof Error ? `\n\nDetalhe técnico: ${error.message}` : ''}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      
      // Scroll para o final após adicionar mensagem de erro
      setTimeout(scrollToBottom, 100);
    } finally {
      setLoading(false);
    }
  };
  
  const getFinancialSummary = () => {
    if (!finData || !finData.totals) return null;
    
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };
    
    const formatPercentage = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(value / 100);
    };
    
    return (
      <div className="p-3 bg-muted/50 rounded-md mb-3 text-xs">
        <h4 className="font-semibold mb-1 flex items-center gap-1">
          <Info className="h-3.5 w-3.5" />
          Resumo Financeiro {finData.period?.monthName}
        </h4>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div>Receitas: <span className="font-medium text-green-600 dark:text-green-500">{formatCurrency(finData.totals.income)}</span></div>
          <div>Despesas: <span className="font-medium text-red-600 dark:text-red-500">{formatCurrency(finData.totals.expenses)}</span></div>
          <div>Saldo: <span className={`font-medium ${finData.totals.balance >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>{formatCurrency(finData.totals.balance)}</span></div>
          <div>Transações: <span className="font-medium">{finData.totals.transactionCount}</span></div>
          
          {finData.comparison?.differences && (
            <>
              <div className="col-span-2 mt-1 font-semibold text-muted-foreground">Comparado ao mês anterior:</div>
              {finData.comparison?.differences?.income !== undefined && typeof finData.comparison?.differences?.income === 'number' && (
                <div>Receitas: <span className={`font-medium ${finData.comparison?.differences?.income >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>{formatPercentage(finData.comparison?.differences?.income)}</span></div>
              )}
              {finData.comparison?.differences?.expenses !== undefined && typeof finData.comparison?.differences?.expenses === 'number' && (
                <div>Despesas: <span className={`font-medium ${finData.comparison?.differences?.expenses <= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>{formatPercentage(finData.comparison?.differences?.expenses)}</span></div>
              )}
            </>
          )}

          {finData.budgets?.exceeded && finData.budgets?.exceeded.length > 0 && (
            <div className="col-span-2 mt-1 text-red-600 dark:text-red-500">
              <span className="font-semibold">Atenção:</span> {finData.budgets?.exceeded.length} categorias excederam o orçamento
            </div>
          )}
        </div>
      </div>
    );
  };
  
  /**
   * Verifica se a pergunta do usuário é genérica demais para uma resposta personalizada
   * 
   * Esta função analisa o texto da pergunta usando expressões regulares para identificar
   * padrões comuns de perguntas genéricas sobre finanças. O objetivo é identificar perguntas
   * que necessitam de mais contexto ou especificidade para serem respondidas de forma útil.
   * 
   * Padrões detectados incluem:
   * - Perguntas começando com "como posso/faço para..." seguidas de verbos genéricos
   * - Solicitações de listas ("quais são os melhores...")
   * - Pedidos genéricos de ajuda ("me ajude", "preciso de ajuda")
   * - Perguntas sobre o que fazer ("o que devo fazer")
   * - Solicitações de análise genérica ("análise de...")
   * - Perguntas sobre estado atual sem contexto ("como está...")
   * - Menções a meses sem especificar o ano ("em março", "de abril")
   * 
   * @param question Texto da pergunta do usuário
   * @returns true se a pergunta for considerada genérica, false caso contrário
   */
  const isGenericQuestion = (question: string): boolean => {
    const genericPatterns = [
      /^como (posso|eu posso|faço para|fazer para|consigo) (economizar|poupar|guardar|investir|melhorar|organizar)/i,
      /^quais? (são|é|seria|seriam) (os?|as?|meus?|minhas?) (melhores?|principais?|maiores?)/i,
      /^me (ajude|auxilie|dê dicas|mostre|informe)/i,
      /^preciso de (ajuda|auxílio|dicas|conselhos)/i,
      /^o que (devo|deveria|posso|poderia) (fazer|melhorar)/i,
      /^análise (de|dos|das|do|da)/i,
      /^como está/i
    ];
    
    // Detector de menção a mês sem especificar o ano
    const monthPattern = new RegExp(`\\b(${monthNames.join('|')})\\b`, 'i');
    const yearPattern = /\b(20\d{2}|19\d{2})\b/; // Padrão para detectar anos como 2023, 2024, etc.
    
    // Se menciona um mês mas não menciona um ano, considera genérica
    if (monthPattern.test(question) && !yearPattern.test(question)) {
      return true;
    }
    
    return genericPatterns.some(pattern => pattern.test(question));
  };

  // Sugestões contextualmente relevantes
  const getContextualSuggestions = () => {
    if (!finData) return [];
    
    const suggestions = [];
    
    // Utilizar o ano de referência e o mês da data de referência
    const referenceYear = systemReferenceDate.getFullYear();
    const referenceMonth = systemReferenceDate.getMonth() + 1;
    
    const currentYear = finData.period?.year || referenceYear;
    const currentMonthName = finData.period?.monthName || getMonthName(systemReferenceDate.getMonth());
    
    // Sugestões baseadas no status financeiro - tornando-as mais específicas e incluindo sempre o ano
    if (finData.totals && typeof finData.totals?.balance === 'number' && finData.totals.balance < 0) {
      suggestions.push(`Como posso reduzir gastos em ${currentMonthName} de ${currentYear} para equilibrar meu orçamento negativo de ${Math.abs(finData.totals.balance).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}?`);
    }
    
    if (finData.budgets?.exceeded && finData.budgets.exceeded.length > 0) {
      suggestions.push(`Por que excedi o orçamento em ${finData.budgets?.exceeded[0]?.categoryName} em ${currentMonthName} de ${currentYear} e como posso evitar isso no futuro?`);
    }
    
    if (finData.categories && finData.categories.length > 0) {
      const topCategory = finData.categories[0];
      suggestions.push(`Quais foram minhas 3 maiores despesas em ${topCategory?.name} durante ${currentMonthName} de ${currentYear} e como posso reduzi-las?`);
    }
    
    if (finData.comparison && finData.comparison.differences && typeof finData.comparison?.differences?.expenses === 'number' && finData.comparison?.differences?.expenses > 15) {
      suggestions.push(`Por que minhas despesas aumentaram ${finData.comparison?.differences?.expenses.toFixed(1)}% em ${currentMonthName} de ${currentYear} comparado ao mês anterior e em quais categorias?`);
    }
    
    // Sempre incluir algumas sugestões gerais - tornando-as mais específicas e incluindo sempre o ano
    const prevYear = currentYear - 1;
    const generalSuggestions = [
      `Quais foram minhas 3 maiores categorias de gasto em ${currentMonthName} de ${currentYear} e como se comparam a ${currentMonthName} de ${prevYear}?`,
      `Quanto gastei com alimentação em ${currentMonthName} de ${currentYear} comparado à média dos últimos 3 meses?`,
      `Considerando meu padrão de gastos em ${currentYear}, quanto posso economizar por mês para atingir uma reserva de emergência em 6 meses?`,
      `Quais dias da semana tive mais gastos em ${currentMonthName} de ${currentYear} e em quais categorias específicas?`
    ];
    
    // Combinar sugestões específicas com gerais, mas limitar a 3 no total
    return [...suggestions, ...generalSuggestions].slice(0, 3);
  };

  /**
   * Função de exemplo para demonstrar como o assistente deve transformar perguntas em consultas estruturadas
   * 
   * Esta função serve apenas como documentação e guia para entender o fluxo de transformação
   * de perguntas naturais do usuário em consultas estruturadas ao banco de dados.
   * 
   * Os padrões aqui demonstrados são exemplos do tipo de processamento esperado do agente de IA.
   * 
   * @param question Pergunta do usuário em linguagem natural
   * @param context Contexto adicional como mês e ano
   * @returns Objeto representando uma consulta estruturada (simulação)
   */
  const exampleQueryTransformation = (question: string, context: {month?: number, year?: number}) => {
    // Primeiro, validar se a consulta refere-se a um período válido (não futuro)
    const temporalValidation = validateTemporalReference(question);
    if (!temporalValidation.isValid && temporalValidation.hasFuturePeriod) {
      return {
        action: 'REJECT_FUTURE_PERIOD_QUERY',
        params: {
          error: 'future_period',
          mentionedYear: temporalValidation.mentionedYear,
          mentionedMonth: temporalValidation.mentionedMonth,
          errorMessage: temporalValidation.errorMessage,
          currentDate: systemReferenceDate.toISOString() // Usar a data de referência
        }
      };
    }
    
    // Exemplo: "Quanto gastei com alimentação em março comparado à média dos últimos 3 meses?"
    if (/quanto gastei com (.*?) em/i.test(question)) {
      const category = question.match(/quanto gastei com (.*?) em/i)?.[1] || '';
      
      // Verifica novamente se o contexto fornecido não é futuro
      const referenceDate = systemReferenceDate;
      const currentYear = referenceDate.getFullYear();
      const currentMonth = referenceDate.getMonth() + 1;
      
      if (context.year && context.year > currentYear) {
        return {
          action: 'REJECT_FUTURE_PERIOD_QUERY',
          params: {
            error: 'future_year_in_context',
            mentionedYear: context.year,
            currentDate: systemReferenceDate.toISOString() // Usar a data de referência
          }
        };
      }
      
      if (context.year === currentYear && context.month && context.month > currentMonth) {
        return {
          action: 'REJECT_FUTURE_PERIOD_QUERY',
          params: {
            error: 'future_month_in_context',
            mentionedYear: context.year,
            mentionedMonth: context.month,
            currentDate: systemReferenceDate.toISOString() // Usar a data de referência
          }
        };
      }
      
      return {
        action: 'COMPARE_CATEGORY_WITH_AVERAGE',
        params: {
          category: category,
          targetMonth: context.month,
          targetYear: context.year,
          compareWithMonths: 3,
          metrics: ['total', 'average', 'trend', 'dayOfWeekPattern', 'peakDays'],
          includeTransactions: true,
          transactionDetail: 'full',
          transactionLimit: 50,
          includeSubcategories: true,
          includeVendorAnalysis: true,
          includeOutlierAnalysis: true
        }
      };
    }
    
    // Exemplo: "Quanto preciso economizar por mês para atingir uma reserva de emergência em 6 meses?"
    if (/reserva de emergência|economizar por mês/i.test(question)) {
      return {
        action: 'CALCULATE_EMERGENCY_FUND',
        params: {
          targetMonth: context.month,
          targetYear: context.year,
          // Informações que devem vir dos dados financeiros:
          userData: {
            // Esta é a estrutura de dados esperada que o assistente deve usar
            // em vez de pedir estas informações ao usuário
            averageMonthlyExpenses: 5000.00, // Valor exemplo
            monthlyIncome: 8000.00, // Valor exemplo
            monthlySavingCapacity: 3000.00, // Valor exemplo
            currentSavings: 10000.00, // Valor exemplo
            monthsToReachGoal: 6, // Meta típica para reserva de emergência
          },
          // Calcular:
          // 1. Valor da reserva de emergência (3-6x despesas mensais)
          // 2. Quanto já tem guardado (se disponível)
          // 3. Quanto ainda falta guardar
          // 4. Valor mensal para atingir em X meses
          // 5. Se esse valor é possível com base no saldo mensal
          includeDetailedBreakdown: true,
          includeSavingTips: true,
          includeHistoricalDataAnalysis: true,
          calculateMultipleScenarios: true
        }
      };
    }
    
    // Consulta genérica com mais detalhes para demonstração
    return {
      action: 'DETAILED_QUERY',
      params: {
        searchText: question,
        targetMonth: context.month,
        targetYear: context.year,
        includeFullTransactionData: true,
        includeCategoricalBreakdown: true,
        includeTemporalAnalysis: true,
        includeHistoricalTrends: true,
        includePatternDetection: true,
        maxResults: 100,
        sortBy: 'relevance',
        includeRawData: true,
        validateTemporalContext: true  // Flag para garantir validação temporal
      }
    };
  };

  // Componente de seleção de data de referência (opcional)
  const ReferenceDataPicker = () => {
    const [year, setYear] = useState(systemReferenceDate.getFullYear());
    const [month, setMonth] = useState(systemReferenceDate.getMonth());
    const [day, setDay] = useState(systemReferenceDate.getDate());
    
    const handleChangeDate = () => {
      const newDate = new Date(year, month, day);
      updateReferenceDate(newDate);
      setShowDatePicker(false);
    };
    
    return (
      <div className="border p-4 rounded-md mb-4 bg-muted/50">
        <h3 className="font-semibold mb-3">Alterar data de referência do sistema</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="text-sm">Dia</label>
            <select 
              value={day} 
              onChange={(e) => setDay(parseInt(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Mês</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm">Ano</label>
            <select 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-full p-2 border rounded-md"
            >
              {Array.from({length: 10}, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowDatePicker(false)}>Cancelar</Button>
          <Button onClick={handleChangeDate}>Confirmar</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-4 pb-4">
          {/* Botão para mostrar/esconder o seletor de data de referência (opcional) */}
          <div className="flex justify-end mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Alterar data de referência
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Seletor de data de referência */}
          {showDatePicker && <ReferenceDataPicker />}
          
          {/* Exibição da data de referência atual */}
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1 justify-end">
            <span>Data de referência:</span>
            <span className="font-medium">
              {systemReferenceDate.getDate()} de {getMonthName(systemReferenceDate.getMonth())} de {systemReferenceDate.getFullYear()}
            </span>
          </div>
          
          {/* Resumo financeiro no topo */}
          {finData && getFinancialSummary()}
          
          {messages.length === 0 ? (
            <div className="py-4">
              <p className="text-center text-muted-foreground mb-4">
                Olá! Como posso ajudar você com suas finanças hoje?
              </p>
              
              {/* Sugestões de perguntas */}
              <div className="space-y-2">
                {getContextualSuggestions().map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="w-full text-left p-2 rounded-md border text-sm hover:bg-muted transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-4",
                  message.role === 'user' ? "bg-primary-foreground" : "bg-muted"
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={cn(
                    message.role === 'user' ? "bg-primary" : "bg-blue-500"
                  )}>
                    {message.role === 'user' ? 'U' : 'AI'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm overflow-hidden break-words flex-1">
                  <ReactMarkdown 
                    className="prose dark:prose-invert prose-sm max-w-none break-words whitespace-pre-wrap"
                    components={{
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                      li: ({node, ...props}) => <li className="mb-1" {...props} />,
                      code: ({node, ...props}) => <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props} />
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Processando resposta...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-md text-red-800 dark:text-red-400 text-sm">
              Erro: {error}
            </div>
          )}
          
          {/* Elemento invisível para controlar o scroll */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Digite sua mensagem..."
            className="flex-1 min-h-[80px] max-h-[160px] resize-y"
            disabled={loading}
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={loading || !input.trim()}
                  className="self-end"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Enviar mensagem
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </div>
  );
}