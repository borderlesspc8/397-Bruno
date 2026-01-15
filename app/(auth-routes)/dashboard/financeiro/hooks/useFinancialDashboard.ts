"use client";

import { useState, useEffect, useCallback } from 'react';
import { FinancialDashboardData, DateRange } from '../types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface UseFinancialDashboardReturn {
  data: FinancialDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function useFinancialDashboard(
  dateRange?: DateRange
): UseFinancialDashboardReturn {
  const [data, setData] = useState<FinancialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Definir período padrão como mês atual se não especificado
  const defaultDateRange = {
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  };

  const currentRange = dateRange || defaultDateRange;

  const fetchFinancialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = format(currentRange.startDate, 'yyyy-MM-dd');
      const endDate = format(currentRange.endDate, 'yyyy-MM-dd');

      // Buscar dados de diferentes APIs em paralelo
      let cashFlowData = null;
      let walletsData: any = null;

      try {
        const cashFlowResponse = await fetch(
          `/api/cash-flow?startDate=${startDate}&endDate=${endDate}&groupBy=day`,
          { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
          }
        );

        if (cashFlowResponse.ok) {
          cashFlowData = await cashFlowResponse.json();
        }
      } catch (err) {
        console.warn('Erro ao buscar fluxo de caixa, usando dados simulados:', err);
        cashFlowData = null;
      }

      try {
        const walletsResponse = await fetch(
          `/api/wallets?startDate=${startDate}&endDate=${endDate}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
          }
        );

        if (walletsResponse.ok) {
          walletsData = await walletsResponse.json();
        }
      } catch (err) {
        console.warn('Erro ao buscar carteiras, usando dados vazios:', err);
        walletsData = { data: [] };
      }

      // Gerar dados simulados se as APIs falharem
      const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      };

      const generateMockCashFlow = () => {
        const days = getDaysInMonth(currentRange.startDate);
        const mockData = [];
        let balance = 50000;

        for (let i = 1; i <= days; i++) {
          const date = new Date(currentRange.startDate);
          date.setDate(i);
          
          const income = Math.random() > 0.3 ? Math.floor(Math.random() * 10000) + 1000 : 0;
          const expenses = Math.floor(Math.random() * 5000) + 500;
          balance += income - expenses;

          mockData.push({
            date: date.toISOString().split('T')[0],
            income,
            expenses,
            balance: Math.max(0, balance)
          });
        }
        return mockData;
      };

      // Processar dados do fluxo de caixa
      const processedCashFlow = !cashFlowData || !cashFlowData.data
        ? generateMockCashFlow()
        : (cashFlowData.data || []).map((item: any) => ({
            date: item.date,
            income: item.income || 0,
            expenses: Math.abs(item.expenses || 0),
            balance: item.balance || 0,
          }));

      // Calcular totais
      const walletTotals = walletsData?.totals;

      const processedWallets = (walletsData?.data || []).map((wallet: any) => ({
        walletId: wallet.id,
        walletName: wallet.name,
        balance: wallet.balance || 0,
        computedBalance: wallet.computedBalance ?? wallet.balance ?? 0,
        currency: 'BRL',
        lastUpdate: wallet.updatedAt || wallet.lastTransactionAt || new Date().toISOString(),
        lastSync: wallet.lastSync,
        trend: [],
        autoBalance: wallet.autoBalance,
        bank: wallet.bank,
        totalTransactions: wallet.totalTransactions,
      }));

      const walletIncome = walletTotals?.income ?? processedWallets.reduce((sum: number, wallet: any) => sum + (wallet.autoBalance?.income || 0), 0);
      const walletExpenses = walletTotals?.expenses ?? processedWallets.reduce((sum: number, wallet: any) => sum + (wallet.autoBalance?.expenses || 0), 0);
      const walletComputedBalance = walletTotals?.computedBalance ?? processedWallets.reduce((sum: number, wallet: any) => sum + (wallet.computedBalance ?? wallet.balance ?? 0), 0);
      const walletNet = walletTotals?.net ?? (walletIncome - walletExpenses);

      const cashFlowIncome = processedCashFlow.reduce((sum: number, item: any) => sum + item.income, 0);
      const cashFlowExpenses = processedCashFlow.reduce((sum: number, item: any) => sum + item.expenses, 0);
      const cashFlowBalance = cashFlowIncome - cashFlowExpenses;

      const hasWalletData = processedWallets.length > 0;
      const totalIncome = hasWalletData ? walletIncome : cashFlowIncome;
      const totalExpenses = hasWalletData ? walletExpenses : cashFlowExpenses;
      const totalBalance = hasWalletData ? (walletComputedBalance ?? walletNet) : cashFlowBalance;

      const daysInRange = Math.max(
        Math.ceil((currentRange.endDate.getTime() - currentRange.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        1
      );

      // Dados simulados para categorias (TODO: Implementar busca real)
      const incomeCategories = [
        { name: 'Vendas', value: totalIncome * 0.7, percentage: 70, color: '#10B981' },
        { name: 'Serviços', value: totalIncome * 0.2, percentage: 20, color: '#3B82F6' },
        { name: 'Outros', value: totalIncome * 0.1, percentage: 10, color: '#8B5CF6' },
      ];

      const expenseCategories = [
        { name: 'Operacionais', value: totalExpenses * 0.4, percentage: 40, color: '#EF4444' },
        { name: 'Pessoal', value: totalExpenses * 0.3, percentage: 30, color: '#F59E0B' },
        { name: 'Marketing', value: totalExpenses * 0.15, percentage: 15, color: '#EC4899' },
        { name: 'Administrativas', value: totalExpenses * 0.15, percentage: 15, color: '#6B7280' },
      ];

      // Métricas calculadas
      const profitMargin = totalIncome > 0 ? (totalBalance / totalIncome) * 100 : 0;
      const burnRate = totalExpenses / daysInRange; // Gasto médio diário no período

      const dashboardData: FinancialDashboardData = {
        summary: {
          totalBalance,
          totalIncome,
          totalExpenses,
          incomeGrowth: 0, // TODO: Calcular crescimento real
          expensesGrowth: 0, // TODO: Calcular crescimento real
          balanceGrowth: 0, // TODO: Calcular crescimento real
          periodComparison: {
            previousPeriod: {
              totalBalance: 0,
              totalIncome: 0,
              totalExpenses: 0,
            },
            growthRates: {
              income: 0,
              expenses: 0,
              balance: 0,
            },
          },
        },
        cashFlow: processedCashFlow,
        incomeCategories,
        expenseCategories,
        metrics: {
          profitMargin,
          burnRate,
          averageTicket: totalIncome > 0 ? totalIncome / processedCashFlow.length : 0,
          conversionRate: 0, // TODO: Implementar
          customerAcquisitionCost: 0, // TODO: Implementar
          lifeTimeValue: 0, // TODO: Implementar
        },
        wallets: processedWallets,
        lastUpdated: new Date().toISOString(),
      };

      setData(dashboardData);
    } catch (err) {
      console.error('Erro ao buscar dados financeiros:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [currentRange.startDate, currentRange.endDate]);

  useEffect(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  const refetch = useCallback(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Hook utilitário para formatação de moeda
export function useCurrencyFormatter() {
  return useCallback((value: number) => {
    return formatCurrency(value);
  }, []);
}