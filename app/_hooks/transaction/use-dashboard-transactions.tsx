"use client";

import { useMemo } from 'react';
import { useTransactionContext } from './use-transaction-context';
import { TransactionType } from '@/app/_types/transaction';
import { startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DashboardTransactionsReturn, CATEGORY_COLORS } from './types';

// Utilitário para formatar valor monetário
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
}

/**
 * Hook para processar transações para o dashboard
 * @param monthParam Mês para filtrar (1-12)
 * @param yearParam Ano para filtrar
 * @returns Dados processados para o dashboard
 */
export function useDashboardTransactions(
  monthParam: number = new Date().getMonth() + 1,
  yearParam: number = new Date().getFullYear()
): DashboardTransactionsReturn {
  // Obter dados do contexto de transações
  const { transactions, isLoading, error } = useTransactionContext();

  // Calcular os dados do dashboard com base nas transações filtradas
  const dashboardData = useMemo(() => {
    // Destilar valores padrão
    const defaultMonth = new Date().getMonth() + 1;
    const defaultYear = new Date().getFullYear();
    
    // Usar valores padrão se não forem fornecidos
    const safeMonth = monthParam || defaultMonth;
    const safeYear = yearParam || defaultYear;

    // Validar os valores de mês e ano
    let formattedMonth, formattedYear;
    let isDateValid = true;
    
    try {
      // Verificar se o mês está no intervalo válido (1-12)
      if (safeMonth < 1 || safeMonth > 12) {
        console.error(`Mês inválido: ${safeMonth}. Usando mês atual.`);
        formattedMonth = defaultMonth;
        isDateValid = false;
      } else {
        formattedMonth = safeMonth;
      }
      
      // Verificar se o ano é um número positivo
      if (safeYear < 1970 || safeYear > 2100) {
        console.error(`Ano inválido: ${safeYear}. Usando ano atual.`);
        formattedYear = defaultYear;
        isDateValid = false;
      } else {
        formattedYear = safeYear;
      }
    } catch (e) {
      console.error('Erro ao validar data:', e);
      formattedMonth = defaultMonth;
      formattedYear = defaultYear;
      isDateValid = false;
    }
    
    // Período formatado para logs e depuração
    console.debug(`[Dashboard] Processando período: ${formattedMonth}/${formattedYear}`);
    
    // Se estiver carregando ou houver erro, retornar estado inicial
    if (isLoading) {
      console.debug('[Dashboard] Estado de carregamento, retornando dados vazios');
      return {
        loading: isLoading,
        error: null,
        formatCurrency,
        totalIncome: 0,
        totalExpenses: 0, 
        balance: 0,
        incomeCount: 0,
        expenseCount: 0,
        transactionCount: 0,
        expensesByCategory: [],
        recentTransactions: [],
        filteredTransactions: [],
        period: {
          month: formattedMonth,
          year: formattedYear,
          formatted: format(new Date(formattedYear, formattedMonth - 1), 'MMMM yyyy', { locale: ptBR })
        }
      };
    }
    
    if (error) {
      console.debug('[Dashboard] Erro detectado, retornando dados vazios:', error);
      return {
        loading: false,
        error,
        formatCurrency,
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        incomeCount: 0,
        expenseCount: 0,
        transactionCount: 0,
        expensesByCategory: [],
        recentTransactions: [],
        filteredTransactions: [],
        period: {
          month: formattedMonth,
          year: formattedYear,
          formatted: format(new Date(formattedYear, formattedMonth - 1), 'MMMM yyyy', { locale: ptBR })
        }
      };
    }
    
    // Garantir que transactions seja sempre um array
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    console.debug(`[Dashboard] Total de transações disponíveis: ${safeTransactions.length}`);
    
    // Inspecionar formato das transações para diagnóstico (amostra de até 2 transações)
    if (safeTransactions.length > 0) {
      const sampleTransaction = safeTransactions[0];
      console.debug('[Dashboard] Inspecionando formato de transação:', {
        id: sampleTransaction.id,
        name: sampleTransaction.name,
        amount: sampleTransaction.amount,
        date: sampleTransaction.date,
        dateType: typeof sampleTransaction.date,
        type: sampleTransaction.type,
        category: sampleTransaction.category
      });
      
      // Tenta converter a data para vários formatos para diagnóstico
      if (sampleTransaction.date) {
        console.debug('[Dashboard] Tentativas de parse de data:', {
          directDate: new Date(sampleTransaction.date),
          isoString: new Date(sampleTransaction.date).toISOString(),
          getTime: new Date(sampleTransaction.date).getTime(),
          getMonth: new Date(sampleTransaction.date).getMonth() + 1,
          getFullYear: new Date(sampleTransaction.date).getFullYear()
        });
      }
    }
    
    // Função auxiliar para normalizar data
    const normalizeDate = (dateValue: any): Date | null => {
      if (!dateValue) return null;
      
      try {
        // Se já for um objeto Date
        if (dateValue instanceof Date) {
          return isNaN(dateValue.getTime()) ? null : dateValue;
        }
        
        // Se for uma string ISO
        if (typeof dateValue === 'string') {
          // Primeiro: tentar formato padrão ISO
          let date = new Date(dateValue);
          
          // Se falhar, tentar vários formatos comuns
          if (isNaN(date.getTime())) {
            // Verificar se a string tem formato dd/mm/yyyy ou mm/dd/yyyy
            const dateParts = dateValue.split(/[\/\-\.]/);
            if (dateParts.length === 3) {
              // Se parece ser formato brasileiro (dia/mês/ano)
              if (dateParts[0].length <= 2 && dateParts[1].length <= 2) {
                date = new Date(
                  parseInt(dateParts[2], 10), 
                  parseInt(dateParts[1], 10) - 1, 
                  parseInt(dateParts[0], 10)
                );
              }
              
              // Se parece ser formato americano (mês/dia/ano)
              if (dateParts[0].length <= 2 && dateParts[1].length <= 2) {
                const alternativeDate = new Date(
                  parseInt(dateParts[2], 10), 
                  parseInt(dateParts[0], 10) - 1, 
                  parseInt(dateParts[1], 10)
                );
                
                if (!isNaN(alternativeDate.getTime())) {
                  date = alternativeDate;
                }
              }
            }
            
            // Tratar caso do JSON.stringify em objetos Date
            if (isNaN(date.getTime()) && dateValue.includes('T')) {
              date = new Date(dateValue.split('T')[0]);
            }
          }
          
          return isNaN(date.getTime()) ? null : date;
        }
        
        // Se for um timestamp numérico
        if (typeof dateValue === 'number') {
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date;
        }
        
        // Se for um objeto com propriedades de data (como do Prisma)
        if (dateValue && typeof dateValue === 'object') {
          // Tentar converter para string ISO primeiro
          if (dateValue.toISOString) {
            return dateValue;
          }
          
          // Tentar acessar campos do objeto date do Prisma
          if (dateValue.toJSON) {
            const jsonDate = dateValue.toJSON();
            if (typeof jsonDate === 'string') {
              const date = new Date(jsonDate);
              return isNaN(date.getTime()) ? null : date;
            }
          }
          
          // Verificar propriedades comuns de data do Prisma
          const year = dateValue.year || dateValue.getFullYear?.();
          const month = (dateValue.month || dateValue.getMonth?.()) - 1;
          const day = dateValue.day || dateValue.getDate?.();
          
          if (year && month >= 0 && day) {
            const date = new Date(year, month, day);
            return isNaN(date.getTime()) ? null : date;
          }
        }
        
        return null;
      } catch (error) {
        console.error('[Dashboard] Erro ao normalizar data:', error, dateValue);
        return null;
      }
    };
    
    // Filtrando transações pelo mês e ano selecionados
    const filteredTransactions = safeTransactions.filter(tx => {
      try {
        if (!tx || !tx.date) {
          console.debug(`[Dashboard] Transação descartada: sem data`, tx);
          return false;
        }
        
        // Criar objeto Date a partir da data da transação
        const txDate = normalizeDate(tx.date);
        
        // Verificar se a data é válida
        if (txDate === null) {
          console.debug(`[Dashboard] Transação descartada: data inválida`, tx.date);
          return false;
        }
        
        // Criar início e fim do mês para comparação mais segura (considerando todas as datas do mês)
        const startDate = startOfMonth(new Date(formattedYear, formattedMonth - 1));
        const endDate = endOfMonth(new Date(formattedYear, formattedMonth - 1));
        
        // Verificar se a data da transação está dentro do intervalo do mês
        const isInMonth = isWithinInterval(txDate, { start: startDate, end: endDate });
        
        if (!isInMonth) {
          console.debug(
            `[Dashboard] Transação ${tx.id} descartada: fora do período.`,
            `Data: ${txDate.toISOString()}, Mês: ${formattedMonth}, Ano: ${formattedYear}`,
            `Intervalo: ${startDate.toISOString()} - ${endDate.toISOString()}`
          );
        } else {
          console.debug(
            `[Dashboard] Transação ${tx.id} aceita:`,
            `Data: ${txDate.toISOString()}, Mês: ${formattedMonth}, Ano: ${formattedYear}`
          );
        }
        
        return isInMonth;
      } catch (e) {
        console.error('Erro ao processar transação:', e, tx);
        // Em caso de erro, não incluir a transação
        return false;
      }
    });

    const incomeTransactions = Array.isArray(filteredTransactions)
      ? filteredTransactions.filter(tx => tx && tx.type === "DEPOSIT")
      : [];
      
    const expenseTransactions = Array.isArray(filteredTransactions)
      ? filteredTransactions.filter(tx => tx && tx.type === "EXPENSE")
      : [];
    
    // Calculando os totais com verificações de segurança
    const totalIncome = incomeTransactions.reduce((acc, tx) => {
      if (!tx || typeof tx.amount !== 'number' || isNaN(tx.amount)) {
        return acc;
      }
      return acc + tx.amount;
    }, 0);
    
    const totalExpenses = expenseTransactions.reduce((acc, tx) => {
      if (!tx || typeof tx.amount !== 'number' || isNaN(tx.amount)) {
        return acc;
      }
      return acc + tx.amount;
    }, 0);
    
    const balance = totalIncome - totalExpenses;
  
    // Agrupando despesas por categoria
    const expensesByCategory = Array.isArray(expenseTransactions)
      ? expenseTransactions.reduce((acc, tx) => {
          if (!tx || !tx.category) return acc;
          
          const categoryName = tx.category || 'Sem categoria';
          if (!acc[categoryName]) {
            acc[categoryName] = 0;
          }
          
          // Verificar se o valor é um número válido
          if (typeof tx.amount === 'number' && !isNaN(tx.amount)) {
            acc[categoryName] += tx.amount;
          }
          
          return acc;
        }, {} as Record<string, number>)
      : {};
    
    // Convertendo para o formato final com porcentagens e cores
    const expensesCategories = Object.entries(expensesByCategory).map(([name, amount]) => {
      // Calcular a porcentagem apenas se totalExpenses for maior que zero
      const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
      
      // Determinar a cor da categoria (usando a cor definida ou uma cor padrão)
      const color = CATEGORY_COLORS[name] || CATEGORY_COLORS.DEFAULT;
      
      return {
        category: name,
        amount,
        percentage: Number(percentage.toFixed(2)),
        color
      };
    });
    
    // Ordenar por valor (do maior para o menor)
    expensesCategories.sort((a, b) => b.amount - a.amount);
    
    // Limitar para as 5 transações mais recentes
    const recentTransactions = Array.isArray(filteredTransactions)
      ? [...filteredTransactions]
          .filter(tx => {
            // Garantir que a transação e a data existam
            const hasValidDate = tx && normalizeDate(tx.date) !== null;
            if (!hasValidDate) {
              console.debug(`[Dashboard] Transação recente descartada: data inválida`, tx);
            }
            return hasValidDate;
          })
          .sort((a, b) => {
            try {
              const dateA = normalizeDate(a.date);
              const dateB = normalizeDate(b.date);
              
              // Verificar se as datas são válidas
              if (!dateA || !dateB) {
                console.debug(`[Dashboard] Problema ao ordenar: datas inválidas`, 
                  { dateA: a.date, dateB: b.date });
                return 0;
              }
              
              return dateB.getTime() - dateA.getTime();
            } catch (error) {
              console.error('Erro ao ordenar transações:', error);
              return 0;
            }
          })
          .slice(0, 5)
      : [];

    console.debug(`[Dashboard] Transações filtradas: ${filteredTransactions.length}`);
    console.debug(`[Dashboard] Despesas: ${totalExpenses}, Receitas: ${totalIncome}`);
    
    return {
      loading: false,
      error: null,
      formatCurrency,
      totalIncome,
      totalExpenses,
      balance,
      incomeCount: incomeTransactions.length,
      expenseCount: expenseTransactions.length,
      transactionCount: filteredTransactions.length,
      expensesByCategory: expensesCategories,
      recentTransactions,
      filteredTransactions,
      period: {
        month: formattedMonth,
        year: formattedYear,
        formatted: format(new Date(formattedYear, formattedMonth - 1), 'MMMM yyyy', { locale: ptBR })
      }
    };
  }, [monthParam, yearParam, transactions, isLoading, error]);
  
  return dashboardData;
}

// Função auxiliar para calcular despesas por categoria
function calculateExpensesByCategory(
  expenseTransactions: any[],
  totalExpenses: number
) {
  // Agrupando despesas por categoria
  const categoriesMap = new Map<string, number>();
  
  expenseTransactions.forEach(tx => {
    const category = tx.category || "Outros";
    const currentAmount = categoriesMap.get(category) || 0;
    categoriesMap.set(category, currentAmount + tx.amount);
  });
  
  // Convertendo para array e calculando percentuais
  const expensesByCategory = Array.from(categoriesMap.entries()).map(([category, amount]) => {
    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
    return {
      category,
      amount,
      percentage,
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.DEFAULT
    };
  });
  
  // Ordenando por valor (maior para menor)
  return expensesByCategory.sort((a, b) => b.amount - a.amount);
} 