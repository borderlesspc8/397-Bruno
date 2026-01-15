"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { DateRangeSelector } from "@/app/_components/dashboard-shared/components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { 
  RefreshCw, 
  Download, 
  FileText, 
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Wallet2
} from "lucide-react";
import { DashboardHeader } from "../_components/DashboardHeader";
import { FinancialMetricsWidgets } from "./components/FinancialMetricsWidgets";
import { CashFlowChart, IncomeCategoryChart, ExpenseCategoryChart, TrendAnalysis, WalletsManager } from "./components";
import { useFinancialDashboard, useCurrencyFormatter } from "./hooks/useFinancialDashboard";
import { DateRange } from "./types";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FinancialDashboardPage() {
  // Estado para controlar o período selecionado
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
  });

  const [activeTab, setActiveTab] = useState("visao-geral");

  // Hook para buscar dados do dashboard
  const { data, loading, error, refetch } = useFinancialDashboard(dateRange);
  const formatCurrency = useCurrencyFormatter();

  const handleDateRangeChange = (startDate: Date, endDate: Date) => {
    setDateRange({ startDate, endDate });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleExport = () => {
    // TODO: Implementar exportação de dados
    console.log("Exportar dados financeiros");
  };

  // Períodos predefinidos
  const quickPeriods = [
    {
      label: "Este mês",
      value: "current-month",
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date())
    },
    {
      label: "Mês passado",
      value: "last-month",
      startDate: startOfMonth(subMonths(new Date(), 1)),
      endDate: endOfMonth(subMonths(new Date(), 1))
    },
    {
      label: "Últimos 3 meses",
      value: "last-3-months",
      startDate: startOfMonth(subMonths(new Date(), 2)),
      endDate: endOfMonth(new Date())
    }
  ];

  const currentPeriodLabel = format(dateRange.startDate, "MMM yyyy", { locale: ptBR }) === 
                           format(dateRange.endDate, "MMM yyyy", { locale: ptBR })
    ? format(dateRange.startDate, "MMMM 'de' yyyy", { locale: ptBR })
    : `${format(dateRange.startDate, "MMM yyyy", { locale: ptBR })} - ${format(dateRange.endDate, "MMM yyyy", { locale: ptBR })}`;

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-200">
              Erro ao carregar dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="text-red-800 border-red-300">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Cabeçalho */}
      <DashboardHeader
        title="Dashboard Financeiro"
        description="Acompanhe suas métricas financeiras, fluxo de caixa e tendências de forma detalhada."
      />

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="capitalize font-medium">{currentPeriodLabel}</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Períodos rápidos */}
          <div className="flex items-center space-x-1">
            {quickPeriods.map((period) => (
              <Button
                key={period.value}
                variant="outline"
                size="sm"
                onClick={() => handleDateRangeChange(period.startDate, period.endDate)}
                className="text-xs"
              >
                {period.label}
              </Button>
            ))}
          </div>

          {/* Seletor de data personalizado */}
          <DateRangeSelector
            dateRange={{
              from: dateRange.startDate,
              to: dateRange.endDate
            }}
            onDateRangeChange={(range) => {
              if (range.from && range.to) {
                handleDateRangeChange(range.from, range.to);
              }
            }}
          />

          {/* Botões de ação */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Conteúdo em abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="fluxo-caixa" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Fluxo de Caixa
          </TabsTrigger>
          <TabsTrigger value="analises" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Análises
          </TabsTrigger>
          <TabsTrigger value="carteiras" className="flex items-center gap-2">
            <Wallet2 className="h-4 w-4" />
            Carteiras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6 mt-6">
          {/* Widgets de métricas */}
          <FinancialMetricsWidgets
            summary={data?.summary || {
              totalBalance: 0,
              totalIncome: 0,
              totalExpenses: 0,
              incomeGrowth: 0,
              expensesGrowth: 0,
              balanceGrowth: 0,
              periodComparison: {
                previousPeriod: { totalBalance: 0, totalIncome: 0, totalExpenses: 0 },
                growthRates: { income: 0, expenses: 0, balance: 0 }
              }
            }}
            loading={loading}
          />

          {/* Gráfico de fluxo de caixa */}
          <CashFlowChart
            data={data?.cashFlow || []}
            loading={loading}
            height={350}
          />

          {/* Resumo rápido de categorias */}
          <div className="grid gap-6 lg:grid-cols-2">
            <IncomeCategoryChart
              data={data?.incomeCategories || []}
              loading={loading}
            />
            <ExpenseCategoryChart
              data={data?.expenseCategories || []}
              loading={loading}
            />
          </div>
        </TabsContent>

        <TabsContent value="categorias" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <IncomeCategoryChart
              data={data?.incomeCategories || []}
              loading={loading}
            />
            <ExpenseCategoryChart
              data={data?.expenseCategories || []}
              loading={loading}
            />
          </div>
          
          {/* Tabela detalhada de categorias */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.incomeCategories.map((category, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(category.value)}</p>
                        <p className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data?.expenseCategories.map((category, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(category.value)}</p>
                        <p className="text-sm text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fluxo-caixa" className="space-y-6 mt-6">
          <CashFlowChart
            data={data?.cashFlow || []}
            loading={loading}
            height={450}
            showLegend={true}
            showGrid={true}
          />

          {/* Estatísticas do fluxo de caixa */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maior Entrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(
                    Math.max(...(data?.cashFlow.map(item => item.income) || [0]))
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Maior Saída
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(
                    Math.max(...(data?.cashFlow.map(item => item.expenses) || [0]))
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Saldo Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(
                    (data?.cashFlow.reduce((sum, item) => sum + item.balance, 0) || 0) / 
                    Math.max(data?.cashFlow.length || 1, 1)
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analises" className="space-y-6 mt-6">
          <TrendAnalysis
            metrics={data?.metrics || {
              profitMargin: 0,
              burnRate: 0,
              averageTicket: 0,
              conversionRate: 0,
              customerAcquisitionCost: 0,
              lifeTimeValue: 0
            }}
            wallets={data?.wallets || []}
            summary={data?.summary || {
              totalBalance: 0,
              totalIncome: 0,
              totalExpenses: 0,
              incomeGrowth: 0,
              expensesGrowth: 0,
              balanceGrowth: 0,
              periodComparison: {
                previousPeriod: { totalBalance: 0, totalIncome: 0, totalExpenses: 0 },
                growthRates: { income: 0, expenses: 0, balance: 0 }
              }
            }}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="carteiras" className="space-y-6 mt-6">
          <WalletsManager
            wallets={data?.wallets || []}
            loading={loading}
            onRefresh={refetch}
            dateRange={dateRange}
          />
        </TabsContent>
      </Tabs>

      {/* Rodapé com informações */}
      {data && !loading && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                Última atualização: {new Date(data.lastUpdated).toLocaleString('pt-BR')}
              </span>
              <span>
                {data.wallets.length} carteiras • {data.cashFlow.length} registros
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}