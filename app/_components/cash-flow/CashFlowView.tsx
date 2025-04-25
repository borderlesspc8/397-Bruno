"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Button } from "@/app/_components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { DateRange } from 'react-day-picker';
import { addDays, subDays, format, parseISO, isAfter, isBefore, isEqual, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DatePickerWithRange } from "@/app/_components/ui/date-range-picker";
import { Separator } from "@/app/_components/ui/separator";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import { CashFlowSummary, CashFlowPredictionSource, InstallmentStatus } from "@/app/_types/transaction";
import { CalendarIcon, ChevronDownIcon, ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, TrendingDownIcon, AlertCircleIcon, InfoIcon, DollarSignIcon, BarChart2Icon, PieChartIcon, LineChartIcon, CheckIcon } from "lucide-react";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { ScrollArea } from "@/app/_components/ui/scroll-area";

interface CashFlowViewProps {
  walletId?: string;
  initialDateRange?: DateRange;
  initialGroupBy?: 'day' | 'week' | 'month';
  showFilters?: boolean;
}

export function CashFlowView({
  walletId,
  initialDateRange,
  initialGroupBy = 'day',
  showFilters = true
}: CashFlowViewProps) {
  // Estado para filtros e dados
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialDateRange || {
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [groupBy, setGroupBy] = useState<string>(initialGroupBy);
  const [chartType, setChartType] = useState<string>('area');
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalTransactions: 0,
    totalPredictions: 0,
    installments: {
      pending: 0,
      overdue: 0,
      paid: 0,
      canceled: 0,
      totalAmount: 0,
      overdueAmount: 0,
      pendingAmount: 0
    }
  });
  
  // Carregar dados
  useEffect(() => {
    const loadCashFlowData = async () => {
      if (!dateRange || !dateRange.from) return;
      
      setLoading(true);
      
      try {
        const startDate = format(dateRange.from, 'yyyy-MM-dd');
        const endDate = format(dateRange.to || dateRange.from, 'yyyy-MM-dd');
        
        // Construir URL
        const url = new URL('/api/cash-flow', window.location.origin);
        url.searchParams.append('startDate', startDate);
        url.searchParams.append('endDate', endDate);
        url.searchParams.append('groupBy', groupBy);
        
        if (walletId) {
          url.searchParams.append('walletId', walletId);
        }
        
        // Fazer requisição
        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error(`Erro ao buscar dados de fluxo de caixa: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Atualizar estado
        setCashFlowData(prepareChartData(data.cashFlow));
        setSummary(data.summary);
      } catch (error) {
        console.error('Erro ao carregar dados de fluxo de caixa:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCashFlowData();
  }, [dateRange, groupBy, walletId]);
  
  // Preparar dados para gráficos
  const prepareChartData = (data: any[]) => {
    return data.map(item => ({
      ...item,
      // Para formatar a data/período para exibição
      name: formatPeriodForDisplay(item.period, groupBy),
      // Renomear propriedades para o gráfico
      "Entradas Reais": item.totalIncome,
      "Saídas Reais": item.totalExpense,
      "Fluxo Líquido": item.netFlow,
      "Entradas Previstas": item.predictedIncome,
      "Saídas Previstas": item.predictedExpense,
      "Fluxo Previsto": item.predictedNetFlow
    }));
  };
  
  // Formatar período para exibição
  const formatPeriodForDisplay = (period: string, groupBy: string) => {
    if (groupBy === 'month') {
      const [year, month] = period.split('-');
      return `${getMonthName(parseInt(month))}/${year}`;
    } else if (groupBy === 'week') {
      // Formato "2023-W01"
      const [year, weekNum] = period.split('-W');
      return `${weekNum}ª sem/${year}`;
    } else {
      // Formato "2023-01-31"
      return format(parseISO(period), 'dd/MM');
    }
  };
  
  // Obter nome do mês
  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return format(date, 'MMM', { locale: ptBR });
  };
  
  // Formatação de valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Cores para gráficos
  const COLORS = {
    income: "#4CAF50",
    expense: "#F44336",
    netFlow: "#2196F3",
    predIncome: "#8BC34A",
    predExpense: "#FF9800",
    predNetFlow: "#03A9F4"
  };
  
  // Renderizar período rápido
  const handleQuickPeriod = (daysOrPeriod: string) => {
    const today = new Date();
    
    switch (daysOrPeriod) {
      case '7':
        setDateRange({
          from: subDays(today, 6),
          to: today
        });
        break;
      case '30':
        setDateRange({
          from: subDays(today, 29),
          to: today
        });
        break;
      case '90':
        setDateRange({
          from: subDays(today, 89),
          to: today
        });
        break;
      case 'month':
        setDateRange({
          from: startOfMonth(today),
          to: endOfMonth(today)
        });
        break;
      case 'week':
        // Semana começa na segunda-feira
        const startWeek = startOfWeek(today, { weekStartsOn: 1 });
        setDateRange({
          from: startWeek,
          to: endOfWeek(today, { weekStartsOn: 1 })
        });
        break;
      default:
        break;
    }
  };
  
  // Calcular diferença percentual
  const calculatePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };
  
  // Obter total de receitas e despesas
  const totalIncome = cashFlowData.reduce((sum, item) => sum + item["Entradas Reais"], 0);
  const totalExpense = cashFlowData.reduce((sum, item) => sum + item["Saídas Reais"], 0);
  const totalNetFlow = totalIncome - totalExpense;
  const totalPredictedIncome = cashFlowData.reduce((sum, item) => sum + item["Entradas Previstas"], 0);
  const totalPredictedExpense = cashFlowData.reduce((sum, item) => sum + item["Saídas Previstas"], 0);
  const totalPredictedNetFlow = totalPredictedIncome - totalPredictedExpense;
  
  return (
    <div className="space-y-4">
      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>
              Visualize entradas, saídas e previsões para o período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <DatePickerWithRange
                  className="w-full"
                  dateRange={dateRange}
                  onChange={setDateRange}
                />
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriod('7')}
                >
                  7 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriod('30')}
                >
                  30 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPeriod('month')}
                >
                  Mês atual
                </Button>
              </div>
              <div>
                <Select 
                  value={groupBy} 
                  onValueChange={setGroupBy}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Agrupar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Por dia</SelectItem>
                    <SelectItem value="week">Por semana</SelectItem>
                    <SelectItem value="month">Por mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select 
                  value={chartType} 
                  onValueChange={setChartType}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo de gráfico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="area">Área</SelectItem>
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="line">Linha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Receitas Realizadas</CardDescription>
            <CardTitle className="text-green-600 flex items-center">
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <>
                  {formatCurrency(totalIncome)}
                  <ArrowUpIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <>
                  <span className="font-medium">Previsão: </span>
                  {formatCurrency(totalPredictedIncome)}
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Despesas */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Despesas Realizadas</CardDescription>
            <CardTitle className="text-red-600 flex items-center">
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <>
                  {formatCurrency(totalExpense)}
                  <ArrowDownIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <>
                  <span className="font-medium">Previsão: </span>
                  {formatCurrency(totalPredictedExpense)}
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Saldo */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo do Período</CardDescription>
            <CardTitle className={totalNetFlow >= 0 ? "text-blue-600" : "text-red-600"}>
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                formatCurrency(totalNetFlow)
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <>
                  <span className="font-medium">Previsão: </span>
                  {formatCurrency(totalPredictedNetFlow)}
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Parcelas Pendentes */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Parcelas Pendentes</CardDescription>
            <CardTitle className="flex items-center">
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <>
                  {summary.installments.pending} 
                  <span className="text-sm font-normal ml-2">
                    ({formatCurrency(summary.installments.pendingAmount)})
                  </span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {loading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <>
                  <span className="font-medium text-red-500">{summary.installments.overdue} em atraso</span>
                  <span className="ml-2">({formatCurrency(summary.installments.overdueAmount)})</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico e Tabela */}
      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="chart" className="flex items-center">
            <BarChart2Icon className="h-4 w-4 mr-2" />
            Gráfico
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center">
            <DollarSignIcon className="h-4 w-4 mr-2" />
            Tabela
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa - {groupBy === 'day' ? 'Diário' : groupBy === 'week' ? 'Semanal' : 'Mensal'}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "area" ? (
                      <AreaChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Area type="monotone" dataKey="Entradas Reais" stackId="1" stroke={COLORS.income} fill={COLORS.income} fillOpacity={0.3} />
                        <Area type="monotone" dataKey="Saídas Reais" stackId="2" stroke={COLORS.expense} fill={COLORS.expense} fillOpacity={0.3} />
                        <Area type="monotone" dataKey="Fluxo Líquido" stackId="3" stroke={COLORS.netFlow} fill={COLORS.netFlow} fillOpacity={0.3} />
                        <Area type="monotone" dataKey="Entradas Previstas" stackId="4" stroke={COLORS.predIncome} fill={COLORS.predIncome} fillOpacity={0.3} strokeDasharray="5 5" />
                        <Area type="monotone" dataKey="Saídas Previstas" stackId="5" stroke={COLORS.predExpense} fill={COLORS.predExpense} fillOpacity={0.3} strokeDasharray="5 5" />
                      </AreaChart>
                    ) : chartType === "bar" ? (
                      <BarChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Bar dataKey="Entradas Reais" fill={COLORS.income} />
                        <Bar dataKey="Saídas Reais" fill={COLORS.expense} />
                        <Bar dataKey="Fluxo Líquido" fill={COLORS.netFlow} />
                      </BarChart>
                    ) : (
                      <LineChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Line type="monotone" dataKey="Entradas Reais" stroke={COLORS.income} strokeWidth={2} />
                        <Line type="monotone" dataKey="Saídas Reais" stroke={COLORS.expense} strokeWidth={2} />
                        <Line type="monotone" dataKey="Fluxo Líquido" stroke={COLORS.netFlow} strokeWidth={2} />
                        <Line type="monotone" dataKey="Entradas Previstas" stroke={COLORS.predIncome} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="Saídas Previstas" stroke={COLORS.predExpense} strokeDasharray="5 5" />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de Fluxo de Caixa</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Período</TableHead>
                        <TableHead className="text-right">Entradas</TableHead>
                        <TableHead className="text-right">Saídas</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="text-right">Previsões</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cashFlowData.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(item["Entradas Reais"])}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(item["Saídas Reais"])}
                          </TableCell>
                          <TableCell className={`text-right ${item["Fluxo Líquido"] >= 0 ? "text-blue-600" : "text-red-600"}`}>
                            {formatCurrency(item["Fluxo Líquido"])}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-green-600 text-xs">
                                +{formatCurrency(item["Entradas Previstas"])}
                              </span>
                              <span className="text-red-600 text-xs">
                                -{formatCurrency(item["Saídas Previstas"])}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 