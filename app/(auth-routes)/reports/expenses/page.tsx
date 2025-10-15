'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  LineChart as RechartLineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Button } from "@/app/_components/ui/button";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Badge } from "@/app/_components/ui/badge";

import { PageTitle } from '@/app/_components/page-title';
import { formatCurrency } from '@/app/_lib/formatters';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/_components/ui/table';
import { ScrollArea } from '@/app/_components/ui/scroll-area';

// Interfaces de tipos
interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color?: string;
  icon?: string;
}

interface MonthlyData {
  month: string;
  monthName: string;
  total: number;
  categories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

interface Transaction {
  id: string;
  amount: number;
  category: string | null;
  categoryObj?: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  date: string;
  description?: string;
}

interface ExpenseReport {
  period?: number;
  month?: string;
  totalExpense: number;
  monthlyExpenses?: MonthlyData[];
  categoryBreakdown: CategoryData[];
  transactions: Transaction[];
}

// Função para formatar nomes de meses
const formatMonthName = (monthStr: string) => {
  if (!monthStr) return '';
  
  try {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    
    return format(date, 'MMMM yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar nome do mês:', monthStr, error);
    return monthStr;
  }
};

// Cores para o gráfico de pizza
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#8DD1E1', '#A4DE6C', '#D0ED57',
  '#F5A623', '#FF6B6B', '#54A0FF', '#5E60CE', '#48BFE3',
];

export default function ExpensesReport() {
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<ExpenseReport | null>(null);
  const [period, setPeriod] = useState('6');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');

  // Carregar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fazer requisição à API
        const response = await fetch(`/api/reports/expenses?period=${period}`);
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados de despesas');
        }
        
        const data = await response.json();
        setExpenseData(data);
        
        // Extrair meses disponíveis
        if (data.monthlyExpenses && data.monthlyExpenses.length > 0) {
          const months = data.monthlyExpenses.map((item: MonthlyData) => item.month);
          setAvailableMonths(months);
          
          // Selecionar o mês mais recente por padrão
          setSelectedMonth(months[months.length - 1]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period]);

  // Buscar dados de um mês específico
  const fetchMonthDetails = async (month: string) => {
    if (!month) return;
    
    try {
      setLoading(true);
      setViewMode('details');
      
      const response = await fetch(`/api/reports/expenses?month=${month}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar detalhes do mês');
      }
      
      const data = await response.json();
      setExpenseData(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do mês:', error);
    } finally {
      setLoading(false);
    }
  };

  // Voltar para visão geral
  const backToOverview = async () => {
    try {
      setLoading(true);
      setViewMode('overview');
      
      const response = await fetch(`/api/reports/expenses?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar visão geral');
      }
      
      const data = await response.json();
      setExpenseData(data);
    } catch (error) {
      console.error('Erro ao carregar visão geral:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dados para o gráfico de barras
  const getBarChartData = () => {
    if (!expenseData) return [];
    
    if (viewMode === 'details') {
      return expenseData.categoryBreakdown.map((category) => ({
        name: category.category,
        value: category.amount,
      })).sort((a, b) => b.value - a.value);
    } else {
      return expenseData.monthlyExpenses?.map((month) => ({
        name: format(new Date(month.month + '-01'), 'MMM yy', { locale: ptBR }),
        value: month.total,
        month: month.month,
      })) || [];
    }
  };

  // Dados para o gráfico de linha mensal
  const getMonthlyTrendData = () => {
    if (!expenseData || !expenseData.monthlyExpenses) return [];
    
    return expenseData.monthlyExpenses.map((month) => ({
      name: format(new Date(month.month + '-01'), 'MMM yy', { locale: ptBR }),
      despesas: month.total,
    }));
  };

  // Dados para o gráfico de pizza
  const getPieChartData = () => {
    if (!expenseData) return [];
    
    return expenseData.categoryBreakdown
      .filter(cat => cat.percentage >= 1) // Filtrar categorias com pelo menos 1%
      .map((category) => ({
        name: category.category,
        value: category.amount,
        percentage: category.percentage,
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Renderizar tela de carregamento
  if (loading) {
    return (
      <div className="container py-6 space-y-6">
        <PageTitle 
          title="Relatório de Despesas"
          description="Análise detalhada de suas despesas"
          backButton={{ href: "/dashboard", label: "Voltar para o Dashboard" }}
        />
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <PageTitle 
        title="Relatório de Despesas"
        description="Análise detalhada de suas despesas"
        backButton={{ href: "/dashboard", label: "Voltar para o Dashboard" }}
      />
      
      {/* Controles e filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {viewMode === 'overview' 
              ? 'Visão Geral de Despesas' 
              : `Detalhes de ${formatMonthName(selectedMonth || '')}`}
          </CardTitle>
          <CardDescription>
            {viewMode === 'overview'
              ? `Total de despesas nos últimos ${period} meses: ${formatCurrency(expenseData?.totalExpense || 0)}`
              : `Total de despesas: ${formatCurrency(expenseData?.totalExpense || 0)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
            {viewMode === 'overview' ? (
              <>
                <div className="w-full sm:w-48">
                  <Select
                    value={period}
                    onValueChange={(value: string) => setPeriod(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Últimos 3 meses</SelectItem>
                      <SelectItem value="6">Últimos 6 meses</SelectItem>
                      <SelectItem value="12">Último ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-48">
                  <Select
                    value={selectedMonth || ''}
                    onValueChange={(value: string) => setSelectedMonth(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMonths.map((month) => (
                        <SelectItem key={month} value={month}>
                          {formatMonthName(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  variant="secondary"
                  onClick={() => selectedMonth && fetchMonthDetails(selectedMonth)}
                  disabled={!selectedMonth}
                >
                  Ver Detalhes
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={backToOverview}>
                Voltar para Visão Geral
              </Button>
            )}
            
            <div className="ml-auto">
              <Tabs defaultValue={chartType} onValueChange={(v: string) => setChartType(v as 'bar' | 'pie' | 'line')}>
                <TabsList>
                  <TabsTrigger value="bar">Barras</TabsTrigger>
                  <TabsTrigger value="pie">Pizza</TabsTrigger>
                  <TabsTrigger value="line">Linha</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {/* Gráfico principal */}
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart
                  data={getBarChartData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Valor']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6" 
                    name="Despesas"
                    onClick={(data) => {
                      if (viewMode === 'overview' && data.month) {
                        fetchMonthDetails(data.month);
                      }
                    }}
                    cursor={viewMode === 'overview' ? 'pointer' : undefined}
                  />
                </BarChart>
              ) : chartType === 'pie' ? (
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              ) : (
                <RechartLineChart
                  data={viewMode === 'overview' ? getMonthlyTrendData() : []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Valor']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="despesas" 
                    stroke="#3b82f6" 
                    name="Despesas mensais"
                    activeDot={{ r: 8 }}
                  />
                </RechartLineChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Detalhes por categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
            <CardDescription>
              {viewMode === 'overview' 
                ? `Total em ${expenseData?.monthlyExpenses?.length || 0} meses` 
                : formatMonthName(expenseData?.month || '')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-4">
                {expenseData?.categoryBreakdown.map((category, index) => (
                  <div key={`category-${index}`} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{category.category}</span>
                      </div>
                      <Badge variant="secondary">
                        {category.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{formatCurrency(category.amount)}</span>
                      <span className="text-muted-foreground">
                        {viewMode === 'details' 
                          ? `${Math.round(category.percentage)}% do total` 
                          : `de ${formatCurrency(expenseData.totalExpense)}`}
                      </span>
                    </div>
                    <div 
                      className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden"
                    >
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${category.percentage}%`,
                          backgroundColor: category.color || COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Lista de transações ou mensais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {viewMode === 'details' ? 'Transações do Mês' : 'Resumo Mensal'}
            </CardTitle>
            <CardDescription>
              {viewMode === 'details' 
                ? `${expenseData?.transactions.length || 0} transações em ${formatMonthName(expenseData?.month || '')}` 
                : 'Valores mensais totais'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px]">
              {viewMode === 'details' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseData?.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {format(new Date(tx.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{tx.description || '-'}</TableCell>
                        <TableCell>{tx.categoryObj?.name || tx.category || 'Sem categoria'}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {(expenseData?.transactions.length || 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Nenhuma transação encontrada neste período
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês</TableHead>
                      <TableHead>Maior categoria</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenseData?.monthlyExpenses?.map((month) => (
                      <TableRow 
                        key={month.month}
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => fetchMonthDetails(month.month)}
                      >
                        <TableCell className="font-medium">
                          {formatMonthName(month.month)}
                        </TableCell>
                        <TableCell>
                          {month.categories[0]?.category || 'Sem dados'}
                          {month.categories[0] && (
                            <span className="ml-2 text-muted-foreground text-xs">
                              {month.categories[0].percentage.toFixed(0)}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(month.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {(expenseData?.monthlyExpenses?.length || 0) === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          Nenhum mês com despesas registradas
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Links para outros relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outros Relatórios</CardTitle>
          <CardDescription>Visualize seus dados financeiros de diferentes perspectivas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Link href="/reports/categories">
              <Button variant="outline" className="w-full">Relatório por Categorias</Button>
            </Link>
            <Link href="/reports/comparison">
              <Button variant="outline" className="w-full">Comparação Mensal</Button>
            </Link>
            <Link href="/reports/distribution">
              <Button variant="outline" className="w-full">Distribuição de Gastos</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
